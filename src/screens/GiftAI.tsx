/**
 * Gift AI — controlled workflow, not a free chat (brief §16).
 * Demo: ideas come from a local curated catalog (domain/giftIdeas.ts).
 * Phase 4: same UI, backed by a Supabase Edge Function → Yandex AI Studio.
 */
import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { Screen } from '@/components/ui/Screen'
import { Button } from '@/components/ui/Buttons'
import { Chip, DemoBadge, Sheet, Steps, inputDark } from '@/components/ui/Kit'
import { Icon } from '@/components/ui/Icon'
import { Art } from '@/components/art/Art'
import { FREE_AI_GENERATIONS, useDemo } from '@/data/demoStore'
import { DEMO_WISHLISTS } from '@/data/demoSeed'
import { personName } from '@/data/people'
import { INTERESTS, interestById } from '@/domain/interests'
import { suggestIdeas, type FollowUp } from '@/domain/giftIdeas'
import type { GiftIdea, InterestId } from '@/domain/types'
import { formatRange, formatRub } from '@/lib/format'
import { haptic } from '@/lib/telegram'
import { toast } from '@/data/uiStore'

const WHO = ['Друг', 'Коллега', 'Родственник', 'Партнёр']
const BUDGETS = [500, 1000, 2000, 3000, 5000]
const FOLLOW_UPS: { id: FollowUp; label: string }[] = [
  { id: 'cheaper', label: 'Предложи дешевле' },
  { id: 'unusual', label: 'Что-то необычное' },
  { id: 'practical', label: 'Более практичный подарок' },
  { id: 'again', label: 'Попробуй ещё' },
]

