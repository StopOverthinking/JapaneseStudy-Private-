import { Play, RefreshCcw, RotateCcw, Undo2, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GlassPanel } from '@/components/GlassPanel'
import { IconButton } from '@/components/IconButton'
import { Tooltip } from '@/components/Tooltip'
import {
  getDistributedQuestionCount,
  getEligibleConjugationWords,
} from '@/features/conjugation/conjugationEngine'
import styles from '@/features/conjugation/conjugation.module.css'
import { getConjugationFormLabel } from '@/features/conjugation/conjugationRules'
import { useConjugationStore } from '@/features/conjugation/conjugationStore'
import type { ConjugationForm } from '@/features/conjugation/conjugationTypes'
import { useFavoritesStore } from '@/features/favorites/favoritesStore'
import { usePreferencesStore } from '@/features/preferences/preferencesStore'
import { allSets, getSetName, getWordsForSet, normalizeSelectableSetId } from '@/features/vocab/model/selectors'

const DEFAULT_FORMS: ConjugationForm[] = ['masu', 'te', 'ta', 'nai']
const COUNT_STEPS = [-8, -4, 4, 8] as const
const DEFAULT_PROMPT_MODE = 'japanese' as const

const ALL_FORMS: readonly ConjugationForm[] = [
  'masu',
  'te',
  'ta',
  'nai',
  'potential',
  'volitional',
  'imperative',
  'prohibitive',
] as const

function normalizeQuestionCount(questionCount: number) {
  return Math.max(1, Math.floor(questionCount) || 1)
}

