import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useDragControls } from 'motion/react'
import { DUR, SHEET_SPRING, tween } from '@/motion/tokens'
import { NavLink } from 'react-router'
import type { Person } from '@/domain/types'
import { haptic } from '@/lib/telegram'
import { Icon, type IconName } from './Icon'
import { useUi } from '@/data/uiStore'

export function Avatar({ person, size = 40, ring }: { person?: Person; size?: number; ring?: boolean }) {
  const initial = person?.name?.[0]?.toUpperCase() ?? '?'
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-medium text-snow ${ring ? 'ring-[3px] ring-cocoa' : ''}`}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.42,
        background: `radial-gradient(circle at 30% 25%, ${lighten(person?.tint ?? '#8C7B71')}, ${person?.tint ?? '#8C7B71'} 60%)`,
      }}
      aria-label={person?.name}
    >
      {initial}
    </span>
  )
}

function lighten(hex: string) {
  const n = parseInt(hex.slice(1), 16)
  const r = Math.min(255, (n >> 16) + 60)
  const g = Math.min(255, ((n >> 8) & 255) + 60)
  const b = Math.min(255, (n & 255) + 60)
  return `rgb(${r},${g},${b})`
}

export function AvatarStack({ people, max = 4, size = 34 }: { people: Person[]; max?: number; size?: number }) {
  const shown = people.slice(0, max)
  const rest = people.length - shown.length
  return (
    <span className="flex items-center">
      {shown.map((p, i) => (
        <span key={p.id} style={{ marginLeft: i ? -size * 0.32 : 0 }}>
          <Avatar person={p} size={size} ring />
        </span>
      ))}
      {rest > 0 && (
        <span
          className="inline-flex items-center justify-center rounded-full bg-taupe text-caption font-medium text-snow ring-[3px] ring-cocoa"
          style={{ width: size, height: size, marginLeft: -size * 0.32 }}
        >
          +{rest}
        </span>
      )}
    </span>
  )
}

export function Chip({
  active,
  children,
  onClick,
  tone = 'dark',
}: {
  active?: boolean
  children: ReactNode
  onClick?: () => void
  tone?: 'dark' | 'light'
}) {
  const base =
    tone === 'dark'
      ? active
        ? 'bg-snow text-ink'
        : 'bg-white/8 text-snow ring-1 ring-white/12'
      : active
        ? 'bg-ink text-snow'
        : 'bg-ink/6 text-ink ring-1 ring-ink/10'
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={() => {
        haptic.select()
        onClick?.()
      }}
      aria-pressed={active}
      className={`inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-secondary transition-colors ${base}`}
    >
      {children}
    </motion.button>
  )
}

/** Clearly identifies simulated content (brief: demo must be obvious). */
export function DemoBadge({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full bg-marzipan/15 px-2.5 py-1 text-caption font-medium text-marzipan ${className}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-marzipan" />
      Демо-режим
    </span>
  )
}

/** Bottom sheet — the reference's rounded panel, used for all secondary flows. */
export function Sheet({
  open,
  onClose,
  children,
  title,
  tone = 'marzipan',
}: {
  open: boolean
  onClose: () => void
  children: ReactNode
  title?: string
  tone?: 'marzipan' | 'cocoa'
}) {
  // Drag-to-close starts only from the grab handle, so inputs, selects and the sheet's own
  // scroll never fight the gesture (Telegram WebView + long forms).
  const drag = useDragControls()
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Portal to <body>: screens are transformed (page transitions), which would
  // otherwise trap the sheet below the floating dock.
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true" aria-label={title}>
          <motion.div
            className="absolute inset-0 bg-bark/70 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={tween(0.22)}
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={SHEET_SPRING}
            drag="y"
            dragListener={false}
            dragControls={drag}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => (info.offset.y > 120 || info.velocity.y > 600) && onClose()}
            className={`relative max-h-[88dvh] w-full max-w-[480px] overflow-y-auto rounded-t-[40px] px-5 pt-3 ${
              tone === 'marzipan' ? 'bg-marzipan text-ink' : 'bg-truffle text-snow'
            }`}
            style={{ paddingBottom: 'calc(var(--sa-bottom) + 20px)' }}
          >
            <div
              aria-hidden
              data-sheet-handle
              onPointerDown={(e) => drag.start(e)}
              className="-mx-5 -mt-3 mb-1 flex h-9 cursor-grab touch-none items-center justify-center active:cursor-grabbing"
            >
              <span className="h-1.5 w-12 rounded-full bg-current opacity-20" />
            </div>
            {title && <h2 className="type-h3 mb-4 text-center">{title}</h2>}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string
  children: ReactNode
  hint?: string
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-secondary opacity-70">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-caption opacity-55">{hint}</span>}
    </label>
  )
}

export const inputLight =
  'h-14 w-full rounded-[20px] bg-snow px-5 text-button text-ink placeholder:text-ink/35 outline-none ring-1 ring-ink/8 focus:ring-2 focus:ring-ember'
export const inputDark =
  'h-14 w-full rounded-[20px] bg-white/7 px-5 text-button text-snow placeholder:text-snow/35 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-marzipan'

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => {
        haptic.select()
        onChange(!checked)
      }}
      className="flex w-full items-center justify-between gap-4 py-3 text-left text-body"
    >
      <span>{label}</span>
      <span className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${checked ? 'bg-ember' : 'bg-ink/15'}`}>
        <motion.span
          layout
          transition={{ type: 'spring', stiffness: 600, damping: 35 }}
          className={`absolute top-1 h-6 w-6 rounded-full bg-snow shadow ${checked ? 'right-1' : 'left-1'}`}
        />
      </span>
    </button>
  )
}

