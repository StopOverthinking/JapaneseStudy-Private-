// app.js

const startScreen = document.getElementById('start-screen');
const listModeScreen = document.getElementById('list-mode');
const learningModeScreen = document.getElementById('learning-mode');
const resultsScreen = document.getElementById('results-screen');
const gameSelectionMode = document.getElementById('game-selection-mode');
const dataManagementScreen = document.getElementById('data-management-mode');

const startListBtn = document.getElementById('start-list-btn');
const startLearningBtn = document.getElementById('start-learning-btn');
const startGameModeBtn = document.getElementById('start-game-mode-btn');
const startExamModeBtn = document.getElementById('start-exam-mode-btn');
const startDataManagementBtn = document.getElementById('start-data-management-btn');

const backToStartBtn = document.getElementById('back-to-start-btn');
const backToStartFromLearningBtn = document.getElementById('back-to-start-from-learning');
const backToStartFromGameSelectionBtn = document.getElementById('back-to-start-from-game-selection');
const backToStartFromSpeedQuizBtn = document.getElementById('back-to-start-from-speed-quiz');
const backToStartFromExamSelectBtn = document.getElementById('back-to-start-from-exam-select');
const backToStartFromExamBtn = document.getElementById('back-to-start-from-exam');
const backToStartFromExamResultBtn = document.getElementById('back-to-start-from-exam-result');
const backToStartFromDataMgmtBtn = document.getElementById('back-to-start-from-data-mgmt');

const openSpeedQuizBtn = document.getElementById('open-speed-quiz-btn');
const restartLearningBtn = document.getElementById('restart-learning-btn');
const restartSpeedQuizBtn = document.getElementById('restart-speed-quiz-btn');

const vocabularyListContainer = document.getElementById('vocabulary-list-container');
const listControls = document.getElementById('list-controls');
const listModeTitle = document.getElementById('list-mode-title');
const toggleWordBtn = document.getElementById('toggle-word-btn');
const toggleMeaningBtn = document.getElementById('toggle-meaning-btn');
const listJumpNav = document.getElementById('list-jump-nav');

const wordCountInput = document.getElementById('word-count');
const wordCountControls = document.getElementById('word-count-controls');
const rangeCheckbox = document.getElementById('range-checkbox');
const rangeSelection = document.getElementById('range-selection');
const learningInlineMessage = document.getElementById('learning-inline-message');

const dashboardMonthLabel = document.getElementById('dashboard-month-label');
const dashboardPrevMonthBtn = document.getElementById('dashboard-prev-month');
const dashboardNextMonthBtn = document.getElementById('dashboard-next-month');
const dashboardLastVisit = document.getElementById('dashboard-last-visit');
const dashboardLastVisitDetail = document.getElementById('dashboard-last-visit-detail');
const dashboardVisitDays = document.getElementById('dashboard-visit-days');
const dashboardLearnedCount = document.getElementById('dashboard-learned-count');
const dashboardLearnedDetail = document.getElementById('dashboard-learned-detail');
const dashboardCalendar = document.getElementById('dashboard-calendar');

const resumeOverlay = document.getElementById('resume-overlay');
const btnResumeYes = document.getElementById('btn-resume-yes');
const btnResumeNo = document.getElementById('btn-resume-no');

const exportClipboardBtn = document.getElementById('export-clipboard-btn');
const exportFileBtn = document.getElementById('export-file-btn');
const exportQrBtn = document.getElementById('export-qr-btn');
const importClipboardBtn = document.getElementById('import-clipboard-btn');
const importFileBtn = document.getElementById('import-file-btn');
const importQrBtn = document.getElementById('import-qr-btn');
const importFileInput = document.getElementById('import-file-input');
const dataManagementMessage = document.getElementById('data-management-message');

const confirmModal = document.getElementById('confirm-modal');
const confirmModalEyebrow = document.getElementById('confirm-modal-eyebrow');
const confirmModalTitle = document.getElementById('confirm-modal-title');
const confirmModalMessage = document.getElementById('confirm-modal-message');
const confirmModalConfirm = document.getElementById('confirm-modal-confirm');
const confirmModalExtra = document.getElementById('confirm-modal-extra');
const confirmModalCancel = document.getElementById('confirm-modal-cancel');

const dataTextModal = document.getElementById('data-text-modal');
const dataTextModalTitle = document.getElementById('data-text-modal-title');
const dataTextModalDescription = document.getElementById('data-text-modal-description');
const dataTextModalInput = document.getElementById('data-text-modal-input');
const dataTextModalConfirm = document.getElementById('data-text-modal-confirm');
const dataTextModalCancel = document.getElementById('data-text-modal-cancel');

const qrShareModal = document.getElementById('qr-share-modal');
const qrShareDescription = document.getElementById('qr-share-description');
const qrShareCode = document.getElementById('qr-share-code');
const qrShareFrameCounter = document.getElementById('qr-share-frame-counter');
const qrShareDetail = document.getElementById('qr-share-detail');
const qrSharePrevBtn = document.getElementById('qr-share-prev-btn');
const qrShareNextBtn = document.getElementById('qr-share-next-btn');
const qrShareCloseBtn = document.getElementById('qr-share-close-btn');

const qrImportModal = document.getElementById('qr-import-modal');
const qrImportStatus = document.getElementById('qr-import-status');
const qrImportVideo = document.getElementById('qr-import-video');
const qrImportProgress = document.getElementById('qr-import-progress');
const qrImportResetBtn = document.getElementById('qr-import-reset-btn');
const qrImportCloseBtn = document.getElementById('qr-import-close-btn');

const toastRegion = document.getElementById('toast-region');

const FAVORITES_KEY = 'japaneseAppFavorites';
const STUDY_HISTORY_KEY = 'japaneseAppStudyHistory';
const POST_RESTORE_TOAST_KEY = 'japaneseAppPostRestoreToast';
const DEVICE_ID_KEY = 'japaneseAppDeviceId';
const BACKUP_SCHEMA_VERSION = 1;
const QR_SHARE_PREFIX = 'JSPQR1';
const QR_SHARE_CHUNK_SIZE = 900;
const QR_SHARE_AUTOPLAY_MS = 1400;
const QR_IMPORT_SCAN_INTERVAL_MS = 240;

let favoriteWordIds = [];
let isViewingWordList = false;
let areWordsHidden = false;
let areMeaningsHidden = false;
let screenHistory = [];
let dashboardMonthCursor = getMonthStart(new Date());
let currentJumpButtons = [];
let currentJumpMarkers = [];
let confirmModalResolver = null;
let textModalResolver = null;
let qrShareState = null;
let qrShareIntervalId = null;
let qrImportState = null;
let qrImportFrameRequestId = 0;
let qrImportLastScanAt = 0;

