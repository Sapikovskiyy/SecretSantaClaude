import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { Button, Avatar, Header, Screen, rub } from '@/components/ui';
import { GiftBody, GiftLid } from '@/components/Art';
import { catLabel } from '@/features/wishlists/categories';
import { ME, useApp } from '@/store/app';
import { haptic } from '@/lib/telegram';
import { motionTokens as T } from '@/motion/tokens';

type Stage = 'closed' | 'opening' | 'open';

/** Purely presentational: it only displays the recipient already resolved for the current user. */
export default function Reveal() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const rid = useApp((s) => s.assignments[id]?.[ME]);
  const users = useApp((s) => s.users);
  const wl = useApp((s) => (rid ? s.wishlists[rid] : undefined));
  const reduce = useReducedMotion();
  const [stage, setStage] = useState<Stage>('closed');
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const openGift = () => {
    if (stage !== 'closed') return;
    haptic('success');
    if (reduce) { setStage('open'); return; }
    setStage('opening');
    timer.current = window.setTimeout(() => setStage('open'), T.duration.reveal * 1000);
  };
  const skip = () => { window.clearTimeout(timer.current); setStage('open'); };

  if (!rid) return <Screen><Header /><p className="mt-8 text-center text-taupe">Жеребьёвка ещё не проведена.</p></Screen>;
  const opening = stage === 'opening';
  return (
    <Screen style="--surface-welcome">
      <Header />
      {stage !== 'open' ? (
        <div className="flex flex-1 flex-col items-center justify-center">
          <button onClick={openGift} aria-label="Открыть подарок" disabled={stage !== 'closed'} className="relative h-72 w-72">
            <motion.div aria-hidden className="absolute inset-4 rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(230,185,108,.75) 0%, rgba(230,185,108,0) 68%)' }}
              initial={{ opacity: 0, scale: 0.6 }} animate={opening ? { opacity: 1, scale: 1.25 } : { opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.9, delay: 0.25, ease: T.easing.standard }} />
            <motion.div className="absolute inset-0" whileTap={stage === 'closed' ? { scale: 0.96 } : undefined}
              animate={stage === 'closed' && !reduce ? { rotate: [-2, 2, -2] } : { rotate: 0 }}
              transition={stage === 'closed' ? { repeat: Infinity, duration: 3.2, ease: 'easeInOut' } : { duration: T.duration.fast }}>
              <GiftBody className="absolute inset-0 h-full w-full" />
              <motion.div className="absolute inset-0" initial={false}
                animate={opening ? { y: -70, rotate: -14, opacity: 0 } : { y: 0, rotate: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.15, ease: T.easing.standard }}>
                <GiftLid className="h-full w-full" />
              </motion.div>
            </motion.div>
          </button>
          <p className="mt-4 font-display text-2xl">{opening ? 'Открываем…' : 'Нажмите, чтобы открыть'}</p>
          {opening ? <button onClick={skip} className="mt-3 rounded-full bg-white/15 px-5 py-2 text-sm font-bold">Пропустить</button>
            : <p className="mt-1 text-sm text-cream/80">Здесь тот, кому вы дарите подарок</p>}
        </div>
      ) : (
        <motion.div initial={{ y: 48, opacity: 0, scale: T.scale.entrance }} animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 28 }} className="flex flex-1 flex-col">
          <div className="flex flex-col items-center text-center">
            <Avatar name={users[rid]?.name ?? '?'} size={96} />
            <h1 className="mt-3 font-display text-4xl">{users[rid]?.name}</h1>
            <p className="text-sm text-cream/80">Вы — Тайный Санта</p>
          </div>
          <div className="mt-6 rounded-sheet bg-cream p-5 text-cocoa">
            <h2 className="font-display text-lg">Вишлист</h2>
            {wl?.interests.length ? <p className="mt-1 text-sm">Интересы: {wl.interests.map(catLabel).join(', ')}</p> : null}
            <ul className="mt-2 space-y-1">{wl?.items.map((i) => <li key={i.id} className="flex justify-between text-sm"><span>{i.name}</span><b>{i.price ? rub(i.price) : ''}</b></li>)}</ul>
            {!wl?.items.length && !wl?.interests.length && <p className="mt-1 text-sm text-cocoa/60">Вишлист пока пуст. Задайте вопрос анонимно.</p>}
            {wl?.unwanted && <p className="mt-3 text-sm text-cherry">Не дарить: {wl.unwanted}</p>}
          </div>
          <motion.div className="mt-auto grid gap-3 pt-6" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: T.duration.normal }}>
            <Button variant="cream" onClick={() => nav(`/chat/${id}`)}>Задать вопрос анонимно</Button>
            <Button variant="ghost" onClick={() => nav('/ai')}>Подобрать идеи</Button>
          </motion.div>
        </motion.div>
      )}
    </Screen>
  );
}
