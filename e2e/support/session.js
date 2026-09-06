const SESSION_KEY = 'logged'

// Value the app keeps in localStorage after login, or null.
export function getSession(page) {
  return page.evaluate((key) => localStorage.getItem(key), SESSION_KEY)
}

// Writes the session value directly, to simulate tampering.
export function setSession(page, value) {
  return page.evaluate(([key, v]) => localStorage.setItem(key, v), [SESSION_KEY, value])
}

// Whole localStorage as one string, for "the password is not stored" checks.
export function dumpLocalStorage(page) {
  return page.evaluate(() => JSON.stringify(localStorage))
}

// Makes every localStorage access throw, like a browser with site data blocked.
// Must run before the page loads, so it is registered with addInitScript.
export function blockLocalStorage(page) {
  return page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new DOMException('Storage is disabled in this browser', 'SecurityError')
      },
    })
  })
}
