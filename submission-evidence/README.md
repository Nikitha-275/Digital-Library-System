# Submission evidence - DevOps

Everything in this folder was produced by actually running the commands; nothing is mocked up. Items that could not be done are marked PENDING or BLOCKED with the reason.

Repository: https://github.com/Nikitha-275/Digital-Library-System  
DevOps branch: `devops-dev` (local commits; **not pushed yet**, so GitHub still shows the initial commit on this branch)

| Folder | Contents |
|---|---|
| `commit-history/` | `git log --graph --all`, `--stat`, branches, authors, full log with hashes |
| `automated-tests/` | real test run log (Node 20), JUnit XML, JSON report, coverage (HTML, LCOV, summary), per-test inventory, mutation check, backend-tests-pending note |
| `github-actions/` | workflow validation log, notes on what still needs a push |
| `build-verification/` | `npm ci` and `npm run build` logs, output file list with checksums |
| `deployment/` | deployment status and setup steps (nothing deployed yet) |
| `documentation/` | frontend/backend integration checklist (see also `../DEVOPS.md`) |

## Status

| Item | Status | Detail |
|---|---|---|
| Git branch setup | COMPLETE | Work is on `devops-dev`; `main` untouched; no branches deleted |
| DevOps commits | COMPLETE locally, push PENDING | See `commit-history/` |
| Frontend unit tests | COMPLETE | 14 files, 186 passed, 0 failed (19 skipped = live-backend tests) |
| Backend unit tests | BLOCKED | No backend code in the repository |
| API tests | PARTIAL | Contract tests pass against the mock API; against a live backend PENDING |
| Integration tests | PARTIAL | Whole-app tests against the mock API pass; frontend-to-backend PENDING |
| Test reports and coverage | COMPLETE | 95.99% statements, 85.27% branches, 91.54% functions |
| GitHub Actions CI | COMPLETE (written and validated locally) | Not yet run on GitHub |
| GitHub Actions execution | PENDING | Needs `devops-dev` to be pushed |
| Frontend build verification | COMPLETE | Node 20, clean clone |
| Backend build verification | BLOCKED | No backend code |
| Frontend deployment | PENDING | Prepared; needs Vercel account access |
| Backend deployment | BLOCKED | No backend code |
| Full application integration | BLOCKED | Needs backend |
| Final deployment verification | BLOCKED | Needs the above |
| Submission evidence | COMPLETE for what exists | Remote links added after push |

Tested commit for all test and build evidence: see `automated-tests/tested-commit.txt`.
