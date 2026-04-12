import { beforeEach, describe, expect, it } from 'vitest'
import { useExamStore } from '@/features/exam/examStore'
import { loadExamWrongAnswerIds } from '@/features/exam/examStorage'
import { allWords } from '@/features/vocab/model/selectors'

const firstWord = allWords[0]
const secondWord = allWords[1]

describe('examStore wrong answer persistence', () => {
  beforeEach(() => {
    localStorage.clear()
    useExamStore.setState({
      status: 'idle',
      session: null,
      lastResult: null,
      wrongAnswerIds: [],
    })
  })

  it('overwrites the last exam wrong-answer set instead of merging it', () => {
    const store = useExamStore.getState()

    store.startExam({
      setId: 'set-a',
      setName: '첫 시험',
      words: [firstWord],
      gradingMode: 'manual',
    })
    expect(useExamStore.getState().submitAnswer('오답')).toBe('revealed')
    expect(useExamStore.getState().markManualGrade(false)).toBe('completed')
    expect(useExamStore.getState().wrongAnswerIds).toEqual([firstWord.id])

    useExamStore.getState().startExam({
      setId: 'set-b',
      setName: '둘째 시험',
      words: [secondWord],
      gradingMode: 'manual',
    })
    expect(useExamStore.getState().submitAnswer('또 오답')).toBe('revealed')
    expect(useExamStore.getState().markManualGrade(false)).toBe('completed')

    expect(useExamStore.getState().wrongAnswerIds).toEqual([secondWord.id])
    expect(loadExamWrongAnswerIds()).toEqual([secondWord.id])
  })
})
