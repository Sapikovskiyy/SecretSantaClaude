/**
 * 12 · Gift AI — sheet 03/screen 12.
 * Robot scene with a speech bubble, cream panel: recipient, budget, interests, «Что ищем?»,
 * up to 5 recommendations with save, follow-ups, free limit → AI Plus.
 * Controlled workflow (not a free chat); every free-text query passes the topic guard.
 * DEMO: ideas come from the local catalog instantly — no fake «thinking» delay, and
 * prices are category ranges, never live shop prices. Phase 4: Edge Function → Yandex AI.
 */
import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { Screen } from '@/components/ui/Screen'
import { Chip, DemoBadge, Sheet } from '@/components/ui/Kit'
import { Icon } from '@/components/ui/Icon'
import { Art } from '@/components/art/Art'
import { RiveAnimation } from '@/animation'
import { ErrorState, PageHeader, SantomiButton } from '@/components/ds'
import { FREE_AI_GENERATIONS, useDemo } from '@/data/demoStore'
import { DEMO_WISHLISTS } from '@/data/demoSeed'
import { personName } from '@/data/people'
import { INTERESTS, interestById } from '@/domain/interests'
import { ideaArt, suggestIdeas, type FollowUp } from '@/domain/giftIdeas'
import { checkGiftTopic, interestsFromText, MAX_QUERY_LENGTH } from '@/domain/topic'
import type { GiftIdea, InterestId } from '@/domain/types'
import { formatRange } from '@/lib/format'
import { haptic } from '@/lib/telegram'
import { toast } from '@/data/uiStore'
import { DUR, EASE, PRESS, cardIn } from '@/motion/tokens'

const BUDGETS = [
  { id: 'low', label: 'До 1 000 ₽', value: 1000 },
  { id: 'mid', label: '1–3 тыс. ₽', value: 3000 },
  { id: 'high', label: 'От 3 000 ₽', value: 8000 },
] as const
type BudgetId = (typeof BUDGETS)[number]['id']
const budgetFor = (rub: number): BudgetId => (rub <= 1000 ? 'low' : rub <= 3000 ? 'mid' : 'high')

const FOLLOW_UPS: { id: FollowUp; label: string }[] = [
  { id: 'cheaper', label: 'Предложи дешевле' },
  { id: 'unusual', label: 'Что-то необычное' },
  { id: 'practical', label: 'Более практичный' },
  { id: 'again', label: 'Попробуй ещё' },
]

