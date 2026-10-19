/**
 * Gift AI topic guard (pure, framework-free → reusable in the Edge Function).
 * A system prompt alone is not enough (brief §16): the request is checked before it
 * reaches the model. This is the first, cheap layer; the server adds a model-based
 * classifier and rate limits in Phase 4.
 */
import type { InterestId } from './types'

export const MAX_QUERY_LENGTH = 140

/** Words that clearly make it a gift request even when an off-topic marker appears. */
const STRONG_GIFT = ['подар', 'сюрприз', 'что купить', 'вишлист']

const OFF_TOPIC = [
  'код', 'программ', 'python', 'javascript', 'sql', 'скрипт', 'домашн', 'реферат', 'сочинен', 'курсов', 'диплом', 'эссе',
  'политик', 'выборы', 'войн', 'новост', 'курс валют', 'биткоин', 'крипт', 'инвест', 'диагноз', 'лекарств', 'лечен',
  'взлом', 'пароль', 'перевед', 'переведи', 'translate', 'напиши стих', 'анекдот', 'погод',
]

export type TopicVerdict = { ok: true } | { ok: false; reason: 'too_long' | 'off_topic' }

export function checkGiftTopic(text: string): TopicVerdict {
  const t = text.trim().toLowerCase()
  if (!t) return { ok: true }
  if (t.length > MAX_QUERY_LENGTH) return { ok: false, reason: 'too_long' }
  const offHits = OFF_TOPIC.filter((w) => t.includes(w)).length
  if (offHits === 0) return { ok: true }
  // An off-topic marker is tolerated only inside an explicit gift request
  // («подарок программисту»), and never when several markers pile up.
  const strong = STRONG_GIFT.some((w) => t.includes(w))
  if (!strong || offHits > 1) return { ok: false, reason: 'off_topic' }
  return { ok: true }
}

const KEYWORD_INTERESTS: [string, InterestId][] = [
  ['уют', 'home'], ['дом', 'home'], ['плед', 'home'], ['свеч', 'home'],
  ['книг', 'books'], ['читат', 'books'],
  ['игр', 'games'], ['настолк', 'games'],
  ['кофе', 'coffee'], ['чай', 'coffee'],
  ['техник', 'tech'], ['гаджет', 'tech'], ['наушник', 'tech'],
  ['музык', 'music'], ['винил', 'music'], ['концерт', 'music'],
  ['косметик', 'beauty'], ['духи', 'beauty'], ['аромат', 'beauty'], ['уход', 'beauty'],
  ['одежд', 'fashion'], ['шарф', 'fashion'], ['стил', 'fashion'],
  ['рисов', 'creative'], ['творч', 'creative'], ['рукодел', 'creative'],
  ['спорт', 'sport'], ['трениров', 'sport'], ['бег', 'sport'],
  ['путешеств', 'travel'], ['поездк', 'travel'], ['отпуск', 'travel'],
]

/** Extracts interest hints from free text («что-то уютное для дома» → home). */
export function interestsFromText(text: string): InterestId[] {
  const t = text.toLowerCase()
  return [...new Set(KEYWORD_INTERESTS.filter(([k]) => t.includes(k)).map(([, i]) => i))]
}
