/**
 * Room customization (organizer). Live preview of the game card on top, then:
 * cover illustration · colour theme (Santa+ themes stay locked — never unlocked from the client) ·
 * name & description · budget, exchange date, draw date, participant limit · anonymous chat.
 * After the draw only the look (cover, theme, name, description) can change.
 */
import { useMemo, useState, type ReactNode } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { Screen } from '@/components/ui/Screen'
import { Icon } from '@/components/ui/Icon'
import { Art } from '@/components/art/Art'
import { SantomiButton } from '@/components/ds'
import { AnimatedCheck, CollapsingHeader } from '@/components/ds/apple'
import { Switch } from '@/components/ds/Switch'
import { ME, isMember, useDemo } from '@/data/demoStore'
import { COVERS, DEFAULT_COVER, THEMES, themeLook } from '@/domain/look'
import type { RoomCover, RoomTheme } from '@/domain/types'
import { formatRub, plural } from '@/lib/format'
import { haptic, isTelegram } from '@/lib/telegram'
import { toast } from '@/data/uiStore'
import { APPLE, PRESS } from '@/motion/tokens'
import { NotFound } from './NotFound'

const today = () => new Date().toISOString().slice(0, 10)
const longDate = (iso?: string) => (iso ? new Date(iso + 'T12:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).replace(' г.', '') : 'Не задана')
const LIMITS = [5, 8, 10, 12, 15, 20, 30]

export function CustomizeRoom() {
  const { id } = useParams()
  const navigate = useNavigate()
  const room = useDemo((s) => s.rooms.find((r) => r.id === id))
  const updateRoom = useDemo((s) => s.updateRoom)

  const [cover, setCover] = useState<RoomCover>(room?.cover ?? DEFAULT_COVER)
  const [theme, setTheme] = useState<RoomTheme>(room?.theme ?? 'pine')
  const [name, setName] = useState(room?.name ?? '')
  const [description, setDescription] = useState(room?.description ?? '')
  const [budget, setBudget] = useState(String(room?.budget ?? 3000))
  const [date, setDate] = useState(room?.date ?? today())
  const [drawDate, setDrawDate] = useState(room?.drawDate ?? '')
  const [limit, setLimit] = useState(room?.participantLimit ?? 12)
  const [chat, setChat] = useState(room?.chatEnabled ?? true)
  const [touched, setTouched] = useState(false)

  const errors = useMemo(() => {
    if (!room) return {}
    return {
      name: name.trim().length < 2 ? 'Хотя бы 2 буквы' : undefined,
      budget: Number(budget) < 100 ? 'Бюджет — от 100 ₽' : undefined,
      date: room.stage === 'gathering' && date < today() ? 'Выберите дату в будущем' : undefined,
      drawDate: drawDate && (drawDate < today() ? 'Дата уже прошла' : drawDate > date ? 'Жеребьёвка — до обмена' : undefined),
      limit: limit < room.members.length ? `Уже ${room.members.length} ${plural(room.members.length, 'участник', 'участника', 'участников')}` : undefined,
    }
  }, [room, name, budget, date, drawDate, limit])

  if (!room) return <NotFound />
  if (!isMember(room)) return <Navigate to={`/join/${room.inviteCode}`} replace />
  if (room.organizerId !== ME) return <Navigate to={`/rooms/${room.id}`} replace />
  const gathering = room.stage === 'gathering'
  const look = themeLook(theme)

  const save = () => {
    if (Object.values(errors).some(Boolean)) {
      setTouched(true)
      haptic.error()
      return toast('Проверьте выделенные поля', 'error')
    }
    updateRoom(room.id, {
      cover,
      theme,
      name: name.trim().slice(0, 60),
      description: description.trim() || undefined,
      ...(gathering ? { budget: Number(budget), date, drawDate: drawDate || undefined, participantLimit: limit, chatEnabled: chat } : {}),
    })
    haptic.success()
    toast('Оформление сохранено')
    navigate(`/rooms/${room.id}`)
  }

  return (
    <Screen back={`/rooms/${room.id}`} headless surface="cocoa" className="!pb-0">
      <CollapsingHeader
        className="mt-[22px]"
        title="Оформление"
        left={
          !isTelegram ? (
            <motion.button whileTap={PRESS} aria-label="Назад" onClick={() => navigate(`/rooms/${room.id}`)} className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
              <Icon name="back" size={22} />
            </motion.button>
          ) : undefined
        }
      />

      <div className="px-6 pt-3">
        <h1 className="t-page-tight text-snow">Оформление</h1>
        <p className="mt-2 text-callout text-snow/75">Так игру увидят все участники</p>
      </div>

      {/* Live preview — the same card as on Home */}
      <motion.div
        layout
        className="relative mx-4 mt-5 h-[208px] overflow-hidden rounded-[30px] shadow-[0_18px_40px_-18px_rgba(0,0,0,.6)]"
        animate={{ background: look.card }}
        transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
        aria-label="Предпросмотр карточки игры"
      >
        <span aria-hidden className="absolute inset-x-0 bottom-0 top-[72%] bg-[linear-gradient(180deg,rgba(243,204,165,.0),rgba(246,208,170,.85))]" />
        <div className="relative px-6 pt-5">
          <p className="t-section line-clamp-2 max-w-[62%] font-medium text-snow">{name.trim() || 'Название игры'}</p>
          <p className="mt-1 text-callout text-snow/85">Бюджет до {formatRub(Number(budget) || 0)}</p>
        </div>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={cover}
            aria-hidden
            className="absolute bottom-[-6px] right-[6%]"
            initial={{ opacity: 0, scale: 0.7, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 10 }}
            transition={APPLE.bouncy}
          >
            <Art name={cover} size={150} eager noShadow />
          </motion.span>
        </AnimatePresence>
      </motion.div>

      {/* Cover */}
      <Section title="Обложка">
        <div className="no-scrollbar -mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1" role="radiogroup" aria-label="Обложка">
          {COVERS.map((c) => {
            const active = cover === c.id
            return (
              <motion.button
                key={c.id}
                role="radio"
                aria-checked={active}
                aria-label={c.label}
                whileTap={{ scale: 0.94 }}
                onClick={() => {
                  haptic.select()
                  setCover(c.id)
                }}
                className={`relative flex h-[86px] w-[86px] shrink-0 items-center justify-center rounded-[22px] transition-colors duration-200 ${active ? 'bg-[rgba(255,228,206,.16)] ring-2 ring-marzipan' : 'bg-white/[0.07] ring-1 ring-white/[0.06]'}`}
              >
                <Art name={c.id} size={66} noShadow />
                {active && (
                  <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-marzipan text-ink">
                    <AnimatedCheck size={12} strokeWidth={3} />
                  </span>
                )}
              </motion.button>
            )
          })}
        </div>
      </Section>

      {/* Theme */}
      <Section title="Цвет">
        <div className="grid grid-cols-5 gap-2" role="radiogroup" aria-label="Цвет">
          {THEMES.map((t) => {
            const active = theme === t.id
            return (
              <motion.button
                key={t.id}
                role="radio"
                aria-checked={active}
                aria-label={t.premium ? `${t.label} — в Santa+` : t.label}
                whileTap={{ scale: 0.92 }}
                onClick={() => {
                  if (t.premium) {
                    haptic.error()
                    toast('Эта тема доступна в Santa+')
                    return navigate('/premium')
                  }
                  haptic.select()
                  setTheme(t.id)
                }}
                className="flex flex-col items-center gap-1.5"
              >
                <span
                  className={`relative flex h-12 w-12 items-center justify-center rounded-full transition-shadow duration-200 ${active ? 'shadow-[0_0_0_3px_#2d1d16,0_0_0_5px_#ffe4ce]' : ''}`}
                  style={{ background: t.card }}
                >
                  {t.premium && <Icon name="lock" size={16} className="text-snow/90" />}
                  {active && <AnimatedCheck size={18} strokeWidth={3} className="text-snow" />}
                </span>
                <span className={`text-caption leading-tight ${active ? 'text-snow' : 'text-snow/65'}`}>{t.label}</span>
              </motion.button>
            )
          })}
        </div>
      </Section>

      {/* Name & description */}
      <Section title="Название и описание">
        <Card>
          <Field label="Название" error={touched ? errors.name : undefined}>
            <input aria-label="Название" className={inputCls} value={name} maxLength={60} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Описание" last>
            <input aria-label="Описание" className={inputCls} value={description} maxLength={300} placeholder="Праздник для друзей и коллег" onChange={(e) => setDescription(e.target.value)} />
          </Field>
        </Card>
      </Section>

      {/* Details */}
      <Section title="Детали" note={gathering ? undefined : 'После жеребьёвки бюджет, даты и состав не меняются'}>
        <Card>
          <Field label="Бюджет, ₽" error={touched ? errors.budget : undefined}>
            <input aria-label="Бюджет" disabled={!gathering} inputMode="numeric" className={inputCls} value={budget} onChange={(e) => setBudget(e.target.value.replace(/\D/g, '').slice(0, 6))} />
          </Field>
          <DateField label="Дата обмена" value={date} min={today()} disabled={!gathering} error={touched ? errors.date : undefined} onChange={setDate} />
          <DateField label="Дата жеребьёвки" value={drawDate} min={today()} max={date} disabled={!gathering} error={touched ? errors.drawDate || undefined : undefined} onChange={setDrawDate} onClear={drawDate ? () => setDrawDate('') : undefined} />
          <Field label="Лимит участников" error={touched ? errors.limit : undefined} last>
            <select aria-label="Лимит участников" disabled={!gathering} className={`${inputCls} appearance-none`} value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
              {LIMITS.map((l) => (
                <option key={l} value={l}>
                  {l} {plural(l, 'человек', 'человека', 'человек')}
                </option>
              ))}
            </select>
          </Field>
        </Card>
        <label className="mt-3 flex h-12 items-center justify-between px-1">
          <span className="text-body text-snow">Анонимный чат</span>
          <Switch checked={chat} onChange={setChat} label="Анонимный чат" disabled={!gathering} />
        </label>
      </Section>

      <div className="sticky bottom-0 z-20 mt-4 bg-[linear-gradient(to_top,#2d1d16_70%,rgba(45,29,22,0))] px-[22px] pt-6" style={{ paddingBottom: 'calc(var(--sa-bottom) + 16px)' }}>
        <SantomiButton fullWidth trailingIcon="check" onClick={save}>
          Сохранить
        </SantomiButton>
      </div>
    </Screen>
  )
}

const inputCls = 'block w-full bg-transparent text-button text-ink placeholder:text-ink/40 outline-none disabled:text-ink/50'

function Section({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="mt-6 px-4">
      <h2 className="mb-2.5 px-1 text-callout font-medium text-snow/80">{title}</h2>
      {children}
      {note && <p className="mt-2 px-1 text-footnote text-snow/55">{note}</p>}
    </section>
  )
}

function Card({ children }: { children: ReactNode }) {
  return <div className="rounded-[26px] bg-[linear-gradient(180deg,#ffe8d2,#fde2c8)] px-5 text-ink">{children}</div>
}

function Field({ label, error, last, children }: { label: string; error?: string; last?: boolean; children: ReactNode }) {
  return (
    <label className={`block py-3 ${last ? '' : 'border-b border-ink/10'}`}>
      <span className={`block text-secondary ${error ? 'text-ember' : 'text-ink-soft'}`}>{error ?? label}</span>
      <span className="mt-1 block">{children}</span>
    </label>
  )
}

function DateField({ label, value, min, max, disabled, error, onChange, onClear }: { label: string; value: string; min?: string; max?: string; disabled?: boolean; error?: string; onChange: (v: string) => void; onClear?: () => void }) {
  return (
    <div className="relative flex items-center border-b border-ink/10 py-3">
      <label className="relative min-w-0 flex-1">
        <span className={`block text-secondary ${error ? 'text-ember' : 'text-ink-soft'}`}>{error ?? label}</span>
        <span className={`mt-1 block text-button ${value ? 'text-ink' : 'text-ink/40'} ${disabled ? 'text-ink/50' : ''}`}>{longDate(value || undefined)}</span>
        <input type="date" aria-label={label} disabled={disabled} min={min} max={max} value={value} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 opacity-0" />
      </label>
      {onClear && !disabled && (
        <button type="button" aria-label={`Убрать: ${label}`} onClick={onClear} className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full text-ink/55">
          <Icon name="close" size={16} />
        </button>
      )}
    </div>
  )
}
