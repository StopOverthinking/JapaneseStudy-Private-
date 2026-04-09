export type WordType = 'verb' | 'noun' | 'i_adj' | 'na_adj' | 'adv' | 'expression' | 'other'

export interface VocabularySet {
  id: string
  name: string
  order: number
  wordIds: string[]
}

export interface VocabularyWord {
  id: string
  setId: string
  japanese: string
  reading: string
  meaning: string
  type: WordType
  difficulty: number | null
  verbInfo: string | null
  sourceOrder: number
}

export type FrontMode = 'japanese' | 'meaning'
