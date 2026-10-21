/**
 * Apple-style motion review: frames of an iOS push, a pop, a receding sheet and the gift reveal.
 *   npx playwright test --config=playwright.capture.config.ts apple
 * Output: screenshots/apple/*.png
 */
import { expect, test } from '@playwright/test'
import { mkdirSync } from 'node:fs'

test('apple motion frames', async ({ page }) => {
  test.setTimeout(120_000)
  const out = 'screenshots/apple'
  mkdirSync(out, { recursive: true })
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.goto('/')
  await page.getByRole('button', { name: 'Начать' }).click()
  await page.waitForURL(/\/home$/)
  await page.waitForTimeout(1500)

  // push: Home → Create
  await page.getByRole('link', { name: 'Создать игру' }).first().click()
  await page.waitForTimeout(160)
  await page.screenshot({ path: `${out}/1-push-160ms.png` })
  await page.waitForTimeout(600)
  // pop: Create → Home
  await page.getByRole('button', { name: 'Назад' }).first().click()
  await page.waitForTimeout(160)
  await page.screenshot({ path: `${out}/2-pop-160ms.png` })
  await page.waitForTimeout(700)

  // receding sheet
  await page.goto('/wishlist')
  await page.waitForTimeout(800)
  await page.getByRole('button', { name: 'Добавить желание' }).click()
  await page.waitForTimeout(650)
  await page.screenshot({ path: `${out}/3-sheet.png` })
  await page.keyboard.press('Escape')

  // reveal: closed lid, mid-flight, card
  await page.goto('/rooms/r-family/reveal')
  await page.waitForTimeout(1200)
  await page.screenshot({ path: `${out}/4-reveal-closed.png` })
  await page.getByRole('button', { name: 'Открыть подарок' }).press('Enter')
  await page.waitForTimeout(420)
  await page.screenshot({ path: `${out}/5-reveal-lid.png` })
  await expect(page.getByRole('heading', { name: 'Твой получатель…' })).toBeVisible({ timeout: 3000 })
  await page.waitForTimeout(700)
  await page.screenshot({ path: `${out}/6-reveal-card.png` })
})
