/**
 * 07 · Interests — sheet 02/screen 07, calibrated by original reference screen 2.
 * Chocolate screen, serif question, 2-column emerald tiles with 3D objects on a snow mound,
 * multi-select with check, sticky red «Продолжить».
 * Motion: tap scale 0.97→1, check pops 120–220 ms, no reshuffling.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { Screen } from '@/components/ui/Screen'
import { PageHeader, PrimaryCTA, StepProgress } from '@/components/ds'
import { Icon } from '@/components/ui/Icon'
import { Art, hasRender } from '@/components/art/Art'
import { INTERESTS } from '@/domain/interests'
import type { InterestId } from '@/domain/types'
import { useDemo } from '@/data/demoStore'
import { haptic } from '@/lib/telegram'
import { toast } from '@/data/uiStore'
import { DUR, EASE, PRESS, cardIn, tween } from '@/motion/tokens'

// Categories that already have a 3D render come first so the grid opens on the strongest art.
const ORDERED = [...INTERESTS].sort((a, b) => Number(hasRender(b.art)) - Number(hasRender(a.art)))

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
      <PageHeader
        back="/wishlist"
        leading={<StepProgress current={3} total={4} />}
        right={
          <button onClick={() => navigate('/wishlist')} className="h-11 whitespace-nowrap px-1 text-secondary font-semibold text-snow/70">
            Пропустить
          </button>
        }
      />

      <div className="px-5 pt-5">
        <h1 className="type-display max-w-[11ch]">Какие у вас интересы?</h1>
        <p className="mt-3 max-w-[32ch] text-callout leading-snug text-snow/70">
          Выберите интересы, чтобы получать более подходящие идеи подарков.
        </p>
      </div>

      <ul className="mt-6 grid grid-cols-2 gap-3 px-5 pb-36" aria-label="Интересы">
        {ORDERED.map((it, i) => (
          <motion.li key={it.id} {...cardIn(i)}>
            <InterestTile
              title={it.title}
              art={it.art}
              selected={selected.includes(it.id)}
              onToggle={() => toggle(it.id)}
            />
          </motion.li>
        ))}
      </ul>

      {/* Sticky CTA over a chocolate fade so tiles never hide it */}
      <div
        className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-[480px] bg-[linear-gradient(to_top,var(--color-cocoa)_72%,transparent)] px-5 pt-10"
        style={{ paddingBottom: 'calc(var(--sa-bottom) + 16px)' }}
      >
        <p className="mb-3 text-center text-footnote font-medium text-snow/60" aria-live="polite">
          {selected.length ? `Выбрано: ${selected.length}` : 'Можно выбрать несколько'}
        </p>
        <PrimaryCTA trailing="arrowRight" onClick={save}>
          Продолжить
        </PrimaryCTA>
      </div>
    </Screen>
  )
}

function InterestTile({ title, art, selected, onToggle }: { title: string; art: string; selected: boolean; onToggle: () => void }) {
  return (
    <motion.button
      whileTap={PRESS}
      transition={tween(DUR.press)}
      onClick={onToggle}
      role="checkbox"
      aria-checked={selected}
      aria-label={title}
      className={`relative block aspect-[1/1.08] w-full overflow-hidden rounded-[24px] text-left transition-shadow duration-200 ${
        selected ? 'shadow-[0_0_0_3px_#FFE4CE]' : 'shadow-[0_0_0_1px_rgba(255,255,255,.08)]'
      }`}
      style={{ background: 'radial-gradient(120% 90% at 30% 15%, #1f9a62 0%, #006b43 48%, #004a2e 100%)' }}
    >
      {/* soft sparkle light */}
      <span aria-hidden className="absolute -left-6 -top-8 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
      {/* snow mound */}
      <span aria-hidden className="absolute -bottom-[18%] left-1/2 h-[46%] w-[130%] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,#fffaf4,#f6e7da_70%,#e9d3c1)]" />
      <span className="absolute left-[14%] right-[14%] top-[7%] aspect-square">
        <Art name={art} size="100%" noShadow />
      </span>
      <span className="absolute bottom-3 left-4 text-body font-bold text-ink">{title}</span>

      {/* check */}
      <span
        aria-hidden
        className={`absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-200 ${
          selected ? 'bg-snow text-pine' : 'border-2 border-snow/70 bg-black/10'
        }`}
      >
        <AnimatePresence>
          {selected && (
            <motion.span initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.4, opacity: 0 }} transition={{ duration: DUR.chip, ease: EASE }}>
              <Icon name="check" size={18} strokeWidth={2.6} />
            </motion.span>
          )}
        </AnimatePresence>
      </span>
    </motion.button>
  )
}
