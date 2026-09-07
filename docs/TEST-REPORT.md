# Test report

**Tested:** login of the Vue 3 app, version 1.1.1, production build.

**Run:** 7 September 2026, Chromium and Firefox locally. WebKit runs in CI.

## 1. Result

**Not releasable.** Blocked by BUG-1, BUG-2, BUG-3, BUG-6 and BUG-9.

## 2. Numbers

- 48 tests, 2 browsers, 96 runs, about 30 seconds
- 82 passed
- 14 expected failures: seven known bugs, once per browser
- 0 unexpected failures, 0 flaky, 0 skipped

### Proving the tests can fail

I broke the credential check in `src/App.vue` on purpose, so any input logged in as the first user, and ran
the login spec in Chromium. The rejected-login tests failed as they should, and the tests for the second and
third account failed because the wrong email was stored. Then I restored the file.

## 3. Traceability

| Requirement | Tests | Bugs |
| --- | --- | --- |
| Login with the given users | TC01-01 to TC01-25 | |
| Session in `localStorage` | TC02-01 to TC02-03, TC02-06, TC02-08, TC01-25 | BUG-3 |
| Session when storage is blocked | TC05-01 to TC05-03 | BUG-9 |
| Navigation bar with menu and user profile | TC02-05, TC02-07, TC03-07 | BUG-2, BUG-7 |
| Responsive layout | TC04-01, TC04-02 | |
| Logout through the dropdown | TC02-02, TC02-05 | BUG-2 |
| Edge cases | TC01-20 to TC01-25 | |
| Accessibility | TC03-01 to TC03-07 | BUG-4, BUG-5, BUG-7 |
| Console output | TC01-25, TC02-09 | BUG-8 |

## 4. Bugs

| ID | Title | Severity | Test |
| --- | --- | --- | --- |
| BUG-1 | Page content is invisible after login | High | TC02-04 |
| BUG-2 | Sign Out in the user menu cannot be used | Medium | TC02-05 |
| BUG-3 | Any value in `localStorage` counts as a valid session | High, security | TC02-06 |
| BUG-4 | Logout button fails WCAG AA contrast | Low | TC03-02 |
| BUG-5 | Login error is not announced to screen readers | Medium | TC03-05 |
| BUG-6 | Accounts and login logic are shipped to the browser | Security, by design | none |
| BUG-7 | User menu cannot be reached with the keyboard | Medium | TC03-07 |
| BUG-8 | Logged-in email is written to the console | Low | TC02-09 |
| BUG-9 | Login silently does nothing when storage is blocked | Medium | TC05-03 |

Each bug with a test is marked `test.fail()`, so the run is green now and goes red when the bug is fixed.

### BUG-1: Page content is invisible after login

1. Open the app and log in with `growdev@growdev.com.br` / `growdev123`.
2. Look between the navigation bar and the footer.

**Actual:** empty. The three paragraphs are in the DOM with `display: none`.
**Expected:** the page content is visible after login.
**Cause:** `css/style.css` still has `.content { display: none }` from the old `js/index.js` version, and `App.vue` never overrides it. Fix: `display: flex`.

![Content hidden, computed style in dev tools](media/bug-1-content-hidden.jpg)

### BUG-2: Sign Out in the user menu cannot be used

1. Log in.
2. Click the user icon in the navigation bar.

**Actual:** nothing visible. The dropdown is added to the DOM but stays `display: none`. The separate Logout button works.
**Expected:** the menu opens with a working Sign Out.
**Cause:** the stylesheet shows `.logout` only with an `active` class that the old script added; `App.vue` uses `v-if` and never adds it. Fix: remove `display: none` from `.logout`.

![Dropdown in the DOM but hidden](media/bug-2-signout-hidden.jpg)

### BUG-3: Any value in `localStorage` counts as a valid session

1. Open the app without logging in.
2. In the console run `localStorage.logged = 'anything'`.
3. Reload.

**Actual:** the logged-in page is shown.
**Expected:** the login form stays, the value is rejected.
**Cause:** the check is `!!localStorage.getItem('logged')`. Not fixable in a client-only app; needs a backend session or token.

![Forged session value accepted](media/bug-3-forged-session.jpg)

### BUG-4: Logout button fails WCAG AA contrast

1. Log in.
2. Run an axe scan (or TC03-02).

**Actual:** `color-contrast` violation on the Logout button, 3.96:1.
**Expected:** at least 4.5:1 for normal text.
**Cause:** white on `#d9534f`. Fix: use the existing hover colour `#c9302c` as default.

![axe color-contrast violation](media/bug-4-logout-contrast.jpg)

### BUG-5: Login error is not announced to screen readers

1. Turn on a screen reader (VoiceOver: Cmd+F5).
2. Enter a valid email and a wrong password, submit.

**Actual:** the error appears on screen, nothing is read out.
**Expected:** the error is announced when it appears.
**Cause:** the error is a plain `<div>` with no role or live region; axe does not catch this. Fix: `role="alert"`.

![Error message without role](media/bug-5-error-not-announced.jpg)

### BUG-6: Accounts and login logic are shipped to the browser

1. Open dev tools, Sources tab.
2. Search the bundle for `admin@admin.com`.

**Actual:** all emails and passwords are in the bundle, and the comparison runs in the browser.
**Expected:** credentials never reach the browser; login is checked on a backend.
**Why it is not fixed:** the task requires the users in `users.js`. BUG-3 follows from the same design.

![Credentials in the bundle](media/bug-6-credentials-in-bundle.jpg)

### BUG-7: User menu cannot be reached with the keyboard

1. Log in.
2. Press Tab repeatedly.

**Actual:** focus lands on the Logout button and then leaves the page. The user icon never gets focus.
**Expected:** every control in the navigation bar can be reached with the keyboard (WCAG 2.1.1).
**Cause:** the icon is a `<div>` with a click handler; a div is not focusable. Fix: make it a `<button>` with `aria-label="User menu"`.

![Focus skips the user icon](media/bug-7.png)

### BUG-8: Logged-in email is written to the console

1. Open the console.
2. Log in, or reload while logged in.

**Actual:** `User logged: <email>` in the console.
**Expected:** no personal data in the console of a production build.
**Cause:** a `console.log` in `checkLogged()`. Fix: remove it.

![Email in the console](media/bug-8.png)

### BUG-9: Login silently does nothing when storage is blocked

1. Block site data for the app (Firefox: Settings, Privacy and Security, Manage Exceptions, Block), or run TC05-02.
2. Open the app and log in with valid credentials.

**Actual:** nothing happens. The form stays filled in, no error is shown, the button can be pressed again with the same result. The console has an exception.
**Expected:** the user is told the login could not be completed.
**Cause:** `localStorage.setItem` throws and `logIn()` has no `try`/`catch`. Fix: catch it and set `errorMessage`.

![Form unchanged after submit, error only in the console](media/bug-9.png)

## 5. Repository notes

- The template `package-lock.json` pointed at an internal Nexus registry and `npm ci` failed in GitHub Actions.
  It was regenerated against public npm.
- Vitest was picking up the Playwright specs. `vite.config.js` now limits it to `js/**/*.test.js`.
- `js/index.js` and `index-vue.html` are not used by the app. They are left as they are, since they are
  application files.
