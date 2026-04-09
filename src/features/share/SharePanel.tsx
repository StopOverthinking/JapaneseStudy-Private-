import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  ClipboardCopy,
  ClipboardPaste,
  Download,
  FileUp,
  QrCode,
  ScanSearch,
  X,
} from 'lucide-react'
import { GlassPanel } from '@/components/GlassPanel'
import { IconButton } from '@/components/IconButton'
import {
  QR_SHARE_AUTOPLAY_MS,
  applyImportedBackup,
  buildQrShareFrames,
  createQrImportSession,
  createQrMarkup,
  decodeQrImportSession,
  downloadShareData,
  getQrImportReceivedCount,
  getShareDataText,
  isQrImportComplete,
  mergeQrImportFrame,
  parseQrTransferFrame,
  parseRestorePayload,
  type QrImportSession,
  type QrShareFrames,
} from '@/features/share/share'
import styles from '@/features/share/share.module.css'

type ShareStatus = {
  tone: 'success' | 'info' | 'error'
  message: string
}

type QrShareViewState = QrShareFrames & {
  currentIndex: number
  svgFrames: string[]
}

type SharePanelProps = {
  mode?: 'panel' | 'submenu'
}

type BarcodeResultLike = {
  rawValue?: string
}

type BarcodeDetectorLike = {
  detect: (source: HTMLVideoElement) => Promise<BarcodeResultLike[]>
}

type BarcodeDetectorCtor = new (options?: { formats?: string[] }) => BarcodeDetectorLike

type QrImportProgress = {
  received: number
  total: number
}

const shareActions = [
  {
    id: 'clipboard-export',
    title: '클립보드로 복사',
    description: '현재 React 데이터 백업 JSON을 클립보드에 복사합니다.',
    icon: ClipboardCopy,
  },
  {
    id: 'file-export',
    title: 'JSON 다운로드',
    description: 'React 백업 파일을 저장해 다른 기기에서도 복원할 수 있습니다.',
    icon: Download,
  },
  {
    id: 'qr-export',
    title: 'QR 코드 공유',
    description: '여러 장의 QR 프레임으로 백업 JSON을 전송합니다.',
    icon: QrCode,
  },
  {
    id: 'clipboard-import',
    title: '클립보드 가져오기',
    description: '복사해 둔 React 또는 기존 웹 버전 백업 JSON을 복원합니다.',
    icon: ClipboardPaste,
  },
  {
    id: 'file-import',
    title: '파일 가져오기',
    description: '저장된 백업 JSON 파일을 읽어 현재 React 데이터를 교체합니다.',
    icon: FileUp,
  },
  {
    id: 'qr-import',
    title: 'QR 코드 가져오기',
    description: '카메라로 공유 QR을 읽어 백업 데이터를 복원합니다.',
    icon: ScanSearch,
  },
] as const

