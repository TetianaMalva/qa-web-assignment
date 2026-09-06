import { existsSync } from 'node:fs'
import { defineConfig, devices } from '@playwright/test'

/*
 * By default the tests run against the production build served by vite preview, so what
 * gets tested is what a user would get, and Playwright starts and stops that server itself.
 * Set BASE_URL to run the same suite against a deployed environment instead.
 */
if (existsSync('.env')) process.loadEnvFile('.env')

const localUrl = 'http://127.0.0.1:4173'
const baseURL = process.env.BASE_URL || localUrl

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI
    ? [['list'], ['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  // The same suite runs in three browser engines.
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],

  // Only start the local server when the suite is pointed at it.
  webServer:
    baseURL === localUrl
      ? {
          command: 'npm run build && npm run preview -- --host 127.0.0.1 --port 4173 --strictPort',
          url: localUrl,
          reuseExistingServer: !process.env.CI,
          timeout: 120000,
        }
      : undefined,
})
