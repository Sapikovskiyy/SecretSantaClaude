import { expect, test, type Page } from '@playwright/test'

const shots = (name: string, page: Page, project: string) =>
  page.screenshot({ path: `screenshots/${project}/${name}.png` })

async function start(page: Page) {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Тайного')
}

async function enterApp(page: Page) {
  await start(page)
  await page.getByRole('button', { name: 'Начать' }).click()
  await expect(page).toHaveURL(/\/home$/)
}

test('welcome → home, returning user skips onboarding', async ({ page }, info) => {
  await start(page)
  await page.waitForTimeout(1200)
  await shots('01-welcome', page, info.project.name)
  await page.getByRole('button', { name: 'Начать' }).click()
  await expect(page).toHaveURL(/\/home$/)
  await expect(page.getByText('Мои игры')).toBeVisible()
  await page.waitForTimeout(500)
  await shots('02-home', page, info.project.name)
  await page.goto('/')
  await expect(page).toHaveURL(/\/home$/)
})

test('create a room, invite, add demo participants, run the draw and reveal', async ({ page }, info) => {
  await enterApp(page)
  await page.getByRole('link', { name: /Создать\s*игру/ }).click()
  await page.getByLabel('Название игры').fill('Тестовая игра')
  await page.getByRole('button', { name: 'Далее' }).first().click()
  await expect(page.getByRole('heading', { name: 'Какой бюджет подарка?' })).toBeVisible()
  await page.getByRole('button', { name: '3 000 ₽' }).click()
  await page.waitForTimeout(400)
  await shots('03-create-budget', page, info.project.name)
  await page.getByRole('button', { name: 'Далее' }).first().click()
  await expect(page.getByRole('heading', { name: 'Когда обмен подарками?' })).toBeVisible()
  await page.waitForTimeout(300)
  await page.getByRole('button', { name: 'Далее' }).first().click()
  await expect(page.getByText('Почти готово')).toBeVisible()
  await page.getByRole('button', { name: 'Создать игру' }).first().click()

  await expect(page).toHaveURL(/\/invite\?new=1/)
  await expect(page.getByText('Зовите друзей в игру')).toBeVisible()
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Добавить тестового участника' }).click()
  await expect(page.getByText('4 участника')).toBeVisible()
  await shots('04-invite', page, info.project.name)
  await page.getByRole('link', { name: 'Перейти к игре' }).click()

  await shots('05-room', page, info.project.name)
  await page.getByRole('button', { name: 'Провести жеребьёвку' }).first().click()
  await expect(page).toHaveURL(/\/reveal$/)
  await page.waitForTimeout(600)
  await shots('06-reveal-sealed', page, info.project.name)
  // The envelope gently wiggles, so open it via keyboard (also checks a11y).
  await page.getByRole('button', { name: 'Открыть конверт' }).press('Enter')
  await expect(page.getByText('Вы — Тайный Санта для')).toBeVisible({ timeout: 5000 })
  await page.waitForTimeout(900)
  await shots('07-reveal-open', page, info.project.name)
})

test('draw cannot run twice and needs 3 people', async ({ page }) => {
  await enterApp(page)
  // Seeded "Друзья с универа" has 4 members and I'm the organizer → run draw.
  await page.goto('/rooms/r-friends')
  await page.getByRole('button', { name: 'Провести жеребьёвку' }).first().click()
  await expect(page).toHaveURL(/\/reveal$/)
  await page.goto('/rooms/r-friends')
  await expect(page.getByRole('button', { name: 'Провести жеребьёвку' })).toHaveCount(0)
})

test('join by invite code and invalid code state', async ({ page }, info) => {
  await enterApp(page)
  await page.goto('/join/NOPE00')
  await expect(page.getByText('Приглашение не найдено')).toBeVisible()
  await page.goto('/join/SANTA5')
  await expect(page.getByText('Вас зовут в Тайного Санту')).toBeVisible()
  await page.waitForTimeout(500)
  await shots('08-join', page, info.project.name)
  await page.getByRole('button', { name: 'Присоединиться' }).first().click()
  await expect(page).toHaveURL(/\/rooms\/r-office$/)
  await expect(page.getByText('Ждём жеребьёвку').first()).toBeVisible()
})

