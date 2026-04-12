import { describe, expect, it } from 'vitest'
import { gradeConjugationAnswer } from '@/features/conjugation/conjugationGrading'
import {
  buildConjugationQuestion,
  createConjugationSessionRecord,
  getDistributedQuestionCount,
} from '@/features/conjugation/conjugationEngine'
import { conjugateWord } from '@/features/conjugation/conjugationRules'
import type { VocabularyWord } from '@/features/vocab/model/types'

function makeVerb(overrides: Partial<VocabularyWord>): VocabularyWord {
  return {
    id: 'verb',
    setId: 'set',
    japanese: '食べる',
    reading: 'たべる',
    meaning: '먹다',
    type: 'verb',
    difficulty: 10,
    verbInfo: '2',
    sourceOrder: 0,
    ...overrides,
  }
}

describe('conjugation rules', () => {
  it('conjugates ichidan verbs', () => {
    const verb = makeVerb({})
    const outcome = conjugateWord(verb, 'te')
    expect(outcome?.japanese).toBe('食べて')
    expect(outcome?.acceptedAnswers).toContain('たべて')
  })

  it('conjugates godan verbs with standard rules', () => {
    const verb = makeVerb({
      japanese: '書く',
      reading: 'かく',
      verbInfo: '1',
    })

    expect(conjugateWord(verb, 'te')?.japanese).toBe('書いて')
    expect(conjugateWord(verb, 'potential')?.japanese).toBe('書ける')
  })

  it('handles the 行く exception', () => {
    const verb = makeVerb({
      japanese: '行く',
      reading: 'いく',
      verbInfo: '1',
    })

    expect(conjugateWord(verb, 'te')?.japanese).toBe('行って')
    expect(conjugateWord(verb, 'ta')?.japanese).toBe('行った')
  })

  it('handles suru compounds', () => {
    const verb = makeVerb({
      japanese: '勉強する',
      reading: 'べんきょうする',
      verbInfo: '3',
    })

    expect(conjugateWord(verb, 'potential')?.japanese).toBe('勉強できる')
  })

  it('handles kuru irregular verbs', () => {
    const verb = makeVerb({
      japanese: '来る',
      reading: 'くる',
      verbInfo: '3',
    })

    expect(conjugateWord(verb, 'volitional')?.japanese).toBe('来よう')
    expect(conjugateWord(verb, 'imperative')?.acceptedAnswers).toContain('こい')
  })

  it('accepts kana answers for kanji questions', () => {
    const verb = makeVerb({
      japanese: '書く',
      reading: 'かく',
      verbInfo: '1',
    })

    const question = buildConjugationQuestion(verb, 'te', 'japanese')
    expect(question).not.toBeNull()

    const attempt = gradeConjugationAnswer(question!, 'かいて')
    expect(attempt.isCorrect).toBe(true)
  })

  it('accepts romaji answers for kana readings', () => {
    const verb = makeVerb({
      japanese: '書く',
      reading: 'かく',
      verbInfo: '1',
    })

    const question = buildConjugationQuestion(verb, 'te', 'japanese')
    expect(question).not.toBeNull()

    const attempt = gradeConjugationAnswer(question!, 'kaite')
    expect(attempt.isCorrect).toBe(true)
  })

  it('uses the exact requested count when enough questions are available', () => {
    const words = [
      makeVerb({ id: '1', japanese: '食べる', reading: 'たべる', verbInfo: '2' }),
      makeVerb({ id: '2', japanese: '書く', reading: 'かく', verbInfo: '1' }),
      makeVerb({ id: '3', japanese: '泳ぐ', reading: 'およぐ', verbInfo: '1' }),
      makeVerb({ id: '4', japanese: '話す', reading: 'はなす', verbInfo: '1' }),
    ]

    const session = createConjugationSessionRecord({
      setId: 'all',
      setName: 'test',
      promptMode: 'japanese',
      selectedForms: ['masu', 'te', 'nai'],
      questionCount: 10,
      words,
    })

    const counts = session.questions.reduce<Record<string, number>>((acc, question) => {
      acc[question.form] = (acc[question.form] ?? 0) + 1
      return acc
    }, {})

    const values = Object.values(counts)
    expect(session.questions).toHaveLength(10)
    expect(Math.max(...values) - Math.min(...values)).toBeLessThanOrEqual(1)
  })

  it('reports the maximum possible count when there are not enough questions', () => {
    const words = [
      makeVerb({ id: '1', japanese: '食べる', reading: 'たべる', verbInfo: '2' }),
      makeVerb({ id: '2', japanese: '書く', reading: 'かく', verbInfo: '1' }),
    ]

    expect(getDistributedQuestionCount(words, ['masu', 'te', 'ta'], 'japanese', 8)).toBe(6)
  })
})
