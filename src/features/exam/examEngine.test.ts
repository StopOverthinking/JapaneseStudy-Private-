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
      currentIndex: 99,
      isAnswerRevealed: true,
    })

    expect(session).not.toBeNull()
    expect(session?.userAnswers).toEqual(['答え', ''])
    expect(session?.manualGrades).toEqual([true, null])
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
      currentIndex: 1,
      isAnswerRevealed: false,
      startedAt: '',
      updatedAt: '',
    }, (wordId) => ({
      w1: { japanese: '猫' },
      w2: { japanese: '犬' },
    }[wordId]))

    const manualResult = buildExamResult({
      status: 'active',
      setId: 'set-b',
      setName: '수동',
      gradingMode: 'manual',
      questionIds: ['w1', 'w2'],
      userAnswers: ['猫', '犬'],
      manualGrades: [true, false],
      currentIndex: 1,
      isAnswerRevealed: false,
      startedAt: '',
      updatedAt: '',
    }, () => ({ japanese: 'unused' }))

    expect(autoResult.correctCount).toBe(1)
    expect(autoResult.wrongItems).toEqual([{ wordId: 'w2', userAnswer: '' }])
    expect(manualResult.correctCount).toBe(1)
    expect(manualResult.wrongItems).toEqual([{ wordId: 'w2', userAnswer: '犬' }])
  })
})
