import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router'
import { AnimatePresence } from 'motion/react'
import { useDemo } from './data/demoStore'
import { Dock, Toasts } from './components/ui/Kit'
import { startParam } from './lib/telegram'
import { Welcome } from './screens/Welcome'
import { Home } from './screens/Home'
import { CreateRoom } from './screens/CreateRoom'
import { RoomDashboard } from './screens/RoomDashboard'
import { Invite } from './screens/Invite'
import { Join } from './screens/Join'
import { Wishlist } from './screens/Wishlist'
import { Interests } from './screens/Interests'
import { Reveal } from './screens/Reveal'
import { Chat } from './screens/Chat'
import { RecipientWishlist } from './screens/RecipientWishlist'
import { GiftAI } from './screens/GiftAI'
import { Profile } from './screens/Profile'
import { Premium } from './screens/Premium'
import { Participants } from './screens/Participants'
import { Draw } from './screens/Draw'
import { NotFound } from './screens/NotFound'
import { Offline } from './components/Offline'
import { ServerNotConnected } from './screens/ServerNotConnected'
import { IS_DEMO } from './lib/mode'

// The wishlist editor is a full-screen sheet flow (handoff 08), so it has no dock.
const DOCK_ROUTES = ['/home', '/ai', '/profile']

export function App() {
  const location = useLocation()
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

  // Production builds never fall back to demo data.
  if (!IS_DEMO) return <ServerNotConnected />

  return (
    <>
      <Offline />
      <Toasts />
      <AnimatePresence mode="wait" initial={false}>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={onboarded ? <Navigate to="/home" replace /> : <Welcome />} />
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/home" element={<Home />} />
          <Route path="/rooms/new" element={<CreateRoom />} />
          <Route path="/rooms/:id" element={<RoomDashboard />} />
          <Route path="/rooms/:id/invite" element={<Invite />} />
          <Route path="/rooms/:id/participants" element={<Participants />} />
          <Route path="/rooms/:id/draw" element={<Draw />} />
          <Route path="/rooms/:id/reveal" element={<Reveal />} />
          <Route path="/rooms/:id/recipient" element={<RecipientWishlist />} />
          <Route path="/rooms/:id/chat/:role" element={<Chat />} />
          <Route path="/join" element={<Join />} />
          <Route path="/join/:code" element={<Join />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/wishlist/interests" element={<Interests />} />
          <Route path="/ai" element={<GiftAI />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/premium" element={<Premium />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AnimatePresence>
      {showDock && <Dock />}
    </>
  )
}
