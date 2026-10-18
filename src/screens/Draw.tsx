/**
 * 09 · Draw preparation — sheet 03/screen 09.
 * Santa scene, cream «Проверьте участников» list, exclusions summary, red CTA with confirm.
 * States: blocked (too few / impossible exclusions) · ready · running · error · done.
 * Production: the draw is one atomic, idempotent server call (supabase store_draw);
 * the animation never stands in for the server result. Demo runs domain/draw.ts locally.
 */
import { useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { Screen } from '@/components/ui/Screen'
import { Avatar, Sheet } from '@/components/ui/Kit'
import { Icon } from '@/components/ui/Icon'
import { Art } from '@/components/art/Art'
import { ErrorState, PageHeader, PrimaryCTA, SantomiButton } from '@/components/ds'
import { NavRow } from '@/components/ds/blocks'
import { ME, isMember, useDemo } from '@/data/demoStore'
import { useRoomPeople } from '@/data/people'
import { drawAssignments } from '@/domain/draw'
import { plural } from '@/lib/format'
import { haptic } from '@/lib/telegram'
import { EASE, cardIn } from '@/motion/tokens'
import { NotFound } from './NotFound'

type Phase = 'idle' | 'running' | 'done' | 'error'

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

  return (
    <Screen back={`/rooms/${room.id}`} headless className="!pb-0">
      <PageHeader back={`/rooms/${room.id}`} title="Жеребьёвка" />

      {/* Santa scene — glow only while running / after success */}
      <div className="relative flex h-[220px] items-center justify-center">
        <motion.div
          aria-hidden
          className="absolute left-1/2 top-1/2 h-[150%] w-[130%] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(closest-side,rgba(213,54,28,.75),rgba(40,29,25,0))]"
          animate={phase === 'running' ? { opacity: [0.6, 1, 0.6] } : { opacity: phase === 'done' ? 1 : 0.75 }}
          transition={phase === 'running' ? { duration: 1.6, repeat: Infinity } : { duration: 0.4 }}
        />
        {phase === 'done' && (
          <motion.div
            aria-hidden
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1.2 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="absolute h-56 w-56 rounded-full bg-[radial-gradient(closest-side,rgba(230,185,108,.55),transparent)]"
          />
        )}
        <div className="float-a absolute left-[8%] top-[12%]">
          <Art name="star" size={36} noShadow />
        </div>
        <div className="float-b absolute right-[8%] top-[20%]">
          <Art name="gift" size={46} noShadow />
        </div>
        <Art name="santa" size={210} eager className="relative" />
      </div>

      <section className="relative z-10 -mt-2 flex-1 rounded-t-[32px] bg-marzipan px-5 pb-40 pt-6 text-ink">
        <AnimatePresence mode="wait">
          {phase === 'done' ? (
            <motion.div key="done" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center pt-2 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-pine text-snow">
                <Icon name="check" size={28} strokeWidth={2.6} />
              </span>
              <h1 className="mt-4 text-section">Жеребьёвка проведена</h1>
              <p className="mt-2 max-w-[30ch] text-callout text-ink/70">
                Каждый участник получил своего получателя. Кто кому дарит, знает только сервер — даже организатор этого не видит.
              </p>
            </motion.div>
          ) : (
            <motion.div key="list" exit={{ opacity: 0 }}>
              <h1 className="text-section">Проверьте участников</h1>
              <p className="mt-1 text-callout text-ink-soft">
                {people.length} {plural(people.length, 'человек участвует', 'человека участвуют', 'человек участвуют')} в жеребьёвке
              </p>
              <ul className="mt-4 divide-y divide-ink/6 overflow-hidden rounded-[22px] bg-snow">
                {people.map((p, i) => (
                  <motion.li key={p.id} {...cardIn(i)} className="flex items-center gap-3 px-3.5 py-2.5">
                    <Avatar person={p} size={40} />
                    <span className="flex-1 truncate text-body font-medium">{p.id === ME && p.name !== 'Вы' ? `${p.name} (вы)` : p.name}</span>
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-pine text-snow" aria-label="Участвует">
                      <Icon name="check" size={15} strokeWidth={2.6} />
                    </span>
                  </motion.li>
                ))}
              </ul>
              <div className="mt-3">
                <NavRow
                  icon="shuffle"
                  title={ex ? 'Исключения учтены' : 'Исключений нет'}
                  subtitle={ex ? `${ex} ${plural(ex, 'пара не может', 'пары не могут', 'пар не могут')} дарить друг другу` : 'Можно добавить, например, для пар'}
                  to={`/rooms/${room.id}/participants`}
                />
              </div>
              <div className="mt-3 space-y-2">
                {tooFew && <ErrorState title="Пока нельзя" text="Нужно минимум 3 участника. Пригласите ещё друзей." />}
                {!tooFew && !feasible && <ErrorState title="Пары не сложатся" text="С такими исключениями жеребьёвка невозможна. Измените исключения." />}
                {phase === 'error' && <ErrorState title="Не получилось" text={error} onRetry={blocked ? undefined : start} />}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-[480px] bg-[linear-gradient(to_top,var(--color-marzipan)_75%,transparent)] px-5 pt-6" style={{ paddingBottom: 'calc(var(--sa-bottom) + 12px)' }}>
        {phase === 'done' ? (
          <PrimaryCTA icon="gift" onClick={() => navigate(`/rooms/${room.id}/reveal`, { replace: true })}>
            Узнать, кому я дарю
          </PrimaryCTA>
        ) : (
          <>
            <PrimaryCTA icon="play" loading={phase === 'running'} disabled={blocked} onClick={() => setConfirm(true)}>
              Запустить жеребьёвку
            </PrimaryCTA>
            <p className="mt-2 text-center text-caption text-ink-soft">После запуска изменить участников будет нельзя</p>
          </>
        )}
      </div>

      <Sheet open={confirm} onClose={() => setConfirm(false)} title="Запустить жеребьёвку?">
        <p className="text-center text-callout text-ink/75">
          {people.length} {plural(people.length, 'участник', 'участника', 'участников')}
          {ex ? `, ${ex} ${plural(ex, 'исключение', 'исключения', 'исключений')}` : ''}. Отменить или провести заново будет нельзя.
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
