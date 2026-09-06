import { expect } from '@playwright/test'

export class LoginPage {
  constructor(page) {
    this.page = page
    this.heading = page.getByRole('heading', { level: 1 })
    this.emailInput = page.getByLabel('User', { exact: true })
    this.passwordInput = page.getByLabel('Password', { exact: true })
    this.loginButton = page.getByRole('button', { name: 'LOGIN' })
    this.errorMessage = page.locator('.error-message')
  }

  async goto() {
    await this.page.goto('/')
  }

  async login(email, password) {
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
    await this.loginButton.click()
  }

  async expectToBeVisible() {
    await expect(this.loginButton).toBeVisible()
  }

  async expectLoginRejected() {
    await expect(this.errorMessage).toHaveText('Invalid email or password. Please try again.')
    await expect(this.loginButton).toBeVisible()
  }
}
