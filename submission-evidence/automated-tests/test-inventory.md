# Test inventory

Every test, generated from the real Vitest JSON report (`results.json`) of the clean-room Node 20 run. Status values are exactly what Vitest reported.

Total: 205 | passed: 186 | failed: 0 | skipped: 19

## src/__tests__/api.contract.test.js

- [PASS] API contract: built-in mock API auth POST /auth/login returns token and a user without password
- [PASS] API contract: built-in mock API auth POST /auth/login with a wrong password is a 4xx error with a message
- [PASS] API contract: built-in mock API auth admin login reports role "admin"
- [PASS] API contract: built-in mock API catalog GET /categories returns [{id, name}]
- [PASS] API contract: built-in mock API catalog GET /books returns a paginated envelope
- [PASS] API contract: built-in mock API catalog GET /books?search= narrows the results
- [PASS] API contract: built-in mock API catalog GET /books/:id returns the book
- [PASS] API contract: built-in mock API catalog GET /books/:id for a missing book is a 4xx error
- [PASS] API contract: built-in mock API catalog GET /books/recent and /books/popular respect the limit
- [PASS] API contract: built-in mock API user data GET /favorites and /downloads return arrays
- [PASS] API contract: built-in mock API user data POST /books/:id/favorite toggles and reports is_favorite
- [PASS] API contract: built-in mock API user data POST /requests creates a pending request visible in GET /requests/me
- [PASS] API contract: built-in mock API user data POST /requests without required fields is a 4xx error
- [PASS] API contract: built-in mock API admin GET /users (admin) returns users without passwords
- [PASS] API contract: built-in mock API admin GET /requests (admin) returns every request
- [SKIP] API contract: built-in mock API security (live backend only) rejects a regular user on admin endpoints with 401/403
- [SKIP] API contract: built-in mock API security (live backend only) rejects requests without a token with 401
- [SKIP] API contract: LIVE backend (API_TEST_URL not set) auth POST /auth/login returns token and a user without password
- [SKIP] API contract: LIVE backend (API_TEST_URL not set) auth POST /auth/login with a wrong password is a 4xx error with a message
- [SKIP] API contract: LIVE backend (API_TEST_URL not set) auth admin login reports role "admin"
- [SKIP] API contract: LIVE backend (API_TEST_URL not set) catalog GET /categories returns [{id, name}]
- [SKIP] API contract: LIVE backend (API_TEST_URL not set) catalog GET /books returns a paginated envelope
- [SKIP] API contract: LIVE backend (API_TEST_URL not set) catalog GET /books?search= narrows the results
- [SKIP] API contract: LIVE backend (API_TEST_URL not set) catalog GET /books/:id returns the book
- [SKIP] API contract: LIVE backend (API_TEST_URL not set) catalog GET /books/:id for a missing book is a 4xx error
- [SKIP] API contract: LIVE backend (API_TEST_URL not set) catalog GET /books/recent and /books/popular respect the limit
- [SKIP] API contract: LIVE backend (API_TEST_URL not set) user data GET /favorites and /downloads return arrays
- [SKIP] API contract: LIVE backend (API_TEST_URL not set) user data POST /books/:id/favorite toggles and reports is_favorite
- [SKIP] API contract: LIVE backend (API_TEST_URL not set) user data POST /requests creates a pending request visible in GET /requests/me
- [SKIP] API contract: LIVE backend (API_TEST_URL not set) user data POST /requests without required fields is a 4xx error
- [SKIP] API contract: LIVE backend (API_TEST_URL not set) admin GET /users (admin) returns users without passwords
- [SKIP] API contract: LIVE backend (API_TEST_URL not set) admin GET /requests (admin) returns every request
- [SKIP] API contract: LIVE backend (API_TEST_URL not set) security (live backend only) rejects a regular user on admin endpoints with 401/403
- [SKIP] API contract: LIVE backend (API_TEST_URL not set) security (live backend only) rejects requests without a token with 401

## src/__tests__/apiClient.test.js

