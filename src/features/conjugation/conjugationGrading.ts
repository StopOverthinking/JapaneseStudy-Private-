import type { ConjugationAttempt, ConjugationQuestion } from '@/features/conjugation/conjugationTypes'
import { normalizeConjugationText } from '@/features/conjugation/conjugationRules'

export function gradeConjugationAnswer(question: ConjugationQuestion, userAnswer: string): ConjugationAttempt {
  const normalizedUserAnswer = normalizeConjugationText(userAnswer)
  const normalizedAcceptedAnswers = question.acceptedAnswers.map((answer) => ({
    raw: answer,
    normalized: normalizeConjugationText(answer),
  }))
  const matched = normalizedAcceptedAnswers.find((candidate) => candidate.normalized === normalizedUserAnswer)

  return {
    userAnswer,
    normalizedUserAnswer,
    isCorrect: matched !== undefined,
    matchedAnswer: matched?.raw ?? null,
    acceptedAnswers: question.acceptedAnswers,
    canonicalAnswer: question.correctAnswer,
    explanation: question.explanation,
  }
}
