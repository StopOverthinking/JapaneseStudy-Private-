import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { useExamStore } from '@/features/exam/examStore'
import { useFavoritesStore } from '@/features/favorites/favoritesStore'
import { ListPage } from '@/features/list/ListPage'
import styles from '@/features/list/list.module.css'
import { usePreferencesStore } from '@/features/preferences/preferencesStore'
import { allWords } from '@/features/vocab/model/selectors'

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
    renderPage()

    const firstWord = sampleWords[0]
    const japanese = screen.getAllByText(firstWord.japanese)[0]
    const meaning = screen.getAllByText(firstWord.meaning)[0]
    const cardSurface = japanese.closest('[data-revealable="true"]')

    expect(cardSurface).not.toBeNull()
    expect(japanese).toHaveClass(styles.concealed)
    expect(meaning).toHaveClass(styles.concealed)

    await user.click(cardSurface as HTMLElement)

    expect(japanese).not.toHaveClass(styles.concealed)
    expect(meaning).not.toHaveClass(styles.concealed)
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
