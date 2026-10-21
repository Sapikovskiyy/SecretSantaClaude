/**
 * 03 · Create game — design/references/02-create-game.jpeg.
 * At 390 px: back circle 48 px; step dots + «Шаг 1 из 2» centred; title ≈42 px medium on two
 * lines; cream panel (radius 30, inset 16) with flat rows split by hairlines; «Анонимный чат»
 * toggle and «Исключения и правила» row on the dark background; red CTA inset 43 px.
 * Step 1 = details, step 2 = review + appearance. Inputs live inside the rows (no nested cards).
 */
import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { Screen } from '@/components/ui/Screen'
import { Sheet } from '@/components/ui/Kit'
import { Icon } from '@/components/ui/Icon'
import { SantomiButton } from '@/components/ds'
import { CalendarMark } from '@/components/CalendarMark'
import { FREE_PARTICIPANT_LIMIT, useDemo } from '@/data/demoStore'
import type { RoomTheme } from '@/domain/types'
import { formatRub } from '@/lib/format'
import { haptic, isTelegram } from '@/lib/telegram'
import { DUR, EASE, PRESS, tween } from '@/motion/tokens'

const BUDGETS = [500, 1000, 2000, 3000, 5000]
const LIMITS = [5, 8, 10, 12, 15, 20, 30]
const THEMES: { id: RoomTheme; label: string; swatch: string }[] = [
  { id: 'pine', label: 'Изумрудная', swatch: '#006b43' },
  { id: 'ember', label: 'Красная', swatch: '#d93624' },
  { id: 'cocoa', label: 'Шоколадная', swatch: '#4a3830' },
]

