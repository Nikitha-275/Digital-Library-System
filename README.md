# Scalable Digital Library Management System — Backend

Backend service for the Scalable Digital Library Management System built with **Python 3.11**, **FastAPI**, **SQLAlchemy**, and **MySQL 8.0**. Developed in accordance with the Product Requirements Document (PRD Sections 5, 6, and 7).

---

## 1. Tech Stack

- **Language:** Python 3.11+
- **Framework:** FastAPI
- **ORM:** SQLAlchemy 2.0
- **Database Driver:** PyMySQL
- **Database:** MySQL 8.0 (SQLite supported for testing and zero-config local dev)
- **Authentication:** JWT (HMAC-SHA256, 24-hour expiration) with `passlib` & `bcrypt`
- **Testing:** Pytest & HTTPX test client

---

## 2. Directory Structure

```text
backend/
├── app/
│   ├── __init__.py          # App package initializer
│   ├── config.py            # Environment configuration & settings
│   ├── database.py          # SQLAlchemy engine, session factory, startup retry logic
│   ├── models.py            # ORM models for all 6 tables (users, categories, books, etc.)
│   ├── schemas.py           # Pydantic v2 schemas matching PRD Section 7
│   ├── auth.py              # Password hashing, JWT token handling, get_current_user, require_admin
│   ├── main.py              # FastAPI app, lifespan DB init, CORS, standard error handler
│   └── routers/
│       ├── __init__.py      # Routers package
│       ├── auth.py          # /auth/register, /auth/login, /auth/me
│       ├── categories.py    # /categories (GET, POST, DELETE)
│       ├── books.py         # /books, /books/recent, /books/popular, /books/{id}, /books/{id}/download
│       ├── favorites.py     # /favorites/{book_id} (POST, DELETE)
│       ├── me.py            # /me/downloads, /me/favorites
│       ├── requests.py      # /requests (POST, GET /requests/mine)
│       └── admin.py         # /admin/requests, /admin/requests/{id}, /admin/users, /admin/users/{id}
├── tests/                   # Pytest test suite (48 tests covering all endpoints & RBAC)
├── uploads/                 # Storage for book PDF uploads
├── seed.py                  # Database seeder (demo users, 6 categories, 16 books)
├── requirements.txt         # Dependencies
├── .env.example             # Environment variables template
├── .gitignore               # Git ignore rules
└── README.md                # Local setup guide
```

---

## 3. Environment Variables (PRD Section 5)

Copy the example environment template:
```bash
cp .env.example .env
```

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `DB_HOST` | `localhost` | MySQL host name (`mysql-service` in Kubernetes) |
| `DB_PORT` | `3306` | MySQL port |
| `DB_NAME` | `library_db` | Database name |
| `DB_USER` | `library_user` | MySQL database user |
| `DB_PASSWORD` | `library_password` | MySQL user password |
| `MYSQL_ROOT_PASSWORD` | `root_password` | MySQL root administrative password |
| `APP_ENV` | `development` | Application environment (`development` or `production`) |
| `UPLOAD_DIR` | `./uploads` | Directory for PDF file storage (`/app/uploads` in Docker) |
| `JWT_SECRET` | *(demo secret)* | Secret key for signing JWT tokens |

---

## 4. Local Installation & Setup

### A. Prerequisites
- Python 3.11+
- MySQL 8.0 running locally (or Docker Compose with MySQL service)

### B. Virtual Environment & Dependencies
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### C. Initialize & Seed Database
Run the database seed script to create all tables and populate demo accounts, categories, sample books, and a sample PDF:
```bash
python seed.py
```

**Demo Accounts created by seed script (PRD Section 5):**
- **Admin:** `admin@library.com` / `Admin@123`
- **Student:** `student@library.com` / `Student@123`

---

## 5. Running the Application

Start the FastAPI application with Uvicorn (PRD Section 5 exact start command):
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

- **Health Check:** `http://localhost:8000/health`
- **Swagger Documentation:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`

*Note: In accordance with PRD Section 5, backend routes have **no `/api` prefix**. In production/Kubernetes, Nginx proxies `/api/` to `http://backend-service:8000/` and strips the `/api` prefix. In local dev, Vite proxies `/api` directly.*

---

## 6. Running Tests

Run the complete automated test suite with pytest:
```bash
pytest tests/ -v
```

The test suite runs against an isolated, in-memory SQLite database and tests:
- `test_health.py`: Liveness probe (`GET /health`)
- `test_auth.py`: Registration, login, invalid credentials, profile retrieval (`/auth/me`)
- `test_categories.py`: Category listing, admin create/delete, student 403 blocks
- `test_books.py`: Listing with search/filter/sort/pagination, recent & popular feeds, admin create/delete with PDF handling, file streaming downloads
- `test_favorites.py`: Favorite toggling, `is_favorite` flag verification, `/me/favorites`, `/me/downloads`
- `test_requests.py`: Student book requests, student request listing, admin request review, status updates
- `test_admin.py`: Admin user listing, user deletion, prevention of self-deletion

---

## 7. API Summary (PRD Section 7)

| Method | Path | Access | Request | Response |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/health` | Public | none | `{"status": "ok"}` |
| `POST` | `/auth/register` | Public | `{ name, email, password }` | `{ id, name, email, role }` |
| `POST` | `/auth/login` | Public | `{ email, password }` | `{ access_token, token_type, role, name }` |
| `GET` | `/auth/me` | Logged in | none | User object |
| `GET` | `/categories` | Logged in | none | `[ { id, name } ]` |
| `POST` | `/categories` | Admin | `{ name }` | Category object |
| `DELETE`| `/categories/{id}` | Admin | none | `{"detail": "..."}` |
| `GET` | `/books` | Logged in | query: `search, category_id, sort, limit, offset` | `{ total, items: [book] }` |
| `GET` | `/books/recent` | Logged in | none | `[book]` (latest 8) |
| `GET` | `/books/popular`| Logged in | none | `[book]` (top 8 by downloads) |
| `GET` | `/books/{id}` | Logged in | none | Book object |
| `POST` | `/books` | Admin | multipart: `title, author, description, category_id, cover_url, file` | Book object |
| `DELETE`| `/books/{id}` | Admin | none | `{"detail": "..."}` |
| `GET` | `/books/{id}/download`| Logged in | none | File stream (increments download count) |
| `GET` | `/me/downloads`| Logged in | none | `[ { id, downloaded_at, book } ]` |
| `GET` | `/me/favorites`| Logged in | none | `[book]` |
| `POST` | `/favorites/{book_id}`| Logged in | none | `{"detail": "..."}` |
| `DELETE`| `/favorites/{book_id}`| Logged in | none | `{"detail": "..."}` |
| `POST` | `/requests` | Student | `{ book_name, author, category, note }` | Request object |
| `GET` | `/requests/mine` | Student | none | `[request]` |
| `GET` | `/admin/requests`| Admin | query: `status` (optional) | `[ { ...request, user_name, user_email } ]` |
| `PATCH`| `/admin/requests/{id}` | Admin | `{ status }` | Request object |
| `GET` | `/admin/users` | Admin | none | `[user]` |
| `DELETE`| `/admin/users/{id}` | Admin | none | `{"detail": "..."}` |