export function GiftAI() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { rooms, me, aiUsed, consumeAi, savedIdeas, saveIdea, removeIdea } = useDemo()

  // Recipients from revealed draws are offered first.
  const recipientOptions = useMemo(
    () =>
      rooms
        .filter((r) => r.stage === 'drawn' && r.revealSeen && r.myRecipientId)
        .map((r) => ({ roomId: r.id, personId: r.myRecipientId!, budget: r.budget, label: personName(r.myRecipientId!, me) })),
    [rooms, me],
  )
  const preset = recipientOptions.find((o) => o.roomId === params.get('room'))

  const [step, setStep] = useState(preset ? 1 : 0)
  const [who, setWho] = useState<string>(preset ? preset.personId : '')
  const [budget, setBudget] = useState(preset?.budget ?? 2000)
  const [interests, setInterests] = useState<InterestId[]>(preset ? (DEMO_WISHLISTS[preset.personId]?.interests ?? []) : [])
  const [useWishlist, setUseWishlist] = useState(true)
  const [limits, setLimits] = useState(preset ? (DEMO_WISHLISTS[preset.personId]?.avoid.join(', ') ?? '') : '')
  const [results, setResults] = useState<GiftIdea[] | null>(null)
  const [shown, setShown] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<'new' | 'saved'>('new')
  const [paywall, setPaywall] = useState(false)

  const left = Math.max(0, FREE_AI_GENERATIONS - aiUsed)
  const whoRecipient = recipientOptions.find((o) => o.personId === who)
  const hasWishlist = Boolean(whoRecipient && DEMO_WISHLISTS[whoRecipient.personId]?.items.length)

  const generate = (followUp?: FollowUp) => {
    if (!consumeAi()) {
      haptic.error()
      setPaywall(true)
      return
    }
    setLoading(true)
    setResults(null)
    const wishInterests = hasWishlist && useWishlist ? (DEMO_WISHLISTS[whoRecipient!.personId]?.interests ?? []) : []
    setTimeout(() => {
      const ideas = suggestIdeas({
        budget,
        interests: [...new Set([...interests, ...wishInterests])],
        followUp,
        exclude: followUp ? shown : [],
        seed: Date.now() % 100000,
      })
      setShown((s) => [...s, ...ideas.map((i) => i.id)])
      setResults(ideas)
      setLoading(false)
      haptic.success()
    }, 1400)
  }

  const questions = ['Кому подарок?', 'Какой бюджет?', 'Чем увлекается?', 'Что ещё учесть?']

  return (
    <Screen surface="pine" withDock>
      <div className="flex items-center justify-between px-5">
        <div className="flex rounded-full bg-black/20 p-1">
          {(['new', 'saved'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`h-10 rounded-full px-4 text-secondary transition-colors ${tab === t ? 'bg-snow text-ink' : 'text-snow/75'}`}
            >
              {t === 'new' ? 'Подбор' : `Сохранённые${savedIdeas.length ? ` (${savedIdeas.length})` : ''}`}
            </button>
          ))}
        </div>
        <DemoBadge />
      </div>

      {tab === 'saved' ? (
        <div className="mt-6 flex-1 px-5">
          <h1 className="type-title">Сохранённые идеи</h1>
          {savedIdeas.length === 0 ? (
            <div className="mt-10 flex flex-col items-center text-center">
              <Art name="gift" size={140} />
              <p className="mt-3 max-w-[28ch] text-callout text-snow/70">Сохраняйте понравившиеся идеи, чтобы вернуться к ним позже</p>
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {savedIdeas.map((idea) => (
                <IdeaCard key={idea.id} idea={idea} saved onToggle={() => removeIdea(idea.id)} />
              ))}
            </div>
          )}
        </div>
      ) : results || loading ? (
        <div className="mt-6 flex-1 px-5">
          <div className="flex items-end justify-between">
            <h1 className="type-title max-w-[10ch]">{loading ? 'Подбираем идеи' : 'Вот что подойдёт'}</h1>
            <button onClick={() => setResults(null)} className="h-10 rounded-full bg-black/20 px-4 text-secondary">
              Изменить
            </button>
          </div>
          {loading ? (
            <div className="mt-10 flex flex-col items-center">
              <motion.div animate={{ rotate: [-8, 8, -8], y: [0, -10, 0] }} transition={{ duration: 0.9, repeat: Infinity }}>
                <Art name="gift" size={150} />
              </motion.div>
              <p className="mt-4 text-callout text-snow/70">Учитываем интересы и бюджет…</p>
            </div>
          ) : (
            <>
              <div className="mt-5 space-y-3">
                {results!.length === 0 && (
                  <p className="rounded-[24px] bg-black/20 p-5 text-callout">С таким бюджетом идей не нашлось. Попробуйте увеличить бюджет.</p>
                )}
                {results!.map((idea, i) => (
                  <motion.div key={idea.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                    <IdeaCard
                      idea={idea}
                      saved={savedIdeas.some((s) => s.id === idea.id)}
                      onToggle={() => {
                        if (savedIdeas.some((s) => s.id === idea.id)) removeIdea(idea.id)
                        else {
                          saveIdea(idea)
                          toast('Идея сохранена')
                        }
                      }}
                    />
                  </motion.div>
                ))}
              </div>
              <div className="no-scrollbar -mx-5 mt-4 flex gap-2 overflow-x-auto px-5">
                {FOLLOW_UPS.map((f) => (
                  <Chip key={f.id} onClick={() => generate(f.id)}>
                    {f.label}
                  </Chip>
                ))}
              </div>
              <p className="mt-4 text-caption leading-snug text-snow/55">
                Цены — примерный диапазон по категории, а не актуальные цены магазинов. Осталось бесплатных подборов: {left} из {FREE_AI_GENERATIONS}
              </p>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="mt-6 flex items-end justify-between px-5">
            <AnimatePresence mode="wait">
              <motion.h1 key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="type-display max-w-[10ch]">
                {questions[step]}
              </motion.h1>
            </AnimatePresence>
          </div>
          <div className="mt-4 flex items-center justify-between px-5">
            <Steps count={4} current={step} />
            <span className="text-footnote text-snow/60">
              Бесплатно: {left} из {FREE_AI_GENERATIONS}
            </span>
          </div>

          <div className="mt-8 flex-1 px-5">
            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                {step === 0 && (
                  <div className="flex flex-wrap gap-2">
                    {recipientOptions.map((o) => (
                      <Chip
                        key={o.personId}
                        active={who === o.personId}
                        onClick={() => {
                          setWho(o.personId)
                          setBudget(o.budget)
                          setInterests(DEMO_WISHLISTS[o.personId]?.interests ?? [])
                          setLimits(DEMO_WISHLISTS[o.personId]?.avoid.join(', ') ?? '')
                        }}
                      >
                        <Icon name="gift" size={16} />
                        {o.label}, мой получатель
                      </Chip>
                    ))}
                    {WHO.map((w) => (
                      <Chip key={w} active={who === w} onClick={() => setWho(w)}>
                        {w}
                      </Chip>
                    ))}
                  </div>
                )}
                {step === 1 && (
                  <>
                    <p className="text-numeral leading-none tracking-[-0.04em]">до {formatRub(budget)}</p>
                    <div className="mt-6 flex flex-wrap gap-2">
                      {BUDGETS.map((b) => (
                        <Chip key={b} active={budget === b} onClick={() => setBudget(b)}>
                          {formatRub(b)}
                        </Chip>
                      ))}
                    </div>
                  </>
                )}
                {step === 2 && (
                  <div className="flex flex-wrap gap-2">
                    {INTERESTS.map((i) => (
                      <Chip
                        key={i.id}
                        active={interests.includes(i.id)}
                        onClick={() => setInterests((s) => (s.includes(i.id) ? s.filter((x) => x !== i.id) : [...s, i.id]))}
                      >
                        {i.title}
                      </Chip>
                    ))}
                  </div>
                )}
                {step === 3 && (
                  <div className="space-y-4">
                    {hasWishlist && (
                      <Chip active={useWishlist} onClick={() => setUseWishlist(!useWishlist)}>
                        {useWishlist && <Icon name="check" size={16} />}
                        Учесть вишлист {whoRecipient!.label}
                      </Chip>
                    )}
                    <textarea
                      className={`${inputDark} h-28 resize-none py-3`}
                      placeholder="Например: не любит сладкое, аллергия на шерсть"
                      maxLength={140}
                      value={limits}
                      onChange={(e) => setLimits(e.target.value)}
                      aria-label="Пожелания и ограничения"
                    />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-6 flex gap-2 px-5">
            {step > 0 && (
              <Button tone="dark" onClick={() => setStep(step - 1)} className="!px-5" aria-label="Назад">
                <Icon name="back" size={20} />
              </Button>
            )}
            <Button
              tone={step === 3 ? 'ember' : 'snow'}
              className="flex-1"
              icon={step === 3 ? 'sparkle' : undefined}
              disabled={step === 0 && !who}
              onClick={() => (step < 3 ? setStep(step + 1) : generate())}
            >
              {step === 3 ? 'Подобрать идеи' : 'Дальше'}
            </Button>
          </div>
        </>
      )}

      <Sheet open={paywall} onClose={() => setPaywall(false)} title="Бесплатные подборы закончились">
        <div className="flex flex-col items-center text-center">
          <Art name="gift" size={120} />
          <p className="mt-2 max-w-[30ch] text-callout text-ink/70">
            С Santomi AI Plus — 50 подборов на 30 дней, анализ вишлистов и сохранённые идеи
          </p>
          <Button tone="gold" icon="star" className="mt-5 w-full" onClick={() => navigate('/premium')}>
            Подробнее об AI Plus
          </Button>
          <Link to="/home" className="mt-3 text-secondary text-ink/60" onClick={() => setPaywall(false)}>
            Не сейчас
          </Link>
        </div>
      </Sheet>
    </Screen>
  )
}

function IdeaCard({ idea, saved, onToggle }: { idea: GiftIdea; saved: boolean; onToggle: () => void }) {
  const art = interestById[idea.interests[0]]?.art ?? 'gift'
  return (
    <div className="flex gap-3 rounded-[28px] bg-marzipan p-3 pr-4 text-ink">
      <div className="flex h-[84px] w-[84px] shrink-0 items-center justify-center rounded-[22px] bg-snow">
        <Art name={art} size={70} noShadow />
      </div>
      <div className="min-w-0 flex-1 py-1">
        <p className="text-body font-medium leading-tight">{idea.title}</p>
        <p className="mt-1 text-footnote text-ink/65">{idea.why}</p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="rounded-full bg-ink px-2.5 py-0.5 text-caption text-snow">{formatRange(idea.priceMin, idea.priceMax)}</span>
          {idea.interests.map((i) => (
            <span key={i} className="rounded-full bg-ink/8 px-2.5 py-0.5 text-caption">
              {interestById[i].title}
            </span>
          ))}
        </div>
      </div>
      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={() => {
          haptic.tap()
          onToggle()
        }}
        aria-label={saved ? 'Убрать из сохранённых' : 'Сохранить идею'}
        aria-pressed={saved}
        className={`flex h-10 w-10 shrink-0 items-center justify-center self-start rounded-full ${saved ? 'bg-ember text-snow' : 'bg-ink/8'}`}
      >
        <Icon name="star" size={18} />
      </motion.button>
    </div>
  )
}
