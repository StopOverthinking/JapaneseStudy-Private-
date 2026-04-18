import { create } from 'zustand'
import { getDebugNow } from '@/features/debug/debugDateStore'
import {
  advanceSmartReviewSession,
  applySmartReviewOutcome,
  buildSmartReviewResult,
  createSmartReviewSession,
  gradeSmartReviewAnswer,
} from '@/features/smart-review/smartReviewEngine'
import { bulkPutSmartReviewScheduleRecords, initializeSmartReviewDb } from '@/features/smart-review/smartReviewDb'
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
  isHydrated: boolean
  profiles: SmartReviewProfileMap
  session: SmartReviewSessionRecord | null
  lastResult: SmartReviewSessionResult | null
  hydrate: () => Promise<void>
  startSession: (payload: StartSmartReviewPayload) => Promise<boolean>
  submitAnswer: (answer: string) => SmartReviewSubmitOutcome
  submitDebugAnswer: (isCorrect: boolean) => SmartReviewSubmitOutcome
  advanceToNext: () => Promise<void>
  abandonSession: () => void
  clearSession: () => void
  clearResult: () => void
}

let hydratePromise: Promise<void> | null = null

async function completeSession(session: SmartReviewSessionRecord, profiles: SmartReviewProfileMap) {
  const now = getDebugNow()
  const applied = applySmartReviewOutcome(profiles, session, now)
  const result = buildSmartReviewResult(session, applied.nextProfiles, now)

  await bulkPutSmartReviewScheduleRecords(Object.values(applied.nextProfiles))

  return {
    profiles: applied.nextProfiles,
    result,
  }
}

function createSubmittedSession(
  session: SmartReviewSessionRecord,
  wordId: string,
  answer: string,
  isCorrect: boolean,
): SmartReviewSessionRecord {
  const currentItemState = session.itemStates[wordId]
  const updatedAt = getDebugNow().toISOString()

  return {
    ...session,
    itemStates: {
      ...session.itemStates,
      [wordId]: {
        wordId,
        attempts: (currentItemState?.attempts ?? 0) + 1,
        wrongCount: (currentItemState?.wrongCount ?? 0) + (isCorrect ? 0 : 1),
        answeredCorrectly: isCorrect ? true : currentItemState?.answeredCorrectly ?? false,
      },
    },
    retryQueue:
      isCorrect || session.retryQueue.includes(wordId)
        ? session.retryQueue
        : [...session.retryQueue, wordId],
    isAnswerRevealed: true,
    revealedIsCorrect: isCorrect,
    revealedAnswer: answer,
    updatedAt,
  }
}

export const useSmartReviewStore = create<SmartReviewState>((set, get) => ({
  status: 'idle',
  isHydrated: false,
  profiles: {},
  session: null,
  lastResult: null,
  hydrate: async () => {
    if (!hydratePromise) {
      hydratePromise = (async () => {
        try {
          const profiles = await initializeSmartReviewDb()

          set((state) => ({
            ...state,
            isHydrated: true,
            profiles,
            status: state.session ? 'active' : state.lastResult ? 'complete' : 'idle',
          }))
        } catch (error) {
          console.error('Failed to hydrate smart review schedules.', error)
          set((state) => ({
            ...state,
            isHydrated: true,
            profiles: state.profiles,
          }))
        }
      })()
    }

    try {
      await hydratePromise
    } finally {
      hydratePromise = null
    }
  },
  startSession: async (payload) => {
    if (!get().isHydrated) {
      await get().hydrate()
    }

    const session = createSmartReviewSession(payload, get().profiles, getDebugNow())
    if (!session) return false

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
    const nextSession = createSubmittedSession(session, word.id, answer, isCorrect)

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
  submitDebugAnswer: (isCorrect) => {
    const { session } = get()
    if (!session || !session.currentWordId) {
      return {
        kind: 'idle',
        wordId: null,
        submittedAnswer: '',
        expectedAnswer: '',
        isCorrect: false,
      }
    }

    const word = getWordById(session.currentWordId)
    if (!word) {
      return {
        kind: 'idle',
        wordId: null,
        submittedAnswer: '',
        expectedAnswer: '',
        isCorrect: false,
      }
    }

    if (session.isAnswerRevealed) {
      return {
        kind: 'idle',
        wordId: word.id,
        submittedAnswer: '',
        expectedAnswer: word.japanese,
        isCorrect: false,
      }
    }

    const submittedAnswer = isCorrect ? word.japanese : '임의 오답'
    const nextSession = createSubmittedSession(session, word.id, submittedAnswer, isCorrect)

    set({
      status: 'active',
      session: nextSession,
    })

    return {
      kind: 'graded',
      wordId: word.id,
      submittedAnswer,
      expectedAnswer: word.japanese,
      isCorrect,
    }
  },
  advanceToNext: async () => {
    const { session, profiles } = get()
    if (!session || !session.isAnswerRevealed) return

    const advanced = advanceSmartReviewSession(session, getDebugNow())

    if (!advanced.done) {
      set({
        status: 'active',
        session: advanced.record,
      })
      return
    }

    const completed = await completeSession(session, profiles)
    set({
      status: 'complete',
      profiles: completed.profiles,
      session: null,
      lastResult: completed.result,
    })
  },
  abandonSession: () => {
    set((state) => ({
      status: state.session ? 'active' : state.lastResult ? 'complete' : 'idle',
    }))
  },
  clearSession: () => {
    set((state) => ({
      status: state.lastResult ? 'complete' : 'idle',
      session: null,
    }))
  },
  clearResult: () => {
    set((state) => ({
      status: state.session ? 'active' : 'idle',
      lastResult: null,
    }))
  },
}))
