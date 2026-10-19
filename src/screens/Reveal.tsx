/**
 * 10 · Recipient reveal — design/references/05-full-screen-overview.jpeg («Your recipient is…»).
 * Rich Christmas-red stage with soft out-of-focus gifts; sealed gift built from two CEO renders
 * (box + lid, aligned in one frame) → tap → the lid lifts away, warm light, the cream recipient
 * card rises; one red CTA «Посмотреть вишлист».
 * Scenario (motion spec): idle → tap (120 ms) → opening (≈650 ms) → glow (≈250 ms)
 * → card (≈420 ms) → done. ≈1.5 s total, always skippable, plain fade under reduced motion.
 * It only PRESENTS the stored assignment — it can never draw.
 */
import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Screen } from '@/components/ui/Screen'
import { Avatar, Sheet } from '@/components/ui/Kit'
import { Icon, type IconName } from '@/components/ui/Icon'
import { Art, artUrl } from '@/components/art/Art'
import { PageHeader, SantomiLinkButton } from '@/components/ds'
import { useDemo } from '@/data/demoStore'
import { usePerson } from '@/data/people'
import { DEMO_WISHLISTS } from '@/data/demoSeed'
import { interestById } from '@/domain/interests'
import { formatRub, plural } from '@/lib/format'
import { haptic } from '@/lib/telegram'
import { EASE } from '@/motion/tokens'
import { NotFound } from './NotFound'

type Phase = 'idle' | 'tap' | 'opening' | 'glow' | 'card' | 'done'

/** Box width; lid geometry is derived from the two renders (same source frame, base-width units). */
const BOX = 216
const LID = { left: -0.0683 * BOX, top: -0.389 * BOX, width: 1.1404 * BOX }
const BOX_H = 0.7837 * BOX

