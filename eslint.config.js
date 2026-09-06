import playwright from 'eslint-plugin-playwright'

// Lint rules for the test code. The Playwright plugin knows the usual mistakes in E2E tests:
// a forgotten test.only, hard-coded waits, assertions that do not auto-wait, and so on.
export default [
  {
    ...playwright.configs['flat/recommended'],
    files: ['e2e/**/*.js'],
  },
  {
    files: ['e2e/**/*.js'],
    rules: {
      'playwright/no-focused-test': 'error', // a leftover test.only would silently shrink the suite
      'playwright/no-wait-for-timeout': 'error', // sleeps hide timing problems instead of fixing them
      'playwright/no-skipped-test': 'error', //  skipped test needs a ticket, not a skip
      // Page objects hold assertions in methods called expect...(), so those count as assertions too.
      'playwright/expect-expect': [
        'warn',
        { assertFunctionNames: ['expectLoggedIn', 'expectToBeVisible', 'expectLoginRejected'] },
      ],
    },
  },
]