function nextDate(month: number, day: number) {
  const now = new Date()
  let y = now.getFullYear()
  if (new Date(y, month, day, 12).getTime() < now.getTime()) y += 1
  return new Date(y, month, day, 12).toISOString().slice(0, 10)
}
const today = () => new Date().toISOString().slice(0, 10)
const longDate = (iso: string) => new Date(iso + 'T12:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).replace(' г.', '')

export function CreateRoom() {
  const navigate = useNavigate()
  const createRoom = useDemo((s) => s.createRoom)
  const [step, setStep] = useState<0 | 1>(0)
  const [touched, setTouched] = useState(false)
  const [rules, setRules] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [budget, setBudget] = useState('3000')
  const [customBudget, setCustomBudget] = useState('')
  const [date, setDate] = useState(nextDate(11, 25))
  const [limit, setLimit] = useState(12)
  const [chatEnabled, setChatEnabled] = useState(true)
  const [theme, setTheme] = useState<RoomTheme>('pine')

  const budgetValue = budget === 'custom' ? Number(customBudget || 0) : Number(budget)
  const errors = {
    name: name.trim().length < 2 ? 'Введите название — хотя бы 2 буквы' : undefined,
    budget: budgetValue < 100 ? 'Бюджет — от 100 ₽' : undefined,
    date: date < today() ? 'Выберите дату в будущем' : undefined,
  }
  const invalid = Boolean(errors.name || errors.budget || errors.date)

  const next = () => {
    if (step === 0) {
      if (invalid) {
        setTouched(true)
        haptic.error()
        return
      }
      setTouched(false)
      setStep(1)
      return
    }
    const id = createRoom({
      name: name.trim().slice(0, 60),
      description: description.trim() || undefined,
      budget: budgetValue,
      date,
      participantLimit: limit,
      chatEnabled,
      theme,
    })
    haptic.success()
    navigate(`/rooms/${id}/invite?new=1`, { replace: true })
  }

  const back = () => (step === 1 ? setStep(0) : navigate(-1))

  return (
    <Screen back headless className="!pb-0">
      {/* Header: back circle + step indicator */}
      <div className="relative mt-[34px] flex h-12 items-center px-[22px]">
        {!isTelegram && (
          <motion.button whileTap={PRESS} aria-label="Назад" onClick={back} className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
            <Icon name="back" size={22} />
          </motion.button>
        )}
        <div className="absolute inset-x-0 top-0 flex flex-col items-center gap-2 pt-1" role="img" aria-label={`Шаг ${step + 1} из 2`}>
          <div className="flex gap-2">
            {[0, 1].map((i) => (
              <motion.span key={i} className="h-2 w-2 rounded-full" animate={{ backgroundColor: i === step ? '#ef4930' : '#6e5d55' }} transition={tween(DUR.chip)} />
            ))}
          </div>
          <span className="text-footnote text-taupe-soft">Шаг {step + 1} из 2</span>
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2, ease: EASE }}
          className="flex flex-1 flex-col"
        >
          <div className="px-6 pt-[34px] [@media(max-height:820px)]:pt-4">
            <h1 className="t-page text-snow">
              {step === 0 ? (
                <>
                  Создадим
                  <br />
                  игру!
                </>
              ) : (
                <>
                  Почти
                  <br />
                  готово
                </>
              )}
            </h1>
            <p className="t-lead mt-1 text-snow/80">{step === 0 ? 'Начнём с главного.' : 'Проверьте детали и выберите оформление.'}</p>
          </div>

          {/* Cream form surface — flat rows, hairline dividers */}
          <section className="mx-4 mt-[9px] rounded-[30px] bg-marzipan px-[22px] text-ink">
            {step === 0 ? (
              <>
                <Row label="Название игры" error={touched ? errors.name : undefined}>
                  <input
                    aria-label="Название игры"
                    className={valueCls}
                    placeholder="Новогодний обмен"
                    value={name}
                    maxLength={60}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && next()}
                  />
                </Row>
                <Row label="Описание">
                  <input aria-label="Описание" className={valueCls} placeholder="Праздник для друзей и коллег" value={description} maxLength={300} onChange={(e) => setDescription(e.target.value)} />
                </Row>
                <Row label="Бюджет подарка" error={touched ? errors.budget : undefined} trailing={<Icon name="down" size={22} strokeWidth={2} />}>
                  <select aria-label="Бюджет подарка" className={`${valueCls} appearance-none pr-8`} value={budget} onChange={(e) => setBudget(e.target.value)}>
                    {BUDGETS.map((b) => (
                      <option key={b} value={b}>
                        {formatRub(b)}
                      </option>
                    ))}
                    <option value="custom">Другая сумма</option>
                  </select>
                  {budget === 'custom' && (
                    <input
                      aria-label="Своя сумма"
                      inputMode="numeric"
                      autoFocus
                      className={`${valueCls} mt-1`}
                      placeholder="Сумма, ₽"
                      value={customBudget}
                      onChange={(e) => setCustomBudget(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    />
                  )}
                </Row>
                <Row label="Дата обмена" error={touched ? errors.date : undefined} trailing={<CalendarMark size={27} variant="outline" />}>
                  {/* Visible formatted value; the native picker sits on top, transparent */}
                  <span className={`${valueCls} pointer-events-none block`}>{longDate(date)}</span>
                  <input type="date" aria-label="Дата обмена" min={today()} value={date} onChange={(e) => e.target.value && setDate(e.target.value)} className="absolute inset-0 opacity-0" />
                </Row>
                <Row label="Лимит участников" last trailing={<Icon name="down" size={22} strokeWidth={2} />}>
                  <select aria-label="Лимит участников" className={`${valueCls} appearance-none pr-8`} value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
                    {LIMITS.map((l) => (
                      <option key={l} value={l}>
                        {l} человек
                      </option>
                    ))}
                  </select>
                </Row>
              </>
            ) : (
              <>
                <ReadRow label="Название игры" value={name.trim()} />
                {description.trim() && <ReadRow label="Описание" value={description.trim()} />}
                <ReadRow label="Бюджет подарка" value={`до ${formatRub(budgetValue)}`} />
                <ReadRow label="Дата обмена" value={longDate(date)} />
                <ReadRow label="Лимит участников" value={`${limit} человек`} />
                <Row label="Оформление" last>
                  <div className="flex gap-3 pt-1" role="radiogroup" aria-label="Оформление">
                    {THEMES.map((t) => (
                      <button
                        key={t.id}
                        role="radio"
                        aria-checked={theme === t.id}
                        aria-label={t.label}
                        onClick={() => {
                          haptic.select()
                          setTheme(t.id)
                        }}
                        className={`h-9 w-9 rounded-full transition-shadow duration-150 ${theme === t.id ? 'shadow-[0_0_0_3px_#ffe4ce,0_0_0_5px_#281d19]' : ''}`}
                        style={{ background: t.swatch }}
                      />
                    ))}
                  </div>
                </Row>
              </>
            )}
          </section>

          {/* Settings on the dark background */}
          {step === 0 && (
            <div className="mt-1 px-6">
              <label className="flex h-11 items-center justify-between">
                <span className="text-body text-snow">Анонимный чат</span>
                <Switch checked={chatEnabled} onChange={setChatEnabled} label="Анонимный чат" />
              </label>
              <button onClick={() => setRules(true)} className="flex h-11 w-full items-center justify-between text-left">
                <span className="text-body text-snow">Исключения и правила</span>
                <Icon name="forward" size={20} className="text-snow/80" />
              </button>
            </div>
          )}

          <div className="mt-auto px-[43px] pt-[7px]" style={{ paddingBottom: 'calc(var(--sa-bottom) + 29px)' }}>
            <SantomiButton fullWidth trailingIcon={step === 0 ? 'forward' : undefined} leadingIcon={step === 1 ? 'check' : undefined} onClick={next}>
              {step === 0 ? 'Продолжить' : 'Создать игру'}
            </SantomiButton>
          </div>
        </motion.div>
      </AnimatePresence>

      <Sheet open={rules} onClose={() => setRules(false)} title="Исключения и правила">
        <p className="text-callout text-ink/75">
          Исключения — пары, которые не должны дарить друг другу (например, супруги). Их можно настроить в комнате, когда участники присоединятся.
        </p>
        <ul className="mt-4 space-y-2">
          {[
            'Минимум 3 участника',
            'Каждый дарит одному человеку и получает один подарок',
            'Никто не вытянет сам себя',
            `Бесплатно — до ${FREE_PARTICIPANT_LIMIT} участников`,
            'Кто кому дарит, видит только сервер',
          ].map((t) => (
            <li key={t} className="flex items-start gap-3 text-callout">
              <Icon name="check" size={18} className="mt-0.5 shrink-0 text-pine" />
              {t}
            </li>
          ))}
        </ul>
        <SantomiButton variant="secondary" fullWidth className="mt-5" onClick={() => setRules(false)}>
          Понятно
        </SantomiButton>
      </Sheet>
    </Screen>
  )
}