- [PASS] API layer through the axios mock adapter (integration) login resolves with token and user
- [PASS] API layer through the axios mock adapter (integration) login failure rejects with HTTP-style error (status 400 + message)
- [PASS] API layer through the axios mock adapter (integration) register returns 201 semantics and a usable session
- [PASS] API layer through the axios mock adapter (integration) forwards query params to the books endpoint
- [PASS] API layer through the axios mock adapter (integration) getBookById resolves a book and rejects an unknown one
- [PASS] API layer through the axios mock adapter (integration) recent and popular endpoints honour the limit parameter
- [PASS] API layer through the axios mock adapter (integration) toggleFavorite is reflected by the favorites endpoint
- [PASS] API layer through the axios mock adapter (integration) download returns a blob and appears in download history
- [PASS] API layer through the axios mock adapter (integration) admin can create then delete a book and category
- [PASS] API layer through the axios mock adapter (integration) book request flow: create as logged-in user, then approve as admin
- [PASS] API layer through the axios mock adapter (integration) admin user management: list and delete
- [PASS] API layer through the axios mock adapter (integration) unknown endpoints come back as 404
- [PASS] request interceptor: Authorization header attaches the bearer token when one is stored
- [PASS] request interceptor: Authorization header sends no Authorization header when logged out
- [PASS] response interceptor: 401 handling clears the session and redirects to /login from a protected page
- [PASS] response interceptor: 401 handling does not redirect when already on the login page, but still clears the session
- [PASS] environment-driven API configuration defaults to mock mode and the /api base URL
- [PASS] environment-driven API configuration VITE_USE_MOCKS=false switches to the real backend
- [PASS] environment-driven API configuration VITE_API_BASE_URL overrides the base URL
- [PASS] environment-driven API configuration the axios client uses the mock adapter only when mocks are on

## src/__tests__/App.integration.test.jsx

- [PASS] Browse (public catalog) anonymous visitors land on Browse and see every book
- [PASS] Browse (public catalog) search filters the list after the debounce
- [PASS] Browse (public catalog) shows an empty state for no matches, and Clear All Filters restores the list
- [PASS] Browse (public catalog) filters by category
- [PASS] Browse (public catalog) sorts titles A-Z
- [PASS] Browse (public catalog) shows an error with Retry when the catalog request fails, then recovers
- [PASS] Routing and access control unknown URLs show the 404 page
- [PASS] Routing and access control anonymous visitor to /favorites is sent to the login page
- [PASS] Routing and access control anonymous visitor to /downloads is sent to the login page
- [PASS] Routing and access control anonymous visitor to /request is sent to the login page
- [PASS] Routing and access control anonymous visitor to /books/1 is sent to the login page
- [PASS] Routing and access control anonymous visitor to /admin is sent to the login page
- [PASS] Routing and access control a regular user opening /admin is sent to Browse
- [PASS] User journeys logs in through the UI with the demo user and sees the personalised home page
- [PASS] User journeys a wrong password is rejected with the API error message
- [PASS] User journeys favorites page lists the user's favorite books
- [PASS] User journeys book details: add to favorites, then download a PDF
- [PASS] User journeys a book id that does not exist shows a not-found message
- [PASS] Admin journeys admin logs in through the UI and lands on the dashboard
- [PASS] Admin journeys admin approves a pending book request in the inbox
- [PASS] Admin journeys admin adds a category and it appears in the list

## src/__tests__/AuthContext.test.jsx

- [PASS] AuthProvider: initial state starts logged out when storage is empty
- [PASS] AuthProvider: initial state restores an existing session from localStorage
- [PASS] AuthProvider: initial state does not crash on corrupt user JSON in storage
- [PASS] AuthProvider: initial state a regular user is authenticated but not admin
- [PASS] AuthProvider: login stores token, role and user in state and localStorage
- [PASS] AuthProvider: login exposes isLoading while the request is in flight
- [PASS] AuthProvider: login propagates failure, stays logged out and clears the loading flag
- [PASS] AuthProvider: register and logout register signs the new user in
- [PASS] AuthProvider: register and logout logout clears state and storage
- [PASS] useAuth throws a clear error when used outside AuthProvider

## src/__tests__/BookCard.test.jsx

