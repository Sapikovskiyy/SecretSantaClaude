/**
 * Route-level code splitting. Welcome and Home stay in the entry chunk (first paint);
 * every other screen is its own chunk, prefetched while the browser is idle right after
 * the first screen renders — so navigation never waits on the network in practice.
 */
import { createElement, lazy, type ComponentType } from 'react'

type Loader = () => Promise<unknown>
const loaders: Loader[] = []

/**
 * Once its chunk has loaded, a screen renders synchronously (no Suspense round-trip), so a view
 * transition snapshot always contains the real screen instead of an empty fallback.
 */
function screen<K extends string>(load: () => Promise<Record<K, ComponentType>>, name: K): ComponentType {
  let Loaded: ComponentType | null = null
  let pending: Promise<unknown> | null = null
  const get = () => (pending ??= load().then((m) => (Loaded = m[name])))
  loaders.push(get)
  const Lazy = lazy(() => get().then(() => ({ default: Loaded! })))
  return function Screen(props: object) {
    return createElement(Loaded ?? Lazy, props)
  }
}

let all: Promise<unknown> | null = null
/** Resolves when every screen chunk is loaded (starts loading them if needed). */
export const whenScreensReady = () => (all ??= Promise.all(loaders.map((l) => l().catch(() => {}))))

export const CreateRoom = screen(() => import('./screens/CreateRoom'), 'CreateRoom')
export const RoomDashboard = screen(() => import('./screens/RoomDashboard'), 'RoomDashboard')
export const Invite = screen(() => import('./screens/Invite'), 'Invite')
export const Join = screen(() => import('./screens/Join'), 'Join')
export const Wishlist = screen(() => import('./screens/Wishlist'), 'Wishlist')
export const Interests = screen(() => import('./screens/Interests'), 'Interests')
export const Reveal = screen(() => import('./screens/Reveal'), 'Reveal')
export const Chat = screen(() => import('./screens/Chat'), 'Chat')
export const RecipientWishlist = screen(() => import('./screens/RecipientWishlist'), 'RecipientWishlist')
export const GiftAI = screen(() => import('./screens/GiftAI'), 'GiftAI')
export const Profile = screen(() => import('./screens/Profile'), 'Profile')
export const Chats = screen(() => import('./screens/Chats'), 'Chats')
export const Premium = screen(() => import('./screens/Premium'), 'Premium')
export const Participants = screen(() => import('./screens/Participants'), 'Participants')
export const Draw = screen(() => import('./screens/Draw'), 'Draw')
export const CustomizeRoom = screen(() => import('./screens/CustomizeRoom'), 'CustomizeRoom')
export const EditProfile = screen(() => import('./screens/EditProfile'), 'EditProfile')

let prefetched = false
/** Warm all screen chunks once the first screen is on screen and the main thread is idle. */
export function prefetchScreens() {
  if (prefetched) return
  prefetched = true
  let ran = false
  const run = () => {
    if (ran) return
    ran = true
    void whenScreensReady()
  }
  const ric = (window as unknown as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback
  // Only after the page has fully loaded (first screen painted, hero images in), then on idle.
  const later = () => setTimeout(() => (ric ? ric(run, { timeout: 3000 }) : run()), 800)
  if (document.readyState === 'complete') later()
  else {
    window.addEventListener('load', later, { once: true })
    setTimeout(later, 5000) // 'load' can stall on a slow third-party script (telegram.org)
  }
}
