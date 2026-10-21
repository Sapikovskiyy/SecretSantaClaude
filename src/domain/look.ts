/**
 * Room look (theme + cover) and profile personalisation options.
 * Pure data — shared by the demo app now and by the server API later.
 */
import type { RoomCover, RoomTheme } from './types'

export interface ThemeLook {
  id: RoomTheme
  label: string
  swatch: string
  /** Featured-card / room-scene surface */
  card: string
  /** Light behind the room scene */
  glow: string
  /** Santa+ only — never unlocked from client state; the server decides. */
  premium?: boolean
}

export const THEMES: ThemeLook[] = [
  { id: 'pine', label: 'Изумрудная', swatch: '#006b43', card: 'radial-gradient(110% 70% at 75% 12%, #08744a 0%, #04603a 45%, #034e2d 100%)', glow: 'rgba(160,34,18,.75)' },
  { id: 'ember', label: 'Красная', swatch: '#d93624', card: 'radial-gradient(110% 70% at 75% 12%, #e2492c 0%, #b72d1a 50%, #7c1c10 100%)', glow: 'rgba(190,40,20,.8)' },
  { id: 'cocoa', label: 'Шоколадная', swatch: '#4a3830', card: 'radial-gradient(110% 70% at 75% 12%, #5a4038 0%, #3a2b25 55%, #281d19 100%)', glow: 'rgba(120,70,40,.6)' },
  { id: 'night', label: 'Зимняя ночь', swatch: '#1d3a63', card: 'radial-gradient(110% 70% at 75% 12%, #2c568c 0%, #1a3760 50%, #0f2240 100%)', glow: 'rgba(60,110,190,.6)', premium: true },
  { id: 'gold', label: 'Золотая', swatch: '#b88645', card: 'radial-gradient(110% 70% at 75% 12%, #d3a25e 0%, #a87432 50%, #6e4a1d 100%)', glow: 'rgba(220,160,80,.6)', premium: true },
]

export const themeLook = (id: RoomTheme) => THEMES.find((t) => t.id === id) ?? THEMES[0]

export const COVERS: { id: RoomCover; label: string }[] = [
  { id: 'snow-globe', label: 'Снежный шар' },
  { id: 'house', label: 'Пряничный домик' },
  { id: 'gift-green', label: 'Подарок' },
  { id: 'sleigh', label: 'Сани' },
  { id: 'santa', label: 'Санта' },
  { id: 'gift-star', label: 'Подарок со звездой' },
  { id: 'stocking', label: 'Чулок' },
  { id: 'bauble', label: 'Ёлочный шар' },
]

export const DEFAULT_COVER: RoomCover = 'snow-globe'

/** Profile avatar: a coloured initial or a 3D mascot from the render set. */
export const AVATAR_TINTS = ['#C7321C', '#E07A5F', '#3D8B6E', '#4F8FBF', '#7A6BB5', '#D45D79', '#C9A227', '#A0704F']
export const AVATAR_ARTS = ['star', 'bauble', 'gift-green', 'santa', 'mascot', 'stocking', 'house', 'snow-globe'] as const

export const CLOTHING_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const
export const SHOE_SIZES = Array.from({ length: 13 }, (_, i) => String(35 + i))

export const NAME_MAX = 30
export const BIO_MAX = 120
