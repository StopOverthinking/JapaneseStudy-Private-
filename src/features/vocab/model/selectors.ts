import { vocabularySets, vocabularyWords } from '@/features/vocab/data'
import type { VocabularySet, VocabularyWord } from '@/features/vocab/model/types'

export const allSets = vocabularySets
export const allWords = vocabularyWords

const setMap = new Map<string, VocabularySet>(allSets.map((set) => [set.id, set]))
const wordMap = new Map<string, VocabularyWord>(allWords.map((word) => [word.id, word]))

export function getSetById(setId: string) {
  return setMap.get(setId)
}

export function getWordById(wordId: string) {
  return wordMap.get(wordId)
}

export function getWordsForSet(setId: string | 'all' | 'favorites', favoriteIds: string[] = []) {
  if (setId === 'all') return allWords
  if (setId === 'favorites') {
    return allWords.filter((word) => favoriteIds.includes(word.id))
  }
  return allWords.filter((word) => word.setId === setId)
}

export function getSetName(setId: string | 'all' | 'favorites') {
  if (setId === 'all') return '전체 세트'
  if (setId === 'favorites') return '즐겨찾기 단어장'
  return getSetById(setId)?.name ?? '세트'
}
