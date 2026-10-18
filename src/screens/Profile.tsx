import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Screen } from '@/components/ui/Screen'
import { Avatar, DemoBadge, Sheet, Toggle } from '@/components/ui/Kit'
import { Icon, type IconName } from '@/components/ui/Icon'
import { Button } from '@/components/ui/Buttons'
import { Art } from '@/components/art/Art'
import { RoomCard } from '@/components/RoomCard'
import { FREE_AI_GENERATIONS, useDemo, useMyRooms } from '@/data/demoStore'
import { isTelegram } from '@/lib/telegram'
import { plural } from '@/lib/format'
import { toast } from '@/data/uiStore'

export function Profile() {
  const navigate = useNavigate()
  const { me, wishlist, aiUsed, resetDemo } = useDemo()
  const rooms = useMyRooms()
  const [notif, setNotif] = useState(false)
  const [help, setHelp] = useState(false)
  const [prefs, setPrefs] = useState({ invites: true, draw: true, messages: true, reminders: true })

  const active = rooms.filter((r) => r.stage !== 'exchanged')
  const past = rooms.filter((r) => r.stage === 'exchanged')

  return (
    <Screen withDock>
      <div className="flex flex-col items-center px-5 pt-2 text-center">
        <Avatar person={me} size={96} />
        <h1 className="type-title mt-4">{me.name === 'Вы' ? 'Гость' : me.name}</h1>
        <p className="mt-1 text-secondary text-snow/55">{isTelegram ? 'Вход через Telegram' : 'Откройте в Telegram, чтобы играть с друзьями'}</p>
        <DemoBadge className="mt-3" />
      </div>

      <section className="mt-8">
        <h2 className="type-h3 px-5">
          Активные игры <span className="text-snow/45">{active.length}</span>
        </h2>
        <div className="no-scrollbar mt-3 flex gap-3 overflow-x-auto px-5 pb-1">
          {active.map((r) => (
            <RoomCard key={r.id} room={r} />
          ))}
          {active.length === 0 && <p className="text-secondary text-snow/55">Пока нет активных игр</p>}
        </div>
        {past.length > 0 && <p className="mt-3 px-5 text-secondary text-snow/55">Прошлые игры: {past.length}</p>}
      </section>

      {/* AI Plus status */}
      <Link to="/premium" className="relative mx-5 mt-6 flex items-center gap-4 overflow-hidden rounded-[32px] bg-pine p-5">
        <div className="flex-1">
          <p className="type-h3">Santomi AI Plus</p>
          <p className="mt-1 text-secondary text-snow/70">
            Не подключён. Бесплатных подборов осталось {Math.max(0, FREE_AI_GENERATIONS - aiUsed)}
          </p>
        </div>
        <Art name="gift" size={84} noShadow />
      </Link>

      <ul className="mx-5 mt-3 overflow-hidden rounded-[28px] bg-truffle">
        <Row icon="gift" label="Мой вишлист" value={`${wishlist.length} ${plural(wishlist.length, 'желание', 'желания', 'желаний')}`} onClick={() => navigate('/wishlist')} />
        <Row icon="bell" label="Уведомления" onClick={() => setNotif(true)} />
        <Row icon="star" label="Santomi Magic" value="Темы и большие группы" onClick={() => navigate('/premium')} />
        <Row icon="help" label="Помощь" onClick={() => setHelp(true)} />
      </ul>

      <button
        onClick={() => {
          resetDemo()
          toast('Демо-данные сброшены')
          navigate('/', { replace: true })
        }}
        className="mx-auto mt-6 h-11 rounded-full px-5 text-secondary text-snow/50"
      >
        Сбросить демо-данные
      </button>

      <Sheet open={notif} onClose={() => setNotif(false)} title="Уведомления в Telegram">
        <Toggle label="Приглашения и новые участники" checked={prefs.invites} onChange={(v) => setPrefs({ ...prefs, invites: v })} />
        <Toggle label="Результаты жеребьёвки" checked={prefs.draw} onChange={(v) => setPrefs({ ...prefs, draw: v })} />
        <Toggle label="Анонимные сообщения" checked={prefs.messages} onChange={(v) => setPrefs({ ...prefs, messages: v })} />
        <Toggle label="Напоминания о дне обмена" checked={prefs.reminders} onChange={(v) => setPrefs({ ...prefs, reminders: v })} />
        <p className="mt-2 text-footnote text-ink/55">Уведомления придут от бота Santomi после подключения сервера (этап 3)</p>
      </Sheet>

      <Sheet open={help} onClose={() => setHelp(false)} title="Как это работает">
        <ol className="space-y-3 text-callout">
          {[
            'Создайте игру и отправьте друзьям ссылку',
            'Каждый заполняет вишлист',
            'Организатор проводит жеребьёвку',
            'Вы открываете конверт и узнаёте, кому дарите',
            'Задавайте вопросы анонимно и готовьте подарок',
          ].map((t, i) => (
            <li key={t} className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ember text-footnote font-medium text-snow">{i + 1}</span>
              {t}
            </li>
          ))}
        </ol>
        <Button className="mt-5 w-full" tone="snow" onClick={() => setHelp(false)}>
          Понятно
        </Button>
      </Sheet>
    </Screen>
  )
}

function Row({ icon, label, value, onClick }: { icon: IconName; label: string; value?: string; onClick: () => void }) {
  return (
    <li className="border-b border-white/6 last:border-0">
      <button onClick={onClick} className="flex h-16 w-full items-center gap-3 px-5 text-left">
        <Icon name={icon} size={20} className="text-snow/70" />
        <span className="flex-1 text-body">{label}</span>
        {value && <span className="text-footnote text-snow/45">{value}</span>}
        <Icon name="forward" size={16} className="text-snow/35" />
      </button>
    </li>
  )
}
