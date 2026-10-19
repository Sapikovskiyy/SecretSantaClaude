/**
 * Milestone 6: the Telegram SDK loads async. Outside Telegram the app never waits for
 * telegram.org; inside Telegram it binds the SDK before the first render.
 */
import { expect, test } from '@playwright/test'

test('outside Telegram the SDK is never requested, even if telegram.org hangs', async ({ page }) => {
  const hits: string[] = []
  await page.route('https://telegram.org/**', (route) => {
    hits.push(route.request().url()) // never answered: a hung telegram.org must not matter
  })
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Тайного')
  expect(hits).toEqual([])
})

test('inside Telegram the SDK is bound before the first render', async ({ page }) => {
  // Stub SDK: a minimal WebApp with initData and a delay, like a slow network.
  await page.route('https://telegram.org/js/telegram-web-app.js', async (route) => {
    await new Promise((r) => setTimeout(r, 800))
    await route.fulfill({
      contentType: 'application/javascript',
      body: `window.Telegram = { WebApp: {
        initData: 'query_id=test', initDataUnsafe: { user: { first_name: 'Даниил' }, start_param: 'SANTA5' },
        isVersionAtLeast: () => false, ready() {}, expand() {},
        BackButton: { show() {}, hide() {}, onClick() {}, offClick() {} }, HapticFeedback: {},
      } }`,
    })
  })
  await page.goto('/#tgWebAppData=query_id%3Dtest&tgWebAppVersion=7.0')
  // start_param from the SDK opens the join flow; in-app back circles are hidden inside Telegram
  await expect(page).toHaveURL(/\/join\/SANTA5/)
  await expect(page.getByText('Вас зовут в Тайного Санту')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Назад' })).toHaveCount(0)
})
