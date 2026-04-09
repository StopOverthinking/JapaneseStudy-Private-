import { useMemo, useState } from 'react'
import { Play, Undo2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { GlassPanel } from '@/components/GlassPanel'
import { IconButton } from '@/components/IconButton'
import { Tooltip } from '@/components/Tooltip'
import {
  calculateBotSettings,
  getModeLabel,
  getQuestionCount,
  getQuizTypeLabel,
  getRomanNumeral,
  getTierInfo,
} from '@/features/game/gameEngine'
import { loadBotHistory, loadPlayerMmr, loadPlayerNickname, loadSingleModeRecords, savePlayerNickname } from '@/features/game/gameStorage'
import { useGameStore } from '@/features/game/gameStore'
import type { GameMode, GameQuizType } from '@/features/game/gameTypes'
import { buildCandidateWords } from '@/features/study/wordSelection'
import { allWords, getSetName } from '@/features/vocab/model/selectors'
import styles from '@/features/game/game.module.css'

type SelectionState = {
  mode: GameMode
  quizType: GameQuizType
}

const initialSelection: SelectionState = {
  mode: 'single',
  quizType: 'objective',
}

const modeCards: Array<{
  mode: GameMode
  quizType: GameQuizType
  title: string
  description: string
}> = [
  { mode: 'single', quizType: 'objective', title: '싱글 · 객관식', description: '30문제를 빠르게 풀고 최고 점수를 갱신합니다.' },
  { mode: 'single', quizType: 'pronunciation', title: '싱글 · 발음 입력', description: '일본어 단어를 보고 읽기를 직접 입력합니다.' },
  { mode: 'bot', quizType: 'objective', title: '멀티 · 객관식', description: '상대와 점수 레이스를 벌입니다.' },
  { mode: 'bot', quizType: 'pronunciation', title: '멀티 · 발음 입력', description: '발음 입력 속도와 정확도로 상대와 경쟁합니다.' },
]

export function GameSetupPage() {
  const navigate = useNavigate()
  const startGame = useGameStore((state) => state.startGame)
  const [selection, setSelection] = useState(initialSelection)
  const [playerName, setPlayerName] = useState(loadPlayerNickname() || '플레이어')
  const [error, setError] = useState<string | null>(null)

  const availableWords = useMemo(() => allWords, [])

  const targetQuestionCount = getQuestionCount(selection.quizType)
  const previewWords = useMemo(
    () => buildCandidateWords(availableWords, targetQuestionCount),
    [availableWords, targetQuestionCount],
  )

  const singleRecords = useMemo(
    () => loadSingleModeRecords(selection.quizType),
    [selection.quizType],
  )

  const currentMmr = useMemo(
    () => loadPlayerMmr(selection.quizType),
    [selection.quizType],
  )

  const tierInfo = useMemo(
    () => getTierInfo(currentMmr),
    [currentMmr],
  )

  const opponentPreview = useMemo(
    () => calculateBotSettings(selection.quizType, loadBotHistory(selection.quizType), () => 0.5),
    [selection.quizType],
  )

  const selectedLabel = `${getModeLabel(selection.mode)} · ${getQuizTypeLabel(selection.quizType)}`

  const handleStart = () => {
    if (selection.quizType === 'objective' && availableWords.length < 5) {
      setError('객관식 모드는 최소 5개의 단어가 필요합니다.')
      return
    }

    if (previewWords.length === 0) {
      setError('선택한 조건으로는 게임을 시작할 수 없습니다.')
      return
    }

    const normalizedName = playerName.trim() || '플레이어'
    savePlayerNickname(normalizedName)
    setError(null)

    startGame({
      setId: 'all',
      setName: getSetName('all'),
      mode: selection.mode,
      quizType: selection.quizType,
      playerName: normalizedName,
      sourceWords: availableWords,
    })
    navigate('/game/session')
  }

  return (
    <div className={styles.root}>
      <div className="page-header">
        <div className="page-header__left">
          <Tooltip label="홈으로 돌아가기">
            <span>
              <IconButton icon={Undo2} label="홈으로 돌아가기" onClick={() => navigate('/')} />
            </span>
          </Tooltip>
          <div className="page-header__meta">
            <p className="page-header__caption">Game Mode</p>
            <h1 className="page-header__title">게임 모드 설정</h1>
          </div>
        </div>
        <div className="page-header__right">
          <Tooltip label="게임 시작">
            <span>
              <IconButton icon={Play} label="게임 시작" size="lg" onClick={handleStart} />
            </span>
          </Tooltip>
        </div>
      </div>

      <div className={styles.setupGrid}>
        <GlassPanel className={styles.setupMain} padding="lg" variant="strong">
          <div>
            <p className="section-kicker">Mode</p>
            <h2 className="section-title">{selectedLabel}</h2>
            <p className="section-copy">모드를 고르고 플레이어 이름을 입력하면 바로 대전을 시작할 수 있습니다.</p>
          </div>

          <div className={styles.modeGrid}>
            {modeCards.map((card) => {
              const isActive = card.mode === selection.mode && card.quizType === selection.quizType
              return (
                <button
                  key={`${card.mode}-${card.quizType}`}
                  type="button"
                  className={styles.modeCard}
                  data-active={isActive}
                  onClick={() => setSelection({ mode: card.mode, quizType: card.quizType })}
                >
                  <h3 className={styles.modeTitle}>{card.title}</h3>
                  <p className={styles.modeCopy}>{card.description}</p>
                  <span className={styles.statusPill}>{getQuestionCount(card.quizType)}문제</span>
                </button>
              )
            })}
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="game-player-name">플레이어 이름</label>
            <input
              id="game-player-name"
              className="glass-input"
              type="text"
              maxLength={20}
              value={playerName}
              onChange={(event) => setPlayerName(event.target.value)}
            />
          </div>

          {error ? <p className="page-header__caption" style={{ color: 'var(--accent-coral)' }}>{error}</p> : null}
        </GlassPanel>

        <div className={styles.setupAside}>
          <GlassPanel className={styles.recordsPanel} padding="lg">
            <div>
              <p className="section-kicker">{selection.mode === 'single' ? 'Records' : 'Ladder'}</p>
              <h2 className="page-header__title">
                {selection.mode === 'single' ? `${getQuizTypeLabel(selection.quizType)} 기록` : `${getQuizTypeLabel(selection.quizType)} 티어`}
              </h2>
            </div>

            {selection.mode === 'single' ? (
              <div className={styles.recordList}>
                {singleRecords.length > 0 ? singleRecords.map((record, index) => (
                  <div key={`${record.date}-${record.score}-${index}`} className={styles.recordItem}>
                    <div className={styles.recordTop}>
                      <strong>#{index + 1}</strong>
                      <span>{record.date}</span>
                    </div>
                    <strong>{record.score}점</strong>
                    <span>평균 {record.time.toFixed(2)}초</span>
                  </div>
                )) : <p className={styles.softText}>아직 저장된 기록이 없습니다.</p>}
              </div>
            ) : (
              <>
                <div className={styles.tierHero}>
                  <div className={styles.tierBadge} style={{ backgroundColor: tierInfo.color }}>
                    {tierInfo.name[0]}
                  </div>
                  <div>
                    <strong>{tierInfo.name} {getRomanNumeral(tierInfo.division)}</strong>
                    <p className={styles.softText}>
                      {tierInfo.name === 'Champion' ? `${tierInfo.lp} LP` : `${tierInfo.lp} / 100 LP`}
                    </p>
                    <p className={styles.softText}>현재 MMR {currentMmr}</p>
                  </div>
                </div>

                <div className={styles.summaryCard}>
                  <div className="form-label">상대 예상 전력</div>
                  <p className={styles.summaryLine}>평균 풀이 속도 기준: {opponentPreview.baseTime.toFixed(2)}초</p>
                  <p className={styles.summaryLine}>예상 정답률: {(opponentPreview.accuracy * 100).toFixed(0)}%</p>
                  <p className={styles.summaryLine}>예상 레이팅: {opponentPreview.rating}</p>
                </div>
              </>
            )}
          </GlassPanel>
        </div>
      </div>
    </div>
  )
}
