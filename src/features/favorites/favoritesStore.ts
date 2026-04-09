import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type FavoritesState = {
  favoriteIds: string[]
  toggleFavorite: (wordId: string) => void
  isFavorite: (wordId: string) => boolean
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favoriteIds: [],
      toggleFavorite: (wordId) =>
        set((state) => ({
          favoriteIds: state.favoriteIds.includes(wordId)
            ? state.favoriteIds.filter((id) => id !== wordId)
            : [...state.favoriteIds, wordId],
        })),
      isFavorite: (wordId) => get().favoriteIds.includes(wordId),
    }),
    {
      name: 'jsp-react:favorites',
    },
  ),
)
