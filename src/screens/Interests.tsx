/**
 * 04 · Interests — design/references/05-full-screen-overview.jpeg («What gift do you want?»).
 * Chocolate screen lit by a red glow on the left and an emerald glow on the right; back circle +
 * step dots; two-line title; two horizontally scrolling rows of tall translucent tiles with a 3D
 * object and a white label (rows scroll together, the next tile peeks in); selected tile turns
 * Christmas red with a white check; narrow red «Продолжить».
 * Motion: tap scale 0.97→1, check pops 120–220 ms, no reshuffling.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { Screen } from '@/components/ui/Screen'
import { SantomiButton } from '@/components/ds'
import { Icon } from '@/components/ui/Icon'
import { Art } from '@/components/art/Art'
import { INTERESTS, type InterestMeta } from '@/domain/interests'
import type { InterestId } from '@/domain/types'
import { useDemo } from '@/data/demoStore'
import { haptic, isTelegram } from '@/lib/telegram'
import { toast } from '@/data/uiStore'
import { DUR, EASE, PRESS, tween } from '@/motion/tokens'

// Two rows that scroll together: first half on top (Стиль, Игры, Кофе…), second below (Книги, Техника, Путешествия…).
const HALF = Math.ceil(INTERESTS.length / 2)
const ROW_A = INTERESTS.slice(0, HALF)
const ROW_B = INTERESTS.slice(HALF)
const STEP = 3
const STEPS = 4

export function Interests() {
  const navigate = useNavigate()
  const saved = useDemo((s) => s.interests)
  const setInterests = useDemo((s) => s.setInterests)
  const [selected, setSelected] = useState<InterestId[]>(saved)

  const toggle = (id: InterestId) => {
    haptic.select()
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  }

  const save = () => {
    setInterests(selected)
    haptic.success()
    toast(selected.length ? 'Интересы сохранены' : 'Интересы очищены')
    navigate('/wishlist')
  }

  return (
    <Screen surface="cocoa" back="/wishlist" headless className="!pb-0">
      {/* side glows: red left, emerald right (reference) */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(75%_42%_at_0%_52%,rgba(168,40,20,.55),transparent_70%),radial-gradient(70%_45%_at_100%_38%,rgba(5,92,58,.62),transparent_72%)]" />

      {/* Header: back circle + step dots */}
      <div className="relative mt-[34px] flex h-12 items-center justify-between px-[22px] [@media(max-height:820px)]:mt-4">
        {!isTelegram ? (
          <motion.button whileTap={PRESS} aria-label="Назад" onClick={() => navigate('/wishlist')} className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
            <Icon name="back" size={22} />
          </motion.button>
        ) : (
          <span className="w-12" />
        )}
        <div className="absolute inset-x-0 top-0 flex flex-col items-center gap-2 pt-1" aria-label={`Шаг ${STEP} из ${STEPS}`}>
          <div className="flex items-center gap-2">
            {Array.from({ length: STEPS }, (_, i) => (
              <span key={i} className={`h-2 rounded-full ${i + 1 === STEP ? 'w-2 bg-ember-bright' : i + 1 < STEP ? 'w-2 bg-snow/80' : 'w-2 bg-[#6e5d55]'}`} />
            ))}
          </div>
        </div>
        <span className="w-12" />
      </div>

      <div className="relative px-6 pt-[30px] [@media(max-height:820px)]:pt-4">
        <h1 className="t-page-tight text-snow">
          Какой подарок
          <br />
          вы хотите?
        </h1>
        <p className="mt-3 max-w-[32ch] text-callout leading-[21px] text-snow/80">Выберите интересы, чтобы получать более точные рекомендации.</p>
      </div>

      {/* Two rows, one horizontal scroller */}
      <div className="no-scrollbar relative mt-6 overflow-x-auto [@media(max-height:820px)]:mt-4" role="group" aria-label="Интересы">
        <div className="flex w-max flex-col gap-3 px-4">
          {[ROW_A, ROW_B].map((row, r) => (
            <ul key={r} className="flex gap-3">
              {row.map((it, i) => (
                <motion.li key={it.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: DUR.card, ease: EASE, delay: Math.min(i, 3) * 0.045 + r * 0.06 }}>
                  <InterestTile item={it} tall={r === 0} selected={selected.includes(it.id)} onToggle={() => toggle(it.id)} />
                </motion.li>
              ))}
            </ul>
          ))}
        </div>
      </div>

      <div className="relative mt-auto px-[58px] pt-4" style={{ paddingBottom: 'calc(var(--sa-bottom) + 26px)' }}>
        <p className="sr-only" aria-live="polite">
          {selected.length ? `Выбрано: ${selected.length}` : 'Можно выбрать несколько'}
        </p>
        <SantomiButton fullWidth trailingIcon="forward" onClick={save}>
          Далее
        </SantomiButton>
      </div>
    </Screen>
  )
}

function InterestTile({ item, tall, selected, onToggle }: { item: InterestMeta; tall: boolean; selected: boolean; onToggle: () => void }) {
  return (
    <motion.button
      whileTap={PRESS}
      transition={tween(DUR.press)}
      onClick={onToggle}
      role="checkbox"
      aria-checked={selected}
      aria-label={item.title}
      className={`relative block overflow-hidden rounded-[26px] text-left transition-[background,box-shadow] duration-200 ${
        tall ? 'h-[200px] w-[140px] [@media(max-height:820px)]:h-[176px] [@media(max-height:820px)]:w-[128px]' : 'h-[172px] w-[124px] [@media(max-height:820px)]:h-[152px] [@media(max-height:820px)]:w-[114px]'
      } ${
        selected
          ? 'bg-[linear-gradient(165deg,#d9452a_0%,#a92a17_55%,#7d1c0e_100%)] shadow-[0_14px_30px_-14px_rgba(160,30,12,.9),inset_0_1px_0_rgba(255,255,255,.18)]'
          : 'bg-[linear-gradient(165deg,rgba(255,236,222,.13),rgba(255,236,222,.05))] shadow-[inset_0_0_0_1px_rgba(255,255,255,.07)]'
      }`}
    >
      <span className="absolute inset-x-[10%] top-[9%] flex aspect-square items-center justify-center">
        <Art name={item.art} size="100%" noShadow />
      </span>
      <span className="absolute inset-x-2 bottom-[14px] truncate text-center text-body font-medium text-snow">{item.title}</span>

      <AnimatePresence>
        {selected && (
          <motion.span
            aria-hidden
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.4, opacity: 0 }}
            transition={{ duration: DUR.chip, ease: EASE }}
            className="absolute right-3 top-3 flex h-[30px] w-[30px] items-center justify-center rounded-full bg-snow text-ink shadow-[0_4px_10px_-4px_rgba(0,0,0,.5)]"
          >
            <Icon name="check" size={17} strokeWidth={2.4} />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  )
}