export function Reveal() {
  const { id } = useParams()
  const room = useDemo((s) => s.rooms.find((r) => r.id === id))
  const markSeen = useDemo((s) => s.markRevealSeen)
  const recipient = usePerson(room?.myRecipientId)
  const reduce = useReducedMotion()
  const [phase, setPhase] = useState<Phase>(room?.revealSeen ? 'done' : 'idle')
  const [hintsOpen, setHintsOpen] = useState(false)
  const timers = useRef<number[]>([])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])
  useEffect(() => {
    if ((phase === 'card' || phase === 'done') && room && !room.revealSeen) markSeen(room.id)
  }, [phase, room, markSeen])

  if (!room) return <NotFound />
  if (room.stage === 'gathering' || !recipient) return <Navigate to={`/rooms/${room.id}`} replace />

  const wish = DEMO_WISHLISTS[recipient.id]
  const opened = phase === 'card' || phase === 'done'
  const lifting = phase === 'opening' || phase === 'glow' || opened

  const open = () => {
    if (phase !== 'idle') return
    haptic.press()
    if (reduce) return setPhase('done')
    const at = (ms: number, p: Phase) => timers.current.push(window.setTimeout(() => setPhase(p), ms))
    setPhase('tap')
    at(120, 'opening')
    at(770, 'glow')
    at(1020, 'card')
    at(1480, 'done')
    timers.current.push(window.setTimeout(() => haptic.success(), 1020))
  }
  const skip = () => {
    timers.current.forEach(clearTimeout)
    setPhase('done')
  }

  const hints: { icon: IconName; text: string }[] = [
    ...(wish?.interests ?? []).slice(0, 3).map((i) => ({ icon: 'heart' as IconName, text: `Любит: ${interestById[i].title.toLowerCase()}` })),
    ...(wish?.items.length ? [{ icon: 'gift' as IconName, text: `В вишлисте ${wish.items.length} ${plural(wish.items.length, 'желание', 'желания', 'желаний')}` }] : []),
    ...(wish?.avoid.length ? [{ icon: 'alert' as IconName, text: `Лучше не дарить: ${wish.avoid.join(', ').toLowerCase()}` }] : []),
    { icon: 'wallet', text: `Бюджет — до ${formatRub(room.budget)}` },
  ]

  return (
    <Screen back={`/rooms/${room.id}`} headless className="!pb-0 !bg-[#8e1f0e]">
      {/* Stage background: deep Christmas red + soft out-of-focus gifts (static decor) */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(110%_70%_at_50%_34%,#c9351f_0%,#9e2512_48%,#5c140a_100%)]" />
        <div className="absolute -left-12 top-[22%] opacity-80 blur-[3px]">
          <Art name="gift-green" size={150} noShadow />
        </div>
        <div className="absolute -right-14 top-[12%] rotate-12 opacity-75 blur-[4px]">
          <Art name="gift" size={140} noShadow />
        </div>
        <div className="absolute -bottom-6 -left-8 opacity-70 blur-[5px]">
          <Art name="gift" size={170} noShadow />
        </div>
        <div className="absolute -bottom-10 -right-10 opacity-70 blur-[4px]">
          <Art name="gift-green" size={190} noShadow />
        </div>
        <div className="float-a absolute left-[7%] top-[58%]">
          <Art name="star" size={40} noShadow />
        </div>
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-[linear-gradient(to_top,rgba(60,12,6,.55),transparent)]" />
      </div>

      <PageHeader
        back={`/rooms/${room.id}`}
        right={
          !opened ? (
            <button onClick={skip} className="h-11 whitespace-nowrap px-1 text-secondary font-semibold text-snow/75">
              Пропустить
            </button>
          ) : undefined
        }
      />

      <AnimatePresence mode="wait" initial={false}>
        <motion.h1
          key={opened ? 'open' : 'sealed'}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.24, ease: EASE }}
          className="t-page-tight relative mx-auto mt-3 max-w-[12ch] text-center text-snow"
        >
          {opened ? 'Твой получатель…' : 'Кому ты даришь?'}
        </motion.h1>
      </AnimatePresence>

      {/* Stage */}
      <div className="relative flex min-h-[330px] flex-1 items-center justify-center">
        {/* warm light from inside the box */}
        <motion.div
          aria-hidden
          className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(255,226,170,.9),rgba(255,180,110,.35)_45%,transparent)]"
          initial={false}
          animate={{ opacity: phase === 'glow' ? 1 : opened ? 0.55 : phase === 'opening' ? 0.6 : 0, scale: phase === 'glow' ? 1.25 : opened ? 1.05 : 0.6 }}
          transition={{ duration: reduce ? 0 : 0.3, ease: EASE }}
        />

        {/* Sealed gift: box + lid */}
        <AnimatePresence>
          {!opened && (
            <motion.button
              key="gift"
              aria-label="Открыть подарок"
              onClick={open}
              className="relative"
              style={{ width: BOX, height: BOX_H - LID.top }}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={phase === 'tap' ? { opacity: 1, scale: 0.95 } : { opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.06, y: 16, transition: { duration: 0.25 } }}
              transition={{ duration: phase === 'tap' ? 0.12 : 0.3, ease: EASE }}
            >
              <span className="absolute inset-x-[8%] bottom-[-14px] h-7 rounded-[50%] bg-[radial-gradient(closest-side,rgba(40,6,2,.55),transparent)]" />
              <span className="absolute left-0 bottom-0 block" style={{ width: BOX }}>
                <img src={artUrl('gift-base')} alt="" draggable={false} className="block w-full select-none" />
              </span>
              <motion.span
                className="absolute block"
                style={{ left: LID.left, top: 0, width: LID.width, transformOrigin: '70% 80%' }}
                initial={false}
                animate={
                  lifting
                    ? { y: -BOX * 0.62, x: BOX * 0.2, rotate: 16, opacity: 0 }
                    : phase === 'idle'
                      ? { y: [0, -3, 0], rotate: 0, opacity: 1 }
                      : { y: 0, rotate: 0, opacity: 1 }
                }
                transition={
                  lifting
                    ? { duration: 0.6, ease: [0.3, 0.7, 0.4, 1], opacity: { duration: 0.6, delay: 0.25 } }
                    : phase === 'idle'
                      ? { duration: 2.6, repeat: Infinity, ease: 'easeInOut' }
                      : { duration: 0.12 }
                }
              >
                <img src={artUrl('gift-lid')} alt="" draggable={false} className="block w-full select-none" />
              </motion.span>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Recipient card rises out of the light */}
        <AnimatePresence>
          {opened && (
            <motion.div
              key="card"
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 90, scale: 0.78 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: reduce ? 0.2 : 0.42, ease: EASE }}
              className="absolute mt-[48px] flex w-[76%] max-w-[300px] flex-col items-center rounded-[30px] bg-[linear-gradient(180deg,#fff1e3,#fde5cf)] px-6 pb-6 pt-[86px] text-center text-ink shadow-[0_30px_60px_-24px_rgba(40,6,2,.75)]"
            >
              <span className="absolute -top-[54px] flex h-[132px] w-[132px] items-center justify-center rounded-[36px] bg-[linear-gradient(180deg,#fff4e8,#f8dcc3)] shadow-[0_14px_30px_-16px_rgba(40,6,2,.6)]">
                <Avatar person={recipient} size={104} />
              </span>
              <p className="text-hero font-semibold leading-none tracking-[-0.02em]">{recipient.name}</p>
              <p className="mt-3 text-callout leading-snug text-ink/80">Теперь можно посмотреть вишлист и начать готовить подарок!</p>
              <button onClick={() => setHintsOpen(true)} className="mt-3 flex h-10 items-center gap-1.5 rounded-full bg-ink/[0.06] px-4 text-footnote font-semibold text-ink">
                <Icon name="bulb" size={16} className="text-ember" /> Несколько подсказок
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {phase === 'idle' && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="absolute text-secondary text-snow/80" style={{ top: "calc(50% + 150px)" }}>
            Нажмите на подарок
          </motion.p>
        )}
      </div>

      {/* Bottom: one primary action */}
      <div className="relative px-[43px]" style={{ paddingBottom: 'calc(var(--sa-bottom) + 22px)' }}>
        <AnimatePresence mode="wait">
          {opened ? (
            <motion.div key="cta" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: reduce ? 0 : 0.15 }}>
              <SantomiLinkButton to={`/rooms/${room.id}/recipient`} fullWidth trailingIcon="forward">
                Посмотреть вишлист
              </SantomiLinkButton>
              {room.chatEnabled && room.stage === 'drawn' ? (
                <Link to={`/rooms/${room.id}/chat/toRecipient`} className="mt-1 flex h-11 items-center justify-center gap-2 text-secondary font-semibold text-snow/85">
                  <Icon name="chat" size={18} /> Написать анонимно
                </Link>
              ) : (
                <div className="h-12" />
              )}
            </motion.div>
          ) : (
            <motion.div key="wait" exit={{ opacity: 0 }} className="pb-4 text-center">
              <p className="text-callout font-semibold text-snow">{room.name}</p>
              <p className="mx-auto mt-1 max-w-[30ch] text-secondary text-snow/70">Получатель уже выбран. Откройте подарок, чтобы узнать, кто это.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Sheet open={hintsOpen} onClose={() => setHintsOpen(false)} title="Несколько подсказок">
        <ul className="space-y-2">
          {hints.map((h) => (
            <li key={h.text} className="flex items-center gap-3 rounded-[16px] bg-snow px-4 py-3 text-callout text-ink">
              <Icon name={h.icon} size={18} className="shrink-0 text-ember" />
              {h.text}
            </li>
          ))}
        </ul>
        <p className="mt-3 pb-2 text-caption text-ink-soft">Это секрет: никто, кроме вас, не знает, кому вы дарите</p>
      </Sheet>
    </Screen>
  )
}
