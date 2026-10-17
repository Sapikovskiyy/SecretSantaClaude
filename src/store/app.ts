import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { drawSecretSanta } from '@/features/secret-draw/matching';
import type { CategoryId, Idea, Item, Message, Room, User, Wishlist } from '@/types';

/** DEMO-MODE STORE. Everything here lives in localStorage and is never used in production. */
const uid = () => Math.random().toString(36).slice(2, 10);
const mkCode = () => Array.from(crypto.getRandomValues(new Uint8Array(6))).map((b) => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[b % 32]).join('');
const ME = 'me';
const wl = (interests: CategoryId[], items: [string, number, CategoryId][], unwanted = ''): Wishlist => ({
  interests, unwanted, items: items.map(([name, price, category]) => ({ id: uid(), name, price, category, priority: 2 as const })),
});

function seed() {
  const users: Record<string, User> = Object.fromEntries(
    [[ME, 'Вы'], ['anya', 'Аня'], ['max', 'Макс'], ['lena', 'Лена'], ['igor', 'Игорь'], ['sonya', 'Соня']].map(([id, name]) => [id, { id, name }]));
  const wishlists: Record<string, Wishlist> = {
    [ME]: wl([], []),
    anya: wl(['books', 'coffee'], [['Роман «Сто лет одиночества»', 700, 'books'], ['Набор зелёного чая', 900, 'coffee']], 'Носки'),
    max: wl(['games', 'tech'], [['Беспроводной геймпад', 3500, 'games']]),
    lena: wl(['home', 'beauty'], [['Ароматическая свеча', 800, 'home']], 'Кружки'),
    igor: wl(['sports'], [['Бутылка для воды', 1200, 'sports']]),
    sonya: wl(['art', 'fashion'], [['Набор акварели', 1500, 'art']]),
  };
  const rooms: Room[] = [
    { id: 'r1', code: 'DEMO26', name: 'Офис 2026', description: 'Новогодний обмен в команде', budget: 1500, date: '2026-12-25', maxMembers: 20, anonymous: true, organizerId: ME, stage: 'gathering', members: [ME, 'anya', 'max', 'lena', 'igor', 'sonya'], exclusions: [] },
    { id: 'r2', code: 'FAM2026', name: 'Семья', description: '', budget: 1000, date: '2026-12-31', maxMembers: 10, anonymous: true, organizerId: 'anya', stage: 'gathering', members: [ME, 'anya', 'lena'], exclusions: [] },
  ];
  return { users, wishlists, rooms };
}

type JoinResult = { ok: true; roomId: string } | { ok: false; reason: 'not_found' | 'full' | 'drawn' };
type Result = { ok: true } | { ok: false; reason: string };

interface State {
  onboarded: boolean; meName: string;
  users: Record<string, User>; rooms: Room[]; wishlists: Record<string, Wishlist>;
  assignments: Record<string, Record<string, string>>;
  messages: Message[]; statuses: Record<string, number>; savedIdeas: Idea[]; aiUsed: number;
  prefs: Record<string, boolean>;
  finishOnboarding: () => void; setMeName: (n: string) => void;
  createRoom: (r: Pick<Room, 'name' | 'description' | 'budget' | 'date' | 'maxMembers' | 'anonymous'>) => string;
  joinByCode: (code: string) => JoinResult;
  removeMember: (roomId: string, userId: string) => void;
  addExclusion: (roomId: string, a: string, b: string) => void;
  removeExclusion: (roomId: string, a: string, b: string) => void;
  draw: (roomId: string) => Result;
  toggleInterest: (c: CategoryId) => void;
  saveItem: (i: Omit<Item, 'id'> & { id?: string }) => void;
  deleteItem: (id: string) => void;
  setUnwanted: (t: string) => void;
  ask: (roomId: string, text: string) => Result;
  reply: (roomId: string, giverId: string, text: string) => Result;
  report: (id: string) => void;
  setStatus: (roomId: string, n: number) => void;
  saveIdea: (i: Idea) => void; useAi: () => void;
  setPref: (k: string, v: boolean) => void;
  resetDemo: () => void;
}

export const FREE_AI_LIMIT = 3;
const QUESTIONS = ['Какой твой любимый цвет?', 'Какие книги тебе нравятся?', 'Ты предпочитаешь практичные подарки?'];

