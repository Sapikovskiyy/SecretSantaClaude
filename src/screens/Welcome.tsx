/**
 * 01 · Welcome — design/references/01-welcome.jpeg (highest-fidelity screen).
 * Measurements at 390 px (reference px × 0.5485):
 *   title block top ≈ 66, centred, 2 lines («Время» / «Тайного Санты!»), ≈38 px medium
 *   subtitle ≈ 173–195, 17 px · illustration from ≈ 271 to the bottom edge (cropped)
 *   CTA pill 314×74 centred at ≈ 731 · «Присоединиться к игре» at ≈ 801
 * Motion: headline → illustration → CTA, ≤ 0.6 s total, no loops on the large raster.
 *
 * Illustration: polka-dot sack with candy cane (sack-v3.webp, cleaned by scripts/clean-cutout.mjs).
 * Body left edge ≈ 46 px, cane ≈ 190–377 px; the right side of the sack bleeds off-screen like the
 * reference (the source cutout has a clipped right edge). Gift + cane renders remain as a fallback.
 */
import { useNavigate } from 'react-router'
import { motion } from 'motion/react'
import { Screen } from '@/components/ui/Screen'
import { SwipeConfirm } from '@/components/ui/Buttons'
import { artUrl } from '@/components/art/Art'
import { GlowStar } from '@/components/GlowStar'
import { useDemo } from '@/data/demoStore'
import { EASE } from '@/motion/tokens'

const SACK = artUrl('sack-v3')
const GIFT = artUrl('gift')
const CANE = artUrl('cane')

const rise = (delay: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: EASE, delay },
})

export function Welcome() {
  const navigate = useNavigate()
  const complete = useDemo((s) => s.completeOnboarding)

  return (
    <Screen surface="cocoa" headless className="!pb-0 overflow-hidden">
      {/* Warm red light rising from the bottom — static gradient, no blur */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: [
            // warm amber bloom behind the big star (reference: #922f1a at 20,300)
            'radial-gradient(34% 22% at 16% 41%, rgba(236,104,46,.62) 0%, rgba(200,66,30,.28) 55%, rgba(160,40,20,0) 100%)',
            // deep festive red rising from the bottom (reference: #79–7e red, darker toward the edge)
            'radial-gradient(140% 74% at 50% 80%, rgba(178,34,18,.95) 0%, rgba(134,20,11,.94) 36%, rgba(92,16,9,.78) 58%, rgba(60,22,14,.3) 78%, rgba(50,25,18,0) 92%)',
            // warm chocolate top (reference #321912)
            'linear-gradient(#321912, #2e1711)',
          ].join(','),
        }}
      />

      {/* Title + subtitle */}
      <div className="relative z-10 px-6 pt-[50px] text-center">
        <motion.h1 className="t-welcome mx-auto text-snow" {...rise(0)}>
          Время
          <br />
          Тайного Санты!
        </motion.h1>
        <motion.p className="mx-auto mt-3 max-w-[30ch] text-callout leading-[22px] text-snow/85" {...rise(0.08)}>
          Дарите радость и сохраняйте
          <br />
          интригу до самого праздника
        </motion.p>
      </div>

      {/* Illustration — anchored to the bottom, cropped by the screen edge like the reference */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 top-[31%]"
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: EASE, delay: 0.12 }}
        style={{ transformOrigin: '50% 100%' }}
      >
        {/* positions measured from the reference overlay (centres 72/343, 350/446, 22/518 at 390×844) */}
        <GlowStar size={108} style={{ left: '4.6%', top: '4.7%' }} />
        <GlowStar size={66} delay={1.6} style={{ right: '1.8%', top: '26%' }} />
        <GlowStar size={62} delay={3.1} style={{ left: '-2.3%', top: '38.7%' }} />
        {SACK ? (
          <img
            src={SACK}
            alt=""
            draggable={false}
            decoding="async"
            fetchPriority="high"
            className="absolute left-[-0.5%] top-[-3%] w-[98%] max-w-none select-none"
          />
        ) : (
          <>
            <img
              src={CANE}
              alt=""
              draggable={false}
              decoding="async"
              className="absolute left-1/2 top-[17%] w-[36%] max-w-[165px] -translate-x-[20%] rotate-[3deg] select-none"
            />
            <img
              src={GIFT}
              alt=""
              draggable={false}
              decoding="async"
              fetchPriority="high"
              className="absolute bottom-[-17%] left-1/2 w-[106%] max-w-[450px] -translate-x-[48%] select-none"
            />
          </>
        )}
      </motion.div>

      {/* CTA */}
      <motion.div className="relative z-10 mt-auto px-[38px]" {...rise(0.25)} style={{ paddingBottom: 'calc(var(--sa-bottom) + 21px)' }}>
        <SwipeConfirm
          hero
          tone="glass"
          label="Начать"
          onConfirm={() => {
            complete()
            navigate('/home', { replace: true })
          }}
        />
        <button
          onClick={() => {
            complete()
            navigate('/join')
          }}
          className="mx-auto mt-2 flex h-11 items-center px-4 text-body text-snow/90"
        >
          Присоединиться к игре
        </button>
      </motion.div>
    </Screen>
  )
}
