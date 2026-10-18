import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: false,
  reporter: [['list']],
  use: {
    baseURL: process.env.PW_BASE ?? 'http://localhost:4173',
    trace: 'retain-on-failure',
  },
  // Uses the locally installed Edge/Chrome (PW_CHANNEL=chrome) to avoid extra
  // browser downloads; CI can unset the channel after `playwright install`.
  projects: [
    { name: 'iphone', use: { ...devices['iPhone 13'], browserName: 'chromium', channel: process.env.PW_CHANNEL ?? 'msedge' } },
    // Spec §7.5: 390×844 (iPhone 13 above) and 360×800 (compact Android).
    { name: 'android', use: { ...devices['Pixel 7'], viewport: { width: 360, height: 800 }, channel: process.env.PW_CHANNEL ?? 'msedge' } },
  ],
  webServer: {
    command: 'npx vite build --mode demo && npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
