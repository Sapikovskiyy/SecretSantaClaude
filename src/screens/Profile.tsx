/**
 * 12 · Profile / Santa+ — design/references/05-overview-original.png («Profile / Premium»).
 * Back + settings circles; avatar with name and plan; a glossy cocoa Santa+ card (crown,
 * four real benefits, red «Улучшить» → paywall — nothing is unlocked from the client);
 * quiet rows «Мои игры» / «Настройки»; then the games lists, wishlist, notifications, help.
 * No «Выйти» — there is no separate login (spec §3/14).
 */
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { motion } from 'motion/react'
import { Screen } from '@/components/ui/Screen'
import { Avatar, DemoBadge, Sheet, Toggle } from '@/components/ui/Kit'
import { Icon, type IconName } from '@/components/ui/Icon'
import { SantomiButton } from '@/components/ds'
import { RoomRow } from '@/components/ds/blocks'
import { FREE_AI_GENERATIONS, useDemo, useMyRooms } from '@/data/demoStore'
import { isTelegram, tg } from '@/lib/telegram'
import { plural } from '@/lib/format'
import { toast } from '@/data/uiStore'
import { PRESS, cardIn } from '@/motion/tokens'

/** Same benefits as the Santa+ paywall — never promise what the product does not do. */
const BENEFITS = ['50 AI-подборов на 30 дней', 'Анализ вишлиста получателя', 'Персональные идеи подарков', 'Сохранённые идеи']

