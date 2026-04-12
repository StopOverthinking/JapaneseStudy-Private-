import { describe, expect, it } from 'vitest'
import {
  SMART_REVIEW_SCHEDULE_SCHEMA_VERSION,
  canShareSmartReviewByQr,
  mergeSmartReviewScheduleRecords,
  parseSmartReviewScheduleBackup,
} from '@/features/smart-review/smartReviewScheduleShare'

describe('smart review schedule share', () => {
  it('parses schedule backups and normalizes records', () => {
    const parsed = parseSmartReviewScheduleBackup(JSON.stringify({
      schemaVersion: SMART_REVIEW_SCHEDULE_SCHEMA_VERSION,
      exportedAt: '2026-04-12T09:00:00.000Z',
      recordCount: 2,
      data: [
        {
          wordId: 'word-1',
          dueAt: '2026-04-13T00:00:00.000Z',
          intervalDays: 3,
          updatedAt: '2026-04-12T08:00:00.000Z',
        },
        {
          wordId: 'word-2',
          dueAt: null,
          intervalDays: null,
          updatedAt: '2026-04-12T08:30:00.000Z',
        },
      ],
    }))

    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return

    expect(parsed.backup.recordCount).toBe(2)
    expect(parsed.backup.data[1]).toEqual({
      wordId: 'word-2',
      dueAt: null,
      intervalDays: null,
      updatedAt: '2026-04-12T08:30:00.000Z',
    })
  })

  it('merges by wordId using the latest updatedAt value', () => {
    const merged = mergeSmartReviewScheduleRecords(
      [
        {
          wordId: 'word-1',
          dueAt: '2026-04-13T00:00:00.000Z',
          intervalDays: 3,
          updatedAt: '2026-04-12T08:00:00.000Z',
        },
        {
          wordId: 'word-2',
          dueAt: '2026-04-14T00:00:00.000Z',
          intervalDays: 7,
          updatedAt: '2026-04-12T07:00:00.000Z',
        },
      ],
      [
        {
          wordId: 'word-2',
          dueAt: null,
          intervalDays: null,
          updatedAt: '2026-04-12T09:00:00.000Z',
        },
        {
          wordId: 'word-3',
          dueAt: '2026-04-15T00:00:00.000Z',
          intervalDays: 14,
          updatedAt: '2026-04-12T09:30:00.000Z',
        },
      ],
    )

    expect(merged).toEqual([
      {
        wordId: 'word-1',
        dueAt: '2026-04-13T00:00:00.000Z',
        intervalDays: 3,
        updatedAt: '2026-04-12T08:00:00.000Z',
      },
      {
        wordId: 'word-2',
        dueAt: null,
        intervalDays: null,
        updatedAt: '2026-04-12T09:00:00.000Z',
      },
      {
        wordId: 'word-3',
        dueAt: '2026-04-15T00:00:00.000Z',
        intervalDays: 14,
        updatedAt: '2026-04-12T09:30:00.000Z',
      },
    ])
  })

  it('allows QR only for small schedule backups', () => {
    expect(canShareSmartReviewByQr(200)).toBe(true)
    expect(canShareSmartReviewByQr(201)).toBe(false)
  })
})
