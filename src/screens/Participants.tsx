/**
 * 08 · Participants — design/references/05-overview-original.png («Participants / 12 people»).
 * Dark screen: back circle + «+» (invite, organizer); large title + «N человек»; a calm list of
 * avatars with name, role/readiness, crown for the organizer and «⋯» actions. Exclusions sit in
 * a cream card below the list (organizer only — exclusions are organizer-only knowledge);
 * the rules open in a sheet. Pairs are never shown.
 */
import { useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { Screen } from '@/components/ui/Screen'
import { Avatar, Sheet, Toggle, inputLight } from '@/components/ui/Kit'
import { Icon, type IconName } from '@/components/ui/Icon'
import { ErrorState, SantomiButton } from '@/components/ds'
import { CollapsingHeader, useLargeTitle } from '@/components/ds/apple'
import { ME, isMember, useDemo } from '@/data/demoStore'
import { personName, useRoomPeople } from '@/data/people'
import { drawAssignments } from '@/domain/draw'
import { plural } from '@/lib/format'
import { haptic, isTelegram } from '@/lib/telegram'
import { toast } from '@/data/uiStore'
import { DUR, EASE, PRESS, tween } from '@/motion/tokens'
import { NotFound } from './NotFound'

const RULES: [IconName, string][] = [
  ['users', 'Минимум 3 участника'],
  ['shuffle', 'Каждый дарит ровно одному человеку и получает ровно один подарок'],
  ['x', 'Никто не вытянет сам себя, исключения всегда соблюдаются'],
  ['lock', 'Пары видит только сервер. Организатор и участники не видят, кто кому дарит'],
  ['alert', 'Жеребьёвка проводится один раз — после неё состав не меняется'],
]

export function Participants() {
  const { id } = useParams()
  const navigate = useNavigate()
  const room = useDemo((s) => s.rooms.find((r) => r.id === id))
  const { removeMember, addExclusion, removeExclusion, me } = useDemo()
  const people = useRoomPeople(room)
  const [menuFor, setMenuFor] = useState<string | null>(null)
  const [addEx, setAddEx] = useState(false)
  const [rules, setRules] = useState(false)
  const largeTitle = useLargeTitle()

  const feasible = useMemo(() => {
    if (!room || room.members.length < 3) return true
    return drawAssignments(room.members.map((m) => m.personId), room.exclusions).ok
  }, [room])

  if (!room) return <NotFound />
  if (!isMember(room)) return <Navigate to={`/join/${room.inviteCode}`} replace />
  const isOrganizer = room.organizerId === ME
  const editable = isOrganizer && room.stage === 'gathering'

  return (
    <Screen back={`/rooms/${room.id}`} headless surface="cocoa" className="!pb-0">
      {/* Header: sticky, gains a blurred bar + compact title once the large title scrolls away */}
      <CollapsingHeader
        className="mt-[22px]"
        title="Участники"
        left={
          !isTelegram ? (
          <motion.button whileTap={PRESS} aria-label="Назад" onClick={() => navigate(`/rooms/${room.id}`)} className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
            <Icon name="back" size={22} />
          </motion.button>
          ) : undefined
        }
        right={
          editable ? (
          <motion.button
            whileTap={PRESS}
            aria-label="Пригласить участников"
            onClick={() => navigate(`/rooms/${room.id}/invite`)}
            className="flex h-[46px] w-[46px] items-center justify-center rounded-full border-[1.25px] border-[#e2c7b4]/85 text-snow"
          >
            <Icon name="plus" size={26} strokeWidth={1.5} />
          </motion.button>
          ) : undefined
        }
      />

      <div className="px-6 pt-[22px]">
        <motion.h1 style={largeTitle} className="t-page-tight text-snow">
          Участники
        </motion.h1>
        <p className="mt-2 text-body text-snow/75">
          {people.length} {plural(people.length, 'человек', 'человека', 'человек')}
        </p>
      </div>

      <ul className="mt-5 px-5" aria-label="Список участников">
        <AnimatePresence initial={false}>
          {people.map((p, i) => {
            const m = room.members.find((x) => x.personId === p.id)!
            const organizer = p.id === room.organizerId
            const sub = organizer ? 'Организатор' : m.wishlistReady ? 'Вишлист готов' : 'Вишлист не готов'
            return (
              <motion.li
                key={p.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 12, height: 0 }}
                transition={{ duration: DUR.layout, ease: EASE, delay: Math.min(i, 6) * 0.03 }}
                className="flex items-center gap-4 border-b border-white/[0.07] py-[11px] last:border-b-0"
              >
                <span className="rounded-full ring-2 ring-[#efe2d8]/85">
                  <Avatar person={p} size={46} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-button text-snow">{p.id === ME ? (p.name !== 'Вы' ? `${p.name} (вы)` : 'Вы') : p.name}</p>
                  <p className="text-secondary text-taupe-soft">{sub}</p>
                </div>
                {!m.wishlistReady && p.id !== ME && room.stage === 'gathering' && (
                  <button
                    onClick={() => {
                      haptic.tap()
                      toast(`Напоминание для ${p.name} отправлено (демо)`)
                    }}
                    className="h-8 shrink-0 rounded-full bg-white/[0.08] px-3 text-footnote text-snow/85"
                  >
                    Напомнить
                  </button>
                )}
                {organizer && <Icon name="crown" size={22} className="shrink-0 text-gold" aria-label="Организатор" />}
                {editable && !organizer && (
                  <motion.button whileTap={PRESS} aria-label={`Действия: ${p.name}`} onClick={() => setMenuFor(p.id)} className="flex h-10 w-8 shrink-0 items-center justify-center text-snow/55">
                    <Icon name="more" size={22} strokeWidth={2.6} className="rotate-90" />
                  </motion.button>
                )}
              </motion.li>
            )
          })}
        </AnimatePresence>
      </ul>

      <div className="mt-4 space-y-3 px-4" style={{ paddingBottom: 'calc(var(--sa-bottom) + 24px)' }}>
        {isOrganizer && (
          <ExclusionsBlock
            exclusions={room.exclusions}
            name={(pid) => personName(pid, me)}
            editable={editable}
            onRemove={(i) => removeExclusion(room.id, i)}
            onAdd={() => setAddEx(true)}
            feasible={feasible}
          />
        )}
        <button onClick={() => setRules(true)} className="flex h-12 w-full items-center justify-between rounded-[18px] bg-white/[0.06] px-4 text-left text-body text-snow/90">
          Правила жеребьёвки
          <Icon name="forward" size={18} className="text-snow/55" />
        </button>
      </div>

      <Sheet open={rules} onClose={() => setRules(false)} title="Правила жеребьёвки">
        <ul className="space-y-2.5">
          {RULES.map(([icon, text]) => (
            <li key={text} className="flex items-start gap-3 rounded-[18px] bg-snow p-4">
              <Icon name={icon} size={20} className="mt-0.5 shrink-0 text-ember" />
              <span className="text-callout">{text}</span>
            </li>
          ))}
        </ul>
      </Sheet>

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
}: {
  exclusions: { a: string; b: string; mutual: boolean }[]
  name: (id: string) => string
  editable: boolean
  onRemove: (i: number) => void
  onAdd: () => void
  feasible: boolean
}) {
  return (
    <div className="rounded-[24px] bg-[linear-gradient(180deg,#ffe8d2,#fde2c8)] p-4 text-ink">
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
              className="flex h-9 items-center gap-1.5 rounded-full bg-[#f7d8bf] pl-3.5 pr-1.5 text-footnote font-semibold"
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
