import { Suspense, useEffect, useState } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router'
import { useTransitionLocation } from './motion/viewTransition'
import { useDemo } from './data/demoStore'
import { Dock, Toasts } from './components/ui/Kit'
import { startParam, tgUserName } from './lib/telegram'
import { Welcome } from './screens/Welcome'
import { Home } from './screens/Home'
import { NotFound } from './screens/NotFound'
import { CreateRoom, RoomDashboard, Invite, Join, Wishlist, Interests, Reveal, Chat, RecipientWishlist, GiftAI, Profile, Chats, Premium, Participants, Draw, CustomizeRoom, EditProfile, prefetchScreens } from './lazyScreens'
import { Offline } from './components/Offline'

// The wishlist editor is a full-screen sheet flow (handoff 08), so it has no dock.
const DOCK_ROUTES = ['/home', '/chats', '/ai', '/profile']

// The demo profile is created when the store module loads; use the Telegram name once the SDK is bound.
const tgName = tgUserName()
if (tgName && useDemo.getState().me.name === 'Вы') useDemo.setState((s) => ({ me: { ...s.me, name: tgName } }))

/** Demo app (Demo Mode only — main.tsx never loads this chunk in production builds). */
export function App() {
  // The location Routes renders: switches inside a view transition (iOS push / pop / tab fade).
  const location = useTransitionLocation(DOCK_ROUTES)
  const navigate = useNavigate()
  const onboarded = useDemo((s) => s.onboarded)
  const [handledStart, setHandledStart] = useState(false)

  // Telegram deep link: t.me/<bot>/<app>?startapp=CODE → join flow.
  useEffect(() => {
    if (handledStart) return
    setHandledStart(true)
    const code = startParam()
    if (code && /^[A-Za-z0-9_-]{4,64}$/.test(code)) navigate(`/join/${code}`, { replace: true })
  }, [handledStart, navigate])

  const showDock = DOCK_ROUTES.includes(location.pathname)

  useEffect(() => prefetchScreens(), [])

  return (
    <>
      <Offline />
      <Toasts />
      {/* Screen changes are view transitions (motion/viewTransition.ts); no exit DOM, never a dark gap. */}
      {/* fallback is empty: chunks are prefetched on idle, the body is already the app's colour */}
      <Suspense fallback={null}>
      <Routes location={location} key={location.pathname}>
          <Route path="/" element={onboarded ? <Navigate to="/home" replace /> : <Welcome />} />
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/home" element={<Home />} />
          <Route path="/rooms/new" element={<CreateRoom />} />
          <Route path="/rooms/:id" element={<RoomDashboard />} />
          <Route path="/rooms/:id/invite" element={<Invite />} />
          <Route path="/rooms/:id/participants" element={<Participants />} />
          <Route path="/rooms/:id/draw" element={<Draw />} />
          <Route path="/rooms/:id/customize" element={<CustomizeRoom />} />
          <Route path="/rooms/:id/reveal" element={<Reveal />} />
          <Route path="/rooms/:id/recipient" element={<RecipientWishlist />} />
          <Route path="/rooms/:id/chat/:role" element={<Chat />} />
          <Route path="/join" element={<Join />} />
          <Route path="/join/:code" element={<Join />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/wishlist/interests" element={<Interests />} />
          <Route path="/ai" element={<GiftAI />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/edit" element={<EditProfile />} />
          <Route path="/chats" element={<Chats />} />
          <Route path="/premium" element={<Premium />} />
          <Route path="*" element={<NotFound />} />
      </Routes>
      </Suspense>
      {showDock && <Dock />}
    </>
  )
}
