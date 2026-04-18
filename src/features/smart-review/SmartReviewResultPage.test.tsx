import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { useFavoritesStore } from '@/features/favorites/favoritesStore'
import { SmartReviewResultPage } from '@/features/smart-review/SmartReviewResultPage'
import { useSmartReviewStore } from '@/features/smart-review/smartReviewStore'
import { allWords } from '@/features/vocab/model/selectors'

const initialSmartReviewState = useSmartReviewStore.getState()
const initialFavoritesState = useFavoritesStore.getState()

describe('SmartReviewResultPage', () => {
  afterEach(() => {
    cleanup()
    localStorage.clear()
    useSmartReviewStore.setState(initialSmartReviewState)
    useFavoritesStore.setState(initialFavoritesState)
  })

  it('lists each reviewed word with the next review timing', () => {
    const [firstWord, secondWord] = allWords

    useSmartReviewStore.setState({
      ...initialSmartReviewState,
      lastResult: {
        setId: 'all',
        setName: '테스트 세트',
        totalWords: 2,
        reviewCount: 1,
        wrongWordIds: [secondWord!.id],
        reviewedItems: [
          {
            wordId: firstWord!.id,
            dueAt: '2026-04-25T00:00:00.000Z',
            nextReviewInDays: 7,
            wasWrong: false,
          },
          {
            wordId: secondWord!.id,
            dueAt: null,
            nextReviewInDays: null,
            wasWrong: true,
          },
        ],
        completedAt: '2026-04-18T00:00:00.000Z',
      },
    })

    render(
      <MemoryRouter>
        <SmartReviewResultPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('7일 뒤')).toBeInTheDocument()
    expect(screen.getByText('예정 없음')).toBeInTheDocument()
  })
})
