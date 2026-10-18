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
  // Both CTAs must be fully visible without scrolling on every tested phone size.
  for (const name of ['Начать', 'Присоединиться к игре']) {
    const box = await page.getByRole('button', { name }).boundingBox()
    expect(box, name).not.toBeNull()
    expect(box!.y + box!.height, `${name} above the fold`).toBeLessThanOrEqual(page.viewportSize()!.height)
  }
  await page.getByRole('button', { name: 'Начать' }).click()
  await expect(page).toHaveURL(/\/home$/)
  await expect(page.getByRole('heading', { name: 'Мои игры' })).toBeVisible()
  await page.waitForTimeout(500)
  await shots('02-home', page, info.project.name)
  await page.goto('/')
  await expect(page).toHaveURL(/\/home$/)
})

test('create a room, invite, add demo participants, run the draw and reveal', async ({ page }, info) => {
  await enterApp(page)
  await page.getByRole('link', { name: 'Создать игру' }).first().click()
  await expect(page.getByRole('heading', { name: 'Создать игру' })).toBeVisible()
  // validation keeps the user on step 1
  await page.getByRole('button', { name: 'Далее' }).click()
  await expect(page.getByText('Введите название — хотя бы 2 буквы')).toBeVisible()
  await page.getByLabel('Название игры').fill('Тестовая игра')
  await page.getByLabel('Бюджет на подарок').selectOption('2000')
  await page.waitForTimeout(400)
  await shots('03-create', page, info.project.name)
  await page.getByRole('button', { name: 'Далее' }).click()
  await expect(page.getByLabel('Максимум участников')).toBeVisible()
  await page.getByRole('button', { name: 'Далее' }).click()
  await expect(page.getByText('Всё готово к приглашению друзей')).toBeVisible()
  await page.getByRole('button', { name: 'Создать игру' }).click()

  await expect(page).toHaveURL(/\/invite\?new=1/)
  await expect(page.getByRole('heading', { name: 'Пригласить друзей' })).toBeVisible()
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Добавить тестового участника' }).click()
  await expect(page.getByText('Участники (4 из 10)')).toBeVisible()
  await page.waitForTimeout(500)
  await shots('04-invite', page, info.project.name)
  // real QR generated from the invite URL
  await page.getByRole('button', { name: 'Показать QR-код' }).click()
  await expect(page.locator('[role="img"][aria-label^="QR-код ссылки"] svg')).toBeVisible()
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Перейти к игре' }).click()

  await expect(page.getByText('Участники').first()).toBeVisible()
  // new screens open at the top, not at the previous screen's scroll position
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
  await page.waitForTimeout(2600) // let join toasts fade for a clean screenshot
  await shots('05-room', page, info.project.name)
  await page.getByRole('button', { name: 'Перейти к жеребьёвке' }).click()

  await expect(page.getByRole('heading', { name: 'Проверьте участников' })).toBeVisible()
  await page.waitForTimeout(500)
  await shots('09-draw', page, info.project.name)
  await page.getByRole('button', { name: 'Запустить жеребьёвку' }).click()
  await page.getByRole('button', { name: 'Запустить', exact: true }).click()
  await expect(page.getByText('Жеребьёвка проведена')).toBeVisible()
  await page.getByRole('button', { name: 'Узнать, кому я дарю' }).click()

  await expect(page).toHaveURL(/\/reveal$/)
  await page.waitForTimeout(600)
  await shots('10-reveal-idle', page, info.project.name)
  // The gift gently sways, so open it via keyboard (also checks a11y).
  await page.getByRole('button', { name: 'Открыть подарок' }).press('Enter')
  await expect(page.getByText('Ты даришь подарок')).toBeVisible({ timeout: 4000 })
  await expect(page.getByText('Несколько подсказок')).toBeVisible()
  await page.waitForTimeout(900)
  await shots('10-reveal-open', page, info.project.name)
})

test('draw cannot run twice; participants cannot start it', async ({ page }) => {
  await enterApp(page)
  // Seeded "Друзья с универа": 4 members, I'm the organizer.
  await page.goto('/rooms/r-friends/draw')
  await page.getByRole('button', { name: 'Запустить жеребьёвку' }).click()
  await page.getByRole('button', { name: 'Запустить', exact: true }).click()
  await expect(page.getByText('Жеребьёвка проведена')).toBeVisible()
  await page.goto('/rooms/r-friends')
  await expect(page.getByRole('button', { name: 'Перейти к жеребьёвке' })).toHaveCount(0)
  await page.goto('/rooms/r-friends/draw')
  await expect(page).toHaveURL(/\/rooms\/r-friends$/)
  // In the family room I'm not the organizer → the draw screen redirects away.
  await page.goto('/rooms/r-family/draw')
  await expect(page).toHaveURL(/\/rooms\/r-family$/)
})

