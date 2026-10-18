/**
 * 14 · Profile — sheet 04/screen 14.
 * Chocolate top with avatar and AI Plus status, cream sections: active games,
 * past games, wishlists, notifications, help. No «Выйти» — there is no separate login (spec §3/14).
 */
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { motion } from 'motion/react'
import { Screen } from '@/components/ui/Screen'
import { Avatar, DemoBadge, Sheet, Toggle } from '@/components/ui/Kit'
import { Icon } from '@/components/ui/Icon'
import { Art } from '@/components/art/Art'
import { PageHeader, SantomiButton } from '@/components/ds'
import { NavRow, RoomRow, SectionTitle } from '@/components/ds/blocks'
import { FREE_AI_GENERATIONS, useDemo, useMyRooms } from '@/data/demoStore'
import { interestById } from '@/domain/interests'
import { isTelegram, tg } from '@/lib/telegram'
import { plural } from '@/lib/format'
import { toast } from '@/data/uiStore'
import { PRESS, cardIn } from '@/motion/tokens'

export function Profile() {
  const navigate = useNavigate()
  const { me, wishlist, aiUsed, resetDemo } = useDemo()
  const rooms = useMyRooms()
  const [notif, setNotif] = useState(false)
  const [help, setHelp] = useState(false)
  const [settings, setSettings] = useState(false)
  const [prefs, setPrefs] = useState({ invites: true, draw: true, messages: true, reminders: true })

  const active = rooms.filter((r) => r.stage !== 'exchanged')
  const past = rooms.filter((r) => r.stage === 'exchanged')
  const username = isTelegram ? tg?.initDataUnsafe.user?.username : undefined
  const left = Math.max(0, FREE_AI_GENERATIONS - aiUsed)

  return (
    <Screen withDock headless back="/home">
      <PageHeader
        back="/home"
        title="Профиль"
        right={
          <motion.button whileTap={PRESS} aria-label="Настройки" onClick={() => setSettings(true)} className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
            <Icon name="edit" size={20} />
          </motion.button>
        }
      />

      {/* Identity */}
      <motion.div {...cardIn(0)} className="mt-4 flex items-center gap-4 px-5">
        <div className="relative">
          <Avatar person={me} size={84} />
          {isTelegram && <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full bg-pine-glow ring-[3px] ring-cocoa" aria-label="В сети" />}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-section">{me.name === 'Вы' ? 'Гость' : me.name}</h1>
          <p className="truncate text-secondary text-snow/60">{username ? `@${username}` : isTelegram ? 'Telegram' : 'Откройте в Telegram, чтобы играть с друзьями'}</p>
          <motion.button
            whileTap={PRESS}
            onClick={() => navigate('/premium')}
            className="mt-2.5 flex w-full max-w-full items-center gap-2 rounded-[16px] bg-pine/90 py-2 pl-2.5 pr-3 text-left"
          >
            <Art name="robot" size={30} noShadow />
            <span className="min-w-0">
              <span className="block text-footnote font-semibold">AI Plus</span>
              <span className="block truncate text-caption text-snow/75">Не подключён. Бесплатно: {left} {plural(left, 'подбор', 'подбора', 'подборов')}</span>
            </span>
            <Icon name="forward" size={16} className="shrink-0" />
          </motion.button>
        </div>
      </motion.div>

      {/* Cream sections */}
      <div className="mt-6 flex-1 space-y-5 rounded-t-[32px] bg-marzipan px-5 pb-6 pt-6 text-ink">
        <section>
          <SectionTitle action={active.length > 3 ? { label: 'Все', to: '/home' } : undefined}>Активные игры</SectionTitle>
          {active.length === 0 ? (
            <p className="mt-2 text-secondary text-ink-soft">Пока нет активных игр</p>
          ) : (
            <ul className="mt-3 space-y-2.5">
              {active.slice(0, 3).map((r, i) => (
                <RoomRow key={r.id} room={r} index={i} />
              ))}
            </ul>
          )}
        </section>

        {past.length > 0 && (
          <section>
            <SectionTitle>Прошлые игры</SectionTitle>
            <ul className="mt-3 space-y-2.5">
              {past.map((r, i) => (
                <RoomRow key={r.id} room={r} index={i} />
              ))}
            </ul>
          </section>
        )}

        <section className="space-y-2.5">
          <NavRow
            icon="heart"
            title="Мой вишлист"
            subtitle={wishlist.length ? `${wishlist.length} ${plural(wishlist.length, 'желание', 'желания', 'желаний')}` : 'Пока пусто'}
            to="/wishlist"
            trailing={
              <span className="flex items-center gap-1">
                {wishlist.slice(0, 3).map((w) => (
                  <span key={w.id} className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-marzipan">
                    <Art name={interestById[w.category].art} size={30} noShadow />
                  </span>
                ))}
                <Icon name="forward" size={16} className="ml-1 text-ink/35" />
              </span>
            }
          />
          <NavRow icon="bell" title="Уведомления" subtitle="Напоминания, приглашения, сообщения" onClick={() => setNotif(true)} />
          <NavRow icon="help" title="Помощь и поддержка" subtitle="Как играть и ответы на вопросы" onClick={() => setHelp(true)} />
        </section>

        <div className="flex justify-center pt-1">
          <DemoBadge className="!bg-ink/8 !text-ink/70" />
        </div>
      </div>

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
