import { describe, expect, it } from 'vitest'
import { checkGiftTopic, interestsFromText, MAX_QUERY_LENGTH } from './topic'

describe('checkGiftTopic', () => {
  it('accepts gift-related requests', () => {
    for (const q of ['уютный подарок для дома', 'что подарить коллеге до 2000', 'идея для любителя кофе', 'настолка для компании', 'подарок программисту', '']) {
      expect(checkGiftTopic(q)).toEqual({ ok: true })
    }
  })

  it('rejects requests that turn the assistant into a general chatbot', () => {
    for (const q of ['напиши код на python', 'сделай домашнее задание по физике', 'какой курс валют сегодня', 'переведи текст на английский']) {
      expect(checkGiftTopic(q)).toMatchObject({ ok: false, reason: 'off_topic' })
    }
  })

  it('rejects mixed jailbreak-style requests with several off-topic markers', () => {
    expect(checkGiftTopic('подарок: напиши код и реферат')).toMatchObject({ ok: false })
  })

  it('limits query length', () => {
    expect(checkGiftTopic('подарок '.repeat(30))).toMatchObject({ ok: false, reason: 'too_long' })
    expect('подарок '.repeat(30).trim().length).toBeGreaterThan(MAX_QUERY_LENGTH)
  })
})

describe('interestsFromText', () => {
  it('maps keywords to interests', () => {
    expect(interestsFromText('что-то уютное, она любит кофе')).toEqual(expect.arrayContaining(['home', 'coffee']))
    expect(interestsFromText('просто сюрприз')).toEqual([])
  })
})
