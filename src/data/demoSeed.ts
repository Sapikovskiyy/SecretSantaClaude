/** Simulated people and content for Demo Mode. Clearly fictional. */
import type { InterestId, Person, WishItem } from '@/domain/types'

export const DEMO_PEOPLE: Person[] = [
  { id: 'p-anya', name: 'Аня', tint: '#E07A5F', isDemo: true },
  { id: 'p-boris', name: 'Борис', tint: '#3D8B6E', isDemo: true },
  { id: 'p-vika', name: 'Вика', tint: '#C9A227', isDemo: true },
  { id: 'p-gleb', name: 'Глеб', tint: '#7A6BB5', isDemo: true },
  { id: 'p-dasha', name: 'Даша', tint: '#D45D79', isDemo: true },
  { id: 'p-egor', name: 'Егор', tint: '#4F8FBF', isDemo: true },
  { id: 'p-zhenya', name: 'Женя', tint: '#A0704F', isDemo: true },
  { id: 'p-kira', name: 'Кира', tint: '#5BA08A', isDemo: true },
  { id: 'p-lev', name: 'Лев', tint: '#B5523B', isDemo: true },
  { id: 'p-mila', name: 'Мила', tint: '#8E7CC3', isDemo: true },
  { id: 'p-nika', name: 'Ника', tint: '#C26A4A', isDemo: true },
]

const w = (title: string, category: InterestId, price: number, description?: string): WishItem => ({
  id: `dw-${title.length}-${price}`,
  title,
  category,
  price,
  description,
  priority: 'normal',
  createdAt: 0,
})

export const DEMO_WISHLISTS: Record<string, { interests: InterestId[]; items: WishItem[]; avoid: string[] }> = {
  'p-vika': {
    interests: ['books', 'coffee', 'home'],
    items: [
      { ...w('Сборник рассказов Чехова', 'books', 900, 'В твёрдой обложке, если можно'), priority: 'high' },
      w('Френч-пресс на 0,6 л', 'coffee', 1600),
      w('Мягкие носки с оленями', 'home', 500, 'Размер 37–38'),
    ],
    avoid: ['Сладкое', 'Косметика с сильным запахом'],
  },
  'p-anya': {
    interests: ['creative', 'music'],
    items: [w('Акварельные карандаши', 'creative', 1400), w('Пластинка Radiohead', 'music', 3200)],
    avoid: ['Алкоголь'],
  },
  'p-boris': {
    interests: ['games', 'tech'],
    items: [w('Настольная игра «Каркассон»', 'games', 2200), w('Подставка для ноутбука', 'tech', 1500)],
    avoid: [],
  },
  'p-gleb': { interests: ['sport', 'coffee'], items: [w('Термокружка', 'coffee', 1200)], avoid: [] },
  'p-dasha': { interests: ['beauty', 'fashion'], items: [w('Крем для рук', 'beauty', 700)], avoid: ['Бижутерия'] },
  'p-egor': { interests: ['tech'], items: [], avoid: [] },
}

/** Canned replies that simulate the other side of an anonymous chat. */
export const RECIPIENT_REPLIES = [
  'Ой, как интересно! Я люблю всё, что связано с книгами и уютом 📚',
  'Размер одежды S, но лучше не одежду 🙂',
  'Обожаю кофе, но турки у меня уже две',
  'Спасибо, что спрашиваешь! Мне будет приятно что угодно из вишлиста',
  'Аллергии нет, только сладкое не очень люблю',
]

export const SANTA_REPLIES = [
  'Принято! Записываю 🎁',
  'Интересно… А какой цвет тебе нравится больше всего?',
  'Отлично, кажется, у меня есть идея',
  'Спасибо! Больше ничего не скажу — это секрет 🤫',
]

export type Suggestion = { icon: 'snow' | 'film' | 'bulb' | 'game' | 'gift' | 'heart' | 'alert' | 'star'; text: string }

/** Gift-related prompts for the Santa → recipient chat (handoff 11: «Попробуйте спросить»). */
export const SUGGESTED_QUESTIONS_TO_RECIPIENT: Suggestion[] = [
  { icon: 'snow', text: 'Как ты любишь проводить зиму?' },
  { icon: 'film', text: 'Твой любимый фильм или сериал?' },
  { icon: 'bulb', text: 'Что тебя сейчас вдохновляет?' },
  { icon: 'game', text: 'Есть ли что-то, что ты коллекционируешь?' },
]

export const SUGGESTED_REPLIES_TO_SANTA: Suggestion[] = [
  { icon: 'gift', text: 'Загляни в мой вишлист' },
  { icon: 'heart', text: 'Мне нравится всё уютное' },
  { icon: 'alert', text: 'Только не сладкое' },
  { icon: 'star', text: 'Спасибо, Санта!' },
]
