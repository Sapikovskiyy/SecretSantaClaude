/**
 * Critical-path breakdown for the first screen (design review, not in the regular suite).
 * Same throttling as perf.spec.ts. Prints document/DCL/FCP and each resource's start → end.
 *   npx playwright test --config=playwright.capture.config.ts critpath
 */
import { test } from '@playwright/test'

test('critical path', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ serviceWorkers: 'block', viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true })
  const page = await context.newPage()
  const cdp = await context.newCDPSession(page)
  await cdp.send('Network.enable')
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true })
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 40, downloadThroughput: (9 * 1024 * 1024) / 8, uploadThroughput: (3 * 1024 * 1024) / 8 })
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
  await page.goto(baseURL + '/', { waitUntil: 'load' })
  await page.waitForTimeout(2000)
  const out = await page.evaluate(() => {
    const r = (performance.getEntriesByType('resource') as PerformanceResourceTiming[]).map(
      (e) => `${Math.round(e.startTime).toString().padStart(5)} → ${Math.round(e.responseEnd).toString().padStart(5)}  ${(e.transferSize / 1024).toFixed(0).padStart(4)} KB  ${e.name.split('/').pop()}`,
    )
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    return { nav: `doc ${Math.round(nav.responseEnd)} dcl ${Math.round(nav.domContentLoadedEventEnd)}`, fcp: Math.round(performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? 0), r }
  })
  console.log(out.nav, 'fcp', out.fcp)
  out.r.slice(0, 14).forEach((l) => console.log(l))
  await context.close()
})
