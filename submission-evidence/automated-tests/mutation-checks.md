# Do the tests actually detect bugs? (mutation check)

To make sure the tests are not "always pass", six deliberate bugs were injected into the real application code one at a time, the relevant tests were run, and the original file was restored each time. These are the actual results of that run (before the final commit; the working tree was verified clean afterwards).

| # | Deliberate bug | File | Test file run | Result |
|---|---|---|---|---|
| 1 | Debounce hook never updates its value | `src/hooks/useDebounce.js` | `useDebounce.test.js` | 3 failed, 2 passed - bug detected |
| 2 | Login accepts any password | `src/api/mockData.js` | `mockHandlers.test.js` | 1 failed, 56 passed - bug detected |
| 3 | Minimum password length 6 changed to 3 | `src/pages/Register.jsx` | `Register.test.jsx` | 1 failed, 5 passed - bug detected |
| 4 | Admin route lets non-admins in | `src/components/AdminRoute.jsx` | `routeGuards.test.jsx` | 1 failed, 5 passed - bug detected |
| 5 | Authorization header no longer sent | `src/api/client.js` | `apiClient.test.js` | 1 failed, 19 passed - bug detected |
| 6 | Category filter ignored | `src/api/mockData.js` | `mockHandlers.test.js` | 1 failed, 56 passed - bug detected |

All six bugs were caught. The application source was restored after each mutation (`git diff` on `src/` was empty afterwards).
