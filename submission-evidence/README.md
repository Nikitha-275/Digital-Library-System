# Submission evidence - DevOps

Everything in this folder was produced by actually running the commands; nothing is mocked up. Items that could not be done are marked PENDING or BLOCKED with the reason.

Repository: https://github.com/Nikitha-275/Digital-Library-System  
DevOps branch: `devops-dev` (local commits; **not pushed yet**, so GitHub still shows the initial commit on this branch)

| Folder | Contents |
|---|---|
| `commit-history/` | `git log --graph --all`, `--stat`, branches, authors, full log with hashes |
| `automated-tests/` | real test run logs, JUnit XML, JSON report, coverage (HTML, LCOV, summary), per-test inventory, mutation check, backend-tests-pending note |
| `github-actions/` | workflow validation log, notes on what still needs a push |
| `build-verification/` | `npm ci` and `npm run build` logs, output file list with checksums |
| `deployment/` | deployment status and setup steps (nothing deployed yet) |
| `documentation/` | frontend/backend integration checklist (see also `../DEVOPS.md`) |

## Status

| Item | Status | Detail |
|---|---|---|
| Git branch setup | COMPLETE | Work is on `devops-dev`; `main` untouched; no branches deleted |
| DevOps commits | COMPLETE locally, push PENDING | See `commit-history/` |
| Frontend unit tests | COMPLETE | 221 passed, 0 failed, 2 skipped (security tests that only apply to a live backend and are skipped on the mock) |
| Backend unit tests | COMPLETE | 52 passed, 93% coverage (`automated-tests/backend/`) |
| API tests | COMPLETE | Contract tests: 15 on the mock + 17 on the real backend through the adapter, all passed |
| Integration tests | COMPLETE (SQLite) | Whole-app tests on mock; frontend<->backend contract + real-browser login/browse verified; MySQL not tested |
| Test reports and coverage | COMPLETE | JUnit/JSON/LCOV for frontend and backend |
| GitHub Actions CI | COMPLETE (written, validated locally) | Includes new `integration` job; not yet run on GitHub |
| GitHub Actions execution | PENDING | Needs `devops-dev` pushed |
| Frontend build verification | COMPLETE | Mock mode (Node 20) and live mode (Node 22) |
| Backend build verification | COMPLETE | Clean install in fresh venv + compile + tests |
| Frontend deployment | PENDING | Needs Vercel account |
| Backend deployment | PENDING | Needs hosting account and database decision |
| Full application integration | COMPLETE locally | Verified locally; not on deployed URLs |
| Final deployment verification | PENDING | Needs both deployments |
| Submission evidence | COMPLETE for what exists | Remote links added after push |

Details of the integration and its limits: `documentation/integration-checklist.md`. Tested commit: `automated-tests/tested-commit.txt`.
