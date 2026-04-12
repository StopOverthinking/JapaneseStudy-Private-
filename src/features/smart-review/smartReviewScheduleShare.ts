import {
  getAllSmartReviewScheduleRecords,
  getSmartReviewProfileMap,
  replaceSmartReviewScheduleRecords,
  bulkPutSmartReviewScheduleRecords,
} from '@/features/smart-review/smartReviewDb'
import type { SmartReviewScheduleBackup, SmartReviewScheduleRecord } from '@/features/smart-review/smartReviewTypes'

export const SMART_REVIEW_SCHEDULE_SCHEMA_VERSION = 'jsp-smart-review-schedule-v1'
export const SMART_REVIEW_QR_MAX_RECORDS = 200

type SmartReviewScheduleImportMode = 'merge' | 'overwrite'

type SmartReviewScheduleBackupParseSuccess = {
  ok: true
  backup: SmartReviewScheduleBackup
}

type SmartReviewScheduleBackupParseFailure = {
  ok: false
  error: string
}

export type SmartReviewScheduleBackupParseResult =
  | SmartReviewScheduleBackupParseSuccess
  | SmartReviewScheduleBackupParseFailure

function getLocalDateStamp(date = new Date()) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function normalizeString(value: unknown) {
  return typeof value === 'string' && value.length > 0 ? value : null
}

function normalizeIntervalDays(value: unknown) {
  if (value === null) return null
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  return Math.max(0, Math.trunc(value))
}

export function normalizeSmartReviewScheduleRecord(raw: unknown): SmartReviewScheduleRecord | null {
  if (!isRecord(raw)) return null

  const wordId = normalizeString(raw.wordId)
  const updatedAt = normalizeString(raw.updatedAt)
  if (!wordId || !updatedAt) return null

  return {
    wordId,
    dueAt: normalizeString(raw.dueAt),
    intervalDays: normalizeIntervalDays(raw.intervalDays),
    updatedAt,
  }
}

export async function buildSmartReviewScheduleBackup(): Promise<SmartReviewScheduleBackup> {
  const data = await getAllSmartReviewScheduleRecords()

  return {
    schemaVersion: SMART_REVIEW_SCHEDULE_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    recordCount: data.length,
    data,
  }
}

export async function getSmartReviewScheduleBackupText() {
  return JSON.stringify(await buildSmartReviewScheduleBackup(), null, 2)
}

export function downloadSmartReviewScheduleBackup(text: string) {
  const blob = new Blob([text], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = `japanese-study-smart-review-${getLocalDateStamp()}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function parseSmartReviewScheduleBackup(text: string): SmartReviewScheduleBackupParseResult {
  let parsed: unknown

  try {
    parsed = JSON.parse(text)
  } catch (error) {
    return {
      ok: false,
      error: `스마트 복습 백업 JSON을 읽지 못했어요: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
    }
  }

  if (!isRecord(parsed)) {
    return {
      ok: false,
      error: '스마트 복습 백업은 JSON 객체여야 해요.',
    }
  }

  if (parsed.schemaVersion !== SMART_REVIEW_SCHEDULE_SCHEMA_VERSION) {
    return {
      ok: false,
      error: '지원하지 않는 스마트 복습 백업 형식이에요.',
    }
  }

  if (!Array.isArray(parsed.data)) {
    return {
      ok: false,
      error: '스마트 복습 백업 데이터가 비어 있어요.',
    }
  }

  const records = parsed.data
    .map((entry) => normalizeSmartReviewScheduleRecord(entry))
    .filter((entry): entry is SmartReviewScheduleRecord => entry !== null)

  return {
    ok: true,
    backup: {
      schemaVersion: SMART_REVIEW_SCHEDULE_SCHEMA_VERSION,
      exportedAt: normalizeString(parsed.exportedAt) ?? new Date().toISOString(),
      recordCount: records.length,
      data: records,
    },
  }
}

export function mergeSmartReviewScheduleRecords(
  currentRecords: SmartReviewScheduleRecord[],
  importedRecords: SmartReviewScheduleRecord[],
) {
  const merged = new Map(currentRecords.map((record) => [record.wordId, record]))

  for (const incoming of importedRecords) {
    const current = merged.get(incoming.wordId)
    if (!current || incoming.updatedAt > current.updatedAt) {
      merged.set(incoming.wordId, incoming)
    }
  }

  return [...merged.values()].sort((left, right) => left.wordId.localeCompare(right.wordId))
}

export async function importSmartReviewScheduleBackup(
  records: SmartReviewScheduleRecord[],
  mode: SmartReviewScheduleImportMode,
) {
  if (mode === 'overwrite') {
    await replaceSmartReviewScheduleRecords(records)
    return
  }

  const currentRecords = Object.values(await getSmartReviewProfileMap())
  const mergedRecords = mergeSmartReviewScheduleRecords(currentRecords, records)
  await bulkPutSmartReviewScheduleRecords(mergedRecords)
}

export function canShareSmartReviewByQr(recordCount: number) {
  return recordCount <= SMART_REVIEW_QR_MAX_RECORDS
}
