import { test, expect } from './support/fixtures'
import { validUser } from './support/testData'
import { getSession, setSession } from './support/session'

// test.fail() marks a known defect: the test describes the correct behaviour (see docs/TEST-REPORT.md).

test.describe('Session handling', () => {
  test('TC02-01 - stays logged in after a page reload', async ({ page, loggedInHomePage }) => {
    await page.reload()

    await loggedInHomePage.expectLoggedIn()
  })

  test(
    'TC02-02 - logs out with the Logout button and clears the session',
    { tag: '@smoke' },
    async ({ page, loggedInHomePage, loginPage }) => {
      await loggedInHomePage.logout()

      await loginPage.expectToBeVisible()
      expect(await getSession(page)).toBeNull()
    },
  )

  test('TC02-03 - stays logged out after a reload that follows a logout', async ({
    page,
    loggedInHomePage,
    loginPage,
  }) => {
    await loggedInHomePage.logout()
    await page.reload()

    await loginPage.expectToBeVisible()
  })

  test('TC02-07 - shows Home, Products, Contact and the user icon in the navigation bar', async ({
    loggedInHomePage,
  }) => {
    // README-Vue promises a navigation bar with menu items and a user profile.
    for (const item of ['Home', 'Products', 'Contact']) {
      await expect(loggedInHomePage.navigation.getByText(item)).toBeVisible()
    }
    await expect(loggedInHomePage.userMenu).toBeVisible()
  })

  test('TC02-08 - keeps the session value to the user email only', async ({ page, loggedInHomePage }) => {
    await loggedInHomePage.expectLoggedIn()

    const keys = await page.evaluate(() => Object.keys(localStorage))
    expect(keys).toEqual(['logged'])
    expect(await getSession(page)).toBe(validUser.email)
  })

  test('TC02-04 - shows the page content after login', async ({ loggedInHomePage }) => {
    test.fail(true, 'BUG-1: the content area is hidden by CSS (display: none) after login.')

    await expect(loggedInHomePage.content).toBeVisible()
  })

  test('TC02-05 - offers a working Sign Out entry in the user menu', async ({ loggedInHomePage, loginPage }) => {
    test.fail(true, 'BUG-2: the Sign Out dropdown is rendered but stays invisible (CSS class never applied).')

    await loggedInHomePage.userMenu.click()
    await expect(loggedInHomePage.signOutMenuItem).toBeVisible()

    await loggedInHomePage.signOutMenuItem.click()
    await loginPage.expectToBeVisible()
  })

  test('TC02-09 - does not write the logged-in email to the browser console', async ({
    loginPage,
    homePage,
    consoleMessages,
  }) => {
    test.fail(true, 'BUG-8: the app logs "User logged: <email>" to the console on every login and reload.')

    await loginPage.login(validUser.email, validUser.password)
    await homePage.expectLoggedIn()

    expect(consoleMessages.join('\n')).not.toContain(validUser.email)
  })
})

test.describe('Session tampering', () => {
  test('TC02-06 - does not accept a made-up session value as a login', async ({ page, loginPage }) => {
    test.fail(true, 'BUG-3: any non-empty localStorage value is accepted as a valid session.')

    await setSession(page, 'not-a-real-user')
    await page.reload()

    await loginPage.expectToBeVisible()
  })
})