export function ConjugationSetupPage() {
  const navigate = useNavigate()
  const favoriteIds = useFavoritesStore((state) => state.favoriteIds)
  const session = useConjugationStore((state) => state.session)
  const status = useConjugationStore((state) => state.status)
  const lastResult = useConjugationStore((state) => state.lastResult)
  const startSession = useConjugationStore((state) => state.startSession)
  const clearSession = useConjugationStore((state) => state.clearSession)
  const restartWrongQuestions = useConjugationStore((state) => state.restartWrongQuestions)
  const lastSelectedSetId = usePreferencesStore((state) => state.lastSelectedSetId)
  const setLastSelectedSetId = usePreferencesStore((state) => state.setLastSelectedSetId)
  const [questionCount, setQuestionCount] = useState(12)
  const [selectedForms, setSelectedForms] = useState<ConjugationForm[]>(DEFAULT_FORMS)
  const [error, setError] = useState<string | null>(null)
  const selectedSetId = normalizeSelectableSetId(lastSelectedSetId)

  useEffect(() => {
    if (selectedSetId !== lastSelectedSetId) {
      setLastSelectedSetId(selectedSetId)
    }
  }, [lastSelectedSetId, selectedSetId, setLastSelectedSetId])

  const normalizedQuestionCount = normalizeQuestionCount(questionCount)

  const availableWords = useMemo(
    () => getEligibleConjugationWords(getWordsForSet(selectedSetId, favoriteIds)),
    [favoriteIds, selectedSetId],
  )

  const previewQuestionCount = useMemo(
    () => getDistributedQuestionCount(availableWords, selectedForms, DEFAULT_PROMPT_MODE, normalizedQuestionCount),
    [availableWords, normalizedQuestionCount, selectedForms],
  )

  const canCreateExactCount = previewQuestionCount === normalizedQuestionCount

  function toggleForm(form: ConjugationForm) {
    setSelectedForms((current) => (current.includes(form) ? current.filter((value) => value !== form) : [...current, form]))
  }

  function handleStart() {
    if (selectedForms.length === 0) {
      setError('최소 1개의 활용형을 선택해 주세요.')
      return
    }

    if (previewQuestionCount === 0) {
      setError('선택한 세트에는 현재 활용 연습에 사용할 수 있는 동사가 없습니다.')
      return
    }

    if (!canCreateExactCount) {
      setError(`현재 설정으로는 ${normalizedQuestionCount}문제를 만들 수 없습니다. 최대 ${previewQuestionCount}문제까지 가능합니다.`)
      return
    }

    const started = startSession({
      setId: selectedSetId,
      setName: getSetName(selectedSetId),
      promptMode: DEFAULT_PROMPT_MODE,
      selectedForms,
      questionCount: normalizedQuestionCount,
      words: availableWords,
    })

    if (!started) {
      setError('세션을 시작하지 못했습니다. 설정을 다시 확인해 주세요.')
      return
    }

    setError(null)
    navigate('/conjugation/session')
  }

  return (
    <div className={styles.root}>
      <div className="page-header page-header--inline-action">
        <div className="page-header__left">
          <Tooltip label="메인으로 이동">
            <span>
              <IconButton icon={Undo2} label="메인으로 이동" onClick={() => navigate('/')} />
            </span>
          </Tooltip>
          <div className="page-header__meta">
            <p className="page-header__caption">{getSetName(selectedSetId)}</p>
            <h1 className="page-header__title">동사 활용 훈련</h1>
          </div>
        </div>
        <div className="page-header__right">
          <Tooltip label="세션 시작">
            <span>
              <IconButton icon={Play} label="세션 시작" size="lg" onClick={handleStart} />
            </span>
          </Tooltip>
        </div>
      </div>

      {status === 'active' && session ? (
        <GlassPanel className={styles.resumeBanner} variant="floating">
          <div>
            <p className="section-kicker">Resume</p>
            <h2 className="page-header__title">{session.setName} 활용 훈련이 진행 중입니다.</h2>
            <p className="page-header__caption">
              문제 {session.currentIndex + 1}/{session.questions.length}
            </p>
          </div>
          <div className={styles.resumeActions}>
            <Tooltip label="이어서 풀기">
              <span>
                <IconButton icon={RotateCcw} label="이어서 풀기" size="lg" onClick={() => navigate('/conjugation/session')} />
              </span>
            </Tooltip>
            <Tooltip label="세션 닫기">
              <span>
                <IconButton icon={X} label="세션 닫기" tone="danger" size="lg" onClick={clearSession} />
              </span>
            </Tooltip>
          </div>
        </GlassPanel>
      ) : null}

      {status !== 'active' && lastResult?.wrongItems.length ? (
        <GlassPanel className={styles.resumeBanner} variant="floating">
          <div>
            <p className="section-kicker">Retry</p>
            <h2 className="page-header__title">직전 오답 {lastResult.wrongItems.length}문제를 다시 풀 수 있습니다.</h2>
          </div>
          <Tooltip label="오답 다시 풀기">
            <span>
              <IconButton
                icon={RefreshCcw}
                label="오답 다시 풀기"
                size="lg"
                onClick={() => {
                  if (restartWrongQuestions()) {
                    navigate('/conjugation/session')
                  }
                }}
              />
            </span>
          </Tooltip>
        </GlassPanel>
      ) : null}

      <div className={styles.setupGrid}>
        <GlassPanel className={`setup-panel-shell ${styles.setupPanel}`} padding="lg" variant="strong">
          <div>
            <p className="section-kicker">Setup</p>
            <p className="section-copy">기본형, 읽기, 뜻을 함께 보고 지정된 활용형으로 바꾸는 훈련입니다.</p>
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="conjugation-set-select">학습 세트</label>
            <select
              id="conjugation-set-select"
              className="glass-select"
              value={selectedSetId}
              onChange={(event) => setLastSelectedSetId(event.target.value)}
            >
              <option value="all">전체 세트</option>
              <option value="favorites">즐겨찾기 단어</option>
              {allSets.map((set) => (
                <option key={set.id} value={set.id}>
                  {set.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="conjugation-count-input">문제 수</label>
            <div className={styles.countControl}>
              {COUNT_STEPS.map((step) => (
                <button
                  key={step}
                  type="button"
                  className="pill"
                  onClick={() => setQuestionCount((current) => normalizeQuestionCount(current + step))}
                >
                  {step > 0 ? `+${step}` : step}
                </button>
              ))}
              <input
                id="conjugation-count-input"
                className={`glass-input ${styles.countInput}`}
                type="number"
                min={1}
                value={normalizedQuestionCount}
                onChange={(event) => setQuestionCount(normalizeQuestionCount(Number(event.target.value)))}
              />
            </div>
            <p className="page-header__caption">
              활용 가능한 동사 {availableWords.length}개 기준으로 {canCreateExactCount
                ? `${normalizedQuestionCount}문제가 정확히 출제됩니다.`
                : `현재는 최대 ${previewQuestionCount}문제까지 만들 수 있습니다.`}
            </p>
          </div>

          <div className="form-field">
            <div>
              <div className="form-label">활용형 선택</div>
              <p className="page-header__caption">
                먼저 고르게 분배하고, 남는 문제는 가능한 활용형에 랜덤으로 1문제씩 추가합니다.
              </p>
            </div>
            <div className={styles.formGrid}>
              {ALL_FORMS.map((form) => (
                <button
                  key={form}
                  type="button"
                  className={`pill ${styles.formToggle}`}
                  data-active={selectedForms.includes(form)}
                  onClick={() => toggleForm(form)}
                >
                  {getConjugationFormLabel(form)}
                </button>
              ))}
            </div>
          </div>

          {error ? (
            <p className="page-header__caption" style={{ color: 'var(--accent-coral)' }}>
              {error}
            </p>
          ) : null}
        </GlassPanel>
      </div>
    </div>
  )
}
