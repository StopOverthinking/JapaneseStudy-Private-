import { create } from 'zustand'
import {
  advanceSmartReviewSession,
  applySmartReviewOutcome,
  buildSmartReviewResult,
  createSmartReviewSession,
  gradeSmartReviewAnswer,
} from '@/features/smart-review/smartReviewEngine'
import {
  clearSmartReviewResult,
  clearSmartReviewSessionRecord,
  loadSmartReviewProfiles,
  loadSmartReviewResult,
  loadSmartReviewSessionRecord,
  saveSmartReviewProfiles,
  saveSmartReviewResult,
  saveSmartReviewSessionRecord,
} from '@/features/smart-review/smartReviewStorage'
import type {
  SmartReviewProfileMap,
  SmartReviewSessionRecord,
  SmartReviewSessionResult,
  SmartReviewSubmitOutcome,
  StartSmartReviewPayload,
} from '@/features/smart-review/smartReviewTypes'
import { getWordById } from '@/features/vocab/model/selectors'

type SmartReviewState = {
  status: 'idle' | 'active' | 'complete'
  profiles: SmartReviewProfileMap
  session: SmartReviewSessionRecord | null
  lastResult: SmartReviewSessionResult | null
  hydrate: () => void
  startSession: (payload: StartSmartReviewPayload) => boolean
  submitAnswer: (answer: string) => SmartReviewSubmitOutcome
  advanceToNext: () => void
  abandonSession: () => void
  clearSession: () => void
  clearResult: () => void
}

function completeSession(session: SmartReviewSessionRecord, profiles: SmartReviewProfileMap) {
  const applied = applySmartReviewOutcome(profiles, session)
  const result = buildSmartReviewResult(
    session,
    applied.promotedCount,
    applied.resetCount,
    applied.masteredCount,
  )

  saveSmartReviewProfiles(applied.nextProfiles)
  saveSmartReviewResult(result)
  clearSmartReviewSessionRecord()

  return {
    profiles: applied.nextProfiles,
    result,
  }
}

export const useSmartReviewStore = create<SmartReviewState>((set, get) => ({
  status: 'idle',
  profiles: {},
  session: null,
  lastResult: null,
  hydrate: () => {
    const profiles = loadSmartReviewProfiles()
    const session = loadSmartReviewSessionRecord()
    const lastResult = loadSmartReviewResult()

    set({
      status: session ? 'active' : lastResult ? 'complete' : 'idle',
      profiles,
      session,
      lastResult,
    })
  },
  startSession: (payload) => {
    const { profiles } = get()
    const session = createSmartReviewSession(payload, profiles)
    if (!session) return false

    saveSmartReviewSessionRecord(session)
    clearSmartReviewResult()

    set({
      status: 'active',
      session,
      lastResult: null,
    })

    return true
  },
  submitAnswer: (answer) => {
    const { session } = get()
    if (!session || !session.currentWordId) {
      return {
        kind: 'idle',
        wordId: null,
        submittedAnswer: answer,
        expectedAnswer: '',
        isCorrect: false,
      }
    }

    const word = getWordById(session.currentWordId)
    if (!word) {
      return {
        kind: 'idle',
        wordId: null,
        submittedAnswer: answer,
        expectedAnswer: '',
        isCorrect: false,
      }
    }
    if (session.isAnswerRevealed) {
      return {
        kind: 'idle',
        wordId: word.id,
        submittedAnswer: answer,
        expectedAnswer: word.japanese,
        isCorrect: false,
      }
    }

    const isCorrect = gradeSmartReviewAnswer(word.japanese, answer)
    const currentItemState = session.itemStates[word.id]

    const nextSession: SmartReviewSessionRecord = {
      ...session,
      itemStates: {
        ...session.itemStates,
        [word.id]: {
          wordId: word.id,
          attempts: (currentItemState?.attempts ?? 0) + 1,
          wrongCount: (currentItemState?.wrongCount ?? 0) + (isCorrect ? 0 : 1),
          answeredCorrectly: isCorrect ? true : currentItemState?.answeredCorrectly ?? false,
        },
      },
      retryQueue:
        isCorrect || session.retryQueue.includes(word.id)
          ? session.retryQueue
          : [...session.retryQueue, word.id],
      isAnswerRevealed: true,
      revealedIsCorrect: isCorrect,
      revealedAnswer: answer,
      updatedAt: new Date().toISOString(),
    }
    saveSmartReviewSessionRecord(nextSession)
    set({
      status: 'active',
      session: nextSession,
    })

    return {
      kind: 'graded',
      wordId: word.id,
      submittedAnswer: answer,
      expectedAnswer: word.japanese,
      isCorrect,
    }
  },
  advanceToNext: () => {
    const { session, profiles } = get()
    if (!session || !session.isAnswerRevealed) return

    const advanced = advanceSmartReviewSession(session)

    if (!advanced.done) {
      saveSmartReviewSessionRecord(advanced.record)
      set({
        status: 'active',
        session: advanced.record,
      })
      return
    }

    const completed = completeSession(session, profiles)
    set({
      status: 'complete',
      profiles: completed.profiles,
      session: null,
      lastResult: completed.result,
    })
  },
  abandonSession: () => {
    const { session } = get()
    if (session) {
      saveSmartReviewSessionRecord(session)
    }

    set((state) => ({
      status: state.session ? 'active' : state.lastResult ? 'complete' : 'idle',
    }))
  },
  clearSession: () => {
    clearSmartReviewSessionRecord()
    set((state) => ({
      status: state.lastResult ? 'complete' : 'idle',
      session: null,
    }))
  },
  clearResult: () => {
    clearSmartReviewResult()
    set((state) => ({
      status: state.session ? 'active' : 'idle',
      lastResult: null,
    }))
  },
}))
