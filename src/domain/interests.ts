import type { InterestId } from './types'

export interface InterestMeta {
  id: InterestId
  title: string
  hint: string
  /** 3D render key (src/assets/3d) */
  art: string
  /** Card face tint */
  face: string
}

export const INTERESTS: InterestMeta[] = [
  { id: 'fashion', title: 'Стиль', hint: 'Одежда, обувь, аксессуары', art: 'wl-sneakers', face: '#FFE9D9' },
  { id: 'games', title: 'Игры', hint: 'Настолки и видеоигры', art: 'cat-games', face: '#E6F2EA' },
  { id: 'coffee', title: 'Кофе и чай', hint: 'Зерно, турки, сборы', art: 'cat-coffee', face: '#FBE7D6' },
  { id: 'home', title: 'Уют', hint: 'Пледы, свечи, посуда', art: 'teahouse', face: '#FFE2CB' },
  { id: 'books', title: 'Книги', hint: 'Романы, комиксы, нон-фикшн', art: 'cat-books', face: '#FFF1E4' },
  { id: 'tech', title: 'Техника', hint: 'Гаджеты и аксессуары', art: 'headphones', face: '#ECE6F7' },
  { id: 'travel', title: 'Путешествия', hint: 'Всё для дороги', art: 'cat-travel', face: '#E3F1EC' },
  { id: 'music', title: 'Музыка', hint: 'Винил, концерты', art: 'vinyl', face: '#F5E2E0' },
  { id: 'beauty', title: 'Красота', hint: 'Уход и ароматы', art: 'cat-beauty', face: '#FCE4EA' },
  { id: 'creative', title: 'Творчество', hint: 'Рисование, рукоделие', art: 'cat-creative', face: '#FFF3D6' },
  { id: 'sport', title: 'Спорт', hint: 'Для активных', art: 'cat-sport', face: '#E3F1EC' },
  { id: 'other', title: 'Другое', hint: 'Сюрприз на ваш вкус', art: 'gift-star', face: '#FFE2CB' },
]

export const interestById = Object.fromEntries(INTERESTS.map((i) => [i.id, i])) as Record<InterestId, InterestMeta>
