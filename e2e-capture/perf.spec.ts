/**
 * First-load performance (design review, not in the regular suite).
 * Throttled like a mid-range Android on 4G: CPU ×4, 9 Mbit/s down, 40 ms RTT, cold cache,
 * service worker blocked. Each screen is loaded in a fresh context. Reports FCP, LCP,
 * transferred KB per resource type (from CDP encodedDataLength) and request count.
 *   PERF_LABEL=<name> npx playwright test --config=playwright.capture.config.ts perf
 */
import { test, type Browser } from '@playwright/test'
import { writeFileSync, mkdirSync } from 'node:fs'

const LABEL = process.env.PERF_LABEL ?? 'run'
const RUNS = Number(process.env.PERF_RUNS ?? 3)

async function measure(browser: Browser, url: string, onboarded: boolean, baseURL: string) {
  const context = await browser.newContext({ serviceWorkers: 'block', viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true })
  if (onboarded)
    await context.addInitScript(() => localStorage.setItem('santomi-demo-v3', JSON.stringify({ state: { onboarded: true }, version: 0 })))
  const page = await context.newPage()
  const cdp = await context.newCDPSession(page)
  await cdp.send('Network.enable')
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true })
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 40, downloadThroughput: (9 * 1024 * 1024) / 8, uploadThroughput: (3 * 1024 * 1024) / 8 })
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
  const type: Record<string, string> = {}
  const bytes: Record<string, number> = {}
  let requests = 0
  cdp.on('Network.responseReceived', (e) => (type[e.requestId] = e.type))
  cdp.on('Network.loadingFinished', (e) => {
    requests++
    const t = (type[e.requestId] ?? 'Other').toLowerCase()
    bytes[t] = (bytes[t] ?? 0) + e.encodedDataLength
  })
  await page.goto(baseURL + url, { waitUntil: 'load' })
  await page.waitForTimeout(2500)
  const m = await page.evaluate(
    () =>
      new Promise<{ fcp: number; lcp: number; criticalKb: number; criticalReq: number }>((resolve) => {
        let lcp = 0
        new PerformanceObserver((l) => {
          for (const e of l.getEntries()) lcp = e.startTime
        }).observe({ type: 'largest-contentful-paint', buffered: true })
        setTimeout(() => {
          // bytes that had to arrive before the largest paint (prefetch after idle is excluded)
          const res = (performance.getEntriesByType('resource') as PerformanceResourceTiming[]).filter((r) => r.responseEnd <= lcp)
          const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
          const criticalKb = Math.round((res.reduce((a, r) => a + r.transferSize, 0) + nav.transferSize) / 1024)
          resolve({ fcp: Math.round(performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? 0), lcp: Math.round(lcp), criticalKb, criticalReq: res.length + 1 })
        }, 300)
      }),
  )
  await context.close()
  const kb = Object.fromEntries(Object.entries(bytes).map(([k, v]) => [k, Math.round(v / 1024)]))
  return { ...m, requests, kb, totalKb: Object.values(kb).reduce((a, b) => a + b, 0) }
}

test('first load metrics', async ({ browser, baseURL }) => {
  test.setTimeout(240_000)
  const results: Record<string, unknown> = {}
  for (const [name, url, onboarded] of [
    ['welcome', '/', false],
    ['home', '/home', true],
  ] as const) {
    const runs = []
    for (let i = 0; i < RUNS; i++) runs.push(await measure(browser, url, onboarded, baseURL!))
    const med = (k: 'fcp' | 'lcp' | 'criticalKb') => runs.map((r) => r[k]).sort((a, b) => a - b)[Math.floor(RUNS / 2)]
    results[name] = { fcp: med('fcp'), lcp: med('lcp'), criticalKb: med('criticalKb'), criticalReq: runs[0].criticalReq, requests: runs[0].requests, kb: runs[0].kb, totalKb: runs[0].totalKb }
    console.log(name, JSON.stringify(results[name]))
  }
  mkdirSync('screenshots/perf', { recursive: true })
  writeFileSync(`screenshots/perf/${LABEL}.json`, JSON.stringify(results, null, 2))
})
