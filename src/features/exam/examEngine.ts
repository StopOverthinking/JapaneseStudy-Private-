import { shuffleArray } from '@/lib/random'
import type { VocabularyWord } from '@/features/vocab/model/types'
import type { ExamGradingMode, ExamManualGrade, ExamResult, ExamSessionRecord, StartExamPayload } from '@/features/exam/examTypes'

type ResolvedWord = Pick<VocabularyWord, 'japanese'>

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function normalizeExamGradingMode(mode: unknown): ExamGradingMode {
  return mode === 'manual' ? 'manual' : 'auto'
}

export function normalizeManualGrades(savedGrades: unknown, expectedLength: number): ExamManualGrade[] {
  const normalized = Array.isArray(savedGrades) ? savedGrades.slice(0, expectedLength) : []

  while (normalized.length < expectedLength) {
    normalized.push(null)
  }

  return normalized.map((value) => {
    if (value === true) return true
    if (value === false) return false
    return null
  })
}

export function createExamSession(payload: StartExamPayload, seed = Date.now()): ExamSessionRecord {
  const questionIds = shuffleArray(payload.words.map((word) => word.id), seed)
  const now = new Date().toISOString()

  return {
    status: 'active',
    setId: payload.setId,
    setName: payload.setName,
    gradingMode: normalizeExamGradingMode(payload.gradingMode),
    questionIds,
    userAnswers: new Array(questionIds.length).fill(''),
    manualGrades: new Array(questionIds.length).fill(null),
    currentIndex: 0,
    isAnswerRevealed: false,
    startedAt: now,
    updatedAt: now,
  }
}

export function normalizeExamSessionRecord(raw: unknown): ExamSessionRecord | null {
  if (!isObject(raw)) return null
  if (!Array.isArray(raw.questionIds) || raw.questionIds.length === 0) return null

  const questionIds = raw.questionIds.filter((value): value is string => typeof value === 'string')
  if (questionIds.length === 0) return null

  const userAnswers = Array.isArray(raw.userAnswers)
    ? raw.userAnswers.slice(0, questionIds.length).map((value) => (typeof value === 'string' ? value : ''))
    : []

  while (userAnswers.length < questionIds.length) {
    userAnswers.push('')
  }

  const manualGrades = normalizeManualGrades(raw.manualGrades, questionIds.length)
  const parsedIndex = typeof raw.currentIndex === 'number' ? raw.currentIndex : Number.parseInt(String(raw.currentIndex ?? 0), 10)
  const currentIndex = Number.isFinite(parsedIndex)
    ? Math.min(Math.max(Math.trunc(parsedIndex), 0), questionIds.length - 1)
    : 0

  return {
    status: 'active',
    setId: typeof raw.setId === 'string' ? raw.setId : 'wrong_answers',
    setName: typeof raw.setName === 'string' && raw.setName.trim().length > 0 ? raw.setName : '시험',
    gradingMode: normalizeExamGradingMode(raw.gradingMode),
    questionIds,
    userAnswers,
    manualGrades,
    currentIndex,
    isAnswerRevealed: Boolean(raw.isAnswerRevealed) && normalizeExamGradingMode(raw.gradingMode) === 'manual',
    startedAt: typeof raw.startedAt === 'string' ? raw.startedAt : new Date().toISOString(),
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : new Date().toISOString(),
  }
}

export function buildExamResult(
  record: ExamSessionRecord,
  resolveWord: (wordId: string) => ResolvedWord | undefined,
): ExamResult {
  const wrongItems = record.questionIds.flatMap((wordId, index) => {
    const word = resolveWord(wordId)
    const userAnswer = record.userAnswers[index] ?? ''
    const isCorrect = record.gradingMode === 'manual'
      ? record.manualGrades[index] === true
      : word !== undefined && userAnswer === word.japanese

    return isCorrect ? [] : [{ wordId, userAnswer }]
  })

  return {
    setId: record.setId,
    setName: record.setName,
    gradingMode: record.gradingMode,
    questionIds: [...record.questionIds],
    correctCount: Math.max(0, record.questionIds.length - wrongItems.length),
    totalQuestions: record.questionIds.length,
    wrongItems,
    completedAt: new Date().toISOString(),
  }
}
