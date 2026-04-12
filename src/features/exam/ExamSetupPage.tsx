import { useMemo, useState } from 'react'
import { ClipboardCheck, RotateCcw, Undo2, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { GlassPanel } from '@/components/GlassPanel'
import { IconButton } from '@/components/IconButton'
import { Tooltip } from '@/components/Tooltip'
import styles from '@/features/exam/exam.module.css'
import { useExamStore } from '@/features/exam/examStore'
import type { ExamGradingMode, ExamSetId } from '@/features/exam/examTypes'
import { allSets, getWordById } from '@/features/vocab/model/selectors'

const wrongAnswerSetId = 'wrong_answers'

export function ExamSetupPage() {
  const navigate = useNavigate()
  const { session, status, lastResult, wrongAnswerIds, startExam, clearSession } = useExamStore()
  const [gradingMode, setGradingMode] = useState<ExamGradingMode>('auto')

  const wrongAnswerWords = useMemo(
    () => wrongAnswerIds.map((wordId) => getWordById(wordId)).filter((word): word is NonNullable<typeof word> => word !== undefined),
    [wrongAnswerIds],
  )

  function handleStartExam(params: { setId: ExamSetId; setName: string; words: typeof wrongAnswerWords }) {
    if (session && !window.confirm('진행 중인 시험이 있습니다. 새 시험을 시작하면 현재 진행 내용이 대체됩니다. 계속할까요?')) {
      return
    }

    startExam({
      setId: params.setId,
      setName: params.setName,
      words: params.words,
      gradingMode,
    })
    navigate('/exam/session')
  }

  function handleDiscardExam() {
    if (!window.confirm('진행 중이던 시험을 파기할까요? 지금까지의 시험 진행 내용은 삭제됩니다.')) {
      return
    }

    clearSession()
  }

  return (
    <div className={styles.root}>
      <div className="page-header">
        <div className="page-header__left">
          <Tooltip label="메인으로 이동">
            <span>
              <IconButton icon={Undo2} label="메인으로 이동" onClick={() => navigate('/')} />
            </span>
          </Tooltip>
          <div className="page-header__meta">
            <p className="page-header__caption">Exam Mode</p>
            <h1 className="page-header__title">시험 모드 설정</h1>
          </div>
        </div>
      </div>

      {status === 'active' && session ? (
        <GlassPanel className={styles.resumeBanner} variant="floating">
          <div>
            <p className="section-kicker">Resume</p>
            <h2 className="page-header__title">{session.setName} 시험을 이어서 진행할 수 있습니다.</h2>
            <p className="page-header__caption">
              문제 {session.currentIndex + 1}/{session.questionIds.length}째{' '}
              {session.gradingMode === 'manual' ? '직접 채점' : '자동 채점'}
            </p>
          </div>
          <div className={styles.resumeActions}>
            <Tooltip label="시험 이어하기">
              <span>
                <IconButton icon={RotateCcw} label="시험 이어하기" size="lg" onClick={() => navigate('/exam/session')} />
              </span>
            </Tooltip>
            <Tooltip label="시험 파기">
              <span>
                <IconButton icon={X} label="시험 파기" tone="danger" size="lg" onClick={handleDiscardExam} />
              </span>
            </Tooltip>
          </div>
        </GlassPanel>
      ) : null}

      {status !== 'active' && lastResult ? (
        <GlassPanel className={styles.resumeBanner} variant="floating">
          <div>
            <p className="section-kicker">Recent Result</p>
            <h2 className="page-header__title">{lastResult.setName} 시험 결과가 남아 있습니다.</h2>
            <p className="page-header__caption">
              {lastResult.correctCount}/{lastResult.totalQuestions}점 {lastResult.gradingMode === 'manual' ? '직접 채점' : '자동 채점'}
            </p>
          </div>
          <Tooltip label="결과 보기">
            <span>
              <IconButton icon={ClipboardCheck} label="결과 보기" size="lg" onClick={() => navigate('/exam/result')} />
            </span>
          </Tooltip>
        </GlassPanel>
      ) : null}

      <div className={styles.setupGrid}>
        <GlassPanel className={`setup-panel-shell ${styles.selectionPanel}`} padding="lg" variant="strong">
          <div>
            <p className="section-kicker">Grading</p>
            <h2 className="section-title">채점 방식을 고른 뒤 원하는 세트를 선택해 주세요.</h2>
          </div>

          <div className={styles.gradingSelector} role="group" aria-label="시험 채점 방식">
            <button type="button" className="pill" data-active={gradingMode === 'auto'} onClick={() => setGradingMode('auto')}>
              자동 채점
            </button>
            <button type="button" className="pill" data-active={gradingMode === 'manual'} onClick={() => setGradingMode('manual')}>
              직접 채점
            </button>
          </div>

          <div className={styles.selectionGrid}>
            {wrongAnswerWords.length > 0 ? (
              <button
                type="button"
                className={`glass-panel ${styles.selectionCard}`}
                data-tone="accent"
                onClick={() =>
                  handleStartExam({
                    setId: wrongAnswerSetId,
                    setName: '시험 오답 세트',
                    words: wrongAnswerWords,
                  })
                }
              >
                <div>
                  <h3 className={styles.selectionCardTitle}>시험 오답 세트</h3>
                  <p className={styles.selectionCardCount}>{wrongAnswerWords.length}문제</p>
                </div>
              </button>
            ) : null}

            {allSets.map((set) => {
              const words = set.wordIds.map((wordId) => getWordById(wordId)).filter((word): word is NonNullable<typeof word> => word !== undefined)

              return (
                <button
                  key={set.id}
                  type="button"
                  className={`glass-panel ${styles.selectionCard}`}
                  onClick={() =>
                    handleStartExam({
                      setId: set.id,
                      setName: set.name,
                      words,
                    })
                  }
                >
                  <div>
                    <h3 className={styles.selectionCardTitle}>{set.name}</h3>
                    <p className={styles.selectionCardCount}>{set.wordIds.length}문제</p>
                  </div>
                </button>
              )
            })}
          </div>
        </GlassPanel>
      </div>
    </div>
  )
}
