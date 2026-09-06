import { test, expect } from './support/fixtures'
import { validUser } from './support/testData'
import { blockLocalStorage } from './support/session'

// The app keeps the whole session in localStorage and never guards the calls.
// Browsers can refuse storage: private mode with site data blocked, a company policy, a full quota.
// test.fail() marks a known defect: the test describes the correct behaviour (see docs/TEST-REPORT.md).

test.describe('Browser with localStorage blocked', () => {
  test.beforeEach(async ({ page }) => {
    await blockLocalStorage(page)
  })

  test('TC05-01 - login form still renders', async ({ loginPage }) => {
    await loginPage.goto()

    await expect(loginPage.emailInput).toBeVisible()
    await expect(loginPage.loginButton).toBeEnabled()
  })

  test('TC05-02 - correct login does nothing and the user is not told why', async ({
    loginPage,
    homePage,
    consoleMessages,
  }) => {
    // Documents the current behaviour, so the expected-failure test below stays a one-liner.
    await loginPage.goto()
    await loginPage.login(validUser.email, validUser.password)

    await expect(loginPage.loginButton).toBeVisible()
    await expect(loginPage.emailInput).toHaveValue(validUser.email)
    await expect(homePage.navigation).toBeHidden()
    await expect(loginPage.errorMessage).toBeHidden()
    // The failure only reaches the developer console, not the user.
    await expect.poll(() => consoleMessages.join('\n')).toContain('Storage is disabled')
  })

  test('TC05-03 - tells the user that the login could not be completed', async ({ loginPage }) => {
    test.fail(true, 'BUG-9: when storage is blocked a correct login silently does nothing.')

    await loginPage.goto()
    await loginPage.login(validUser.email, validUser.password)

    await expect(loginPage.errorMessage).toBeVisible()
  })
})
