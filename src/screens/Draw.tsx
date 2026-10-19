/**
 * 09 · Secret Santa draw — design/references/05-overview-original.png («It's time to draw!»).
 * Festive red stage like Welcome: centred two-line title + lead, the green-ribbon gift between
 * glowing stars, one red CTA. A quiet summary line links to participants / exclusions.
 * States: blocked (too few / impossible exclusions) · ready · running · error · done.
 * Production: the draw is one atomic, idempotent server call (supabase store_draw);
 * the animation never stands in for the server result. Demo runs domain/draw.ts locally.
 */
import { useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { Screen } from '@/components/ui/Screen'
import { Sheet } from '@/components/ui/Kit'
import { Icon } from '@/components/ui/Icon'
import { Art } from '@/components/art/Art'
import { GlowStar } from '@/components/GlowStar'
import { LottieAnimation } from '@/animation'
import { ErrorState, SantomiButton } from '@/components/ds'
import { ME, isMember, useDemo } from '@/data/demoStore'
import { useRoomPeople } from '@/data/people'
import { drawAssignments } from '@/domain/draw'
import { plural } from '@/lib/format'
import { haptic, isTelegram } from '@/lib/telegram'
import { EASE, PRESS } from '@/motion/tokens'
import { NotFound } from './NotFound'

type Phase = 'idle' | 'running' | 'done' | 'error'

const STAGE_BG = [
  'radial-gradient(60% 34% at 50% 64%, rgba(236,104,46,.45) 0%, rgba(200,66,30,0) 100%)',
  'radial-gradient(140% 80% at 50% 70%, rgba(178,34,18,.96) 0%, rgba(134,20,11,.94) 38%, rgba(92,16,9,.8) 60%, rgba(60,22,14,.35) 80%, rgba(50,25,18,0) 94%)',
  'linear-gradient(#321912, #2e1711)',
].join(',')

export function Draw() {
  const { id } = useParams()
  const navigate = useNavigate()
  const room = useDemo((s) => s.rooms.find((r) => r.id === id))
  const runDraw = useDemo((s) => s.runDraw)
  const people = useRoomPeople(room)
  const [confirm, setConfirm] = useState(false)
  const [phase, setPhase] = useState<Phase>('idle')
  const [error, setError] = useState('')

  const feasible = useMemo(() => (room && room.members.length >= 3 ? drawAssignments(room.members.map((m) => m.personId), room.exclusions).ok : false), [room])

  if (!room) return <NotFound />
  if (!isMember(room)) return <Navigate to={`/join/${room.inviteCode}`} replace />
  if (room.organizerId !== ME) return <Navigate to={`/rooms/${room.id}`} replace />
  if (room.stage !== 'gathering' && phase === 'idle') return <Navigate to={`/rooms/${room.id}`} replace />

  const tooFew = room.members.length < 3
  const blocked = tooFew || !feasible
  const ex = room.exclusions.length
  const allReady = room.members.every((m) => m.wishlistReady)

  const start = () => {
    setConfirm(false)
    setPhase('running')
    haptic.press()
    // Demo: synchronous local draw. Production: await the server; no artificial delay.
    queueMicrotask(() => {
      const res = runDraw(room.id)
      if (res.ok) {
        haptic.success()
        setPhase('done')
      } else {
        haptic.error()
        setError(res.reason === 'too_few' ? 'Нужно минимум 3 участника' : res.reason === 'impossible' ? 'С такими исключениями пары не складываются' : 'Жеребьёвка уже проведена')
        setPhase('error')
      }
    })
  }

  const done = phase === 'done'

  return (
    <Screen back={`/rooms/${room.id}`} headless surface="cocoa" className="!pb-0 overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: STAGE_BG }} />

      <div className="relative z-10 mt-[22px] flex h-12 items-center px-[22px]">
        {!isTelegram && !done ? (
          <motion.button whileTap={PRESS} aria-label="Назад" onClick={() => navigate(`/rooms/${room.id}`)} className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
            <Icon name="back" size={22} />
          </motion.button>
        ) : (
          <span className="h-12" />
        )}
      </div>

      <div className="relative z-10 px-6 pt-1 text-center">
        <AnimatePresence mode="wait" initial={false}>
          {done ? (
            <motion.div key="done" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: EASE }}>
              <h1 className="t-welcome text-snow">Жеребьёвка проведена</h1>
              <p className="mx-auto mt-3 max-w-[30ch] text-callout leading-[22px] text-snow/85">Каждый получил своего получателя. Кто кому дарит, знает только сервер — даже организатор этого не видит.</p>
            </motion.div>
          ) : (
            <motion.div key="idle" exit={{ opacity: 0 }}>
              <h1 className="t-welcome text-snow">
                Время
                <br />
                жеребьёвки!
              </h1>
              <p className="mx-auto mt-3 max-w-[30ch] text-callout leading-[22px] text-snow/85">
                {blocked ? 'Проверьте участников и исключения, чтобы начать.' : allReady ? 'Все готовы! Узнаем, кому вы подарите подарок.' : 'Можно начинать! Узнаем, кому вы подарите подарок.'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Gift — sways while the server works, glows after success */}
      <div aria-hidden className="relative mx-auto mt-2 flex w-full flex-1 items-center justify-center">
        <GlowStar size={58} style={{ left: '6%', top: '20%' }} />
        <GlowStar size={50} delay={1.8} style={{ right: '7%', top: '12%' }} />
        <GlowStar size={36} delay={3} style={{ right: '12%', bottom: '18%' }} />
        <span className="absolute bottom-[8%] left-1/2 h-[18%] w-[78%] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgba(40,10,4,.55),rgba(40,10,4,0))]" />
        {done && (
          <motion.span
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1.15 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="absolute h-[70%] w-[80%] rounded-full bg-[radial-gradient(closest-side,rgba(255,214,150,.45),transparent)]"
          />
        )}
        <motion.span
          className="relative"
          animate={phase === 'running' ? { rotate: [0, -4, 4, -3, 3, 0] } : { rotate: 0 }}
          transition={phase === 'running' ? { duration: 0.6, repeat: Infinity } : { duration: 0.3 }}
        >
          {done ? (
            <LottieAnimation asset="success-check" className="h-[min(300px,36dvh)] w-[min(300px,36dvh)]" fallback={<Art name="gift-green" size="min(300px, 36dvh)" eager noShadow />} />
          ) : (
            <Art name="gift-green" size="min(300px, 36dvh)" eager noShadow />
          )}
        </motion.span>
      </div>

      <div className="relative z-10 px-[22px]" style={{ paddingBottom: 'calc(var(--sa-bottom) + 18px)' }}>
        {(tooFew || (!tooFew && !feasible) || phase === 'error') && (
          <div className="mb-3 space-y-2 rounded-[22px] bg-marzipan p-1.5">
            {tooFew && <ErrorState title="Пока нельзя" text="Нужно минимум 3 участника. Пригласите ещё друзей." />}
            {!tooFew && !feasible && <ErrorState title="Пары не сложатся" text="С такими исключениями жеребьёвка невозможна. Измените исключения." />}
            {phase === 'error' && <ErrorState title="Не получилось" text={error} onRetry={blocked ? undefined : start} />}
          </div>
        )}
        {done ? (
          <SantomiButton fullWidth trailingIcon="forward" onClick={() => navigate(`/rooms/${room.id}/reveal`, { replace: true })}>
            Узнать, кому я дарю
          </SantomiButton>
        ) : (
          <>
            <SantomiButton fullWidth trailingIcon="forward" loading={phase === 'running'} disabled={blocked} onClick={() => setConfirm(true)}>
              Запустить жеребьёвку
            </SantomiButton>
            <button onClick={() => navigate(`/rooms/${room.id}/participants`)} className="mx-auto mt-2 flex h-9 items-center gap-1 px-3 text-secondary text-snow/80">
              {people.length} {plural(people.length, 'участник', 'участника', 'участников')} · {ex ? `${ex} ${plural(ex, 'исключение', 'исключения', 'исключений')}` : 'без исключений'}
              <Icon name="forward" size={14} />
            </button>
          </>
        )}
      </div>

      <Sheet open={confirm} onClose={() => setConfirm(false)} title="Запустить жеребьёвку?">
        <p className="text-center text-callout text-ink/75">
          {people.length} {plural(people.length, 'участник', 'участника', 'участников')}
          {ex ? `, ${ex} ${plural(ex, 'исключение', 'исключения', 'исключений')}` : ''}. После запуска изменить участников, отменить или провести заново будет нельзя.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <SantomiButton variant="secondary" size="medium" onClick={() => setConfirm(false)}>
            Отмена
          </SantomiButton>
          <SantomiButton size="medium" leadingIcon="play" onClick={start}>
            Запустить
          </SantomiButton>
        </div>
      </Sheet>
    </Screen>
  )
}
