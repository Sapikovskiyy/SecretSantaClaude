import { useRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { animate, motion, useMotionValue, useTransform } from 'motion/react'
import { haptic } from '@/lib/telegram'
import { Chevrons, Icon, type IconName } from './Icon'
import { SantomiButton, type ButtonVariant } from '@/components/ds/SantomiButton'

type Tone = 'ember' | 'snow' | 'dark' | 'taupe' | 'pine' | 'ghost' | 'gold' | 'danger'

/** Legacy tones → SantomiButton variants (keeps older screens on one button system). */
const TONE_TO_VARIANT: Record<Tone, ButtonVariant> = {
  ember: 'primary',
  pine: 'success',
  gold: 'premium',
  snow: 'secondary',
  taupe: 'secondary',
  dark: 'ghost',
  ghost: 'ghost',
  danger: 'danger',
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: Tone
  icon?: IconName
  size?: 'md' | 'lg'
  loading?: boolean
  children?: ReactNode
}

/** @deprecated use SantomiButton directly in new code. */
export function Button({ tone = 'ember', icon, size = 'lg', loading, ...rest }: BtnProps) {
  return <SantomiButton variant={TONE_TO_VARIANT[tone]} size={size === 'lg' ? 'large' : 'medium'} leadingIcon={icon} loading={loading} {...rest} />
}

/** Round icon button (reference: back button, check circles). */
export function IconButton({
  icon,
  label,
  onClick,
  tone = 'dark',
  size = 52,
  className = '',
  badge,
}: {
  icon: IconName
  label: string
  onClick?: () => void
  tone?: 'dark' | 'light' | 'snow' | 'ember' | 'taupe'
  size?: number
  className?: string
  badge?: number
}) {
  const t = {
    dark: 'bg-truffle/80 text-snow backdrop-blur-md',
    light: 'bg-ink/10 text-ink',
    snow: 'bg-snow text-ink',
    ember: 'bg-ember text-snow',
    taupe: 'bg-taupe/60 text-snow',
  }[tone]
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      aria-label={label}
      title={label}
      onClick={() => {
        haptic.tap()
        onClick?.()
      }}
      className={`relative inline-flex shrink-0 items-center justify-center rounded-full ${t} ${className}`}
      style={{ width: size, height: size }}
    >
      <Icon name={icon} size={Math.round(size * 0.42)} />
      {badge ? (
        <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-ember px-1 text-caption font-semibold text-snow ring-2 ring-cocoa">
          {badge}
        </span>
      ) : null}
    </motion.button>
  )
}

/**
 * Swipe-to-confirm pill — Santomi's signature control, straight from the reference.
 * Drag the knob to the end (or tap / press Enter for accessibility) to confirm.
 */
export function SwipeConfirm({
  label,
  onConfirm,
  tone = 'dark',
  knobIcon = 'forward',
  disabled,
  className = '',
  hero = false,
}: {
  label: string
  onConfirm: () => void
  tone?: 'dark' | 'taupe' | 'ember' | 'glass'
  /** Welcome-screen size from reference 01: 74 px track, 65 px cream knob with »»» chevrons. */
  hero?: boolean
  knobIcon?: IconName
  disabled?: boolean
  className?: string
}) {
  const track = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const [done, setDone] = useState(false)
  const labelOpacity = useTransform(x, [0, 140], [1, 0])
  const KNOB = hero ? 65 : 56
  const PAD = hero ? 5 : 6

  const max = () => (track.current ? track.current.offsetWidth - KNOB - PAD * 2 : 200)

  const busy = useRef(false)
  const finish = () => {
    if (busy.current || done || disabled) return
    busy.current = true
    setDone(true)
    haptic.success()
    animate(x, max(), { type: 'spring', stiffness: 400, damping: 35 })
    setTimeout(() => {
      onConfirm()
      busy.current = false
      setDone(false)
      x.set(0)
    }, 260)
  }

  const bg = {
    dark: 'bg-truffle/75 text-snow backdrop-blur-xl ring-1 ring-white/5',
    taupe: 'bg-taupe text-snow',
    ember: 'bg-ember-deep/70 text-snow backdrop-blur-xl',
    // Dark translucent pill over the welcome illustration — no live blur (cheap on WebView).
    glass: 'bg-[rgba(36,15,10,0.74)] text-snow ring-1 ring-white/[0.07]',
  }[tone]

  return (
    <div
      ref={track}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={label}
      aria-disabled={disabled}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && finish()}
      onClick={(e) => {
        // Tapping the track (not dragging) also confirms — accessibility & speed.
        if ((e.target as HTMLElement).dataset.knob !== 'true') finish()
      }}
      className={`relative flex ${hero ? 'h-[74px]' : 'h-[68px]'} w-full select-none items-center rounded-full ${bg} ${disabled ? 'opacity-40' : ''} ${className}`}
      style={{ padding: PAD }}
    >
      <motion.div
        data-knob="true"
        drag={disabled ? false : 'x'}
        dragConstraints={{ left: 0, right: max() }}
        dragElastic={0.05}
        dragMomentum={false}
        style={{ x, width: KNOB, height: KNOB }}
        onDragEnd={() => {
          if (x.get() > max() * 0.7) finish()
          else animate(x, 0, { type: 'spring', stiffness: 500, damping: 30 })
        }}
        onTap={finish}
        className="relative z-10 flex cursor-grab items-center justify-center rounded-full bg-snow text-ink shadow-[0_6px_18px_rgba(0,0,0,.25)] active:cursor-grabbing"
      >
        {hero ? (
          <Chevrons still className="pointer-events-none text-ink" />
        ) : (
          <Icon name={knobIcon} size={22} strokeWidth={2} className="pointer-events-none" />
        )}
      </motion.div>
      <motion.span
        style={{ opacity: labelOpacity, paddingLeft: hero ? KNOB + PAD : 48 }}
        className={`pointer-events-none absolute inset-0 flex items-center justify-center gap-3 ${hero ? 'text-card font-normal' : 'text-body'}`}
      >
        {label}
        {!hero && <Chevrons className="opacity-60" />}
      </motion.span>
    </div>
  )
}
