/**
 * Transition timing breakdown (design review, not in the regular suite):
 * pointerdown → new <main> mounted (render) → main settled (animation). 5 runs, prints medians.
 *   npx playwright test --config=playwright.capture.config.ts timing
 */
import { expect, test } from '@playwright/test'

test('transition timing breakdown', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.goto('/')
  await page.getByRole('button', { name: 'Начать' }).click()
  await expect(page).toHaveURL(/\/home$/)
  const runs: { render: number; total: number }[] = []
  for (let i = 0; i < 5; i++) {
    await page.goto('/home')
    await page.waitForTimeout(800)
    await page.evaluate(() => {
      const w = window as unknown as { t: { down?: number; mount?: number; done?: number } }
      w.t = {}
      window.addEventListener('pointerdown', () => (w.t.down = performance.now()), { capture: true, once: true })
      const old = document.querySelector('main')
      const loop = () => {
        const m = document.querySelector('main')
        if (m && m !== old && !w.t.mount) w.t.mount = performance.now()
        if (m && m !== old) {
          const cs = getComputedStyle(m)
          if (cs.opacity === '1' && (cs.transform === 'none' || cs.transform === 'matrix(1, 0, 0, 1, 0, 0)')) return (w.t.done = performance.now())
        }
        requestAnimationFrame(loop)
      }
      requestAnimationFrame(loop)
    })
    await page.getByRole('link', { name: 'Создать игру' }).first().click()
    await page.waitForFunction(() => (window as unknown as { t: { done?: number } }).t.done)
    const t = await page.evaluate(() => (window as unknown as { t: { down: number; mount: number; done: number } }).t)
    runs.push({ render: Math.round(t.mount - t.down), total: Math.round(t.done - t.down) })
  }
  const med = (k: 'render' | 'total') => runs.map((r) => r[k]).sort((a, b) => a - b)[2]
  console.log('runs', JSON.stringify(runs), 'median render', med('render'), 'median total', med('total'))
})
