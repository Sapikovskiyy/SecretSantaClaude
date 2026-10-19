import { defineConfig, devices } from '@playwright/test'

// PW_PORT isolates a run (own port, build dir and results) so parallel sessions don't collide.
const PORT = process.env.PW_PORT ?? '4173'
const ISOLATED = PORT !== '4173'
const OUT = ISOLATED ? `dist-e2e-${PORT}` : 'dist'

export default defineConfig({
  outputDir: ISOLATED ? `test-results-${PORT}` : 'test-results',
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: false,
  // One retry absorbs cold-start timing on a loaded machine; a real bug still fails twice.
  retries: 1,
  reporter: [['list']],
  use: {
    baseURL: process.env.PW_BASE ?? `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  // Uses the locally installed Edge/Chrome (PW_CHANNEL=chrome) to avoid extra
  // browser downloads; CI can unset the channel after `playwright install`.
  projects: [
    { name: 'iphone', use: { ...devices['iPhone 13'], browserName: 'chromium', channel: process.env.PW_CHANNEL ?? 'msedge' } },
    // Spec §7.5 + typography brief §10: 390×844 (above), 360×800, 375×812, 430×932.
    { name: 'android', use: { ...devices['Pixel 7'], viewport: { width: 360, height: 800 }, channel: process.env.PW_CHANNEL ?? 'msedge' } },
    { name: 'iphone-mini', use: { ...devices['iPhone 13 Mini'], browserName: 'chromium', viewport: { width: 375, height: 812 }, channel: process.env.PW_CHANNEL ?? 'msedge' } },
    { name: 'iphone-max', use: { ...devices['iPhone 14 Pro Max'], browserName: 'chromium', viewport: { width: 430, height: 932 }, channel: process.env.PW_CHANNEL ?? 'msedge' } },
  ],
  webServer: {
    command: `npx vite build --mode demo --outDir ${OUT} && npx vite preview --port ${PORT} --strictPort --outDir ${OUT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
