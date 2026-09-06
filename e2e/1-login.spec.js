import { test, expect } from './support/fixtures'
import { validUsers, validUser, otherUser, edgeInput } from './support/testData'
import { getSession, dumpLocalStorage } from './support/session'

test.describe('Successful login', () => {
  test(
    'TC01-01 - shows the login form with a User field, Password field and LOGIN button',
    { tag: '@smoke' },
    async ({ loginPage }) => {
      await expect(loginPage.heading).toBeVisible()
      await expect(loginPage.emailInput).toBeVisible()
      await expect(loginPage.passwordInput).toBeVisible()
      await expect(loginPage.loginButton).toBeEnabled()
    },
  )

  // Every account from js/users.js, not only the first one.
  for (const user of validUsers) {
    test(
      `TC01-02 - logs in with a valid account: ${user.email}`,
      { tag: '@smoke' },
      async ({ loginPage, homePage, page }) => {
        await loginPage.login(user.email, user.password)

        await homePage.expectLoggedIn()
        expect(await getSession(page)).toBe(user.email)
      },
    )
  }

  test('TC01-03 - submits the form with the Enter key', async ({ loginPage, homePage }) => {
    await loginPage.emailInput.fill(validUser.email)
    await loginPage.passwordInput.fill(validUser.password)
    await loginPage.passwordInput.press('Enter')

    await homePage.expectLoggedIn()
  })

  test('TC01-04 - shows an empty login form again after logging out', async ({ loginPage, homePage }) => {
    await loginPage.login(validUser.email, validUser.password)
    await homePage.expectLoggedIn()

    await homePage.logout()

    await loginPage.expectToBeVisible()
    await expect(loginPage.emailInput).toHaveValue('')
    await expect(loginPage.passwordInput).toHaveValue('')
  })
})

test.describe('Rejected login', () => {
  // Same steps and same expected result for all of them, so they are data-driven.
  const rejectedAttempts = [
    { id: 'TC01-05', name: 'a wrong password', email: validUser.email, password: 'wrong-password' },
    { id: 'TC01-06', name: 'an unknown email', email: 'nobody@example.com', password: validUser.password },
    { id: 'TC01-07', name: 'an empty email and password', email: '', password: '' },
    { id: 'TC01-08', name: 'an empty password', email: validUser.email, password: '' },
    { id: 'TC01-09', name: 'an empty email', email: '', password: validUser.password },
    {
      id: 'TC01-10',
      name: "a valid email with another user's password",
      email: validUser.email,
      password: otherUser.password,
    },
    {
      id: 'TC01-11',
      name: 'the password in a different letter case',
      email: validUser.email,
      password: validUser.password.toUpperCase(),
    },
    {
      id: 'TC01-12',
      name: 'the email in a different letter case',
      email: validUser.email.toUpperCase(),
      password: validUser.password,
    },
    {
      id: 'TC01-13',
      name: 'the email with surrounding spaces',
      email: `  ${validUser.email}  `,
      password: validUser.password,
    },
    {
      id: 'TC01-14',
      name: 'the password with surrounding spaces',
      email: validUser.email,
      password: ` ${validUser.password} `,
    },
  ]

  for (const attempt of rejectedAttempts) {
    test(`${attempt.id} - rejects ${attempt.name}`, async ({ loginPage, page }) => {
      await loginPage.login(attempt.email, attempt.password)

      await loginPage.expectLoginRejected()
      expect(await getSession(page)).toBeNull()
    })
  }

  test(
    'TC01-15 - does not reveal whether the email or the password was wrong',
    { tag: '@smoke' },
    async ({ loginPage }) => {
      await loginPage.login('nobody@example.com', validUser.password)
      await loginPage.expectLoginRejected()

      await loginPage.login(validUser.email, 'wrong-password')
      await loginPage.expectLoginRejected()
    },
  )

  test('TC01-16 - hides the error message as soon as the user starts typing again', async ({ loginPage }) => {
    await loginPage.login(validUser.email, 'wrong-password')
    await loginPage.expectLoginRejected()

    await loginPage.passwordInput.press('a')

    await expect(loginPage.errorMessage).toBeHidden()
  })

  test('TC01-17 - lets the user log in with correct credentials after a failed attempt', async ({
    loginPage,
    homePage,
  }) => {
    await loginPage.login(validUser.email, 'wrong-password')
    await loginPage.expectLoginRejected()

    await loginPage.login(validUser.email, validUser.password)

    await homePage.expectLoggedIn()
  })

  test('TC01-18 - keeps working after many failed attempts in a row', async ({ loginPage, homePage }) => {
    for (let i = 1; i <= 5; i++) {
      await loginPage.login(validUser.email, `wrong-password-${i}`)
      await loginPage.expectLoginRejected()
    }

    await loginPage.login(validUser.email, validUser.password)

    await homePage.expectLoggedIn()
  })

  test('TC01-19 - does not put the credentials in the URL', async ({ loginPage, page }) => {
    await loginPage.login(validUser.email, 'wrong-password')
    await loginPage.expectLoginRejected()

    const url = new URL(page.url())
    expect(url.search).toBe('')
    expect(url.href).not.toContain(validUser.email)
  })
})

