import { Fragment, useEffect, useMemo, useState } from 'react'
import { ChevronLeft, Eraser, SendHorizontal } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { GlassPanel } from '@/components/GlassPanel'
import { IconButton } from '@/components/IconButton'
import { Tooltip } from '@/components/Tooltip'
import { HandwritingPad } from '@/features/handwriting/HandwritingPad'
import { createStudyPrompt, normalizeReviewAnswer } from '@/features/smart-review/smartReviewEngine'
import styles from '@/features/smart-review/smartReview.module.css'
import { useSmartReviewStore } from '@/features/smart-review/smartReviewStore'
import { getWordById } from '@/features/vocab/model/selectors'

export function SmartReviewSessionPage() {
  const navigate = useNavigate()
  const { isHydrated, status, session, submitAnswer, advanceToNext, abandonSession } = useSmartReviewStore()
  const [answer, setAnswer] = useState('')

  useEffect(() => {
    if (isHydrated && !session && status === 'idle') {
      navigate('/smart-review', { replace: true })
    }
  }, [isHydrated, navigate, session, status])

  useEffect(() => {
    if (status === 'complete') {
      navigate('/smart-review/result', { replace: true })
    }
  }, [navigate, status])

  const word = useMemo(() => (session?.currentWordId ? getWordById(session.currentWordId) ?? null : null), [session?.currentWordId])
  const prompt = useMemo(() => (word ? createStudyPrompt(word) : null), [word])
  const pendingAnswer = normalizeReviewAnswer(answer)
  const isRevealed = session?.isAnswerRevealed ?? false

  if (!session || !word || !prompt) return null

  const currentWord = word
  const currentPrompt = prompt

  function handleSubmit() {
    if (!pendingAnswer) return
    const outcome = submitAnswer(answer)
    if (outcome.kind === 'idle') return
  }

  function renderSentence() {
    const parts = currentPrompt.japaneseSentence.split('____')

    return (
      <p className={styles.sentence}>
        {parts.map((part, index) => (
          <Fragment key={`${part}-${index}`}>
            {part}
            {index < parts.length - 1 ? (
              isRevealed ? (
                <ruby className={styles.rubyAnswer}>
                  {currentWord.japanese}
                  <rt>{currentWord.reading}</rt>
                </ruby>
              ) : (
                <span className={styles.blankSlot}>____</span>
              )
            ) : null}
          </Fragment>
        ))}
      </p>
    )
  }

  return (
    <div className={styles.root}>
      <div className="page-header">
        <div className="page-header__left">
          <Tooltip label="설정으로">
            <span>
              <IconButton
                icon={ChevronLeft}
                label="설정으로"
                onClick={() => {
                  abandonSession()
                  navigate('/smart-review')
                }}
              />
            </span>
          </Tooltip>
          <div className="page-header__meta">
            <p className="page-header__caption">문장 복습</p>
            <h1 className="page-header__title">{session.setName}</h1>
          </div>
        </div>
      </div>

      <GlassPanel className={styles.sessionCard} padding="lg" variant="strong">
        <div className={styles.sessionMeta}>
          <div>
            <p className="section-kicker">복습</p>
            <h2 className="page-header__title">
              {`${session.round}회차 ${session.currentIndex + 1}/${session.activeQueue.length}`}
            </h2>
          </div>
          <div className="selectionMeta">
            <span className="miniChip">선택 {session.selectedWordIds.length}</span>
            <span className="miniChip">복습 {session.retryQueue.length}</span>
          </div>
        </div>

        <div
          className={styles.questionCard}
          data-tone={
            session.revealedIsCorrect === true
              ? 'correct'
              : session.revealedIsCorrect === false
                ? 'wrong'
                : 'idle'
          }
        >
          <p className={styles.questionLabel}>빈칸에 들어갈 일본어를 써 보세요.</p>
          {renderSentence()}
          <p className={styles.translation}>{currentPrompt.translationSentence}</p>
        </div>

        <div className={styles.answerCard}>
          <div className={styles.answerShell}>
            <p className={styles.inputLabel}>손글씨 답안</p>
            <div className={styles.answerBox} data-empty={pendingAnswer.length === 0}>
              {isRevealed
                ? session.revealedAnswer || '(빈 답안)'
                : pendingAnswer.length > 0
                  ? answer
                  : '후보를 골라 답을 넣으세요.'}
            </div>
          </div>

          <HandwritingPad
            onSelectCandidate={(candidate) => setAnswer(candidate)}
            disabled={isRevealed}
            hideStatus
            extraActions={
              <div className={styles.setupActions}>
                <Tooltip label="답 지우기">
                  <span>
                    <IconButton
                      icon={Eraser}
                      label="답 지우기"
                      onClick={() => setAnswer('')}
                      disabled={pendingAnswer.length === 0 || isRevealed}
                    />
                  </span>
                </Tooltip>
                {isRevealed ? (
                  <button
                    type="button"
                    className="pill"
                    data-active="true"
                    onClick={() => {
                      setAnswer('')
                      void advanceToNext()
                    }}
                  >
                    <span>다음</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="pill"
                    data-active={pendingAnswer.length > 0}
                    onClick={handleSubmit}
                    disabled={pendingAnswer.length === 0}
                  >
                    <SendHorizontal size={16} />
                    <span>제출</span>
                  </button>
                )}
              </div>
            }
          />
        </div>
      </GlassPanel>
    </div>
  )
}
