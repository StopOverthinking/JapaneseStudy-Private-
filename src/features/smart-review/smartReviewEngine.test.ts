import { describe, expect, it } from 'vitest'
import {
  applySmartReviewOutcome,
  buildSmartReviewSummary,
  createStudyPrompt,
  createEmptyProfile,
  createSmartReviewSession,
} from '@/features/smart-review/smartReviewEngine'
import type { VocabularyWord } from '@/features/vocab/model/types'

const words: VocabularyWord[] = [
  {
    id: 'word-1',
    setId: 'set-a',
    japanese: '守る',
    reading: 'まもる',
    meaning: 'protect',
    type: 'verb',
    difficulty: 10,
    verbInfo: null,
    sourceOrder: 0,
  },
  {
    id: 'word-2',
    setId: 'set-a',
    japanese: '位置',
    reading: 'いち',
    meaning: 'position',
    type: 'noun',
    difficulty: 10,
    verbInfo: null,
    sourceOrder: 1,
  },
  {
    id: 'word-3',
    setId: 'set-a',
    japanese: '正確だ',
    reading: 'せいかくだ',
    meaning: 'accurate',
    type: 'na_adj',
    difficulty: 10,
    verbInfo: null,
    sourceOrder: 2,
  },
]

describe('smart review engine', () => {
  it('summarizes due, new, learning, and mastered words', () => {
    const now = new Date('2026-04-11T00:00:00.000Z')

    const summary = buildSmartReviewSummary(words, {
      'word-1': {
        ...createEmptyProfile('word-1'),
        dueAt: '2026-04-10T00:00:00.000Z',
        intervalDays: 7,
        updatedAt: '2026-04-09T00:00:00.000Z',
      },
      'word-2': {
        ...createEmptyProfile('word-2'),
        updatedAt: '2026-04-10T00:00:00.000Z',
      },
    }, now)

    expect(summary).toEqual({
      dueCount: 1,
      newCount: 1,
      learningCount: 1,
      masteredCount: 1,
    })
  })

  it('creates a session with the eligible words shuffled before starting', () => {
    const now = new Date('2026-04-11T00:00:00.000Z')

    const session = createSmartReviewSession({
      setId: 'set-a',
      setName: 'Set A',
      words,
      wordCount: words.length,
    }, {}, now)

    expect(session?.selectedWordIds).toEqual(['word-3', 'word-1', 'word-2'])
  })

  it('resets failed words to tomorrow and promotes clean words forward', () => {
    const now = new Date('2026-04-11T00:00:00.000Z')
    const session = createSmartReviewSession({
      setId: 'set-a',
      setName: 'Set A',
      words: words.slice(0, 2),
      wordCount: 2,
    }, {}, now)

    if (!session) {
      throw new Error('Expected session to be created')
    }

    session.itemStates['word-1'] = {
      wordId: 'word-1',
      attempts: 1,
      wrongCount: 0,
      answeredCorrectly: true,
    }
    session.itemStates['word-2'] = {
      wordId: 'word-2',
      attempts: 2,
      wrongCount: 1,
      answeredCorrectly: true,
    }

    const applied = applySmartReviewOutcome({}, session, now)

    expect(applied.promotedCount).toBe(1)
    expect(applied.resetCount).toBe(1)
    expect(applied.masteredCount).toBe(0)
    expect(applied.nextProfiles['word-1']?.dueAt).toBe('2026-04-18T00:00:00.000Z')
    expect(applied.nextProfiles['word-1']?.intervalDays).toBe(7)
    expect(applied.nextProfiles['word-2']?.dueAt).toBe('2026-04-12T00:00:00.000Z')
    expect(applied.nextProfiles['word-2']?.intervalDays).toBe(1)
  })

  it('prefers curated prompts when a word override exists', () => {
    const prompt = createStudyPrompt({
      id: '1_1',
      setId: 'jlpt-n3',
      japanese: '飽きる',
      reading: 'あきる',
      meaning: '질리다, 싫증나다',
      type: 'verb',
      difficulty: 35,
      verbInfo: '2자',
      sourceOrder: 0,
    })

    expect(prompt.japaneseSentence).toBe('同じ練習ばかりで、さすがに ____。')
    expect(prompt.note).toBe('친근한 구어')
  })

  it('uses deterministic fallback prompts with varied tones for uncovered words', () => {
    const firstPrompt = createStudyPrompt({
      id: 'fallback-a',
      setId: 'set-a',
      japanese: '整える',
      reading: 'ととのえる',
      meaning: '정돈하다',
      type: 'verb',
      difficulty: 20,
      verbInfo: '2타',
      sourceOrder: 10,
    })

    const secondPrompt = createStudyPrompt({
      id: 'fallback-b',
      setId: 'set-a',
      japanese: '届く',
      reading: 'とどく',
      meaning: '도착하다',
      type: 'verb',
      difficulty: 20,
      verbInfo: '1자',
      sourceOrder: 11,
    })

    expect(firstPrompt.japaneseSentence).not.toBe(secondPrompt.japaneseSentence)
    expect(firstPrompt.note).not.toBe(secondPrompt.note)
    expect(firstPrompt.japaneseSentence).toContain('____')
    expect(secondPrompt.japaneseSentence).toContain('____')
  })
})
