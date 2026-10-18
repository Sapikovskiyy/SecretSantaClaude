import type { Person, Room } from '@/domain/types'
import { DEMO_PEOPLE } from './demoSeed'
import { ME, useDemo } from './demoStore'

const byId = new Map(DEMO_PEOPLE.map((p) => [p.id, p]))

export function usePerson(id?: string): Person | undefined {
  const me = useDemo((s) => s.me)
  if (!id) return undefined
  return id === ME ? me : byId.get(id)
}

export function useRoomPeople(room?: Room): Person[] {
  const me = useDemo((s) => s.me)
  if (!room) return []
  return room.members.map((m) => (m.personId === ME ? me : byId.get(m.personId))).filter(Boolean) as Person[]
}

export function personName(id: string, me: Person) {
  return id === ME ? me.name : (byId.get(id)?.name ?? 'Участник')
}
