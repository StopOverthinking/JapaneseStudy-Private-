import type { VocabularyWord } from '@/features/vocab/model/types'

export function matchesWordSearch(word: VocabularyWord, query: string) {
  const tokens = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)

  if (tokens.length === 0) return true

  const haystack = [word.japanese, word.reading, word.meaning].join(' ').toLowerCase()
  return tokens.every((token) => haystack.includes(token))
}
