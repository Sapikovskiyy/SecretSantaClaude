import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Check } from 'lucide-react';
import { Header, Screen, SwipeToConfirm } from '@/components/ui';
import { catArt } from '@/components/Art';
import { CATEGORIES } from '@/features/wishlists/categories';
import { ME, useApp } from '@/store/app';
import { haptic } from '@/lib/telegram';

export default function Interests() {
  const nav = useNavigate();
  const chosen = useApp((s) => s.wishlists[ME].interests);
  const toggle = useApp((s) => s.toggleInterest);
  return (
    <Screen style="--surface-interests">
      <Header />
      <h1 className="font-display text-4xl leading-tight">Какой подарок вы хотите?</h1>
      <p className="mt-3 text-sm text-cream/80">Выберите интересы. Санта увидит их в вашем вишлисте.</p>
      <div className="-mx-5 mt-6 flex flex-1 snap-x snap-mandatory items-center gap-4 overflow-x-auto px-[15%] no-scrollbar" role="group" aria-label="Интересы">
        {CATEGORIES.map((c) => {
          const on = chosen.includes(c.id); const Art = catArt[c.id];
          return (
            <motion.button key={c.id} aria-pressed={on} onClick={() => { haptic('medium'); toggle(c.id); }}
              animate={{ scale: on ? 1 : 0.9, y: on ? -6 : 0 }} whileTap={{ scale: 0.95 }} transition={{ type: 'spring', stiffness: 380, damping: 22 }}
              className={`relative w-[70%] shrink-0 snap-center rounded-sheet p-4 text-left text-cocoa ${on ? 'bg-cream shadow-soft' : 'bg-cream/70'}`}>
              <Art className="mx-auto h-48 w-48" />
              <p className="mt-2 font-bold">{c.label}</p><p className="text-sm text-cocoa/60">{c.hint}</p>
              <span className={`absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full ${on ? 'bg-pine text-white' : 'bg-cocoa/10'}`}>{on && <Check size={18} />}</span>
            </motion.button>
          );
        })}
      </div>
      <p className="mb-3 text-center text-sm">Выбрано: {chosen.length}</p>
      <SwipeToConfirm label="Свайп, чтобы сохранить" onConfirm={() => nav('/wishlist')} />
    </Screen>
  );
}
