import { expect } from '@playwright/test'

export class HomePage {
  constructor(page) {
    this.navigation = page.getByRole('navigation')
    this.logoutButton = page.getByRole('button', { name: 'Logout' })
    this.userMenu = page.locator('.user-section')
    this.signOutMenuItem = page.getByText('Sign Out')
    this.content = page.locator('.content')
  }

  async logout() {
    await this.logoutButton.click()
  }

  async expectLoggedIn() {
    await expect(this.navigation).toBeVisible()
    await expect(this.logoutButton).toBeVisible()
  }
}
