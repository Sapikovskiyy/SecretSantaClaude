/**
 * Signature moment: the envelope reveal.
 * The assignment already exists (server-side in production); this screen only
 * plays an animation over data it receives — it can never re-draw.
 */
import { useEffect, useState } from 'react'
import { Navigate, useParams } from 'react-router'
import { AnimatePresence, motion, useMotionValue, useTransform, animate, type MotionValue } from 'motion/react'
import { Screen } from '@/components/ui/Screen'
import { SantomiLinkButton } from '@/components/ds'
import { Avatar } from '@/components/ui/Kit'
import { Art } from '@/components/art/Art'
import { useDemo } from '@/data/demoStore'
import { usePerson } from '@/data/people'
import { formatRub } from '@/lib/format'
import { haptic } from '@/lib/telegram'
import { NotFound } from './NotFound'

type Phase = 'sealed' | 'opening' | 'revealed'

export function Reveal() {
  const { id } = useParams()
  const room = useDemo((s) => s.rooms.find((r) => r.id === id))
  const markSeen = useDemo((s) => s.markRevealSeen)
  const recipient = usePerson(room?.myRecipientId)
  const [phase, setPhase] = useState<Phase>(room?.revealSeen ? 'revealed' : 'sealed')
  const drag = useMotionValue(0)
  const lift = useTransform(drag, [0, -160], [0, 1])
  const flapRotate = useTransform(lift, [0, 1], [0, -170])
  const glowScale = useTransform(lift, [0, 1], [0.6, 1.6])
  const envY = useTransform(drag, (v) => v * 0.35)

  useEffect(() => {
    if (phase === 'revealed' && room && !room.revealSeen) markSeen(room.id)
  }, [phase, room, markSeen])

  if (!room) return <NotFound />
  if (room.stage !== 'drawn' || !recipient) return <Navigate to={`/rooms/${room.id}`} replace />

  const open = () => {
    if (phase !== 'sealed') return
    haptic.press()
    setPhase('opening')
    animate(drag, -160, { duration: 0.55, ease: [0.22, 1, 0.36, 1] })
    setTimeout(() => {
      haptic.success()
      setPhase('revealed')
    }, 1100)
  }

  return (
    <Screen surface="ember" back={`/rooms/${room.id}`} right={phase === 'sealed' ? <SkipBtn onSkip={() => setPhase('revealed')} /> : undefined}>
      <AnimatePresence mode="wait">
        {phase !== 'revealed' ? (
          <motion.div key="sealed" className="flex flex-1 flex-col items-center px-5 text-center" exit={{ opacity: 0, scale: 0.9 }}>
            <p className="text-secondary text-snow/70">{room.name}</p>
            <h1 className="type-display mt-3 max-w-[11ch]">Кому вы дарите?</h1>
            <p className="mt-3 text-callout text-snow/70">{phase === 'sealed' ? 'Потяните конверт вверх или нажмите на него' : 'Открываем…'}</p>

            <div className="relative mt-6 flex flex-1 items-center justify-center">
              {/* glow intensifies as it opens */}
              <motion.div
                aria-hidden
                className="absolute h-72 w-72 rounded-full bg-[radial-gradient(closest-side,rgba(255,214,150,.75),rgba(255,120,70,.25),transparent)]"
                style={{ opacity: lift, scale: glowScale }}
              />
              <motion.div
                role="button"
                tabIndex={0}
                aria-label="Открыть конверт"
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && open()}
                style={{ y: envY }}
                onPan={(_, info) => phase === 'sealed' && drag.set(Math.max(-160, Math.min(0, info.offset.y)))}
                onPanEnd={(_, info) => {
                  if (phase !== 'sealed') return
                  if (info.offset.y < -70) open()
                  else animate(drag, 0, { type: 'spring', stiffness: 300, damping: 24 })
                }}
                onTap={open}
                animate={phase === 'sealed' ? { rotate: [-2, 2, -2] } : { rotate: 0 }}
                transition={{ rotate: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' } }}
                className="relative cursor-grab touch-none active:cursor-grabbing"
              >
                <Envelope flapRotate={flapRotate} lift={lift} />
              </motion.div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="revealed"
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 160, damping: 18 }}
            className="flex flex-1 flex-col px-5"
          >
            <div className="relative flex flex-col items-center pt-2 text-center">
              <motion.div
                aria-hidden
                initial={{ opacity: 0, scale: 0.4 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.2 }}
                className="absolute top-0 h-64 w-64 rounded-full bg-[radial-gradient(closest-side,rgba(255,214,150,.55),transparent)]"
              />
              <Sparkles />
              <p className="relative text-callout text-snow/75">Вы — Тайный Санта для</p>
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.15, type: 'spring', stiffness: 220, damping: 14 }} className="relative mt-5">
                <Avatar person={recipient} size={124} />
              </motion.div>
              <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="type-display relative mt-5">
                {recipient.name}
              </motion.h1>
              <p className="relative mt-2 text-callout text-snow/70">Бюджет подарка — до {formatRub(room.budget)}</p>
              <p className="relative mt-1 text-footnote text-snow/50">Это секрет: никто, кроме вас, не знает</p>
            </div>

            <div className="mt-auto space-y-3 pt-8">
              <SantomiLinkButton to={`/rooms/${room.id}/recipient`} variant="secondary" leadingIcon="gift" fullWidth>
                Посмотреть вишлист
              </SantomiLinkButton>
              {room.chatEnabled && (
                <SantomiLinkButton to={`/rooms/${room.id}/chat/toRecipient`} variant="ghost" leadingIcon="chat" fullWidth className="text-snow">
                  Написать анонимно
                </SantomiLinkButton>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Screen>
  )
}

function SkipBtn({ onSkip }: { onSkip: () => void }) {
  return (
    <button onClick={onSkip} className="h-11 rounded-full bg-black/25 px-4 text-secondary backdrop-blur">
      Пропустить
    </button>
  )
}

/** Animated envelope: flap rotates open, a card slides out. */
function Envelope({ flapRotate, lift }: { flapRotate: MotionValue<number>; lift: MotionValue<number> }) {
  const cardY = useTransform(lift, [0, 0.4, 1], [40, 30, -70])
  return (
    <div className="relative h-[230px] w-[300px]" style={{ perspective: 800 }}>
      {/* back */}
      <div className="absolute inset-x-0 bottom-0 h-[180px] rounded-[28px] bg-[linear-gradient(160deg,#ffe9d6,#e9b994)] shadow-[0_30px_60px_-20px_rgba(0,0,0,.6)]" />
      {/* card inside */}
      <motion.div style={{ y: cardY }} className="absolute inset-x-6 bottom-8 flex h-[150px] items-start justify-center rounded-[20px] bg-snow pt-4">
        <Art name="star" size={56} noShadow />
      </motion.div>
      {/* front pocket */}
      <svg className="absolute inset-x-0 bottom-0" viewBox="0 0 300 180" width="300" height="180" aria-hidden>
        <defs>
          <linearGradient id="pocket" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FFF1E4" />
            <stop offset="1" stopColor="#F0C6A4" />
          </linearGradient>
        </defs>
        <path d="M0 40 L150 120 L300 40 L300 152 Q300 180 272 180 L28 180 Q0 180 0 152Z" fill="url(#pocket)" />
        <path d="M0 152 L120 100 M300 152 L180 100" stroke="#D9A988" strokeWidth="3" />
      </svg>
      {/* flap */}
      <motion.div style={{ rotateX: flapRotate, transformOrigin: 'top center' }} className="absolute inset-x-0 top-[50px] h-[110px]">
        <svg viewBox="0 0 300 110" width="300" height="110" aria-hidden>
          <defs>
            <radialGradient id="flap" cx="35%" cy="10%" r="90%">
              <stop offset="0" stopColor="#FF7A55" />
              <stop offset="0.5" stopColor="#D8371C" />
              <stop offset="1" stopColor="#8A1A0C" />
            </radialGradient>
          </defs>
          <path d="M6 0 L294 0 Q300 0 296 6 L160 104 Q150 110 140 104 L4 6 Q0 0 6 0Z" fill="url(#flap)" />
        </svg>
        {/* wax seal */}
        <div className="absolute left-1/2 top-[66px] flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full bg-[radial-gradient(circle_at_30%_25%,#fff0b8,#e7b54a_55%,#8a5a12)] text-card font-semibold text-[#7a3a10] shadow-lg">
          S
        </div>
      </motion.div>
    </div>
  )
}

function Sparkles() {
  const dots = [
    [-120, 20, 10],
    [110, 0, 14],
    [-90, 140, 8],
    [130, 120, 9],
    [-30, -10, 6],
    [60, 170, 7],
  ]
  return (
    <div aria-hidden className="pointer-events-none absolute left-1/2 top-10">
      {dots.map(([x, y, s], i) => (
        <motion.span
          key={i}
          className="absolute block rounded-full bg-marzipan"
          style={{ left: x, top: y, width: s, height: s }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0, 1, 0.6], scale: [0, 1.3, 1] }}
          transition={{ delay: 0.2 + i * 0.08, duration: 0.8 }}
        />
      ))}
    </div>
  )
}
