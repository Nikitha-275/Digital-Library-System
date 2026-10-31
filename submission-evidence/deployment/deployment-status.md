# Deployment status

**Nothing has been deployed.** No deployment URL exists. This document records what is prepared and what is needed.

## Frontend - PREPARED, NOT DEPLOYED (needs your Vercel account)

Prepared and committed:

- `frontend-dev/vercel.json` - Vite build, `dist` output, single-page-app rewrite (React Router refresh/deep links).
- `frontend-dev/.env.example` - `VITE_USE_MOCKS`, `VITE_API_BASE_URL`.
- `.github/workflows/deploy-frontend.yml` - manual deploy (preview or production) that runs the tests first.
- Build verified on Node 20 (`../build-verification/build-node20.log`).

What a deployment would currently show: the app running on the **built-in mock API**. It must be described as a *frontend preview*, not the complete application.

### Option A - fastest (no GitHub secrets needed)

1. Sign in at vercel.com with GitHub. The GitHub account used must have access to `Nikitha-275/Digital-Library-System` (the repository owner can do this step or add you as a collaborator).
2. Add New -> Project -> import `Digital-Library-System`.
3. **Root Directory:** `frontend-dev`. Framework: Vite (auto-detected). Leave environment variables empty (mock mode).
4. Deploy. Vercel gives a `*.vercel.app` URL; open it and check login (demo buttons) and browse.
5. Pick the branch to deploy that contains the frontend and `vercel.json` (`devops-dev` after it is pushed).

### Option B - through GitHub Actions

1. Create a token at vercel.com/account/tokens.
2. Locally, in the repo root: `npx vercel link` (creates `.vercel/project.json`; do not commit it) and read `orgId` and `projectId` from it. In the Vercel project settings set Root Directory = `frontend-dev`.
3. GitHub -> Settings -> Secrets and variables -> Actions: add `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.
4. Actions -> "Deploy Frontend (Vercel)" -> Run workflow -> target `preview`.

Production deployments should wait until the backend is integrated. To require approval, create a GitHub environment named `production` with required reviewers (the workflow already uses `environment: <target>`).

## Backend - BLOCKED (no backend code)

Nothing can be deployed until the backend developer pushes code. Requirements already known from the frontend: the API must live under `/api` and answer on port 8000 locally. Hosting (for example Render or Railway) and the database are chosen once the stack is known. See `../documentation/integration-checklist.md`.

## Full application - PENDING

Requires the backend, then `VITE_USE_MOCKS=false` and `VITE_API_BASE_URL` (or a Vercel rewrite) set for the frontend build, followed by verification of the real flows. Not complete until verified.
