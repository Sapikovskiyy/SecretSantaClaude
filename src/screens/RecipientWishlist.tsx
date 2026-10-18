import { Navigate, useParams } from 'react-router'
import { motion } from 'motion/react'
import { Screen } from '@/components/ui/Screen'
import { SantomiLinkButton } from '@/components/ds'
import { Avatar, Chip, DemoBadge } from '@/components/ui/Kit'
import { Art } from '@/components/art/Art'
import { useDemo } from '@/data/demoStore'
import { usePerson } from '@/data/people'
import { DEMO_WISHLISTS } from '@/data/demoSeed'
import { interestById } from '@/domain/interests'
import { formatRub } from '@/lib/format'
import { NotFound } from './NotFound'

export function RecipientWishlist() {
  const { id } = useParams()
  const room = useDemo((s) => s.rooms.find((r) => r.id === id))
  const recipient = usePerson(room?.myRecipientId)
  if (!room) return <NotFound />
  // Only the assigned Santa may open this — enforced server-side in production.
  if (room.stage !== 'drawn' || !recipient || !room.revealSeen) return <Navigate to={`/rooms/${room.id}`} replace />

  const data = DEMO_WISHLISTS[recipient.id] ?? { interests: [], items: [], avoid: [] }

  return (
    <Screen back={`/rooms/${room.id}`}>
      <div className="flex items-start justify-between px-5">
        <Avatar person={recipient} size={56} />
        <h1 className="type-title max-w-[9ch] text-right">Вишлист {recipient.name}</h1>
      </div>
      <p className="mt-3 px-5 text-right text-secondary text-snow/55">Бюджет до {formatRub(room.budget)}</p>

      {data.interests.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2 px-5">
          {data.interests.map((i) => (
            <span key={i} className="flex items-center gap-1 rounded-full bg-white/8 py-1 pl-1 pr-3 text-footnote">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-snow">
                <Art name={interestById[i].art} size={26} noShadow />
              </span>
              {interestById[i].title}
            </span>
          ))}
        </div>
      )}

      <div className="mt-6 space-y-3 px-5">
        {data.items.length === 0 && (
          <div className="rounded-[28px] bg-truffle p-5 text-center">
            <p className="type-h3">Вишлист пока пуст</p>
            <p className="mt-1 text-secondary text-snow/60">Спросите в анонимном чате, что порадует</p>
          </div>
        )}
        {data.items.map((w, i) => (
          <motion.div
            key={w.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="flex items-center gap-4 rounded-[28px] bg-marzipan p-3 pr-5 text-ink"
          >
            <div className="flex h-[76px] w-[76px] shrink-0 items-center justify-center rounded-[22px] bg-snow">
              <Art name={interestById[w.category].art} size={64} noShadow />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-body font-medium leading-tight">{w.title}</p>
              {w.description && <p className="mt-0.5 text-footnote text-ink/60">{w.description}</p>}
              <p className="mt-1 text-footnote text-ink/60">{w.price ? `Около ${formatRub(w.price)}` : 'Цена не указана'}</p>
            </div>
            {w.priority === 'high' && <span className="rounded-full bg-ember px-2.5 py-1 text-caption font-medium text-snow">Очень хочет</span>}
          </motion.div>
        ))}
      </div>

      {data.avoid.length > 0 && (
        <div className="mt-5 px-5">
          <p className="mb-2 text-secondary text-snow/60">Лучше не дарить</p>
          <div className="flex flex-wrap gap-2">
            {data.avoid.map((a) => (
              <Chip key={a}>{a}</Chip>
            ))}
          </div>
        </div>
      )}

      <div className="mt-auto space-y-3 px-5 pt-8">
        <SantomiLinkButton to={`/ai?room=${room.id}`} variant="success" leadingIcon="sparkle" fullWidth>
          Подобрать идеи для {recipient.name}
        </SantomiLinkButton>
        <div className="flex justify-center">
          <DemoBadge />
        </div>
      </div>
    </Screen>
  )
}
