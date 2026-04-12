import { create } from 'zustand'
import { clearLearnSessionRecord, loadLearnSessionRecord, saveLearnSessionRecord } from '@/lib/storage'
import { createSessionRecord, sessionToResult, snapshotSession, type StartSessionPayload } from '@/features/session/sessionEngine'
import type { LearnResult, LearnSessionRecord, LearnSessionSnapshot } from '@/features/session/sessionTypes'
import { useFavoritesStore } from '@/features/favorites/favoritesStore'

type LearnSessionState = {
  status: 'idle' | 'active' | 'complete'
  record: LearnSessionRecord | null
  previousSnapshot: LearnSessionSnapshot | null
  snapshotHistory: LearnSessionSnapshot[]
  lastResult: LearnResult | null
  hydrate: () => void
  startSession: (payload: StartSessionPayload) => void
  markKnown: () => void
  markUnknown: () => void
  undo: () => void
  abandonSession: () => void
  discardSession: () => void
  clearResult: () => void
}

function uniquePush(items: string[], value: string) {
  return items.includes(value) ? items : [...items, value]
}

function pushSnapshot(history: LearnSessionSnapshot[], snapshot: LearnSessionSnapshot) {
  return [...history, snapshot]
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
  snapshotHistory: [],
  lastResult: null,
  hydrate: () => {
    const record = loadLearnSessionRecord()
    if (record) {
      set({ status: 'active', record, previousSnapshot: null, snapshotHistory: [] })
    }
  },
  startSession: (payload) => {
    const record = createSessionRecord(payload)
    saveLearnSessionRecord(record)
    set({
      status: 'active',
      record,
      previousSnapshot: null,
      snapshotHistory: [],
      lastResult: null,
    })
  },
  markKnown: () => {
    const { record, snapshotHistory } = get()
    if (!record || !record.currentCardId) return
    const snapshot = snapshotSession(record)
    const nextHistory = pushSnapshot(snapshotHistory, snapshot)

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
        previousSnapshot: snapshot,
        snapshotHistory: nextHistory,
      })
      return
    }

    clearLearnSessionRecord()
    set({
      status: 'complete',
      record: null,
      previousSnapshot: null,
      snapshotHistory: [],
      lastResult: sessionToResult(nextRecord, useFavoritesStore.getState().favoriteIds.length),
    })
  },
  markUnknown: () => {
    const { record, snapshotHistory } = get()
    if (!record || !record.currentCardId) return
    const snapshot = snapshotSession(record)
    const nextHistory = pushSnapshot(snapshotHistory, snapshot)

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
        previousSnapshot: snapshot,
        snapshotHistory: nextHistory,
      })
      return
    }

    clearLearnSessionRecord()
    set({
      status: 'complete',
      record: null,
      previousSnapshot: null,
      snapshotHistory: [],
      lastResult: sessionToResult(nextRecord, useFavoritesStore.getState().favoriteIds.length),
    })
  },
  undo: () => {
    const { record, snapshotHistory } = get()
    if (!record || snapshotHistory.length === 0) return
    const restoredSnapshot = snapshotHistory[snapshotHistory.length - 1]
    const nextHistory = snapshotHistory.slice(0, -1)

    const restored: LearnSessionRecord = {
      ...record,
      ...restoredSnapshot,
      updatedAt: new Date().toISOString(),
    }

    saveLearnSessionRecord(restored)
    set({
      status: 'active',
      record: restored,
      previousSnapshot: nextHistory[nextHistory.length - 1] ?? null,
      snapshotHistory: nextHistory,
    })
  },
  abandonSession: () => {
    const { record } = get()
    if (record) saveLearnSessionRecord(record)
    set({ status: record ? 'active' : 'idle' })
  },
  discardSession: () => {
    clearLearnSessionRecord()
    set((state) => ({
      status: state.lastResult ? 'complete' : 'idle',
      record: null,
      previousSnapshot: null,
      snapshotHistory: [],
    }))
  },
  clearResult: () => set({ lastResult: null, status: 'idle', previousSnapshot: null, snapshotHistory: [] }),
}))
