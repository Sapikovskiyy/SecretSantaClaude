import { useState } from 'react'
import { useNavigate } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { Screen } from '@/components/ui/Screen'
import { SwipeConfirm } from '@/components/ui/Buttons'
import { Chip, Field, Steps, Toggle, inputDark, inputLight } from '@/components/ui/Kit'
import { Art } from '@/components/art/Art'
import { themeFace } from '@/components/RoomCard'
import { FREE_PARTICIPANT_LIMIT, useDemo } from '@/data/demoStore'
import type { RoomTheme } from '@/domain/types'
import { formatDate, formatRub } from '@/lib/format'
import { haptic } from '@/lib/telegram'
import { toast } from '@/data/uiStore'

const BUDGETS = [500, 1000, 2000, 3000, 5000]
const NAME_IDEAS = ['Новый год в офисе', 'Семья', 'Друзья', 'Наша группа']

function nextDate(month: number, day: number) {
  const now = new Date()
  let y = now.getFullYear()
  const candidate = new Date(y, month, day, 12)
  if (candidate.getTime() < now.getTime()) y += 1
  return new Date(y, month, day, 12).toISOString().slice(0, 10)
}
function inDays(n: number) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}
const today = () => new Date().toISOString().slice(0, 10)

const THEMES: { id: RoomTheme; label: string }[] = [
  { id: 'ember', label: 'Красная' },
  { id: 'pine', label: 'Изумрудная' },
  { id: 'cocoa', label: 'Шоколадная' },
]

