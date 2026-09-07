import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    open: true
  },
  test: {
    // Vitest runs the unit test only. The Playwright specs in e2e/ have their own runner.
    include: ['js/**/*.test.js']
  }
})
