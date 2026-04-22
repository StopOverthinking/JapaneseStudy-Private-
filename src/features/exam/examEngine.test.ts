import { describe, expect, it } from 'vitest'
import { buildExamResult, createExamSession, normalizeExamSessionRecord } from '@/features/exam/examEngine'

describe('examEngine', () => {
  it('creates a shuffled exam session with empty answers and grades', () => {
    const session = createExamSession({
      setId: 'set-a',
      setName: '테스트 세트',
      gradingMode: 'auto',
      words: [
        { id: 'w1' },
        { id: 'w2' },
        { id: 'w3' },
      ] as never,
    }, 1234)

    expect(session.questionIds).toHaveLength(3)
    expect(session.userAnswers).toEqual(['', '', ''])
    expect(session.manualGrades).toEqual([null, null, null])
    expect(session.manualUndoHistory).toEqual([])
    expect(session.manualUndoUsedCount).toBe(0)
    expect(session.currentIndex).toBe(0)
    expect(session.isAnswerRevealed).toBe(false)
  })

  it('normalizes malformed stored sessions', () => {
    const session = normalizeExamSessionRecord({
      setId: 'set-a',
      setName: '테스트',
      gradingMode: 'manual',
      questionIds: ['w1', 'w2'],
      userAnswers: ['答え'],
      manualGrades: [true, 'bad'],
      manualUndoHistory: [
        {
          currentIndex: 0,
          manualGrades: [null, false],
          isAnswerRevealed: true,
        },
      ],
      manualUndoUsedCount: 99,
      currentIndex: 99,
      isAnswerRevealed: true,
    })

    expect(session).not.toBeNull()
    expect(session?.userAnswers).toEqual(['答え', ''])
    expect(session?.manualGrades).toEqual([true, null])
    expect(session?.manualUndoHistory).toEqual([
      {
        currentIndex: 0,
        manualGrades: [null, false],
        isAnswerRevealed: true,
      },
    ])
    expect(session?.manualUndoUsedCount).toBe(20)
    expect(session?.currentIndex).toBe(1)
    expect(session?.isAnswerRevealed).toBe(true)
  })

  it('builds wrong answer details for auto and manual grading', () => {
    const autoResult = buildExamResult({
      status: 'active',
      setId: 'set-a',
      setName: '자동',
      gradingMode: 'auto',
      questionIds: ['w1', 'w2'],
      userAnswers: ['猫', ''],
      manualGrades: [null, null],
      manualUndoHistory: [],
      manualUndoUsedCount: 0,
      currentIndex: 1,
      isAnswerRevealed: false,
      startedAt: '',
      updatedAt: '',
    }, (wordId) => ({
      w1: { id: 'w1', kind: 'word' as const, expectedAnswer: '猫' },
      w2: { id: 'w2', kind: 'word' as const, expectedAnswer: '犬' },
    }[wordId]))

    const manualResult = buildExamResult({
      status: 'active',
      setId: 'set-b',
      setName: '수동',
      gradingMode: 'manual',
      questionIds: ['w1', 'w2'],
      userAnswers: ['', ''],
      manualGrades: [true, false],
      manualUndoHistory: [],
      manualUndoUsedCount: 0,
      currentIndex: 1,
      isAnswerRevealed: false,
      startedAt: '',
      updatedAt: '',
    }, () => ({ id: 'unused', kind: 'word' as const, expectedAnswer: 'unused' }))

    expect(autoResult.correctCount).toBe(1)
    expect(autoResult.wrongItems).toEqual([{ itemId: 'w2', userAnswer: '' }])
    expect(manualResult.correctCount).toBe(1)
    expect(manualResult.wrongItems).toEqual([{ itemId: 'w2' }])
  })
})
