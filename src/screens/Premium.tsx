/**
 * Premium screens. No payment is simulated: the buy buttons explain that
 * Telegram Stars checkout arrives in Phase 5 (brief: never fake a payment).
 */
import { useState } from 'react'
import { motion } from 'motion/react'
import { Screen } from '@/components/ui/Screen'
import { Button } from '@/components/ui/Buttons'
import { Sheet } from '@/components/ui/Kit'
import { Icon } from '@/components/ui/Icon'
import { Art } from '@/components/art/Art'

// Placeholder prices — final Stars pricing is a CEO decision (Phase 5).
const PLANS = [
  {
    id: 'ai',
    title: 'AI Plus',
    period: '30 дней',
    price: 'около 100 ₽ в Stars',
    surface: 'bg-pine',
    art: 'gift',
    perks: ['50 подборов подарков', 'Анализ вишлиста получателя', 'Уточнения: дешевле, необычнее', 'Сохранённые идеи'],
  },
  {
    id: 'magic',
    title: 'Magic',
    period: 'для одной игры',
    price: 'цена уточняется',
    surface: 'bg-[radial-gradient(120%_100%_at_20%_0%,#e2492c,#a42813_55%,#5c150b)]',
    art: 'bauble',
    perks: ['До 100 участников', 'Праздничные темы оформления', 'Особая анимация конверта', 'Расширенные настройки организатора'],
  },
] as const

export function Premium() {
  const [info, setInfo] = useState(false)
  return (
    <Screen back>
      <div className="px-5">
        <h1 className="type-display ml-auto max-w-[9ch] text-right">Больше магии</h1>
        <p className="mt-3 text-right text-callout text-snow/60">Основная игра всегда бесплатна</p>
      </div>

      <div className="mt-6 space-y-4 px-5">
        {PLANS.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`relative overflow-hidden rounded-[36px] p-6 ${p.surface}`}
          >
            <div className="pointer-events-none absolute -right-6 -top-4">
              <Art name={p.art} size={140} noShadow />
            </div>
            <p className="text-secondary text-snow/70">Santomi</p>
            <p className="type-title">{p.title}</p>
            <p className="mt-1 text-secondary text-snow/70">
              {p.period}, {p.price}
            </p>
            <ul className="mt-5 space-y-2">
              {p.perks.map((perk) => (
                <li key={perk} className="flex items-center gap-2 text-callout">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-snow/20">
                    <Icon name="check" size={14} strokeWidth={2.4} />
                  </span>
                  {perk}
                </li>
              ))}
            </ul>
            <Button tone={p.id === 'ai' ? 'gold' : 'snow'} icon="star" className="mt-6 w-full" onClick={() => setInfo(true)}>
              Подключить за Stars
            </Button>
          </motion.div>
        ))}
      </div>

      <Sheet open={info} onClose={() => setInfo(false)} title="Оплата появится скоро">
        <div className="text-center">
          <Art name="star" size={96} />
          <p className="mx-auto mt-3 max-w-[30ch] text-callout text-ink/70">
            Оплата через Telegram Stars подключается на этапе 5. В демо-режиме покупки не проводятся и не имитируются.
          </p>
          <Button tone="snow" className="mt-5 w-full" onClick={() => setInfo(false)}>
            Понятно
          </Button>
        </div>
      </Sheet>
    </Screen>
  )
}
