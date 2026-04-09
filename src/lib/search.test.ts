import { describe, expect, it } from 'vitest'
import { matchesWordSearch } from '@/lib/search'
import type { VocabularyWord } from '@/features/vocab/model/types'

const sampleWord: VocabularyWord = {
  id: 'sample',
  setId: 'set',
  japanese: '食べる',
  reading: 'たべる',
  meaning: '먹다',
  type: 'verb',
  difficulty: 12,
  verbInfo: '2-group',
  sourceOrder: 0,
}

describe('matchesWordSearch', () => {
  it('matches japanese, reading, and meaning tokens', () => {
    expect(matchesWordSearch(sampleWord, '食べ')).toBe(true)
    expect(matchesWordSearch(sampleWord, 'たべ')).toBe(true)
    expect(matchesWordSearch(sampleWord, '먹다')).toBe(true)
  })

  it('requires all tokens to match', () => {
    expect(matchesWordSearch(sampleWord, '먹다 食')).toBe(true)
    expect(matchesWordSearch(sampleWord, '먹다 마시다')).toBe(false)
  })
})
