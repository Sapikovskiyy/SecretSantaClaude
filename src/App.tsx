import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate, useNavigationType } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { pageVariants } from '@/motion';
import { useBackButton } from '@/hooks/useBackButton';
import { isDemo, startParam, telegramFirstName } from '@/lib/telegram';
import { Screen } from '@/components/ui';
import { GiftArt } from '@/components/Art';
import { useApp } from '@/store/app';
import Welcome from '@/pages/Welcome';
import Home from '@/pages/Home';
import CreateRoom from '@/pages/CreateRoom';
import Invite from '@/pages/Invite';
import Join from '@/pages/Join';
import Room from '@/pages/Room';
import Interests from '@/pages/Interests';
import Wishlist from '@/pages/Wishlist';
import Reveal from '@/pages/Reveal';
import Chat from '@/pages/Chat';
import GiftAI from '@/pages/GiftAI';
import Profile from '@/pages/Profile';

function NotConnected() {
  return (
    <Screen><div className="flex flex-1 flex-col items-center justify-center text-center">
      <GiftArt className="h-40 w-40" />
      <h1 className="mt-4 font-display text-2xl">Сервер ещё не подключён</h1>
      <p className="mt-2 text-sm text-taupe">Боевой режим требует настроенного бэкенда. Подробности в README.</p>
    </div></Screen>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  const dir = useNavigationType() === 'POP' ? -1 : 1;
  const onboarded = useApp((s) => s.onboarded);
  return (
    <AnimatePresence mode="wait" initial={false} custom={dir}>
      <motion.div key={location.pathname} custom={dir} variants={pageVariants} initial="enter" animate="center" exit="exit">
        <Routes location={location}>
      <Route path="/" element={onboarded ? <Navigate to="/home" replace /> : <Welcome />} />
      <Route path="/home" element={<Home />} />
      <Route path="/create" element={<CreateRoom />} />
      <Route path="/invite/:id" element={<Invite />} />
      <Route path="/join/:code" element={<Join />} />
      <Route path="/room/:id" element={<Room />} />
      <Route path="/interests" element={<Interests />} />
      <Route path="/wishlist" element={<Wishlist />} />
      <Route path="/reveal/:id" element={<Reveal />} />
      <Route path="/chat/:id" element={<Chat />} />
      <Route path="/ai" element={<GiftAI />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  const nav = useNavigate();
  const setMeName = useApp((s) => s.setMeName);
  useBackButton();
  useEffect(() => {
    const n = telegramFirstName();
    if (n) setMeName(n);
    const sp = startParam();
    if (sp?.startsWith('join_')) nav(`/join/${sp.slice(5)}`, { replace: true });
  }, [nav, setMeName]);
  if (!isDemo) return <NotConnected />;
  return (
    <AnimatedRoutes />
  );
}
