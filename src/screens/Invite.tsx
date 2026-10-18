import { Link, useParams, useSearchParams } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { Screen } from '@/components/ui/Screen'
import { Button } from '@/components/ui/Buttons'
import { Avatar, DemoBadge } from '@/components/ui/Kit'
import { Icon } from '@/components/ui/Icon'
import { Art } from '@/components/art/Art'
import { useDemo } from '@/data/demoStore'
import { useRoomPeople } from '@/data/people'
import { copyText, inviteLink, shareInvite } from '@/lib/share'
import { toast } from '@/data/uiStore'
import { haptic } from '@/lib/telegram'
import { plural } from '@/lib/format'
import { NotFound } from './NotFound'

export function Invite() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const room = useDemo((s) => s.rooms.find((r) => r.id === id))
  const addDemo = useDemo((s) => s.addDemoParticipant)
  const people = useRoomPeople(room)
  if (!room) return <NotFound />
  const link = inviteLink(room.inviteCode)
  const isNew = params.get('new') === '1'

  return (
    <Screen surface="pine" back={`/rooms/${room.id}`}>
      <div className="px-5">
        <p className="text-[14px] text-snow/70">{isNew ? 'Игра создана' : room.name}</p>
        <h1 className="type-title mt-2 max-w-[12ch]">Зовите друзей в игру</h1>
      </div>

      <div className="relative mt-4 flex h-[190px] items-center justify-center">
        <motion.div initial={{ scale: 0.8, rotate: -10, opacity: 0 }} animate={{ scale: 1, rotate: -6, opacity: 1 }} transition={{ type: 'spring', stiffness: 160, damping: 14 }}>
          <Art name="envelope" size={190} />
        </motion.div>
      </div>

      <div className="mx-5 rounded-[36px] bg-marzipan p-5 text-ink">
        <p className="text-[14px] text-ink/60">Код приглашения</p>
        <p className="mt-1 text-[40px] font-medium tracking-[0.14em]">{room.inviteCode}</p>
        <button
          onClick={async () => {
            await copyText(link)
            haptic.success()
            toast('Ссылка скопирована')
          }}
          className="mt-3 flex w-full items-center gap-3 rounded-[20px] bg-snow px-4 py-3 text-left"
        >
          <Icon name="link" size={20} className="shrink-0 text-ink/50" />
          <span className="min-w-0 flex-1 truncate text-[14px] text-ink/70">{link}</span>
          <Icon name="copy" size={20} className="shrink-0" />
        </button>
        <Button
          className="mt-4 w-full"
          icon="share"
          onClick={async () => {
            const how = await shareInvite(room.inviteCode, room.name)
            if (how === 'copied') toast('Ссылка скопирована')
          }}
        >
          Отправить приглашение
        </Button>
      </div>

      <section className="mt-6 px-5">
        <div className="flex items-center justify-between">
          <h2 className="type-h3">
            {people.length} {plural(people.length, 'участник', 'участника', 'участников')}
          </h2>
          <DemoBadge />
        </div>
        <ul className="mt-3 flex flex-wrap gap-3">
          <AnimatePresence initial={false}>
            {people.map((p) => (
              <motion.li key={p.id} layout initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center gap-1">
                <Avatar person={p} size={52} />
                <span className="text-[12px] text-snow/70">{p.name}</span>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
        <button
          onClick={() => {
            const p = addDemo(room.id)
            if (p) {
              haptic.success()
              toast(`${p.name} присоединяется к игре`)
            } else toast('Больше нельзя добавить участников', 'error')
          }}
          className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white/10 text-[15px]"
        >
          <Icon name="plus" size={18} />
          Добавить тестового участника
        </button>
        <Link to={`/rooms/${room.id}`} className="mt-3 flex h-14 w-full items-center justify-center rounded-full bg-snow text-[16px] font-medium text-ink">
          Перейти к игре
        </Link>
      </section>
    </Screen>
  )
}
