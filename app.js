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
const importClipboardBtn = document.getElementById('import-clipboard-btn');
const importFileBtn = document.getElementById('import-file-btn');
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

const toastRegion = document.getElementById('toast-region');

const FAVORITES_KEY = 'japaneseAppFavorites';
const STUDY_HISTORY_KEY = 'japaneseAppStudyHistory';
const POST_RESTORE_TOAST_KEY = 'japaneseAppPostRestoreToast';

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

    if (!confirmModal.classList.contains('hidden')) {
        resolveConfirmModal(false);
    } else if (!dataTextModal.classList.contains('hidden')) {
        resolveTextModal(null);
    }
});

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
    return JSON.stringify(localStorage);
}

function parseRestorePayload(jsonString) {
    try {
        const data = JSON.parse(jsonString);
        if (typeof data !== 'object' || data === null || Array.isArray(data)) {
            return { ok: false, error: '올바른 백업 JSON 형식이 아닙니다.' };
        }

        return { ok: true, data, keyCount: Object.keys(data).length };
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

async function confirmRestoreFlow(rawText, sourceLabel) {
    clearInlineMessage(dataManagementMessage);

    const parsed = parseRestorePayload(rawText);
    if (!parsed.ok) {
        setInlineMessage(dataManagementMessage, parsed.error, 'error');
        return;
    }

    const firstChoice = await showConfirmModal({
        eyebrow: '데이터 복원',
        title: '복원 전에 백업을 권장합니다.',
        message: `${sourceLabel}에서 ${parsed.keyCount}개 항목을 읽었습니다. 현재 데이터는 덮어써집니다.`,
        confirmText: '계속',
        cancelText: '취소',
        extraText: '지금 백업 저장'
    });

    if (firstChoice === 'extra') {
        exportDataAsFile();
        showToast('백업 파일 저장을 시작했습니다.', 'info');
        return;
    }

    if (!firstChoice) return;

    const finalConfirmed = await showConfirmModal({
        eyebrow: '최종 확인',
        title: '정말로 복원할까요?',
        message: '현재 기기의 데이터가 즉시 교체되며, 복원 후 앱이 새로 고쳐집니다.',
        confirmText: '복원하기',
        cancelText: '취소'
    });

    if (!finalConfirmed) return;
    performRestore(parsed.data);
}

function openManualImportModal() {
    return showTextModal({
        title: '복원 데이터 붙여넣기',
        description: '복사한 JSON 백업 데이터를 아래에 붙여넣으세요.',
        confirmText: '복원 준비'
    });
}

startListBtn.addEventListener('click', showVocabSetList);
startLearningBtn.addEventListener('click', () => LearningMode.show());
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
    clearInlineMessage(learningInlineMessage);
    LearningMode.reset();
    goBack();
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

window.addEventListener('beforeunload', event => {
    const flashcardSession = document.getElementById('flashcard-session');
    if (flashcardSession && !flashcardSession.classList.contains('hidden')) {
        event.preventDefault();
        event.returnValue = '';
    }
});

document.addEventListener('DOMContentLoaded', () => {
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
