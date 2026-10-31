# DevOps Guide - Digital Library System

How this project is built, tested and deployed. Everything below reflects what exists in the repository; items that depend on the backend are marked **PENDING**.

## 1. Project layout

| Part | Location | Status |
|---|---|---|
| Frontend (React 18 + Vite 5, React Router 6, axios) | `frontend-dev/` | Implemented; mock API by default, live backend via `src/api/liveAdapter.js` |
| Backend (FastAPI, SQLAlchemy, MySQL/SQLite) | repository root: `app/`, `tests/`, `seed.py`, `requirements.txt` | Implemented; 52 tests |
| CI/CD | `.github/workflows/` | Implemented |
| Evidence for submission | `submission-evidence/` | Implemented |

## 2. Branch structure

| Branch | Purpose |
|---|---|
| `main` | Stable, integrated code. Nothing is merged here until it is complete and CI is green. |
| `frontend-dev` | Frontend development. |
| `backend-dev` | Backend development. |
| `devops-dev` | CI/CD, tests, deployment configuration, documentation. |

All four branches are covered by CI (push and pull request).

## 3. Commit workflow

- Small, focused commits with a prefix: `feat`, `fix`, `test`, `ci`, `build`, `docs`, `chore`
  (example: `test(frontend): component tests for auth and route guards`).
- Work on your own branch; never commit directly to `main`.
- Do not rewrite or force-push shared history.

## 4. Pull request workflow

1. Push your branch and open a Pull Request into `main`.
2. CI runs automatically; the PR must be green (frontend tests + build, backend checks when present).
3. At least one teammate reviews.
4. Merge only after approval and a green CI run.

## 5. Automated testing

Framework: **Vitest** + **React Testing Library** (jsdom). Reports: JUnit XML, JSON, coverage (text, HTML, LCOV).

```bash
cd frontend-dev
npm ci
npm test               # run all tests once
npm run test:coverage  # tests + coverage report in frontend-dev/coverage/
npm run test:ci        # what CI runs; also writes frontend-dev/test-results/
```

| Layer | Files | What is verified |
|---|---|---|
| Unit - API logic | `mockHandlers.test.js`, `apiClient.test.js`, `downloadFile.test.js`, `useDebounce.test.js` | login/register rules, search/filter/sort/paging, favorites, downloads, requests, admin actions, auth header, 401 handling, env-driven config, debounce timing |
| Component | `AuthContext`, `routeGuards`, `Login`, `Register`, `RequestBook`, `BookCard`, `Navbar` | input validation, error messages, loading states, role-based navigation, redirects |
| Integration | `App.integration.test.jsx`, `Pages.integration.test.jsx` | whole app through the real router, auth and API client: browse, login journeys, access control, favorites, downloads, admin dashboard |
| API contract | `api.contract.test.js` | the same assertions run against the mock API **and, once `API_TEST_URL` is set, against the real backend** |

Latest recorded result (see `submission-evidence/automated-tests/`): all executed tests pass; the live-backend contract tests are **skipped, not passed**, until a backend exists.

Run the contract tests against a real backend:

```bash
API_TEST_URL=http://localhost:8000 npm test
```

Backend tests (pytest, SQLite in-memory, from the repository root):

```bash
pip install -r requirements.txt pytest-cov
python -m pytest --cov=app
```

Full-stack run (real backend + frontend contract tests through the live adapter):

```bash
DATABASE_URL=sqlite:///./local.db python seed.py
DATABASE_URL=sqlite:///./local.db uvicorn app.main:app --port 8000 &
cd frontend-dev && API_TEST_URL=http://127.0.0.1:8000 npm test
```

Seed accounts: `student@library.com` / `Student@123`, `admin@library.com` / `Admin@123` (demo data only).

## 6. GitHub Actions CI/CD

`.github/workflows/ci.yml` - runs on every push and pull request to `main`, `frontend-dev`, `backend-dev`, `devops-dev`.

| Job | What it does |
|---|---|
| `detect` | Finds frontend and backend code on the branch |
| `frontend` | `npm ci` -> tests with coverage -> job summary -> production build -> uploads test, coverage and `dist` artifacts |
| `backend-python` / `backend-node` / `backend-java` | Start automatically when matching backend code exists; otherwise they are skipped |
| `integration` | Starts the real backend (SQLite, seeded) and runs the frontend contract tests through the live adapter |
| `summary` | Prints a results table and fails the run if any job that ran failed |

When no backend exists the summary says **"SKIPPED - no backend code on this branch (not a pass)"**; it never reports a missing backend as passing.

`.github/workflows/deploy-frontend.yml` - **manual** deployment to Vercel (preview or production). It runs the tests first and fails clearly if secrets are missing.

## 7. Build verification

```bash
cd frontend-dev && npm ci && npm run build
```

Output goes to `frontend-dev/dist/`. Verified on Node 20 from a clean clone; see `submission-evidence/build-verification/`.

## 8. Deployment

### Frontend (Vercel)

- Config: `frontend-dev/vercel.json` (Vite build, `dist` output, single-page-app rewrite so React Router URLs work on refresh).
- In Vercel: import the GitHub repository, set **Root Directory = `frontend-dev`**.
- GitHub repository secrets needed for `deploy-frontend.yml`:
  `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.
- Until the backend exists, a deployment shows the **mock-API version** of the app. It must be described as a frontend preview, not the complete application.

### Backend (PENDING)

Start command: `uvicorn app.main:app --host 0.0.0.0 --port 8000`; health check `GET /health`. Environment: `DATABASE_URL` (or `DB_*` for MySQL), `JWT_SECRET`, `UPLOAD_DIR`. Hosting is **PENDING** (needs an account - see `submission-evidence/deployment/deployment-status.md`). Frontend/backend mapping: `submission-evidence/documentation/integration-checklist.md`.

## 9. Environment variables

| Variable | Where | Meaning | Default |
|---|---|---|---|
| `VITE_USE_MOCKS` | frontend build | `false` switches from the mock API to the real backend | `true` |
| `VITE_API_BASE_URL` | frontend build | Backend root URL, e.g. `https://backend.example.com` (no `/api`); default `/api` works with the Vite proxy or a Vercel rewrite | `/api` |
| `API_TEST_URL` | test run | Backend URL for the live contract tests | unset (tests skipped) |
| `API_TEST_EMAIL`, `API_TEST_PASSWORD`, `API_TEST_ADMIN_EMAIL`, `API_TEST_ADMIN_PASSWORD` | test run | Accounts used by the live contract tests | demo accounts |

Vite bakes `VITE_*` values into the bundle at **build time**; set them before the build. Never commit real secrets - use `frontend-dev/.env.local` (ignored by git) locally and GitHub/Vercel secrets remotely.
