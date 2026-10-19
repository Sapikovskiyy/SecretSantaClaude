// Design-review captures (not part of the regular test suite):
//   npx playwright test --config=playwright.capture.config.ts
// Writes full-page and viewport screenshots + layout metrics to screenshots/capture/<label>.
import { defineConfig, devices } from '@playwright/test'

// PW_PORT isolates a run (own port, build dir and results) so parallel sessions don't collide.
const PORT = process.env.PW_PORT ?? '4173'
const ISOLATED = PORT !== '4173'
const OUT = ISOLATED ? `dist-e2e-${PORT}` : 'dist'

export default defineConfig({
  outputDir: ISOLATED ? `test-results-${PORT}` : 'test-results',
  testDir: './e2e-capture',
  timeout: 60_000,
  reporter: [['list']],
  use: {
    ...devices['iPhone 13'],
    browserName: 'chromium',
    channel: process.env.PW_CHANNEL ?? 'msedge',
    viewport: { width: 390, height: 844 },
    baseURL: `http://localhost:${PORT}`,
  },
  webServer: {
    command: `npx vite build --mode demo --outDir ${OUT} && npx vite preview --port ${PORT} --strictPort --outDir ${OUT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