test.describe('Edge cases and unusual input', () => {
  test('TC01-20 - masks the password while typing', async ({ loginPage }) => {
    await expect(loginPage.passwordInput).toHaveAttribute('type', 'password')
  })

  test('TC01-21 - treats HTML in the fields as plain text and never runs it', async ({ loginPage, page }) => {
    const titleBefore = await page.title()

    await loginPage.login(edgeInput.htmlTag, edgeInput.imageWithHandler)

    await loginPage.expectLoginRejected()
    // If either payload had been rendered as HTML, the title would have changed.
    expect(await page.title()).toBe(titleBefore)
    await expect(page.locator('img[onerror]')).toHaveCount(0)
    await expect(loginPage.emailInput).toHaveValue(edgeInput.htmlTag)
  })

  test('TC01-22 - treats a SQL-style string as an ordinary wrong credential', async ({ loginPage, page }) => {
    await loginPage.login(edgeInput.sqlString, edgeInput.sqlString)

    await loginPage.expectLoginRejected()
    expect(await getSession(page)).toBeNull()
  })

  test('TC01-23 - rejects oversized input and stays usable afterwards', async ({ loginPage, homePage, page }) => {
    await loginPage.login(edgeInput.oversized, edgeInput.oversized)

    await loginPage.expectLoginRejected()
    expect(await getSession(page)).toBeNull()

    await loginPage.login(validUser.email, validUser.password)
    await homePage.expectLoggedIn()
  })

  test('TC01-24 - keeps non-Latin letters and emoji intact in both fields', async ({ loginPage }) => {
    await loginPage.emailInput.fill(edgeInput.mixedScripts)
    await loginPage.passwordInput.fill(edgeInput.mixedScripts)

    await expect(loginPage.emailInput).toHaveValue(edgeInput.mixedScripts)
    await expect(loginPage.passwordInput).toHaveValue(edgeInput.mixedScripts)
  })

  test('TC01-25 - never exposes the password in the page, the browser console or storage', async ({
    loginPage,
    homePage,
    page,
    consoleMessages,
  }) => {
    const wrongPassword = 'Wrong-Pw-For-Leak-Check-71c'
    await loginPage.login(validUser.email, wrongPassword)
    await loginPage.expectLoginRejected()
    expect(await page.content()).not.toContain(wrongPassword)

    await loginPage.login(validUser.email, validUser.password)
    await homePage.expectLoggedIn()

    const console = consoleMessages.join('\n')
    expect(await page.content()).not.toContain(validUser.password)
    expect(await dumpLocalStorage(page)).not.toContain(validUser.password)
    expect(console).not.toContain(wrongPassword)
    expect(console).not.toContain(validUser.password)
  })
})