export function SharePanel({ mode = 'panel' }: SharePanelProps) {
  const [status, setStatus] = useState<ShareStatus | null>(null)
  const [manualCopyText, setManualCopyText] = useState<string | null>(null)
  const [manualImportText, setManualImportText] = useState('')
  const [isManualImportOpen, setIsManualImportOpen] = useState(false)
  const [qrShare, setQrShare] = useState<QrShareViewState | null>(null)
  const [isQrOpen, setIsQrOpen] = useState(false)
  const [isQrLoading, setIsQrLoading] = useState(false)
  const [qrError, setQrError] = useState<string | null>(null)
  const [isQrImportOpen, setIsQrImportOpen] = useState(false)
  const [qrImportStatus, setQrImportStatus] = useState('공유 중인 QR 코드를 카메라 안에 맞춰 주세요.')
  const [qrImportError, setQrImportError] = useState<string | null>(null)
  const [qrImportProgress, setQrImportProgress] = useState<QrImportProgress | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const qrImportVideoRef = useRef<HTMLVideoElement | null>(null)
  const qrImportDetectorRef = useRef<BarcodeDetectorLike | null>(null)
  const qrImportStreamRef = useRef<MediaStream | null>(null)
  const qrImportFrameRequestRef = useRef<number | null>(null)
  const qrImportLastScanAtRef = useRef(0)
  const qrImportSessionRef = useRef<QrImportSession | null>(null)
  const qrImportDecodingRef = useRef(false)

  useEffect(() => {
    if (!isQrOpen || !qrShare || qrShare.frames.length <= 1) {
      return
    }

    const intervalId = window.setInterval(() => {
      setQrShare((current) => {
        if (!current || current.frames.length <= 1) return current

        return {
          ...current,
          currentIndex: (current.currentIndex + 1) % current.frames.length,
        }
      })
    }, QR_SHARE_AUTOPLAY_MS)

    return () => window.clearInterval(intervalId)
  }, [isQrOpen, qrShare?.frames.length, qrShare?.sessionId])

  useEffect(() => {
    if (!isQrOpen && !manualCopyText && !isManualImportOpen && !isQrImportOpen) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return

      if (manualCopyText) {
        setManualCopyText(null)
        return
      }

      if (isManualImportOpen) {
        setIsManualImportOpen(false)
        return
      }

      if (isQrImportOpen) {
        handleCloseQrImport()
        return
      }

      setIsQrOpen(false)
      setQrShare(null)
      setQrError(null)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isManualImportOpen, isQrImportOpen, isQrOpen, manualCopyText])

  useEffect(() => {
    return () => {
      stopQrImportScanner()
    }
  }, [])

  useEffect(() => {
    if (!isQrImportOpen) {
      stopQrImportScanner()
      return
    }

    let cancelled = false

    async function startQrImport() {
      resetQrImportSession('카메라를 준비하고 있습니다.')

      if (!navigator.mediaDevices?.getUserMedia) {
        setQrImportError('이 브라우저는 카메라 QR 가져오기를 지원하지 않습니다.')
        setQrImportStatus('다른 가져오기 방식을 사용해 주세요.')
        return
      }

      const DetectorCtor = (window as Window & { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector
      if (!DetectorCtor) {
        setQrImportError('이 브라우저는 QR 카메라 스캔을 지원하지 않습니다.')
        setQrImportStatus('클립보드나 파일 가져오기를 사용해 주세요.')
        return
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
          },
          audio: false,
        })

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }

        qrImportStreamRef.current = stream
        qrImportDetectorRef.current = new DetectorCtor({ formats: ['qr_code'] })

        const video = qrImportVideoRef.current
        if (!video) {
          throw new Error('QR import preview is not available.')
        }

        video.srcObject = stream
        await video.play()
        setQrImportStatus('공유 중인 QR 코드를 카메라 안에 맞춰 주세요.')
        scheduleQrImportScan()
      } catch (error) {
        setQrImportError(error instanceof Error ? error.message : '카메라를 열 수 없습니다.')
        setQrImportStatus('카메라 준비에 실패했습니다.')
      }
    }

    void startQrImport()

    return () => {
      cancelled = true
      stopQrImportScanner()
    }
  }, [isQrImportOpen])

  function stopQrImportScanner() {
    if (qrImportFrameRequestRef.current !== null) {
      window.cancelAnimationFrame(qrImportFrameRequestRef.current)
      qrImportFrameRequestRef.current = null
    }

    if (qrImportStreamRef.current) {
      qrImportStreamRef.current.getTracks().forEach((track) => track.stop())
      qrImportStreamRef.current = null
    }

    if (qrImportVideoRef.current?.srcObject) {
      qrImportVideoRef.current.srcObject = null
    }

    qrImportDetectorRef.current = null
    qrImportSessionRef.current = null
    qrImportLastScanAtRef.current = 0
    qrImportDecodingRef.current = false
  }

  function resetQrImportSession(message = '공유 중인 QR 코드를 카메라 안에 맞춰 주세요.') {
    qrImportSessionRef.current = null
    qrImportLastScanAtRef.current = 0
    qrImportDecodingRef.current = false
    setQrImportError(null)
    setQrImportProgress(null)
    setQrImportStatus(message)
  }

  function scheduleQrImportScan() {
    if (qrImportFrameRequestRef.current !== null) {
      return
    }

    qrImportFrameRequestRef.current = window.requestAnimationFrame(() => {
      qrImportFrameRequestRef.current = null
      void scanQrFrame()
    })
  }

  async function scanQrFrame() {
    if (!isQrImportOpen || qrImportDecodingRef.current) {
      return
    }

    const detector = qrImportDetectorRef.current
    const video = qrImportVideoRef.current
    if (!detector || !video) {
      return
    }

    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      scheduleQrImportScan()
      return
    }

    const now = performance.now()
    if (now - qrImportLastScanAtRef.current < 240) {
      scheduleQrImportScan()
      return
    }

    qrImportLastScanAtRef.current = now

    try {
      const barcodes = await detector.detect(video)
      for (const barcode of barcodes) {
        if (typeof barcode.rawValue === 'string') {
          await processQrImportFrame(barcode.rawValue)
        }
      }
    } catch {
      // Ignore detector misses and keep scanning.
    }

    if (isQrImportOpen && !qrImportDecodingRef.current) {
      scheduleQrImportScan()
    }
  }

  async function processQrImportFrame(rawValue: string) {
    const frame = parseQrTransferFrame(rawValue)
    if (!frame) return

    const currentSession = qrImportSessionRef.current
    const nextSession = currentSession
      ? mergeQrImportFrame(currentSession, frame)
      : createQrImportSession(frame)

    if (!nextSession) {
      setQrImportError('다른 공유 세션이 감지되었습니다. QR 공유를 다시 시작해 주세요.')
      return
    }

    qrImportSessionRef.current = nextSession
    setQrImportError(null)
    setQrImportProgress({
      received: getQrImportReceivedCount(nextSession),
      total: nextSession.total,
    })
    setQrImportStatus(`${getQrImportReceivedCount(nextSession)} / ${nextSession.total}장 수집됨`)

    if (!isQrImportComplete(nextSession) || qrImportDecodingRef.current) {
      return
    }

    qrImportDecodingRef.current = true
    setQrImportStatus('QR 데이터를 복원 중입니다.')

    try {
      const text = await decodeQrImportSession(nextSession)
      const restored = await handleRestoreText(text, 'QR 코드')
      if (!restored) {
        qrImportDecodingRef.current = false
        setQrImportStatus('복원이 취소되었습니다. 다시 스캔하려면 재설정을 눌러 주세요.')
      }
    } catch (error) {
      qrImportDecodingRef.current = false
      setQrImportError(error instanceof Error ? error.message : 'QR 데이터를 복원하지 못했습니다.')
      setQrImportStatus('QR 데이터를 복원하지 못했습니다.')
    }
  }

  async function handleRestoreText(rawText: string, sourceLabel: string) {
    const parsed = parseRestorePayload(rawText)
    if (!parsed.ok) {
      setStatus({
        tone: 'error',
        message: parsed.error,
      })
      return false
    }

    const details = [`${sourceLabel}에서 ${parsed.keyCount}개 항목을 복원합니다.`]

    if (parsed.metadata.app) {
      details.push(`백업 출처: ${parsed.metadata.app}`)
    }

    if (parsed.metadata.exportedAt) {
      details.push(`백업 시각: ${new Date(parsed.metadata.exportedAt).toLocaleString()}`)
    }

    details.push('현재 React 버전 데이터는 교체됩니다.')

    const confirmed = window.confirm(details.join('\n'))
    if (!confirmed) {
      setStatus({
        tone: 'info',
        message: '데이터 복원을 취소했습니다.',
      })
      return false
    }

    applyImportedBackup(parsed.data)
    window.location.reload()
    return true
  }

  const handleCopy = async () => {
    const dataText = getShareDataText()

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error('Clipboard API is unavailable.')
      }

      await navigator.clipboard.writeText(dataText)
      setStatus({
        tone: 'success',
        message: 'React 백업 JSON을 클립보드에 복사했습니다.',
      })
    } catch {
      setManualCopyText(dataText)
      setStatus({
        tone: 'info',
        message: '자동 복사가 막혀 수동 복사 창을 열었습니다.',
      })
    }
  }

  const handleDownload = () => {
    downloadShareData(getShareDataText())
    setStatus({
      tone: 'success',
      message: '백업 JSON 다운로드를 시작했습니다.',
    })
  }

  const handleOpenQr = async () => {
    const dataText = getShareDataText()

    setIsQrOpen(true)
    setIsQrLoading(true)
    setQrError(null)
    setQrShare(null)

    try {
      const frames = await buildQrShareFrames(dataText)
      const svgFrames = await Promise.all(frames.frames.map((frame) => createQrMarkup(frame)))

      setQrShare({
        ...frames,
        currentIndex: 0,
        svgFrames,
      })
      setStatus({
        tone: 'success',
        message: 'QR 공유 화면을 준비했습니다.',
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'QR 코드를 준비하지 못했습니다.'
      setQrError(message)
      setStatus({
        tone: 'error',
        message: `QR 공유 준비에 실패했습니다: ${message}`,
      })
    } finally {
      setIsQrLoading(false)
    }
  }

  const handleImportClipboard = async () => {
    try {
      if (!navigator.clipboard?.readText) {
        throw new Error('Clipboard read is unavailable.')
      }

      const text = await navigator.clipboard.readText()
      if (!text.trim()) {
        setStatus({
          tone: 'error',
          message: '클립보드에 복원할 텍스트가 없습니다.',
        })
        return
      }

      await handleRestoreText(text, '클립보드')
    } catch {
      setManualImportText('')
      setIsManualImportOpen(true)
      setStatus({
        tone: 'info',
        message: '클립보드 읽기가 막혀 수동 붙여넣기 창을 열었습니다.',
      })
    }
  }

  const handleImportFileClick = () => {
    fileInputRef.current?.click()
  }

  const handleImportFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    try {
      const text = await file.text()
      await handleRestoreText(text, file.name)
    } catch (error) {
      setStatus({
        tone: 'error',
        message: error instanceof Error ? error.message : '백업 파일을 읽지 못했습니다.',
      })
    }
  }

  const handleOpenQrImport = () => {
    setIsQrImportOpen(true)
  }

  const handleCloseQr = () => {
    setIsQrOpen(false)
    setQrShare(null)
    setQrError(null)
  }

  const handleCloseQrImport = () => {
    stopQrImportScanner()
    setIsQrImportOpen(false)
    setQrImportError(null)
    setQrImportProgress(null)
    setQrImportStatus('공유 중인 QR 코드를 카메라 안에 맞춰 주세요.')
  }

  const handleShiftFrame = (delta: number) => {
    setQrShare((current) => {
      if (!current) return current

      const nextIndex = (current.currentIndex + delta + current.frames.length) % current.frames.length
      return {
        ...current,
        currentIndex: nextIndex,
      }
    })
  }

  const handleManualImportSubmit = async () => {
    if (!manualImportText.trim()) {
      setStatus({
        tone: 'error',
        message: '붙여넣은 백업 JSON이 비어 있습니다.',
      })
      return
    }

    await handleRestoreText(manualImportText, '붙여넣은 텍스트')
  }

  const renderActionButtons = (compact: boolean) => (
    <div className={compact ? styles.submenuGrid : styles.cardGrid}>
      {shareActions.map((action) => {
        const Icon = action.icon

        let onClick: (() => void | Promise<void>) = handleCopy
        if (action.id === 'file-export') onClick = handleDownload
        if (action.id === 'qr-export') onClick = handleOpenQr
        if (action.id === 'clipboard-import') onClick = handleImportClipboard
        if (action.id === 'file-import') onClick = handleImportFileClick
        if (action.id === 'qr-import') onClick = handleOpenQrImport

        return (
          <button
            key={action.id}
            type="button"
            className={compact ? styles.submenuButton : styles.shareCard}
            onClick={() => void onClick()}
          >
            <span className={compact ? styles.submenuIcon : styles.shareIcon}>
              <Icon size={compact ? 20 : 24} strokeWidth={1.9} />
            </span>
            <div className={compact ? styles.submenuMeta : styles.shareMeta}>
              <strong>{action.title}</strong>
              <p>{action.description}</p>
            </div>
          </button>
        )
      })}
    </div>
  )

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(event) => void handleImportFileChange(event)}
      />

      {mode === 'submenu' ? (
        <GlassPanel className={styles.submenu} padding="md" variant="floating">
          <div className={styles.submenuHeader}>
            <div>
              <p className="section-kicker">Share</p>
              <h2 className="page-header__title">공유 메뉴</h2>
            </div>
            <p className="page-header__caption">백업 내보내기와 복원을 한 자리에서 처리할 수 있습니다.</p>
          </div>
          {renderActionButtons(true)}
          {status ? (
            <p className={styles.status} data-tone={status.tone}>
              {status.message}
            </p>
          ) : null}
        </GlassPanel>
      ) : (
        <GlassPanel className={styles.panel} padding="lg" variant="strong">
          <div className={styles.header}>
            <div>
              <p className="section-kicker">Share</p>
              <h2 className="page-header__title">데이터 백업과 복원</h2>
              <p className="page-header__caption">React 백업과 기존 웹 버전 백업을 모두 불러올 수 있습니다.</p>
            </div>
          </div>

          {renderActionButtons(false)}

          <p className={styles.helper}>복원은 현재 `jsp-react:` 데이터를 교체하며, 기존 웹 버전 백업의 즐겨찾기와 오답 노트도 변환해 가져옵니다.</p>
          {status ? (
            <p className={styles.status} data-tone={status.tone}>
              {status.message}
            </p>
          ) : null}
        </GlassPanel>
      )}

      {isQrOpen ? (
        <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="qr-share-title" onClick={handleCloseQr}>
          <GlassPanel
            className={styles.modal}
            padding="lg"
            variant="strong"
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <div>
                <p className="section-kicker">QR Share</p>
                <h2 id="qr-share-title" className="page-header__title">QR 코드로 공유</h2>
                <p className="page-header__caption">다른 기기에서 QR 가져오기를 열고 순서대로 스캔해 주세요.</p>
              </div>
              <IconButton icon={X} label="QR 공유 닫기" onClick={handleCloseQr} />
            </div>

            {isQrLoading ? (
              <div className={styles.qrLoading}>
                <p>QR 코드를 만드는 중입니다.</p>
              </div>
            ) : qrError ? (
              <div className={styles.qrLoading}>
                <p>{qrError}</p>
              </div>
            ) : qrShare ? (
              <>
                <div className={styles.qrFrame}>
                  <div
                    className={styles.qrSvg}
                    aria-label="공유용 QR 코드"
                    dangerouslySetInnerHTML={{ __html: qrShare.svgFrames[qrShare.currentIndex] ?? '' }}
                  />
                </div>
                <div className={styles.qrMeta}>
                  <span className="miniChip">
                    {qrShare.currentIndex + 1} / {qrShare.frames.length}
                  </span>
                  <span className="miniChip">
                    {qrShare.encoding === 'gzip' ? 'gzip 압축' : '원본 전송'} · {qrShare.rawBytes}B → {qrShare.encodedBytes}B
                  </span>
                </div>
                <p className={styles.qrCaption}>
                  {qrShare.frames.length > 1
                    ? '프레임이 여러 장이면 자동으로 넘어갑니다. 상대 기기에서 순서대로 스캔해 주세요.'
                    : '한 장짜리 QR 코드입니다. 상대 기기에서 바로 스캔하면 됩니다.'}
                </p>
                <div className={styles.modalActions}>
                  <IconButton
                    icon={ChevronLeft}
                    label="이전 QR 프레임"
                    onClick={() => handleShiftFrame(-1)}
                    disabled={qrShare.frames.length <= 1}
                  />
                  <IconButton
                    icon={ChevronRight}
                    label="다음 QR 프레임"
                    onClick={() => handleShiftFrame(1)}
                    disabled={qrShare.frames.length <= 1}
                  />
                </div>
              </>
            ) : null}
          </GlassPanel>
        </div>
      ) : null}

      {isQrImportOpen ? (
        <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="qr-import-title" onClick={handleCloseQrImport}>
          <GlassPanel
            className={styles.modal}
            padding="lg"
            variant="strong"
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <div>
                <p className="section-kicker">QR Import</p>
                <h2 id="qr-import-title" className="page-header__title">QR 코드로 가져오기</h2>
                <p className="page-header__caption">공유 중인 QR 프레임을 카메라로 읽어 React 데이터를 복원합니다.</p>
              </div>
              <IconButton icon={X} label="QR 가져오기 닫기" onClick={handleCloseQrImport} />
            </div>

            <div className={styles.videoFrame}>
              <video ref={qrImportVideoRef} className={styles.video} playsInline muted autoPlay />
            </div>

            <p className={styles.status} data-tone={qrImportError ? 'error' : 'info'}>
              {qrImportError ?? qrImportStatus}
            </p>

            {qrImportProgress ? (
              <div className={styles.progressGrid}>
                {Array.from({ length: qrImportProgress.total }, (_, index) => (
                  <span
                    key={`qr-progress-${index + 1}`}
                    className={styles.progressChip}
                    data-complete={index < qrImportProgress.received}
                  >
                    {index + 1}
                  </span>
                ))}
              </div>
            ) : null}

            <div className={styles.modalButtonRow}>
              <button
                type="button"
                className="pill"
                onClick={() => {
                  resetQrImportSession()
                  scheduleQrImportScan()
                }}
              >
                다시 스캔
              </button>
              <button type="button" className="pill" onClick={handleCloseQrImport}>
                닫기
              </button>
            </div>
          </GlassPanel>
        </div>
      ) : null}

      {manualCopyText ? (
        <div
          className={styles.overlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="manual-copy-title"
          onClick={() => setManualCopyText(null)}
        >
          <GlassPanel
            className={styles.modal}
            padding="lg"
            variant="strong"
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <div>
                <p className="section-kicker">Manual Copy</p>
                <h2 id="manual-copy-title" className="page-header__title">수동 복사</h2>
                <p className="page-header__caption">브라우저 권한 문제로 자동 복사가 막혔습니다. 아래 내용을 복사해 주세요.</p>
              </div>
              <IconButton icon={X} label="수동 복사 닫기" onClick={() => setManualCopyText(null)} />
            </div>

            <textarea
              className={styles.textarea}
              readOnly
              value={manualCopyText}
              onFocus={(event) => event.currentTarget.select()}
            />
          </GlassPanel>
        </div>
      ) : null}

      {isManualImportOpen ? (
        <div
          className={styles.overlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="manual-import-title"
          onClick={() => setIsManualImportOpen(false)}
        >
          <GlassPanel
            className={styles.modal}
            padding="lg"
            variant="strong"
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <div>
                <p className="section-kicker">Manual Import</p>
                <h2 id="manual-import-title" className="page-header__title">백업 JSON 붙여넣기</h2>
                <p className="page-header__caption">React 백업이나 기존 웹 버전 백업 JSON을 그대로 붙여넣어 복원할 수 있습니다.</p>
              </div>
              <IconButton icon={X} label="수동 가져오기 닫기" onClick={() => setIsManualImportOpen(false)} />
            </div>

            <textarea
              className={styles.textarea}
              value={manualImportText}
              onChange={(event) => setManualImportText(event.target.value)}
              placeholder="여기에 백업 JSON을 붙여넣어 주세요."
            />

            <div className={styles.modalButtonRow}>
              <button type="button" className="pill" onClick={() => void handleManualImportSubmit()}>
                복원하기
              </button>
              <button type="button" className="pill" onClick={() => setIsManualImportOpen(false)}>
                취소
              </button>
            </div>
          </GlassPanel>
        </div>
      ) : null}
    </>
  )
}
