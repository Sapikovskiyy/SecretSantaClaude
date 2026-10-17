import type { CategoryId, Idea } from '@/types';
/** SIMULATED ideas for Demo Mode. Not AI output, and prices are rough ranges, not store data. */
type Seed = { name: string; min: number; max: number; why: string; tag: 'practical' | 'odd' | 'any' };
const DB: Record<CategoryId, Seed[]> = {
  books: [
    { name: 'Подарочное издание любимой книги', min: 1200, max: 3000, why: 'Красивый подарок, который хочется оставить на полке', tag: 'any' },
    { name: 'Книжный органайзер и закладки', min: 400, max: 1200, why: 'Небольшой практичный знак внимания', tag: 'practical' },
    { name: 'Подписка на аудиокниги', min: 700, max: 2000, why: 'Подходит тем, у кого мало времени читать', tag: 'odd' },
  ],
  games: [
    { name: 'Настольная игра для компании', min: 1500, max: 4000, why: 'Хорошо работает для вечеринок и семьи', tag: 'any' },
    { name: 'Коллекционный пазл', min: 800, max: 2500, why: 'Спокойное занятие на длинные вечера', tag: 'odd' },
    { name: 'Подставка для геймпада', min: 600, max: 1800, why: 'Полезный аксессуар для игрока', tag: 'practical' },
  ],
  tech: [
    { name: 'Беспроводная зарядная станция', min: 1500, max: 4000, why: 'Заряжает несколько устройств сразу', tag: 'practical' },
    { name: 'Мини-колонка', min: 2000, max: 5000, why: 'Музыка дома и на прогулке', tag: 'any' },
    { name: 'Умная лампа-ночник', min: 1200, max: 3000, why: 'Необычный гаджет для уюта', tag: 'odd' },
  ],
  coffee: [
    { name: 'Набор чая из разных регионов', min: 800, max: 2200, why: 'Можно попробовать разные вкусы', tag: 'any' },
    { name: 'Термокружка', min: 900, max: 2500, why: 'Каждый день в дороге', tag: 'practical' },
    { name: 'Набор для альтернативного заваривания', min: 2000, max: 5000, why: 'Для тех, кто любит разбираться в кофе', tag: 'odd' },
  ],
  beauty: [
    { name: 'Набор для ухода за кожей рук', min: 700, max: 2000, why: 'Мягкий и универсальный подарок', tag: 'practical' },
    { name: 'Ароматический диффузор', min: 1200, max: 3500, why: 'Создаёт настроение дома', tag: 'any' },
    { name: 'Набор миниатюр ароматов', min: 1500, max: 4000, why: 'Помогает найти любимый запах', tag: 'odd' },
  ],
  fashion: [
    { name: 'Тёплый шарф или снуд', min: 1000, max: 3000, why: 'Подходит сезону и почти всем', tag: 'practical' },
    { name: 'Набор значков и пинов', min: 500, max: 1500, why: 'Лёгкий способ добавить характера', tag: 'odd' },
    { name: 'Кожаная обложка для документов', min: 1500, max: 4000, why: 'Аккуратная вещь на каждый день', tag: 'any' },
  ],
  art: [
    { name: 'Набор акварели с блокнотом', min: 1000, max: 3000, why: 'Хорошее начало для творчества', tag: 'any' },
    { name: 'Набор для вышивки или лепки', min: 800, max: 2500, why: 'Хобби для вечеров', tag: 'odd' },
    { name: 'Скетчбук и линеры', min: 600, max: 1800, why: 'Практичный набор для рисования', tag: 'practical' },
  ],
  home: [
    { name: 'Плед из мягкой ткани', min: 1500, max: 4000, why: 'Тепло и уют зимой', tag: 'practical' },
    { name: 'Ароматическая свеча', min: 600, max: 2000, why: 'Простой подарок с настроением', tag: 'any' },
    { name: 'Ночник-проектор звёздного неба', min: 1200, max: 3000, why: 'Необычный элемент декора', tag: 'odd' },
  ],
  sports: [
    { name: 'Бутылка для тренировок', min: 600, max: 1800, why: 'Пригодится в зале и в дороге', tag: 'practical' },
    { name: 'Эспандеры для дома', min: 800, max: 2200, why: 'Тренировки без зала', tag: 'any' },
    { name: 'Массажный мяч', min: 500, max: 1500, why: 'Необычное восстановление после нагрузки', tag: 'odd' },
  ],
  other: [
    { name: 'Сертификат на впечатление', min: 1500, max: 5000, why: 'Эмоции вместо вещей', tag: 'odd' },
    { name: 'Набор вкусностей', min: 700, max: 2500, why: 'Нравится почти всем', tag: 'any' },
    { name: 'Фотокнига с памятными моментами', min: 1500, max: 3500, why: 'Личный и тёплый подарок', tag: 'any' },
  ],
};
export type Mode = 'base' | 'cheaper' | 'odd' | 'practical' | 'other';

export function demoIdeas(interests: CategoryId[], budget: number, mode: Mode, round: number): Idea[] {
  const cats: CategoryId[] = interests.length ? interests : ['other', 'home', 'coffee'];
  const cap = mode === 'cheaper' ? budget * 0.6 : budget;
  const all = cats.flatMap((c) => DB[c].map((s) => ({ s, c })));
  const wanted = mode === 'odd' ? 'odd' : mode === 'practical' ? 'practical' : null;
  const pool = all.filter(({ s }) => s.min <= cap && (!wanted || s.tag === wanted));
  const fallback = all.filter(({ s }) => s.min <= cap);
  const base = (pool.length >= 5 ? pool : [...pool, ...fallback.filter((x) => !pool.includes(x))]);
  const start = mode === 'other' ? (round * 3) % Math.max(base.length, 1) : 0;
  const rotated = [...base.slice(start), ...base.slice(0, start)];
  return rotated.slice(0, 8).map(({ s, c }) => ({
    name: s.name, min: s.min, max: Math.min(s.max, Math.max(s.min, Math.round(cap))), why: s.why, category: c, matched: cats.filter((x) => x === c),
  }));
}
