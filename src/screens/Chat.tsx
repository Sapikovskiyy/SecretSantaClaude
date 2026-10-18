/**
 * 11 · Anonymous chat — sheet 03/screen 11.
 * Two-way thread tied to an assignment. The recipient only ever sees «Твой Тайный Санта».
 * Cream bubbles = them, red bubbles = me; anonymity banner; «Попробуйте спросить» grid;
 * cream composer with red send. Delivery states: sending → sent, failed → retry.
 * Motion: only NEW messages animate (140–220 ms); autoscroll only when the reader is at the bottom.
 */
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Navigate, useParams } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { Screen } from '@/components/ui/Screen'
import { PageHeader } from '@/components/ds'
import { Avatar, DemoBadge, Sheet } from '@/components/ui/Kit'
import { Icon } from '@/components/ui/Icon'
import { Art } from '@/components/art/Art'
import { chatKeyOf, useDemo } from '@/data/demoStore'
import { usePerson } from '@/data/people'
import { SUGGESTED_QUESTIONS_TO_RECIPIENT, SUGGESTED_REPLIES_TO_SANTA, type Suggestion } from '@/data/demoSeed'
import type { ChatMessage, ChatRole } from '@/domain/types'
import { timeHM } from '@/lib/format'
import { haptic } from '@/lib/telegram'
import { toast } from '@/data/uiStore'
import { DUR, EASE, PRESS, tween } from '@/motion/tokens'
import { NotFound } from './NotFound'

const NO_MESSAGES: ChatMessage[] = []
const MAX_LEN = 500
const MIN_INTERVAL_MS = 1500
const REPORT_REASONS = ['Оскорбления', 'Спам', 'Пытаются узнать личные данные', 'Другое']

const atBottom = () => window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 120

