import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { useExamStore } from '@/features/exam/examStore'
import { useFavoritesStore } from '@/features/favorites/favoritesStore'
import { VocabularySetMenu } from '@/features/list/VocabularySetMenu'
import { usePreferencesStore } from '@/features/preferences/preferencesStore'
import { allSets } from '@/features/vocab/model/selectors'

const defaultLearnDefaults = {
  frontMode: 'japanese' as const,
  favoritesOnly: false,
  wordCount: 10,
  rangeEnabled: false,
  rangeStart: 1,
  rangeEnd: 10,
}

describe('VocabularySetMenu', () => {
  beforeEach(() => {
    localStorage.clear()

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

  afterEach(() => {
    cleanup()
    localStorage.clear()
  })

  it('omits the all-vocabulary entry from the list menu', () => {
    render(
      <MemoryRouter>
        <VocabularySetMenu />
      </MemoryRouter>,
    )

    expect(screen.queryByText('전체 단어장')).toBeNull()
    expect(screen.getByText('즐겨찾기 단어장')).toBeInTheDocument()
    expect(screen.getByText(allSets[0].name)).toBeInTheDocument()
  })
})
