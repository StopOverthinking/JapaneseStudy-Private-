import type { ReactNode } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { useDebugDateStore } from '@/features/debug/debugDateStore'
import { createSmartReviewSession } from '@/features/smart-review/smartReviewEngine'
import { SmartReviewSessionPage } from '@/features/smart-review/SmartReviewSessionPage'
import { useSmartReviewStore } from '@/features/smart-review/smartReviewStore'
import { allWords } from '@/features/vocab/model/selectors'

vi.mock('@/features/handwriting/HandwritingPad', () => ({
  HandwritingPad: ({ extraActions }: { extraActions?: ReactNode }) => <div>{extraActions}</div>,
}))

const initialSmartReviewState = useSmartReviewStore.getState()
const initialDebugState = useDebugDateStore.getState()

describe('SmartReviewSessionPage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    cleanup()
    localStorage.clear()
    vi.restoreAllMocks()
    useSmartReviewStore.setState(initialSmartReviewState)
    useDebugDateStore.setState(initialDebugState)
  })

  it('shows god mode judge buttons and lets the user force a correct answer', () => {
    const word = allWords[0]!
    const session = createSmartReviewSession(
      {
        setId: word.setId,
        setName: '테스트 세트',
        words: [word],
        wordCount: 1,
      },
      {},
      new Date('2026-04-18T00:00:00.000Z'),
    )

    if (!session) {
      throw new Error('Expected smart review session')
    }

    useDebugDateStore.setState({
      ...initialDebugState,
      godMode: true,
    })

    useSmartReviewStore.setState({
      ...initialSmartReviewState,
      status: 'active',
      isHydrated: true,
      profiles: {},
      session,
      lastResult: null,
    })

    render(
      <MemoryRouter>
        <SmartReviewSessionPage />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: '정답' }))

    expect(useSmartReviewStore.getState().session?.revealedIsCorrect).toBe(true)
    expect(useSmartReviewStore.getState().session?.revealedAnswer).toBe(word.japanese)
    expect(screen.getAllByText(word.japanese).length).toBeGreaterThan(0)
  })

  it('shows whether the current word is new or previously studied', () => {
    const [firstWord, secondWord] = allWords
    const session = createSmartReviewSession(
      {
        setId: 'all',
        setName: '테스트 세트',
        words: [firstWord!, secondWord!],
        wordCount: 2,
      },
      {
        [firstWord!.id]: {
          wordId: firstWord!.id,
          dueAt: '2026-04-18T00:00:00.000Z',
          intervalDays: 1,
          updatedAt: '2026-04-15T00:00:00.000Z',
        },
      },
      new Date('2026-04-18T00:00:00.000Z'),
    )

    if (!session) {
      throw new Error('Expected smart review session')
    }

    useSmartReviewStore.setState({
      ...initialSmartReviewState,
      status: 'active',
      isHydrated: true,
      profiles: {
        [firstWord!.id]: {
          wordId: firstWord!.id,
          dueAt: '2026-04-18T00:00:00.000Z',
          intervalDays: 1,
          updatedAt: '2026-04-15T00:00:00.000Z',
        },
      },
      session: {
        ...session,
        currentWordId: firstWord!.id,
        activeQueue: [firstWord!.id, secondWord!.id],
        selectedWordIds: [firstWord!.id, secondWord!.id],
      },
      lastResult: null,
    })

    render(
      <MemoryRouter>
        <SmartReviewSessionPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('2일 전 학습')).toBeInTheDocument()
  })
})
