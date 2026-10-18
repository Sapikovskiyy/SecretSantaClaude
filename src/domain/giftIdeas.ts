/**
 * DEMO gift idea engine.
 * A curated local catalog used to simulate Gift AI in Demo Mode.
 * Price ranges are rough category estimates, not live marketplace prices.
 * In Phase 4 this is replaced by the server-side Yandex AI workflow.
 */
import type { GiftIdea, InterestId } from './types'

const C: Omit<GiftIdea, 'id'>[] = [
  { title: 'Плед из шерсти мериноса', why: 'Тёплый подарок на всю зиму, который будут доставать каждый вечер.', priceMin: 2500, priceMax: 6000, interests: ['home'], tags: ['cozy', 'practical'] },
  { title: 'Набор ароматических свечей', why: 'Создаёт настроение дома, легко подобрать под бюджет.', priceMin: 900, priceMax: 2500, interests: ['home', 'beauty'], tags: ['cozy'] },
  { title: 'Керамическая кружка ручной работы', why: 'Единственная в своём роде — такую точно ни у кого нет.', priceMin: 800, priceMax: 2200, interests: ['home', 'coffee'], tags: ['unusual', 'cozy'] },
  { title: 'Подписка на книжный сервис на 3 месяца', why: 'Тысячи книг и аудиокниг без похода в магазин.', priceMin: 900, priceMax: 1500, interests: ['books'], tags: ['practical'] },
  { title: 'Книжный бокс-сюрприз', why: 'Книга, закладка и чай в одной коробке — приятно распаковывать.', priceMin: 1500, priceMax: 3500, interests: ['books', 'coffee'], tags: ['unusual', 'cozy'] },
  { title: 'Лампа для чтения с клипсой', why: 'Удобно читать в кровати, не мешая другим.', priceMin: 700, priceMax: 1800, interests: ['books'], tags: ['practical'] },
  { title: 'Настольная игра для компании', why: 'Подарок, который соберёт друзей за одним столом.', priceMin: 1500, priceMax: 4500, interests: ['games'], tags: ['experience'] },
  { title: 'Подарочная карта игрового магазина', why: 'Получатель сам выберет игру из своего списка желаний.', priceMin: 1000, priceMax: 5000, interests: ['games', 'tech'], tags: ['practical'] },
  { title: 'Головоломка-шкатулка из дерева', why: 'Красиво на полке и интересно разгадывать.', priceMin: 1200, priceMax: 3000, interests: ['games', 'creative'], tags: ['unusual'] },
  { title: 'Кофе свежей обжарки из трёх стран', why: 'Маленькое путешествие по вкусам для кофемана.', priceMin: 1200, priceMax: 2800, interests: ['coffee'], tags: ['experience'] },
  { title: 'Ручная кофемолка', why: 'Свежемолотый кофе каждое утро — заметная разница во вкусе.', priceMin: 2000, priceMax: 5500, interests: ['coffee'], tags: ['practical'] },
  { title: 'Набор чая с травяными сборами', why: 'Красивая упаковка и много вкусов на зимние вечера.', priceMin: 800, priceMax: 2000, interests: ['coffee', 'home'], tags: ['cozy'] },
  { title: 'Беспроводная зарядная станция', why: 'Заряжает телефон, часы и наушники в одном месте.', priceMin: 2000, priceMax: 5000, interests: ['tech'], tags: ['practical'] },
  { title: 'Умная лампа с настройкой цвета', why: 'Меняет атмосферу комнаты с телефона.', priceMin: 1500, priceMax: 4000, interests: ['tech', 'home'], tags: ['unusual'] },
  { title: 'Портативная колонка', why: 'Музыка с собой — дома, в поездке и на прогулке.', priceMin: 2500, priceMax: 7000, interests: ['tech', 'music'], tags: ['practical'] },
  { title: 'Пластинка любимого исполнителя', why: 'Ценный подарок для тех, у кого есть проигрыватель.', priceMin: 2500, priceMax: 6000, interests: ['music'], tags: ['unusual'] },
  { title: 'Билет на концерт', why: 'Впечатление, которое запомнится дольше вещи.', priceMin: 2000, priceMax: 8000, interests: ['music'], tags: ['experience'] },
  { title: 'Набор для ухода за руками', why: 'Особенно кстати зимой, когда кожа сохнет.', priceMin: 900, priceMax: 2500, interests: ['beauty'], tags: ['practical', 'cozy'] },
  { title: 'Миниатюры нишевых ароматов', why: 'Можно попробовать несколько ароматов и найти свой.', priceMin: 1800, priceMax: 4500, interests: ['beauty'], tags: ['unusual'] },
  { title: 'Шерстяные варежки с узором', why: 'Тёплый и праздничный аксессуар.', priceMin: 800, priceMax: 2200, interests: ['fashion'], tags: ['cozy', 'practical'] },
  { title: 'Шёлковый платок', why: 'Универсальный аксессуар, который подходит к любому образу.', priceMin: 1500, priceMax: 4500, interests: ['fashion'], tags: ['unusual'] },
  { title: 'Набор для скетчинга', why: 'Маркеры и скетчбук — повод начать рисовать.', priceMin: 1200, priceMax: 3500, interests: ['creative'], tags: ['experience'] },
  { title: 'Мастер-класс по керамике', why: 'Вечер, после которого остаётся своя чашка.', priceMin: 2500, priceMax: 5000, interests: ['creative', 'home'], tags: ['experience', 'unusual'] },
  { title: 'Набор для вышивания', why: 'Медитативное занятие на длинные вечера.', priceMin: 700, priceMax: 2000, interests: ['creative'], tags: ['cozy'] },
  { title: 'Бутылка для воды с термосом', why: 'Пригодится в зале, в дороге и в офисе.', priceMin: 900, priceMax: 2500, interests: ['sport'], tags: ['practical'] },
  { title: 'Массажный ролик', why: 'Помогает восстановиться после тренировок.', priceMin: 800, priceMax: 2500, interests: ['sport'], tags: ['practical'] },
  { title: 'Сертификат на скалодром', why: 'Новое приключение для тех, кто любит движение.', priceMin: 1500, priceMax: 3500, interests: ['sport'], tags: ['experience', 'unusual'] },
  { title: 'Набор горячего шоколада с маршмеллоу', why: 'Сладкий зимний подарок, который понравится почти всем.', priceMin: 600, priceMax: 1500, interests: ['other', 'coffee'], tags: ['cozy'] },
  { title: 'Фотокнига с общими снимками', why: 'Личный подарок, который хранят годами.', priceMin: 1500, priceMax: 4000, interests: ['other', 'creative'], tags: ['unusual'] },
  { title: 'Ёлочная игрушка ручной работы', why: 'Каждый год напоминает о вашем Тайном Санте.', priceMin: 500, priceMax: 1800, interests: ['other', 'home'], tags: ['cozy', 'unusual'] },
]

