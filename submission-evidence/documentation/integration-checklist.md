# Frontend / Backend Integration (verified against the real backend)

Backend: FastAPI app pushed by the backend developer to `main` (commit `ad0cbf2`), merged into `devops-dev`.
Frontend: `frontend-dev/`. The two were written against **different API contracts**, so the frontend now has a translation layer.

## How it works

- `frontend-dev/src/api/liveAdapter.js` is an axios adapter used **only when `VITE_USE_MOCKS=false`**. The mock API, the UI pages and the backend are unchanged.
- Local dev: Vite proxies `/api/*` to `http://localhost:8000/*` and strips `/api` (the backend has no `/api` prefix).
- Deployed: set `VITE_API_BASE_URL` to the backend root URL (no `/api`), or add a Vercel rewrite `/api/(:path*)` -> `https://<backend>/:path*`.

## Contract differences handled by the adapter

| UI expects | Backend provides | Adapter does |
|---|---|---|
| `POST /auth/login` -> `{token, user}` | `{access_token, role, name}` (no user object) | login, then `GET /auth/me`, returns `{token, user}` |
| `POST /auth/register` -> `{token, user}` | `201 {id,name,email,role}` | register, then login |
| role `user` | role `student` | maps `student` -> `user` |
| errors `{message}` | `{detail}` (string or list) | copies `detail` into `message` |
| `GET /books?category=<name>&page&limit&sort` -> `{books,page,limit,total,totalPages}` | `?category_id&limit&offset&sort=newest\|title\|popular` -> `{total,items}` | name->id lookup, page->offset, sort names; `oldest`/`title_desc` sorted in the adapter |
| `POST /books/:id/favorite` toggle | `POST`/`DELETE /favorites/:id` | reads state, calls the right verb |
| `GET /favorites`, `/downloads` | `/me/favorites`, `/me/downloads` (nested `book`) | renames, flattens |
| `/requests`, `/requests/me`, `PATCH /requests/:id/status` | `/admin/requests`, `/requests/mine`, `PATCH /admin/requests/:id` | renames; camelCase <-> snake_case |
| `/users` | `/admin/users` | renames |
| `POST /books` JSON | multipart (admin) | Admin form now sends the chosen PDF as multipart |
| book `file_size`, `pages`, `isbn`, `pdf_url` | not provided | shown as "—" (no invented values) |
| timestamps | naive UTC | marked as UTC |

## Known product differences (for the team to decide)

1. **Browsing now requires login in live mode.** The backend returns 401 for anonymous `/books`, while the UI shows browse publicly; the UI's 401 handler sends visitors to `/login`.
2. Backend has no file size / page count / ISBN; the UI shows "—".
3. `email-validator` was missing from `requirements.txt` (clean install failed); added in `f7d0043` - the backend developer should keep it.
4. Backend was pushed to `main`, not `backend-dev`.
5. Backend README says Vite proxies `/api` directly; the rewrite was needed (done in the frontend).

## Verification actually run

- Backend tests: 52 passed, 93% coverage of `app/` (`../automated-tests/backend/`).
- Live contract tests through the adapter, backend running on SQLite + `seed.py`: 17 passed (`../automated-tests/live-contract-run.log`).
- Full frontend suite with the live backend: 221 passed, 2 skipped, 0 failed (`../automated-tests/test-run-live-node22.log`).
- Real browser (Chromium) against `vite preview` built with `VITE_USE_MOCKS=false`: login as seeded student -> `POST /api/auth/login 200`, `GET /api/auth/me 200`, books/categories loaded, no page errors (`../deployment/live-browse.png`).
- NOT yet verified: MySQL (all runs used SQLite), cross-origin deployment, PDF download through the UI against a deployed backend.
