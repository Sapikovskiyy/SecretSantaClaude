/**
 * 04 · Invite friends — sheet 01/screen 04.
 * Envelope scene (rises 10 px once), cream summary, participants with free slots,
 * invite link with copy, blue «Отправить в Telegram», row: copy / real QR / other ways.
 * The QR is generated locally from the actual invite URL (never a decorative fake).
 */
import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import QRCode from 'qrcode'
import { Screen } from '@/components/ui/Screen'
import { Avatar, DemoBadge, Sheet } from '@/components/ui/Kit'
import { Icon, type IconName } from '@/components/ui/Icon'
import { Art } from '@/components/art/Art'
import { PageHeader, SantomiButton } from '@/components/ds'
import { FREE_PARTICIPANT_LIMIT, useDemo } from '@/data/demoStore'
import { useRoomPeople } from '@/data/people'
import { copyText, inviteLink, shareInvite } from '@/lib/share'
import { toast } from '@/data/uiStore'
import { haptic } from '@/lib/telegram'
import { formatDate, formatRub } from '@/lib/format'
import { DUR, EASE, PRESS } from '@/motion/tokens'
import { NotFound } from './NotFound'

export function Invite() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const room = useDemo((s) => s.rooms.find((r) => r.id === id))
  const addDemo = useDemo((s) => s.addDemoParticipant)
  const people = useRoomPeople(room)
  const [qrOpen, setQrOpen] = useState(false)
  const [qrSvg, setQrSvg] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const link = room ? inviteLink(room.inviteCode) : ''
  useEffect(() => {
    if (!qrOpen || !link) return
    QRCode.toString(link, { type: 'svg', margin: 1, color: { dark: '#281D19', light: '#FFF9F2' }, errorCorrectionLevel: 'M' })
      .then(setQrSvg)
      .catch(() => setQrSvg(null))
  }, [qrOpen, link])

  if (!room) return <NotFound />
  const limit = room.participantLimit ?? FREE_PARTICIPANT_LIMIT
  const full = room.members.length >= limit
  const isNew = params.get('new') === '1'
  const freeSlots = Math.max(0, Math.min(2, limit - people.length))

  const copy = async () => {
    await copyText(link)
    haptic.success()
    setCopied(true)
    toast('Ссылка скопирована')
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <Screen back={`/rooms/${room.id}`} headless className="!pb-0">
      <PageHeader back={`/rooms/${room.id}`} title="Пригласить друзей" />

      {/* Envelope scene */}
      <div className="relative flex h-[200px] items-center justify-center">
        <div aria-hidden className="absolute left-1/2 top-1/2 h-[140%] w-[120%] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(closest-side,rgba(213,54,28,.7),rgba(40,29,25,0))]" />
        <div className="float-a absolute left-[10%] top-[16%]">
          <Art name="cane" size={56} noShadow />
        </div>
        <div className="float-b absolute right-[10%] top-[12%]">
          <Art name="star" size={40} noShadow />
        </div>
        <motion.div initial={{ y: 10, opacity: 0, rotate: -8 }} animate={{ y: 0, opacity: 1, rotate: -6 }} transition={{ duration: 0.5, ease: EASE }} className="relative">
          <Art name="envelope" size={190} eager />
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.3 }}
            className="absolute -top-2 left-1/2 -translate-x-1/2 rotate-6 rounded-[10px] bg-snow px-3 py-1.5 text-footnote font-semibold text-ink shadow-md"
          >
            {isNew ? 'Игра создана!' : 'Ты в игре!'}
          </motion.span>
        </motion.div>
      </div>

      <section className="relative z-10 flex-1 rounded-t-[32px] bg-marzipan px-5 pb-8 pt-6 text-ink">
        <h1 className="text-section">{room.name}</h1>
        <ul className="mt-3 space-y-2 text-callout text-ink/85">
          <Meta icon="calendar" text={formatDate(room.date)} />
          <Meta icon="users" text={`до ${limit} участников`} />
          <Meta icon="wallet" text={`до ${formatRub(room.budget)}`} />
          {room.chatEnabled && <Meta icon="lock" text="Анонимный чат включён" />}
        </ul>

        {/* Participants */}
        <div className="mt-5 flex items-center justify-between">
          <p className="text-body font-semibold">
            Участники ({people.length} из {limit})
          </p>
          <button onClick={() => navigate(`/rooms/${room.id}/participants`)} className="flex h-9 items-center gap-0.5 text-secondary font-medium text-ink-soft">
            Все <Icon name="forward" size={16} />
          </button>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <AnimatePresence initial={false}>
            {people.slice(0, 5).map((p) => (
              <motion.span key={p.id} layout initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: DUR.layout, ease: EASE }}>
                <Avatar person={p} size={46} />
              </motion.span>
            ))}
          </AnimatePresence>
          {people.length > 5 && <span className="flex h-[46px] w-[46px] items-center justify-center rounded-full bg-ink/8 text-footnote font-semibold">+{people.length - 5}</span>}
          {room.stage === 'gathering' && !full && (
            <motion.button
              whileTap={PRESS}
              aria-label="Добавить тестового участника"
              onClick={() => {
                const p = addDemo(room.id)
                if (p) {
                  haptic.success()
                  toast(`${p.name} присоединяется к игре`)
                } else toast('Больше нельзя добавить участников', 'error')
              }}
              className="flex h-[46px] w-[46px] items-center justify-center rounded-full border-2 border-dashed border-ink/25 text-ink/60"
            >
              <Icon name="plus" size={20} />
            </motion.button>
          )}
          {Array.from({ length: full ? 0 : freeSlots }, (_, i) => (
            <span key={i} aria-hidden className="h-[46px] w-[46px] rounded-full bg-ink/6" />
          ))}
        </div>
        {full && <p className="mt-2 text-footnote font-medium text-ember">Достигнут лимит участников</p>}

        {/* Link */}
        <p className="type-label mt-5 text-ink/75">Ссылка на приглашение</p>
        <button onClick={copy} className="mt-2 flex h-[52px] w-full items-center gap-3 rounded-[16px] bg-snow px-4 text-left shadow-[0_0_0_1px_rgba(40,29,25,.08)]">
          <span className="min-w-0 flex-1 truncate text-callout text-ink/80">{link.replace(/^https?:\/\//, '')}</span>
          <Icon name={copied ? 'check' : 'copy'} size={20} className={copied ? 'text-pine' : 'text-ink/70'} />
        </button>

        <SantomiButton
          variant="telegram"
          leadingIcon="send"
          fullWidth
          className="mt-4"
          disabled={full || room.stage !== 'gathering'}
          onClick={async () => {
            const how = await shareInvite(room.inviteCode, room.name)
            if (how === 'copied') toast('Ссылка скопирована')
          }}
        >
          Отправить в Telegram
        </SantomiButton>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <SmallAction icon="link" label="Скопировать ссылку" onClick={copy} />
          <SmallAction icon="grid" label="Показать QR-код" onClick={() => setQrOpen(true)} />
          <SmallAction
            icon="more"
            label="Другие способы"
            onClick={async () => {
              if (navigator.share) {
                try {
                  await navigator.share({ title: 'Santomi', text: `Присоединяйся к «${room.name}»`, url: link })
                } catch {
                  /* cancelled */
                }
              } else await copy()
            }}
          />
        </div>

        <SantomiButton variant="secondary" fullWidth className="mt-5" onClick={() => navigate(`/rooms/${room.id}`)}>
          Перейти к игре
        </SantomiButton>
        <div className="mt-4 flex justify-center">
          <DemoBadge className="!bg-ink/8 !text-ink/70" />
        </div>
      </section>

      <Sheet open={qrOpen} onClose={() => setQrOpen(false)} title="QR-код приглашения">
        <div className="flex flex-col items-center pb-2">
          {qrSvg ? (
            <div className="w-[220px] overflow-hidden rounded-[20px] bg-snow p-3 [&>svg]:block [&>svg]:h-auto [&>svg]:w-full" role="img" aria-label={`QR-код ссылки ${link}`} dangerouslySetInnerHTML={{ __html: qrSvg }} />
          ) : (
            <div className="flex h-[220px] w-[220px] items-center justify-center rounded-[20px] bg-snow text-secondary text-ink-soft">Создаём код…</div>
          )}
          <p className="mt-3 text-center text-secondary text-ink-soft">Наведите камеру телефона, чтобы открыть приглашение</p>
          <p className="mt-1 text-caption text-ink/50">Код: {room.inviteCode}</p>
        </div>
      </Sheet>
    </Screen>
  )
}

function Meta({ icon, text }: { icon: IconName; text: string }) {
  return (
    <li className="flex items-center gap-3">
      <Icon name={icon} size={18} className="text-ember" />
      {text}
    </li>
  )
}

function SmallAction({ icon, label, onClick }: { icon: IconName; label: string; onClick: () => void }) {
  return (
    <motion.button whileTap={PRESS} onClick={onClick} className="flex flex-col items-center gap-1.5 rounded-[16px] py-2">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-snow text-ink shadow-[0_1px_0_rgba(40,29,25,.06)]">
        <Icon name={icon} size={20} />
      </span>
      <span className="text-center text-caption font-medium leading-tight text-ink/75">{label}</span>
    </motion.button>
  )
}
