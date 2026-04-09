import type { VocabularyWord } from '@/features/vocab/model/types'
import { getWordsForSet } from '@/features/vocab/model/selectors'
import { shuffleArray } from '@/lib/random'

export type WordSelectionOptions = {
  setId: string | 'all' | 'favorites'
  favoritesOnly: boolean
  favoriteIds: string[]
  rangeEnabled: boolean
  rangeStart: number
  rangeEnd: number
}

export function getFilteredWords({
  setId,
  favoritesOnly,
  favoriteIds,
  rangeEnabled,
  rangeStart,
  rangeEnd,
}: WordSelectionOptions) {
  let words: VocabularyWord[] = getWordsForSet(setId, favoriteIds)

  if (favoritesOnly) {
    words = words.filter((word) => favoriteIds.includes(word.id))
  }

  if (rangeEnabled) {
    const start = Math.max(1, rangeStart)
    const end = Math.max(start, rangeEnd)
    words = words.slice(start - 1, end)
  }

  return shuffleArray(words)
}

export function buildCandidateWords(words: VocabularyWord[], wordCount: number) {
  const normalizedWordCount = Math.max(1, Math.floor(wordCount) || 1)
  return words.slice(0, Math.min(normalizedWordCount, words.length))
}
