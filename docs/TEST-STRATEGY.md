# Test strategy

## 1. What is under test

A Vue 3 single-page app with login feature. Three accounts are hardcoded in the source. After login the
user's email is stored in `localStorage`. The logged-in page has a navigation bar, placeholder content and a
Logout button. There is no backend and/or API present.

`README-Vue.md` lists the features and is used as the requirements: login, session in `localStorage`,
navigation bar with user menu, responsive design, logout through a dropdown.

## 2. What is tested

- The login form loads, the first field has focus, both fields are labelled, the password is masked.
- All three accounts can log in, with the button and with Enter.
- Wrong, unknown, empty, swapped, differently cased and padded credentials are rejected with one generic error.
- A failed login leaves no session behind and the user can try again.
- Script tags, SQL strings, very long input and not latin text are handled as plain text.
- The password never appears in the URL, the page, the console or storage.
- The session survives reload, logout clears it, a forged session value is documented as a bug.
- Login works with the keyboard only. axe finds no WCAG A/AA violations on the login page, and only the one accepted violation on the logged-in page.
- The layout fits phone screen.
- The app behaves reasonably when the browser blocks `localStorage`.

## 3. Approach

**Risk first.** Login and session are the highest priority: bug there locks out a real user or lets in a wrong one. Then error handling, then edge cases, accessibility and mobile.

**One level.** UI tests in real browsers. There is no API to test below the UI. The unit test only one that came with the app is kept and runs in CI.

**Known bugs stay as tests.** Each known bug has test that asserts the correct behaviour and is marked
`test.fail()`. The run stays passed green. When the bug is fixed, the test passes unexpectedly, the run goes failed, and the
marker is removed on purpose. No skipped.

**Proving the tests can fail.** I broke the credential check in `src/App.vue` by hand and ran the login spec
against it. The tests that should catch it did. Then I restored the file. Details in `TEST-REPORT.md`, section 2.

## 4. Tools and design

- Playwright with JavaScript, axe-core for accessibility, ESLint and Prettier, GitHub Actions.
- Page objects LoginPage and HomePage hold locators and actions. Fixtures give each test a fresh login page in
  its own browser context or  logged-in page or console capture.
- Locators are by role and label, not CSS class. The error banner is the exception because it has no role present(BUG-5).
- Test data comes from `js/users.js`. `App.vue` keeps its own copy of the accounts, and using the file catches drift.
- Tests run against the production build served by `vite preview`. `BASE_URL` points the suite at a deployed  environment instead.

## 5. Not in scope

Lockout, throttling, session expiry, password reset, multifactor login, performance and visual regression. All need a backend or design baseline that does not part of this task here.

## 6. Environments

- Chromium, Firefox and WebKit, desktop 1280 x 720.
- Mobile checks at 393 x 851 by changing the viewport only, so they run in every browser.
- Node 22, Ubuntu in CI, macOS locally.

## 7. Execution

Locally: `npx playwright test`, `npm run test:smoke`, `npm run lint`.

In CI, on every pull request, push to master and nightly:

1. Lint, the unit test and five @smoke tests in Chromium. About a minute.
2. The full suite in three browsers, only if step 1 is green. The HTML report is kept.

Retries are set to one in CI. A test that passes only on retry is flaky and gets investigated.

## 8. Exploratory testing

Done before automation, in the browser with dev tools: valid and invalid logins, long input, Enter, reload,
logout, keyboard, mobile viewport, axe scan, editing `localStorage`. BUG-1, BUG-2 and BUG-4 were found this way.

## 9. Next steps

If a backend arrives: lockout, session expiry, real tokens, API contract tests, security headers. Otherwise: real
mobile devices, visual regression once a design baseline exists.
