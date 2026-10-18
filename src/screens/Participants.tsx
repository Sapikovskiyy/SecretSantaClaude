/**
 * 06 · Participants & exclusions — sheet 02/screen 06.
 * Tabs: «Участники» (readiness, remind, remove), «Исключения» (A × B chips, organizer only —
 * matches the DB rule that exclusions are organizer-only knowledge), «Правила».
 * The mockup's «Пары» tab is deliberately replaced by «Правила»: pairs are never shown.
 */
import { useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { Screen } from '@/components/ui/Screen'
import { Avatar, Sheet, Toggle, inputLight } from '@/components/ui/Kit'
import { Icon } from '@/components/ui/Icon'
import { ErrorState, PageHeader, PrimaryCTA, SantomiButton, Segmented } from '@/components/ds'
import { FREE_PARTICIPANT_LIMIT, ME, isMember, useDemo } from '@/data/demoStore'
import { personName, useRoomPeople } from '@/data/people'
import { drawAssignments } from '@/domain/draw'
import { haptic } from '@/lib/telegram'
import { toast } from '@/data/uiStore'
import { DUR, EASE, PRESS, tween } from '@/motion/tokens'
import { NotFound } from './NotFound'

type Tab = 'people' | 'exclusions' | 'rules'

export function Participants() {
  const { id } = useParams()
  const navigate = useNavigate()
  const room = useDemo((s) => s.rooms.find((r) => r.id === id))
  const { addDemoParticipant, removeMember, addExclusion, removeExclusion, me } = useDemo()
  const people = useRoomPeople(room)
  const [tab, setTab] = useState<Tab>('people')
  const [menuFor, setMenuFor] = useState<string | null>(null)
  const [addEx, setAddEx] = useState(false)

  const feasible = useMemo(() => {
    if (!room || room.members.length < 3) return true
    return drawAssignments(room.members.map((m) => m.personId), room.exclusions).ok
  }, [room])

  if (!room) return <NotFound />
  if (!isMember(room)) return <Navigate to={`/join/${room.inviteCode}`} replace />
  const isOrganizer = room.organizerId === ME
  const editable = isOrganizer && room.stage === 'gathering'
  const limit = room.participantLimit ?? FREE_PARTICIPANT_LIMIT

  const tabs: { id: Tab; label: string }[] = [
    { id: 'people', label: `Участники ${people.length}` },
    ...(isOrganizer ? [{ id: 'exclusions' as Tab, label: 'Исключения' }] : []),
    { id: 'rules', label: 'Правила' },
  ]

  return (
    <Screen back={`/rooms/${room.id}`} headless className="!pb-0">
      <PageHeader back={`/rooms/${room.id}`} title="Участники" />
      <div className="mt-3 px-5">
        <Segmented label="Раздел участников" value={tab} onChange={setTab} options={tabs} />
      </div>

      <section className="relative z-10 mt-5 flex-1 rounded-t-[32px] bg-marzipan px-5 pb-36 pt-6 text-ink">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={tween(0.18)}>
            {tab === 'people' && (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-card font-semibold">
                    Участники ({people.length}
                    {limit ? ` из ${limit}` : ''})
                  </h2>
                  {editable && (
                    <button
                      onClick={() => {
                        const p = addDemoParticipant(room.id)
                        if (p) toast(`${p.name} присоединяется (демо)`)
                        else toast('Больше нельзя добавить участников', 'error')
                      }}
                      className="flex h-10 items-center gap-1.5 rounded-full bg-snow px-3.5 text-secondary font-semibold"
                    >
                      <Icon name="plus" size={16} /> Добавить
                    </button>
                  )}
                </div>
                <ul className="mt-3 divide-y divide-ink/6 overflow-hidden rounded-[22px] bg-snow">
                  <AnimatePresence initial={false}>
                    {people.map((p) => {
                      const m = room.members.find((x) => x.personId === p.id)!
                      const organizer = p.id === room.organizerId
                      return (
                        <motion.li
                          key={p.id}
                          layout
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 12, height: 0 }}
                          transition={{ duration: DUR.layout, ease: EASE }}
                          className="flex items-center gap-3 px-3.5 py-3"
                        >
                          <Avatar person={p} size={44} />
                          <div className="min-w-0 flex-1">
                            <p className="flex items-center gap-1.5 truncate text-body font-semibold">
                              {p.id === ME && p.name !== 'Вы' ? `${p.name} (вы)` : p.name}
                              {organizer && <Icon name="crown" size={16} className="shrink-0 text-gold" aria-label="Организатор" />}
                            </p>
                            <p className="flex items-center gap-1.5 text-footnote text-ink-soft">
                              <span className={`h-2 w-2 rounded-full ${m.wishlistReady ? 'bg-pine-glow' : 'bg-ember'}`} aria-hidden />
                              {m.wishlistReady ? 'вишлист готов' : 'вишлист не готов'}
                            </p>
                          </div>
                          {!m.wishlistReady && p.id !== ME && room.stage === 'gathering' && (
                            <button
                              onClick={() => {
                                haptic.tap()
                                toast(`Напоминание для ${p.name} отправлено (демо)`)
                              }}
                              className="h-8 shrink-0 rounded-full bg-ember/10 px-3 text-footnote font-semibold text-ember"
                            >
                              Напомнить
                            </button>
                          )}
                          {editable && !organizer && (
                            <motion.button whileTap={PRESS} aria-label={`Действия: ${p.name}`} onClick={() => setMenuFor(p.id)} className="flex h-10 w-8 shrink-0 items-center justify-center text-ink/50">
                              <Icon name="more" size={22} strokeWidth={2.6} />
                            </motion.button>
                          )}
                        </motion.li>
                      )
                    })}
                  </AnimatePresence>
                </ul>
                {isOrganizer && (
                  <ExclusionsBlock
                    exclusions={room.exclusions}
                    name={(pid) => personName(pid, me)}
                    editable={editable}
                    onRemove={(i) => removeExclusion(room.id, i)}
                    onAdd={() => setAddEx(true)}
                    feasible={feasible}
                    compact
                  />
                )}
              </>
            )}

            {tab === 'exclusions' && (
              <>
                <p className="text-callout text-ink/75">Эти участники не будут дарить подарки друг другу — например, пары или члены одной семьи.</p>
                <ExclusionsBlock
                  exclusions={room.exclusions}
                  name={(pid) => personName(pid, me)}
                  editable={editable}
                  onRemove={(i) => removeExclusion(room.id, i)}
                  onAdd={() => setAddEx(true)}
                  feasible={feasible}
                />
              </>
            )}

            {tab === 'rules' && (
              <ul className="space-y-2.5">
                {[
                  ['users', 'Минимум 3 участника'],
                  ['shuffle', 'Каждый дарит ровно одному человеку и получает ровно один подарок'],
                  ['x', 'Никто не вытянет сам себя, исключения всегда соблюдаются'],
                  ['lock', 'Пары видит только сервер. Организатор и участники не видят, кто кому дарит'],
                  ['alert', 'Жеребьёвка проводится один раз — после неё состав не меняется'],
                ].map(([icon, text]) => (
                  <li key={text} className="flex items-start gap-3 rounded-[18px] bg-snow p-4">
                    <Icon name={icon as 'users'} size={20} className="mt-0.5 shrink-0 text-ember" />
                    <span className="text-callout">{text}</span>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        </AnimatePresence>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-[480px] bg-[linear-gradient(to_top,var(--color-marzipan)_75%,transparent)] px-5 pt-6" style={{ paddingBottom: 'calc(var(--sa-bottom) + 16px)' }}>
        <PrimaryCTA
          icon="check"
          onClick={() => {
            toast('Настройки сохранены')
            navigate(`/rooms/${room.id}`)
          }}
        >
          Сохранить настройки
        </PrimaryCTA>
      </div>

      <Sheet open={!!menuFor} onClose={() => setMenuFor(null)} title={menuFor ? personName(menuFor, me) : undefined}>
        <SantomiButton
          variant="danger"
          fullWidth
          leadingIcon="trash"
          onClick={() => {
            if (menuFor) removeMember(room.id, menuFor)
            toast('Участник удалён из игры')
            setMenuFor(null)
          }}
        >
          Удалить из игры
        </SantomiButton>
      </Sheet>

      <AddExclusionSheet open={addEx} onClose={() => setAddEx(false)} people={people} onAdd={(a, b, mutual) => addExclusion(room.id, { a, b, mutual })} />
    </Screen>
  )
}

function ExclusionsBlock({
  exclusions,
  name,
  editable,
  onRemove,
  onAdd,
  feasible,
  compact,
}: {
  exclusions: { a: string; b: string; mutual: boolean }[]
  name: (id: string) => string
  editable: boolean
  onRemove: (i: number) => void
  onAdd: () => void
  feasible: boolean
  compact?: boolean
}) {
  return (
    <div className={`${compact ? 'mt-5' : 'mt-4'} rounded-[22px] bg-snow p-4`}>
      <p className="text-body font-semibold">Исключения при жеребьёвке</p>
      <p className="mt-0.5 text-footnote text-ink-soft">Эти участники не будут дарить подарки друг другу</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <AnimatePresence initial={false}>
          {exclusions.map((e, i) => (
            <motion.span
              key={`${e.a}-${e.b}`}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={tween(DUR.chip)}
              className="flex h-9 items-center gap-1.5 rounded-full bg-marzipan pl-3.5 pr-1.5 text-footnote font-semibold"
            >
              {name(e.a)} {e.mutual ? '×' : '→'} {name(e.b)}
              {editable && (
                <button aria-label={`Убрать исключение ${name(e.a)} и ${name(e.b)}`} onClick={() => onRemove(i)} className="flex h-7 w-7 items-center justify-center rounded-full text-ember">
                  <Icon name="close" size={14} strokeWidth={2.4} />
                </button>
              )}
            </motion.span>
          ))}
        </AnimatePresence>
        {editable && (
          <button onClick={onAdd} className="flex h-9 items-center gap-1.5 rounded-full border-[1.5px] border-dashed border-ink/25 px-3.5 text-footnote font-semibold text-ink/70">
            <Icon name="plus" size={14} /> Добавить исключение
          </button>
        )}
        {!editable && exclusions.length === 0 && <span className="text-footnote text-ink-soft">Исключений нет</span>}
      </div>
      {!feasible && (
        <div className="mt-3">
          <ErrorState title="Пары не сложатся" text="С такими исключениями жеребьёвка невозможна. Уберите одно из исключений или добавьте участников." />
        </div>
      )}
    </div>
  )
}

function AddExclusionSheet({ open, onClose, people, onAdd }: { open: boolean; onClose: () => void; people: { id: string; name: string }[]; onAdd: (a: string, b: string, mutual: boolean) => void }) {
  const [a, setA] = useState('')
  const [b, setB] = useState('')
  const [mutual, setMutual] = useState(true)
  return (
    <Sheet open={open} onClose={onClose} title="Новое исключение">
      <div className="grid grid-cols-2 gap-2">
        <select className={inputLight} value={a} onChange={(e) => setA(e.target.value)} aria-label="Кто">
          <option value="">Кто</option>
          {people.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <select className={inputLight} value={b} onChange={(e) => setB(e.target.value)} aria-label="Кому нельзя">
          <option value="">Кому нельзя</option>
          {people
            .filter((p) => p.id !== a)
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
        </select>
      </div>
      <Toggle checked={mutual} onChange={setMutual} label="В обе стороны" />
      <SantomiButton
        fullWidth
        className="mt-2"
        disabled={!a || !b || a === b}
        onClick={() => {
          onAdd(a, b, mutual)
          setA('')
          setB('')
          onClose()
        }}
      >
        Добавить исключение
      </SantomiButton>
    </Sheet>
  )
}
