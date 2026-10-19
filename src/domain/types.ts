export type ID = string

export type InterestId =
  | 'books'
  | 'games'
  | 'coffee'
  | 'tech'
  | 'music'
  | 'beauty'
  | 'fashion'
  | 'creative'
  | 'home'
  | 'sport'
  | 'other'

export interface Person {
  id: ID
  name: string
  /** Hex tint for the generated avatar */
  tint: string
  isDemo?: boolean
}

export type RoomStage = 'gathering' | 'drawn' | 'exchanged'
export type GiftStatus = 'none' | 'choosing' | 'bought' | 'ready'
export type RoomTheme = 'cocoa' | 'pine' | 'ember'

export interface Exclusion {
  a: ID
  b: ID
  /** If true, neither may give to the other. Otherwise only a → b is forbidden. */
  mutual: boolean
}

export interface Member {
  personId: ID
  joinedAt: number
  wishlistReady: boolean
  giftStatus: GiftStatus
}

export interface Room {
  id: ID
  name: string
  description?: string
  budget: number
  date: string // ISO date (gift exchange)
  /** Optional planned draw date (shown as «Жеребьёвка через N дней»). */
  drawDate?: string
  organizerId: ID
  members: Member[]
  participantLimit?: number
  chatEnabled: boolean
  theme: RoomTheme
  exclusions: Exclusion[]
  stage: RoomStage
  inviteCode: string
  createdAt: number
  /** Demo only: in production assignments never leave the server. */
  myRecipientId?: ID
  revealSeen?: boolean
}

export type Priority = 'high' | 'normal' | 'low'

export interface WishItem {
  id: ID
  title: string
  description?: string
  price?: number
  url?: string
  category: InterestId
  priority: Priority
  createdAt: number
}

export interface ChatMessage {
  id: ID
  mine: boolean
  text: string
  at: number
  read: boolean
  /** Delivery state of my own messages. */
  status?: 'sending' | 'sent' | 'failed'
}

export type ChatRole = 'toRecipient' | 'fromSanta'

export interface GiftIdea {
  id: ID
  title: string
  why: string
  priceMin: number
  priceMax: number
  interests: InterestId[]
  tags: ('unusual' | 'practical' | 'cozy' | 'experience')[]
}
