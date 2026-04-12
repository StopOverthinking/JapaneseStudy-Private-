import { useMemo, useState } from 'react'
import { PenTool, Play, RotateCcw, Undo2, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { GlassPanel } from '@/components/GlassPanel'
import { IconButton } from '@/components/IconButton'
import { Tooltip } from '@/components/Tooltip'
import { buildSmartReviewSummary } from '@/features/smart-review/smartReviewEngine'
import styles from '@/features/smart-review/smartReview.module.css'
import { useSmartReviewStore } from '@/features/smart-review/smartReviewStore'
import { allWords, getSetName } from '@/features/vocab/model/selectors'

export function SmartReviewSetupPage() {
  const navigate = useNavigate()
  const isHydrated = useSmartReviewStore((state) => state.isHydrated)
  const profiles = useSmartReviewStore((state) => state.profiles)
  const session = useSmartReviewStore((state) => state.session)
  const startSession = useSmartReviewStore((state) => state.startSession)
  const clearSession = useSmartReviewStore((state) => state.clearSession)
  const [error, setError] = useState<string | null>(null)

  const words = useMemo(() => allWords, [])
  const summary = useMemo(() => buildSmartReviewSummary(words, profiles), [profiles, words])

  const handleStart = async () => {
    const didStart = await startSession({
      setId: 'all',
      setName: getSetName('all'),
      words,
      wordCount: words.length,
    })

    if (!didStart) {
      setError('시작할 단어가 없어요.')
      return
    }

    setError(null)
    navigate('/smart-review/session')
  }

  const handleDiscard = () => {
    if (!window.confirm('진행 중인 스마트 복습을 종료할까요?')) {
      return
    }

    clearSession()
  }

  return (
    <div className={styles.root}>
      <div className="page-header">
        <div className="page-header__left">
          <Tooltip label="뒤로">
            <span>
              <IconButton icon={Undo2} label="뒤로" onClick={() => navigate('/')} />
            </span>
          </Tooltip>
          <div className="page-header__meta">
            <p className="page-header__caption">문장 복습</p>
            <h1 className="page-header__title">스마트 복습</h1>
          </div>
        </div>
        <div className={styles.headerActions}>
          <Tooltip label="스마트 복습 시작">
            <span>
              <IconButton icon={Play} label="스마트 복습 시작" size="lg" onClick={() => void handleStart()} disabled={!isHydrated} />
            </span>
          </Tooltip>
        </div>
      </div>

      {session ? (
        <GlassPanel className={styles.resumeBanner} variant="floating">
          <div>
            <p className="section-kicker">이어하기</p>
            <h2 className="page-header__title">{session.setName} 스마트 복습이 진행 중이에요.</h2>
            <p className="page-header__caption">
              {session.round}회차 {session.currentIndex + 1}/{session.activeQueue.length}
            </p>
          </div>
          <div className={styles.resumeActions}>
            <Tooltip label="이어서 보기">
              <span>
                <IconButton icon={RotateCcw} label="이어서 보기" size="lg" onClick={() => navigate('/smart-review/session')} />
              </span>
            </Tooltip>
            <Tooltip label="종료">
              <span>
                <IconButton icon={X} label="종료" tone="danger" size="lg" onClick={handleDiscard} />
              </span>
            </Tooltip>
          </div>
        </GlassPanel>
      ) : null}

      <GlassPanel className={styles.setupCard} padding="lg" variant="strong">
        <div>
          <p className="section-kicker">방식</p>
          <h2 className="page-header__title">전체 단어장 셔플</h2>
          <p className="page-header__caption">
            {isHydrated ? `${getSetName('all')} ${words.length}개를 한 번에 섞어 시작해요.` : '복습 일정을 불러오는 중이에요.'}
          </p>
        </div>

        <div className={styles.statsGrid}>
          <GlassPanel className={styles.metaCard} padding="sm">
            <p className={styles.metaLabel}>복습</p>
            <p className={styles.metaValue}>{summary.dueCount}</p>
          </GlassPanel>
          <GlassPanel className={styles.metaCard} padding="sm">
            <p className={styles.metaLabel}>신규</p>
            <p className={styles.metaValue}>{summary.newCount}</p>
          </GlassPanel>
          <GlassPanel className={styles.metaCard} padding="sm">
            <p className={styles.metaLabel}>학습 중</p>
            <p className={styles.metaValue}>{summary.learningCount}</p>
          </GlassPanel>
          <GlassPanel className={styles.metaCard} padding="sm">
            <p className={styles.metaLabel}>완료</p>
            <p className={styles.metaValue}>{summary.masteredCount}</p>
          </GlassPanel>
        </div>

        <div className={styles.setupActions}>
          <Tooltip label="스마트 복습 시작">
            <span>
              <IconButton icon={PenTool} label="스마트 복습 시작" size="lg" onClick={() => void handleStart()} disabled={!isHydrated} />
            </span>
          </Tooltip>
        </div>

        {error ? <p className="page-header__caption" style={{ color: 'var(--accent-coral)' }}>{error}</p> : null}
      </GlassPanel>
    </div>
  )
}
