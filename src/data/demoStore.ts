/**
 * DEMO MODE store. Everything here is simulated and persisted in localStorage.
 * In Phase 2 the screens will talk to a SantomiApi backed by Supabase instead;
 * production must never fall back to this store silently.
 */
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { drawAssignments, type DrawResult } from '@/domain/draw'
import type {
  ChatMessage,
  ChatRole,
  Exclusion,
  GiftIdea,
  GiftStatus,
  InterestId,
  Person,
  Room,
  RoomTheme,
  WishItem,
} from '@/domain/types'
import { inviteCode, uid } from '@/lib/format'
import { tgUserName } from '@/lib/telegram'
import { DEMO_PEOPLE, RECIPIENT_REPLIES, SANTA_REPLIES } from './demoSeed'

export const ME = 'me'
export const FREE_AI_GENERATIONS = 3
export const FREE_PARTICIPANT_LIMIT = 30

const chatKey = (roomId: string, role: ChatRole) => `${roomId}:${role}`

function isoInDays(d: number) {
  const t = new Date()
  t.setDate(t.getDate() + d)
  return t.toISOString().slice(0, 10)
}

function seedRooms(): Room[] {
  const now = Date.now()
  const m = (id: string, ready = true, giftStatus: GiftStatus = 'none') => ({
    personId: id,
    joinedAt: now,
    wishlistReady: ready,
    giftStatus,
  })
  return [
    {
      id: 'r-family',
      name: 'Семейный Новый год',
      budget: 3000,
      date: isoInDays(12),
      organizerId: 'p-anya',
      members: [m('p-anya', true, 'choosing'), m(ME, true), m('p-vika'), m('p-boris', true, 'bought'), m('p-gleb', false)],
      chatEnabled: true,
      theme: 'ember',
      exclusions: [],
      stage: 'drawn',
      inviteCode: 'FAM24Q',
      createdAt: now - 86_400_000 * 5,
      myRecipientId: 'p-vika',
      revealSeen: false,
    },
    {
      id: 'r-friends',
      name: 'Друзья с универа',
      description: 'Встречаемся у Глеба, приносим подарки и мандарины',
      budget: 2000,
      date: isoInDays(26),
      organizerId: ME,
      members: [m(ME, false), m('p-dasha'), m('p-egor', false), m('p-kira')],
      chatEnabled: true,
      theme: 'pine',
      exclusions: [],
      stage: 'gathering',
      inviteCode: 'UNI7KD',
      createdAt: now - 86_400_000,
    },
    {
      // A finished game from last season, for «Прошлые игры»
      id: 'r-past',
      name: 'Офисный Санта',
      budget: 1500,
      date: isoInDays(-290),
      organizerId: 'p-boris',
      members: [m('p-boris', true, 'ready'), m(ME, true, 'ready'), m('p-egor', true, 'ready'), m('p-mila', true, 'ready'), m('p-lev', true, 'ready')],
      chatEnabled: true,
      theme: 'cocoa',
      exclusions: [],
      stage: 'exchanged',
      inviteCode: 'OLD24X',
      createdAt: now - 86_400_000 * 330,
      myRecipientId: 'p-egor',
      revealSeen: true,
    },
    {
      // Room you are NOT in yet — try the invite flow with code SANTA5
      id: 'r-office',
      name: 'Офис на Мясницкой',
      description: 'Корпоратив 27 декабря, подарки кладём под ёлку в переговорке',
      budget: 1500,
      date: isoInDays(20),
      organizerId: 'p-lev',
      members: [m('p-lev'), m('p-mila'), m('p-zhenya', false), m('p-kira')],
      chatEnabled: true,
      theme: 'cocoa',
      exclusions: [],
      stage: 'gathering',
      inviteCode: 'SANTA5',
      createdAt: now - 86_400_000 * 2,
    },
  ]
}

