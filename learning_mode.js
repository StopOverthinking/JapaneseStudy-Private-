const LearningMode = (() => {
    // --- DOM 요소 참조 ---
    const learningModeScreen = document.getElementById('learning-mode');
    const learningSetup = document.getElementById('learning-setup');
    const flashcardSession = document.getElementById('flashcard-session');
    const vocabSetSelect = document.getElementById('vocab-set-select');
    const rangeCheckbox = document.getElementById('range-checkbox');
    const rangeStartInput = document.getElementById('range-start');
    const rangeEndInput = document.getElementById('range-end');
    const wordCountInput = document.getElementById('word-count');
    const startSessionBtn = document.getElementById('start-session-btn');
    
    const flashcard = document.getElementById('flashcard');
    const cardFront = flashcard.querySelector('.card-front');
    const cardBack = flashcard.querySelector('.card-back');
    const btnPrevCard = document.getElementById('btn-prev-card');
    const btnFavorite = document.getElementById('btn-favorite');
    const btnKnown = document.getElementById('btn-known');
    const btnUnknown = document.getElementById('btn-unknown');
    const toggleReadingCheckbox = document.getElementById('toggle-reading-checkbox');
    const progressText = document.getElementById('progress-text');
    const resultsScreen = document.getElementById('results-screen');

    // --- 동적 생성 요소 변수 ---
    let modeToggleBtn;
    let inputSection;
    let learningInput;
    let checkAnswerBtn;
    let feedbackDiv;
    let toggleHandwritingBtn;
    let handwritingArea;
    let learningCanvas;
    let hwClearBtn;
    let hwRecognizeBtn;
    let hwCandidates;

    // --- 상태 변수 ---
    let currentVocabulary = [];
    let knownWords = [];
    let unknownWords = [];
    let currentCardIndex = 0;
    let displayFrontFirst = 'japanese';
    let isCardFlipped = false;
    let isInputMode = false; // 입력 모드 활성화 여부
    let isHandwritingOpen = false;

    const SESSION_KEY = 'japaneseAppSessionData';

    // --- 내부 함수 ---

    // UI 요소 동적 생성 및 초기화
    function initDynamicUI() {
        if (modeToggleBtn) return; // 이미 초기화됨

        // 1. 모드 토글 버튼 (카드 컨테이너 위에 삽입)
        modeToggleBtn = document.createElement('button');
        modeToggleBtn.id = 'learning-mode-toggle';
        modeToggleBtn.innerHTML = '👁️'; // 기본: 보기 모드
        modeToggleBtn.title = '정답 확인 모드 변경 (직접 확인 / 입력하여 확인)';
        flashcardSession.insertBefore(modeToggleBtn, flashcardSession.querySelector('.card-container'));

        // 2. 입력 섹션 (카드 컨테이너 아래에 삽입)
        inputSection = document.createElement('div');
        inputSection.id = 'learning-input-section';
        inputSection.className = 'hidden';
        inputSection.innerHTML = `
            <div class="input-row">
                <input type="text" id="learning-input" placeholder="일본어 정답 입력" autocomplete="off">
                <button id="btn-check-answer">확인</button>
            </div>
            <div id="learning-feedback"></div>
            <button id="btn-toggle-learning-hw" class="secondary-btn" style="margin-top:10px; width:100%;">손글씨 입력 열기</button>
            <div id="learning-handwriting-area" class="hidden">
                <canvas id="learning-handwriting-canvas" width="300" height="200" style="background:white; border:1px solid #ccc; cursor:crosshair; touch-action:none;"></canvas>
                <div class="hw-controls" style="width:100%; display:flex; gap:5px; margin-top:5px;">
                    <button id="learning-hw-clear" style="flex:1;">지우기</button>
                    <button id="learning-hw-recognize" style="flex:1;">인식하기</button>
                </div>
                <div id="learning-hw-candidates" style="display:flex; gap:5px; flex-wrap:wrap; margin-top:5px; min-height:30px;"></div>
            </div>
        `;
        
        // .learning-options (독음 숨기기 체크박스) 다음에 삽입
        const learningOptions = flashcardSession.querySelector('.learning-options');
        learningOptions.parentNode.insertBefore(inputSection, learningOptions.nextSibling);

        // 요소 참조 저장
        learningInput = inputSection.querySelector('#learning-input');
        checkAnswerBtn = inputSection.querySelector('#btn-check-answer');
        feedbackDiv = inputSection.querySelector('#learning-feedback');
        toggleHandwritingBtn = inputSection.querySelector('#btn-toggle-learning-hw');
        handwritingArea = inputSection.querySelector('#learning-handwriting-area');
        learningCanvas = inputSection.querySelector('#learning-handwriting-canvas');
        hwClearBtn = inputSection.querySelector('#learning-hw-clear');
        hwRecognizeBtn = inputSection.querySelector('#learning-hw-recognize');
        hwCandidates = inputSection.querySelector('#learning-hw-candidates');

        // 이벤트 리스너 연결
        modeToggleBtn.addEventListener('click', toggleInputMode);
        checkAnswerBtn.addEventListener('click', checkAnswer);
        toggleHandwritingBtn.addEventListener('click', toggleHandwritingArea);
        hwClearBtn.addEventListener('click', () => {
            HandwritingRecognizer.clear();
            hwCandidates.innerHTML = '';
        });
        hwRecognizeBtn.addEventListener('click', recognizeHandwriting);
        
        hwCandidates.addEventListener('click', (e) => {
            if (e.target.tagName === 'SPAN') {
                learningInput.value = e.target.textContent;
                HandwritingRecognizer.clear();
                hwCandidates.innerHTML = '';
            }
        });
    }

    function saveSessionState() {
        if (!flashcardSession.classList.contains('hidden')) {
            const sessionData = {
                currentVocabulary,
                knownWords,
                unknownWords,
                currentCardIndex,
                displayFrontFirst,
                isInputMode
            };
            localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
        }
    }

    function clearSessionState() {
        localStorage.removeItem(SESSION_KEY);
    }

    function updateCardContent(card) {
        flashcard.classList.remove('flipped');
        flashcard.classList.remove('card-correct', 'card-wrong'); // 피드백 스타일 초기화
        isCardFlipped = false;
        
        // 입력 모드 초기화
        if (learningInput) {
            learningInput.value = '';
            feedbackDiv.textContent = '';
        }

        // 전역 함수 isFavorite 사용 (app.js에 정의됨)
        const isFav = typeof isFavorite === 'function' ? isFavorite(card.id) : false;
        btnFavorite.textContent = isFav ? '★' : '☆';

        if (displayFrontFirst === 'japanese') {
            cardFront.innerHTML = `<p class="japanese-text">${card.japanese}</p><p class="reading-text">${card.reading}</p>`;
            cardBack.innerHTML = `<p class="meaning-text">${card.meaning}</p>`;
        } else {
            cardFront.innerHTML = `<p class="meaning-text">${card.meaning}</p>`;
            cardBack.innerHTML = `<p class="japanese-text">${card.japanese}</p><p class="reading-text">${card.reading}</p>`;
        }
    }

    function updateProgress() {
        progressText.textContent = `${currentCardIndex + 1}/${currentVocabulary.length}`;
    }

    function flipCard() {
        // 입력 모드에서 아직 정답 확인 안 했으면 뒤집기(정답 보기) 허용하되, 피드백은 초기화
        if (isInputMode && !isCardFlipped) {
            feedbackDiv.textContent = '';
        }
        flashcard.classList.toggle('flipped');
        isCardFlipped = !isCardFlipped;
    }

    function prevCard() {
        if (currentCardIndex > 0) {
            currentCardIndex--;
            updateCardContent(currentVocabulary[currentCardIndex]);
            updateProgress();
            if (currentCardIndex === 0) {
                btnPrevCard.classList.add('hidden');
            }
            saveSessionState();
        }
    }

    function nextCard() {
        currentCardIndex++;
        if (currentCardIndex < currentVocabulary.length) {
            updateCardContent(currentVocabulary[currentCardIndex]);
            updateProgress();
            if (btnPrevCard.classList.contains('hidden')) {
                btnPrevCard.classList.remove('hidden');
            }
        } else {
            endRound();
        }
    }

    function markCard(status) {
        flashcard.classList.add('fade-out');
        setTimeout(() => {
            const currentCard = currentVocabulary[currentCardIndex];

            // 중복 방지 및 상태 변경을 위해 기존 목록에서 현재 카드 제거
            knownWords = knownWords.filter(w => w.id !== currentCard.id);
            unknownWords = unknownWords.filter(w => w.id !== currentCard.id);

            if (status === 'known') {
                knownWords.push(currentCard);
            } else {
                unknownWords.push(currentCard);
            }
            nextCard();
            flashcard.classList.remove('fade-out');
            saveSessionState();
        }, 200);
    }

    function endRound() {
        if (unknownWords.length > 0) {
            alert(`${unknownWords.length}개의 단어를 다시 학습합니다.`);
            startSession(true);
        } else {
            // 전역 함수 showScreen 사용
            if (typeof showScreen === 'function') showScreen(resultsScreen);
            flashcardSession.classList.add('hidden');
            learningSetup.classList.remove('hidden');
            clearSessionState();
        }
    }

    function populateVocabSetSelect() {
        vocabSetSelect.innerHTML = '';
        const allOption = new Option(`전체 단어 (${allVocabulary.length}개)`, 'all');
        vocabSetSelect.add(allOption);

        // 전역 변수 allVocabulary 및 isFavorite 사용
        const favCount = allVocabulary.filter(w => typeof isFavorite === 'function' && isFavorite(w.id)).length;
        const favOption = new Option(`★ 즐겨찾기 (${favCount}개)`, 'favorites');
        vocabSetSelect.add(favOption);

        vocabularySets.forEach((set, index) => {
            const setOption = new Option(`${set.name} (${set.words.length}개)`, `set-${index}`);
            vocabSetSelect.add(setOption);
        });
    }

    function startSession(isRetryRound = false) {
        if (!isRetryRound) {
            const wordCount = parseInt(wordCountInput.value, 10);
            const displayRadio = document.querySelector('input[name="initial-display"]:checked');
            displayFrontFirst = displayRadio ? displayRadio.value : 'japanese';
            const selectedSetKey = vocabSetSelect.value;
            isInputMode = false; // 새 세션 시작 시 기본값

            let sourceWords = [];
            if (selectedSetKey === 'all') {
                sourceWords = allVocabulary;
            } else if (selectedSetKey === 'favorites') {
                sourceWords = allVocabulary.filter(word => typeof isFavorite === 'function' && isFavorite(word.id));
            } else {
                const setIndex = parseInt(selectedSetKey.split('-')[1], 10);
                if (vocabularySets[setIndex]) {
                    sourceWords = vocabularySets[setIndex].words;
                }
            }

            if (rangeCheckbox.checked) {
                const start = parseInt(rangeStartInput.value, 10);
                const end = parseInt(rangeEndInput.value, 10);
                if (isNaN(start) || isNaN(end) || start <= 0 || end <= 0 || start > end) {
                    alert('학습 범위를 올바르게 입력해주세요.');
                    return;
                }
                sourceWords = sourceWords.filter(word => {
                    const wordNum = parseInt(word.id.split('_')[1], 10);
                    return wordNum >= start && wordNum <= end;
                });
                if (sourceWords.length === 0) {
                    alert('지정한 범위에 해당하는 단어가 없습니다.');
                    return;
                }
            }

            if (wordCount <= 0 || isNaN(wordCount)) {
                alert('학습할 단어 개수를 올바르게 입력해주세요.');
                return;
            }
            // 전역 함수 getRandomWords 사용
            currentVocabulary = typeof getRandomWords === 'function' ? getRandomWords(wordCount, sourceWords) : sourceWords.slice(0, wordCount);
            knownWords = [];
            unknownWords = [];
        } else {
            // 전역 함수 shuffleArray 사용
            currentVocabulary = typeof shuffleArray === 'function' ? shuffleArray([...unknownWords]) : [...unknownWords];
            knownWords = [];
            unknownWords = [];
        }

        if (currentVocabulary.length === 0) {
            alert('학습할 단어가 없습니다.');
            return;
        }

        currentCardIndex = 0;
        learningSetup.classList.add('hidden');
        flashcardSession.classList.remove('hidden');
        if (typeof showScreen === 'function') showScreen(learningModeScreen);

        btnPrevCard.classList.add('hidden');
        
        // UI 초기화 및 모드 설정
        initDynamicUI();
        updateModeUI();
        
        updateCardContent(currentVocabulary[currentCardIndex]);
        updateProgress();
        saveSessionState();
    }

    // --- 입력 모드 관련 함수 ---

    function updateModeUI() {
        // 뜻 먼저 보기 모드일 때만 입력 모드 사용 가능
        if (displayFrontFirst === 'meaning') {
            modeToggleBtn.classList.remove('hidden');
        } else {
            modeToggleBtn.classList.add('hidden');
            isInputMode = false;
        }

        if (isInputMode) {
            modeToggleBtn.innerHTML = '✏️'; // 입력 모드 아이콘
            modeToggleBtn.classList.add('input-mode');
            inputSection.classList.remove('hidden');
            // 입력 모드 진입 시 손글씨 인식기 초기화 (캔버스 연결)
            if (isHandwritingOpen) {
                HandwritingRecognizer.init(learningCanvas);
            }
        } else {
            modeToggleBtn.innerHTML = '👁️'; // 보기 모드 아이콘
            modeToggleBtn.classList.remove('input-mode');
            inputSection.classList.add('hidden');
            
            // 입력 모드가 꺼지면 손글씨 모드도 강제 종료
            if (isHandwritingOpen) {
                toggleHandwritingArea();
            }
        }
    }

    function toggleInputMode() {
        isInputMode = !isInputMode;
        updateModeUI();
        saveSessionState();
    }

    function checkAnswer() {
        const input = learningInput.value.trim();
        const currentCard = currentVocabulary[currentCardIndex];
        
        if (!input) return;

        // 이전 피드백 초기화
        flashcard.classList.remove('card-correct', 'card-wrong');

        if (input === currentCard.japanese) {
            feedbackDiv.textContent = '정답입니다! (O)';
            feedbackDiv.className = 'feedback-correct';
            flashcard.classList.add('card-correct');
        } else {
            feedbackDiv.textContent = '틀렸습니다. (X)';
            feedbackDiv.className = 'feedback-wrong';
            flashcard.classList.add('card-wrong');
        }

        // 정답 확인 후 카드 뒤집어서 보여주기
        if (!isCardFlipped) {
            flipCard();
        }
    }

    function toggleHandwritingArea() {
        isHandwritingOpen = !isHandwritingOpen;
        handwritingArea.classList.toggle('hidden', !isHandwritingOpen);
        toggleHandwritingBtn.textContent = isHandwritingOpen ? '손글씨 입력 닫기' : '손글씨 입력 열기';
        
        const appContainer = document.getElementById('app-container');
        if (isHandwritingOpen) {
            appContainer.classList.add('tablet-mode');
            // 캔버스 크기 조정 (레이아웃 변경 후)
            setTimeout(() => {
                learningCanvas.width = learningCanvas.clientWidth;
                learningCanvas.height = learningCanvas.clientHeight;
                HandwritingRecognizer.init(learningCanvas);
            }, 50);
            HandwritingRecognizer.init(learningCanvas);
        } else {
            appContainer.classList.remove('tablet-mode');
        }
    }

    async function recognizeHandwriting() {
        const results = await HandwritingRecognizer.recognize();
        hwCandidates.innerHTML = '';
        results.forEach(text => {
            const span = document.createElement('span');
            span.textContent = text;
            span.style.cssText = 'background:white; border:1px solid #ccc; padding:5px 10px; border-radius:4px; cursor:pointer; font-size:1.2em;';
            hwCandidates.appendChild(span);
        });
    }

    // --- 이벤트 리스너 등록 ---
    startSessionBtn.addEventListener('click', () => startSession(false));
    flashcard.addEventListener('click', flipCard);
    btnPrevCard.addEventListener('click', prevCard);
    btnKnown.addEventListener('click', () => markCard('known'));
    btnUnknown.addEventListener('click', () => markCard('unknown'));
    
    btnFavorite.addEventListener('click', (e) => {
        e.stopPropagation(); // 카드 뒤집기 방지
        const currentCard = currentVocabulary[currentCardIndex];
        if (typeof toggleFavorite === 'function') toggleFavorite(currentCard.id);
        updateCardContent(currentCard); // 버튼 상태 갱신
    });

    toggleReadingCheckbox.addEventListener('change', () => {
        flashcard.classList.toggle('reading-hidden', toggleReadingCheckbox.checked);
    });

    // --- 외부 공개 API ---
    return {
        show: () => {
            if (typeof showScreen === 'function') showScreen(learningModeScreen);
            learningSetup.classList.remove('hidden');
            flashcardSession.classList.add('hidden');
            populateVocabSetSelect();
        },
        resume: () => {
            const savedSession = localStorage.getItem(SESSION_KEY);
            if (savedSession) {
                const data = JSON.parse(savedSession);
                currentVocabulary = data.currentVocabulary;
                knownWords = data.knownWords;
                unknownWords = data.unknownWords;
                currentCardIndex = data.currentCardIndex;
                displayFrontFirst = data.displayFrontFirst;
                isInputMode = data.isInputMode || false;

                learningSetup.classList.add('hidden');
                flashcardSession.classList.remove('hidden');
                if (typeof showScreen === 'function') showScreen(learningModeScreen);

                if (currentCardIndex === 0) btnPrevCard.classList.add('hidden');
                else btnPrevCard.classList.remove('hidden');
                
                initDynamicUI();
                updateModeUI();

                updateCardContent(currentVocabulary[currentCardIndex]);
                updateProgress();
            }
        },
        hasSavedSession: () => !!localStorage.getItem(SESSION_KEY),
        clearSession: clearSessionState,
        reset: () => {
            currentVocabulary = [];
            currentCardIndex = 0;
            flashcardSession.classList.add('hidden');
            learningSetup.classList.remove('hidden');
            document.getElementById('app-container').classList.remove('tablet-mode');
            clearSessionState();
        }
    };
})();