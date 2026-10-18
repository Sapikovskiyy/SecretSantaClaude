import { useEffect, useLayoutEffect, type ReactNode } from 'react'
import { useNavigate, useNavigationType } from 'react-router'
import { motion } from 'motion/react'
import { bindBackButton, isTelegram } from '@/lib/telegram'
import { DUR, tween } from '@/motion/tokens'
import { IconButton } from './Buttons'

export type Surface = 'cocoa' | 'ember' | 'pine' | 'marzipan'

const surfaces: Record<Surface, string> = {
  cocoa: 'bg-cocoa text-snow',
  ember: 'bg-cocoa text-snow',
  pine: 'bg-pine-deep text-snow',
  marzipan: 'bg-marzipan text-ink',
}

/** Ambient light that gives each surface its "material" — the reference's glow. */
function Glow({ surface }: { surface: Surface }) {
  if (surface === 'ember')
    return (
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[38%] h-[120%] w-[160%] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,#d8371c_0%,#9b2513_45%,rgba(42,31,27,0)_100%)] opacity-95" />
        <div className="absolute -left-10 top-[44%] h-48 w-48 rounded-full bg-[radial-gradient(closest-side,rgba(255,138,92,.45),transparent)]" />
      </div>
    )
  if (surface === 'pine')
    return (
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[30%] h-[110%] w-[150%] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,#13854f_0%,#0b6b42_45%,rgba(7,70,43,0)_100%)]" />
      </div>
    )
  return null
}

interface ScreenProps {
  children: ReactNode
  surface?: Surface
  /** Show the round back button (and Telegram BackButton). */
  back?: boolean | string
  /** Right side header slot */
  right?: ReactNode
  className?: string
  /** Leave room at the bottom for the dock */
  withDock?: boolean
}

export function Screen({ children, surface = 'cocoa', back, right, className = '', withDock, headless }: ScreenProps & { headless?: boolean }) {
  const navigate = useNavigate()
  const navType = useNavigationType()
  const goBack = () => (typeof back === 'string' ? navigate(back) : navigate(-1))

  useEffect(() => bindBackButton(Boolean(back), goBack), [back]) // eslint-disable-line react-hooks/exhaustive-deps

  // Every screen opens at the top (the window scroll otherwise carries over between routes).
  useLayoutEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  // Navigation-aware transition (motion spec: 220–320 ms, 6–16 px): back slides from the left.
  const dir = navType === 'POP' ? -1 : 1
  const showHeader = !headless && ((back && !isTelegram) || right)
  return (
    <motion.main
      initial={{ opacity: 0, x: 12 * dir }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 * dir }}
      transition={tween(DUR.page)}
      className={`relative mx-auto flex min-h-dvh w-full max-w-[480px] flex-col overflow-x-clip ${surfaces[surface]} ${className}`}
      style={{ paddingTop: 'calc(var(--content-top) + 12px)', paddingBottom: withDock ? 'calc(var(--sa-bottom) + 108px)' : 'calc(var(--sa-bottom) + 16px)' }}
    >
      <Glow surface={surface} />
      {showHeader && (
        <header className="relative z-10 flex items-center justify-between px-5 pb-2">
          {back && !isTelegram ? (
            <IconButton icon="back" label="Назад" onClick={goBack} tone={surface === 'marzipan' ? 'light' : 'dark'} />
          ) : (
            <span />
          )}
          {right}
        </header>
      )}
      <div className="relative z-10 flex flex-1 flex-col">{children}</div>
    </motion.main>
  )
}
