import { test as base } from '@playwright/test'
import { LoginPage } from './pages/loginPage'
import { HomePage } from './pages/homePage'
import { validUser } from './testData'

// Each test gets its own browser context, so its own cookies and localStorage.
export const test = base.extend({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await use(loginPage)
  },

  homePage: async ({ page }, use) => {
    await use(new HomePage(page))
  },

  // Logged in through the real form, not by writing localStorage.
  // Seeding the storage would only work because of BUG-3 (any value counts as a session),
  // and a test setup should not depend on a defect. The login is three actions, so it is cheap.
  loggedInHomePage: async ({ loginPage, homePage }, use) => {
    await loginPage.login(validUser.email, validUser.password)
    await homePage.expectLoggedIn()
    await use(homePage)
  },

  // Collects everything the page writes to the browser console during the test.
  consoleMessages: async ({ page }, use) => {
    const messages = []
    page.on('console', (message) => {
      messages.push(message.text())
      // Firefox prints Error objects as "JSHandle@object", so read the message out of them as well.
      for (const arg of message.args()) {
        arg
          .evaluate((value) => (value instanceof Error ? value.message : null))
          .then((text) => text && messages.push(text))
          .catch(() => {})
      }
    })
    page.on('pageerror', (error) => messages.push(error.message))
    await use(messages)
  },
})

export { expect } from '@playwright/test'
