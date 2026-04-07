const ExamMode = (() => {
    // DOM 요소
    const examSelectionScreen = document.getElementById('exam-selection-mode');
    const examScreen = document.getElementById('exam-mode');
    const examResultScreen = document.getElementById('exam-result-mode');

    const examSetList = document.getElementById('exam-set-list');
    const examContainer = document.querySelector('#exam-mode .exam-container');
    const examProgress = document.getElementById('exam-progress');
    const examQuestion = document.getElementById('exam-question');
    const examInput = document.getElementById('exam-input');
    const examNextBtn = document.getElementById('exam-next-btn');
    const examAutoGradingBtn = document.getElementById('exam-auto-grading-btn');
    const examManualGradingBtn = document.getElementById('exam-manual-grading-btn');
    const examGradingModeDescription = document.getElementById('exam-grading-mode-description');
    const examAnswerPanel = document.getElementById('exam-answer-panel');
    const examCorrectAnswer = document.getElementById('exam-correct-answer');
    const examMarkCorrectBtn = document.getElementById('exam-mark-correct-btn');
    const examMarkWrongBtn = document.getElementById('exam-mark-wrong-btn');

    const hwCanvas = document.getElementById('handwriting-canvas');
    const hwRecognizeBtn = document.getElementById('hw-recognize');
    const hwClearBtn = document.getElementById('hw-clear');
    const hwCandidates = document.getElementById('hw-candidates');
    const toggleInputMethodBtn = document.getElementById('toggle-input-method');
    const handwritingArea = document.getElementById('handwriting-area');

    const examScore = document.getElementById('exam-score');
    const examWrongList = document.getElementById('exam-wrong-list');
    const restartExamBtn = document.getElementById('restart-exam-btn');

    // 상태 변수
    let currentSetIndex = -1;
    let questions = [];
    let userAnswers = [];
    let manualGrades = [];
    let currentIndex = 0;
    let isHandwritingMode = false;
    let gradingMode = 'auto';
    let isAnswerRevealed = false;

    const EXAM_SESSION_KEY = 'japaneseAppExamSession';
    const WRONG_ANSWERS_KEY = 'japaneseAppExamWrongAnswers';

    function getGradingModeLabel(mode = gradingMode) {
        return mode === 'manual' ? '직접 채점' : '자동 채점';
    }

    function getGradingModeDescription(mode = gradingMode) {
        return mode === 'manual'
            ? '정답을 확인한 뒤 문제마다 직접 맞음/틀림을 표시합니다.'
            : '입력한 답안을 마지막에 자동으로 채점합니다.';
    }

    function normalizeGradingMode(mode) {
        return mode === 'manual' ? 'manual' : 'auto';
    }

    function normalizeManualGrades(savedGrades, expectedLength) {
        const normalized = Array.isArray(savedGrades) ? savedGrades.slice(0, expectedLength) : [];
        while (normalized.length < expectedLength) {
            normalized.push(null);
        }

        return normalized.map((value) => {
            if (value === true) return true;
            if (value === false) return false;
            return null;
        });
    }

    function getSetName(setIndex) {
        if (setIndex === 'wrong_answers') {
            return '시험 오답 노트';
        }

        if (vocabularySets[setIndex]) {
            return vocabularySets[setIndex].name;
        }

        return '알 수 없는 단어장';
    }

    function setGradingMode(mode) {
        gradingMode = normalizeGradingMode(mode);

        examAutoGradingBtn.classList.toggle('is-active', gradingMode === 'auto');
        examManualGradingBtn.classList.toggle('is-active', gradingMode === 'manual');
        examGradingModeDescription.textContent = getGradingModeDescription();
    }

    function updateExamInputState() {
        const isInputDisabled = gradingMode === 'manual' || isHandwritingMode || (gradingMode === 'manual' && isAnswerRevealed);
        examInput.disabled = isInputDisabled;
        examInput.placeholder = isHandwritingMode ? '손글씨로 입력하세요' : '일본어 정답 입력';
    }

    function updateExamActionUI() {
        const currentWord = questions[currentIndex];
        const isManualMode = gradingMode === 'manual';

        examContainer.classList.toggle('exam-container-manual', isManualMode);
        examAnswerPanel.classList.toggle('hidden', !(isManualMode && isAnswerRevealed && currentWord));
        examNextBtn.classList.toggle('hidden', isManualMode && isAnswerRevealed);
        toggleInputMethodBtn.disabled = isManualMode || (isManualMode && isAnswerRevealed);

        if (isManualMode && currentWord) {
            examNextBtn.textContent = '정답 확인';
            examCorrectAnswer.textContent = isAnswerRevealed
                ? `${currentWord.japanese} (${currentWord.reading})`
                : '';
        } else if (currentIndex === questions.length - 1) {
            examNextBtn.textContent = '제출 및 채점';
        } else {
            examNextBtn.textContent = '다음';
        }

        updateExamInputState();
    }

    function setHandwritingMode(enabled) {
        isHandwritingMode = Boolean(enabled);
        handwritingArea.classList.toggle('hidden', !isHandwritingMode);
        toggleInputMethodBtn.textContent = isHandwritingMode ? '키보드 입력만 사용' : '손글씨 입력 열기';

        const appContainer = document.getElementById('app-container');
        if (isHandwritingMode) {
            appContainer.classList.add('tablet-mode');
            setTimeout(() => {
                hwCanvas.width = hwCanvas.clientWidth;
                hwCanvas.height = hwCanvas.clientHeight;
                HandwritingRecognizer.init(hwCanvas);
            }, 50);
        } else {
            appContainer.classList.remove('tablet-mode');
        }

        updateExamInputState();
    }

    function getSessionData() {
        const saved = localStorage.getItem(EXAM_SESSION_KEY);
        if (!saved) {
            return null;
        }

        try {
            const data = JSON.parse(saved);
            if (!data || !Array.isArray(data.questions) || data.questions.length === 0) {
                return null;
            }

            data.gradingMode = normalizeGradingMode(data.gradingMode);
            data.userAnswers = Array.isArray(data.userAnswers)
                ? data.userAnswers.slice(0, data.questions.length)
                : [];

            while (data.userAnswers.length < data.questions.length) {
                data.userAnswers.push('');
            }

            data.manualGrades = normalizeManualGrades(data.manualGrades, data.questions.length);

            const parsedIndex = Number.parseInt(data.currentIndex, 10);
            const maxIndex = data.questions.length - 1;
            data.currentIndex = Number.isNaN(parsedIndex)
                ? 0
                : Math.min(Math.max(parsedIndex, 0), maxIndex);

            data.isCompleted = Boolean(data.isCompleted);
            data.isAnswerRevealed = Boolean(data.isAnswerRevealed) && data.gradingMode === 'manual' && !data.isCompleted;

            return data;
        } catch (error) {
            return null;
        }
    }

    // 초기화
    function init() {
        HandwritingRecognizer.init(hwCanvas);

        examNextBtn.addEventListener('click', handleNext);
        hwRecognizeBtn.addEventListener('click', recognizeHandwriting);
        hwClearBtn.addEventListener('click', clearHandwriting);
        toggleInputMethodBtn.addEventListener('click', toggleInputMethod);
        restartExamBtn.addEventListener('click', () => showSelection());
        examAutoGradingBtn.addEventListener('click', () => setGradingMode('auto'));
        examManualGradingBtn.addEventListener('click', () => setGradingMode('manual'));
        examMarkCorrectBtn.addEventListener('click', () => handleManualGrade(true));
        examMarkWrongBtn.addEventListener('click', () => handleManualGrade(false));

        hwCandidates.addEventListener('click', (e) => {
            if (e.target.tagName === 'SPAN') {
                examInput.value = e.target.textContent;
                clearHandwriting();
            }
        });

        examWrongList.addEventListener('click', (e) => {
            if (e.target.classList.contains('list-favorite-btn')) {
                const wordId = e.target.dataset.id;
                if (typeof toggleFavorite === 'function') {
                    toggleFavorite(wordId);
                    const isFav = isFavorite(wordId);
                    e.target.textContent = isFav ? '★' : '☆';
                    e.target.classList.toggle('favorited', isFav);
                }
            }
        });

        setGradingMode('auto');
        updateExamActionUI();
    }

    // 단어장 선택 화면 표시
    function showSelection() {
        examSetList.innerHTML = '';
        setHandwritingMode(false);
        clearHandwriting();
        updateExamActionUI();

        const sessionData = getSessionData();
        if (sessionData) {
            const resumeBtn = document.createElement('button');
            resumeBtn.className = 'exam-set-button resume-exam-button multiline-button';

            const label = getGradingModeLabel(sessionData.gradingMode);
            const setName = getSetName(sessionData.currentSetIndex);
            if (sessionData.isCompleted) {
                resumeBtn.textContent = `이전 시험 결과 보기\n${setName} · ${label}`;
                resumeBtn.classList.add('resume-exam-button-completed');
            } else {
                const progress = `${sessionData.currentIndex + 1} / ${sessionData.questions.length}`;
                resumeBtn.textContent = `완료하지 않은 시험 이어하기\n${setName} · ${label} (${progress})`;
                resumeBtn.classList.add('resume-exam-button-pending');
            }

            resumeBtn.onclick = () => resumeSession();
            examSetList.appendChild(resumeBtn);
        }

        const wrongAnswers = JSON.parse(localStorage.getItem(WRONG_ANSWERS_KEY) || '[]');
        if (wrongAnswers.length > 0) {
            const btn = document.createElement('button');
            btn.className = 'exam-set-button exam-set-button-accent';
            btn.textContent = `! 시험 오답 노트 (${wrongAnswers.length}문제)`;
            btn.onclick = async () => {
                if (hasSavedSession()) {
                    const confirmed = await window.AppUI.showConfirmModal({
                        eyebrow: '시험 시작',
                        title: '이전 시험 기록을 덮어쓸까요?',
                        message: '새 시험을 시작하면 저장된 진행 상황이 사라집니다.',
                        confirmText: '새 시험 시작',
                        cancelText: '취소'
                    });
                    if (!confirmed) return;
                    clearSession();
                }

                startExam('wrong_answers', gradingMode);
            };
            examSetList.appendChild(btn);
        }

        vocabularySets.forEach((set, index) => {
            const btn = document.createElement('button');
            btn.className = 'exam-set-button';
            btn.textContent = `${set.name} (${set.words.length}문제)`;
            btn.onclick = async () => {
                if (hasSavedSession()) {
                    const confirmed = await window.AppUI.showConfirmModal({
                        eyebrow: '시험 시작',
                        title: '이전 시험 기록을 덮어쓸까요?',
                        message: '새 시험을 시작하면 저장된 진행 상황이 사라집니다.',
                        confirmText: '새 시험 시작',
                        cancelText: '취소'
                    });
                    if (!confirmed) return;
                    clearSession();
                }

                startExam(index, gradingMode);
            };
            examSetList.appendChild(btn);
        });

        showScreen(examSelectionScreen);
    }

    // 시험 시작
    function startExam(setIndex, mode = gradingMode) {
        currentSetIndex = setIndex;
        gradingMode = normalizeGradingMode(mode);
        setGradingMode(gradingMode);

        let sourceWords = [];
        if (setIndex === 'wrong_answers') {
            sourceWords = JSON.parse(localStorage.getItem(WRONG_ANSWERS_KEY) || '[]');
        } else {
            sourceWords = vocabularySets[setIndex].words;
        }

        questions = [...sourceWords].sort(() => Math.random() - 0.5);
        userAnswers = new Array(questions.length).fill('');
        manualGrades = new Array(questions.length).fill(null);
        currentIndex = 0;
        isAnswerRevealed = false;

        setHandwritingMode(false);
        showScreen(examScreen);
        renderQuestion();
        saveSession();
    }

    // 문제 표시
    function renderQuestion() {
        const currentWord = questions[currentIndex];
        examProgress.textContent = `문제 ${currentIndex + 1} / ${questions.length}`;
        examQuestion.textContent = currentWord.meaning;
        examInput.value = userAnswers[currentIndex] || '';

        clearHandwriting();
        updateExamActionUI();

        if (!examInput.disabled) {
            examInput.focus();
        }
    }

    // 다음 문제로 이동 또는 제출
    async function handleNext() {
        const answer = gradingMode === 'manual' ? '' : examInput.value.trim();

        if (gradingMode === 'manual') {
            userAnswers[currentIndex] = answer;
            isAnswerRevealed = true;
            setHandwritingMode(false);
            updateExamActionUI();
            saveSession();
            return;
        }

        if (!answer) {
            const confirmed = await window.AppUI.showConfirmModal({
                eyebrow: '빈 답안',
                title: '답을 입력하지 않고 넘어갈까요?',
                message: '빈 칸으로 제출하면 오답으로 기록됩니다.',
                confirmText: '그대로 진행',
                cancelText: '계속 입력'
            });
            if (!confirmed) return;
        }

        userAnswers[currentIndex] = answer;
        saveSession();

        if (currentIndex < questions.length - 1) {
            currentIndex++;
            renderQuestion();
            saveSession();
        } else {
            finishExam();
        }
    }

    function handleManualGrade(isCorrect) {
        manualGrades[currentIndex] = isCorrect;
        saveSession();

        if (currentIndex < questions.length - 1) {
            currentIndex++;
            isAnswerRevealed = false;
            renderQuestion();
            saveSession();
        } else {
            finishExam();
        }
    }

    // 시험 종료 및 채점
    function finishExam() {
        isAnswerRevealed = false;
        setHandwritingMode(false);

        const data = {
            currentSetIndex,
            questions,
            userAnswers,
            manualGrades,
            currentIndex,
            gradingMode,
            isAnswerRevealed,
            isCompleted: true
        };
        localStorage.setItem(EXAM_SESSION_KEY, JSON.stringify(data));

        showResults();
    }

    function showResults() {
        let correctCount = 0;
        const wrongDetails = [];
        const isManualMode = gradingMode === 'manual';

        questions.forEach((q, idx) => {
            const userAnswer = userAnswers[idx] || '';
            const isCorrect = isManualMode ? manualGrades[idx] === true : userAnswer === q.japanese;

            if (isCorrect) {
                correctCount++;
                return;
            }

            wrongDetails.push({
                question: q,
                userAnswer
            });
        });

        const wrongWords = wrongDetails.map((item) => item.question);
        localStorage.setItem(WRONG_ANSWERS_KEY, JSON.stringify(wrongWords));

        examScore.textContent = `${correctCount} / ${questions.length}점`;
        examWrongList.innerHTML = '';

        if (wrongDetails.length === 0) {
            examWrongList.innerHTML = '<p class="perfect-score">완벽합니다! 모든 문제를 맞췄습니다.</p>';
        } else {
            wrongDetails.forEach((item) => {
                const isFav = typeof isFavorite === 'function' ? isFavorite(item.question.id) : false;
                const div = document.createElement('div');
                div.className = 'exam-wrong-item';
                div.innerHTML = `
                    <div class="wrong-content">
                        <div class="wrong-q">뜻: ${item.question.meaning}</div>
                        <div class="wrong-a">내 답: <span class="wrong-text">${item.userAnswer || '(미입력)'}</span></div>
                        <div class="correct-a">정답: <span class="correct-text">${item.question.japanese}</span> (${item.question.reading})</div>
                    </div>
                    <button class="list-favorite-btn ${isFav ? 'favorited' : ''}" data-id="${item.question.id}">
                        ${isFav ? '★' : '☆'}
                    </button>
                `;
                examWrongList.appendChild(div);
            });
        }

        showScreen(examResultScreen);
    }

    // 손글씨 관련 기능
    function toggleInputMethod() {
        setHandwritingMode(!isHandwritingMode);
    }

    async function recognizeHandwriting() {
        const results = await HandwritingRecognizer.recognize();
        hwCandidates.innerHTML = '';
        if (results.length > 0) {
            results.forEach((text) => {
                const span = document.createElement('span');
                span.textContent = text;
                hwCandidates.appendChild(span);
            });
        } else {
            hwCandidates.textContent = '인식 실패';
        }
    }

    function clearHandwriting() {
        HandwritingRecognizer.clear();
        hwCandidates.innerHTML = '';
    }

    // 세션 관리
    function saveSession() {
        const data = {
            currentSetIndex,
            questions,
            userAnswers,
            manualGrades,
            currentIndex,
            gradingMode,
            isAnswerRevealed
        };
        localStorage.setItem(EXAM_SESSION_KEY, JSON.stringify(data));
    }

    function hasSavedSession() {
        return !!getSessionData();
    }

    function resumeSession() {
        const data = getSessionData();
        if (!data) {
            clearSession();
            showSelection();
            return;
        }

        currentSetIndex = data.currentSetIndex;
        questions = data.questions;
        userAnswers = data.userAnswers;
        manualGrades = data.manualGrades;
        currentIndex = data.currentIndex;
        gradingMode = data.gradingMode;
        isAnswerRevealed = data.isAnswerRevealed;

        setGradingMode(gradingMode);
        setHandwritingMode(false);

        if (data.isCompleted) {
            showResults();
        } else {
            showScreen(examScreen);
            renderQuestion();
        }
    }

    function clearSession() {
        localStorage.removeItem(EXAM_SESSION_KEY);
    }

    return {
        init,
        showSelection
    };
})();