export function CreateRoom() {
  const navigate = useNavigate()
  const createRoom = useDemo((s) => s.createRoom)
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [budget, setBudget] = useState(2000)
  const [customBudget, setCustomBudget] = useState('')
  const [date, setDate] = useState(nextDate(11, 25))
  const [description, setDescription] = useState('')
  const [limit, setLimit] = useState('')
  const [chatEnabled, setChatEnabled] = useState(true)
  const [theme, setTheme] = useState<RoomTheme>('ember')

  const titles = ['Как назовём игру?', 'Какой бюджет подарка?', 'Когда обмен подарками?', 'Почти готово']
  const valid = [name.trim().length >= 2, budget >= 100, date >= today(), true][step]

  const next = () => {
    if (!valid) {
      haptic.error()
      toast(['Введите название — хотя бы 2 буквы', 'Бюджет — от 100 ₽', 'Выберите дату в будущем', ''][step], 'error')
      return
    }
    if (step < 3) return setStep(step + 1)
    const id = createRoom({
      name: name.trim().slice(0, 60),
      budget,
      date,
      description: description.trim() || undefined,
      participantLimit: limit ? Math.max(3, Math.min(FREE_PARTICIPANT_LIMIT, Number(limit))) : undefined,
      chatEnabled,
      theme,
    })
    haptic.success()
    navigate(`/rooms/${id}/invite?new=1`, { replace: true })
  }

  return (
    <Screen back={step === 0 ? true : undefined}>
      <div className="flex items-center justify-between px-5">
        {step > 0 ? (
          <button onClick={() => setStep(step - 1)} className="h-11 rounded-full bg-truffle/80 px-4 text-[14px]">
            Назад
          </button>
        ) : (
          <span />
        )}
        <Steps count={4} current={step} />
      </div>

      <AnimatePresence mode="wait">
        <motion.h1
          key={step}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          className="type-title mt-8 ml-auto max-w-[12ch] px-5 text-right"
        >
          {titles[step]}
        </motion.h1>
      </AnimatePresence>

      <div className="mt-8 flex-1 px-5">
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}>
            {step === 0 && (
              <>
                <input
                  autoFocus
                  className={inputDark}
                  placeholder="Например, «Друзья с универа»"
                  value={name}
                  maxLength={60}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && next()}
                  aria-label="Название игры"
                />
                <div className="mt-4 flex flex-wrap gap-2">
                  {NAME_IDEAS.map((n) => (
                    <Chip key={n} active={name === n} onClick={() => setName(n)}>
                      {n}
                    </Chip>
                  ))}
                </div>
                <div className="mt-10 flex justify-center">
                  <Art name="gift" size={170} />
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <p className="text-center text-[64px] font-normal leading-none tracking-[-0.04em]">{formatRub(budget)}</p>
                <p className="mt-2 text-center text-[14px] text-snow/55">максимальная стоимость подарка</p>
                <div className="no-scrollbar -mx-5 mt-8 flex gap-2 overflow-x-auto px-5">
                  {BUDGETS.map((b) => (
                    <Chip
                      key={b}
                      active={budget === b && !customBudget}
                      onClick={() => {
                        setBudget(b)
                        setCustomBudget('')
                      }}
                    >
                      {formatRub(b)}
                    </Chip>
                  ))}
                </div>
                <div className="mt-4">
                  <input
                    inputMode="numeric"
                    className={inputDark}
                    placeholder="Своя сумма"
                    value={customBudget}
                    aria-label="Своя сумма"
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, '').slice(0, 6)
                      setCustomBudget(v)
                      if (v) setBudget(Number(v))
                    }}
                  />
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="flex flex-wrap gap-2">
                  <Chip active={date === nextDate(11, 25)} onClick={() => setDate(nextDate(11, 25))}>
                    25 декабря
                  </Chip>
                  <Chip active={date === nextDate(11, 30)} onClick={() => setDate(nextDate(11, 30))}>
                    30 декабря
                  </Chip>
                  <Chip active={date === inDays(14)} onClick={() => setDate(inDays(14))}>
                    Через 2 недели
                  </Chip>
                </div>
                <input
                  type="date"
                  className={`${inputDark} mt-4 [color-scheme:dark]`}
                  value={date}
                  min={today()}
                  onChange={(e) => setDate(e.target.value)}
                  aria-label="Дата обмена"
                />
                <p className="mt-6 text-center text-[15px] text-snow/60">Обмен — {formatDate(date)}</p>
              </>
            )}

            {step === 3 && (
              <div className="space-y-5">
                <div className={`relative overflow-hidden rounded-[32px] p-5 ${themeFace[theme].bg}`}>
                  <div className="pointer-events-none absolute -bottom-4 -right-4">
                    <Art name={themeFace[theme].art} size={130} noShadow />
                  </div>
                  <p className="type-h3 max-w-[12ch] text-[22px]">{name}</p>
                  <p className="mt-2 text-[14px] text-snow/75">
                    {formatDate(date)}
                    <br />
                    До {formatRub(budget)}
                  </p>
                </div>

                <div>
                  <p className="mb-2 text-[14px] text-snow/60">Оформление</p>
                  <div className="flex gap-2">
                    {THEMES.map((t) => (
                      <Chip key={t.id} active={theme === t.id} onClick={() => setTheme(t.id)}>
                        {t.label}
                      </Chip>
                    ))}
                  </div>
                </div>

                <div className="rounded-[32px] bg-marzipan p-5 text-ink">
                  <Field label="Описание (необязательно)">
                    <textarea
                      className={`${inputLight} h-24 resize-none py-3`}
                      placeholder="Где и когда встречаемся"
                      value={description}
                      maxLength={300}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </Field>
                  <div className="mt-4">
                    <Field label="Лимит участников" hint={`Бесплатно — до ${FREE_PARTICIPANT_LIMIT} человек`}>
                      <input
                        inputMode="numeric"
                        className={inputLight}
                        placeholder="Без лимита"
                        value={limit}
                        onChange={(e) => setLimit(e.target.value.replace(/\D/g, '').slice(0, 3))}
                      />
                    </Field>
                  </div>
                  <div className="mt-2">
                    <Toggle checked={chatEnabled} onChange={setChatEnabled} label="Анонимный чат" />
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="sticky bottom-0 mt-6 px-5 pt-3" style={{ paddingBottom: 'calc(var(--sa-bottom) + 4px)' }}>
        <SwipeConfirm
          key={step}
          label={step === 3 ? 'Создать игру' : 'Далее'}
          knobIcon={step === 3 ? 'check' : 'forward'}
          onConfirm={next}
          tone={step === 3 ? 'ember' : 'taupe'}
        />
      </div>
    </Screen>
  )
}
