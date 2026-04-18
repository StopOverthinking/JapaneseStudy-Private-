import { type ChangeEvent, useMemo } from 'react'
import { ArrowLeft, ArrowRight, Bug, CalendarDays, Crown, RotateCcw, StepBack, StepForward } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { GlassPanel } from '@/components/GlassPanel'
import { IconButton } from '@/components/IconButton'
import { Tooltip } from '@/components/Tooltip'
import {
  formatDebugDateInputValue,
  formatDebugDateLabel,
  formatDebugOffsetLabel,
  getDayOffsetFromDateInput,
  useDebugDateStore,
} from '@/features/debug/debugDateStore'
import styles from '@/features/debug/debug.module.css'

const DEBUG_STEP_BUTTONS = [
  { delta: -30, label: '-30', icon: StepBack },
  { delta: -7, label: '-7', icon: StepBack },
  { delta: -1, label: '-1', icon: ArrowLeft },
  { delta: 1, label: '+1', icon: ArrowRight },
  { delta: 7, label: '+7', icon: StepForward },
  { delta: 30, label: '+30', icon: StepForward },
] as const

export function DebugPage() {
  const navigate = useNavigate()
  const dayOffset = useDebugDateStore((state) => state.dayOffset)
  const godMode = useDebugDateStore((state) => state.godMode)
  const setDayOffset = useDebugDateStore((state) => state.setDayOffset)
  const shiftDayOffset = useDebugDateStore((state) => state.shiftDayOffset)
  const resetDayOffset = useDebugDateStore((state) => state.resetDayOffset)
  const toggleGodMode = useDebugDateStore((state) => state.toggleGodMode)

  const simulatedDateLabel = useMemo(() => formatDebugDateLabel(dayOffset), [dayOffset])
  const simulatedDateInputValue = useMemo(() => formatDebugDateInputValue(dayOffset), [dayOffset])
  const offsetLabel = useMemo(() => formatDebugOffsetLabel(dayOffset), [dayOffset])
  const todayDateInputValue = useMemo(() => formatDebugDateInputValue(0), [])

  function handleDateChange(event: ChangeEvent<HTMLInputElement>) {
    setDayOffset(getDayOffsetFromDateInput(event.target.value))
  }

  return (
    <div className={styles.root}>
      <div className="page-header page-header--inline-action">
        <div className="page-header__left">
          <Tooltip label="뒤로">
            <span>
              <IconButton icon={ArrowLeft} label="뒤로" onClick={() => navigate('/')} />
            </span>
          </Tooltip>
          <div className="page-header__meta">
            <p className="page-header__caption">스마트 복습</p>
            <h1 className="page-header__title">디버그</h1>
          </div>
        </div>
      </div>

      <GlassPanel className={styles.panel} padding="lg" variant="strong">
        <div className={styles.panelTop}>
          <div>
            <span className={styles.badge}>
              <Bug size={16} />
              <strong>{offsetLabel}</strong>
            </span>
            <p className={styles.dateValue}>{simulatedDateLabel}</p>
          </div>

          <Tooltip label="실시간으로 되돌리기">
            <span>
              <IconButton icon={RotateCcw} label="실시간으로 되돌리기" size="lg" onClick={resetDayOffset} />
            </span>
          </Tooltip>
        </div>

        <label className="form-field">
          <span className="form-label">기준 날짜</span>
          <input
            type="date"
            className={`glass-input ${styles.dateInput}`}
            value={simulatedDateInputValue}
            max="2099-12-31"
            min="2000-01-01"
            onChange={handleDateChange}
          />
        </label>

        <div className={styles.adjustGrid}>
          {DEBUG_STEP_BUTTONS.map((button) => {
            const Icon = button.icon

            return (
              <button
                key={`debug-shift-${button.label}`}
                type="button"
                className={`pill ${styles.adjustButton}`}
                onClick={() => shiftDayOffset(button.delta)}
              >
                <Icon size={14} />
                <span>{button.label}</span>
              </button>
            )
          })}

          <button
            type="button"
            className={`pill ${styles.adjustButton}`}
            data-active={dayOffset === 0}
            onClick={resetDayOffset}
          >
            <CalendarDays size={14} />
            <span>오늘</span>
          </button>
        </div>

        <div className={styles.metaGrid}>
          <GlassPanel className={styles.metaCard} padding="sm">
            <span className={styles.metaLabel}>실제</span>
            <strong className={styles.metaValue}>{formatDebugDateLabel(0)}</strong>
          </GlassPanel>
          <GlassPanel className={styles.metaCard} padding="sm">
            <span className={styles.metaLabel}>입력값</span>
            <strong className={styles.metaValue}>{dayOffset === 0 ? todayDateInputValue : simulatedDateInputValue}</strong>
          </GlassPanel>
        </div>

        <GlassPanel className={styles.modeCard} padding="sm" variant="floating">
          <div className={styles.modeHeader}>
            <div className={styles.modeTitle}>
              <span className={styles.badge}>
                <Crown size={16} />
                <strong>갓 모드</strong>
              </span>
              <p className="page-header__caption">스마트 복습에서 정답과 오답을 바로 누릅니다.</p>
            </div>
            <button
              type="button"
              className={`pill ${styles.modeToggle}`}
              data-active={godMode}
              aria-pressed={godMode}
              onClick={toggleGodMode}
            >
              <span>{godMode ? '켜짐' : '꺼짐'}</span>
            </button>
          </div>
        </GlassPanel>
      </GlassPanel>
    </div>
  )
}
