import { describe, expect, it } from 'vitest'
import { createSessionRecord, snapshotSession } from '@/features/session/sessionEngine'
import type { VocabularyWord } from '@/features/vocab/model/types'

const words: VocabularyWord[] = [
  {
    id: 'a',
    setId: 'all',
    japanese: '一',
    reading: 'いち',
    meaning: 'one',
    type: 'noun',
    difficulty: 1,
    verbInfo: null,
    sourceOrder: 0,
  },
  {
    id: 'b',
    setId: 'all',
    japanese: '二',
    reading: 'に',
    meaning: 'two',
    type: 'noun',
    difficulty: 1,
    verbInfo: null,
    sourceOrder: 1,
  },
]

describe('sessionEngine', () => {
  it('creates an active session from words', () => {
    const record = createSessionRecord({
      setId: 'all',
      setName: '전체',
      frontMode: 'japanese',
      words,
    })

    expect(record.activeQueue).toEqual(['a', 'b'])
    expect(record.currentCardId).toBe('a')
    expect(record.round).toBe(1)
  })

  it('creates a restorable snapshot', () => {
    const record = createSessionRecord({
      setId: 'all',
      setName: '전체',
      frontMode: 'meaning',
      words,
    })

    const snapshot = snapshotSession(record)
    expect(snapshot.currentCardId).toBe('a')
    expect(snapshot.activeQueue).toEqual(['a', 'b'])
  })
})
