/**
 * 10 · Recipient reveal — sheet 03/screen 10. Santomi's signature moment.
 * Scenario (motion spec): idle → tap (120 ms) → opening (≈650 ms) → glow (≈250 ms)
 * → recipient card rises (≈420 ms) → done. ≈1.5 s total, always skippable, plain fade
 * under reduced motion. It only PRESENTS the stored assignment — it can never draw.
 */
import { useEffect, useRef, useState } from 'react'
import { Navigate, useParams } from 'react-router'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Screen } from '@/components/ui/Screen'
import { Avatar } from '@/components/ui/Kit'
import { Icon, type IconName } from '@/components/ui/Icon'
import { Art } from '@/components/art/Art'
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

export function Reveal() {
  const { id } = useParams()
  const room = useDemo((s) => s.rooms.find((r) => r.id === id))
  const markSeen = useDemo((s) => s.markRevealSeen)
  const recipient = usePerson(room?.myRecipientId)
  const reduce = useReducedMotion()
  const [phase, setPhase] = useState<Phase>(room?.revealSeen ? 'done' : 'idle')
  const timers = useRef<number[]>([])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])
  useEffect(() => {
    if ((phase === 'card' || phase === 'done') && room && !room.revealSeen) markSeen(room.id)
  }, [phase, room, markSeen])

  if (!room) return <NotFound />
  if (room.stage === 'gathering' || !recipient) return <Navigate to={`/rooms/${room.id}`} replace />

  const wish = DEMO_WISHLISTS[recipient.id]
  const opened = phase === 'card' || phase === 'done'

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
    <Screen back={`/rooms/${room.id}`} headless className="!pb-0">
      <PageHeader
        back={`/rooms/${room.id}`}
        title="Кому ты даришь"
        right={
          !opened ? (
            <button onClick={skip} className="h-11 whitespace-nowrap px-1 text-secondary font-semibold text-snow/70">
              Пропустить
            </button>
          ) : undefined
        }
      />

      {/* Stage */}
      <div className="relative flex h-[380px] items-end justify-center overflow-hidden">
        <div aria-hidden className="absolute inset-x-0 top-0 h-full bg-[radial-gradient(60%_55%_at_50%_60%,rgba(213,54,28,.75),rgba(40,29,25,0))]" />
        <motion.div
          aria-hidden
          className="absolute left-1/2 top-[48%] h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(255,226,160,.85),rgba(230,185,108,.35)_45%,transparent)]"
          initial={false}
          animate={{ opacity: phase === 'glow' || opened ? 1 : 0, scale: phase === 'glow' ? 1.25 : opened ? 1 : 0.5 }}
          transition={{ duration: reduce ? 0 : 0.3, ease: EASE }}
        />
        <div className="float-a absolute left-[8%] top-[10%]">
          <Art name="star" size={34} noShadow />
        </div>
        <div className="float-b absolute right-[9%] top-[16%]">
          <Art name="star" size={26} noShadow />
        </div>

        {/* Closed gift → open glowing box */}
        <AnimatePresence initial={false}>
          {!opened && phase !== 'glow' ? (
            <motion.button
              key="closed"
              aria-label="Открыть подарок"
              onClick={open}
              className="relative mb-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={
                phase === 'tap'
                  ? { scale: 0.94 }
                  : phase === 'opening'
                    ? { rotate: [0, -6, 6, -4, 3, 0], y: [0, -14, 0, -8, 0], scale: [1, 1.04, 1.02, 1.06, 1.1] }
                    : { opacity: 1, scale: 1, rotate: [-1.5, 1.5, -1.5] }
              }
              exit={{ opacity: 0, scale: 1.18, transition: { duration: 0.22 } }}
              transition={
                phase === 'tap' ? { duration: 0.12 } : phase === 'opening' ? { duration: 0.65, ease: 'easeInOut' } : { rotate: { duration: 3, repeat: Infinity, ease: 'easeInOut' }, default: { duration: 0.3 } }
              }
            >
              <Art name="gift" size={230} eager />
            </motion.button>
          ) : (
            <motion.div key="open" className="relative mb-2" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3, ease: EASE }}>
              <Art name="gift-star" size={240} eager />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recipient card rises out of the box */}
        <AnimatePresence>
          {opened && (
            <motion.div
              key="card"
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 120, scale: 0.8, rotate: -4 }}
              animate={{ opacity: 1, y: 0, scale: 1, rotate: -3 }}
              transition={{ duration: reduce ? 0.2 : 0.42, ease: EASE }}
              className="absolute top-3 flex w-[64%] max-w-[250px] flex-col items-center rounded-[26px] bg-snow px-5 pb-5 pt-4 text-center text-ink shadow-[0_24px_50px_-20px_rgba(0,0,0,.6)]"
            >
              <p className="text-callout font-semibold text-ember">Ты даришь подарок</p>
              <div className="mt-3 rounded-full p-1 ring-2 ring-gold">
                <Avatar person={recipient} size={92} />
              </div>
              <p className="mt-3 text-section">{recipient.name}</p>
              <Art name="cane" size={28} noShadow className="mt-1" />
            </motion.div>
          )}
        </AnimatePresence>

        {phase === 'idle' && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="absolute bottom-1 text-secondary text-snow/70">
            Нажмите на подарок
          </motion.p>
        )}
      </div>

      <section className="relative z-10 flex-1 rounded-t-[32px] bg-marzipan px-5 pb-8 pt-6 text-ink">
        <AnimatePresence mode="wait">
          {opened ? (
            <motion.div key="hints" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: reduce ? 0 : 0.15 }}>
              <h2 className="text-card font-semibold">Несколько подсказок</h2>
              <ul className="mt-3 space-y-2">
                {hints.map((h) => (
                  <li key={h.text} className="flex items-center gap-3 rounded-[16px] bg-snow px-4 py-3 text-callout">
                    <Icon name={h.icon} size={18} className="shrink-0 text-ember" />
                    {h.text}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-caption text-ink-soft">Это секрет: никто, кроме вас, не знает, кому вы дарите</p>
              <div className="mt-5 space-y-2.5">
                <SantomiLinkButton to={`/rooms/${room.id}/recipient`} fullWidth leadingIcon="gift" trailingIcon="arrowRight">
                  Посмотреть вишлист
                </SantomiLinkButton>
                {room.chatEnabled && room.stage === 'drawn' && (
                  <SantomiLinkButton to={`/rooms/${room.id}/chat/toRecipient`} variant="ghost" fullWidth leadingIcon="chat" className="text-ink">
                    Написать анонимно
                  </SantomiLinkButton>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div key="wait" exit={{ opacity: 0 }} className="py-4 text-center">
              <p className="text-card font-semibold">{room.name}</p>
              <p className="mt-1 text-secondary text-ink-soft">Ваш получатель уже выбран. Откройте подарок, чтобы узнать, кто это.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </Screen>
  )
}
