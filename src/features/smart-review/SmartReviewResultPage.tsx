import { Heart, House, PenTool, RotateCcw } from 'lucide-react'
import { Navigate, useNavigate } from 'react-router-dom'
import { GlassPanel } from '@/components/GlassPanel'
import { IconButton } from '@/components/IconButton'
import { Tooltip } from '@/components/Tooltip'
import { useFavoritesStore } from '@/features/favorites/favoritesStore'
import styles from '@/features/smart-review/smartReview.module.css'
import { useSmartReviewStore } from '@/features/smart-review/smartReviewStore'
import { getWordById } from '@/features/vocab/model/selectors'

export function SmartReviewResultPage() {
  const navigate = useNavigate()
  const lastResult = useSmartReviewStore((state) => state.lastResult)
  const clearResult = useSmartReviewStore((state) => state.clearResult)
  const favoriteIds = useFavoritesStore((state) => state.favoriteIds)
  const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite)

  if (!lastResult) {
    return <Navigate to="/smart-review" replace />
  }

  const wrongWords = lastResult.wrongWordIds
    .map((wordId) => getWordById(wordId))
    .filter((word) => word !== undefined)

  return (
    <div className={styles.root}>
      <GlassPanel className={styles.resultCard} padding="lg" variant="strong">
        <div>
          <p className="section-kicker">완료</p>
          <h1 className="section-title">{lastResult.setName} 스마트 복습 완료</h1>
        </div>

        <div className={styles.resultGrid}>
          <GlassPanel className={styles.metaCard} padding="sm">
            <p className={styles.metaLabel}>학습한 단어</p>
            <p className={styles.metaValue}>{lastResult.totalWords}</p>
          </GlassPanel>
          <GlassPanel className={styles.metaCard} padding="sm">
            <p className={styles.metaLabel}>복습할 단어</p>
            <p className={styles.metaValue}>{lastResult.reviewCount}</p>
          </GlassPanel>
        </div>

        {wrongWords.length > 0 ? (
          <div className={styles.wrongWords}>
            {wrongWords.map((word) => (
              <GlassPanel key={word.id} className={styles.wrongWordCard} padding="sm">
                <div className={styles.wrongWordCopy}>
                  <strong className={styles.wrongWordJapanese}>{word.japanese}</strong>
                  <span className={styles.wrongWordReading}>{word.reading}</span>
                  <span className={styles.wrongWordMeaning}>{word.meaning}</span>
                </div>
                <Tooltip label={favoriteIds.includes(word.id) ? '즐겨찾기 해제' : '즐겨찾기'}>
                  <span>
                    <IconButton
                      icon={Heart}
                      label={favoriteIds.includes(word.id) ? '즐겨찾기 해제' : '즐겨찾기'}
                      active={favoriteIds.includes(word.id)}
                      onClick={() => toggleFavorite(word.id)}
                    />
                  </span>
                </Tooltip>
              </GlassPanel>
            ))}
          </div>
        ) : null}

        <div className={styles.resultFooter}>
          <div className={styles.setupActions}>
            <Tooltip label="홈">
              <span>
                <IconButton
                  icon={House}
                  label="홈"
                  size="lg"
                  onClick={() => {
                    clearResult()
                    navigate('/')
                  }}
                />
              </span>
            </Tooltip>
            <Tooltip label="스마트 복습 설정">
              <span>
                <IconButton icon={PenTool} label="스마트 복습 설정" size="lg" onClick={() => navigate('/smart-review')} />
              </span>
            </Tooltip>
            <Tooltip label="다시 학습">
              <span>
                <IconButton icon={RotateCcw} label="다시 학습" size="lg" onClick={() => navigate('/smart-review')} />
              </span>
            </Tooltip>
          </div>
        </div>
      </GlassPanel>
    </div>
  )
}