- [PASS] BookCard shows title, author, category and the cover image
- [PASS] BookCard links to the book details page from both the cover and the title
- [PASS] BookCard falls back to "Unknown Author" when the author is missing
- [PASS] BookCard omits the category tag when the book has no category
- [PASS] BookCard shows a placeholder instead of an image when there is no cover
- [PASS] BookCard switches to the placeholder when the cover image fails to load
- [PASS] BookCard shows the favorite badge only for favorited books

## src/__tests__/downloadFile.test.js

- [PASS] triggerFileDownload downloads a Blob under the given filename
- [PASS] triggerFileDownload defaults the filename to document.pdf
- [PASS] triggerFileDownload wraps non-Blob data in a PDF Blob
- [PASS] triggerFileDownload cleans up: removes the link from the DOM and revokes the object URL

## src/__tests__/Login.test.jsx

- [PASS] Login page renders the form and a link to registration
- [PASS] Login page demo buttons fill in the matching credentials
- [PASS] Login page sends the typed credentials to the API and lands a user on the home page
- [PASS] Login page sends admins straight to the dashboard
- [PASS] Login page returns the user to the page they originally wanted
- [PASS] Login page shows the server error message when login fails
- [PASS] Login page falls back to the error message when there is no response body
- [PASS] Login page shows a validation message and does not call the API when fields are empty
- [PASS] Login page disables the form and shows progress while signing in

## src/__tests__/mockHandlers.test.js

- [PASS] auth: login returns a token and the user (without password) for valid credentials
- [PASS] auth: login returns the admin role for the admin account
- [PASS] auth: login matches the email case-insensitively
- [PASS] auth: login rejects a wrong password
- [PASS] auth: login rejects an unknown email
- [PASS] auth: register creates a regular user, returns a token and never exposes the password
- [PASS] auth: register allows the new user to log in afterwards
- [PASS] auth: register rejects a duplicate email regardless of case
- [PASS] auth: register persists new users to localStorage
- [PASS] categories lists the six seeded categories
- [PASS] categories creates a category and trims the name
- [PASS] categories rejects an empty name ("")
- [PASS] categories rejects an empty name ("   ")
- [PASS] categories rejects an empty name (undefined)
- [PASS] categories rejects a duplicate name regardless of case
- [PASS] categories deletes an existing category
- [PASS] categories rejects deleting a category that does not exist
- [PASS] categories keeps data after a reload (persistence)
- [PASS] books: listing, search, filter, sort, pagination returns the first page of 6 by default with correct paging metadata
- [PASS] books: listing, search, filter, sort, pagination returns the remaining books on page 2
- [PASS] books: listing, search, filter, sort, pagination searches by title
- [PASS] books: listing, search, filter, sort, pagination searches by author, case-insensitively
- [PASS] books: listing, search, filter, sort, pagination returns an empty result (and 1 total page) when nothing matches
- [PASS] books: listing, search, filter, sort, pagination filters by category
- [PASS] books: listing, search, filter, sort, pagination treats category "all" as no filter
- [PASS] books: listing, search, filter, sort, pagination sorts newest first by default
- [PASS] books: listing, search, filter, sort, pagination sorts oldest first
- [PASS] books: listing, search, filter, sort, pagination sorts by most downloaded
- [PASS] books: listing, search, filter, sort, pagination sorts titles A-Z and Z-A
- [PASS] books: listing, search, filter, sort, pagination falls back to defaults for invalid page/limit values
- [PASS] books: details, create, delete returns a book by id (string ids are accepted)
- [PASS] books: details, create, delete rejects an unknown book id
- [PASS] books: details, create, delete creates a book with sensible defaults and lists it first
- [PASS] books: details, create, delete rejects a book missing a required field ({"author":"A","category":"C"})
- [PASS] books: details, create, delete rejects a book missing a required field ({"title":"T","category":"C"})
- [PASS] books: details, create, delete rejects a book missing a required field ({"title":"T","author":"A"})
- [PASS] books: details, create, delete deletes a book
- [PASS] books: details, create, delete rejects deleting an unknown book
- [PASS] favorites starts with the two seeded favorites
- [PASS] favorites toggles a book on and off
- [PASS] favorites rejects toggling an unknown book
- [PASS] downloads returns a PDF blob, bumps the counter and records the download
- [PASS] downloads rejects downloading an unknown book and records nothing
- [PASS] home page rows returns the most recent books, newest first
- [PASS] home page rows returns the most downloaded books, highest first
- [PASS] book requests creates a pending request owned by the current user, trimming input
- [PASS] book requests rejects a request missing a required field ({"author":"A","category":"C"})
- [PASS] book requests rejects a request missing a required field ({"bookName":"B","category":"C"})
- [PASS] book requests rejects a request missing a required field ({"bookName":"B","author":"A"})
- [PASS] book requests only returns the current user's own requests
- [PASS] book requests returns every request for admins
- [PASS] book requests updates a request status
- [PASS] book requests rejects an invalid status
- [PASS] book requests rejects an unknown request id
- [PASS] users (admin) lists users without passwords
- [PASS] users (admin) deletes a user
- [PASS] users (admin) rejects deleting an unknown user