function seedChats(): Record<string, ChatMessage[]> {
  const t = Date.now() - 3_600_000
  return {
    [chatKey('r-family', 'fromSanta')]: [
      { id: 'c1', mine: false, text: 'Привет! Я твой Тайный Санта 🎅 Скажи, ты любишь настольные игры?', at: t, read: false },
    ],
  }
}

export interface CreateRoomInput {
  name: string
  budget: number
  date: string
  description?: string
  participantLimit?: number
  chatEnabled: boolean
  theme: RoomTheme
}

interface DemoState {
  onboarded: boolean
  me: Person
  rooms: Room[]
  wishlist: WishItem[]
  interests: InterestId[]
  avoid: string[]
  chats: Record<string, ChatMessage[]>
  typing: Record<string, boolean>
  savedIdeas: GiftIdea[]
  aiUsed: number

  completeOnboarding(): void
  createRoom(input: CreateRoomInput): string
  updateRoom(id: string, patch: Partial<Pick<Room, 'name' | 'description' | 'budget' | 'date' | 'chatEnabled' | 'theme' | 'participantLimit'>>): void
  addDemoParticipant(roomId: string): Person | null
  removeMember(roomId: string, personId: string): void
  joinByCode(code: string): { status: 'joined' | 'already' | 'full' | 'invalid' | 'closed'; roomId?: string }
  findRoomByCode(code: string): Room | undefined
  addExclusion(roomId: string, ex: Exclusion): void
  removeExclusion(roomId: string, index: number): void
  runDraw(roomId: string): DrawResult
  markRevealSeen(roomId: string): void
  setGiftStatus(roomId: string, status: GiftStatus): void

  addWish(item: Omit<WishItem, 'id' | 'createdAt'>): void
  updateWish(id: string, patch: Partial<WishItem>): void
  removeWish(id: string): void
  moveWish(id: string, dir: -1 | 1): void
  setInterests(ids: InterestId[]): void
  addAvoid(text: string): void
  removeAvoid(text: string): void

  sendMessage(roomId: string, role: ChatRole, text: string): void
  setMessageStatus(roomId: string, role: ChatRole, id: string, status: NonNullable<ChatMessage['status']>): void
  retryMessage(roomId: string, role: ChatRole, id: string): void
  markRead(roomId: string, role: ChatRole): void

  saveIdea(idea: GiftIdea): void
  removeIdea(id: string): void
  consumeAi(): boolean

  resetDemo(): void
}

const initial = () => ({
  onboarded: false,
  me: { id: ME, name: tgUserName() ?? 'Вы', tint: '#C7321C' } as Person,
  rooms: seedRooms(),
  wishlist: [] as WishItem[],
  interests: [] as InterestId[],
  avoid: [] as string[],
  chats: seedChats(),
  typing: {} as Record<string, boolean>,
  savedIdeas: [] as GiftIdea[],
  aiUsed: 0,
})

