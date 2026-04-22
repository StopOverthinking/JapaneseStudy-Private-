import type { StudyItem, VocabularyWord } from '@/features/vocab/model/types'

export type ExamGradingMode = 'auto' | 'manual'
export type ExamSetId = string | 'wrong_answers'
export type ExamManualGrade = boolean | null
export const EXAM_MANUAL_UNDO_LIMIT = 20

export type ExamManualUndoSnapshot = {
  currentIndex: number
  manualGrades: ExamManualGrade[]
  isAnswerRevealed: boolean
}

export type StartExamPayload = {
  setId: ExamSetId
  setName: string
  items?: StudyItem[]
  words?: VocabularyWord[]
  gradingMode: ExamGradingMode
}

export type ExamSessionRecord = {
  status: 'active'
  setId: ExamSetId
  setName: string
  gradingMode: ExamGradingMode
  questionIds: string[]
  userAnswers: string[]
  manualGrades: ExamManualGrade[]
  manualUndoHistory: ExamManualUndoSnapshot[]
  manualUndoUsedCount: number
  currentIndex: number
  isAnswerRevealed: boolean
  startedAt: string
  updatedAt: string
}

export type ExamWrongItem = {
  itemId: string
  userAnswer?: string
}

export type ExamResult = {
  setId: ExamSetId
  setName: string
  gradingMode: ExamGradingMode
  questionIds: string[]
  correctCount: number
  totalQuestions: number
  wrongItems: ExamWrongItem[]
  completedAt: string
}
