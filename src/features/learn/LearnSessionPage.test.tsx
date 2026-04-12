import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { LearnSessionPage } from '@/features/learn/LearnSessionPage'
import { useFavoritesStore } from '@/features/favorites/favoritesStore'
import { usePreferencesStore } from '@/features/preferences/preferencesStore'
import { createSessionRecord } from '@/features/session/sessionEngine'
import { useLearnSessionStore } from '@/features/session/learnSessionStore'
import { allWords } from '@/features/vocab/model/selectors'

const sessionWords = allWords.slice(0, 2)

function renderPage() {
  return render(
    <MemoryRouter>
      <LearnSessionPage />
    </MemoryRouter>,
  )
}

describe('LearnSessionPage', () => {
  beforeEach(() => {
    localStorage.clear()
    useFavoritesStore.setState({ favoriteIds: [] })
    usePreferencesStore.setState({ learnCardFontScale: 2 })
    useLearnSessionStore.setState({
      status: 'active',
      record: createSessionRecord({
        setId: 'all',
        setName: '테스트 세트',
        frontMode: 'japanese',
        words: sessionWords,
      }),
      previousSnapshot: null,
      snapshotHistory: [],
      lastResult: null,
    })
  })

  afterEach(() => {
    cleanup()
    localStorage.clear()
    useLearnSessionStore.setState({
      status: 'idle',
      record: null,
      previousSnapshot: null,
      snapshotHistory: [],
      lastResult: null,
    })
    useFavoritesStore.setState({ favoriteIds: [] })
    usePreferencesStore.setState({ learnCardFontScale: 2 })
  })

  it('allows toggling the answer by card click and the answer button', async () => {
    const user = userEvent.setup()
    renderPage()

    const flashCard = screen.getByRole('button', { name: '학습 카드' })
    const revealButton = screen.getByRole('button', { name: '정답 확인' })

    expect(flashCard).toHaveAttribute('data-flipped', 'false')
    expect(screen.queryByText(/왼쪽 화살표/)).not.toBeInTheDocument()

    await user.click(flashCard)
    expect(flashCard).toHaveAttribute('data-flipped', 'true')

    await user.click(revealButton)
    expect(flashCard).toHaveAttribute('data-flipped', 'false')

    await user.click(flashCard)
    expect(flashCard).toHaveAttribute('data-flipped', 'true')
  })

  it('renders zoom icon controls with level 2 active by default', () => {
    renderPage()

    expect(screen.getByRole('group', { name: '카드 글자 크기' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '글자 작게' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '글자 크게' })).toBeInTheDocument()
    expect(screen.getByText('2/4')).toBeInTheDocument()
  })

  it('marks the current card as known with ArrowLeft and advances after the exit animation', async () => {
    renderPage()

    expect(screen.getByText('카드 1/2')).toBeInTheDocument()

    fireEvent.keyDown(window, { key: 'ArrowLeft' })

    await waitFor(() => {
      expect(screen.getByText('카드 2/2')).toBeInTheDocument()
      expect(screen.getByText('1/2')).toBeInTheDocument()
    }, { timeout: 1000 })
  })
})
