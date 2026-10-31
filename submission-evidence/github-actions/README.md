# GitHub Actions evidence

## Workflows (in `.github/workflows/`)

| File | Purpose | Trigger |
|---|---|---|
| `ci.yml` | Install, test with coverage, build the frontend; run backend checks automatically once backend code exists | push and pull request on `main`, `frontend-dev`, `backend-dev`, `devops-dev`; manual |
| `deploy-frontend.yml` | Test, build and deploy the frontend to Vercel | manual only |

## What has been verified locally (real output in this folder)

- `workflow-validation.log` - both workflow files parse as valid YAML, every `needs:` reference resolves, `vercel.json` is valid JSON, and the backend auto-detection script produces the right result for: no backend, Python, Node and Java layouts.
- `../automated-tests/test-run-node20.log` and `../build-verification/*.log` - the exact steps the `frontend` job runs (`npm ci`, `npm run test:ci`, `npm run build`), executed from a fresh clone of `devops-dev` on Node 20 (the version the workflow uses).

## What has NOT happened yet

**The workflows have not run on GitHub.** A workflow only runs after the branch is pushed. Nothing was pushed from this session, so there is no GitHub Actions run, no run URL and no green check to show yet.

After pushing `devops-dev`, the evidence to collect is:

1. Actions tab: `https://github.com/Nikitha-275/Digital-Library-System/actions` - open the "CI" run and screenshot the job list and the **job summary** (shows the test table and coverage).
2. The downloadable artifacts `frontend-test-reports` and `frontend-dist` from that run.
3. A Pull Request from `devops-dev` into `main` showing the CI check.

Expected CI result with the current branch contents: `detect` succeeds, `frontend` succeeds, the three backend jobs are **skipped**, and the summary says "SKIPPED - no backend code on this branch (not a pass)".

## One difference from a real GitHub run

Local verification used Node 20.20.2 and the same npm commands as the workflow, but GitHub-specific parts (`actions/checkout`, `setup-node`, artifact upload, job summary rendering) can only be confirmed by an actual run.
