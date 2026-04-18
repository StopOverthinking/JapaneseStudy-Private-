import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { useExamStore } from '@/features/exam/examStore'
import { useFavoritesStore } from '@/features/favorites/favoritesStore'
import { ListPage } from '@/features/list/ListPage'
import styles from '@/features/list/list.module.css'
import { usePreferencesStore } from '@/features/preferences/preferencesStore'
import { allSets, allWords } from '@/features/vocab/model/selectors'

const sampleWords = allWords.slice(0, 2)
const defaultLearnDefaults = {
  frontMode: 'japanese' as const,
  favoritesOnly: false,
  wordCount: 10,
  rangeEnabled: false,
  rangeStart: 1,
  rangeEnd: 10,
}

function renderPage() {
  return render(
    <MemoryRouter>
      <ListPage />
    </MemoryRouter>,
  )
}

function setScrollY(value: number) {
  Object.defineProperty(window, 'scrollY', {
    configurable: true,
    writable: true,
    value,
  })
}

describe('ListPage', () => {
  beforeEach(() => {
    localStorage.clear()
    setScrollY(0)

    useExamStore.setState({
      status: 'idle',
      session: null,
      lastResult: null,
      wrongAnswerIds: sampleWords.map((word) => word.id),
    })

    useFavoritesStore.setState({
      favoriteIds: [],
    })

    usePreferencesStore.setState({
      themeMode: 'dark',
      hideJapaneseInList: true,
      hideMeaningInList: true,
      listFontScale: 3,
      learnCardFontScale: 2,
      lastSelectedSetId: 'wrong_answers',
      learnDefaults: defaultLearnDefaults,
    })
  })

  afterEach(() => {
    cleanup()
    localStorage.clear()
    setScrollY(0)

    useExamStore.setState({
      status: 'idle',
      session: null,
      lastResult: null,
      wrongAnswerIds: [],
    })

    useFavoritesStore.setState({
      favoriteIds: [],
    })

    usePreferencesStore.setState({
      themeMode: 'dark',
      hideJapaneseInList: false,
      hideMeaningInList: false,
      listFontScale: 3,
      learnCardFontScale: 2,
      lastSelectedSetId: 'all',
      learnDefaults: defaultLearnDefaults,
    })
  })

  it('reveals hidden japanese text and meaning when the card surface is tapped', async () => {
    const user = userEvent.setup()
    const { container } = renderPage()

    const cardSurface = container.querySelector('[data-revealable="true"]')

    expect(cardSurface).not.toBeNull()
    expect(cardSurface).not.toHaveAttribute('data-reveal-japanese')
    expect(cardSurface).not.toHaveAttribute('data-reveal-meaning')

    await user.click(cardSurface as HTMLElement)

    expect(cardSurface).toHaveAttribute('data-reveal-japanese', 'true')
    expect(cardSurface).toHaveAttribute('data-reveal-meaning', 'true')
  })

  it('replaces the legacy all-set selection with the first vocabulary set', async () => {
    const firstSet = allSets[0]

    usePreferencesStore.setState({
      themeMode: 'dark',
      hideJapaneseInList: false,
      hideMeaningInList: false,
      listFontScale: 3,
      learnCardFontScale: 2,
      lastSelectedSetId: 'all',
      learnDefaults: defaultLearnDefaults,
    })

    renderPage()

    expect(screen.getByText(firstSet.name)).toBeInTheDocument()
    await waitFor(() => {
      expect(usePreferencesStore.getState().lastSelectedSetId).toBe(firstSet.id)
    })
  })

  it('keeps the toolbar visible immediately after changing font size', async () => {
    const { container } = renderPage()
    const toolbarDock = container.querySelector(`.${styles.toolbarDock}`)

    expect(toolbarDock).not.toBeNull()

    setScrollY(100)
    fireEvent.click(screen.getByRole('button', { name: '글자 크게' }))

    expect(toolbarDock).toHaveClass(styles.toolbarVisible)

    setScrollY(148)
    fireEvent.scroll(window)

    expect(toolbarDock).toHaveClass(styles.toolbarVisible)
    expect(toolbarDock).not.toHaveClass(styles.toolbarHidden)
  })
})
