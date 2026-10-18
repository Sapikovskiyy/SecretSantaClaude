/**
 * 03 · Create Room — sheet 01/screen 03.
 * Header + 3-step indicator, red sleigh scene, cream form sheet, sticky red CTA.
 * Steps: Основное (name, budget, date) → Настройки (limit, chat, theme, description) → Готово.
 * Validation errors highlight fields (no shake); entered data survives errors and step changes.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { Screen } from '@/components/ui/Screen'
import { Chip, Toggle } from '@/components/ui/Kit'
import { Icon, type IconName } from '@/components/ui/Icon'
import { Art } from '@/components/art/Art'
import { PageHeader, PrimaryCTA } from '@/components/ds'
import { HeroScene, roomArt } from '@/components/ds/blocks'
import { FREE_PARTICIPANT_LIMIT, useDemo } from '@/data/demoStore'
import type { RoomTheme } from '@/domain/types'
import { formatDate, formatRub } from '@/lib/format'
import { haptic } from '@/lib/telegram'
import { DUR, EASE, tween } from '@/motion/tokens'

const BUDGETS = [500, 1000, 2000, 3000, 5000]
const LIMITS = [5, 10, 15, 20, 30]
const STEPS = ['Основное', 'Настройки', 'Готово']
const THEMES: { id: RoomTheme; label: string }[] = [
  { id: 'ember', label: 'Красная' },
  { id: 'pine', label: 'Изумрудная' },
  { id: 'cocoa', label: 'Шоколадная' },
]

function nextDate(month: number, day: number) {
  const now = new Date()
  let y = now.getFullYear()
  if (new Date(y, month, day, 12).getTime() < now.getTime()) y += 1
  return new Date(y, month, day, 12).toISOString().slice(0, 10)
}
const today = () => new Date().toISOString().slice(0, 10)

export function CreateRoom() {
  const navigate = useNavigate()
  const createRoom = useDemo((s) => s.createRoom)
  const [step, setStep] = useState(0)
  const [touched, setTouched] = useState(false)
  const [name, setName] = useState('')
  const [budget, setBudget] = useState(3000)
  const [customBudget, setCustomBudget] = useState('')
  const [date, setDate] = useState(nextDate(11, 31))
  const [limit, setLimit] = useState(10)
  const [chatEnabled, setChatEnabled] = useState(true)
  const [theme, setTheme] = useState<RoomTheme>('ember')
  const [description, setDescription] = useState('')

  const effectiveBudget = customBudget ? Number(customBudget) : budget
  const errors = {
    name: name.trim().length < 2 ? 'Введите название — хотя бы 2 буквы' : undefined,
    budget: effectiveBudget < 100 ? 'Бюджет — от 100 ₽' : undefined,
    date: date < today() ? 'Выберите дату в будущем' : undefined,
  }
  const stepValid = step !== 0 || (!errors.name && !errors.budget && !errors.date)

  const next = () => {
    if (!stepValid) {
      setTouched(true)
      haptic.error()
      return
    }
    setTouched(false)
    if (step < 2) return setStep(step + 1)
    const id = createRoom({
      name: name.trim().slice(0, 60),
      budget: effectiveBudget,
      date,
      description: description.trim() || undefined,
      participantLimit: limit,
      chatEnabled,
      theme,
    })
    haptic.success()
    navigate(`/rooms/${id}/invite?new=1`, { replace: true })
  }

  return (
    <Screen back headless className="!pb-0">
      <PageHeader back onBack={step > 0 ? () => setStep(step - 1) : undefined} title="Создать игру" />
      <Stepper current={step} />

      <HeroScene art="sleigh" size={196} height={196} />

      <section className="relative z-10 -mt-2 flex-1 rounded-t-[32px] bg-marzipan px-5 pb-36 pt-6 text-ink">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={step} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={tween(0.24)} className="space-y-5">
            {step === 0 && (
              <>
                <FormRow label="Название игры" icon="gift" error={touched ? errors.name : undefined}>
                  <input
                    autoFocus
                    aria-label="Название игры"
                    className={fieldCls(touched && !!errors.name)}
                    placeholder="Например, Новогодний обмен"
                    value={name}
                    maxLength={60}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && next()}
                  />
                </FormRow>
                <FormRow label="Бюджет на подарок" icon="wallet" error={touched ? errors.budget : undefined}>
                  <select
                    aria-label="Бюджет на подарок"
                    className={fieldCls(false)}
                    value={customBudget ? 'custom' : String(budget)}
                    onChange={(e) => {
                      if (e.target.value === 'custom') setCustomBudget(String(budget))
                      else {
                        setCustomBudget('')
                        setBudget(Number(e.target.value))
                      }
                    }}
                  >
                    {BUDGETS.map((b) => (
                      <option key={b} value={b}>
                        до {formatRub(b)}
                      </option>
                    ))}
                    <option value="custom">Другая сумма</option>
                  </select>
                  {customBudget !== '' && (
                    <input
                      aria-label="Своя сумма"
                      inputMode="numeric"
                      className={`${fieldCls(touched && !!errors.budget)} mt-2`}
                      value={customBudget}
                      onChange={(e) => setCustomBudget(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="Сумма в рублях"
                    />
                  )}
                </FormRow>
                <FormRow label="Дата обмена подарками" icon="calendar" error={touched ? errors.date : undefined}>
                  <input type="date" aria-label="Дата обмена" min={today()} className={fieldCls(touched && !!errors.date)} value={date} onChange={(e) => setDate(e.target.value)} />
                </FormRow>
              </>
            )}

            {step === 1 && (
              <>
                <FormRow label="Максимум участников" icon="users">
                  <select aria-label="Максимум участников" className={fieldCls(false)} value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
                    {LIMITS.map((l) => (
                      <option key={l} value={l}>
                        {l} человек
                      </option>
                    ))}
                  </select>
                  <p className="mt-1.5 text-footnote text-ink-soft">Бесплатно — до {FREE_PARTICIPANT_LIMIT} человек</p>
                </FormRow>
                <div className="rounded-[18px] bg-snow px-4 py-1">
                  <Toggle checked={chatEnabled} onChange={setChatEnabled} label="Анонимный чат" />
                  <p className="-mt-1 pb-3 text-footnote text-ink-soft">Санта сможет задавать вопросы получателю, не раскрывая себя</p>
                </div>
                <div>
                  <p className="type-label mb-2 text-ink/75">Оформление</p>
                  <div className="flex flex-wrap gap-2">
                    {THEMES.map((t) => (
                      <Chip key={t.id} tone="light" active={theme === t.id} onClick={() => setTheme(t.id)}>
                        {t.label}
                      </Chip>
                    ))}
                  </div>
                </div>
                <FormRow label="Описание (необязательно)" icon="edit">
                  <textarea
                    className={`${fieldCls(false)} h-24 resize-none py-3`}
                    placeholder="Где и когда встречаемся"
                    value={description}
                    maxLength={300}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </FormRow>
              </>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="flex items-center gap-4 rounded-[22px] bg-snow p-4">
                  <span className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-[18px] bg-marzipan">
                    <Art name={roomArt({ theme })} size={62} noShadow />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-card font-semibold">{name.trim()}</p>
                    <p className="text-secondary text-ink-soft">Всё готово к приглашению друзей</p>
                  </div>
                </div>
                <ul className="space-y-2 rounded-[22px] bg-snow p-4 text-callout">
                  <SummaryRow icon="calendar" text={formatDate(date)} />
                  <SummaryRow icon="wallet" text={`до ${formatRub(effectiveBudget)}`} />
                  <SummaryRow icon="users" text={`до ${limit} участников`} />
                  <SummaryRow icon="lock" text={chatEnabled ? 'Анонимный чат включён' : 'Анонимный чат выключен'} />
                </ul>
                {description.trim() && <p className="rounded-[18px] bg-snow/70 p-4 text-secondary text-ink/75">{description.trim()}</p>}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </section>

      <div
        className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-[480px] bg-[linear-gradient(to_top,var(--color-marzipan)_75%,transparent)] px-5 pt-6"
        style={{ paddingBottom: 'calc(var(--sa-bottom) + 16px)' }}
      >
        <PrimaryCTA trailing={step < 2 ? 'arrowRight' : undefined} icon={step === 2 ? 'check' : undefined} onClick={next}>
          {step < 2 ? 'Далее' : 'Создать игру'}
        </PrimaryCTA>
      </div>
    </Screen>
  )
}

function Stepper({ current }: { current: number }) {
  return (
    <ol className="mx-auto mt-3 flex w-full max-w-[300px] items-start justify-between px-5" aria-label={`Шаг ${current + 1} из 3`}>
      {STEPS.map((s, i) => {
        const done = i < current
        const active = i === current
        return (
          <li key={s} className="relative flex flex-1 flex-col items-center gap-1.5">
            {i > 0 && (
              <span className="absolute right-1/2 top-[13px] h-0.5 w-full -translate-x-[14px] overflow-hidden rounded bg-white/15">
                <motion.span className="block h-full bg-ember" initial={false} animate={{ width: i <= current ? '100%' : '0%' }} transition={{ duration: 0.3, ease: EASE }} />
              </span>
            )}
            <motion.span
              initial={false}
              animate={{ scale: active ? 1 : 0.92 }}
              transition={{ duration: DUR.chip }}
              className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full text-footnote font-semibold ${
                active ? 'bg-ember text-snow ring-4 ring-ember/25' : done ? 'bg-ember text-snow' : 'bg-white/15 text-snow/70'
              }`}
            >
              {done ? <Icon name="check" size={14} strokeWidth={2.6} /> : i + 1}
            </motion.span>
            <span className={`text-caption font-medium ${active ? 'text-ember-glow' : 'text-snow/55'}`}>{s}</span>
          </li>
        )
      })}
    </ol>
  )
}

function FormRow({ label, icon, error, children }: { label: string; icon: IconName; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="type-label mb-2 flex items-center gap-1.5 text-ink/75">
        <Icon name={icon} size={16} className="text-ink/45" />
        {label}
      </p>
      {children}
      <AnimatePresence>
        {error && (
          <motion.p
            role="alert"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={tween(DUR.chip)}
            className="mt-1.5 text-footnote font-medium text-ember"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

function SummaryRow({ icon, text }: { icon: IconName; text: string }) {
  return (
    <li className="flex items-center gap-3">
      <Icon name={icon} size={18} className="text-ember" />
      {text}
    </li>
  )
}

const fieldCls = (error: boolean) =>
  `h-[52px] w-full appearance-none rounded-[16px] bg-snow px-4 text-body text-ink placeholder:text-ink/35 outline-none transition-shadow duration-200 ${
    error ? 'shadow-[0_0_0_2px_#D5361C]' : 'shadow-[0_0_0_1px_rgba(40,29,25,.08)] focus:shadow-[0_0_0_2px_#D5361C]'
  }`
