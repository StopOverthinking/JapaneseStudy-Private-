import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const DAY_MS = 24 * 60 * 60 * 1000

export const debugDateStorageKey = 'jsp-react:debug-date'

type DebugDateState = {
  dayOffset: number
  godMode: boolean
  setDayOffset: (next: number) => void
  shiftDayOffset: (delta: number) => void
  resetDayOffset: () => void
  setGodMode: (next: boolean) => void
  toggleGodMode: () => void
}

function clampDayOffset(value: number) {
  return Math.max(-3650, Math.min(3650, Math.trunc(value)))
}

function getCalendarDayStamp(date: Date) {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
}

function padDatePart(value: number) {
  return `${value}`.padStart(2, '0')
}

export function getDebugNow(dayOffset = useDebugDateStore.getState().dayOffset, baseNow = new Date()) {
  const next = new Date(baseNow)
  next.setDate(next.getDate() + dayOffset)
  return next
}

export function formatDebugDateInputValue(dayOffset = useDebugDateStore.getState().dayOffset, baseNow = new Date()) {
  const date = getDebugNow(dayOffset, baseNow)
  return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}`
}

export function formatDebugDateLabel(dayOffset = useDebugDateStore.getState().dayOffset, baseNow = new Date()) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(getDebugNow(dayOffset, baseNow))
}

export function formatDebugOffsetLabel(dayOffset = useDebugDateStore.getState().dayOffset) {
  if (dayOffset === 0) {
    return '실시간'
  }

  return dayOffset > 0 ? `+${dayOffset}일` : `${dayOffset}일`
}

export function getDayOffsetFromDateInput(value: string, baseNow = new Date()) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) {
    return 0
  }

  const year = Number.parseInt(match[1] ?? '', 10)
  const month = Number.parseInt(match[2] ?? '', 10)
  const day = Number.parseInt(match[3] ?? '', 10)
  const targetDate = new Date(year, month - 1, day)

  return clampDayOffset(Math.round((getCalendarDayStamp(targetDate) - getCalendarDayStamp(baseNow)) / DAY_MS))
}

export const useDebugDateStore = create<DebugDateState>()(
  persist(
    (set) => ({
      dayOffset: 0,
      godMode: false,
      setDayOffset: (next) => set({ dayOffset: clampDayOffset(next) }),
      shiftDayOffset: (delta) =>
        set((state) => ({
          dayOffset: clampDayOffset(state.dayOffset + delta),
        })),
      resetDayOffset: () => set({ dayOffset: 0 }),
      setGodMode: (next) => set({ godMode: next }),
      toggleGodMode: () =>
        set((state) => ({
          godMode: !state.godMode,
        })),
    }),
    {
      name: debugDateStorageKey,
    },
  ),
)
