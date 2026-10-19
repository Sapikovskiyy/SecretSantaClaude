/**
 * Image weight audit: for every screen, lists <img> whose intrinsic size is far above what is
 * displayed at DPR 3 (wasted bytes), plus eager images below the fold.
 *   npx playwright test --config=playwright.capture.config.ts images
 */
import { test } from '@playwright/test'

const ROUTES = ['/', '/home', '/rooms/new', '/rooms/r-newyear', '/rooms/r-newyear/invite', '/rooms/r-newyear/participants', '/rooms/r-newyear/draw', '/rooms/r-family/reveal', '/wishlist', '/wishlist/interests', '/ai', '/profile', '/premium', '/chats']

test('image sizes vs display', async ({ browser, baseURL }) => {
  test.setTimeout(120_000)
  const ctx = await browser.newContext({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 3, serviceWorkers: 'block' })
  const page = await ctx.newPage()
  await page.goto(baseURL + '/')
  const over = new Map<string, { natural: number; maxShown: number; route: string }>()
  for (const r of ROUTES) {
    await page.goto(baseURL + r)
    await page.waitForTimeout(1200)
    const imgs = await page.evaluate(() =>
      Array.from(document.images).map((i) => ({ src: i.currentSrc.split('/').pop()!.replace(/-[\w-]{8}\.webp$/, ''), natural: i.naturalWidth, shown: i.getBoundingClientRect().width })),
    )
    for (const i of imgs) {
      const prev = over.get(i.src)
      if (!prev || i.shown > prev.maxShown) over.set(i.src, { natural: i.natural, maxShown: Math.round(i.shown), route: r })
    }
  }
  const rows = [...over.entries()].map(([k, v]) => ({ k, ...v, ratio: +(v.natural / (v.maxShown * 3)).toFixed(2) })).sort((a, b) => b.ratio - a.ratio)
  for (const r of rows) console.log(`${r.k.padEnd(14)} natural ${String(r.natural).padStart(4)}  max shown ${String(r.maxShown).padStart(4)} css px (${r.route})  ratio ${r.ratio}`)
  await ctx.close()
})