test('telegram-style startapp deep link opens the join flow', async ({ page }) => {
  await enterApp(page)
  await page.goto('/?startapp=SANTA5')
  await expect(page).toHaveURL(/\/join\/SANTA5$/)
})

test('wishlist: interests, add, edit and remove items', async ({ page }, info) => {
  await enterApp(page)
  await page.goto('/wishlist/interests')
  await expect(page.getByRole('heading', { name: 'Какие у вас интересы?' })).toBeVisible()
  await page.waitForTimeout(700)
  await shots('07-interests-empty', page, info.project.name)
  await page.getByRole('checkbox', { name: 'Уют' }).click()
  await page.getByRole('checkbox', { name: 'Книги' }).click()
  await page.getByRole('checkbox', { name: 'Игры' }).click()
  await expect(page.getByRole('checkbox', { name: 'Книги' })).toHaveAttribute('aria-checked', 'true')
  await expect(page.getByText('Выбрано: 3')).toBeVisible()
  await page.waitForTimeout(400)
  await shots('07-interests-selected', page, info.project.name)
  await page.getByRole('button', { name: 'Продолжить' }).click()
  await expect(page).toHaveURL(/\/wishlist$/)
  await expect(page.getByRole('button', { name: 'Мои интересы (3)' })).toBeVisible()

  // Empty wishlist → editor for a new item
  await expect(page.getByText('Добавьте первое желание')).toBeVisible()
  await page.waitForTimeout(400)
  await shots('08-wishlist-empty', page, info.project.name)

  // URL validation error state
  await page.getByPlaceholder('Например, фотоаппарат моментальной печати').fill('Плед')
  await page.getByPlaceholder('https://').fill('ozon')
  await expect(page.getByRole('alert').filter({ hasText: 'https://' })).toBeVisible()
  await page.getByRole('button', { name: 'Очистить ссылку' }).click()

  await page.getByPlaceholder('Примерно').fill('3500')
  await page.getByRole('radio', { name: 'Высокий' }).click()
  await page.getByRole('button', { name: 'Добавить в вишлист' }).click()
  await expect(page.getByRole('option', { name: 'Плед' })).toBeVisible()

  await page.getByRole('button', { name: 'Добавить желание' }).click()
  await page.getByPlaceholder('Например, фотоаппарат моментальной печати').fill('Кофемолка')
  await page.getByRole('button', { name: 'Добавить в вишлист' }).click()
  await expect(page.getByRole('tab', { name: 'Товары (2)' })).toBeVisible()

  // Edit → save state
  await page.getByRole('option', { name: 'Плед' }).click()
  await expect(page.getByRole('button', { name: 'Сохранено' })).toBeDisabled()
  await page.getByPlaceholder('Например, фотоаппарат моментальной печати').fill('Шерстяной плед')
  await page.getByPlaceholder('Цвет, размер, модель — всё, что поможет Санте').fill('Серый или бежевый, 150×200')
  await page.waitForTimeout(400)
  await shots('08-wishlist-edit', page, info.project.name)
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(2600) // let toasts disappear for a clean reference comparison
  await shots('08-wishlist-top', page, info.project.name)
  await page.getByRole('button', { name: 'Сохранить изменения' }).click()
  await expect(page.getByRole('option', { name: 'Шерстяной плед' })).toBeVisible()

  // Delete via the item menu
  await page.getByRole('button', { name: 'Действия с желанием' }).click()
  await page.getByRole('button', { name: 'Удалить желание' }).click()
  await expect(page.getByRole('option', { name: 'Шерстяной плед' })).toHaveCount(0)
  await expect(page.getByRole('tab', { name: 'Товары (1)' })).toBeVisible()
})

