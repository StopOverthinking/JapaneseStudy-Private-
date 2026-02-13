const ExamMode = (() => {
    // DOM 요소
    const examSelectionScreen = document.getElementById('exam-selection-mode');
    const examScreen = document.getElementById('exam-mode');
    const examResultScreen = document.getElementById('exam-result-mode');
    
    const examSetList = document.getElementById('exam-set-list');
    const examProgress = document.getElementById('exam-progress');
    const examQuestion = document.getElementById('exam-question');
    const examInput = document.getElementById('exam-input');
    const examNextBtn = document.getElementById('exam-next-btn');
    
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
    let userAnswers = []; // 사용자가 입력한 답 배열
    let currentIndex = 0;
    let isHandwritingMode = false;

    const EXAM_SESSION_KEY = 'japaneseAppExamSession';
    const WRONG_ANSWERS_KEY = 'japaneseAppExamWrongAnswers';

    // 초기화
    function init() {
        HandwritingRecognizer.init(hwCanvas);
        
        // 이벤트 리스너
        examNextBtn.addEventListener('click', handleNext);
        hwRecognizeBtn.addEventListener('click', recognizeHandwriting);
        hwClearBtn.addEventListener('click', clearHandwriting);
        toggleInputMethodBtn.addEventListener('click', toggleInputMethod);
        restartExamBtn.addEventListener('click', () => showSelection());
        
        // 후보 단어 클릭 시 입력창에 입력
        hwCandidates.addEventListener('click', (e) => {
            if (e.target.tagName === 'SPAN') {
                examInput.value = e.target.textContent;
                clearHandwriting();
            }
        });

        // 결과 화면 즐겨찾기 버튼 리스너
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
    }

    // 단어장 선택 화면 표시
    function showSelection() {
        examSetList.innerHTML = '';

        // 저장된 세션이 있으면 이어하기 버튼 표시
        if (hasSavedSession()) {
            const sessionData = JSON.parse(localStorage.getItem(EXAM_SESSION_KEY));
            let setName = '알 수 없는 단어장';
            if (sessionData.currentSetIndex === 'wrong_answers') {
                setName = '시험 오답 노트';
            } else if (vocabularySets[sessionData.currentSetIndex]) {
                setName = vocabularySets[sessionData.currentSetIndex].name;
            }
            const progress = `${sessionData.currentIndex + 1} / ${sessionData.questions.length}`;

            const resumeBtn = document.createElement('button');
            resumeBtn.textContent = `완료하지 않은 시험 이어하기\n${setName} (${progress})`;
            resumeBtn.style.backgroundColor = '#FF5722';
            resumeBtn.style.whiteSpace = 'pre-line';
            resumeBtn.onclick = () => resumeSession();
            examSetList.appendChild(resumeBtn);
        }

        // 오답 노트 버튼 추가
        const wrongAnswers = JSON.parse(localStorage.getItem(WRONG_ANSWERS_KEY) || '[]');
        if (wrongAnswers.length > 0) {
            const btn = document.createElement('button');
            btn.textContent = `! 시험 오답 노트 (${wrongAnswers.length}문제)`;
            btn.style.backgroundColor = '#FF5722';
            btn.onclick = () => {
                if (hasSavedSession()) {
                    if (confirm('완료하지 않은 시험 기록이 사라집니다.\n새로운 시험을 시작하시겠습니까?')) {
                        clearSession();
                        startExam('wrong_answers');
                    }
                } else {
                    startExam('wrong_answers');
                }
            };
            examSetList.appendChild(btn);
        }

        vocabularySets.forEach((set, index) => {
            const btn = document.createElement('button');
            btn.textContent = `${set.name} (${set.words.length}문제)`;
            btn.onclick = () => {
                if (hasSavedSession()) {
                    if (confirm('완료하지 않은 시험 기록이 사라집니다.\n새로운 시험을 시작하시겠습니까?')) {
                        clearSession();
                        document.getElementById('app-container').classList.remove('tablet-mode');
                        startExam(index);
                    }
                } else {
                    startExam(index);
                }
            };
            examSetList.appendChild(btn);
        });
        
        showScreen(examSelectionScreen);
    }

    // 시험 시작
    function startExam(setIndex) {
        currentSetIndex = setIndex;
        let sourceWords = [];
        if (setIndex === 'wrong_answers') {
            sourceWords = JSON.parse(localStorage.getItem(WRONG_ANSWERS_KEY) || '[]');
        } else {
            sourceWords = vocabularySets[setIndex].words;
        }
        
        // 단어 순서 무작위 섞기
        questions = [...sourceWords].sort(() => Math.random() - 0.5);
        userAnswers = new Array(questions.length).fill('');
        currentIndex = 0;

        showScreen(examScreen);
        renderQuestion();
        saveSession();
    }

    // 문제 표시
    function renderQuestion() {
        const currentWord = questions[currentIndex];
        examProgress.textContent = `문제 ${currentIndex + 1} / ${questions.length}`;
        examQuestion.textContent = currentWord.meaning; // 한국어 뜻 제시
        examInput.value = userAnswers[currentIndex] || ''; // 기존 입력값 있으면 복원
        examInput.focus();
        
        clearHandwriting();
        
        if (currentIndex === questions.length - 1) {
            examNextBtn.textContent = '제출 및 채점';
        } else {
            examNextBtn.textContent = '다음';
        }
    }

    // 다음 문제로 이동 또는 제출
    function handleNext() {
        const answer = examInput.value.trim();
        if (!answer) {
            if (!confirm('답을 입력하지 않았습니다. 넘어가시겠습니까?')) return;
        }
        
        userAnswers[currentIndex] = answer;
        saveSession();

        if (currentIndex < questions.length - 1) {
            currentIndex++;
            renderQuestion();
        } else {
            finishExam();
        }
    }

    // 시험 종료 및 채점
    function finishExam() {
        let correctCount = 0;
        const wrongDetails = [];

        questions.forEach((q, idx) => {
            const userAnswer = userAnswers[idx];
            // 공백 제거 후 비교 (엄격한 일치)
            if (userAnswer === q.japanese) {
                correctCount++;
            } else {
                wrongDetails.push({
                    question: q,
                    userAnswer: userAnswer
                });
            }
        });

        // 오답 저장 (덮어쓰기)
        const wrongWords = wrongDetails.map(item => item.question);
        localStorage.setItem(WRONG_ANSWERS_KEY, JSON.stringify(wrongWords));

        // 결과 표시
        examScore.textContent = `${correctCount} / ${questions.length}점`;
        examWrongList.innerHTML = '';
        
        if (wrongDetails.length === 0) {
            examWrongList.innerHTML = '<p class="perfect-score">완벽합니다! 모든 문제를 맞췄습니다.</p>';
        } else {
            wrongDetails.forEach(item => {
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
        clearSession(); // 시험 완료 후 세션 삭제
        document.getElementById('app-container').classList.remove('tablet-mode');
    }

    // 손글씨 관련 기능
    function toggleInputMethod() {
        isHandwritingMode = !isHandwritingMode;
        handwritingArea.classList.toggle('hidden', !isHandwritingMode);
        toggleInputMethodBtn.textContent = isHandwritingMode ? '키보드 입력만 사용' : '손글씨 입력 열기';
        
        // 필기 인식 활성화 시 키보드 입력 비활성화
        if (examInput) {
            examInput.disabled = isHandwritingMode;
            examInput.placeholder = isHandwritingMode ? '손글씨로 입력하세요' : '일본어 정답 입력';
        }
        
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
    }

    async function recognizeHandwriting() {
        const results = await HandwritingRecognizer.recognize();
        hwCandidates.innerHTML = '';
        if (results.length > 0) {
            results.forEach(text => {
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

    // 세션 관리 (저장/불러오기)
    function saveSession() {
        const data = {
            currentSetIndex,
            questions,
            userAnswers,
            currentIndex
        };
        localStorage.setItem(EXAM_SESSION_KEY, JSON.stringify(data));
    }

    function hasSavedSession() {
        return !!localStorage.getItem(EXAM_SESSION_KEY);
    }

    function resumeSession() {
        const data = JSON.parse(localStorage.getItem(EXAM_SESSION_KEY));
        if (data) {
            currentSetIndex = data.currentSetIndex;
            questions = data.questions;
            userAnswers = data.userAnswers;
            currentIndex = data.currentIndex;
            
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