import type { FrontMode } from '@/features/vocab/model/types'

export type LearnResult = {
  setId: string | 'all'
  setName: string
  totalTargetCount: number
  rounds: number
  revisitedCount: number
  favoriteCount: number
  completedAt: string
}

export type LearnSessionSnapshot = {
  round: number
  activeQueue: string[]
  retryQueue: string[]
  knownIds: string[]
  unknownHistoryIds: string[]
  visitedIds: string[]
  currentIndex: number
  currentCardId: string | null
}

export type LearnSessionRecord = {
  status: 'active'
  setId: string | 'all'
  setName: string
  frontMode: FrontMode
  totalTargetCount: number
  round: number
  activeQueue: string[]
  retryQueue: string[]
  knownIds: string[]
  unknownHistoryIds: string[]
  visitedIds: string[]
  currentIndex: number
  currentCardId: string | null
  startedAt: string
  updatedAt: string
}