export function Chat() {
  const { id, role: roleParam } = useParams()
  const role = roleParam as ChatRole
  const room = useDemo((s) => s.rooms.find((r) => r.id === id))
  const messages = useDemo((s) => s.chats[chatKeyOf(id ?? '', role)]) ?? NO_MESSAGES
  const typing = useDemo((s) => s.typing[chatKeyOf(id ?? '', role)])
  const { sendMessage, retryMessage, markRead } = useDemo()
  const recipient = usePerson(room?.myRecipientId)
  const [text, setText] = useState('')
  const [report, setReport] = useState(false)
  const lastSent = useRef(0)
  const wasAtBottom = useRef(true)
  const lastCount = useRef(messages.length)

  // Remember whether the reader was at the bottom *before* the new message rendered.
  useEffect(() => {
    const onScroll = () => (wasAtBottom.current = atBottom())
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useLayoutEffect(() => {
    const added = messages.length > lastCount.current
    const mineAdded = added && messages[messages.length - 1]?.mine
    if (lastCount.current === 0 || mineAdded || (wasAtBottom.current && (added || typing))) {
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: lastCount.current === 0 ? 'auto' : 'smooth' })
    }
    lastCount.current = messages.length
  }, [messages.length, typing]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (id) markRead(id, role)
  }, [messages.length, id, role, markRead])

  if (!room) return <NotFound />
  if (role !== 'toRecipient' && role !== 'fromSanta') return <NotFound />
  if (room.stage !== 'drawn' || !room.chatEnabled) return <Navigate to={`/rooms/${room.id}`} replace />

  const toRecipient = role === 'toRecipient'
  const suggestions = toRecipient ? SUGGESTED_QUESTIONS_TO_RECIPIENT : SUGGESTED_REPLIES_TO_SANTA

  const send = (value = text) => {
    const v = value.trim()
    if (!v) return
    if (Date.now() - lastSent.current < MIN_INTERVAL_MS) return toast('Не так быстро — подождите секунду', 'error')
    lastSent.current = Date.now()
    haptic.tap()
    sendMessage(room.id, role, v.slice(0, MAX_LEN))
    setText('')
  }

  return (
    <Screen back={`/rooms/${room.id}`} headless className="!pb-0">
      {/* faint festive pattern, static */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 mx-auto max-w-[480px] opacity-[0.035]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' fill='none' stroke='%23fff' stroke-width='2'%3E%3Cpath d='M20 30h20v16H20zM18 24h24v6H18zM30 24v22M88 20l3 7 7 1-5 5 1 7-6-4-6 4 1-7-5-5 7-1zM70 86v18M62 92l16 6M62 98l16-6'/%3E%3C/svg%3E\")",
        }}
      />

      <div className="sticky top-0 z-20 bg-cocoa/90 pb-2 backdrop-blur-md" style={{ paddingTop: 4 }}>
        <PageHeader
          back={`/rooms/${room.id}`}
          leading={
            toRecipient ? (
              <Avatar person={recipient} size={38} />
            ) : (
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ember/20">
                <Art name="santa" size={34} noShadow eager />
              </span>
            )
          }
          title={toRecipient ? recipient?.name : 'Твой Тайный Санта'}
          subtitle="Анонимный чат"
          right={
            <motion.button
              whileTap={PRESS}
              aria-label="Пожаловаться"
              onClick={() => setReport(true)}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10"
            >
              <Icon name="flag" size={20} />
            </motion.button>
          }
        />
      </div>

      <div className="relative flex-1 px-4 pb-4">
        {/* Anonymity banner */}
        <div className="mx-1 mt-2 flex items-start gap-3 rounded-[20px] border border-white/8 bg-white/[0.04] p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold">
            <Icon name="lock" size={18} />
          </span>
          <div className="text-[13px] leading-snug">
            <p className="font-bold text-gold">Вы общаетесь анонимно</p>
            <p className="mt-0.5 text-snow/65">
              {toRecipient
                ? `${recipient?.name ?? 'Получатель'} видит вас только как «Твой Тайный Санта».`
                : 'Санта знает, кто вы. Вы узнаете его на обмене подарками.'}
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-2.5" role="log" aria-live="polite" aria-label="Сообщения">
          {messages.length === 0 && (
            <div className="flex flex-col items-center px-6 pt-6 text-center">
              <Art name={toRecipient ? 'envelope' : 'gift'} size={120} />
              <p className="type-h3 mt-3">{toRecipient ? 'Задайте первый вопрос' : 'Санта ещё не писал'}</p>
              <p className="mt-1 max-w-[30ch] text-[14px] text-snow/55">
                {toRecipient ? 'Подсказки ниже помогут начать' : 'Вы тоже можете написать первым'}
              </p>
            </div>
          )}
          <AnimatePresence initial={false}>
            {messages.map((m) => (
              <Bubble key={m.id} m={m} onRetry={() => retryMessage(room.id, role, m.id)} />
            ))}
          </AnimatePresence>
          {typing && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={tween(DUR.message)} className="flex">
              <div className="flex gap-1 rounded-[22px] rounded-bl-[8px] bg-marzipan px-4 py-3.5" aria-label="Собеседник печатает">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="h-2 w-2 rounded-full bg-ink/45"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.18 }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Composer */}
      <div className="sticky bottom-0 z-20 bg-[linear-gradient(to_top,var(--color-bark)_85%,transparent)] px-4 pt-6" style={{ paddingBottom: 'calc(var(--sa-bottom) + 12px)' }}>
        {messages.length < 4 ? (
          <div className="mb-3 rounded-[22px] bg-truffle/70 p-3">
            <p className="mb-2 px-1 text-[13px] font-bold text-snow/80">{toRecipient ? 'Попробуйте спросить' : 'Быстрые ответы'}</p>
            <div className="grid grid-cols-2 gap-2">
              {suggestions.map((s) => (
                <SuggestionCard key={s.text} s={s} onPick={() => send(s.text)} />
              ))}
            </div>
          </div>
        ) : (
          <div className="no-scrollbar -mx-4 mb-3 flex gap-2 overflow-x-auto px-4">
            {suggestions.map((s) => (
              <button
                key={s.text}
                onClick={() => send(s.text)}
                className="flex h-10 shrink-0 items-center gap-2 rounded-full bg-white/8 px-4 text-[13px] font-semibold text-snow/85"
              >
                <Icon name={s.icon} size={16} />
                {s.text}
              </button>
            ))}
          </div>
        )}

        <form
          className="flex items-end gap-2 rounded-[28px] bg-marzipan p-1.5 pl-5"
          onSubmit={(e) => {
            e.preventDefault()
            send()
          }}
        >
          <textarea
            rows={1}
            value={text}
            maxLength={MAX_LEN}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                send()
              }
            }}
            placeholder="Написать сообщение…"
            aria-label="Сообщение"
            className="max-h-32 min-h-[48px] flex-1 resize-none bg-transparent py-3 text-[16px] text-ink placeholder:text-ink/40 outline-none"
          />
          <motion.button
            whileTap={PRESS}
            disabled={!text.trim()}
            aria-label="Отправить"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ember text-snow transition-opacity disabled:opacity-40"
          >
            <Icon name="send" size={20} />
          </motion.button>
        </form>
        <div className="mt-2 flex items-center justify-between px-2 text-[11px] text-snow/40">
          <DemoBadge />
          {text.length > MAX_LEN - 80 && (
            <span>
              {text.length}/{MAX_LEN}
            </span>
          )}
        </div>
      </div>

      <Sheet open={report} onClose={() => setReport(false)} title="Пожаловаться на переписку">
        <p className="mb-4 text-center text-[14px] text-ink/60">Модератор увидит только эту переписку. Собеседник не узнает о жалобе.</p>
        <div className="space-y-2">
          {REPORT_REASONS.map((r) => (
            <button
              key={r}
              onClick={() => {
                setReport(false)
                toast('Жалоба отправлена (демо)')
              }}
              className="flex h-14 w-full items-center justify-between rounded-[18px] bg-snow px-5 text-left text-[16px] font-semibold"
            >
              {r}
              <Icon name="forward" size={18} className="text-ink/40" />
            </button>
          ))}
        </div>
      </Sheet>
    </Screen>
  )
}

