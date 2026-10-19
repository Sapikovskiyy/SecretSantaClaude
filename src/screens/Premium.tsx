/**
 * 13 · Santa+ paywall — sheet 04/screen 13.
 * Large display headline + robot, cream benefits, Stars price block, gold CTA.
 * No payment is simulated: Telegram Stars checkout arrives in Phase 5; premium is never
 * unlocked from the client. The mockup's «100 ₽» is a hypothesis — price is shown in Stars
 * and marked preliminary until the CEO confirms it (configurable on the server).
 */
import { useState } from 'react'
import { motion } from 'motion/react'
import { Screen } from '@/components/ui/Screen'
import { Sheet } from '@/components/ui/Kit'
import { Icon, type IconName } from '@/components/ui/Icon'
import { Art } from '@/components/art/Art'
import { Logo } from '@/components/Logo'
import { PageHeader, SantomiButton } from '@/components/ds'
import { NavRow } from '@/components/ds/blocks'
import { FREE_AI_GENERATIONS, useDemo } from '@/data/demoStore'
import { cardIn } from '@/motion/tokens'

/** Preliminary price (matches AI_PLUS_PRICE_STARS in .env.example); the server is the source of truth. */
const AI_PLUS_PRICE_STARS = 99

const BENEFITS: { icon: IconName; title: string; text: string }[] = [
  { icon: 'gift', title: '50 AI-подборов на 30 дней', text: 'Уникальные идеи подарков для любых близких' },
  { icon: 'list', title: 'Анализ вишлиста', text: 'Учитываем интересы и пожелания получателя' },
  { icon: 'bulb', title: 'Персональные идеи', text: 'С учётом характера, повода и вашего бюджета' },
  { icon: 'heart', title: 'Сохранённые идеи', text: 'Возвращайтесь к понравившимся подаркам' },
]

export function Premium() {
  const aiUsed = useDemo((s) => s.aiUsed)
  const [info, setInfo] = useState<null | 'ai' | 'magic'>(null)
  const left = Math.max(0, FREE_AI_GENERATIONS - aiUsed)

  return (
    <Screen back headless className="!pb-0">
      <PageHeader back title="Santa+" right={<Logo compact className="scale-90" />} />

      {/* Hero */}
      <div className="relative flex min-h-[230px] items-end px-5">
        <div aria-hidden className="absolute right-0 top-0 h-full w-[70%] bg-[radial-gradient(closest-side,rgba(213,54,28,.6),rgba(40,29,25,0))]" />
        {/* one-time light sweep on entry (motion spec 13) */}
        <motion.div
          aria-hidden
          initial={{ x: '-60%', opacity: 0 }}
          animate={{ x: '160%', opacity: [0, 0.5, 0] }}
          transition={{ duration: 1.4, ease: 'easeOut', delay: 0.3 }}
          className="pointer-events-none absolute inset-y-0 w-24 -skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent"
        />
        <div className="relative z-10 max-w-[58%] pb-6">
          <h1 className="type-hero">Подарки на новом уровне</h1>
          <p className="mt-3 text-secondary text-snow/70">Santomi Gift AI подберёт идеи с учётом интересов, вишлиста и характера получателя</p>
        </div>
        <div className="pointer-events-none absolute -right-2 bottom-0">
          <Art name="robot" size={190} eager />
        </div>
      </div>

      <section className="relative z-10 flex-1 rounded-t-[32px] bg-marzipan px-5 pb-8 pt-6 text-ink">
        <ul className="space-y-2">
          {BENEFITS.map((b, i) => (
            <motion.li key={b.title} {...cardIn(i)} className="flex items-center gap-3 rounded-[20px] bg-snow p-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-ember/10 text-ember">
                <Icon name={b.icon} size={20} />
              </span>
              <span className="min-w-0">
                <span className="block text-body font-semibold">{b.title}</span>
                <span className="block text-footnote text-ink-soft">{b.text}</span>
              </span>
            </motion.li>
          ))}
        </ul>

        {/* Price */}
        <motion.div {...cardIn(4)} className="relative mt-4 rounded-[24px] bg-snow p-4 pt-5">
          <span className="absolute -top-3 left-4 rounded-full bg-[#c42c1b] px-3 py-1 text-caption font-semibold text-snow">Выгодно</span>
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="flex items-baseline gap-1.5">
                <span className="text-title">{AI_PLUS_PRICE_STARS}</span>
                <Icon name="star" size={22} className="self-center text-gold" />
                <span className="text-callout text-ink-soft">/ 30 дней</span>
              </p>
              <p className="text-footnote text-ink-soft">Подписка Santa+, оплата в Telegram Stars</p>
            </div>
            <span className="shrink-0 rounded-[14px] bg-marzipan px-3 py-2 text-center text-caption font-semibold leading-tight text-ink/70">
              Цена
              <br />
              предварительная
            </span>
          </div>
          <SantomiButton variant="premium" fullWidth leadingIcon="star" className="mt-4" onClick={() => setInfo('ai')}>
            Купить за {AI_PLUS_PRICE_STARS} ⭐
          </SantomiButton>
          <p className="mt-2 text-center text-caption text-ink-soft">Сейчас бесплатно доступно ещё {left} из {FREE_AI_GENERATIONS} подборов</p>
        </motion.div>

        <p className="mt-3 flex items-start gap-2 text-caption leading-snug text-ink-soft">
          <Icon name="help" size={14} className="mt-0.5 shrink-0" />
          Условия продления и отмены будут показаны в окне оплаты Telegram перед покупкой.
        </p>

        <div className="mt-5">
          <NavRow icon={<Art name="bauble" size={34} noShadow />} title="Santomi Magic" subtitle="Большие группы, темы и особая анимация" onClick={() => setInfo('magic')} />
        </div>
      </section>

      <Sheet open={info !== null} onClose={() => setInfo(null)} title={info === 'magic' ? 'Santomi Magic' : 'Оплата появится скоро'}>
        <div className="text-center">
          <Art name={info === 'magic' ? 'bauble' : 'star'} size={96} />
          <p className="mx-auto mt-3 max-w-[32ch] text-callout text-ink/70">
            {info === 'magic'
              ? 'До 100 участников, праздничные темы и особая анимация раскрытия для одной игры. Цена уточняется.'
              : 'Оплата через Telegram Stars подключается на этапе 5. В демо-режиме покупки не проводятся и не имитируются.'}
          </p>
          <SantomiButton variant="secondary" fullWidth className="mt-5" onClick={() => setInfo(null)}>
            Понятно
          </SantomiButton>
        </div>
      </Sheet>
    </Screen>
  )
}
