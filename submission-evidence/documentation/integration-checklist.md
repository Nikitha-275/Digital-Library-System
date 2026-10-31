# Frontend / Backend Integration Checklist

Derived from the actual frontend code at `frontend-dev/src/api/` (commit `28b5d85`). Nothing here is claimed as integrated: no backend exists in the repository yet.

## 1. How the frontend talks to the API today

- All calls go through one axios client (`src/api/client.js`) with base URL `/api`.
- `USE_MOCKS` (in `src/api/config.js`) swaps in an in-browser mock adapter. It is now controlled by `VITE_USE_MOCKS` (default `true`, so behaviour is unchanged).
- In local dev, Vite proxies `/api` to `http://localhost:8000` (`vite.config.js`).
- Auth: `Authorization: Bearer <token>` is attached from `localStorage.token`. Any `401` clears the session and redirects to `/login`.
- Errors: the UI reads **`err.response.data.message`** only.

## 2. Endpoints the backend must provide

| Method | Path | Body / query | Success response |
|---|---|---|---|
| POST | `/auth/login` | `{email, password}` | `{token, user:{id,name,email,role}}` |
| POST | `/auth/register` | `{name, email, password}` | `{token, user:{id,name,email,role}}` (201) |
| GET | `/categories` | - | `[{id, name}]` |
| POST | `/categories` (admin) | `{name}` | `{id, name}` (201) |
| DELETE | `/categories/:id` (admin) | - | `{success, message}` |
| GET | `/books` | `search, category, sort, page, limit` | `{books[], page, limit, total, totalPages}` |
| GET | `/books/recent` | `limit` | `[book]` |
| GET | `/books/popular` | `limit` | `[book]` |
| GET | `/books/:id` | - | `book` |
| POST | `/books` (admin) | JSON today; `multipart/form-data` supported by the API helper | `book` (201) |
| DELETE | `/books/:id` (admin) | - | `{success, message}` |
| POST | `/books/:id/favorite` | - | `{success, is_favorite, book}` |
| GET | `/books/:id/download` | `responseType: blob` | PDF bytes |
| GET | `/favorites` | - | `[book]` (current user's) |
| GET | `/downloads` | - | `[{id, bookId, title, author, category, cover_image, downloaded_at, file_size, format}]` |
| POST | `/requests` | `{bookName, author, category, note}` | `{id, userId, requesterName, requesterEmail, bookName, author, category, note, status, created_at}` (201) |
| GET | `/requests/me` | - | `[request]` (current user's) |
| GET | `/requests` (admin) | - | `[request]` (all) |
| PATCH | `/requests/:id/status` (admin) | `{status: pending\|approved\|rejected}` | `request` |
| GET | `/users` (admin) | - | `[{id,name,email,role,created_at}]` (no passwords) |
| DELETE | `/users/:id` (admin) | - | `{success, message}` |

`book` = `{id, title, author, category, categoryId, cover_image, description, download_count, created_at, pdf_url, is_favorite, file_size, pages, isbn}`.

## 3. Things that will break if not agreed with the backend developer

These come from reading the code, not from guesses:

1. **Error body must contain `message`.** Frameworks such as FastAPI return `{"detail": ...}` by default, so the UI would show a generic fallback instead of the real error. Either return `{message}` or change the frontend.
2. **Categories are passed by name, not id** (`/books?category=<name>`, request body `category: <name>`). The backend must accept names, or the frontend must change.
3. **`is_favorite` is per user.** The mock keeps one global flag; the backend must compute it for the logged-in user.
4. **PDF upload is not wired.** The admin "Add Book" form sends JSON and only uses the chosen PDF to compute `file_size`; the file itself is never uploaded. If the backend stores PDFs, `handleAddBook` in `AdminDashboard.jsx` must send `FormData` (the API helper already supports it).
5. **Authorization is only enforced in the UI today.** The mock does not check roles. The backend must return 401/403 for missing tokens and non-admin access to admin endpoints (the live contract tests check this).
6. **Not-found returns 400 in the mock.** A real backend should return 404; the UI handles any error status.
7. **Request ids** are strings like `req-123` in the mock. Any id format works for the real API (the UI only echoes it back).
8. `pdf_url` points to `/sample-files/sample-book.pdf`, which does not exist in the repository; the backend must supply real URLs or serve downloads only via `/books/:id/download`.

## 4. CORS and routing

Choose one:

- **Same origin (recommended for the deployed app):** add a Vercel rewrite `/api/(.*)` -> `https://<backend-host>/api/$1`. No CORS needed; keep `VITE_API_BASE_URL=/api`.
- **Cross origin:** set `VITE_API_BASE_URL=https://<backend-host>/api` at build time and enable CORS on the backend for the Vercel origin, methods `GET, POST, PUT, PATCH, DELETE, OPTIONS`, headers `Authorization, Content-Type`.

## 5. Database (implied by the frontend)

Entities used by the UI: users (with role), categories, books, favorites (user x book), downloads (user x book x time), book requests (with status). The repository does not specify a database; this must be decided by the backend developer.

## 6. Steps when the backend is pushed

- [ ] Fetch `backend-dev`, inspect its contents and tests before merging anything.
- [ ] Confirm the stack and add its dependency file under `backend/` (or the folder used); CI detects Python, Node and Java automatically.
- [ ] Start the backend on port 8000 with the same demo accounts the contract tests use (or set `API_TEST_*` variables).
- [ ] Run `API_TEST_URL=http://localhost:8000/api npm test` in `frontend-dev/` and fix any contract failures.
- [ ] Resolve the items in section 3 together with the backend developer.
- [ ] Set `VITE_USE_MOCKS=false` and `VITE_API_BASE_URL` for the deployed frontend.
- [ ] Verify login, browse, download, request and admin flows against the real backend.
- [ ] Deploy the backend, then redeploy the frontend pointing at it; record URLs in `submission-evidence/deployment/`.

Do not mark integration complete until these pass against a real backend.
