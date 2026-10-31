# Backend tests - status: PENDING

No backend code exists in the repository yet (`main`, `backend-dev` and `devops-dev` all started at the initial commit `00e3ea2`; the backend developer has not pushed). Therefore:

| Test type | Status |
|---|---|
| Backend unit tests | **PENDING** - nothing to test yet |
| Backend API tests | **PENDING** - the shared contract tests exist and are **skipped** until `API_TEST_URL` is set |
| Frontend/backend integration tests | **PENDING** - same contract tests, run against the live backend |

What is already prepared:

- `frontend-dev/src/__tests__/api.contract.test.js` - 19 live-backend tests (status codes, response structures, error handling, 401/403 security). They appear as **skipped**, never as passed, in every report.
- `.github/workflows/ci.yml` - detects a Python, Node or Java backend automatically and runs `pytest` / `npm test` / `mvn verify`; shows "SKIPPED - no backend code" otherwise.

Do not count any backend test as passed until it has been executed against real backend code.
