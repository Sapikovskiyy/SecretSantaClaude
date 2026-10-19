/**
 * Route-level code splitting. Welcome and Home stay in the entry chunk (first paint);
 * every other screen is its own chunk, prefetched while the browser is idle right after
 * the first screen renders — so navigation never waits on the network in practice.
 */
import { lazy, type ComponentType } from 'react'

type Loader = () => Promise<Record<string, ComponentType>>
const loaders: Loader[] = []

function screen<K extends string>(load: () => Promise<Record<K, ComponentType>>, name: K) {
  loaders.push(load as Loader)
  return lazy(() => load().then((m) => ({ default: m[name] })))
}

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

let prefetched = false
/** Warm all screen chunks once the first screen is on screen and the main thread is idle. */
export function prefetchScreens() {
  if (prefetched) return
  prefetched = true
  let ran = false
  const run = () => {
    if (ran) return
    ran = true
    loaders.forEach((l) => l().catch(() => {}))
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
