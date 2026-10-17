import { useEffect, useRef, useState, type ReactNode } from 'react';
import { animate, motion, useMotionValue, useTransform } from 'motion/react';
import { ArrowLeft, ChevronsRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { haptic } from '@/lib/telegram';
import { motionTokens } from '@/motion/tokens';

export function Screen({ bg = 'bg-cocoa', style, children, nav = false }: { bg?: string; style?: string; children: ReactNode; nav?: boolean }) {
  return (
    <div className={`${bg} min-h-dvh`} style={style ? { background: `var(${style})` } : undefined}>
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5"
        style={{ paddingTop: 'calc(var(--safe-top) + 16px)', paddingBottom: `calc(var(--safe-bottom) + ${nav ? 104 : 24}px)` }}>
        {children}
      </div>
    </div>
  );
}

export function Header({ title, right }: { title?: string; right?: ReactNode }) {
  const nav = useNavigate();
  return (
    <div className="flex items-center justify-between gap-3 pb-4">
      <button aria-label="Назад" onClick={() => nav(-1)} className="grid h-11 w-11 place-items-center rounded-full bg-white/15 active:scale-95">
        <ArrowLeft size={20} />
      </button>
      {title && <h1 className="flex-1 truncate text-right font-display text-xl font-medium">{title}</h1>}
      {right}
    </div>
  );
}

type BtnProps = { children: ReactNode; onClick?: () => void; variant?: 'cream' | 'red' | 'ghost' | 'green'; disabled?: boolean; loading?: boolean; className?: string; type?: 'button' | 'submit' };
export function Button({ children, onClick, variant = 'cream', disabled, loading, className = '', type = 'button' }: BtnProps) {
  const v = { cream: 'bg-cream text-cocoa', red: 'bg-cherry text-cream-50', ghost: 'bg-white/12 text-cream-50', green: 'bg-pine text-cream-50' }[variant];
  return (
    <motion.button type={type} disabled={disabled || loading} aria-busy={loading || undefined}
      whileTap={{ scale: motionTokens.scale.pressed }} transition={{ duration: motionTokens.duration.instant }}
      onClick={() => { haptic('light'); onClick?.(); }}
      className={`${v} flex h-14 items-center justify-center gap-2 rounded-full px-6 text-base font-bold transition-colors disabled:opacity-40 ${className}`}>
      {loading && <span aria-hidden className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />}
      {children}
    </motion.button>
  );
}

const HUES = ['#D5361C', '#006B43', '#E6B96C', '#82736B', '#8E1F10', '#2A5BB0'];
export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const h = HUES[[...name].reduce((s, c) => s + c.charCodeAt(0), 0) % HUES.length];
  return (
    <span className="grid shrink-0 place-items-center rounded-full font-bold text-cream-50 ring-2 ring-cocoa"
      style={{ width: size, height: size, background: h, fontSize: size * 0.42 }}>{name.slice(0, 1).toUpperCase()}</span>
  );
}

export function Chip({ children, on, onClick }: { children: ReactNode; on?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} className={`rounded-full px-4 py-2 text-sm font-bold transition ${on ? 'bg-cream text-cocoa' : 'bg-white/12 text-cream-50'}`}>{children}</button>
  );
}

/** Swipe-to-confirm control from the reference. Also activates with Enter/Space for keyboard users. */
export function SwipeToConfirm({ label, onConfirm, tone = 'glass' }: { label: string; onConfirm: () => void; tone?: 'glass' | 'taupe' }) {
  const track = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const [max, setMax] = useState(0);
  useEffect(() => {
    const measure = () => setMax(Math.max(0, (track.current?.clientWidth ?? 0) - 64));
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);
  const fade = useTransform(x, [0, max || 1], [1, 0]);
  const fire = () => { haptic('success'); onConfirm(); };
  return (
    <div ref={track} className={`relative h-16 overflow-hidden rounded-full ${tone === 'glass' ? 'bg-black/25' : 'bg-taupe/60'}`}>
      <motion.span style={{ opacity: fade }} className="absolute inset-0 grid place-items-center pl-12 text-sm font-medium text-cream-50">{label}</motion.span>
      <motion.div role="button" tabIndex={0} aria-label={label}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fire(); }}
        drag="x" dragConstraints={{ left: 0, right: max }} dragElastic={0} dragMomentum={false} style={{ x }}
        onDragEnd={() => { const done = x.get() > max * 0.8; animate(x, 0, { type: 'spring', stiffness: 400, damping: 30 }); if (done) fire(); }}
        className="absolute left-1 top-1 grid h-14 w-14 cursor-grab touch-none place-items-center rounded-full bg-white text-cocoa">
        <ChevronsRight size={22} />
      </motion.div>
    </div>
  );
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)}
      className={`relative h-8 w-14 shrink-0 rounded-full transition ${on ? 'bg-pine' : 'bg-white/20'}`}>
      <span className={`absolute top-1 h-6 w-6 rounded-full bg-cream-50 transition-all ${on ? 'left-7' : 'left-1'}`} />
    </button>
  );
}

export const fmtDate = (iso: string) => iso ? new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }) : 'Дата не выбрана';
export const rub = (n: number) => `${n.toLocaleString('ru-RU')} ₽`;
