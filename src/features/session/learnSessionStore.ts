import { create } from 'zustand'
import { clearLearnSessionRecord, loadLearnSessionRecord, saveLearnSessionRecord } from '@/lib/storage'
import { createSessionRecord, sessionToResult, snapshotSession, type StartSessionPayload } from '@/features/session/sessionEngine'
import type { LearnResult, LearnSessionRecord, LearnSessionSnapshot } from '@/features/session/sessionTypes'
import { useFavoritesStore } from '@/features/favorites/favoritesStore'

type LearnSessionState = {
  status: 'idle' | 'active' | 'complete'
  record: LearnSessionRecord | null
  previousSnapshot: LearnSessionSnapshot | null
  lastResult: LearnResult | null
  hydrate: () => void
  startSession: (payload: StartSessionPayload) => void
  markKnown: () => void
  markUnknown: () => void
  undo: () => void
  abandonSession: () => void
  clearResult: () => void
}

function uniquePush(items: string[], value: string) {
  return items.includes(value) ? items : [...items, value]
}

function advanceRecord(record: LearnSessionRecord): LearnSessionRecord | null {
  if (record.currentIndex < record.activeQueue.length - 1) {
    const currentIndex = record.currentIndex + 1
    return {
      ...record,
      currentIndex,
      currentCardId: record.activeQueue[currentIndex] ?? null,
      updatedAt: new Date().toISOString(),
    }
  }

  if (record.retryQueue.length > 0) {
    return {
      ...record,
      round: record.round + 1,
      activeQueue: [...record.retryQueue],
      retryQueue: [],
      currentIndex: 0,
      currentCardId: record.retryQueue[0] ?? null,
      updatedAt: new Date().toISOString(),
    }
  }

  return null
}

export const useLearnSessionStore = create<LearnSessionState>((set, get) => ({
  status: 'idle',
  record: null,
  previousSnapshot: null,
  lastResult: null,
  hydrate: () => {
    const record = loadLearnSessionRecord()
    if (record) {
      set({ status: 'active', record })
    }
  },
  startSession: (payload) => {
    const record = createSessionRecord(payload)
    saveLearnSessionRecord(record)
    set({
      status: 'active',
      record,
      previousSnapshot: null,
      lastResult: null,
    })
  },
  markKnown: () => {
    const { record } = get()
    if (!record || !record.currentCardId) return

    const nextRecord: LearnSessionRecord = {
      ...record,
      knownIds: uniquePush(record.knownIds, record.currentCardId),
      visitedIds: uniquePush(record.visitedIds, record.currentCardId),
      updatedAt: new Date().toISOString(),
    }

    const advanced = advanceRecord(nextRecord)
    if (advanced) {
      saveLearnSessionRecord(advanced)
      set({
        status: 'active',
        record: advanced,
        previousSnapshot: snapshotSession(record),
      })
      return
    }

    clearLearnSessionRecord()
    set({
      status: 'complete',
      record: null,
      previousSnapshot: snapshotSession(record),
      lastResult: sessionToResult(nextRecord, useFavoritesStore.getState().favoriteIds.length),
    })
  },
  markUnknown: () => {
    const { record } = get()
    if (!record || !record.currentCardId) return

    const nextRecord: LearnSessionRecord = {
      ...record,
      retryQueue: uniquePush(record.retryQueue, record.currentCardId),
      unknownHistoryIds: uniquePush(record.unknownHistoryIds, record.currentCardId),
      visitedIds: uniquePush(record.visitedIds, record.currentCardId),
      updatedAt: new Date().toISOString(),
    }

    const advanced = advanceRecord(nextRecord)
    if (advanced) {
      saveLearnSessionRecord(advanced)
      set({
        status: 'active',
        record: advanced,
        previousSnapshot: snapshotSession(record),
      })
      return
    }

    clearLearnSessionRecord()
    set({
      status: 'complete',
      record: null,
      previousSnapshot: snapshotSession(record),
      lastResult: sessionToResult(nextRecord, useFavoritesStore.getState().favoriteIds.length),
    })
  },
  undo: () => {
    const { record, previousSnapshot } = get()
    if (!record || !previousSnapshot) return

    const restored: LearnSessionRecord = {
      ...record,
      ...previousSnapshot,
      updatedAt: new Date().toISOString(),
    }

    saveLearnSessionRecord(restored)
    set({
      status: 'active',
      record: restored,
      previousSnapshot: null,
    })
  },
  abandonSession: () => {
    const { record } = get()
    if (record) saveLearnSessionRecord(record)
    set({ status: record ? 'active' : 'idle' })
  },
  clearResult: () => set({ lastResult: null, status: 'idle', previousSnapshot: null }),
}))