const valueCls = 'w-full bg-transparent text-button leading-snug text-ink outline-none placeholder:text-ink/35'

function Row({ label, children, trailing, error, last }: { label: string; children: ReactNode; trailing?: ReactNode; error?: string; last?: boolean }) {
  return (
    <div className={`relative flex items-center gap-3 py-[15px] [@media(max-height:820px)]:py-[12px] ${last ? '' : 'border-b border-ink/10'}`}>
      <label className="relative min-w-0 flex-1">
        <span className={`block text-secondary transition-colors duration-150 ${error ? 'text-ember' : 'text-ink-soft'}`}>{label}</span>
        <span className="relative mt-1 block">{children}</span>
        <AnimatePresence>
          {error && (
            <motion.span
              role="alert"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={tween(DUR.chip)}
              className="mt-1 block text-footnote text-ember"
            >
              {error}
            </motion.span>
          )}
        </AnimatePresence>
      </label>
      {trailing && <span className="pointer-events-none shrink-0 text-ink">{trailing}</span>}
    </div>
  )
}

function ReadRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-ink/10 py-[15px]">
      <span className="block text-secondary text-ink-soft">{label}</span>
      <span className="mt-1 block text-button leading-snug">{value}</span>
    </div>
  )
}

/** Green iOS-style switch (reference: «Анонимный чат»). */
function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <motion.button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      initial={false}
      animate="rest"
      whileTap="pressed"
      onClick={(e) => {
        e.preventDefault()
        haptic.select()
        onChange(!checked)
      }}
      className={`relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors duration-150 ${checked ? 'bg-[#15935c]' : 'bg-white/20'}`}
    >
      <motion.span
        className="absolute left-0 top-[2px] h-[27px] rounded-full bg-snow shadow-[0_2px_4px_rgba(0,0,0,.25)]"
        variants={{
          rest: { x: checked ? 22 : 2, width: 27 },
          pressed: { x: checked ? 16 : 2, width: 33 },
        }}
        transition={{ type: 'spring', visualDuration: 0.28, bounce: 0.2 }}
      />
    </motion.button>
  )
}
