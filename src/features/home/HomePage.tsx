import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { BookOpen, ClipboardCheck, FolderTree, MoonStar, RotateCcw, Sparkles, SunMedium, Swords, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { GlassPanel } from '@/components/GlassPanel'
import { IconButton } from '@/components/IconButton'
import { Tooltip } from '@/components/Tooltip'
import { useExamStore } from '@/features/exam/examStore'
import { VocabularySetMenu } from '@/features/list/VocabularySetMenu'
import { usePreferencesStore } from '@/features/preferences/preferencesStore'
import { SharePanel } from '@/features/share/SharePanel'
import { useLearnSessionStore } from '@/features/session/learnSessionStore'
import styles from '@/features/home/home.module.css'

export function HomePage() {
  const navigate = useNavigate()
  const sessionRecord = useLearnSessionStore((state) => state.record)
  const discardLearnSession = useLearnSessionStore((state) => state.discardSession)
  const examSession = useExamStore((state) => state.session)
  const clearExamSession = useExamStore((state) => state.clearSession)
  const lastExamResult = useExamStore((state) => state.lastResult)
  const themeMode = usePreferencesStore((state) => state.themeMode)
  const toggleThemeMode = usePreferencesStore((state) => state.toggleThemeMode)
  const [openMenu, setOpenMenu] = useState<'vocabulary' | 'learn' | 'share' | null>(null)
  const nextThemeLabel = themeMode === 'dark' ? '라이트 모드' : '다크 모드'
  const themeToggleLabel = `${nextThemeLabel}로 전환`
  const ThemeIcon = themeMode === 'dark' ? SunMedium : MoonStar

  const handleDiscardLearnSession = () => {
    if (!window.confirm('진행 중이던 학습을 파기할까요? 지금까지의 학습 진행 내용은 삭제됩니다.')) {
      return
    }

    discardLearnSession()
  }

  const handleDiscardExamSession = () => {
    if (!window.confirm('진행 중이던 시험을 파기할까요? 지금까지의 시험 진행 내용은 삭제됩니다.')) {
      return
    }

    clearExamSession()
  }

  return (
    <div className={styles.root}>
      {sessionRecord ? (
        <GlassPanel className={styles.resumeBanner} variant="floating">
          <div>
            <p className="section-kicker">Resume</p>
            <h2 className="page-header__title">이전에 진행하던 학습 세션이 남아 있습니다.</h2>
            <p className="page-header__caption">
              {sessionRecord.round}라운드 카드 {sessionRecord.currentIndex + 1}/{sessionRecord.activeQueue.length}
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
            <p className="section-kicker">Exam Resume</p>
            <h2 className="page-header__title">{examSession.setName} 시험을 이어서 진행할 수 있습니다.</h2>
            <p className="page-header__caption">
              문제 {examSession.currentIndex + 1}/{examSession.questionIds.length}째{' '}
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

      {!examSession && lastExamResult ? (
        <GlassPanel className={styles.resumeBanner} variant="floating">
          <div>
            <p className="section-kicker">Exam Result</p>
            <h2 className="page-header__title">{lastExamResult.setName} 시험 결과를 다시 볼 수 있습니다.</h2>
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
            whileHover={{ y: -6, rotateX: 2 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2 }}
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
            whileHover={{ y: -6, rotateX: 2 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2 }}
            onClick={() => setOpenMenu((value) => (value === 'learn' ? null : 'learn'))}
          >
            <div className={styles.actionMeta}>
              <span className={styles.actionIcon}>
                <Sparkles size={28} />
              </span>
              <h2 className="page-header__title">학습</h2>
              <p className={styles.actionCaption}>일반 학습, 시험 모드, 게임 모드</p>
            </div>
          </motion.button>

          <motion.button
            type="button"
            className={`glass-panel glass-padding-lg ${styles.actionCard}`}
            data-active={openMenu === 'share'}
            whileHover={{ y: -6, rotateX: 2 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2 }}
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
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              <GlassPanel className={styles.submenuPanel} padding="md" variant="floating">
                <div className={styles.submenuHeader}>
                  <div>
                    <p className="section-kicker">Vocabulary</p>
                    <h2 className="page-header__title">단어장 선택</h2>
                  </div>
                  <p className="page-header__caption">보고 싶은 단어장을 고르면 바로 목록 화면으로 이어집니다.</p>
                </div>

                <VocabularySetMenu />
              </GlassPanel>
            </motion.div>
          ) : null}

          {openMenu === 'learn' ? (
            <motion.div
              className={styles.submenuWrap}
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              <GlassPanel className={styles.submenuPanel} padding="md" variant="floating">
                <div className={styles.submenuHeader}>
                  <div>
                    <p className="section-kicker">Learn</p>
                    <h2 className="page-header__title">학습 모드 메뉴</h2>
                  </div>
                  <p className="page-header__caption">학습 흐름을 고르면 해당 모드 설정으로 바로 이어집니다.</p>
                </div>

                <div className={styles.submenuGrid}>
                  <motion.button
                    type="button"
                    className={`glass-panel glass-padding-md ${styles.submenuCard}`}
                    whileHover={{ y: -4 }}
                    whileTap={{ scale: 0.98 }}
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
                    whileHover={{ y: -4 }}
                    whileTap={{ scale: 0.98 }}
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
                    whileHover={{ y: -4 }}
                    whileTap={{ scale: 0.98 }}
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
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              <SharePanel mode="submenu" />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </GlassPanel>
    </div>
  )
}