export function Progress({ value, tone = 'ember' }: { value: number; tone?: 'ember' | 'pine' | 'marzipan' }) {
  const c = { ember: 'bg-ember', pine: 'bg-pine-glow', marzipan: 'bg-marzipan' }[tone]
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
      <motion.div className={`h-full rounded-full ${c}`} initial={{ width: 0 }} animate={{ width: `${Math.round(value * 100)}%` }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} />
    </div>
  )
}

/** Step dots (reference screen 3: the small red dash among dots). */
export function Steps({ count, current }: { count: number; current: number }) {
  return (
    <div className="flex items-center gap-1.5" aria-label={`Шаг ${current + 1} из ${count}`}>
      {Array.from({ length: count }, (_, i) => (
        <motion.span
          key={i}
          layout
          className={`h-1 rounded-full ${i === current ? 'w-9 bg-ember' : 'w-1.5 bg-taupe'}`}
        />
      ))}
    </div>
  )
}

const dockItems: { to: string; icon: IconName; label: string }[] = [
  { to: '/home', icon: 'home', label: 'Главная' },
  { to: '/wishlist', icon: 'gift', label: 'Вишлист' },
  { to: '/chats', icon: 'chat', label: 'Чаты' },
  { to: '/profile', icon: 'user', label: 'Профиль' },
]

/** Height of the bottom navigation incl. its bottom gap — screens reserve exactly this space. */
export const NAV_SPACE = 'calc(var(--sa-bottom) + 96px)'

/**
 * Bottom navigation (reference 04-home): a solid rounded bar spanning the width,
 * four icons, the active one inside a cream circle that slides between items.
 * It never floats over content — every dock screen reserves NAV_SPACE.
 */
export function Dock() {
  // Ignore taps for a moment after mounting so the tap that navigated here
  // can't "fall through" onto a dock item (ghost click on touch devices).
  const [armed, setArmed] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setArmed(true), 300)
    return () => clearTimeout(t)
  }, [])
  return (
    <nav
      className={`fixed inset-x-4 z-40 mx-auto flex h-[65px] max-w-[448px] items-center justify-between rounded-[33px] bg-[#30221b] px-[21px] shadow-[0_12px_30px_-10px_rgba(0,0,0,.55),inset_0_1px_0_rgba(255,255,255,.05)] ring-1 ring-white/[0.06] ${armed ? '' : 'pointer-events-none'}`}
      style={{ bottom: 'calc(var(--sa-bottom) + 16px)' }}
      aria-label="Основная навигация"
    >
      {dockItems.map((it) => (
        <NavLink
          key={it.to}
          to={it.to}
          aria-label={it.label}
          onClick={() => haptic.select()}
          className={({ isActive }) => `relative flex h-[51px] w-[51px] items-center justify-center rounded-full transition-colors duration-150 ${isActive ? 'text-ink' : 'text-snow/85'}`}
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <motion.span
                  layoutId="dock-active"
                  transition={{ type: 'spring', stiffness: 520, damping: 40 }}
                  className="absolute inset-0 rounded-full bg-snow"
                  aria-hidden
                />
              )}
              <motion.span className="relative flex" whileTap={{ scale: 0.86 }} transition={{ type: 'spring', stiffness: 700, damping: 30 }}>
                <Icon name={it.icon} size={27} strokeWidth={1.7} />
              </motion.span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}

export function Toasts() {
  const toasts = useUi((s) => s.toasts)
  return (
    <div className="pointer-events-none fixed inset-x-0 z-[60] flex flex-col items-center gap-2 px-5" style={{ top: 'calc(var(--content-top) + 12px)' }}>
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: tween(DUR.toast) }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 rounded-full bg-snow px-5 py-3 text-callout text-ink shadow-[0_12px_30px_-8px_rgba(0,0,0,.5)]"
            role="status"
          >
            <Icon name={t.kind === 'error' ? 'x' : 'check'} size={18} className={t.kind === 'error' ? 'text-ember' : 'text-pine'} />
            {t.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

export function Empty({ art, title, text, action }: { art: ReactNode; title: string; text: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-8 py-6 text-center">
      {art}
      <h3 className="type-h3 mt-3">{title}</h3>
      <p className="mt-2 max-w-[30ch] text-callout opacity-65">{text}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
