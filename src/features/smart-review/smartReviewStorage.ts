import { normalizeSmartReviewProfileMap } from '@/features/smart-review/smartReviewEngine'
import type { SmartReviewProfileMap } from '@/features/smart-review/smartReviewTypes'

export const SMART_REVIEW_PROFILES_KEY = 'jsp-react:smart-review-profiles'
export const SMART_REVIEW_SESSION_KEY = 'jsp-react:smart-review-session'
export const SMART_REVIEW_RESULT_KEY = 'jsp-react:smart-review-result'
export const SMART_REVIEW_STORAGE_MARKER_KEY = 'jsp-react:smart-review-storage'
export const SMART_REVIEW_STORAGE_MARKER_VALUE = 'indexeddb-v1'

const LEGACY_SMART_REVIEW_KEYS = [
  SMART_REVIEW_PROFILES_KEY,
  SMART_REVIEW_SESSION_KEY,
  SMART_REVIEW_RESULT_KEY,
] as const

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function hasLegacyReviewHistory(value: unknown) {
  if (!isRecord(value)) return false

  if (typeof value.dueAt === 'string' && value.dueAt.length > 0) return true
  if (typeof value.lastReviewedAt === 'string' && value.lastReviewedAt.length > 0) return true
  if (typeof value.updatedAt === 'string' && value.updatedAt.length > 0) return true
  if (value.status === 'learning' || value.status === 'reviewing' || value.status === 'mastered') return true

  return typeof value.stage === 'number' && Number.isFinite(value.stage) && value.stage > 0
}

export function loadLegacySmartReviewProfiles(): SmartReviewProfileMap {
  const raw = localStorage.getItem(SMART_REVIEW_PROFILES_KEY)
  if (!raw) return {}

  try {
    const parsed = JSON.parse(raw)
    if (!isRecord(parsed)) return {}

    return normalizeSmartReviewProfileMap(
      Object.fromEntries(Object.entries(parsed).filter(([, value]) => hasLegacyReviewHistory(value))),
    )
  } catch {
    localStorage.removeItem(SMART_REVIEW_PROFILES_KEY)
    return {}
  }
}

export function hasSmartReviewStorageMigrationMarker() {
  return localStorage.getItem(SMART_REVIEW_STORAGE_MARKER_KEY) === SMART_REVIEW_STORAGE_MARKER_VALUE
}

export function markSmartReviewStorageMigrated() {
  localStorage.setItem(SMART_REVIEW_STORAGE_MARKER_KEY, SMART_REVIEW_STORAGE_MARKER_VALUE)
}

export function clearLegacySmartReviewStorage() {
  for (const key of LEGACY_SMART_REVIEW_KEYS) {
    localStorage.removeItem(key)
  }
}
