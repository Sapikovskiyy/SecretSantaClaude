/**
 * Milestone 5 — motion checks against design-handoff/MOTION_SPEC_RU.md.
 * Measures real timings in the browser (no «60 fps» claims): screen transition,
 * reveal sequence, idle main-thread animation work, reduced motion, sheet gestures.
 */
import { expect, test, type Page } from '@playwright/test'

async function enterApp(page: Page) {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Тайного')
  await page.getByRole('button', { name: 'Начать' }).click()
  await expect(page).toHaveURL(/\/home$/)
}

/** Waits until <main> is fully opaque and untransformed; returns ms since `t0` (performance.now). */
const settled = (page: Page, t0: number) =>
  page.evaluate(async (start) => {
    for (;;) {
      const m = document.querySelector('main')
      if (m) {
        const cs = getComputedStyle(m)
        if (cs.opacity === '1' && (cs.transform === 'none' || cs.transform === 'matrix(1, 0, 0, 1, 0, 0)')) return performance.now() - start
      }
      await new Promise((r) => requestAnimationFrame(r))
    }
  }, t0)

test('screen transition settles quickly (regression guard; clean median ≈ 275 ms, see e2e-capture/timing)', async ({ page }) => {
  await enterApp(page)
  await page.waitForTimeout(600)
  // t0 = the real pointerdown inside the page (excludes Playwright's own round-trip)
  await page.evaluate(() => window.addEventListener('pointerdown', () => ((window as unknown as { t0: number }).t0 = performance.now()), { capture: true, once: true }))
  await page.getByRole('link', { name: 'Создать игру' }).first().click()
  await page.waitForURL(/\/rooms\/new$/)
  const t0 = await page.evaluate(() => (window as unknown as { t0: number }).t0)
  const ms = await settled(page, t0)
  test.info().annotations.push({ type: 'transition-ms', description: String(Math.round(ms)) })
  // Catches regressions only (e.g. a blocking render); clean median ≈ 275 ms in e2e-capture/timing.spec.ts.
  expect(ms).toBeLessThan(1000)
})

test('reveal: card within 2.2 s, skip shows the final state at once', async ({ page }) => {
  await enterApp(page)
  await page.goto('/rooms/r-family/reveal')
  const t0 = Date.now()
  await page.getByRole('button', { name: 'Открыть подарок' }).press('Enter')
  await expect(page.getByRole('heading', { name: 'Твой получатель…' })).toBeVisible({ timeout: 2200 })
  test.info().annotations.push({ type: 'reveal-ms', description: String(Date.now() - t0) })

  // A fresh unrevealed room: Skip jumps straight to the card.
  await page.evaluate(() => localStorage.clear())
  await enterApp(page)
  await page.goto('/rooms/r-family/reveal')
  await page.getByRole('button', { name: 'Пропустить' }).click()
  await expect(page.getByRole('heading', { name: 'Твой получатель…' })).toBeVisible({ timeout: 500 })
})

test('reduced motion: reveal shows the card without the sequence', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 390, height: 844 } })
  const page = await ctx.newPage()
  await enterApp(page)
  await page.goto('/rooms/r-family/reveal')
  await page.getByRole('button', { name: 'Открыть подарок' }).press('Enter')
  await expect(page.getByRole('heading', { name: 'Твой получатель…' })).toBeVisible({ timeout: 600 })
  // CSS ambient loops are disabled
  await page.goto('/welcome')
  await page.waitForTimeout(1000)
  const loops = await page.evaluate(() =>
    document
      .getAnimations()
      .filter((a) => a.playState === 'running' && a.effect?.getTiming().iterations === Infinity && Number(a.effect?.getTiming().duration) > 50)
      .map((a) => (a as CSSAnimation).animationName ?? 'js'),
  )
  expect(loops).toEqual([])
  await ctx.close()
})

test('idle Home does no continuous JS animation work', async ({ page }) => {
  await enterApp(page)
  await page.waitForTimeout(1500) // entrances finished
  // Count Web Animations / Motion-driven style writes over one second: only cheap CSS loops may run.
  const jsAnimated = await page.evaluate(async () => {
    let writes = 0
    const obs = new MutationObserver((list) => (writes += list.filter((m) => m.attributeName === 'style').length))
    obs.observe(document.body, { attributes: true, subtree: true, attributeFilter: ['style'] })
    await new Promise((r) => setTimeout(r, 1000))
    obs.disconnect()
    return writes
  })
  expect(jsAnimated).toBeLessThan(5)
})

test('sheet: inputs are editable, drag from the handle closes it', async ({ page }) => {
  await enterApp(page)
  await page.goto('/wishlist')
  await page.getByRole('button', { name: 'Добавить желание' }).click()
  const sheet = page.getByRole('dialog', { name: 'Новое желание' })
  await expect(sheet).toBeVisible()
  const input = sheet.getByPlaceholder('Например, фотоаппарат моментальной печати')
  // dragging inside the form must not move or close the sheet
  const box = (await input.boundingBox())!
  await page.mouse.move(box.x + 20, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + 20, box.y + 220, { steps: 6 })
  await page.mouse.up()
  await expect(sheet).toBeVisible()
  await input.fill('Плед')
  await expect(input).toHaveValue('Плед')
  // the handle closes it (wait for the open spring to settle first)
  await page.waitForTimeout(500)
  const top = (await sheet.locator('[data-sheet-handle]').boundingBox())!
  await page.mouse.move(top.x + top.width / 2, top.y + top.height / 2)
  await page.mouse.down()
  for (let dy = 20; dy <= 320; dy += 20) await page.mouse.move(top.x + top.width / 2, top.y + top.height / 2 + dy)
  await page.mouse.up()
  await expect(sheet).toBeHidden()
})
