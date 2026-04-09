import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { FrontMode } from '@/features/vocab/model/types'

export type LearnDefaults = {
  frontMode: FrontMode
  favoritesOnly: boolean
  wordCount: number
  rangeEnabled: boolean
  rangeStart: number
  rangeEnd: number
}

type PreferencesState = {
  hideJapaneseInList: boolean
  hideMeaningInList: boolean
  listFontScale: number
  learnCardFontScale: number
  lastSelectedSetId: string | 'all'
  learnDefaults: LearnDefaults
  setHideJapaneseInList: (next: boolean) => void
  setHideMeaningInList: (next: boolean) => void
  setListFontScale: (next: number) => void
  setLearnCardFontScale: (next: number) => void
  setLastSelectedSetId: (next: string | 'all') => void
  updateLearnDefaults: (partial: Partial<LearnDefaults>) => void
}

const defaultLearnDefaults: LearnDefaults = {
  frontMode: 'japanese',
  favoritesOnly: false,
  wordCount: 10,
  rangeEnabled: false,
  rangeStart: 1,
  rangeEnd: 10,
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      hideJapaneseInList: false,
      hideMeaningInList: false,
      listFontScale: 3,
      learnCardFontScale: 2,
      lastSelectedSetId: 'all',
      learnDefaults: defaultLearnDefaults,
      setHideJapaneseInList: (next) => set({ hideJapaneseInList: next }),
      setHideMeaningInList: (next) => set({ hideMeaningInList: next }),
      setListFontScale: (next) => set({ listFontScale: Math.max(0, Math.min(6, next)) }),
      setLearnCardFontScale: (next) => set({ learnCardFontScale: Math.max(1, Math.min(4, Math.floor(next) || 2)) }),
      setLastSelectedSetId: (next) => set({ lastSelectedSetId: next }),
      updateLearnDefaults: (partial) =>
        set((state) => ({
          learnDefaults: { ...state.learnDefaults, ...partial },
        })),
    }),
    {
      name: 'jsp-react:preferences',
    },
  ),
)