export const GIFT_CATALOG: GiftIdea[] = C.map((g, i) => ({ ...g, id: `idea-${i}` }))

export type FollowUp = 'cheaper' | 'unusual' | 'practical' | 'again'

export interface IdeaQuery {
  budget: number
  interests: InterestId[]
  followUp?: FollowUp
  exclude?: string[]
  seed?: number
}

function rand(seed: number) {
  let s = seed || 1
  return () => {
    s = (s * 16807) % 2147483647
    return s / 2147483647
  }
}

export function suggestIdeas(q: IdeaQuery, count = 3): GiftIdea[] {
  const budget = q.followUp === 'cheaper' ? Math.round(q.budget * 0.6) : q.budget
  const r = rand(q.seed ?? 7)
  const scored = GIFT_CATALOG.filter((g) => !q.exclude?.includes(g.id))
    .filter((g) => g.priceMin <= budget)
    .map((g) => {
      let score = 0
      score += g.interests.filter((i) => q.interests.includes(i)).length * 3
      if (q.followUp === 'unusual' && g.tags.includes('unusual')) score += 4
      if (q.followUp === 'practical' && g.tags.includes('practical')) score += 4
      if (g.priceMax <= budget) score += 1
      score += r() * 1.5
      return { g, score }
    })
    .sort((a, b) => b.score - a.score)
  return scored.slice(0, count).map((s) => s.g)
}
