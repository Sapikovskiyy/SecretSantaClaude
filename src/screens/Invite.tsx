/**
 * 04 · Invite friends — design/references/03-invite-friends.jpeg.
 * At 390 px: back circle + green «Игра создана» badge (only right after creation);
 * title ≈42 px on two lines + subtitle; gift ≈160 px centred; cream card (inset 16, radius 30)
 * with room title, budget, date, hairline, link field + «Скопировать ссылку»; avatars row with
 * «N из M участников / Свободно K мест»; red «Отправить в Telegram» CTA; quiet «Перейти в комнату».
 * The link is the real room link (t.me/<bot>/<app>?startapp=CODE when configured).
 */
import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { Screen } from '@/components/ui/Screen'
import { Avatar } from '@/components/ui/Kit'
import { Icon } from '@/components/ui/Icon'
import { Art } from '@/components/art/Art'
import { SantomiButton } from '@/components/ds'
import { FREE_PARTICIPANT_LIMIT, useDemo } from '@/data/demoStore'
import { useRoomPeople } from '@/data/people'
import { copyText, inviteLink, shareInvite } from '@/lib/share'
import { IS_DEMO } from '@/lib/mode'
import { toast } from '@/data/uiStore'
import { haptic, isTelegram } from '@/lib/telegram'
import { formatRub, plural } from '@/lib/format'
import { DUR, EASE, PRESS } from '@/motion/tokens'
import { NotFound } from './NotFound'

const longDate = (iso: string) => new Date(iso + 'T12:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).replace(' г.', '')

export function Invite() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const room = useDemo((s) => s.rooms.find((r) => r.id === id))
  const addDemo = useDemo((s) => s.addDemoParticipant)
  const people = useRoomPeople(room)
  const [copied, setCopied] = useState(false)

  if (!room) return <NotFound />
  const limit = room.participantLimit ?? FREE_PARTICIPANT_LIMIT
  const free = Math.max(0, limit - people.length)
  const full = free === 0
  const isNew = params.get('new') === '1'
  const link = inviteLink(room.inviteCode)

  const copy = async () => {
    await copyText(link)
    haptic.success()
    setCopied(true)
    toast('Ссылка скопирована')
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <Screen back={`/rooms/${room.id}`} headless className="!pb-0">
      {/* Header row */}
      <div className="mt-[28px] flex h-12 items-center justify-between px-[22px]">
        {!isTelegram ? (
          <motion.button whileTap={PRESS} aria-label="Назад" onClick={() => navigate(`/rooms/${room.id}`)} className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
            <Icon name="back" size={22} />
          </motion.button>
        ) : (
          <span />
        )}
        {isNew && (
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25, ease: EASE, delay: 0.15 }}
            className="flex h-[38px] items-center gap-2 rounded-full border border-[#2c8f5f]/60 bg-[#0f3b28] px-4 text-callout text-snow"
            role="status"
          >
            <Icon name="check" size={18} strokeWidth={2.6} className="text-[#3ddc8a]" />
            Игра создана
          </motion.span>
        )}
      </div>

      <div className="px-6 pt-[22px] [@media(max-height:820px)]:pt-3">
        <h1 className="t-page text-snow">
          Пригласите
          <br />
          друзей
        </h1>
        <p className="t-lead text-snow/75">Вместе праздник интереснее</p>
      </div>

      {/* Gift */}
      <motion.div
        className="relative mx-auto mt-1 flex h-[187px] w-full items-center justify-center [@media(max-height:820px)]:h-[130px]"
        initial={{ opacity: 0, y: 10, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: EASE, delay: 0.05 }}
      >
        <Art name="gift-green" size="min(168px, 19.5dvh)" eager />
      </motion.div>

      {/* Invitation card */}
      <section className="mx-4 mt-1 rounded-[30px] bg-marzipan px-[22px] pb-[17px] pt-[18px] text-ink">
        <h2 className="text-section">{room.name}</h2>
        <p className="mt-1 text-callout text-ink-soft">Бюджет до {formatRub(room.budget)}</p>
        <p className="text-callout text-ink-soft">{longDate(room.date)}</p>
        <div className="my-3 h-px bg-ink/10" />
        <button onClick={copy} className="flex h-[50px] w-full items-center gap-3 rounded-[16px] bg-field px-4 text-left" aria-label="Скопировать ссылку-приглашение">
          <span className="min-w-0 flex-1 truncate text-callout text-ink">{link.replace(/^https?:\/\//, '')}</span>
          <Icon name={copied ? 'check' : 'copy'} size={20} className={copied ? 'text-pine' : 'text-ink'} />
        </button>
        <button onClick={copy} className="mt-1 flex h-9 items-center gap-2.5 text-callout text-ink/75">
          <Icon name="copy" size={18} />
          {copied ? 'Ссылка скопирована' : 'Скопировать ссылку'}
        </button>
      </section>

      {/* Participants */}
      <div className="mt-4 flex items-center gap-3 px-6">
        <div className="flex items-center">
          <AnimatePresence initial={false}>
            {people.slice(0, 4).map((p, i) => (
              <motion.span
                key={p.id}
                layout
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: DUR.layout, ease: EASE }}
                style={{ marginLeft: i ? -14 : 0 }}
                className="rounded-full ring-[3px] ring-marzipan"
              >
                <Avatar person={p} size={46} />
              </motion.span>
            ))}
          </AnimatePresence>
          {IS_DEMO && room.stage === 'gathering' && !full && (
            <motion.button
              whileTap={PRESS}
              aria-label="Добавить тестового участника"
              onClick={() => {
                const p = addDemo(room.id)
                if (p) {
                  haptic.success()
                  toast(`${p.name} присоединяется (демо)`)
                } else toast('Больше нельзя добавить участников', 'error')
              }}
              style={{ marginLeft: people.length ? -14 : 0 }}
              className="flex h-[50px] w-[50px] items-center justify-center rounded-full border-2 border-dashed border-snow/35 bg-cocoa text-snow/70"
            >
              <Icon name="plus" size={20} />
            </motion.button>
          )}
        </div>
        <div className="min-w-0">
          <p className="whitespace-nowrap text-button text-snow">
            {people.length} из {limit} {plural(limit, 'участника', 'участников', 'участников')}
          </p>
          <p className="text-secondary text-taupe-soft">{full ? 'Мест больше нет' : `Свободно ${free} ${plural(free, 'место', 'места', 'мест')}`}</p>
        </div>
      </div>

      <div className="mt-auto px-[25px] pt-4" style={{ paddingBottom: 'calc(var(--sa-bottom) + 2px)' }}>
        <SantomiButton
          fullWidth
          className="!h-[52px]"
          trailingIcon="send"
          disabled={full || room.stage !== 'gathering'}
          onClick={async () => {
            const how = await shareInvite(room.inviteCode, room.name)
            if (how === 'copied') toast('Ссылка скопирована')
          }}
        >
          Отправить в Telegram
        </SantomiButton>
        <button onClick={() => navigate(`/rooms/${room.id}`)} className="mx-auto mt-2 flex h-11 items-center px-4 text-body text-snow/90">
          Перейти в комнату
        </button>
      </div>
    </Screen>
  )
}
