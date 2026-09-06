import AxeBuilder from '@axe-core/playwright'
import { test, expect } from './support/fixtures'
import { validUser } from './support/testData'

// test.fail() marks a known defect: the test describes the correct behaviour (see docs/TEST-REPORT.md).

// axe-core scan against WCAG 2.0 and 2.1, level A and AA.
function scanForWcagViolations(page) {
  return new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
}

test.describe('Accessibility', () => {
  test('TC03-01 - login page has no WCAG A/AA violations', { tag: '@smoke' }, async ({ loginPage, page }) => {
    await loginPage.expectToBeVisible()

    const { violations } = await scanForWcagViolations(page)

    expect(violations).toEqual([])
  })

  test('TC03-06 - login page with the error message shown has no WCAG A/AA violations', async ({ loginPage, page }) => {
    await loginPage.login(validUser.email, 'wrong-password')
    await loginPage.expectLoginRejected()

    const { violations } = await scanForWcagViolations(page)

    expect(violations).toEqual([])
  })

  test('TC03-02 - logged-in page has only the one known WCAG violation', async ({ loginPage, homePage, page }) => {
    // BUG-4 (Logout button contrast) is the only accepted violation. Anything else is new and fails here.
    // When BUG-4 is fixed this test fails too, and the expected list should become empty.
    await loginPage.login(validUser.email, validUser.password)
    await homePage.expectLoggedIn()

    const { violations } = await scanForWcagViolations(page)

    expect(violations.map((v) => v.id)).toEqual(['color-contrast'])
    expect(violations[0].nodes.map((n) => n.html)).toEqual([expect.stringContaining('btn-logout')])
  })

  test('TC03-03 - puts the cursor in the User field on load and labels both fields', async ({ loginPage }) => {
    await expect(loginPage.emailInput).toBeFocused()
    await expect(loginPage.emailInput).toHaveAccessibleName('User')
    await expect(loginPage.passwordInput).toHaveAccessibleName('Password')
  })

  test('TC03-04 - login can be completed with the keyboard only', async ({ loginPage, homePage, page }) => {
    await loginPage.emailInput.focus()
    await page.keyboard.type(validUser.email)
    await page.keyboard.press('Tab')
    await expect(loginPage.passwordInput).toBeFocused()
    await page.keyboard.type(validUser.password)
    await page.keyboard.press('Enter')

    await homePage.expectLoggedIn()
  })

  test('TC03-05 - announces the error message to screen readers', async ({ loginPage, page }) => {
    test.fail(true, 'BUG-5: the error banner is a plain <div> without role="alert", so screen readers stay silent.')

    await loginPage.login(validUser.email, 'wrong-password')

    await expect(page.getByRole('alert')).toHaveText('Invalid email or password. Please try again.')
  })

  test('TC03-07 - user menu in the navigation bar can be reached with the keyboard', async ({
    loggedInHomePage,
    page,
  }) => {
    test.fail(true, 'BUG-7: the user icon is a <div> with a click handler, so Tab never reaches it.')

    // Tab through the logged-in page and collect what receives focus.
    const focused = []
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('Tab')
      focused.push(await page.evaluate(() => document.activeElement.className))
    }

    await expect(loggedInHomePage.logoutButton).toBeVisible()
    expect(focused).toContain('user-section')
  })
})
