import { useRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { animate, motion, useMotionValue, useTransform } from 'motion/react'
import { haptic } from '@/lib/telegram'
import { Chevrons, Icon, type IconName } from './Icon'

type Tone = 'ember' | 'snow' | 'dark' | 'taupe' | 'pine' | 'ghost'

const tones: Record<Tone, string> = {
  ember: 'bg-ember text-snow shadow-[0_10px_30px_-10px_rgba(199,50,28,.8)]',
  snow: 'bg-snow text-ink',
  dark: 'bg-truffle/80 text-snow backdrop-blur-md',
  taupe: 'bg-taupe text-snow',
  pine: 'bg-pine text-snow',
  ghost: 'bg-transparent text-current ring-1 ring-current/25',
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: Tone
  icon?: IconName
  size?: 'md' | 'lg'
  children?: ReactNode
}

/** Pill button. Used for secondary actions and inside panels. */
export function Button({ tone = 'ember', icon, size = 'lg', className = '', children, onClick, ...rest }: BtnProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-medium disabled:opacity-40 ${
        size === 'lg' ? 'h-16 px-7 text-[17px]' : 'h-12 px-5 text-[15px]'
      } ${tones[tone]} ${className}`}
      onClick={(e) => {
        haptic.tap()
        onClick?.(e)
      }}
      {...(rest as object)}
    >
      {icon && <Icon name={icon} size={20} />}
      {children}
    </motion.button>
  )
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
        <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-ember px-1 text-[11px] font-semibold text-snow ring-2 ring-cocoa">
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
}: {
  label: string
  onConfirm: () => void
  tone?: 'dark' | 'taupe' | 'ember'
  knobIcon?: IconName
  disabled?: boolean
  className?: string
}) {
  const track = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const [done, setDone] = useState(false)
  const labelOpacity = useTransform(x, [0, 140], [1, 0])
  const KNOB = 56
  const PAD = 6

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
      className={`relative flex h-[68px] w-full select-none items-center rounded-full ${bg} ${disabled ? 'opacity-40' : ''} ${className}`}
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
        <Icon name={knobIcon} size={22} strokeWidth={2} className="pointer-events-none" />
      </motion.div>
      <motion.span style={{ opacity: labelOpacity }} className="pointer-events-none absolute inset-0 flex items-center justify-center gap-3 pl-12 text-[16px]">
        {label}
        <Chevrons className="opacity-60" />
      </motion.span>
    </div>
  )
}
