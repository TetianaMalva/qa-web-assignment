import { test, expect } from './support/fixtures'
import { validUser } from './support/testData'

// A common Android phone size. Only the viewport changes, so the same test runs in every browser.
test.use({ viewport: { width: 393, height: 851 } })

function hasHorizontalScroll(page) {
  return page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
}

test.describe('Mobile viewport', () => {
  test('TC04-01 - login form fits the screen without sideways scrolling', async ({ loginPage, page }) => {
    await loginPage.expectToBeVisible()

    expect(await hasHorizontalScroll(page)).toBe(false)

    const form = await page.locator('fieldset').boundingBox()
    expect(form).not.toBeNull()
    expect(form.x).toBeGreaterThanOrEqual(0)
    expect(form.x + form.width).toBeLessThanOrEqual(393)
  })

  test('TC04-02 - login works and the logged-in screen fits as well', async ({ loginPage, homePage, page }) => {
    await loginPage.login(validUser.email, validUser.password)

    await homePage.expectLoggedIn()
    expect(await hasHorizontalScroll(page)).toBe(false)
    // The Logout button is the only way out, so it must be on screen.
    const button = await homePage.logoutButton.boundingBox()
    expect(button.x + button.width).toBeLessThanOrEqual(393)
  })
})
