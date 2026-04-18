import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  debugDateStorageKey,
  formatDebugDateInputValue,
  formatDebugOffsetLabel,
  getDayOffsetFromDateInput,
  getDebugNow,
  useDebugDateStore,
} from '@/features/debug/debugDateStore'

const initialState = useDebugDateStore.getState()

describe('debugDateStore', () => {
  afterEach(() => {
    localStorage.clear()
    useDebugDateStore.setState(initialState)
    vi.useRealTimers()
  })

  it('shifts the smart review clock by the stored day offset', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-18T09:30:00.000Z'))

    useDebugDateStore.setState({ dayOffset: 3 })

    expect(getDebugNow().toISOString()).toBe('2026-04-21T09:30:00.000Z')
    expect(formatDebugDateInputValue()).toBe('2026-04-21')
    expect(formatDebugOffsetLabel()).toBe('+3일')
  })

  it('converts a picked date into a day offset from today', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-18T02:00:00.000Z'))

    expect(getDayOffsetFromDateInput('2026-04-11')).toBe(-7)
    expect(getDayOffsetFromDateInput('2026-04-25')).toBe(7)
  })

  it('persists under the debug storage key', () => {
    useDebugDateStore.getState().setDayOffset(5)
    useDebugDateStore.getState().setGodMode(true)

    expect(localStorage.getItem(debugDateStorageKey)).toContain('"dayOffset":5')
    expect(localStorage.getItem(debugDateStorageKey)).toContain('"godMode":true')
  })
})
