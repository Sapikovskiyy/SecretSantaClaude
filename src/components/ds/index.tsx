/**
 * Santomi design-system v2 primitives (handoff §2 component list).
 * Screen-level composition: ScreenShell → PageHeader → hero scene → CreamSheet → PrimaryCTA.
 */
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { motion } from 'motion/react'
import { useNavigate } from 'react-router'
import { haptic, isTelegram } from '@/lib/telegram'
import { Icon, type IconName } from '@/components/ui/Icon'
import { DUR, EASE, PRESS, tween } from '@/motion/tokens'
import { SantomiButton } from './SantomiButton'

/* ───────────────────────── PageHeader ───────────────────────── */

/** Round back button + centered sans title + optional right slot (sheet screens 05–14). */
export function PageHeader({
  title,
  subtitle,
  back,
  right,
  leading,
}: {
  title?: ReactNode
  subtitle?: ReactNode
  /** true = history back; string = explicit route */
  back?: boolean | string
  right?: ReactNode
  leading?: ReactNode
}) {
  const navigate = useNavigate()
  // Inside Telegram the native BackButton is used (ScreenShell binds it), so we hide ours.
  const showBack = back && !isTelegram
  return (
    <header className="relative z-10 flex min-h-[52px] items-center gap-3 px-5">
      <div className="flex w-12 shrink-0 justify-start">
        {showBack && (
          <motion.button
            whileTap={PRESS}
            transition={tween(DUR.press)}
            aria-label="Назад"
            onClick={() => {
              haptic.tap()
              if (typeof back === 'string') navigate(back)
              else navigate(-1)
            }}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-snow backdrop-blur-md"
          >
            <Icon name="back" size={22} />
          </motion.button>
        )}
      </div>
      <div className="flex min-w-0 flex-1 items-center justify-center gap-2 text-center">
        {leading}
        <div className="min-w-0">
          {title && <h1 className="type-screen truncate">{title}</h1>}
          {subtitle && <p className="truncate text-caption text-snow/60">{subtitle}</p>}
        </div>
      </div>
      <div className="flex w-12 shrink-0 justify-end">{right}</div>
    </header>
  )
}

/* ───────────────────────── CTAs ───────────────────────── */

export { SantomiButton, SantomiLinkButton, buttonClass } from './SantomiButton'
export type { ButtonVariant, ButtonSize } from './SantomiButton'

type CTAProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: IconName
  trailing?: IconName
  loading?: boolean
  variant?: 'primary' | 'success' | 'premium'
}

/** The screen's one prominent CTA: large, full-width, dimensional gradient. */
export function PrimaryCTA({ icon, trailing, variant = 'primary', ...rest }: CTAProps) {
  return <SantomiButton variant={variant} size="large" fullWidth leadingIcon={icon} trailingIcon={trailing} {...rest} />
}

/** Quiet outlined pill for the secondary path (e.g. «Присоединиться к игре»). */
export function SecondaryCTA({ icon, trailing, className = '', ...rest }: CTAProps) {
  return <SantomiButton variant="ghost" size="large" fullWidth leadingIcon={icon} trailingIcon={trailing} className={`text-snow ${className}`} {...rest} />
}

/** Three-dot loader (real loading only — never a fake delay). */
export function Dots({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`} role="status" aria-label="Загрузка">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-2 w-2 rounded-full bg-current"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.18, ease: 'easeInOut' }}
        />
      ))}
    </span>
  )
}

/* ───────────────────────── Surfaces ───────────────────────── */

/** Cream panel that rises from the bottom of a chocolate screen. */
export function CreamSheet({ children, className = '', flush }: { children: ReactNode; className?: string; flush?: boolean }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={tween(DUR.card)}
      className={`relative z-10 rounded-t-[32px] bg-marzipan text-ink ${flush ? '' : 'px-5 pt-6'} ${className}`}
    >
      {children}
    </motion.section>
  )
}

/** Segmented control: cream active pill on dark track (or ink on light). */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  tone = 'dark',
  label,
}: {
  value: T
  onChange: (v: T) => void
  options: { id: T; label: ReactNode }[]
  tone?: 'dark' | 'light'
  label: string
}) {
  return (
    <div role="tablist" aria-label={label} className={`relative flex rounded-full p-1 ${tone === 'dark' ? 'bg-white/10' : 'bg-ink/6'}`}>
      {options.map((o) => {
        const active = o.id === value
        return (
          <button
            key={o.id}
            role="tab"
            aria-selected={active}
            onClick={() => {
              haptic.select()
              onChange(o.id)
            }}
            className={`relative z-10 flex h-11 flex-1 items-center justify-center rounded-full px-3 text-secondary font-semibold transition-colors duration-200 ${
              active ? (tone === 'dark' ? 'text-ink' : 'text-snow') : tone === 'dark' ? 'text-snow/70' : 'text-ink/60'
            }`}
          >
            {active && (
              <motion.span
                layoutId={`seg-${label}`}
                transition={{ duration: DUR.chip, ease: EASE }}
                className={`absolute inset-0 -z-10 rounded-full ${tone === 'dark' ? 'bg-marzipan' : 'bg-ember'}`}
              />
            )}
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

/** Status pill with a dot — colour is never the only signal (text always present). */
export function StatusPill({ tone, children }: { tone: 'green' | 'gold' | 'red' | 'muted'; children: ReactNode }) {
  const t = {
    green: 'bg-pine text-snow',
    gold: 'bg-gold/90 text-ink',
    red: 'bg-ember/12 text-ember',
    muted: 'bg-ink/8 text-ink/70',
  }[tone]
  return <span className={`inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-caption font-semibold ${t}`}>{children}</span>
}

/* ───────────────────────── States ───────────────────────── */

export function ErrorState({ title, text, onRetry }: { title: string; text?: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex items-start gap-3 rounded-[20px] bg-ember/10 p-4 text-ink">
      <Icon name="alert" size={20} className="mt-0.5 shrink-0 text-ember" />
      <div className="flex-1">
        <p className="text-callout font-semibold">{title}</p>
        {text && <p className="mt-0.5 text-footnote text-ink/65">{text}</p>}
      </div>
      {onRetry && (
        <button onClick={onRetry} className="h-9 shrink-0 rounded-full bg-ember px-4 text-footnote font-semibold text-snow">
          Повторить
        </button>
      )}
    </div>
  )
}

export function LoadingState({ label = 'Загружаем…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-snow/70">
      <Dots />
      <p className="text-secondary">{label}</p>
    </div>
  )
}

/** Thin progress bar with label row (room / onboarding progress). */
export function StepProgress({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1.5" aria-label={`Шаг ${current} из ${total}`}>
      <span className="text-footnote font-semibold text-snow/70">
        {current} из {total}
      </span>
      <span className="h-1.5 w-full overflow-hidden rounded-full bg-white/12">
        <motion.span
          className="block h-full rounded-full bg-pine-glow"
          initial={false}
          animate={{ width: `${(current / total) * 100}%` }}
          transition={{ duration: 0.4, ease: EASE }}
        />
      </span>
    </div>
  )
}
