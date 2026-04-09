import type { LearnSessionRecord } from '@/features/session/sessionTypes'

const sessionKey = 'jsp-react:learn-session'

export function loadLearnSessionRecord(): LearnSessionRecord | null {
  const raw = localStorage.getItem(sessionKey)
  if (!raw) return null

  try {
    return JSON.parse(raw) as LearnSessionRecord
  } catch {
    localStorage.removeItem(sessionKey)
    return null
  }
}

export function saveLearnSessionRecord(record: LearnSessionRecord) {
  localStorage.setItem(sessionKey, JSON.stringify(record))
}

export function clearLearnSessionRecord() {
  localStorage.removeItem(sessionKey)
}