test('anonymous chat: send message and receive simulated reply; no santa identity', async ({ page }, info) => {
  await enterApp(page)
  await page.goto('/rooms/r-family/reveal')
  await page.getByRole('button', { name: 'Пропустить' }).click()
  await page.goto('/rooms/r-family/chat/fromSanta')
  await expect(page.getByText('Твой Тайный Санта', { exact: true })).toBeVisible()
  await expect(page.getByText('Вы общаетесь анонимно')).toBeVisible()
  // The Santa's real name must not appear anywhere in the anonymous chat.
  for (const name of ['Аня', 'Борис', 'Глеб']) await expect(page.getByText(name, { exact: false })).toHaveCount(0)
  await page.waitForTimeout(500)
  await shots('11-chat-incoming', page, info.project.name)
  await page.getByLabel('Сообщение').fill('Привет, Санта! Обожаю настольные игры')
  await page.getByRole('button', { name: 'Отправить' }).click()
  await expect(page.getByText('Привет, Санта! Обожаю настольные игры')).toBeVisible()
  await expect(page.getByLabel('Доставлено').last()).toBeVisible()
  await expect(page.getByText(/Принято|Интересно|Отлично, кажется|Больше ничего не скажу/)).toBeVisible({ timeout: 5000 })
  await page.waitForTimeout(400)
  await shots('11-chat', page, info.project.name)

  // Santa side: suggestion card sends a question
  await page.goto('/rooms/r-family/chat/toRecipient')
  await expect(page.getByText('Попробуйте спросить')).toBeVisible()
  await page.getByRole('button', { name: 'Как ты любишь проводить зиму?' }).click()
  await expect(page.getByRole('log').getByText('Как ты любишь проводить зиму?')).toBeVisible()
})

test('anonymous chat: offline send fails and can be retried', async ({ page, context }) => {
  await enterApp(page)
  await page.goto('/rooms/r-family/reveal')
  await page.getByRole('button', { name: 'Пропустить' }).click()
  await page.goto('/rooms/r-family/chat/fromSanta')
  await context.setOffline(true)
  await page.getByLabel('Сообщение').fill('Сообщение без сети')
  await page.getByRole('button', { name: 'Отправить' }).click()
  await expect(page.getByText('Не отправлено. Повторить')).toBeVisible()
  await context.setOffline(false)
  await page.getByText('Не отправлено. Повторить').click()
  await expect(page.getByText('Не отправлено. Повторить')).toHaveCount(0)
  await expect(page.getByLabel('Доставлено').last()).toBeVisible()
})

test('gift AI: wizard, results, free limit leads to premium info', async ({ page }, info) => {
  await enterApp(page)
  await page.goto('/ai')
  await page.getByRole('button', { name: 'Друг' }).click()
  await page.getByRole('button', { name: 'Дальше' }).click()
  await page.getByRole('button', { name: 'Дальше' }).click()
  await page.getByRole('button', { name: 'Кофе и чай' }).click()
  await page.getByRole('button', { name: 'Дальше' }).click()
  await page.getByRole('button', { name: 'Подобрать идеи' }).click()
  await expect(page.getByText('Вот что подойдёт')).toBeVisible({ timeout: 5000 })
  await page.waitForTimeout(600)
  await shots('12-ai', page, info.project.name)
  await page.getByRole('button', { name: 'Предложи дешевле' }).click()
  await expect(page.getByText('Вот что подойдёт')).toBeVisible({ timeout: 5000 })
  await page.getByRole('button', { name: 'Попробуй ещё' }).click()
  await expect(page.getByText('Вот что подойдёт')).toBeVisible({ timeout: 5000 })
  await page.getByRole('button', { name: 'Что-то необычное' }).click()
  await expect(page.getByText('Бесплатные подборы закончились')).toBeVisible()
})

test('premium never simulates a payment', async ({ page }, info) => {
  await enterApp(page)
  await page.goto('/premium')
  await page.waitForTimeout(500)
  await shots('13-premium', page, info.project.name)
  await page.getByRole('button', { name: 'Подключить за Stars' }).first().click()
  await expect(page.getByText('Оплата появится скоро')).toBeVisible()
})

test('profile and 404', async ({ page }, info) => {
  await enterApp(page)
  await page.goto('/profile')
  await expect(page.getByText('Santomi AI Plus')).toBeVisible()
  await page.waitForTimeout(500)
  await shots('14-profile', page, info.project.name)
  await page.goto('/does-not-exist')
  await expect(page.getByText('Такой страницы нет')).toBeVisible()
})

test('no horizontal overflow on key screens', async ({ page }) => {
  await enterApp(page)
  for (const path of ['/home', '/wishlist', '/wishlist/interests', '/ai', '/profile', '/rooms/r-family', '/join/SANTA5']) {
    await page.goto(path)
    await page.waitForTimeout(400)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow, path).toBeLessThanOrEqual(1)
  }
})
