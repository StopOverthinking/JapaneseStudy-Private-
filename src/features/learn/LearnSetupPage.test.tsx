import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { LearnSetupPage } from '@/features/learn/LearnSetupPage'
import styles from '@/features/learn/learn.module.css'
import { useFavoritesStore } from '@/features/favorites/favoritesStore'
import { usePreferencesStore } from '@/features/preferences/preferencesStore'
import { useLearnSessionStore } from '@/features/session/learnSessionStore'

const initialPreferencesState = usePreferencesStore.getState()
const initialFavoritesState = useFavoritesStore.getState()
const initialLearnSessionState = useLearnSessionStore.getState()

describe('LearnSetupPage', () => {
  beforeEach(() => {
    localStorage.clear()
    usePreferencesStore.setState({
      ...initialPreferencesState,
      lastSelectedSetId: 'all',
      learnDefaults: {
        frontMode: 'japanese',
        favoritesOnly: false,
        wordCount: 20,
        rangeEnabled: false,
        rangeStart: 1,
        rangeEnd: 10,
      },
    })
    useFavoritesStore.setState({
      ...initialFavoritesState,
      favoriteIds: [],
    })
    useLearnSessionStore.setState({
      ...initialLearnSessionState,
      status: 'idle',
      record: null,
      lastResult: null,
    })
  })

  afterEach(() => {
    cleanup()
    localStorage.clear()
    usePreferencesStore.setState(initialPreferencesState)
    useFavoritesStore.setState(initialFavoritesState)
    useLearnSessionStore.setState(initialLearnSessionState)
  })

  it('keeps the start action inline and balances word-count controls into mirrored columns', () => {
    const { container } = render(
      <MemoryRouter>
        <LearnSetupPage />
      </MemoryRouter>,
    )

    expect(container.querySelector('.page-header')).toHaveClass('page-header--inline-action')

    const columns = container.querySelectorAll(`.${styles.countStepColumn}`)
    expect(columns).toHaveLength(2)
    expect(within(columns[0] as HTMLElement).getByRole('button', { name: '-10' })).toBeInTheDocument()
    expect(within(columns[0] as HTMLElement).getByRole('button', { name: '-5' })).toBeInTheDocument()
    expect(within(columns[1] as HTMLElement).getByRole('button', { name: '+5' })).toBeInTheDocument()
    expect(within(columns[1] as HTMLElement).getByRole('button', { name: '+10' })).toBeInTheDocument()
    expect(screen.getByRole('spinbutton', { name: '학습 단어 수' })).toBeInTheDocument()
  })
})
