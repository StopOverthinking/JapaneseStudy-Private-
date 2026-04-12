import {
  normalizeSmartReviewProfileMap,
  normalizeSmartReviewSessionRecord,
} from '@/features/smart-review/smartReviewEngine'
import type {
  SmartReviewProfileMap,
  SmartReviewSessionRecord,
  SmartReviewSessionResult,
} from '@/features/smart-review/smartReviewTypes'

const smartReviewProfilesKey = 'jsp-react:smart-review-profiles'
const smartReviewSessionKey = 'jsp-react:smart-review-session'
const smartReviewResultKey = 'jsp-react:smart-review-result'

export function loadSmartReviewProfiles(): SmartReviewProfileMap {
  const raw = localStorage.getItem(smartReviewProfilesKey)
  if (!raw) return {}

  try {
    return normalizeSmartReviewProfileMap(JSON.parse(raw))
  } catch {
    localStorage.removeItem(smartReviewProfilesKey)
    return {}
  }
}

export function saveSmartReviewProfiles(profileMap: SmartReviewProfileMap) {
  localStorage.setItem(smartReviewProfilesKey, JSON.stringify(profileMap))
}

export function loadSmartReviewSessionRecord(): SmartReviewSessionRecord | null {
  const raw = localStorage.getItem(smartReviewSessionKey)
  if (!raw) return null

  try {
    const normalized = normalizeSmartReviewSessionRecord(JSON.parse(raw))
    if (!normalized) {
      localStorage.removeItem(smartReviewSessionKey)
    }
    return normalized
  } catch {
    localStorage.removeItem(smartReviewSessionKey)
    return null
  }
}

export function saveSmartReviewSessionRecord(record: SmartReviewSessionRecord) {
  localStorage.setItem(smartReviewSessionKey, JSON.stringify(record))
}

export function clearSmartReviewSessionRecord() {
  localStorage.removeItem(smartReviewSessionKey)
}

export function loadSmartReviewResult(): SmartReviewSessionResult | null {
  const raw = localStorage.getItem(smartReviewResultKey)
  if (!raw) return null

  try {
    return JSON.parse(raw) as SmartReviewSessionResult
  } catch {
    localStorage.removeItem(smartReviewResultKey)
    return null
  }
}

export function saveSmartReviewResult(result: SmartReviewSessionResult) {
  localStorage.setItem(smartReviewResultKey, JSON.stringify(result))
}

export function clearSmartReviewResult() {
  localStorage.removeItem(smartReviewResultKey)
}