export const useApp = create<State>()(persist((set, get) => ({
  onboarded: false, meName: 'Гость', ...seed(), assignments: {}, messages: [], statuses: {}, savedIdeas: [], aiUsed: 0,
  prefs: { invites: true, draw: true, messages: true, reminders: true },
  finishOnboarding: () => set({ onboarded: true }),
  setMeName: (n) => set((s) => ({ meName: n, users: { ...s.users, [ME]: { id: ME, name: n } } })),
  createRoom: (r) => {
    const id = uid();
    set((s) => ({ rooms: [{ ...r, id, code: mkCode(), organizerId: ME, stage: 'gathering', members: [ME], exclusions: [] }, ...s.rooms] }));
    return id;
  },
  joinByCode: (code) => {
    const room = get().rooms.find((r) => r.code === code.toUpperCase());
    if (!room) return { ok: false, reason: 'not_found' };
    if (room.members.includes(ME)) return { ok: true, roomId: room.id };
    if (room.stage !== 'gathering') return { ok: false, reason: 'drawn' };
    if (room.members.length >= room.maxMembers) return { ok: false, reason: 'full' };
    set((s) => ({ rooms: s.rooms.map((x) => (x.id === room.id ? { ...x, members: [...x.members, ME] } : x)) }));
    return { ok: true, roomId: room.id };
  },
  removeMember: (roomId, userId) => set((s) => ({ rooms: s.rooms.map((r) => r.id !== roomId || r.stage !== 'gathering' ? r : {
    ...r, members: r.members.filter((m) => m !== userId), exclusions: r.exclusions.filter(([a, b]) => a !== userId && b !== userId) }) })),
  addExclusion: (roomId, a, b) => set((s) => ({ rooms: s.rooms.map((r) => r.id !== roomId || a === b || r.exclusions.some(([x, y]) => (x === a && y === b) || (x === b && y === a)) ? r : { ...r, exclusions: [...r.exclusions, [a, b]] }) })),
  removeExclusion: (roomId, a, b) => set((s) => ({ rooms: s.rooms.map((r) => r.id !== roomId ? r : { ...r, exclusions: r.exclusions.filter(([x, y]) => !(x === a && y === b)) }) })),
  draw: (roomId) => {
    const room = get().rooms.find((r) => r.id === roomId);
    if (!room || room.organizerId !== ME) return { ok: false, reason: 'Только организатор может провести жеребьёвку' };
    if (room.stage !== 'gathering') return { ok: false, reason: 'Жеребьёвка уже проведена' };
    if (room.members.length < 3) return { ok: false, reason: 'Нужно минимум 3 участника' };
    const ex = room.exclusions.flatMap(([a, b]) => [{ giver: a, receiver: b }, { giver: b, receiver: a }]);
    const res = drawSecretSanta(room.members, ex);
    if (!res.ok) return { ok: false, reason: 'С такими исключениями жеребьёвка невозможна. Уберите часть ограничений.' };
    const myGiver = Object.entries(res.assignments).find(([, r]) => r === ME)?.[0];
    const statuses: Record<string, number> = {};
    room.members.forEach((m) => { if (m !== ME) statuses[`${roomId}:${m}`] = Math.floor(Math.random() * 3); });
    const demoMsg: Message[] = myGiver && myGiver !== ME ? [{ id: uid(), roomId, giverId: myGiver, receiverId: ME, author: 'giver', text: QUESTIONS[Math.floor(Math.random() * 3)], reported: false, at: Date.now(), demo: true }] : [];
    set((s) => ({
      assignments: { ...s.assignments, [roomId]: res.assignments },
      rooms: s.rooms.map((r) => (r.id === roomId ? { ...r, stage: 'drawn' } : r)),
      statuses: { ...s.statuses, ...statuses }, messages: [...s.messages, ...demoMsg],
    }));
    return { ok: true };
  },
  toggleInterest: (c) => set((s) => { const w = s.wishlists[ME]; const on = w.interests.includes(c);
    return { wishlists: { ...s.wishlists, [ME]: { ...w, interests: on ? w.interests.filter((x) => x !== c) : [...w.interests, c] } } }; }),
  saveItem: (i) => set((s) => { const w = s.wishlists[ME];
    const items = i.id ? w.items.map((x) => (x.id === i.id ? { ...x, ...i, id: i.id } : x)) : [...w.items, { ...i, id: uid() }];
    return { wishlists: { ...s.wishlists, [ME]: { ...w, items } } }; }),
  deleteItem: (id) => set((s) => { const w = s.wishlists[ME]; return { wishlists: { ...s.wishlists, [ME]: { ...w, items: w.items.filter((x) => x.id !== id) } } }; }),
  setUnwanted: (t) => set((s) => ({ wishlists: { ...s.wishlists, [ME]: { ...s.wishlists[ME], unwanted: t } } })),
  ask: (roomId, text) => {
    const t = text.trim();
    if (!t) return { ok: false, reason: 'Введите вопрос' };
    if (t.length > 300) return { ok: false, reason: 'Не больше 300 символов' };
    if (/https?:\/\/|t\.me|@\w/i.test(t)) return { ok: false, reason: 'Ссылки и упоминания в сообщениях запрещены' };
    const receiver = get().assignments[roomId]?.[ME];
    if (!receiver) return { ok: false, reason: 'Жеребьёвка ещё не проведена' };
    set((s) => ({ messages: [...s.messages, { id: uid(), roomId, giverId: ME, receiverId: receiver, author: 'giver', text: t, reported: false, at: Date.now() }] }));
    return { ok: true };
  },
  reply: (roomId, giverId, text) => {
    const t = text.trim();
    if (!t) return { ok: false, reason: 'Введите ответ' };
    if (t.length > 300) return { ok: false, reason: 'Не больше 300 символов' };
    set((s) => ({ messages: [...s.messages, { id: uid(), roomId, giverId, receiverId: ME, author: 'receiver', text: t, reported: false, at: Date.now() }] }));
    return { ok: true };
  },
  report: (id) => set((s) => ({ messages: s.messages.map((m) => (m.id === id ? { ...m, reported: true } : m)) })),
  setStatus: (roomId, n) => set((s) => ({ statuses: { ...s.statuses, [`${roomId}:${ME}`]: n } })),
  saveIdea: (i) => set((s) => (s.savedIdeas.some((x) => x.name === i.name) ? s : { savedIdeas: [...s.savedIdeas, i] })),
  useAi: () => set((s) => ({ aiUsed: s.aiUsed + 1 })),
  setPref: (k, v) => set((s) => ({ prefs: { ...s.prefs, [k]: v } })),
  resetDemo: () => set({ ...seed(), onboarded: false, assignments: {}, messages: [], statuses: {}, savedIdeas: [], aiUsed: 0 }),
}), { name: 'santomi-demo-v1', version: 1 }));

export { ME };
