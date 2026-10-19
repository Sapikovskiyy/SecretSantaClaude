/**
 * Chats — target of the chat icon in the bottom navigation (reference 04-home).
 * Lists the anonymous conversations the user has in games where the draw happened.
 * Full visual pass follows the overview (screen 11) in the next milestone.
 */
import { Link } from 'react-router'
import { Screen } from '@/components/ui/Screen'
import { Avatar } from '@/components/ui/Kit'
import { Icon } from '@/components/ui/Icon'
import { Art } from '@/components/art/Art'
import { unreadCount, useDemo, useMyRooms } from '@/data/demoStore'
import { usePerson } from '@/data/people'
import type { Room } from '@/domain/types'

export function Chats() {
  const rooms = useMyRooms().filter((r) => r.stage === 'drawn' && r.chatEnabled)
  return (
    <Screen withDock headless>
      <div className="px-6 pt-[22px]">
        <h1 className="t-page text-snow">Чаты</h1>
        <p className="t-lead mt-2 text-snow/75">Анонимные разговоры с Сантой и получателем</p>
      </div>
      {rooms.length === 0 ? (
        <div className="mt-10 flex flex-col items-center px-8 text-center">
          <Art name="envelope" size={140} />
          <p className="mt-4 text-button font-semibold text-snow">Пока нет чатов</p>
          <p className="mt-1 text-callout text-taupe-soft">Чаты появятся после жеребьёвки</p>
        </div>
      ) : (
        <ul className="mt-6 px-4">
          {rooms.map((r) => (
            <RoomChats key={r.id} room={r} />
          ))}
        </ul>
      )}
    </Screen>
  )
}

function RoomChats({ room }: { room: Room }) {
  const chats = useDemo((s) => s.chats)
  const recipient = usePerson(room.revealSeen ? room.myRecipientId : undefined)
  const rows = [
    { role: 'fromSanta' as const, title: 'Твой Тайный Санта', avatar: <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ember/20"><Art name="santa" size={40} noShadow /></span> },
    ...(recipient ? [{ role: 'toRecipient' as const, title: recipient.name, avatar: <Avatar person={recipient} size={48} /> }] : []),
  ]
  return (
    <li className="mb-4">
      <p className="px-2 pb-2 text-footnote text-taupe-soft">{room.name}</p>
      <div className="divide-y divide-white/[0.06] overflow-hidden rounded-[24px] bg-truffle">
        {rows.map((c) => {
          const n = unreadCount(chats, room.id, c.role)
          return (
            <Link key={c.role} to={`/rooms/${room.id}/chat/${c.role}`} className="flex items-center gap-3 px-4 py-3">
              {c.avatar}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-button font-semibold text-snow">{c.title}</span>
                <span className="block text-secondary text-taupe-soft">{c.role === 'fromSanta' ? 'Санта знает вас, вы его — нет' : 'Вы пишете анонимно'}</span>
              </span>
              {n > 0 ? <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-ember px-2 text-caption font-semibold text-snow">{n}</span> : <Icon name="forward" size={18} className="text-snow/50" />}
            </Link>
          )
        })}
      </div>
    </li>
  )
}
