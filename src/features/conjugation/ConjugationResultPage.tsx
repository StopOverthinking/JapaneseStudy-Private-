import { House, RefreshCcw, RotateCcw, Undo2 } from 'lucide-react'
import { Navigate, useNavigate } from 'react-router-dom'
import { GlassPanel } from '@/components/GlassPanel'
import { IconButton } from '@/components/IconButton'
import { Tooltip } from '@/components/Tooltip'
import styles from '@/features/conjugation/conjugation.module.css'
import { useConjugationStore } from '@/features/conjugation/conjugationStore'

export function ConjugationResultPage() {
  const navigate = useNavigate()
  const lastResult = useConjugationStore((state) => state.lastResult)
  const clearResult = useConjugationStore((state) => state.clearResult)
  const restartWrongQuestions = useConjugationStore((state) => state.restartWrongQuestions)

  if (!lastResult) {
    return <Navigate to="/conjugation" replace />
  }

  return (
    <div className={styles.root}>
      <GlassPanel className={styles.resultHero} padding="lg" variant="strong">
        <div>
          <p className="section-kicker">Complete</p>
          <h1 className="section-title">{lastResult.setName} 활용 훈련을 마쳤습니다.</h1>
          <p className="section-copy">맞힌 문제와 틀린 활용형을 바로 복습할 수 있습니다.</p>
        </div>

        <div className="meta-grid">
          <GlassPanel className="meta-card" padding="sm">
            <span className="form-label">총 문제 수</span>
            <strong>{lastResult.totalQuestions}</strong>
          </GlassPanel>
          <GlassPanel className="meta-card" padding="sm">
            <span className="form-label">정답 수</span>
            <strong>{lastResult.correctCount}</strong>
          </GlassPanel>
          <GlassPanel className="meta-card" padding="sm">
            <span className="form-label">오답 수</span>
            <strong>{lastResult.wrongItems.length}</strong>
          </GlassPanel>
        </div>

        <div className={styles.resultActions}>
          <Tooltip label="메인으로 이동">
            <span>
              <IconButton icon={House} label="메인으로 이동" size="lg" onClick={() => { clearResult(); navigate('/') }} />
            </span>
          </Tooltip>
          <Tooltip label="설정으로 이동">
            <span>
              <IconButton icon={Undo2} label="설정으로 이동" size="lg" onClick={() => navigate('/conjugation')} />
            </span>
          </Tooltip>
          <Tooltip label="같은 화면에서 다시 시작">
            <span>
              <IconButton icon={RotateCcw} label="같은 화면에서 다시 시작" size="lg" onClick={() => navigate('/conjugation')} />
            </span>
          </Tooltip>
          <Tooltip label="오답 다시 풀기">
            <span>
              <IconButton
                icon={RefreshCcw}
                label="오답 다시 풀기"
                size="lg"
                disabled={lastResult.wrongItems.length === 0}
                onClick={() => {
                  if (restartWrongQuestions()) {
                    navigate('/conjugation/session')
                  }
                }}
              />
            </span>
          </Tooltip>
        </div>
      </GlassPanel>

      <GlassPanel className={styles.resultPanel} padding="lg">
        <div>
          <p className="section-kicker">Weak Spots</p>
          <h2 className="page-header__title">활용형별 결과</h2>
        </div>

        <div className={styles.statGrid}>
          {lastResult.formStats.map((stat) => (
            <div key={stat.form} className={styles.statCard}>
              <span className="form-label">{stat.label}</span>
              <span className={styles.statValue}>
                {stat.correctCount}/{stat.totalCount}
              </span>
              <span className="page-header__caption">
                정답률 {Math.round((stat.correctCount / Math.max(1, stat.totalCount)) * 100)}%
              </span>
            </div>
          ))}
        </div>
      </GlassPanel>

      <GlassPanel className={styles.resultPanel} padding="lg">
        <div>
          <p className="section-kicker">Review</p>
          <h2 className="page-header__title">오답 다시 보기</h2>
        </div>

        {lastResult.wrongItems.length === 0 ? (
          <p className={styles.perfectScore}>모든 문제를 맞혔습니다.</p>
        ) : (
          <div className={styles.wrongList}>
            {lastResult.wrongItems.map((item) => (
              <GlassPanel key={item.question.id} className={styles.wrongItem} padding="sm">
                <p className={styles.wrongQuestion}>
                  [{item.question.formLabel}] {item.question.promptMode === 'meaning' ? item.question.meaning : item.question.dictionaryForm}
                </p>
                <p className="page-header__caption">{item.question.reading}</p>
                <p className="page-header__caption">내 답안: {item.attempt.userAnswer || '(빈 답안)'}</p>
                <p className="page-header__caption">정답: {item.attempt.canonicalAnswer}</p>
                <p className={styles.explanation}>{item.attempt.explanation}</p>
              </GlassPanel>
            ))}
          </div>
        )}
      </GlassPanel>
    </div>
  )
}
