import type { VocabularyWord } from '@/features/vocab/model/types'

export type GameMode = 'single' | 'bot'
export type GameQuizType = 'objective' | 'pronunciation'
export type GameQuestionType = 'word_to_meaning' | 'meaning_to_word' | 'reading_quiz'
export type GameOutcome = 'win' | 'lose' | 'draw'

export type GameSetupPayload = {
  setId: string | 'all' | 'favorites'
  setName: string
  mode: GameMode
  quizType: GameQuizType
  playerName: string
  sourceWords: VocabularyWord[]
}

export type GameQuestion = {
  id: string
  word: VocabularyWord
  type: GameQuestionType
  correctAnswer: string
  options: string[]
}

export type BotHistoryEntry = {
  time: number
  accuracy: number
}

export type SingleModeRecord = {
  score: number
  time: number
  date: string
}

export type BotSettings = {
  name: string
  baseTime: number
  accuracy: number
  rating: number
}

export type TierDefinition = {
  name: string
  color: string
  min: number
}

export type TierInfo = TierDefinition & {
  division: number | ''
  lp: number
}

export type BotSessionState = {
  settings: BotSettings
  score: number
  currentIndex: number
  correctCount: number
  finished: boolean
  surrendered: boolean
}

export type GameSessionRecord = {
  status: 'active'
  setId: string | 'all' | 'favorites'
  setName: string
  mode: GameMode
  quizType: GameQuizType
  playerName: string
  totalQuestions: number
  questions: GameQuestion[]
  currentIndex: number
  score: number
  playerCorrectCount: number
  totalResponseTime: number
  totalMaxScore: number
  wrongWordIds: string[]
  playerFinished: boolean
  bot: BotSessionState | null
  startedAt: string
  updatedAt: string
}

export type AnswerResolution = {
  question: GameQuestion
  isCorrect: boolean
  points: number
  correctAnswer: string
  playerFinished: boolean
}

export type BotResolution = {
  question: GameQuestion
  isCorrect: boolean
  points: number
  botFinished: boolean
}

export type GameResult = {
  setId: string | 'all' | 'favorites'
  setName: string
  mode: GameMode
  quizType: GameQuizType
  playerName: string
  playerScore: number
  playerCorrectCount: number
  totalQuestions: number
  averageTime: number
  wrongWordIds: string[]
  completedAt: string
  singleRecords: SingleModeRecord[]
  bot: {
    name: string
    score: number
    correctCount: number
    rating: number
    outcome: GameOutcome
    surrendered: boolean
    previousMmr: number
    mmrChange: number
    newMmr: number
    tierInfo: TierInfo
  } | null
}
