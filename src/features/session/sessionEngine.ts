import type { FrontMode, VocabularyWord } from '@/features/vocab/model/types'
import type { LearnResult, LearnSessionRecord, LearnSessionSnapshot } from '@/features/session/sessionTypes'

export type StartSessionPayload = {
  setId: string | 'all' | 'wrong_answers'
  setName: string
  frontMode: FrontMode
  words: VocabularyWord[]
}

export function createSessionRecord(payload: StartSessionPayload): LearnSessionRecord {
  const ids = payload.words.map((word) => word.id)
  const now = new Date().toISOString()

  return {
    status: 'active',
    setId: payload.setId,
    setName: payload.setName,
    frontMode: payload.frontMode,
    totalTargetCount: ids.length,
    round: 1,
    activeQueue: ids,
    retryQueue: [],
    knownIds: [],
    unknownHistoryIds: [],
    visitedIds: [],
    currentIndex: 0,
    currentCardId: ids[0] ?? null,
    startedAt: now,
    updatedAt: now,
  }
}

export function snapshotSession(record: LearnSessionRecord): LearnSessionSnapshot {
  return {
    round: record.round,
    activeQueue: [...record.activeQueue],
    retryQueue: [...record.retryQueue],
    knownIds: [...record.knownIds],
    unknownHistoryIds: [...record.unknownHistoryIds],
    visitedIds: [...record.visitedIds],
    currentIndex: record.currentIndex,
    currentCardId: record.currentCardId,
  }
}

export function sessionToResult(record: LearnSessionRecord, favoriteCount: number): LearnResult {
  return {
    setId: record.setId,
    setName: record.setName,
    totalTargetCount: record.totalTargetCount,
    rounds: record.round,
    revisitedCount: record.unknownHistoryIds.length,
    favoriteCount,
    completedAt: new Date().toISOString(),
  }
}
