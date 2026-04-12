import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import { Eraser, ScanSearch } from 'lucide-react'
import styles from '@/features/handwriting/handwriting.module.css'

const handwritingApiUrl = 'https://inputtools.google.com/request?itc=ja-t-i0-handwrit&app=translate'

type Stroke = [number[], number[], number[]]
type Point = { x: number; y: number }

type HandwritingPadProps = {
  onSelectCandidate: (text: string) => void
  disabled?: boolean
  hideStatus?: boolean
  extraActions?: ReactNode
}

export function HandwritingPad({
  onSelectCandidate,
  disabled = false,
  hideStatus = false,
  extraActions = null,
}: HandwritingPadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const strokesRef = useRef<Stroke[]>([])
  const currentStrokeRef = useRef<Point[]>([])
  const drawingRef = useRef(false)
  const [candidates, setCandidates] = useState<string[]>([])
  const [statusText, setStatusText] = useState('손글씨로 일본어를 써 보세요.')

  useEffect(() => {
    const canvasElement = canvasRef.current
    if (!canvasElement) return

    const context2d = canvasElement.getContext('2d')
    if (!context2d) return
    const canvas = canvasElement
    const context = context2d

    function redrawStrokes() {
      context.clearRect(0, 0, canvas.width, canvas.height)

      for (const [xPoints, yPoints] of strokesRef.current) {
        if (xPoints.length === 0 || yPoints.length === 0) continue

        context.beginPath()
        context.moveTo(xPoints[0] ?? 0, yPoints[0] ?? 0)

        for (let index = 1; index < xPoints.length; index += 1) {
          context.lineTo(xPoints[index] ?? 0, yPoints[index] ?? 0)
        }

        context.stroke()
      }
    }

    function resizeCanvas() {
      const rect = canvas.getBoundingClientRect()
      const deviceScale = window.devicePixelRatio || 1
      const strokeColor =
        getComputedStyle(document.documentElement).getPropertyValue('--handwriting-stroke').trim() || '#101418'

      canvas.width = Math.max(1, Math.round(rect.width * deviceScale))
      canvas.height = Math.max(1, Math.round(rect.height * deviceScale))
      context.setTransform(1, 0, 0, 1, 0, 0)
      context.scale(deviceScale, deviceScale)
      context.lineWidth = 3
      context.lineCap = 'round'
      context.lineJoin = 'round'
      context.strokeStyle = strokeColor
      redrawStrokes()
    }

    const observer = new ResizeObserver(() => resizeCanvas())
    observer.observe(canvas)
    resizeCanvas()

    return () => observer.disconnect()
  }, [])

  function clearCanvas() {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (canvas && context) {
      context.clearRect(0, 0, canvas.width, canvas.height)
    }

    strokesRef.current = []
    currentStrokeRef.current = []
    setCandidates([])
    setStatusText('지웠습니다.')
  }

  function getPoint(event: ReactPointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    }
  }

  async function recognize() {
    const canvas = canvasRef.current
    if (!canvas || strokesRef.current.length === 0 || disabled) return

    setStatusText('인식 중...')

    const payload = JSON.stringify({
      app_version: 0.4,
      api_level: '537.36',
      device: window.navigator.userAgent,
      input_type: 0,
      options: 'enable_pre_space',
      requests: [{
        writing_guide: {
          writing_area_width: canvas.clientWidth,
          writing_area_height: canvas.clientHeight,
        },
        pre_context: '',
        max_num_results: 10,
        max_completions: 0,
        language: 'ja',
        ink: strokesRef.current,
      }],
    })

    try {
      const response = await fetch(handwritingApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
      })
      const result = await response.json()
      const nextCandidates = result[0] === 'SUCCESS' && result[1]?.[0]?.[1]
        ? result[1][0][1].filter((value: unknown): value is string => typeof value === 'string')
        : []

      setCandidates(nextCandidates)
      setStatusText(nextCandidates.length > 0 ? '후보를 눌러 답으로 넣으세요.' : '인식 결과가 없습니다.')
    } catch (error) {
      console.error('Handwriting recognition failed:', error)
      setCandidates([])
      setStatusText('손글씨 인식에 실패했습니다.')
    }
  }

  return (
    <div className={styles.root}>
      <div className={styles.canvasWrap}>
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          onPointerDown={(event) => {
            if (disabled) return

            const context = canvasRef.current?.getContext('2d')
            if (!context) return

            const point = getPoint(event)
            drawingRef.current = true
            currentStrokeRef.current = [point]
            setStatusText('글자를 다 쓴 뒤 인식을 눌러 주세요.')
            event.currentTarget.setPointerCapture(event.pointerId)

            context.beginPath()
            context.moveTo(point.x, point.y)
          }}
          onPointerMove={(event) => {
            if (disabled || !drawingRef.current) return

            const context = canvasRef.current?.getContext('2d')
            if (!context) return

            const point = getPoint(event)
            currentStrokeRef.current = [...currentStrokeRef.current, point]
            context.lineTo(point.x, point.y)
            context.stroke()
          }}
          onPointerUp={(event) => {
            if (!drawingRef.current) return

            drawingRef.current = false
            event.currentTarget.releasePointerCapture(event.pointerId)

            if (currentStrokeRef.current.length === 0) return

            const xPoints = currentStrokeRef.current.map((point) => Math.round(point.x))
            const yPoints = currentStrokeRef.current.map((point) => Math.round(point.y))
            strokesRef.current = [...strokesRef.current, [xPoints, yPoints, []]]
            currentStrokeRef.current = []
          }}
          onPointerCancel={() => {
            drawingRef.current = false
            currentStrokeRef.current = []
          }}
        />
      </div>

      <div className={styles.actions}>
        <div className={styles.buttonRow}>
          <button type="button" className={styles.actionButton} onClick={() => void recognize()} disabled={disabled}>
            <ScanSearch size={18} />
            <span>인식</span>
          </button>
          <button type="button" className={styles.actionButton} onClick={clearCanvas} disabled={disabled}>
            <Eraser size={18} />
            <span>지우기</span>
          </button>
        </div>
        {extraActions}
        {!hideStatus ? <p className={styles.status}>{statusText}</p> : null}
      </div>

      {candidates.length > 0 ? (
        <div className={styles.candidateRow}>
          {candidates.map((candidate) => (
            <button
              key={candidate}
              type="button"
              className={styles.candidateButton}
              onClick={() => {
                onSelectCandidate(candidate)
                clearCanvas()
              }}
              disabled={disabled}
            >
              {candidate}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
