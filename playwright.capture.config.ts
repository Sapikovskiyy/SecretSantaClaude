// Design-review captures (not part of the regular test suite):
//   npx playwright test --config=playwright.capture.config.ts
// Writes full-page and viewport screenshots + layout metrics to screenshots/capture/<label>.
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e-capture',
  timeout: 60_000,
  reporter: [['list']],
  use: {
    ...devices['iPhone 13'],
    browserName: 'chromium',
    channel: process.env.PW_CHANNEL ?? 'msedge',
    viewport: { width: 390, height: 844 },
    baseURL: 'http://localhost:4173',
  },
  webServer: {
    command: 'npx vite build --mode demo && npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
