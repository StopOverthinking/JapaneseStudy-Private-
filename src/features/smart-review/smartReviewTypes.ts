import type { VocabularyWord } from '@/features/vocab/model/types'

export type SmartReviewStatus = 'new' | 'learning' | 'reviewing' | 'mastered'

export type SmartReviewProfile = {
  wordId: string
  status: SmartReviewStatus
  stage: number
  dueAt: string | null
  lastReviewedAt: string | null
  totalCorrectSessions: number
  totalWrongSessions: number
  consecutiveCorrectSessions: number
  lapseCount: number
  masteredAt: string | null
}

export type SmartReviewProfileMap = Record<string, SmartReviewProfile>

export type SmartReviewSessionItemState = {
  wordId: string
  attempts: number
  wrongCount: number
  answeredCorrectly: boolean
}

export type SmartReviewSessionItemStateMap = Record<string, SmartReviewSessionItemState>

export type StartSmartReviewPayload = {
  setId: string | 'all' | 'favorites'
  setName: string
  words: VocabularyWord[]
  wordCount: number
}

export type SmartReviewSessionRecord = {
  status: 'active'
  setId: string | 'all' | 'favorites'
  setName: string
  selectedWordIds: string[]
  activeQueue: string[]
  retryQueue: string[]
  currentIndex: number
  currentWordId: string | null
  round: number
  itemStates: SmartReviewSessionItemStateMap
  isAnswerRevealed: boolean
  revealedIsCorrect: boolean | null
  revealedAnswer: string
  startedAt: string
  updatedAt: string
}

export type SmartReviewSessionResult = {
  setId: string | 'all' | 'favorites'
  setName: string
  totalWords: number
  reviewCount: number
  wrongWordIds: string[]
  completedAt: string
}

export type SmartReviewSubmitOutcome = {
  kind: 'idle' | 'graded'
  wordId: string | null
  submittedAnswer: string
  expectedAnswer: string
  isCorrect: boolean
}

export type SmartReviewStudyPrompt = {
  japaneseSentence: string
  translationSentence: string
  note: string
}

export type SmartReviewSetupSummary = {
  dueCount: number
  newCount: number
  learningCount: number
  masteredCount: number
}
