# BookVerse: Scalable Digital Library Management System

A DevOps-oriented digital library where students search, browse, download and request books, and administrators manage the catalogue. The application is containerized with Docker, runs as a full stack with Docker Compose, and is built, tested and packaged by a GitHub Actions pipeline. Kubernetes deployment on Minikube is the planned next phase.

**Project 2026**

Live demo: https://digital-library-system-jet.vercel.app

---

## Project status

| Area | Status |
| --- | --- |
| Student and admin application (React + FastAPI + MySQL) | Done |
| JWT authentication and role-based access | Done |
| Docker images and Docker Compose | Done |
| CI pipeline: lint, test, build, push to Docker Hub | Done |
| Kubernetes on Minikube (manifests, probes, self-healing) | Planned, next phase |
| Horizontal Pod Autoscaler | Planned, next phase |
| Automatic deploy from CI to the cluster | Planned, future scope |

## Contents

1. [Features](#features)
2. [Tech stack](#tech-stack)
3. [Architecture](#architecture)
4. [Repository structure](#repository-structure)
5. [Run with Docker Compose](#run-with-docker-compose)
6. [Configuration and secrets](#configuration-and-secrets)
7. [CI/CD pipeline](#cicd-pipeline)
8. [Kubernetes plan](#kubernetes-plan)
9. [API overview](#api-overview)
10. [Testing](#testing)
11. [Git workflow](#git-workflow)
12. [Future scope](#future-scope)

---

## Features

**Students**

- Register and log in (JWT authentication)
- Search books by title or author, filter by category, sort, and paginate
- View book details and download PDFs
- Add and remove favorites
- See personal download history
- Request a book that is not in the catalogue and track its status (pending, approved, rejected)
- Home page with Recently Added and Most Downloaded rows

**Administrators**

- Add books with a PDF upload and cover image URL, and delete books
- Add and delete categories
- List and delete users (an admin cannot delete themselves)
- Request Inbox: review requests with requester details and approve or reject them

**Platform**

- Every component runs in its own container
- The whole stack starts with one `docker compose up`
- Lint, test, build and image push automated with GitHub Actions
- Configuration and secrets passed through environment variables, never hard-coded

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React (Vite), React Router, Axios |
| Backend | Python 3.11, FastAPI, SQLAlchemy, PyMySQL |
| Database | MySQL 8.0 |
| Authentication | JWT (Bearer token), passlib/bcrypt |
| Containerization | Docker, Docker Compose |
| CI/CD | GitHub Actions, Docker Hub |
| Testing and linting | pytest, ruff (backend), ESLint (frontend) |
| Planned | Kubernetes (Minikube), ConfigMaps, Secrets, HPA |

## Architecture

```
                 Docker Compose network
        +------------------------------------------+
        |                                          |
Browser --> frontend  ------>  backend  ------>  mysql
        |   nginx + React      FastAPI + uvicorn   MySQL 8.0
        |   port 80            port 8000           port 3306
        |                                          |
        |   env vars  ->  backend settings         |
        |   volume    ->  uploaded book PDFs       |
        |   volume    ->  MySQL data               |
        +------------------------------------------+
```

Request flow:

1. The browser talks only to the frontend container.
2. nginx serves the React build and falls back to `index.html` for client-side routes.
3. Requests to `/api/` are proxied to the backend with the `/api` prefix stripped, so the browser never hits CORS and backend routes have no `/api` prefix.
4. The backend reads and writes MySQL. It retries the database connection (every 3 seconds, up to 30 attempts) and creates its tables on startup, so it is safe if MySQL starts late.

| Component | Container port |
| --- | --- |
| Frontend (nginx) | 80 |
| Backend (uvicorn) | 8000 |
| MySQL | 3306 |

## Repository structure

```
digital-library/
  backend/
    app/            main.py, database.py, models.py, schemas.py, auth.py, routers/
    tests/
    seed.py
    requirements.txt
  frontend/
    src/            pages/, components/, api/, App.jsx
    package.json
  docker/
    backend.Dockerfile
    frontend.Dockerfile
    nginx.conf
  .github/workflows/ci.yml
  docker-compose.yml
  docs/PRD.md
  README.md
```

The Kubernetes manifests will live in a `k8s/` folder once that phase starts.

## Run with Docker Compose

Prerequisites: Docker and Docker Compose.

```bash
git clone <your-repo-url>
cd digital-library
docker compose up --build
```

This starts MySQL, the backend and the frontend, with named volumes for MySQL data and uploaded files.

Seed the demo data in a second terminal:

```bash
docker compose exec backend python seed.py
```

Open the frontend in your browser (check the port mapping in `docker-compose.yml`). Swagger docs for the API are served by the backend at `/docs`.

### Demo accounts

Created by `seed.py`:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@library.com` | `Admin@123` |
| Student | `student@library.com` | `Student@123` |

The seed script also creates 6 categories and about 15 books with cover image URLs and a few small sample PDFs.

### Local development without Docker

```bash
# Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000

# Frontend (in another terminal)
cd frontend
npm install
npm run dev        # Vite proxies /api to http://localhost:8000
```

## Configuration and secrets

The backend reads its settings from environment variables.

| Variable | Purpose | Example |
| --- | --- | --- |
| `DB_HOST` | Database host | `mysql` |
| `DB_PORT` | Database port | `3306` |
| `DB_NAME` | Database name | `library_db` |
| `DB_USER` | Database user | `library_user` |
| `APP_ENV` | Environment name | `production` |
| `UPLOAD_DIR` | Where uploaded PDFs are stored | `/app/uploads` |
| `DB_PASSWORD` | Database password | demo value |
| `JWT_SECRET` | Key used to sign tokens | demo value |
| `MYSQL_ROOT_PASSWORD` | MySQL root password | demo value |

Never commit real credentials, and keep `.env` files in `.gitignore`. Values in the repository are for demos only; use new values for anything beyond that, especially `JWT_SECRET`.

## CI/CD pipeline

Defined in `.github/workflows/ci.yml`.

| Trigger | Steps |
| --- | --- |
| Push or pull request | Backend: `ruff` and `pytest`. Frontend: ESLint and `npm run build` |
| Push to `main` | All of the above, then build both Docker images and push them to Docker Hub |

Images are named `<dockerhub-username>/library-backend` and `<dockerhub-username>/library-frontend`, and tagged `latest` and with the git commit SHA.

Required GitHub repository secrets:

- `DOCKERHUB_USERNAME`
- `DOCKERHUB_TOKEN`

The pipeline currently ends at Docker Hub. Deploying those images to a cluster is part of the Kubernetes phase.

## Kubernetes plan

This phase is not implemented yet. The goal is to run the same three services on Minikube.

| Planned manifest | Purpose |
| --- | --- |
| `configmap.yaml` | Non-sensitive settings (`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `APP_ENV`, `UPLOAD_DIR`) |
| `secret.yaml` | `DB_PASSWORD`, `JWT_SECRET`, `MYSQL_ROOT_PASSWORD` |
| `pvc.yaml` | Persistent storage for MySQL data and uploads |
| `mysql.yaml` | MySQL StatefulSet with a headless service |
| `backend.yaml` | Deployment with 2 replicas, CPU requests and limits, liveness and readiness probes on `/health` |
| `frontend.yaml` | Deployment with 2 replicas behind a NodePort service |
| `hpa.yaml` | Backend autoscaling: min 2, max 5 replicas, target 50% CPU |

Planned demonstrations once deployed: replacing a deleted backend pod (self-healing), scaling under load with the HPA, and a rolling update with a new image tag.

## API overview

Full interactive documentation is available at `/docs` (Swagger) on the backend. Authenticated requests send `Authorization: Bearer <token>`. Errors always return `{ "detail": "message" }` with the correct HTTP status: `401` for a missing or invalid token, `403` for a student calling an admin route.

| Area | Endpoints |
| --- | --- |
| Health | `GET /health` |
| Auth | `POST /auth/register`, `POST /auth/login`, `GET /auth/me` |
| Categories | `GET /categories`, `POST /categories` (admin), `DELETE /categories/{id}` (admin) |
| Books | `GET /books` (search, category, sort, pagination), `GET /books/recent`, `GET /books/popular`, `GET /books/{id}`, `POST /books` (admin), `DELETE /books/{id}` (admin) |
| Downloads | `GET /books/{id}/download`, `GET /me/downloads` |
| Favorites | `GET /me/favorites`, `POST /favorites/{book_id}`, `DELETE /favorites/{book_id}` |
| Requests | `POST /requests`, `GET /requests/mine`, `GET /admin/requests` (admin), `PATCH /admin/requests/{id}` (admin) |
| Users | `GET /admin/users` (admin), `DELETE /admin/users/{id}` (admin) |

The JWT payload contains `sub` (user id), `role` (`student` or `admin`) and `exp` (24 hours).

### Database tables

`users`, `categories`, `books`, `downloads`, `favorites`, `book_requests`, linked by foreign keys. Deleting a user removes their downloads, favorites and requests. Deleting a category leaves its books uncategorized.

## Testing

```bash
# Backend
cd backend
ruff check .
pytest

# Frontend
cd frontend
npm run lint
npm run build
```

The backend tests cover registration, login, wrong password, listing books, an admin-only route blocked for students, and request submission.

## Git workflow

- Branches: `main` (always working), `backend-dev`, `frontend-dev`, `devops-dev`.
- Each person pushes to their own branch and opens a pull request into `main`. A teammate reviews and merges.
- Commit format: `feat(backend): add favorites endpoints`, `fix(frontend): ...`, `chore(devops): ...`.
- Folder ownership keeps merge conflicts away: backend in `/backend`, frontend in `/frontend`, DevOps in `/docker`, `/.github` and `docker-compose.yml`.

## Future scope

- Kubernetes deployment on Minikube with probes, self-healing and autoscaling
- Automatic deployment from CI to the cluster
- Prometheus and Grafana monitoring
- Cloud object storage for book files
- Deployment on AWS or Azure
- Advanced search and a recommendation system
- Load testing and performance analysis