## src/__tests__/Navbar.test.jsx

- [PASS] Navbar: logged out shows Browse Books, Login and Register, and no account links
- [PASS] Navbar: logged out the brand links to /browse
- [PASS] Navbar: regular user shows user links, the role badge and the name; hides admin link
- [PASS] Navbar: regular user the brand links to the home page
- [PASS] Navbar: admin shows the admin dashboard link and hides user-only links
- [PASS] Navbar: logout clears the session and sends the user to /login

## src/__tests__/Pages.integration.test.jsx

- [PASS] Home page greets the user and shows the recent and most-downloaded rows (4 books each)
- [PASS] Home page shows an error message when the collections fail to load
- [PASS] Downloads page lists the download history
- [PASS] Downloads page re-downloading triggers a file download and records a new history entry
- [PASS] Downloads page shows an empty state when nothing was downloaded
- [PASS] Downloads page shows an error and recovers on Retry
- [PASS] Admin dashboard: books rejects a book whose title is only whitespace
- [PASS] Admin dashboard: books adds a book and the catalog count goes up
- [PASS] Admin dashboard: books deletes a book after confirmation
- [PASS] Admin dashboard: books does nothing when the admin cancels the delete confirmation
- [PASS] Admin dashboard: users an admin cannot delete their own account
- [PASS] Admin dashboard: users an admin can remove another user after confirming

## src/__tests__/Register.test.jsx

- [PASS] Register page renders all four fields and a link back to sign in
- [PASS] Register page rejects mismatched passwords without calling the API
- [PASS] Register page rejects passwords shorter than 6 characters
- [PASS] Register page accepts a password of exactly 6 characters
- [PASS] Register page submits name, email and password (not the confirmation) and goes to /browse
- [PASS] Register page shows the server error, for example a duplicate email

## src/__tests__/RequestBook.test.jsx

- [PASS] RequestBook: loading fills the category dropdown and preselects the first category
- [PASS] RequestBook: loading lists my requests with a status badge each
- [PASS] RequestBook: loading shows an empty state when there are no requests
- [PASS] RequestBook: loading shows an error with a working Retry when the list fails to load
- [PASS] RequestBook: submitting submits the form values, confirms success, clears the fields and refreshes the list
- [PASS] RequestBook: submitting refuses a title that is only whitespace and does not call the API
- [PASS] RequestBook: submitting shows the server message when submission fails and keeps what was typed
- [PASS] RequestBook: submitting disables the form while the request is in flight

## src/__tests__/routeGuards.test.jsx

- [PASS] ProtectedRoute redirects anonymous visitors to /login and remembers where they came from
- [PASS] ProtectedRoute shows the page to a logged-in user
- [PASS] ProtectedRoute shows the page to an admin too
- [PASS] AdminRoute redirects anonymous visitors to /login
- [PASS] AdminRoute keeps regular users out and sends them to /browse
- [PASS] AdminRoute lets admins in

## src/__tests__/useDebounce.test.js

- [PASS] useDebounce returns the initial value immediately
- [PASS] useDebounce only updates after the delay has elapsed
- [PASS] useDebounce restarts the timer on every change and keeps only the last value
- [PASS] useDebounce uses a 400ms default delay
- [PASS] useDebounce cancels the pending timer on unmount
