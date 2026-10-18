/**
 * 01 · Welcome — sheet 01/screen 01 + original reference screen 1.
 * Giant serif headline, one dominant 3D gift on an ember glow, red «Начать» + outlined «Присоединиться к игре».
 * Motion spec: headline in 2–3 phases → gift 0.96→1 → CTA; total ≤ 0.9 s; gift breathes ±1.5° over 7.5 s.
 */
import { useNavigate } from 'react-router'
import { motion } from 'motion/react'
import { Screen } from '@/components/ui/Screen'
import { PrimaryCTA, SecondaryCTA } from '@/components/ds'
import { Art } from '@/components/art/Art'
import { Logo } from '@/components/Logo'
import { useDemo } from '@/data/demoStore'
import { EASE } from '@/motion/tokens'

const phase = (delay: number) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.42, ease: EASE, delay },
})

export function Welcome() {
  const navigate = useNavigate()
  const complete = useDemo((s) => s.completeOnboarding)

  return (
    <Screen surface="cocoa" headless className="overflow-hidden">
      {/* Ember glow behind the hero — the reference's signature light */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[58%] h-[78%] w-[150%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgba(213,54,28,.95),rgba(142,31,14,.65)_45%,rgba(40,29,25,0)_100%)]" />
        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-bark/70 to-transparent" />
      </div>

      <div className="relative px-6">
        <motion.div {...phase(0)}>
          <Logo />
        </motion.div>
        <h1 className="type-hero mt-8 max-w-[9ch]">
          <motion.span className="block" {...phase(0.05)}>
            Время
          </motion.span>
          <motion.span className="block" {...phase(0.14)}>
            Тайного
          </motion.span>
          <motion.span className="block" {...phase(0.23)}>
            Санты!
          </motion.span>
        </h1>
        <motion.p className="mt-4 max-w-[30ch] text-callout leading-relaxed text-snow/80" {...phase(0.32)}>
          Создавайте игры, обменивайтесь подарками и дарите новогоднее настроение вместе в Telegram.
        </motion.p>
      </div>

      {/* Hero scene */}
      <div className="relative flex flex-1 items-center justify-center" style={{ minHeight: 190 }}>
        <div className="float-a absolute left-[4%] top-[6%]">
          <Art name="star" size={58} noShadow />
        </div>
        <div className="float-b absolute right-[6%] top-[2%]">
          <Art name="star" size={40} noShadow />
        </div>
        <div className="float-b absolute bottom-[10%] left-[2%] -rotate-12">
          <Art name="cane" size={78} noShadow />
        </div>
        <div className="float-a absolute bottom-[16%] right-[3%]">
          <Art name="bauble" size={54} noShadow />
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE, delay: 0.3 }}
        >
          <div className="breathe">
            {/* sized by both width and height so both CTAs stay above the fold on short phones */}
            <Art name="gift" size="min(70vw, 30dvh, 300px)" eager />
          </div>
        </motion.div>
      </div>

      <motion.div className="relative space-y-3 px-6 pt-4" {...phase(0.48)}>
        <PrimaryCTA
          trailing="arrowRight"
          onClick={() => {
            complete()
            navigate('/home', { replace: true })
          }}
        >
          Начать
        </PrimaryCTA>
        <SecondaryCTA
          icon="users"
          onClick={() => {
            complete()
            navigate('/join')
          }}
        >
          Присоединиться к игре
        </SecondaryCTA>
      </motion.div>
    </Screen>
  )
}