export function GiftAI() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { rooms, me, aiUsed, consumeAi, savedIdeas, saveIdea, removeIdea } = useDemo()

  const recipients = useMemo(
    () =>
      rooms
        .filter((r) => r.stage === 'drawn' && r.revealSeen && r.myRecipientId)
        .map((r) => ({ roomId: r.id, personId: r.myRecipientId!, budget: r.budget, name: personName(r.myRecipientId!, me) })),
    [rooms, me],
  )
  const preset = recipients.find((o) => o.roomId === params.get('room')) ?? recipients[0]

  const [who, setWho] = useState<string>(preset?.personId ?? 'friend')
  const [budget, setBudget] = useState<BudgetId>(budgetFor(preset?.budget ?? 3000))
  const [interests, setInterests] = useState<InterestId[]>(preset ? (DEMO_WISHLISTS[preset.personId]?.interests ?? []) : [])
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GiftIdea[] | null>(null)
  const [shown, setShown] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pickInterests, setPickInterests] = useState(false)
  const [savedOpen, setSavedOpen] = useState(false)
  const [paywall, setPaywall] = useState(false)

  const recipient = recipients.find((r) => r.personId === who)
  const left = Math.max(0, FREE_AI_GENERATIONS - aiUsed)
  const forName = recipient?.name

  const generate = (followUp?: FollowUp) => {
    setError(null)
    const verdict = checkGiftTopic(query)
    if (!verdict.ok) {
      haptic.error()
      setError(verdict.reason === 'too_long' ? `Слишком длинный запрос — до ${MAX_QUERY_LENGTH} символов` : 'Gift AI помогает только с подарками. Опишите, кому и что вы ищете.')
      return
    }
    if (!consumeAi()) {
      haptic.error()
      setPaywall(true)
      return
    }
    setLoading(true)
    // Demo: synchronous local catalog. In production this awaits the server — the loader
    // runs exactly as long as the real request, never longer.
    const wishInterests = recipient ? (DEMO_WISHLISTS[recipient.personId]?.interests ?? []) : []
    const ideas = suggestIdeas(
      {
        budget: BUDGETS.find((b) => b.id === budget)!.value,
        interests: [...new Set([...interests, ...wishInterests, ...interestsFromText(query)])],
        followUp,
        exclude: followUp ? shown : [],
        seed: Date.now() % 100000,
      },
      5,
    )
    setShown((s) => [...s, ...ideas.map((i) => i.id)])
    setResults(ideas)
    setLoading(false)
    haptic.success()
  }

  const toggleSave = (idea: GiftIdea) => {
    if (savedIdeas.some((s) => s.id === idea.id)) removeIdea(idea.id)
    else {
      saveIdea(idea)
      toast('Идея сохранена в вишлист → Идеи')
    }
  }

  return (
    <Screen withDock headless>
      <PageHeader
        leading={<Icon name="sparkle" size={20} className="text-gold" />}
        title="Gift AI"
        subtitle="Поможет найти идеальный подарок"
        right={
          <motion.button
            whileTap={PRESS}
            aria-label={`Сохранённые идеи (${savedIdeas.length})`}
            onClick={() => setSavedOpen(true)}
            className="relative flex h-12 w-12 items-center justify-center rounded-full bg-white/10"
          >
            <Icon name="clock" size={20} />
            {savedIdeas.length > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-ember px-1 text-caption font-semibold">{savedIdeas.length}</span>}
          </motion.button>
        }
      />

      {/* Robot scene */}
      <div className="relative flex h-[190px] items-end overflow-hidden px-5">
        <div aria-hidden className="absolute -left-10 top-0 h-full w-[70%] bg-[radial-gradient(closest-side,rgba(213,54,28,.55),rgba(40,29,25,0))]" />
        <motion.div
          className="relative -mb-2 shrink-0"
          animate={loading ? { scale: [1, 1.04, 1] } : { scale: 1 }}
          transition={loading ? { duration: 1.8, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.2 }}
        >
          {/* Rive robot when src/assets/rive/gift-ai-robot.riv exists; static 3D render until then */}`n          <RiveAnimation asset="gift-ai-robot" stateMachine="Robot" boolInput={{ name: 'thinking', value: loading }} label="Робот Gift AI" className="h-[176px] w-[176px]" fallback={<Art name="robot" size={176} eager />} />
        </motion.div>
        <motion.div
          key={forName ?? 'any'}
          initial={{ opacity: 0, y: 8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: DUR.card, ease: EASE }}
          className="relative mb-12 ml-1 rounded-[20px] rounded-bl-[6px] bg-snow px-4 py-3 text-ink shadow-lg"
        >
          <p className="text-body font-semibold leading-tight">{forName ? `Найду идеи подарков для ${forName}` : 'Найду идеальный подарок'}</p>
          <p className="mt-1 text-footnote text-ink-soft">Учитываю интересы, вишлист и бюджет</p>
        </motion.div>
      </div>

      <section className="relative z-10 flex-1 rounded-t-[32px] bg-marzipan px-5 pb-8 pt-5 text-ink">
        {/* Recipient */}
        <p className="type-label text-ink/75">Для кого</p>
        <div className="no-scrollbar -mx-5 mt-2 flex gap-2 overflow-x-auto px-5">
          {recipients.map((r) => (
            <Chip
              key={r.personId}
              tone="light"
              active={who === r.personId}
              onClick={() => {
                setWho(r.personId)
                setBudget(budgetFor(r.budget))
                setInterests(DEMO_WISHLISTS[r.personId]?.interests ?? [])
                setResults(null)
              }}
            >
              <Icon name="gift" size={15} /> {r.name}
            </Chip>
          ))}
          {[
            ['friend', 'Друг'],
            ['colleague', 'Коллега'],
            ['family', 'Родственник'],
            ['partner', 'Партнёр'],
          ].map(([id, label]) => (
            <Chip key={id} tone="light" active={who === id} onClick={() => setWho(id)}>
              {label}
            </Chip>
          ))}
        </div>

        {/* Budget */}
        <p className="type-label mt-4 text-ink/75">Бюджет</p>
        <div className="mt-2 grid grid-cols-3 gap-2" role="radiogroup" aria-label="Бюджет">
          {BUDGETS.map((b) => (
            <motion.button
              key={b.id}
              role="radio"
              aria-checked={budget === b.id}
              whileTap={PRESS}
              onClick={() => {
                haptic.select()
                setBudget(b.id)
              }}
              className={`h-11 whitespace-nowrap rounded-full px-2 text-footnote font-semibold transition-colors duration-200 ${budget === b.id ? 'bg-ember text-snow' : 'bg-snow text-ink/75'}`}
            >
              {b.label}
            </motion.button>
          ))}
        </div>

        {/* Interests */}
        <p className="type-label mt-4 text-ink/75">Интересы получателя</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {interests.map((id) => (
            <button
              key={id}
              onClick={() => setInterests((s) => s.filter((x) => x !== id))}
              aria-label={`Убрать интерес ${interestById[id].title}`}
              className="flex h-10 items-center gap-1.5 rounded-full bg-snow pl-1.5 pr-3 text-footnote font-semibold"
            >
              <Art name={interestById[id].art} size={26} noShadow />
              {interestById[id].title}
              <Icon name="close" size={13} className="text-ink/40" />
            </button>
          ))}
          <button onClick={() => setPickInterests(true)} className="flex h-10 items-center gap-1.5 rounded-full border-[1.5px] border-dashed border-ink/25 px-3.5 text-footnote font-semibold text-ink/70">
            <Icon name="plus" size={14} /> Добавить
          </button>
        </div>

        {/* Query */}
        <p className="type-label mt-4 text-ink/75">Что ищем?</p>
        <form
          className="mt-2 flex items-center gap-2 rounded-full bg-snow p-1.5 pl-4 shadow-[0_0_0_1px_rgba(40,29,25,.08)] focus-within:shadow-[0_0_0_2px_#D5361C]"
          onSubmit={(e) => {
            e.preventDefault()
            generate()
          }}
        >
          <Icon name="sparkle" size={18} className="shrink-0 text-ember" />
          <input
            aria-label="Что ищем"
            value={query}
            maxLength={MAX_QUERY_LENGTH + 20}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Например: уютный подарок для дома"
            className="h-11 min-w-0 flex-1 bg-transparent text-callout outline-none placeholder:text-ink/40"
          />
          <motion.button whileTap={PRESS} aria-label="Подобрать идеи" disabled={loading} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ember text-snow disabled:opacity-50">
            <Icon name="arrowRight" size={20} strokeWidth={2.2} />
          </motion.button>
        </form>
        <p className="mt-2 text-caption text-ink-soft">Бесплатно осталось: {left} из {FREE_AI_GENERATIONS}</p>
        {error && (
          <div className="mt-3">
            <ErrorState title="Не получилось подобрать" text={error} />
          </div>
        )}

        {/* Results */}
        <div className="mt-5" aria-live="polite">
          {loading && (
            <div className="flex items-center gap-2 text-secondary text-ink-soft">
              <span className="sbtn-spinner text-ember" aria-hidden /> Подбираем идеи…
            </div>
          )}
          {!loading && !results && (
            <SantomiButton fullWidth leadingIcon="sparkle" onClick={() => generate()}>
              {forName ? `Подобрать для ${forName}` : 'Подобрать идеи'}
            </SantomiButton>
          )}
          {!loading && results && (
            <>
              <h2 className="text-card font-semibold">{forName ? `Рекомендации для ${forName}` : 'Рекомендации'}</h2>
              {results.length === 0 ? (
                <p className="mt-2 rounded-[18px] bg-snow p-4 text-callout">С таким бюджетом идей не нашлось. Попробуйте бюджет побольше.</p>
              ) : (
                <ul className="mt-3 space-y-2.5">
                  <AnimatePresence initial={false}>
                    {results.map((idea, i) => (
                      <motion.li key={idea.id} {...cardIn(i)}>
                        <IdeaCard idea={idea} saved={savedIdeas.some((s) => s.id === idea.id)} onToggle={() => toggleSave(idea)} />
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
              <div className="no-scrollbar -mx-5 mt-3 flex gap-2 overflow-x-auto px-5">
                {FOLLOW_UPS.map((f) => (
                  <Chip key={f.id} tone="light" onClick={() => generate(f.id)}>
                    {f.label}
                  </Chip>
                ))}
              </div>
              <p className="mt-3 text-caption leading-snug text-ink-soft">Цены — примерный диапазон по категории, а не цены магазинов. Демо: идеи из локального каталога, не ИИ.</p>
            </>
          )}
        </div>
        <div className="mt-4 flex justify-center">
          <DemoBadge className="!bg-ink/8 !text-ink/70" />
        </div>
      </section>

      <Sheet open={pickInterests} onClose={() => setPickInterests(false)} title="Интересы получателя">
        <div className="grid grid-cols-3 gap-2">
          {INTERESTS.map((it) => {
            const on = interests.includes(it.id)
            return (
              <motion.button
                key={it.id}
                whileTap={PRESS}
                aria-pressed={on}
                onClick={() => setInterests((s) => (on ? s.filter((x) => x !== it.id) : [...s, it.id]))}
                className={`flex flex-col items-center gap-1 rounded-[18px] p-2 transition-colors ${on ? 'bg-pine text-snow' : 'bg-snow'}`}
              >
                <Art name={it.art} size={52} noShadow />
                <span className="text-caption font-semibold">{it.title}</span>
              </motion.button>
            )
          })}
        </div>
        <SantomiButton variant="secondary" fullWidth className="mt-4" onClick={() => setPickInterests(false)}>
          Готово
        </SantomiButton>
      </Sheet>

      <Sheet open={savedOpen} onClose={() => setSavedOpen(false)} title="Сохранённые идеи">
        {savedIdeas.length === 0 ? (
          <p className="pb-4 text-center text-callout text-ink-soft">Нажмите ♡ на рекомендации, чтобы сохранить её</p>
        ) : (
          <ul className="space-y-2.5">
            {savedIdeas.map((idea) => (
              <li key={idea.id}>
                <IdeaCard idea={idea} saved onToggle={() => removeIdea(idea.id)} />
              </li>
            ))}
          </ul>
        )}
      </Sheet>

      <Sheet open={paywall} onClose={() => setPaywall(false)} title="Бесплатные подборы закончились">
        <div className="flex flex-col items-center text-center">
          <Art name="robot" size={120} />
          <p className="mt-2 max-w-[30ch] text-callout text-ink/70">С Santomi AI Plus — 50 подборов на 30 дней, анализ вишлистов и сохранённые идеи</p>
          <SantomiButton variant="premium" leadingIcon="star" fullWidth className="mt-5" onClick={() => navigate('/premium')}>
            Подробнее об AI Plus
          </SantomiButton>
          <button className="mt-3 h-11 text-secondary text-ink-soft" onClick={() => setPaywall(false)}>
            Не сейчас
          </button>
        </div>
      </Sheet>
    </Screen>
  )
}

function IdeaCard({ idea, saved, onToggle }: { idea: GiftIdea; saved: boolean; onToggle: () => void }) {
  const art = ideaArt(idea, (i) => interestById[i]?.art ?? 'gift')
  return (
    <div className="flex gap-3 rounded-[22px] bg-snow p-3 text-ink">
      <span className="flex h-[76px] w-[76px] shrink-0 items-center justify-center rounded-[18px] bg-marzipan">
        <Art name={art} size={64} noShadow />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-body font-semibold leading-tight">{idea.title}</p>
        <p className="mt-0.5 text-callout font-semibold text-ember">{formatRange(idea.priceMin, idea.priceMax)}</p>
        <p className="mt-0.5 text-footnote text-ink-soft">{idea.why}</p>
      </div>
      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={() => {
          haptic.tap()
          onToggle()
        }}
        aria-label={saved ? 'Убрать из сохранённых' : 'Сохранить идею'}
        aria-pressed={saved}
        className={`flex h-10 w-10 shrink-0 items-center justify-center self-start rounded-full transition-colors ${saved ? 'bg-ember text-snow' : 'bg-ember/10 text-ember'}`}
      >
        <Icon name="heart" size={18} />
      </motion.button>
    </div>
  )
}
