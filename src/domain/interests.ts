import type { InterestId } from './types'

export interface InterestMeta {
  id: InterestId
  title: string
  hint: string
  /** Illustration key from components/illustrations */
  art: string
  /** Card face tint */
  face: string
}

export const INTERESTS: InterestMeta[] = [
  { id: 'home', title: 'Уют', hint: 'Пледы, свечи, посуда', art: 'teahouse', face: '#FFE2CB' },
  { id: 'books', title: 'Книги', hint: 'Романы, комиксы, нон-фикшн', art: 'book', face: '#FFF1E4' },
  { id: 'games', title: 'Игры', hint: 'Настолки и видеоигры', art: 'gamepad', face: '#E6F2EA' },
  { id: 'coffee', title: 'Кофе и чай', hint: 'Зерно, турки, сборы', art: 'mug', face: '#FBE7D6' },
  { id: 'tech', title: 'Техника', hint: 'Гаджеты и аксессуары', art: 'headphones', face: '#ECE6F7' },
  { id: 'music', title: 'Музыка', hint: 'Винил, концерты', art: 'vinyl', face: '#F5E2E0' },
  { id: 'beauty', title: 'Красота', hint: 'Уход и ароматы', art: 'perfume', face: '#FCE4EA' },
  { id: 'fashion', title: 'Стиль', hint: 'Одежда и аксессуары', art: 'mitten', face: '#FFE9D9' },
  { id: 'creative', title: 'Творчество', hint: 'Рисование, рукоделие', art: 'palette', face: '#FFF3D6' },
  { id: 'sport', title: 'Спорт', hint: 'Для активных', art: 'ball', face: '#E3F1EC' },
  { id: 'other', title: 'Другое', hint: 'Сюрприз на ваш вкус', art: 'gift-star', face: '#FFE2CB' },
]

export const interestById = Object.fromEntries(INTERESTS.map((i) => [i.id, i])) as Record<InterestId, InterestMeta>