export function Profile() {
  const navigate = useNavigate()
  const { me, wishlist, aiUsed, resetDemo } = useDemo()
  const rooms = useMyRooms()
  const [notif, setNotif] = useState(false)
  const [help, setHelp] = useState(false)
  const [settings, setSettings] = useState(false)
  const [prefs, setPrefs] = useState({ invites: true, draw: true, messages: true, reminders: true })
  const gamesRef = useRef<HTMLElement>(null)

  const active = rooms.filter((r) => r.stage !== 'exchanged')
  const past = rooms.filter((r) => r.stage === 'exchanged')
  const username = isTelegram ? tg?.initDataUnsafe.user?.username : undefined
  const left = Math.max(0, FREE_AI_GENERATIONS - aiUsed)

  return (
    <Screen withDock headless back="/home" surface="cocoa">
      {/* Header */}
      <div className="mt-[22px] flex h-12 items-center justify-between px-[22px]">
        {!isTelegram ? (
          <motion.button whileTap={PRESS} aria-label="Назад" onClick={() => navigate('/home')} className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
            <Icon name="back" size={22} />
          </motion.button>
        ) : (
          <span className="w-12" />
        )}
        <motion.button whileTap={PRESS} aria-label="Настройки" onClick={() => setSettings(true)} className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
          <Icon name="sliders" size={21} strokeWidth={1.7} />
        </motion.button>
      </div>

      {/* Identity */}
      <motion.div {...cardIn(0)} className="mt-3 flex items-center gap-5 px-6">
        <span className="relative rounded-full ring-[3px] ring-[#efe2d8]/85">
          <Avatar person={me} size={72} />
          {isTelegram && <span className="absolute bottom-0.5 right-0.5 h-4 w-4 rounded-full bg-pine-glow ring-[3px] ring-cocoa" aria-label="В сети" />}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-section font-medium text-snow">{me.name === 'Вы' ? 'Гость' : me.name}</h1>
          <p className="mt-0.5 truncate text-callout text-snow/65">{username ? `@${username} · Бесплатный план` : 'Бесплатный план'}</p>
        </div>
      </motion.div>

      {/* Santa+ card */}
      <motion.section
        {...cardIn(1)}
        aria-label="Santa+"
        className="relative mx-4 mt-5 overflow-hidden rounded-[30px] p-[18px] shadow-[0_18px_36px_-18px_rgba(0,0,0,.7),inset_0_1px_0_rgba(255,255,255,.08)]"
        style={{ background: 'linear-gradient(160deg, #6a4a3a 0%, #4a3328 45%, #382720 100%)' }}
      >
        <span aria-hidden className="pointer-events-none absolute -right-10 -top-14 h-40 w-40 rounded-full bg-[radial-gradient(closest-side,rgba(255,214,160,.22),transparent)]" />
        <button onClick={() => navigate('/premium')} className="relative flex w-full items-center gap-3 text-left">
          <Icon name="crown" size={30} strokeWidth={1.9} className="shrink-0 text-gold" />
          <span className="min-w-0 flex-1 text-card font-medium text-snow">Перейти на Santa+</span>
          <Icon name="forward" size={20} className="shrink-0 text-snow/80" />
        </button>
        <ul className="relative mt-3 space-y-[7px]">
          {BENEFITS.map((b) => (
            <li key={b} className="flex items-center gap-2.5 text-callout text-snow/90">
              <Icon name="check" size={17} strokeWidth={2.4} className="shrink-0 text-gold" />
              {b}
            </li>
          ))}
        </ul>
        <p className="relative mt-3 text-caption text-snow/55">Бесплатно осталось: {left} {plural(left, 'подбор', 'подбора', 'подборов')}</p>
        <SantomiButton fullWidth trailingIcon="forward" className="relative mt-3 !h-[52px]" onClick={() => navigate('/premium')}>
          Улучшить
        </SantomiButton>
      </motion.section>

      {/* Quiet rows */}
      <ul className="mx-4 mt-4">
        <DarkRow icon="gift" label="Мои игры" value={String(rooms.length)} onClick={() => gamesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })} />
        <DarkRow icon="heart" label="Мой вишлист" value={wishlist.length ? String(wishlist.length) : 'Пусто'} onClick={() => navigate('/wishlist')} />
        <DarkRow icon="bell" label="Уведомления" onClick={() => setNotif(true)} />
        <DarkRow icon="help" label="Помощь и поддержка" onClick={() => setHelp(true)} />
        <DarkRow icon="gear" label="Настройки" onClick={() => setSettings(true)} last />
      </ul>

      {/* Games */}
      <section ref={gamesRef} className="mt-4 scroll-mt-4 space-y-5 rounded-t-[32px] bg-marzipan px-5 pb-6 pt-6 text-ink">
        <div>
          <h2 className="t-section">Активные игры</h2>
          {active.length === 0 ? (
            <p className="mt-2 text-secondary text-ink-soft">Пока нет активных игр</p>
          ) : (
            <ul className="mt-3 space-y-2.5">
              {active.map((r, i) => (
                <RoomRow key={r.id} room={r} index={i} />
              ))}
            </ul>
          )}
        </div>
        {past.length > 0 && (
          <div>
            <h2 className="t-section">Прошлые игры</h2>
            <ul className="mt-3 space-y-2.5">
              {past.map((r, i) => (
                <RoomRow key={r.id} room={r} index={i} />
              ))}
            </ul>
          </div>
        )}
        <div className="flex justify-center pt-1">
          <DemoBadge className="!bg-ink/8 !text-ink/70" />
        </div>
      </section>

      <Sheet open={notif} onClose={() => setNotif(false)} title="Уведомления в Telegram">
        <Toggle label="Приглашения и новые участники" checked={prefs.invites} onChange={(v) => setPrefs({ ...prefs, invites: v })} />
        <Toggle label="Результаты жеребьёвки" checked={prefs.draw} onChange={(v) => setPrefs({ ...prefs, draw: v })} />
        <Toggle label="Анонимные сообщения" checked={prefs.messages} onChange={(v) => setPrefs({ ...prefs, messages: v })} />
        <Toggle label="Напоминания о дне обмена" checked={prefs.reminders} onChange={(v) => setPrefs({ ...prefs, reminders: v })} />
        <p className="mt-2 text-footnote text-ink-soft">Уведомления будет присылать бот Santomi после подключения сервера</p>
      </Sheet>

      <Sheet open={help} onClose={() => setHelp(false)} title="Как это работает">
        <ol className="space-y-3 text-callout">
          {[
            'Создайте игру и отправьте друзьям ссылку',
            'Каждый заполняет вишлист',
            'Организатор проводит жеребьёвку',
            'Вы открываете подарок и узнаёте, кому дарите',
            'Задавайте вопросы анонимно и готовьте подарок',
          ].map((t, i) => (
            <li key={t} className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ember text-footnote font-semibold text-snow">{i + 1}</span>
              {t}
            </li>
          ))}
        </ol>
        <SantomiButton variant="secondary" fullWidth className="mt-5" onClick={() => setHelp(false)}>
          Понятно
        </SantomiButton>
      </Sheet>

      <Sheet open={settings} onClose={() => setSettings(false)} title="Настройки">
        <p className="mb-4 text-center text-secondary text-ink-soft">Имя и фото берутся из Telegram</p>
        <SantomiButton
          variant="danger"
          fullWidth
          leadingIcon="refresh"
          onClick={() => {
            resetDemo()
            setSettings(false)
            toast('Демо-данные сброшены')
            navigate('/', { replace: true })
          }}
        >
          Сбросить демо-данные
        </SantomiButton>
      </Sheet>
    </Screen>
  )
}

function DarkRow({ icon, label, value, onClick, last }: { icon: IconName; label: string; value?: string; onClick: () => void; last?: boolean }) {
  return (
    <li className={last ? '' : 'border-b border-white/[0.07]'}>
      <motion.button whileTap={{ scale: 0.99 }} onClick={onClick} className="flex h-[58px] w-full items-center gap-4 px-2 text-left">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] bg-white/[0.08] text-snow/85">
          <Icon name={icon} size={20} strokeWidth={1.7} />
        </span>
        <span className="min-w-0 flex-1 truncate text-body text-snow">{label}</span>
        {value && <span className="text-callout text-snow/55">{value}</span>}
        <Icon name="forward" size={18} strokeWidth={1.8} className="shrink-0 text-snow/45" />
      </motion.button>
    </li>
  )
}