export const useDemo = create<DemoState>()(
  persist(
    (set, get) => {
      const patchRoom = (id: string, fn: (r: Room) => Room) =>
        set((s) => ({ rooms: s.rooms.map((r) => (r.id === id ? fn(r) : r)) }))

      const syncReady = () => {
        const ready = get().wishlist.length > 0
        set((s) => ({
          rooms: s.rooms.map((r) => ({
            ...r,
            members: r.members.map((m) => (m.personId === ME ? { ...m, wishlistReady: ready } : m)),
          })),
        }))
      }

      return {
        ...initial(),

        completeOnboarding: () => set({ onboarded: true }),

        createRoom: (input) => {
          const id = 'r-' + uid()
          const room: Room = {
            id,
            ...input,
            organizerId: ME,
            members: [{ personId: ME, joinedAt: Date.now(), wishlistReady: get().wishlist.length > 0, giftStatus: 'none' }],
            exclusions: [],
            stage: 'gathering',
            inviteCode: inviteCode(),
            createdAt: Date.now(),
          }
          set((s) => ({ rooms: [room, ...s.rooms] }))
          return id
        },

        updateRoom: (id, patch) => patchRoom(id, (r) => ({ ...r, ...patch })),

        addDemoParticipant: (roomId) => {
          const room = get().rooms.find((r) => r.id === roomId)
          if (!room || room.stage !== 'gathering') return null
          const limit = room.participantLimit ?? FREE_PARTICIPANT_LIMIT
          if (room.members.length >= limit) return null
          const inRoom = new Set(room.members.map((m) => m.personId))
          const person = DEMO_PEOPLE.find((p) => !inRoom.has(p.id))
          if (!person) return null
          patchRoom(roomId, (r) => ({
            ...r,
            members: [...r.members, { personId: person.id, joinedAt: Date.now(), wishlistReady: Math.random() > 0.4, giftStatus: 'none' }],
          }))
          return person
        },

        removeMember: (roomId, personId) =>
          patchRoom(roomId, (r) =>
            r.stage !== 'gathering' || personId === r.organizerId
              ? r
              : {
                  ...r,
                  members: r.members.filter((m) => m.personId !== personId),
                  exclusions: r.exclusions.filter((e) => e.a !== personId && e.b !== personId),
                },
          ),

        findRoomByCode: (code) => get().rooms.find((r) => r.inviteCode === code.toUpperCase()),

        joinByCode: (code) => {
          const room = get().findRoomByCode(code)
          if (!room) return { status: 'invalid' }
          if (room.members.some((m) => m.personId === ME)) return { status: 'already', roomId: room.id }
          if (room.stage !== 'gathering') return { status: 'closed', roomId: room.id }
          if (room.members.length >= (room.participantLimit ?? FREE_PARTICIPANT_LIMIT)) return { status: 'full', roomId: room.id }
          patchRoom(room.id, (r) => ({
            ...r,
            members: [...r.members, { personId: ME, joinedAt: Date.now(), wishlistReady: get().wishlist.length > 0, giftStatus: 'none' }],
          }))
          return { status: 'joined', roomId: room.id }
        },

        addExclusion: (roomId, ex) =>
          patchRoom(roomId, (r) =>
            r.exclusions.some((e) => (e.a === ex.a && e.b === ex.b) || (e.mutual && e.a === ex.b && e.b === ex.a))
              ? r
              : { ...r, exclusions: [...r.exclusions, ex] },
          ),

        removeExclusion: (roomId, index) =>
          patchRoom(roomId, (r) => ({ ...r, exclusions: r.exclusions.filter((_, i) => i !== index) })),

        runDraw: (roomId) => {
          const room = get().rooms.find((r) => r.id === roomId)
          if (!room) return { ok: false, reason: 'impossible' }
          if (room.stage !== 'gathering') return { ok: false, reason: 'duplicate', detail: 'already_drawn' }
          const res = drawAssignments(
            room.members.map((m) => m.personId),
            room.exclusions,
          )
          if (res.ok) {
            // Demo keeps only *my* recipient, mirroring what the server will return.
            patchRoom(roomId, (r) => ({ ...r, stage: 'drawn', myRecipientId: res.pairs.get(ME), revealSeen: false }))
          }
          return res
        },

        markRevealSeen: (roomId) => patchRoom(roomId, (r) => ({ ...r, revealSeen: true })),

        setGiftStatus: (roomId, status) =>
          patchRoom(roomId, (r) => ({
            ...r,
            members: r.members.map((m) => (m.personId === ME ? { ...m, giftStatus: status } : m)),
          })),

        addWish: (item) => {
          set((s) => ({ wishlist: [...s.wishlist, { ...item, id: 'w-' + uid(), createdAt: Date.now() }] }))
          syncReady()
        },
        updateWish: (id, patch) => set((s) => ({ wishlist: s.wishlist.map((w) => (w.id === id ? { ...w, ...patch } : w)) })),
        removeWish: (id) => {
          set((s) => ({ wishlist: s.wishlist.filter((w) => w.id !== id) }))
          syncReady()
        },
        moveWish: (id, dir) =>
          set((s) => {
            const i = s.wishlist.findIndex((w) => w.id === id)
            const j = i + dir
            if (i < 0 || j < 0 || j >= s.wishlist.length) return s
            const next = s.wishlist.slice()
            ;[next[i], next[j]] = [next[j], next[i]]
            return { wishlist: next }
          }),
        setInterests: (ids) => set({ interests: ids }),
        addAvoid: (text) => set((s) => (s.avoid.includes(text) ? s : { avoid: [...s.avoid, text] })),
        removeAvoid: (text) => set((s) => ({ avoid: s.avoid.filter((a) => a !== text) })),

        sendMessage: (roomId, role, text) => {
          const key = chatKey(roomId, role)
          const id = uid()
          const offline = typeof navigator !== 'undefined' && !navigator.onLine
          const msg: ChatMessage = { id, mine: true, text: text.slice(0, 500), at: Date.now(), read: true, status: offline ? 'failed' : 'sending' }
          set((s) => ({ chats: { ...s.chats, [key]: [...(s.chats[key] ?? []), msg] } }))
          if (offline) return
          // Simulated server acknowledgement (demo only).
          setTimeout(() => get().setMessageStatus(roomId, role, id, 'sent'), 350)
          // Simulated reply from the other side.
          const pool = role === 'toRecipient' ? RECIPIENT_REPLIES : SANTA_REPLIES
          const count = get().chats[key].filter((m) => !m.mine).length
          setTimeout(() => set((s) => ({ typing: { ...s.typing, [key]: true } })), 700)
          setTimeout(() => {
            const reply: ChatMessage = { id: uid(), mine: false, text: pool[count % pool.length], at: Date.now(), read: false }
            set((s) => ({
              typing: { ...s.typing, [key]: false },
              chats: { ...s.chats, [key]: [...(s.chats[key] ?? []), reply] },
            }))
          }, 2200)
        },

        setMessageStatus: (roomId, role, id, status) => {
          const key = chatKey(roomId, role)
          set((s) => ({ chats: { ...s.chats, [key]: (s.chats[key] ?? []).map((m) => (m.id === id ? { ...m, status } : m)) } }))
        },

        retryMessage: (roomId, role, id) => {
          const key = chatKey(roomId, role)
          const msg = get().chats[key]?.find((m) => m.id === id)
          if (!msg) return
          set((s) => ({ chats: { ...s.chats, [key]: (s.chats[key] ?? []).filter((m) => m.id !== id) } }))
          get().sendMessage(roomId, role, msg.text)
        },

        markRead: (roomId, role) => {
          const key = chatKey(roomId, role)
          const list = get().chats[key]
          if (!list?.some((m) => !m.read)) return
          set((s) => ({ chats: { ...s.chats, [key]: list.map((m) => ({ ...m, read: true })) } }))
        },

        saveIdea: (idea) => set((s) => (s.savedIdeas.some((i) => i.id === idea.id) ? s : { savedIdeas: [idea, ...s.savedIdeas] })),
        removeIdea: (id) => set((s) => ({ savedIdeas: s.savedIdeas.filter((i) => i.id !== id) })),
        consumeAi: () => {
          if (get().aiUsed >= FREE_AI_GENERATIONS) return false
          set((s) => ({ aiUsed: s.aiUsed + 1 }))
          return true
        },

        resetDemo: () => set({ ...initial() }),
      }
    },
    {
      // v2: new seed (past game) and chat delivery states — old demo data is discarded.
      name: 'santomi-demo-v2',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { typing, ...rest } = s
        return rest
      },
    },
  ),
)

export const chatKeyOf = chatKey

export const isMember = (r: Room) => r.members.some((m) => m.personId === ME)

/** Rooms the current user belongs to (stable reference per rooms array). */
export function useMyRooms() {
  const rooms = useDemo((s) => s.rooms)
  return rooms.filter(isMember)
}

export function unreadCount(chats: Record<string, ChatMessage[]>, roomId: string, role: ChatRole) {
  return (chats[chatKey(roomId, role)] ?? []).filter((m) => !m.mine && !m.read).length
}
