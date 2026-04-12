import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  BookOpen,
  ClipboardCheck,
  FolderTree,
  MoonStar,
  PenTool,
  RefreshCcw,
  RotateCcw,
  Sparkles,
  SunMedium,
  Swords,
  X,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { GlassPanel } from '@/components/GlassPanel'
import { IconButton } from '@/components/IconButton'
import { Tooltip } from '@/components/Tooltip'
import { useExamStore } from '@/features/exam/examStore'
import { VocabularySetMenu } from '@/features/list/VocabularySetMenu'
import { usePreferencesStore } from '@/features/preferences/preferencesStore'
import { SharePanel } from '@/features/share/SharePanel'
import { useLearnSessionStore } from '@/features/session/learnSessionStore'
import { useSmartReviewStore } from '@/features/smart-review/smartReviewStore'
import { useShouldReduceEffects } from '@/lib/useShouldReduceEffects'
import styles from '@/features/home/home.module.css'

export function HomePage() {
  const navigate = useNavigate()
  const sessionRecord = useLearnSessionStore((state) => state.record)
  const discardLearnSession = useLearnSessionStore((state) => state.discardSession)
  const examSession = useExamStore((state) => state.session)
  const clearExamSession = useExamStore((state) => state.clearSession)
  const lastExamResult = useExamStore((state) => state.lastResult)
  const smartReviewSession = useSmartReviewStore((state) => state.session)
  const clearSmartReviewSession = useSmartReviewStore((state) => state.clearSession)
  const themeMode = usePreferencesStore((state) => state.themeMode)
  const toggleThemeMode = usePreferencesStore((state) => state.toggleThemeMode)
  const shouldReduceEffects = useShouldReduceEffects()
  const [openMenu, setOpenMenu] = useState<'vocabulary' | 'learn' | 'share' | null>(null)
  const nextThemeLabel = themeMode === 'dark' ? '라이트 모드' : '다크 모드'
  const themeToggleLabel = `${nextThemeLabel}로 전환`
  const ThemeIcon = themeMode === 'dark' ? SunMedium : MoonStar
  const menuCardMotionProps = shouldReduceEffects
    ? {
        whileHover: undefined,
        whileTap: { scale: 0.99 },
        transition: { duration: 0.12 },
      }
    : {
        whileHover: { y: -2 },
        whileTap: { scale: 0.98 },
        transition: { duration: 0.16 },
      }
  const submenuCardMotionProps = shouldReduceEffects
    ? {
        whileHover: undefined,
        whileTap: { scale: 0.99 },
        transition: { duration: 0.12 },
      }
    : {
        whileHover: { y: -2 },
        whileTap: { scale: 0.98 },
        transition: { duration: 0.16 },
      }
  const submenuMotionProps = shouldReduceEffects
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.12, ease: 'linear' as const },
      }
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -6 },
        transition: { duration: 0.16, ease: 'easeOut' as const },
      }

  const handleDiscardLearnSession = () => {
    if (!window.confirm('진행 중인 학습을 그만둘까요? 지금까지의 학습 진행 내용은 사라집니다.')) {
      return
    }

    discardLearnSession()
  }

  const handleDiscardExamSession = () => {
    if (!window.confirm('진행 중인 시험을 그만둘까요? 지금까지의 시험 진행 내용은 사라집니다.')) {
      return
    }

    clearExamSession()
  }

  const handleDiscardSmartReviewSession = () => {
    if (!window.confirm('진행 중인 스마트 복습을 종료할까요?')) {
      return
    }

    clearSmartReviewSession()
  }

  return (
    <div className={styles.root}>
      {sessionRecord ? (
        <GlassPanel className={styles.resumeBanner} variant="floating">
          <div>
            <p className="section-kicker">이어하기</p>
            <h2 className="page-header__title">이전에 진행하던 학습 세션이 남아 있어요.</h2>
            <p className="page-header__caption">
              {sessionRecord.round}회차 카드 {sessionRecord.currentIndex + 1}/{sessionRecord.activeQueue.length}
            </p>
          </div>
          <div className={styles.resumeActions}>
            <Tooltip label="학습 이어하기">
              <span>
                <IconButton icon={RotateCcw} label="학습 이어하기" size="lg" onClick={() => navigate('/learn/session')} />
              </span>
            </Tooltip>
            <Tooltip label="학습 파기">
              <span>
                <IconButton icon={X} label="학습 파기" tone="danger" size="lg" onClick={handleDiscardLearnSession} />
              </span>
            </Tooltip>
          </div>
        </GlassPanel>
      ) : null}

      {examSession ? (
        <GlassPanel className={styles.resumeBanner} variant="floating">
          <div>
            <p className="section-kicker">시험</p>
            <h2 className="page-header__title">{examSession.setName} 시험이 진행 중이에요.</h2>
            <p className="page-header__caption">
              문제 {examSession.currentIndex + 1}/{examSession.questionIds.length} ·{' '}
              {examSession.gradingMode === 'manual' ? '직접 채점' : '자동 채점'}
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
                <IconButton icon={X} label="시험 파기" tone="danger" size="lg" onClick={handleDiscardExamSession} />
              </span>
            </Tooltip>
          </div>
        </GlassPanel>
      ) : null}

      {smartReviewSession ? (
        <GlassPanel className={styles.resumeBanner} variant="floating">
          <div>
            <p className="section-kicker">스마트 복습</p>
            <h2 className="page-header__title">{smartReviewSession.setName} 스마트 복습이 진행 중이에요.</h2>
            <p className="page-header__caption">
              {smartReviewSession.round}회차 카드 {smartReviewSession.currentIndex + 1}/{smartReviewSession.activeQueue.length}
            </p>
          </div>
          <div className={styles.resumeActions}>
            <Tooltip label="스마트 복습 이어하기">
              <span>
                <IconButton
                  icon={RotateCcw}
                  label="스마트 복습 이어하기"
                  size="lg"
                  onClick={() => navigate('/smart-review/session')}
                />
              </span>
            </Tooltip>
            <Tooltip label="스마트 복습 종료">
              <span>
                <IconButton
                  icon={X}
                  label="스마트 복습 종료"
                  tone="danger"
                  size="lg"
                  onClick={handleDiscardSmartReviewSession}
                />
              </span>
            </Tooltip>
          </div>
        </GlassPanel>
      ) : null}

      {!examSession && lastExamResult ? (
        <GlassPanel className={styles.resumeBanner} variant="floating">
          <div>
            <p className="section-kicker">시험 결과</p>
            <h2 className="page-header__title">{lastExamResult.setName} 시험 결과를 다시 볼 수 있어요.</h2>
            <p className="page-header__caption">
              {lastExamResult.correctCount}/{lastExamResult.totalQuestions} 정답, 오답 {lastExamResult.wrongItems.length}개
            </p>
          </div>
          <Tooltip label="시험 결과 보기">
            <span>
              <IconButton icon={ClipboardCheck} label="시험 결과 보기" size="lg" onClick={() => navigate('/exam/result')} />
            </span>
          </Tooltip>
        </GlassPanel>
      ) : null}

      <GlassPanel className={styles.hero} padding="lg" variant="strong">
        <div className={styles.heroTop}>
          <div className={styles.heroTitle}>
            <h1 className="section-title">일본어 카드 학습기</h1>
          </div>
          <Tooltip label={themeToggleLabel}>
            <button
              type="button"
              className={styles.themeToggle}
              aria-label={themeToggleLabel}
              onClick={toggleThemeMode}
            >
              <ThemeIcon size={18} />
              <span>{nextThemeLabel}</span>
            </button>
          </Tooltip>
        </div>

        <div className={styles.heroActions}>
          <motion.button
            type="button"
            className={`glass-panel glass-padding-lg ${styles.actionCard}`}
            data-active={openMenu === 'vocabulary'}
            {...menuCardMotionProps}
            onClick={() => setOpenMenu((value) => (value === 'vocabulary' ? null : 'vocabulary'))}
          >
            <div className={styles.actionMeta}>
              <span className={styles.actionIcon}>
                <BookOpen size={28} />
              </span>
              <h2 className="page-header__title">목록</h2>
            </div>
          </motion.button>

          <motion.button
            type="button"
            className={`glass-panel glass-padding-lg ${styles.actionCard}`}
            data-active={openMenu === 'learn'}
            {...menuCardMotionProps}
            onClick={() => setOpenMenu((value) => (value === 'learn' ? null : 'learn'))}
          >
            <div className={styles.actionMeta}>
              <span className={styles.actionIcon}>
                <Sparkles size={28} />
              </span>
              <h2 className="page-header__title">학습</h2>
              <p className={styles.actionCaption}>스마트 복습, 일반 학습, 동사 활용, 시험 모드, 게임 모드</p>
            </div>
          </motion.button>

          <motion.button
            type="button"
            className={`glass-panel glass-padding-lg ${styles.actionCard}`}
            data-active={openMenu === 'share'}
            {...menuCardMotionProps}
            onClick={() => setOpenMenu((value) => (value === 'share' ? null : 'share'))}
          >
            <div className={styles.actionMeta}>
              <span className={styles.actionIcon}>
                <FolderTree size={28} />
              </span>
              <h2 className="page-header__title">공유</h2>
              <p className={styles.actionCaption}>클립보드, JSON, QR</p>
            </div>
          </motion.button>
        </div>

        <AnimatePresence initial={false}>
          {openMenu === 'vocabulary' ? (
            <motion.div
              className={styles.submenuWrap}
              {...submenuMotionProps}
            >
              <GlassPanel className={styles.submenuPanel} padding="md" variant="floating">
                <div className={styles.submenuHeader}>
                  <div>
                    <p className="section-kicker">단어장</p>
                    <h2 className="page-header__title">단어장 선택</h2>
                  </div>
                  <p className="page-header__caption">보고 싶은 단어장을 고르면 바로 목록 화면으로 이동해요.</p>
                </div>

                <VocabularySetMenu />
              </GlassPanel>
            </motion.div>
          ) : null}

          {openMenu === 'learn' ? (
            <motion.div
              className={styles.submenuWrap}
              {...submenuMotionProps}
            >
              <GlassPanel className={styles.submenuPanel} padding="md" variant="floating">
                <div className={styles.submenuHeader}>
                  <div>
                    <p className="section-kicker">학습</p>
                    <h2 className="page-header__title">학습 모드 메뉴</h2>
                  </div>
                  <p className="page-header__caption">원하는 학습 흐름을 고르면 바로 해당 설정 화면으로 이동해요.</p>
                </div>

                <div className={styles.submenuGrid}>
                  <motion.button
                    type="button"
                    className={`glass-panel glass-padding-md ${styles.submenuCard}`}
                    {...submenuCardMotionProps}
                    onClick={() => navigate('/smart-review')}
                  >
                    <span className={styles.submenuIcon}>
                      <PenTool size={22} />
                    </span>
                    <div>
                      <h3 className={styles.submenuTitle}>스마트 복습</h3>
                    </div>
                  </motion.button>

                  <motion.button
                    type="button"
                    className={`glass-panel glass-padding-md ${styles.submenuCard}`}
                    {...submenuCardMotionProps}
                    onClick={() => navigate('/learn')}
                  >
                    <span className={styles.submenuIcon}>
                      <BookOpen size={22} />
                    </span>
                    <div>
                      <h3 className={styles.submenuTitle}>일반 학습</h3>
                    </div>
                  </motion.button>

                  <motion.button
                    type="button"
                    className={`glass-panel glass-padding-md ${styles.submenuCard}`}
                    {...submenuCardMotionProps}
                    onClick={() => navigate('/conjugation')}
                  >
                    <span className={styles.submenuIcon}>
                      <RefreshCcw size={22} />
                    </span>
                    <div>
                      <h3 className={styles.submenuTitle}>동사 활용</h3>
                    </div>
                  </motion.button>

                  <motion.button
                    type="button"
                    className={`glass-panel glass-padding-md ${styles.submenuCard}`}
                    {...submenuCardMotionProps}
                    onClick={() => navigate('/exam')}
                  >
                    <span className={styles.submenuIcon}>
                      <ClipboardCheck size={22} />
                    </span>
                    <div>
                      <h3 className={styles.submenuTitle}>시험 모드</h3>
                    </div>
                  </motion.button>

                  <motion.button
                    type="button"
                    className={`glass-panel glass-padding-md ${styles.submenuCard}`}
                    {...submenuCardMotionProps}
                    onClick={() => navigate('/game')}
                  >
                    <span className={styles.submenuIcon}>
                      <Swords size={22} />
                    </span>
                    <div>
                      <h3 className={styles.submenuTitle}>게임 모드</h3>
                    </div>
                  </motion.button>
                </div>
              </GlassPanel>
            </motion.div>
          ) : null}

          {openMenu === 'share' ? (
            <motion.div
              className={styles.submenuWrap}
              {...submenuMotionProps}
            >
              <SharePanel mode="submenu" />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </GlassPanel>
    </div>
  )
}
