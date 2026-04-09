import { useMemo } from 'react'
import { BookOpen, ChevronRight, Heart } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useExamStore } from '@/features/exam/examStore'
import { useFavoritesStore } from '@/features/favorites/favoritesStore'
import { usePreferencesStore } from '@/features/preferences/preferencesStore'
import { allSets, getWordById, getWordsForSet } from '@/features/vocab/model/selectors'
import type { VocabularyWord } from '@/features/vocab/model/types'
import styles from '@/features/list/list.module.css'

type VocabularySetMenuProps = {
  onSelect?: () => void
}

export function VocabularySetMenu({ onSelect }: VocabularySetMenuProps) {
  const navigate = useNavigate()
  const wrongAnswerIds = useExamStore((state) => state.wrongAnswerIds)
  const favoriteIds = useFavoritesStore((state) => state.favoriteIds)
  const lastSelectedSetId = usePreferencesStore((state) => state.lastSelectedSetId)
  const setLastSelectedSetId = usePreferencesStore((state) => state.setLastSelectedSetId)
  const wrongAnswerWords = useMemo(
    () =>
      wrongAnswerIds
        .map((wordId) => getWordById(wordId))
        .filter((word): word is VocabularyWord => word !== undefined),
    [wrongAnswerIds],
  )

  const handleSelectSet = (setId: string | 'all') => {
    setLastSelectedSetId(setId)
    onSelect?.()
    navigate('/list')
  }

  return (
    <div className={styles.menuList}>
      <button className={styles.menuItem} data-active={lastSelectedSetId === 'all'} onClick={() => handleSelectSet('all')}>
        <span className={styles.menuItemIcon}>
          <BookOpen size={22} />
        </span>
        <span className={styles.menuItemBody}>
          <strong>전체 단어장</strong>
        </span>
        <span className={styles.menuItemMeta}>
          <span className="miniChip">{getWordsForSet('all').length}개</span>
          <ChevronRight size={18} />
        </span>
      </button>

      <button
        className={styles.menuItem}
        data-active={lastSelectedSetId === 'favorites'}
        onClick={() => handleSelectSet('favorites')}
      >
        <span className={styles.menuItemIcon}>
          <Heart size={22} />
        </span>
        <span className={styles.menuItemBody}>
          <strong>즐겨찾기 단어장</strong>
        </span>
        <span className={styles.menuItemMeta}>
          <span className="miniChip">{getWordsForSet('favorites', favoriteIds).length}개</span>
          <ChevronRight size={18} />
        </span>
      </button>

      {wrongAnswerWords.length > 0 ? (
        <button
          className={styles.menuItem}
          data-active={lastSelectedSetId === 'wrong_answers'}
          onClick={() => handleSelectSet('wrong_answers')}
        >
          <span className={styles.menuItemIcon}>
            <BookOpen size={22} />
          </span>
          <span className={styles.menuItemBody}>
            <strong>오답 노트</strong>
          </span>
          <span className={styles.menuItemMeta}>
            <span className="miniChip">{wrongAnswerWords.length}개</span>
            <ChevronRight size={18} />
          </span>
        </button>
      ) : null}

      {allSets.map((set) => (
        <button
          key={set.id}
          className={styles.menuItem}
          data-active={lastSelectedSetId === set.id}
          onClick={() => handleSelectSet(set.id)}
        >
          <span className={styles.menuItemIcon}>
            <BookOpen size={22} />
          </span>
          <span className={styles.menuItemBody}>
            <strong>{set.name}</strong>
          </span>
          <span className={styles.menuItemMeta}>
            <span className="miniChip">{set.wordIds.length}개</span>
            <ChevronRight size={18} />
          </span>
        </button>
      ))}
    </div>
  )
}
