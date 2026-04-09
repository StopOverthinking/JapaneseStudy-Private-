import { BookOpen, House, RotateCcw, Sparkles } from 'lucide-react'
import { Navigate, useNavigate } from 'react-router-dom'
import { GlassPanel } from '@/components/GlassPanel'
import { IconButton } from '@/components/IconButton'
import { Tooltip } from '@/components/Tooltip'
import { useLearnSessionStore } from '@/features/session/learnSessionStore'
import styles from '@/features/learn/learn.module.css'

export function LearnResultPage() {
  const navigate = useNavigate()
  const lastResult = useLearnSessionStore((state) => state.lastResult)
  const clearResult = useLearnSessionStore((state) => state.clearResult)

  if (!lastResult) {
    return <Navigate to="/learn" replace />
  }

  return (
    <div className={styles.root}>
      <GlassPanel className={styles.resultHero} padding="lg" variant="strong">
        <div>
          <p className="section-kicker">Complete</p>
          <h1 className="section-title">{lastResult.setName} 세션을 마쳤습니다.</h1>
          <p className="section-copy">빛 번짐 효과와 함께 결과만 남기고, 저장된 진행 상태는 정리되었습니다.</p>
        </div>

        <div className="meta-grid">
          <GlassPanel className="meta-card" padding="sm">
            <span className="form-label">총 카드 수</span>
            <strong>{lastResult.totalTargetCount}</strong>
          </GlassPanel>
          <GlassPanel className="meta-card" padding="sm">
            <span className="form-label">라운드 수</span>
            <strong>{lastResult.rounds}</strong>
          </GlassPanel>
          <GlassPanel className="meta-card" padding="sm">
            <span className="form-label">다시 본 카드</span>
            <strong>{lastResult.revisitedCount}</strong>
          </GlassPanel>
        </div>

        <div className="action-row">
          <Tooltip label="홈으로 이동">
            <span>
              <IconButton icon={House} label="홈으로 이동" size="lg" onClick={() => { clearResult(); navigate('/') }} />
            </span>
          </Tooltip>
          <Tooltip label="목록으로 이동">
            <span>
              <IconButton icon={BookOpen} label="목록으로 이동" size="lg" onClick={() => { clearResult(); navigate('/list') }} />
            </span>
          </Tooltip>
          <Tooltip label="학습 설정으로 이동">
            <span>
              <IconButton icon={Sparkles} label="학습 설정으로 이동" size="lg" onClick={() => navigate('/learn')} />
            </span>
          </Tooltip>
          <Tooltip label="다시 학습">
            <span>
              <IconButton icon={RotateCcw} label="다시 학습" size="lg" onClick={() => navigate('/learn')} />
            </span>
          </Tooltip>
        </div>
      </GlassPanel>
    </div>
  )
}
