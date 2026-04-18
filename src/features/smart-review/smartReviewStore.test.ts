import { afterEach, describe, expect, it, vi } from 'vitest'
import { useDebugDateStore } from '@/features/debug/debugDateStore'
import { createEmptyProfile } from '@/features/smart-review/smartReviewEngine'
import { useSmartReviewStore } from '@/features/smart-review/smartReviewStore'
import { allWords } from '@/features/vocab/model/selectors'

const initialState = useSmartReviewStore.getState()
const initialDebugState = useDebugDateStore.getState()

describe('smartReviewStore debug clock', () => {
  afterEach(() => {
    localStorage.clear()
    useSmartReviewStore.setState(initialState)
    useDebugDateStore.setState(initialDebugState)
    vi.useRealTimers()
  })

  it('uses the debug date when deciding whether a scheduled word is due first', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-18T09:00:00.000Z'))

    const scheduledWord = allWords[0]!
    const newWord = allWords[1]!

    useSmartReviewStore.setState({
      ...initialState,
      status: 'idle',
      isHydrated: true,
      profiles: {
        [scheduledWord.id]: {
          ...createEmptyProfile(scheduledWord.id),
          dueAt: '2026-04-19T00:00:00.000Z',
          intervalDays: 1,
          updatedAt: '2026-04-18T00:00:00.000Z',
        },
      },
      session: null,
      lastResult: null,
    })

    const beforeShift = await useSmartReviewStore.getState().startSession({
      setId: scheduledWord.setId,
      setName: '테스트',
      words: [scheduledWord, newWord],
      wordCount: 1,
    })

    expect(beforeShift).toBe(true)
    expect(useSmartReviewStore.getState().session?.selectedWordIds).toEqual([newWord.id])

    useSmartReviewStore.setState({
      ...useSmartReviewStore.getState(),
      session: null,
      status: 'idle',
    })
    useDebugDateStore.getState().setDayOffset(2)

    const afterShift = await useSmartReviewStore.getState().startSession({
      setId: scheduledWord.setId,
      setName: '테스트',
      words: [scheduledWord, newWord],
      wordCount: 1,
    })

    expect(afterShift).toBe(true)
    expect(useSmartReviewStore.getState().session?.selectedWordIds).toEqual([scheduledWord.id])
  })
})