function getDateKey(date = new Date()) {
    return new Intl.DateTimeFormat('en-CA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(date);
}

function getMonthStart(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

function formatKoreanDate(dateKey) {
    if (!dateKey) return '-';
    const [year, month, day] = dateKey.split('-').map(Number);
    return `${year}.${String(month).padStart(2, '0')}.${String(day).padStart(2, '0')}`;
}

function formatDateTimeDisplay(isoString) {
    if (!isoString) return '없음';

    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return '없음';

    return new Intl.DateTimeFormat('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

function getOrCreateDeviceId() {
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);
    if (deviceId) return deviceId;

    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
        deviceId = window.crypto.randomUUID();
    } else {
        deviceId = `device-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
    }

    localStorage.setItem(DEVICE_ID_KEY, deviceId);
    return deviceId;
}

function getBackupExcludedKeys() {
    return new Set([DEVICE_ID_KEY]);
}

function getBackupDataMap() {
    const excluded = getBackupExcludedKeys();
    const data = {};

    for (let index = 0; index < localStorage.length; index += 1) {
        const key = localStorage.key(index);
        if (!key || excluded.has(key)) continue;
        data[key] = localStorage.getItem(key);
    }

    return data;
}

function buildBackupEnvelope() {
    return {
        schemaVersion: BACKUP_SCHEMA_VERSION,
        appVersion: 'web',
        exportedAt: new Date().toISOString(),
        deviceId: getOrCreateDeviceId(),
        data: getBackupDataMap()
    };
}

function getShareDataText() {
    return JSON.stringify(buildBackupEnvelope());
}

function bytesToBase64(bytes) {
    let binary = '';
    const chunkSize = 0x8000;

    for (let index = 0; index < bytes.length; index += chunkSize) {
        const chunk = bytes.subarray(index, index + chunkSize);
        binary += String.fromCharCode(...chunk);
    }

    return btoa(binary);
}

function bytesToBase64Url(bytes) {
    return bytesToBase64(bytes)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/g, '');
}

function base64ToBytes(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);

    for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index);
    }

    return bytes;
}

function base64UrlToBytes(base64Url) {
    const normalized = base64Url
        .replace(/-/g, '+')
        .replace(/_/g, '/')
        .padEnd(Math.ceil(base64Url.length / 4) * 4, '=');

    return base64ToBytes(normalized);
}

function splitIntoChunks(text, chunkSize) {
    const chunks = [];

    for (let index = 0; index < text.length; index += chunkSize) {
        chunks.push(text.slice(index, index + chunkSize));
    }

    return chunks;
}

async function compressShareText(text) {
    const rawBytes = new TextEncoder().encode(text);

    if (typeof CompressionStream !== 'function') {
        return { bytes: rawBytes, encoding: 'plain' };
    }

    try {
        const compressedStream = new Blob([rawBytes]).stream().pipeThrough(new CompressionStream('gzip'));
        const compressedBytes = new Uint8Array(await new Response(compressedStream).arrayBuffer());

        if (compressedBytes.length < rawBytes.length) {
            return { bytes: compressedBytes, encoding: 'gzip' };
        }
    } catch (error) {
        console.warn('QR share compression failed.', error);
    }

    return { bytes: rawBytes, encoding: 'plain' };
}

async function decodeSharePayload(payload, encoding) {
    const encodedBytes = base64UrlToBytes(payload);

    if (encoding === 'gzip') {
        if (typeof DecompressionStream !== 'function') {
            throw new Error('이 브라우저는 압축된 QR 데이터 복원을 지원하지 않습니다.');
        }

        const decompressedStream = new Blob([encodedBytes]).stream().pipeThrough(new DecompressionStream('gzip'));
        const decompressedBytes = await new Response(decompressedStream).arrayBuffer();
        return new TextDecoder().decode(decompressedBytes);
    }

    return new TextDecoder().decode(encodedBytes);
}

function createQrTransferId() {
    return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

async function buildQrShareFrames() {
    const rawText = getShareDataText();
    const rawBytes = new TextEncoder().encode(rawText);
    const { bytes, encoding } = await compressShareText(rawText);
    const payload = bytesToBase64Url(bytes);
    const chunks = splitIntoChunks(payload, QR_SHARE_CHUNK_SIZE);
    const sessionId = createQrTransferId();

    return {
        rawBytes: rawBytes.length,
        encodedBytes: bytes.length,
        encoding,
        sessionId,
        frames: chunks.map((chunk, index) => `${QR_SHARE_PREFIX}|${sessionId}|${index + 1}|${chunks.length}|${encoding}|${chunk}`)
    };
}

function parseQrFramePayload(value) {
    if (typeof value !== 'string' || !value.startsWith(`${QR_SHARE_PREFIX}|`)) {
        return null;
    }

    const parts = value.split('|');
    if (parts.length !== 6) return null;

    const [, sessionId, indexText, totalText, encoding, chunk] = parts;
    const index = parseInt(indexText, 10);
    const total = parseInt(totalText, 10);

    if (!sessionId || !chunk || Number.isNaN(index) || Number.isNaN(total)) {
        return null;
    }

    if (index < 1 || total < 1 || index > total) {
        return null;
    }

    return {
        sessionId,
        index,
        total,
        encoding,
        chunk
    };
}

function createQrMarkup(value) {
    if (typeof qrcode !== 'function') {
        throw new Error('QR 생성기를 불러오지 못했습니다.');
    }

    const qr = qrcode(0, 'L');
    qr.addData(value, 'Byte');
    qr.make();
    return qr.createSvgTag({
        cellSize: 6,
        margin: 10,
        scalable: true,
        alt: '데이터 공유용 QR 코드',
        title: '데이터 공유용 QR 코드'
    });
}

function showToast(message, tone = 'info', duration = 3200) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.dataset.tone = tone;
    toast.textContent = message;
    toastRegion.appendChild(toast);

    window.setTimeout(() => toast.remove(), duration);
}

function setInlineMessage(target, message, tone = 'info') {
    if (!target) return;
    target.textContent = message;
    target.dataset.tone = tone;
    target.classList.remove('hidden');
}

function clearInlineMessage(target) {
    if (!target) return;
    target.textContent = '';
    delete target.dataset.tone;
    target.classList.add('hidden');
}

function cleanupConfirmModal() {
    confirmModal.classList.add('hidden');
    confirmModalEyebrow.classList.add('hidden');
    confirmModalExtra.classList.add('hidden');
    confirmModalTitle.textContent = '확인';
    confirmModalMessage.textContent = '';
    confirmModalConfirm.textContent = '확인';
    confirmModalCancel.textContent = '취소';
    confirmModalExtra.textContent = '';
    confirmModalResolver = null;
}

function resolveConfirmModal(value) {
    const resolver = confirmModalResolver;
    cleanupConfirmModal();
    if (resolver) resolver(value);
}

function showConfirmModal({
    eyebrow = '',
    title = '확인',
    message = '',
    confirmText = '확인',
    cancelText = '취소',
    extraText = ''
} = {}) {
    if (confirmModalResolver) {
        resolveConfirmModal(false);
    }

    confirmModalTitle.textContent = title;
    confirmModalMessage.textContent = message;
    confirmModalConfirm.textContent = confirmText;
    confirmModalCancel.textContent = cancelText;

    if (eyebrow) {
        confirmModalEyebrow.textContent = eyebrow;
        confirmModalEyebrow.classList.remove('hidden');
    } else {
        confirmModalEyebrow.classList.add('hidden');
    }

    if (extraText) {
        confirmModalExtra.textContent = extraText;
        confirmModalExtra.classList.remove('hidden');
    } else {
        confirmModalExtra.classList.add('hidden');
    }

    confirmModal.classList.remove('hidden');

    return new Promise(resolve => {
        confirmModalResolver = resolve;
    });
}

function cleanupTextModal() {
    dataTextModal.classList.add('hidden');
    dataTextModalTitle.textContent = '데이터 붙여넣기';
    dataTextModalDescription.textContent = '';
    dataTextModalInput.value = '';
    dataTextModalInput.readOnly = false;
    dataTextModalConfirm.textContent = '확인';
    dataTextModalCancel.classList.remove('hidden');
    textModalResolver = null;
}

function resolveTextModal(value) {
    const resolver = textModalResolver;
    cleanupTextModal();
    if (resolver) resolver(value);
}

function showTextModal({
    title = '데이터 붙여넣기',
    description = '',
    value = '',
    confirmText = '확인',
    readonly = false
} = {}) {
    if (textModalResolver) {
        resolveTextModal(null);
    }

    dataTextModalTitle.textContent = title;
    dataTextModalDescription.textContent = description;
    dataTextModalInput.value = value;
    dataTextModalInput.readOnly = readonly;
    dataTextModalConfirm.textContent = confirmText;
    dataTextModalCancel.classList.toggle('hidden', readonly);
    dataTextModal.classList.remove('hidden');

    window.setTimeout(() => {
        dataTextModalInput.focus();
        if (!readonly) {
            dataTextModalInput.select();
        }
    }, 0);

    return new Promise(resolve => {
        textModalResolver = resolve;
    });
}

confirmModalConfirm.addEventListener('click', () => resolveConfirmModal(true));
confirmModalCancel.addEventListener('click', () => resolveConfirmModal(false));
confirmModalExtra.addEventListener('click', () => resolveConfirmModal('extra'));

dataTextModalConfirm.addEventListener('click', () => {
    if (dataTextModalInput.readOnly) {
        resolveTextModal(true);
        return;
    }

    resolveTextModal(dataTextModalInput.value.trim());
});

dataTextModalCancel.addEventListener('click', () => resolveTextModal(null));

document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;

    if (!qrShareModal.classList.contains('hidden')) {
        closeQrShareModal();
    } else if (!qrImportModal.classList.contains('hidden')) {
        closeQrImportModal();
    } else if (!confirmModal.classList.contains('hidden')) {
        resolveConfirmModal(false);
    } else if (!dataTextModal.classList.contains('hidden')) {
        resolveTextModal(null);
    }
});

function clearQrShareAutoplay() {
    if (qrShareIntervalId) {
        window.clearInterval(qrShareIntervalId);
        qrShareIntervalId = null;
    }
}

function cleanupQrShareModal() {
    clearQrShareAutoplay();
    qrShareState = null;
    qrShareModal.classList.add('hidden');
    qrShareCode.innerHTML = '';
    qrShareFrameCounter.textContent = '준비 중';
    qrShareDetail.textContent = '';
    qrShareDescription.textContent = '다른 기기에서 QR 가져오기를 열고 화면의 QR 코드를 스캔하세요.';
    qrSharePrevBtn.disabled = true;
    qrShareNextBtn.disabled = true;
}

function renderQrShareFrame(index) {
    if (!qrShareState || !qrShareState.frames.length) return;

    const normalizedIndex = (index + qrShareState.frames.length) % qrShareState.frames.length;
    qrShareState.currentIndex = normalizedIndex;
    qrShareCode.innerHTML = createQrMarkup(qrShareState.frames[normalizedIndex]);
    qrShareFrameCounter.textContent = `${normalizedIndex + 1} / ${qrShareState.frames.length}`;
    qrShareDetail.textContent = `압축 ${qrShareState.encoding === 'gzip' ? '사용' : '미사용'} · ${qrShareState.rawBytes}B -> ${qrShareState.encodedBytes}B`;
    qrShareDescription.textContent = qrShareState.frames.length > 1
        ? 'QR이 여러 장이면 자동으로 넘어갑니다. 받는 기기에서 순서대로 스캔하세요.'
        : '다른 기기에서 QR 가져오기를 열고 화면의 QR 코드를 스캔하세요.';
    qrSharePrevBtn.disabled = qrShareState.frames.length <= 1;
    qrShareNextBtn.disabled = qrShareState.frames.length <= 1;
}

function startQrShareAutoplay() {
    clearQrShareAutoplay();

    if (!qrShareState || qrShareState.frames.length <= 1) return;

    qrShareIntervalId = window.setInterval(() => {
        renderQrShareFrame(qrShareState.currentIndex + 1);
    }, QR_SHARE_AUTOPLAY_MS);
}

async function openQrShareModal() {
    clearInlineMessage(dataManagementMessage);
    cleanupQrShareModal();
    qrShareModal.classList.remove('hidden');
    qrShareDetail.textContent = 'QR 코드를 만드는 중입니다.';

    try {
        qrShareState = await buildQrShareFrames();
        qrShareState.currentIndex = 0;
        renderQrShareFrame(0);
        startQrShareAutoplay();
    } catch (error) {
        cleanupQrShareModal();
        setInlineMessage(dataManagementMessage, `QR 공유를 준비하지 못했습니다: ${error.message}`, 'error');
        showToast('QR 공유 준비에 실패했습니다.', 'error');
    }
}

function closeQrShareModal() {
    cleanupQrShareModal();
}

function resetQrImportSession(keepStatus = false) {
    if (!qrImportState) {
        qrImportState = {};
    }

    qrImportState.session = null;

    if (!keepStatus) {
        qrImportStatus.textContent = '보내는 기기의 QR 코드를 카메라 안에 맞춰주세요.';
    }

    qrImportProgress.innerHTML = '';
}

function updateQrImportProgress() {
    if (!qrImportState || !qrImportState.session) {
        qrImportProgress.innerHTML = '';
        return;
    }

    const { total, chunks } = qrImportState.session;
    qrImportProgress.innerHTML = '';

    for (let index = 0; index < total; index += 1) {
        const chip = document.createElement('span');
        chip.className = 'qr-progress-chip';
        if (chunks[index]) {
            chip.classList.add('is-collected');
        }
        chip.textContent = String(index + 1);
        qrImportProgress.appendChild(chip);
    }
}

function stopQrImportScanner() {
    if (qrImportFrameRequestId) {
        window.cancelAnimationFrame(qrImportFrameRequestId);
        qrImportFrameRequestId = 0;
    }

    if (qrImportState && qrImportState.videoStream) {
        qrImportState.videoStream.getTracks().forEach(track => track.stop());
    }

    if (qrImportVideo.srcObject) {
        qrImportVideo.srcObject = null;
    }
}

function cleanupQrImportModal() {
    stopQrImportScanner();
    qrImportLastScanAt = 0;
    qrImportState = null;
    qrImportModal.classList.add('hidden');
    qrImportStatus.textContent = '카메라를 준비하고 있습니다.';
    qrImportProgress.innerHTML = '';
}

function closeQrImportModal() {
    cleanupQrImportModal();
}

async function isQrImportSupported() {
    if (typeof BarcodeDetector !== 'function') return false;
    if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') return false;

    if (typeof BarcodeDetector.getSupportedFormats === 'function') {
        try {
            const formats = await BarcodeDetector.getSupportedFormats();
            if (Array.isArray(formats) && formats.length && !formats.includes('qr_code')) {
                return false;
            }
        } catch (error) {
            console.warn('Unable to inspect barcode formats.', error);
        }
    }

    return true;
}

function applyQrImportFrame(frame) {
    if (!qrImportState.session) {
        qrImportState.session = {
            sessionId: frame.sessionId,
            total: frame.total,
            encoding: frame.encoding,
            chunks: new Array(frame.total).fill('')
        };
    }

    const session = qrImportState.session;
    if (session.sessionId !== frame.sessionId) {
        qrImportStatus.textContent = '다른 공유 세션이 감지되었습니다. 현재 스캔을 유지합니다.';
        return false;
    }

    if (session.total !== frame.total || session.encoding !== frame.encoding) {
        qrImportStatus.textContent = 'QR 프레임 형식이 일치하지 않습니다. 다시 시작해 주세요.';
        return false;
    }

    const frameIndex = frame.index - 1;
    if (!session.chunks[frameIndex]) {
        session.chunks[frameIndex] = frame.chunk;
        const collectedCount = session.chunks.filter(Boolean).length;
        qrImportStatus.textContent = `${collectedCount} / ${session.total}장 수집됨`;
        updateQrImportProgress();
    }

    return session.chunks.every(Boolean);
}

async function completeQrImportSession() {
    if (!qrImportState || !qrImportState.session) return;

    const { chunks, encoding, total } = qrImportState.session;

    try {
        qrImportStatus.textContent = 'QR 데이터를 복원 가능한 형식으로 합치는 중입니다.';
        const payload = chunks.join('');
        const restoredText = await decodeSharePayload(payload, encoding);
        closeQrImportModal();

        const parsed = parseRestorePayload(restoredText);
        if (!parsed.ok) {
            setInlineMessage(dataManagementMessage, parsed.error, 'error');
            showToast('QR 데이터를 읽지 못했습니다.', 'error');
            return;
        }

        await confirmRestoreData(parsed, 'QR 코드', [`QR 프레임 수: ${total}장`]);
    } catch (error) {
        qrImportStatus.textContent = `QR 데이터를 복원하지 못했습니다: ${error.message}`;
        setInlineMessage(dataManagementMessage, `QR 데이터를 복원하지 못했습니다: ${error.message}`, 'error');
    }
}

async function scanQrFrame() {
    if (!qrImportState || !qrImportState.detector) return;

    const now = Date.now();
    if (now - qrImportLastScanAt < QR_IMPORT_SCAN_INTERVAL_MS) {
        qrImportFrameRequestId = window.requestAnimationFrame(scanQrFrame);
        return;
    }

    qrImportLastScanAt = now;

    try {
        const barcodes = await qrImportState.detector.detect(qrImportVideo);

        for (const barcode of barcodes) {
            const rawValue = barcode.rawValue || '';
            const frame = parseQrFramePayload(rawValue);
            if (!frame) continue;

            const completed = applyQrImportFrame(frame);
            if (completed) {
                await completeQrImportSession();
                return;
            }
        }
    } catch (error) {
        console.warn('QR scan attempt failed.', error);
    }

    qrImportFrameRequestId = window.requestAnimationFrame(scanQrFrame);
}

async function openQrImportModal() {
    clearInlineMessage(dataManagementMessage);
    cleanupQrImportModal();
    qrImportModal.classList.remove('hidden');
    qrImportStatus.textContent = '카메라를 준비하고 있습니다.';

    const supported = await isQrImportSupported();
    if (!supported) {
        qrImportStatus.textContent = '이 브라우저는 QR 카메라 스캔을 지원하지 않습니다.';
        setInlineMessage(dataManagementMessage, '현재 브라우저에서는 QR 카메라 스캔을 사용할 수 없습니다.', 'error');
        return;
    }

    try {
        const detector = new BarcodeDetector({ formats: ['qr_code'] });
        const videoStream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: { ideal: 'environment' }
            },
            audio: false
        });

        qrImportState = {
            detector,
            videoStream,
            session: null
        };

        qrImportVideo.srcObject = videoStream;
        await qrImportVideo.play();
        resetQrImportSession();
        updateQrImportProgress();
        qrImportFrameRequestId = window.requestAnimationFrame(scanQrFrame);
    } catch (error) {
        qrImportStatus.textContent = `카메라를 열지 못했습니다: ${error.message}`;
        setInlineMessage(dataManagementMessage, `QR 카메라를 열지 못했습니다: ${error.message}`, 'error');
    }
}

function getStudyHistory() {
    const saved = localStorage.getItem(STUDY_HISTORY_KEY);
    if (!saved) {
        return { days: {} };
    }

    try {
        const parsed = JSON.parse(saved);
        return parsed && parsed.days ? parsed : { days: {} };
    } catch (error) {
        return { days: {} };
    }
}

function saveStudyHistory(history) {
    localStorage.setItem(STUDY_HISTORY_KEY, JSON.stringify(history));
}

function getDayHistory(history, dateKey) {
    if (!history.days[dateKey]) {
        history.days[dateKey] = {
            visits: 0,
            learnedWordIds: [],
            lastVisitedAt: null
        };
    }

    return history.days[dateKey];
}

function recordVisit() {
    const history = getStudyHistory();
    const todayKey = getDateKey();
    const entry = getDayHistory(history, todayKey);
    entry.visits += 1;
    entry.lastVisitedAt = new Date().toISOString();
    saveStudyHistory(history);
}

function recordLearnedWord(wordId) {
    const history = getStudyHistory();
    const todayKey = getDateKey();
    const entry = getDayHistory(history, todayKey);

    if (!entry.learnedWordIds.includes(wordId)) {
        entry.learnedWordIds.push(wordId);
        saveStudyHistory(history);
    }

    if (startScreen.classList.contains('active')) {
        renderStudyDashboard();
    }
}

function getMonthDays(date) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function getLearnLevel(learnedCount) {
    if (learnedCount >= 10) return 4;
    if (learnedCount >= 6) return 3;
    if (learnedCount >= 3) return 2;
    if (learnedCount >= 1) return 1;
    return 0;
}

function renderStudyDashboard() {
    if (!dashboardCalendar) return;

    const history = getStudyHistory();
    const year = dashboardMonthCursor.getFullYear();
    const month = dashboardMonthCursor.getMonth();
    const monthDays = getMonthDays(dashboardMonthCursor);
    const firstWeekday = new Date(year, month, 1).getDay();
    const monthEntries = Object.entries(history.days).filter(([dateKey]) => {
        const [entryYear, entryMonth] = dateKey.split('-').map(Number);
        return entryYear === year && entryMonth === month + 1;
    });

    dashboardMonthLabel.textContent = `${year}.${String(month + 1).padStart(2, '0')}`;
    dashboardVisitDays.textContent = String(monthEntries.filter(([, entry]) => entry.visits > 0).length);
    dashboardLearnedCount.textContent = String(monthEntries.reduce((sum, [, entry]) => sum + entry.learnedWordIds.length, 0));

    const lastVisitEntry = Object.entries(history.days)
        .filter(([, entry]) => entry.lastVisitedAt)
        .sort((a, b) => new Date(b[1].lastVisitedAt) - new Date(a[1].lastVisitedAt))[0];

    if (lastVisitEntry) {
        dashboardLastVisit.textContent = formatKoreanDate(lastVisitEntry[0]);
        dashboardLastVisitDetail.textContent = `${lastVisitEntry[1].visits}회 접속`;
    } else {
        dashboardLastVisit.textContent = '-';
        dashboardLastVisitDetail.textContent = '기록이 아직 없습니다.';
    }

    dashboardLearnedDetail.textContent = monthEntries.length > 0 ? `접속 ${monthEntries.length}일 동안 기록됨` : '아직 기록이 없습니다.';

    dashboardCalendar.innerHTML = '';
    const todayKey = getDateKey();

    for (let i = 0; i < firstWeekday; i += 1) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'calendar-day calendar-day--empty';
        dashboardCalendar.appendChild(emptyCell);
    }

    for (let day = 1; day <= monthDays; day += 1) {
        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const entry = history.days[dateKey];
        const learnedCount = entry ? entry.learnedWordIds.length : 0;

        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day';
        if (entry && entry.visits > 0) dayCell.classList.add('is-visited');
        if (dateKey === todayKey) dayCell.classList.add('is-today');

        const learnLevel = getLearnLevel(learnedCount);
        if (learnLevel > 0) dayCell.classList.add(`learn-level-${learnLevel}`);

        const number = document.createElement('span');
        number.className = 'calendar-day-number';
        number.textContent = String(day);

        const meta = document.createElement('div');
        meta.className = 'calendar-day-meta';

        const learnText = document.createElement('span');
        learnText.textContent = learnedCount > 0 ? `+${learnedCount}` : '';
        meta.appendChild(learnText);

        const visitDot = document.createElement('span');
        if (entry && entry.visits > 0) {
            visitDot.className = 'calendar-visit-dot';
            visitDot.title = `접속 ${entry.visits}회`;
        }
        meta.appendChild(visitDot);

        dayCell.appendChild(number);
        dayCell.appendChild(meta);
        dashboardCalendar.appendChild(dayCell);
    }
}

dashboardPrevMonthBtn.addEventListener('click', () => {
    dashboardMonthCursor = new Date(dashboardMonthCursor.getFullYear(), dashboardMonthCursor.getMonth() - 1, 1);
    renderStudyDashboard();
});

dashboardNextMonthBtn.addEventListener('click', () => {
    dashboardMonthCursor = new Date(dashboardMonthCursor.getFullYear(), dashboardMonthCursor.getMonth() + 1, 1);
    renderStudyDashboard();
});

window.AppUI = {
    clearInlineMessage,
    recordLearnedWord,
    renderStudyDashboard,
    setInlineMessage,
    showConfirmModal,
    showTextModal,
    showToast
};

function loadFavoriteIds() {
    const storedFavorites = localStorage.getItem(FAVORITES_KEY);
    favoriteWordIds = storedFavorites ? JSON.parse(storedFavorites) : [];
}

function saveFavoriteIds() {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favoriteWordIds));
}

function isFavorite(wordId) {
    return favoriteWordIds.includes(wordId);
}

function toggleFavorite(wordId) {
    const index = favoriteWordIds.indexOf(wordId);
    if (index > -1) {
        favoriteWordIds.splice(index, 1);
    } else {
        favoriteWordIds.push(wordId);
    }

    saveFavoriteIds();
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function getRandomWords(count, data) {
    if (count >= data.length) {
        return shuffleArray([...data]);
    }
    return shuffleArray([...data]).slice(0, count);
}

function showScreen(screenElement, addToHistory = true) {
    const activeScreen = document.querySelector('.screen.active');
    if (addToHistory && activeScreen && activeScreen !== screenElement) {
        screenHistory.push(activeScreen);
    }

    document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
    screenElement.classList.add('active');

    if (screenElement === startScreen) {
        renderStudyDashboard();
    }
}

function goBack() {
    if (screenHistory.length > 0) {
        showScreen(screenHistory.pop(), false);
        return;
    }
    showScreen(startScreen, false);
}

function setListModeTitle(title) {
    listModeTitle.textContent = title;
    listModeTitle.title = title;
}

function syncListToolbarButtons() {
    const wordLabel = areWordsHidden ? '단어 보이기' : '단어 숨기기';
    const meaningLabel = areMeaningsHidden ? '뜻 보이기' : '뜻 숨기기';

    toggleWordBtn.innerHTML = `<span class="toolbar-glyph" aria-hidden="true">あ</span><span class="sr-only">${wordLabel}</span>`;
    toggleMeaningBtn.innerHTML = `<span class="toolbar-glyph" aria-hidden="true">한</span><span class="sr-only">${meaningLabel}</span>`;

    toggleWordBtn.setAttribute('aria-label', wordLabel);
    toggleWordBtn.setAttribute('title', wordLabel);
    toggleWordBtn.setAttribute('aria-pressed', String(areWordsHidden));

    toggleMeaningBtn.setAttribute('aria-label', meaningLabel);
    toggleMeaningBtn.setAttribute('title', meaningLabel);
    toggleMeaningBtn.setAttribute('aria-pressed', String(areMeaningsHidden));
}

function activateJumpButton(index) {
    currentJumpButtons.forEach((button, buttonIndex) => {
        button.classList.toggle('active', buttonIndex === index);
    });
}

function renderListJumpNav(words) {
    listJumpNav.innerHTML = '';
    currentJumpButtons = [];
    currentJumpMarkers = [];

    if (words.length <= 100) {
        listJumpNav.classList.add('hidden');
        return;
    }

    const blockCount = Math.ceil(words.length / 100);
    for (let blockIndex = 0; blockIndex < blockCount; blockIndex += 1) {
        const button = document.createElement('button');
        const start = blockIndex * 100 + 1;
        const end = Math.min(words.length, start + 99);
        button.className = 'list-jump-btn';
        button.type = 'button';
        button.dataset.blockIndex = String(blockIndex);
        button.textContent = `${start}-${end}`;
        listJumpNav.appendChild(button);
        currentJumpButtons.push(button);
    }

    activateJumpButton(0);
    listJumpNav.classList.remove('hidden');
}

function renderEmptyState(message) {
    vocabularyListContainer.innerHTML = '';
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = message;
    vocabularyListContainer.appendChild(empty);
}

function renderWordList(words, emptyMessage) {
    vocabularyListContainer.innerHTML = '';
    vocabularyListContainer.scrollTop = 0;

    if (words.length === 0) {
        listJumpNav.classList.add('hidden');
        renderEmptyState(emptyMessage);
        return;
    }

    renderListJumpNav(words);

    const posMap = {
        noun: '(명)',
        verb: '(동)',
        i_adj: '(형)',
        na_adj: '(형동)',
        conj: '(접)',
        interj: '(감)',
        rentaishi: '(연체)',
        adv: '(부)',
        particle: '(조)',
        aux_verb: '(조동)'
    };

    const fragment = document.createDocumentFragment();

    words.forEach((word, index) => {
        if (index % 100 === 0) {
            const marker = document.createElement('div');
            const start = index + 1;
            const end = Math.min(words.length, index + 100);
            marker.className = 'word-block-marker';
            marker.id = `word-block-${currentJumpMarkers.length}`;
            marker.textContent = `${start}-${end}`;
            fragment.appendChild(marker);
            currentJumpMarkers.push(marker.id);
        }

        const isFav = isFavorite(word.id);
        let posTagContent = word.type && posMap[word.type] ? posMap[word.type] : '';
        if (word.verb_info) posTagContent += `(${word.verb_info})`;

        const item = document.createElement('div');
        item.className = 'vocab-item';
        item.dataset.id = word.id;
        item.innerHTML = `
            <div class="word-id">${word.id.split('_')[1]}</div>
            <div class="japanese-group ${areWordsHidden ? 'concealed' : ''}">
                <div class="japanese">${word.japanese}${posTagContent ? `<span class="pos-tag">${posTagContent}</span>` : ''}</div>
                <div class="reading">${word.reading}</div>
            </div>
            <div class="meaning ${areMeaningsHidden ? 'concealed' : ''}">${word.meaning}</div>
            <button class="list-favorite-btn ${isFav ? 'favorited' : ''}" data-id="${word.id}">
                ${isFav ? '★' : '☆'}
            </button>
        `;
        fragment.appendChild(item);
    });

    vocabularyListContainer.appendChild(fragment);
}

function showVocabSetList() {
    isViewingWordList = false;
    setListModeTitle('단어장');
    vocabularyListContainer.innerHTML = '';
    listJumpNav.classList.add('hidden');

    areWordsHidden = false;
    areMeaningsHidden = false;
    syncListToolbarButtons();
    listControls.classList.add('hidden');

    const favoriteSetItem = document.createElement('div');
    favoriteSetItem.className = 'vocab-set-item favorite-set';
    favoriteSetItem.textContent = `★ 즐겨찾기 (${favoriteWordIds.length}개)`;
    favoriteSetItem.dataset.type = 'favorites';
    vocabularyListContainer.appendChild(favoriteSetItem);

    const wrongAnswers = JSON.parse(localStorage.getItem('japaneseAppExamWrongAnswers') || '[]');
    if (wrongAnswers.length > 0) {
        const wrongSetItem = document.createElement('div');
        wrongSetItem.className = 'vocab-set-item wrong-answer-set';
        wrongSetItem.textContent = `! 오답 노트 (${wrongAnswers.length}개)`;
        wrongSetItem.dataset.type = 'wrong_answers';
        vocabularyListContainer.appendChild(wrongSetItem);
    }

    vocabularySets.forEach((set, index) => {
        const setItem = document.createElement('div');
        setItem.className = 'vocab-set-item';
        setItem.textContent = `${set.name} (${set.words.length}개)`;
        setItem.dataset.type = 'set';
        setItem.dataset.index = String(index);
        vocabularyListContainer.appendChild(setItem);
    });

    showScreen(listModeScreen);
}

function showWordList(type, index = -1) {
    isViewingWordList = true;
    listControls.classList.remove('hidden');
    syncListToolbarButtons();

    let wordsToShow = [];
    let emptyMessage = '표시할 단어가 없습니다.';

    if (type === 'favorites') {
        setListModeTitle('즐겨찾기');
        wordsToShow = allVocabulary.filter(word => isFavorite(word.id));
        emptyMessage = '즐겨찾기한 단어가 없습니다.';
    } else if (type === 'wrong_answers') {
        setListModeTitle('오답 노트');
        wordsToShow = JSON.parse(localStorage.getItem('japaneseAppExamWrongAnswers') || '[]');
        emptyMessage = '오답 노트가 비어 있습니다.';
    } else {
        const selectedSet = vocabularySets[index];
        setListModeTitle(selectedSet.name);
        wordsToShow = selectedSet.words;
    }

    renderWordList(wordsToShow, emptyMessage);
}

function getAllData() {
    return JSON.stringify(buildBackupEnvelope(), null, 2);
}

function parseRestorePayload(jsonString) {
    try {
        const data = JSON.parse(jsonString);
        if (typeof data !== 'object' || data === null || Array.isArray(data)) {
            return { ok: false, error: '올바른 백업 JSON 형식이 아닙니다.' };
        }

        if (data.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
            return {
                ok: true,
                data: data.data,
                keyCount: Object.keys(data.data).length,
                metadata: {
                    exportedAt: data.exportedAt || '',
                    deviceId: data.deviceId || '',
                    schemaVersion: data.schemaVersion || ''
                }
            };
        }

        return {
            ok: true,
            data,
            keyCount: Object.keys(data).length,
            metadata: {
                legacy: true
            }
        };
    } catch (error) {
        return { ok: false, error: `JSON을 읽는 중 오류가 발생했습니다: ${error.message}` };
    }
}

function performRestore(data) {
    localStorage.clear();
    Object.entries(data).forEach(([key, value]) => {
        localStorage.setItem(key, value);
    });

    sessionStorage.setItem(POST_RESTORE_TOAST_KEY, '데이터를 복원했습니다.');
    location.reload();
}

function exportDataAsFile() {
    const blob = new Blob([getAllData()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `japanese-study-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function buildRestoreSummary(parsed, sourceLabel, extraLines = []) {
    const details = [`${sourceLabel}에서 ${parsed.keyCount}개 항목을 읽었습니다.`];

    if (parsed.metadata && parsed.metadata.exportedAt) {
        details.push(`백업 시각: ${formatDateTimeDisplay(parsed.metadata.exportedAt)}`);
    }

    if (parsed.metadata && parsed.metadata.deviceId) {
        details.push(`백업 기기: ${parsed.metadata.deviceId}`);
    }

    extraLines.filter(Boolean).forEach(line => details.push(line));
    details.push('현재 데이터는 덮어써집니다.');

    return details.join(' ');
}

async function confirmRestoreData(parsed, sourceLabel, extraLines = []) {
    clearInlineMessage(dataManagementMessage);

    const firstChoice = await showConfirmModal({
        eyebrow: '데이터 복원',
        title: '복원 전에 백업을 권장합니다.',
        message: buildRestoreSummary(parsed, sourceLabel, extraLines),
        confirmText: '계속',
        cancelText: '취소',
        extraText: '지금 백업 저장'
    });

    if (firstChoice === 'extra') {
        exportDataAsFile();
        showToast('백업 파일 저장을 시작했습니다.', 'info');
        return false;
    }

    if (!firstChoice) return false;

    const finalConfirmed = await showConfirmModal({
        eyebrow: '최종 확인',
        title: '정말로 복원할까요?',
        message: '현재 기기의 데이터가 즉시 교체되며, 복원 후 앱이 새로 고쳐집니다.',
        confirmText: '복원하기',
        cancelText: '취소'
    });

    if (!finalConfirmed) return false;
    performRestore(parsed.data);
    return true;
}

function openManualImportModal() {
    return showTextModal({
        title: '복원 데이터 붙여넣기',
        description: '복사한 JSON 백업 데이터를 아래에 붙여넣으세요.',
        confirmText: '복원 준비'
    });
}

async function confirmRestoreFlow(rawText, sourceLabel) {
    clearInlineMessage(dataManagementMessage);

    const parsed = parseRestorePayload(rawText);
    if (!parsed.ok) {
        setInlineMessage(dataManagementMessage, parsed.error, 'error');
        return;
    }

    await confirmRestoreData(parsed, sourceLabel);
}

async function openLearningMode() {
    clearInlineMessage(learningInlineMessage);

    if (!LearningMode.hasSavedSession()) {
        LearningMode.show();
        return;
    }

    const shouldResume = await showConfirmModal({
        eyebrow: '학습 모드',
        title: '이전 학습을 이어서 하시겠습니까?',
        message: '저장된 진행 상황이 있습니다. 이어서 하거나 새로 시작할 수 있습니다.',
        confirmText: '이어하기',
        cancelText: '새로 시작'
    });

    if (shouldResume) {
        LearningMode.resume();
        return;
    }

    LearningMode.clearSession();
    LearningMode.show();
}

async function leaveLearningMode() {
    clearInlineMessage(learningInlineMessage);

    if (LearningMode.hasActiveSession()) {
        const confirmed = await showConfirmModal({
            eyebrow: '학습 모드',
            title: '학습 모드 중단',
            message: '학습모드를 중단하시겠습니까? 진행 상황은 저장되며, 이어서 진행할 수 있습니다.',
            confirmText: '중단하기',
            cancelText: '계속 학습'
        });

        if (!confirmed) return;
    }

    LearningMode.leave();
    goBack();
}

startListBtn.addEventListener('click', showVocabSetList);
startLearningBtn.addEventListener('click', () => {
    openLearningMode();
});
startGameModeBtn.addEventListener('click', () => showScreen(gameSelectionMode));
startExamModeBtn.addEventListener('click', () => ExamMode.showSelection());
startDataManagementBtn.addEventListener('click', () => showScreen(dataManagementScreen));
openSpeedQuizBtn.addEventListener('click', () => SpeedQuizMode.start());

backToStartBtn.addEventListener('click', () => {
    if (isViewingWordList) {
        showVocabSetList();
    } else {
        goBack();
    }
});

backToStartFromLearningBtn.addEventListener('click', () => {
    leaveLearningMode();
});

backToStartFromGameSelectionBtn.addEventListener('click', () => goBack());
backToStartFromExamSelectBtn.addEventListener('click', () => goBack());
backToStartFromExamResultBtn.addEventListener('click', () => showScreen(startScreen));
backToStartFromDataMgmtBtn.addEventListener('click', () => goBack());

backToStartFromSpeedQuizBtn.addEventListener('click', async () => {
    if (SpeedQuizMode.isGameRunning()) {
        await SpeedQuizMode.handleQuit();
        return;
    }
    goBack();
});

backToStartFromExamBtn.addEventListener('click', async () => {
    const confirmed = await showConfirmModal({
        eyebrow: '시험 종료',
        title: '시험을 중단하고 나갈까요?',
        message: '진행 상황은 저장되며, 시험 선택 화면에서 이어서 볼 수 있습니다.',
        confirmText: '나가기',
        cancelText: '계속 풀기'
    });

    if (confirmed) {
        showScreen(startScreen);
    }
});

restartLearningBtn.addEventListener('click', () => showScreen(startScreen));
restartSpeedQuizBtn.addEventListener('click', () => SpeedQuizMode.start());

wordCountControls.addEventListener('click', event => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) return;

    const currentValue = parseInt(wordCountInput.value, 10) || 0;
    const changeValue = parseInt(target.dataset.value, 10);
    wordCountInput.value = String(Math.max(1, currentValue + changeValue));
});

rangeCheckbox.addEventListener('change', () => {
    rangeSelection.classList.toggle('hidden', !rangeCheckbox.checked);
});

toggleWordBtn.addEventListener('click', () => {
    areWordsHidden = !areWordsHidden;
    document.querySelectorAll('.vocab-item .japanese-group').forEach(element => {
        element.classList.toggle('concealed', areWordsHidden);
        if (areWordsHidden) element.classList.remove('revealed');
    });
    syncListToolbarButtons();
});

toggleMeaningBtn.addEventListener('click', () => {
    areMeaningsHidden = !areMeaningsHidden;
    document.querySelectorAll('.vocab-item .meaning').forEach(element => {
        element.classList.toggle('concealed', areMeaningsHidden);
        if (areMeaningsHidden) element.classList.remove('revealed');
    });
    syncListToolbarButtons();
});

listJumpNav.addEventListener('click', event => {
    const button = event.target.closest('.list-jump-btn');
    if (!button) return;

    const index = parseInt(button.dataset.blockIndex, 10);
    const marker = document.getElementById(currentJumpMarkers[index]);
    if (!marker) return;

    activateJumpButton(index);
    marker.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

vocabularyListContainer.addEventListener('click', event => {
    const setItem = event.target.closest('.vocab-set-item');
    if (setItem) {
        showWordList(setItem.dataset.type, setItem.dataset.index);
        return;
    }

    const favoriteButton = event.target.closest('.list-favorite-btn');
    if (favoriteButton) {
        const wordId = favoriteButton.dataset.id;
        toggleFavorite(wordId);
        const favorited = isFavorite(wordId);
        favoriteButton.textContent = favorited ? '★' : '☆';
        favoriteButton.classList.toggle('favorited', favorited);
        return;
    }

    const concealedElement = event.target.closest('.concealed');
    if (concealedElement) {
        concealedElement.classList.add('revealed');
    }
});

btnResumeYes.addEventListener('click', () => {
    LearningMode.resume();
    resumeOverlay.classList.add('hidden');
});

btnResumeNo.addEventListener('click', () => {
    LearningMode.clearSession();
    resumeOverlay.classList.add('hidden');
});

exportClipboardBtn.addEventListener('click', async () => {
    clearInlineMessage(dataManagementMessage);
    const data = getAllData();

    try {
        await navigator.clipboard.writeText(data);
        setInlineMessage(dataManagementMessage, '백업 데이터를 클립보드에 복사했습니다.', 'success');
        showToast('백업 데이터를 복사했습니다.', 'success');
    } catch (error) {
        await showTextModal({
            title: '수동 복사',
            description: '자동 복사에 실패했습니다. 아래 JSON을 전체 선택해서 복사하세요.',
            value: data,
            confirmText: '닫기',
            readonly: true
        });
        setInlineMessage(dataManagementMessage, '자동 복사에 실패해 수동 복사 창을 열었습니다.', 'info');
    }
});

exportFileBtn.addEventListener('click', () => {
    clearInlineMessage(dataManagementMessage);
    exportDataAsFile();
    setInlineMessage(dataManagementMessage, '백업 파일 저장을 시작했습니다.', 'success');
});

exportQrBtn.addEventListener('click', async () => {
    await openQrShareModal();
});

importClipboardBtn.addEventListener('click', async () => {
    clearInlineMessage(dataManagementMessage);

    try {
        const text = await navigator.clipboard.readText();
        if (!text) {
            setInlineMessage(dataManagementMessage, '클립보드에 읽을 데이터가 없습니다.', 'error');
            return;
        }

        await confirmRestoreFlow(text, '클립보드');
    } catch (error) {
        const pasted = await openManualImportModal();
        if (pasted) {
            await confirmRestoreFlow(pasted, '붙여넣은 텍스트');
        }
    }
});

importFileBtn.addEventListener('click', () => {
    clearInlineMessage(dataManagementMessage);
    importFileInput.click();
});

importQrBtn.addEventListener('click', async () => {
    await openQrImportModal();
});

importFileInput.addEventListener('change', event => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async loadEvent => {
        if (typeof loadEvent.target.result === 'string') {
            await confirmRestoreFlow(loadEvent.target.result, file.name);
        }
    };
    reader.readAsText(file);
    importFileInput.value = '';
});

qrSharePrevBtn.addEventListener('click', () => {
    if (!qrShareState) return;
    renderQrShareFrame(qrShareState.currentIndex - 1);
    startQrShareAutoplay();
});

qrShareNextBtn.addEventListener('click', () => {
    if (!qrShareState) return;
    renderQrShareFrame(qrShareState.currentIndex + 1);
    startQrShareAutoplay();
});

qrShareCloseBtn.addEventListener('click', () => closeQrShareModal());

qrImportResetBtn.addEventListener('click', () => {
    if (qrImportModal.classList.contains('hidden')) return;
    resetQrImportSession();
    updateQrImportProgress();
});

qrImportCloseBtn.addEventListener('click', () => closeQrImportModal());

window.addEventListener('beforeunload', event => {
    stopQrImportScanner();

    const flashcardSession = document.getElementById('flashcard-session');
    if (flashcardSession && !flashcardSession.classList.contains('hidden')) {
        event.preventDefault();
        event.returnValue = '';
    }
});

document.addEventListener('DOMContentLoaded', () => {
    getOrCreateDeviceId();

    allVocabulary = vocabularySets.flatMap(set => set.words);
    loadFavoriteIds();
    recordVisit();
    syncListToolbarButtons();
    showScreen(startScreen, false);

    if (wordCountInput.value === '' || parseInt(wordCountInput.value, 10) <= 0) {
        wordCountInput.value = '10';
    }

    if (LearningMode.hasSavedSession()) {
        resumeOverlay.classList.remove('hidden');
    }

    ExamMode.init();
    renderStudyDashboard();

    const restoreToast = sessionStorage.getItem(POST_RESTORE_TOAST_KEY);
    if (restoreToast) {
        sessionStorage.removeItem(POST_RESTORE_TOAST_KEY);
        showToast(restoreToast, 'success');
        setInlineMessage(dataManagementMessage, restoreToast, 'success');
    }
});
