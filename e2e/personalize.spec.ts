/** Room customization (organizer) and profile personalisation. */
import { expect, test, type Page } from '@playwright/test'

async function enterApp(page: Page) {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Тайного')
  await page.getByRole('button', { name: 'Начать' }).click()
  await expect(page).toHaveURL(/\/home$/)
}

test('organizer customizes the game: cover, theme, name, draw date', async ({ page }) => {
  await enterApp(page)
  await page.goto('/rooms/r-newyear')
  await page.getByRole('button', { name: 'Оформление и настройки' }).first().click()
  await expect(page).toHaveURL(/\/rooms\/r-newyear\/customize$/)

  await page.getByRole('radio', { name: 'Сани' }).click()
  await expect(page.getByRole('radio', { name: 'Сани' })).toHaveAttribute('aria-checked', 'true')
  await page.getByRole('radio', { name: 'Красная', exact: true }).click()
  await page.getByLabel('Название', { exact: true }).fill('Корпоратив 2026')
  await expect(page.getByLabel('Предпросмотр карточки игры')).toContainText('Корпоратив 2026')

  // invalid: draw date after the exchange
  const exchange = await page.getByLabel('Дата обмена', { exact: true }).inputValue()
  const after = new Date(new Date(exchange + 'T12:00:00').getTime() + 3 * 864e5).toISOString().slice(0, 10)
  await page.getByLabel('Дата жеребьёвки', { exact: true }).fill(after)
  await page.getByRole('button', { name: 'Сохранить' }).click()
  await expect(page.getByText('Жеребьёвка — до обмена')).toBeVisible()
  await page.getByRole('button', { name: 'Убрать: Дата жеребьёвки' }).click()

  await page.getByRole('button', { name: 'Сохранить' }).click()
  await expect(page).toHaveURL(/\/rooms\/r-newyear$/)
  await expect(page.getByRole('heading', { name: 'Корпоратив 2026' })).toBeVisible()
  await page.goto('/home')
  await expect(page.getByRole('heading', { name: 'Корпоратив 2026' })).toBeVisible()
})

test('Santa+ themes stay locked and lead to the paywall', async ({ page }) => {
  await enterApp(page)
  await page.goto('/rooms/r-newyear/customize')
  await page.getByRole('radio', { name: 'Золотая — в Santa+' }).click()
  await expect(page).toHaveURL(/\/premium$/)
})

test('only the organizer can open customization', async ({ page }) => {
  await enterApp(page)
  await page.goto('/rooms/r-withfriends/customize')
  await expect(page).toHaveURL(/\/rooms\/r-withfriends$/)
  await expect(page.getByRole('button', { name: 'Оформление и настройки' })).toHaveCount(0)
})

test('profile personalisation: name, mascot avatar, bio and sizes', async ({ page }) => {
  await enterApp(page)
  await page.goto('/profile')
  await page.getByRole('button', { name: 'Изменить профиль' }).click()
  await expect(page).toHaveURL(/\/profile\/edit$/)
  await page.getByLabel('Имя', { exact: true }).fill('Даниил')
  await page.getByRole('radio', { name: 'Талисман star' }).click()
  await page.getByLabel('О себе', { exact: true }).fill('Люблю горы, кофе и настолки')
  await page.getByRole('radiogroup', { name: 'Размер одежды' }).getByRole('radio', { name: 'M', exact: true }).click()
  await page.getByRole('radiogroup', { name: 'Размер обуви' }).getByRole('radio', { name: '42' }).click()
  await expect(page.getByLabel('Так вас увидит Санта')).toContainText('Одежда M · обувь 42')
  await page.getByRole('button', { name: 'Сохранить' }).click()

  await expect(page).toHaveURL(/\/profile$/)
  await expect(page.getByRole('heading', { name: 'Даниил' })).toBeVisible()
  await expect(page.getByText('Люблю горы, кофе и настолки')).toBeVisible()
  await page.goto('/wishlist')
  await expect(page.getByText('Одежда M · обувь 42')).toBeVisible()
})

test('profile name is required', async ({ page }) => {
  await enterApp(page)
  await page.goto('/profile/edit')
  await page.getByLabel('Имя', { exact: true }).fill('')
  await page.getByRole('button', { name: 'Сохранить' }).click()
  await expect(page).toHaveURL(/\/profile\/edit$/)
  await expect(page.getByText('Хотя бы 2 буквы', { exact: true })).toBeVisible()
})
