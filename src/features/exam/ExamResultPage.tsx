import { ClipboardCheck, Heart, House, RotateCcw } from 'lucide-react'
import { Navigate, useNavigate } from 'react-router-dom'
import { GlassPanel } from '@/components/GlassPanel'
import { IconButton } from '@/components/IconButton'
import { Tooltip } from '@/components/Tooltip'
import styles from '@/features/exam/exam.module.css'
import { useExamStore } from '@/features/exam/examStore'
import { useFavoritesStore } from '@/features/favorites/favoritesStore'
import { getWordById } from '@/features/vocab/model/selectors'

export function ExamResultPage() {
  const navigate = useNavigate()
  const lastResult = useExamStore((state) => state.lastResult)
  const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite)
  const favoriteIds = useFavoritesStore((state) => state.favoriteIds)

  if (!lastResult) {
    return <Navigate to="/exam" replace />
  }

  const wrongItems = lastResult.wrongItems
    .map((item) => {
      const word = getWordById(item.wordId)
      return word ? { ...item, word } : null
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)

  return (
    <div className={styles.root}>
      <GlassPanel className={styles.resultHero} padding="lg" variant="strong">
        <div>
          <p className="section-kicker">Result</p>
          <h1 className="section-title">{lastResult.setName} 시험 결과</h1>
          <p className="section-copy">
            {lastResult.gradingMode === 'manual' ? '직접 채점' : '자동 채점'}으로 {lastResult.totalQuestions}문제를 확인했습니다.
          </p>
        </div>

        <div className="meta-grid">
          <GlassPanel className="meta-card" padding="sm">
            <span className="form-label">점수</span>
            <strong>{lastResult.correctCount} / {lastResult.totalQuestions}</strong>
          </GlassPanel>
          <GlassPanel className="meta-card" padding="sm">
            <span className="form-label">오답 수</span>
            <strong>{lastResult.wrongItems.length}</strong>
          </GlassPanel>
          <GlassPanel className="meta-card" padding="sm">
            <span className="form-label">채점 방식</span>
            <strong>{lastResult.gradingMode === 'manual' ? '직접' : '자동'}</strong>
          </GlassPanel>
        </div>

        <GlassPanel className={styles.reviewPanel} padding="lg">
          <div>
            <p className="section-kicker">Review</p>
            <h2 className="page-header__title">오답 노트</h2>
          </div>

          {wrongItems.length > 0 ? (
            <div className={styles.wrongList}>
              {wrongItems.map((item) => {
                const isFavorite = favoriteIds.includes(item.word.id)

                return (
                  <GlassPanel key={item.word.id} className={styles.wrongItem} padding="sm">
                    <div className={styles.wrongHeader}>
                      <div>
                        <p className={styles.wrongMeaning}>문제: {item.word.meaning}</p>
                        <p className={styles.correctAnswer}>
                          정답: <strong>{item.word.japanese}</strong> ({item.word.reading})
                        </p>
                      </div>
                      <Tooltip label={isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}>
                        <span>
                          <IconButton
                            icon={Heart}
                            label={isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
                            active={isFavorite}
                            onClick={() => toggleFavorite(item.word.id)}
                          />
                        </span>
                      </Tooltip>
                    </div>
                    {lastResult.gradingMode === 'auto' ? (
                      <p className={styles.wrongAnswer}>내 답안: {item.userAnswer || '(미입력)'}</p>
                    ) : null}
                  </GlassPanel>
                )
              })}
            </div>
          ) : (
            <p className={styles.perfectScore}>완벽합니다. 모든 문제를 맞혔습니다.</p>
          )}
        </GlassPanel>

        <div className="action-row">
          <Tooltip label="메인으로 이동">
            <span>
              <IconButton icon={House} label="메인으로 이동" size="lg" onClick={() => navigate('/')} />
            </span>
          </Tooltip>
          <Tooltip label="시험 설정으로 이동">
            <span>
              <IconButton icon={ClipboardCheck} label="시험 설정으로 이동" size="lg" onClick={() => navigate('/exam')} />
            </span>
          </Tooltip>
          <Tooltip label="다른 시험 보기">
            <span>
              <IconButton icon={RotateCcw} label="다른 시험 보기" size="lg" onClick={() => navigate('/exam')} />
            </span>
          </Tooltip>
        </div>
      </GlassPanel>
    </div>
  )
}