function Bubble({ m, onRetry }: { m: ChatMessage; onRetry: () => void }) {
  const failed = m.status === 'failed'
  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DUR.message, ease: EASE }}
      className={`flex flex-col ${m.mine ? 'items-end' : 'items-start'}`}
    >
      <div
        className={`max-w-[82%] rounded-[22px] px-4 pb-2 pt-3 text-[15px] leading-snug ${
          m.mine ? `rounded-br-[8px] bg-ember text-snow ${failed ? 'opacity-70' : ''}` : 'rounded-bl-[8px] bg-marzipan text-ink'
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{m.text}</p>
        <p className={`mt-1 flex items-center justify-end gap-1 text-[11px] ${m.mine ? 'text-snow/70' : 'text-ink/45'}`}>
          {timeHM(m.at)}
          {m.mine && m.status === 'sending' && <Icon name="clock" size={13} aria-label="Отправляется" />}
          {m.mine && (m.status === 'sent' || !m.status) && <Icon name="checks" size={15} aria-label="Доставлено" />}
          {failed && <Icon name="alert" size={13} aria-label="Не отправлено" />}
        </p>
      </div>
      {failed && (
        <button onClick={onRetry} className="mt-1 flex items-center gap-1 px-2 text-[12px] font-semibold text-ember-glow">
          <Icon name="refresh" size={13} /> Не отправлено. Повторить
        </button>
      )}
    </motion.div>
  )
}

function SuggestionCard({ s, onPick }: { s: Suggestion; onPick: () => void }) {
  return (
    <motion.button
      whileTap={PRESS}
      onClick={onPick}
      className="flex min-h-[56px] items-center gap-2.5 rounded-[16px] bg-white/[0.07] px-3 py-2 text-left text-[12.5px] font-semibold leading-tight text-snow/90"
    >
      <Icon name={s.icon} size={18} className="shrink-0 text-gold" />
      {s.text}
    </motion.button>
  )
}
