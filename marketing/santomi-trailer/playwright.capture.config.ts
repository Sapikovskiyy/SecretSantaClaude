// Captures real Santomi demo-mode screens for the trailer (does not modify the app).
// Run from the repo root:  npx playwright test --config=marketing/santomi-trailer/playwright.capture.config.ts
import { defineConfig, devices } from '@playwright/test'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '../..')

export default defineConfig({
  testDir: resolve(here, 'scripts'),
  testMatch: /capture(-chat)?\.spec\.ts/,
  timeout: 180_000,
  reporter: [['list']],
  use: {
    ...devices['iPhone 13'],
    browserName: 'chromium',
    channel: process.env.PW_CHANNEL ?? 'msedge',
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    baseURL: 'http://localhost:4173',
    reducedMotion: 'reduce',
  },
  webServer: {
    command: 'npx vite build --mode demo && npx vite preview --port 4173 --strictPort',
    cwd: root,
    url: 'http://localhost:4173',
    reuseExistingServer: true,
    timeout: 180_000,
  },
})