test('participants: exclusions, impossible configuration, reminders', async ({ page }, info) => {
  await enterApp(page)
  await page.goto('/rooms/r-friends/participants')
  await expect(page.getByRole('heading', { name: /Участники \(4/ })).toBeVisible()
  await page.getByRole('button', { name: 'Напомнить' }).first().click()
  await expect(page.getByText(/Напоминание для .* отправлено/)).toBeVisible()
  // Build exclusions until the draw becomes impossible: me ⇄ everyone.
  for (const other of ['Даша', 'Егор', 'Кира']) {
    await page.getByRole('button', { name: 'Добавить исключение' }).first().click()
    await page.getByLabel('Кто').selectOption({ label: 'Вы' })
    await page.getByLabel('Кому нельзя').selectOption({ label: other })
    await page.getByRole('dialog').getByRole('button', { name: 'Добавить исключение' }).click()
  }
  await expect(page.getByText('Пары не сложатся').first()).toBeVisible()
  await page.waitForTimeout(400)
  await shots('06-participants', page, info.project.name)
  await page.getByRole('tab', { name: 'Правила' }).click()
  await expect(page.getByText(/Пары видит только сервер/)).toBeVisible()
  // The draw screen blocks the impossible configuration
  await page.goto('/rooms/r-friends/draw')
  await expect(page.getByRole('button', { name: 'Запустить жеребьёвку' })).toBeDisabled()
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
  await expect(page.getByText(/Жеребьёвку проведёт организатор/)).toBeVisible()
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

test('gift AI: topic guard, results, saving, free limit leads to AI Plus', async ({ page }, info) => {
  await enterApp(page)
  await page.goto('/ai')
  await expect(page.getByText('Найду идеальный подарок')).toBeVisible()
  // off-topic request is refused before any generation is spent
  await page.getByLabel('Что ищем').fill('напиши код на python')
  await page.getByLabel('Что ищем').press('Enter')
  await expect(page.getByText('Gift AI помогает только с подарками', { exact: false })).toBeVisible()
  await expect(page.getByText('Бесплатно осталось: 3 из 3')).toBeVisible()

  await page.getByLabel('Что ищем').fill('что-то уютное, любит кофе')
  await page.getByRole('button', { name: 'Подобрать идеи' }).last().click()
  await expect(page.getByRole('heading', { name: 'Рекомендации' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Сохранить идею' })).toHaveCount(5)
  await page.getByRole('button', { name: 'Сохранить идею' }).first().click()
  await expect(page.getByRole('button', { name: 'Сохранённые идеи (1)' })).toBeVisible()
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(2600)
  await shots('12-ai', page, info.project.name)
  await page.getByRole('button', { name: 'Предложи дешевле' }).click()
  await page.getByRole('button', { name: 'Попробуй ещё' }).click()
  await expect(page.getByText('Бесплатно осталось: 0 из 3')).toBeVisible()
  await page.getByRole('button', { name: 'Что-то необычное' }).click()
  await expect(page.getByText('Бесплатные подборы закончились')).toBeVisible()
  await page.getByRole('button', { name: 'Подробнее об AI Plus' }).click()
  await expect(page).toHaveURL(/\/premium$/)
})

test('gift AI uses the revealed recipient', async ({ page }) => {
  await enterApp(page)
  await page.goto('/rooms/r-family/reveal')
  await page.getByRole('button', { name: 'Пропустить' }).click()
  await page.goto('/ai?room=r-family')
  await expect(page.getByText('Найду идеи подарков для Вика')).toBeVisible()
  await page.getByRole('button', { name: 'Подобрать для Вика' }).click()
  await expect(page.getByRole('heading', { name: 'Рекомендации для Вика' })).toBeVisible()
})

test('animation runtimes stay lazy: no Rive/dotLottie download without real assets', async ({ page }) => {
  const heavy: string[] = []
  page.on('request', (r) => {
    if (/RivePlayer|LottiePlayer|\.wasm|unpkg\.com|jsdelivr\.net/.test(r.url())) heavy.push(r.url())
  })
  await enterApp(page)
  await page.goto('/ai')
  await expect(page.getByText('Найду идеальный подарок')).toBeVisible()
  await page.goto('/rooms/r-friends/draw')
  await page.getByRole('button', { name: 'Запустить жеребьёвку' }).click()
  await page.getByRole('button', { name: 'Запустить', exact: true }).click()
  await expect(page.getByText('Жеребьёвка проведена')).toBeVisible()
  expect(heavy, heavy.join('\n')).toEqual([])
})

test('AI Plus never simulates a payment', async ({ page }, info) => {
  await enterApp(page)
  await page.goto('/premium')
  await expect(page.getByRole('heading', { name: 'Подарки на новом уровне' })).toBeVisible()
  await page.waitForTimeout(1600)
  await shots('13-ai-plus', page, info.project.name)
  await page.getByRole('button', { name: /Купить за 99/ }).click()
  await expect(page.getByText('Оплата появится скоро')).toBeVisible()
})

test('profile and 404', async ({ page }, info) => {
  await enterApp(page)
  await page.goto('/profile')
  await expect(page.getByText('Активные игры')).toBeVisible()
  await expect(page.getByText('Прошлые игры')).toBeVisible()
  // no fake logout without a separate login
  await expect(page.getByText(/Выйти/)).toHaveCount(0)
  await page.waitForTimeout(500)
  await shots('14-profile', page, info.project.name)
  await page.goto('/does-not-exist')
  await expect(page.getByText('Такой страницы нет')).toBeVisible()
})

test('home shows reveal hero and games list', async ({ page }) => {
  await enterApp(page)
  await expect(page.getByText('Жеребьёвка прошла!')).toBeVisible()
  await expect(page.getByRole('link', { name: /Семейный Новый год/ })).toBeVisible()
  await page.getByText('Жеребьёвка прошла!').click()
  await expect(page).toHaveURL(/\/reveal$/)
})

test('no horizontal overflow on key screens', async ({ page }) => {
  await enterApp(page)
  for (const path of ['/home', '/rooms/new', '/rooms/r-friends/invite', '/rooms/r-friends', '/rooms/r-friends/participants', '/rooms/r-friends/draw', '/wishlist', '/wishlist/interests', '/ai', '/premium', '/profile', '/rooms/r-family', '/rooms/r-family/reveal', '/join/SANTA5']) {
    await page.goto(path)
    await page.waitForTimeout(400)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow, path).toBeLessThanOrEqual(1)
  }
})
