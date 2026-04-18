import { create } from 'zustand'
import { buildExamResult, createExamSession } from '@/features/exam/examEngine'
import {
  clearExamResult,
  clearExamSessionRecord,
  loadExamResult,
  loadExamSessionRecord,
  loadExamWrongAnswerIds,
  saveExamResult,
  saveExamSessionRecord,
  saveExamWrongAnswerIds,
} from '@/features/exam/examStorage'
import type { ExamResult, ExamSessionRecord, StartExamPayload } from '@/features/exam/examTypes'
import { getWordById } from '@/features/vocab/model/selectors'

type SubmitAnswerOutcome = 'idle' | 'advanced' | 'revealed' | 'completed'

type ExamState = {
  status: 'idle' | 'active' | 'complete'
  session: ExamSessionRecord | null
  lastResult: ExamResult | null
  wrongAnswerIds: string[]
  hydrate: () => void
  startExam: (payload: StartExamPayload) => void
  submitAnswer: (answer: string) => SubmitAnswerOutcome
  revealManualAnswer: () => SubmitAnswerOutcome
  markManualGrade: (isCorrect: boolean) => SubmitAnswerOutcome
  clearSession: () => void
  clearResult: () => void
}

function completeExam(record: ExamSessionRecord) {
  const result = buildExamResult(record, getWordById)
  const wrongAnswerIds = result.wrongItems.map((item) => item.wordId)

  clearExamSessionRecord()
  saveExamResult(result)
  saveExamWrongAnswerIds(wrongAnswerIds)

  return { result, wrongAnswerIds }
}

export const useExamStore = create<ExamState>((set, get) => ({
  status: 'idle',
  session: null,
  lastResult: null,
  wrongAnswerIds: [],
  hydrate: () => {
    const session = loadExamSessionRecord()
    const lastResult = loadExamResult()
    const wrongAnswerIds = loadExamWrongAnswerIds()

    set({
      status: session ? 'active' : lastResult ? 'complete' : 'idle',
      session,
      lastResult,
      wrongAnswerIds,
    })
  },
  startExam: (payload) => {
    const session = createExamSession(payload)
    saveExamSessionRecord(session)
    clearExamResult()

    set({
      status: 'active',
      session,
      lastResult: null,
    })
  },
  submitAnswer: (answer) => {
    const session = get().session
    if (!session) return 'idle'
    if (session.gradingMode === 'manual') return 'idle'

    const nextRecord: ExamSessionRecord = {
      ...session,
      userAnswers: session.userAnswers.map((value, index) => index === session.currentIndex ? answer : value),
      updatedAt: new Date().toISOString(),
    }

    if (session.currentIndex < session.questionIds.length - 1) {
      const advancedRecord: ExamSessionRecord = {
        ...nextRecord,
        currentIndex: session.currentIndex + 1,
      }

      saveExamSessionRecord(advancedRecord)
      set({
        status: 'active',
        session: advancedRecord,
      })
      return 'advanced'
    }

    const { result, wrongAnswerIds } = completeExam(nextRecord)
    set({
      status: 'complete',
      session: null,
      lastResult: result,
      wrongAnswerIds,
    })
    return 'completed'
  },
  revealManualAnswer: () => {
    const session = get().session
    if (!session || session.gradingMode !== 'manual' || session.isAnswerRevealed) return 'idle'

    const revealedRecord: ExamSessionRecord = {
      ...session,
      isAnswerRevealed: true,
      updatedAt: new Date().toISOString(),
    }

    saveExamSessionRecord(revealedRecord)
    set({
      status: 'active',
      session: revealedRecord,
    })
    return 'revealed'
  },
  markManualGrade: (isCorrect) => {
    const session = get().session
    if (!session || session.gradingMode !== 'manual' || !session.isAnswerRevealed) return 'idle'

    const nextRecord: ExamSessionRecord = {
      ...session,
      manualGrades: session.manualGrades.map((value, index) => index === session.currentIndex ? isCorrect : value),
      updatedAt: new Date().toISOString(),
    }

    if (session.currentIndex < session.questionIds.length - 1) {
      const advancedRecord: ExamSessionRecord = {
        ...nextRecord,
        currentIndex: session.currentIndex + 1,
        isAnswerRevealed: false,
      }

      saveExamSessionRecord(advancedRecord)
      set({
        status: 'active',
        session: advancedRecord,
      })
      return 'advanced'
    }

    const { result, wrongAnswerIds } = completeExam(nextRecord)
    set({
      status: 'complete',
      session: null,
      lastResult: result,
      wrongAnswerIds,
    })
    return 'completed'
  },
  clearSession: () => {
    clearExamSessionRecord()
    set((state) => ({
      status: state.lastResult ? 'complete' : 'idle',
      session: null,
    }))
  },
  clearResult: () => {
    clearExamResult()
    set((state) => ({
      status: state.session ? 'active' : 'idle',
      lastResult: null,
    }))
  },
}))
