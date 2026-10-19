/**
 * Milestone 7 — edge states: very long names, empty data, offline banner, no horizontal
 * overflow with stress content, deep links to unknown rooms.
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

const noHorizontalOverflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)

test('very long game name and description stay inside the layout', async ({ page }) => {
  await enterApp(page)
  await page.getByRole('link', { name: 'Создать игру' }).first().click()
  const long = 'Новогодний обмен подарками для всей большой дружной команды отдела'
  await page.getByLabel('Название игры').fill(long)
  await page.getByLabel('Описание').fill('Очень длинное описание '.repeat(8))
  expect(await noHorizontalOverflow(page)).toBe(true)
  await page.getByRole('button', { name: 'Продолжить' }).click()
  await page.getByRole('button', { name: 'Создать игру' }).click()
  await expect(page).toHaveURL(/\/invite\?new=1/)
  expect(await noHorizontalOverflow(page)).toBe(true)
  await page.getByRole('button', { name: 'Перейти в комнату' }).click()
  expect(await noHorizontalOverflow(page)).toBe(true)
  await page.goto('/home')
  // the newest game is the nearest by date only if earlier; in any case Home must not overflow
  expect(await noHorizontalOverflow(page)).toBe(true)
  await page.goto('/profile')
  expect(await noHorizontalOverflow(page)).toBe(true)
})

test('very long wish title stays inside the card', async ({ page }) => {
  await enterApp(page)
  await page.goto('/wishlist')
  await page.getByRole('button', { name: 'Добавить желание' }).click()
  const sheet = page.getByRole('dialog', { name: 'Новое желание' })
  await sheet.getByPlaceholder('Например, фотоаппарат моментальной печати').fill('Беспроводные наушники с шумоподавлением и длинным названием модели 2026')
  await sheet.getByRole('button', { name: 'Добавить в вишлист' }).click()
  await expect(page.getByRole('list', { name: 'Желания' })).toBeVisible()
  expect(await noHorizontalOverflow(page)).toBe(true)
})

test('unknown room and invite links show friendly states', async ({ page }) => {
  await enterApp(page)
  await page.goto('/rooms/does-not-exist')
  await expect(page.getByText('Такой страницы нет')).toBeVisible()
  await page.goto('/rooms/does-not-exist/reveal')
  await expect(page.getByText('Такой страницы нет')).toBeVisible()
  await page.goto('/join/XXXXXX')
  await expect(page.getByText('Приглашение не найдено')).toBeVisible()
})

test('offline banner appears and disappears', async ({ page, context }) => {
  await enterApp(page)
  await context.setOffline(true)
  await page.evaluate(() => window.dispatchEvent(new Event('offline')))
  await expect(page.getByText(/Нет подключения|офлайн|Нет сети/i).first()).toBeVisible()
  await context.setOffline(false)
  await page.evaluate(() => window.dispatchEvent(new Event('online')))
  await expect(page.getByText(/Нет подключения|офлайн|Нет сети/i)).toHaveCount(0)
})

test('user with no games sees an empty state, not a broken Home', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() =>
    localStorage.setItem('santomi-demo-v3', JSON.stringify({ state: { onboarded: true, rooms: [] }, version: 0 })),
  )
  await page.goto('/home')
  await expect(page.getByRole('heading', { name: 'Первая игра' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Мои игры' })).toHaveCount(0)
  expect(await noHorizontalOverflow(page)).toBe(true)
})
