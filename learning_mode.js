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

    // --- 상태 변수 ---
    let currentVocabulary = [];
    let knownWords = [];
    let unknownWords = [];
    let currentCardIndex = 0;
    let displayFrontFirst = 'japanese';
    let isCardFlipped = false;

    const SESSION_KEY = 'japaneseAppSessionData';

    // --- 내부 함수 ---

    function saveSessionState() {
        if (!flashcardSession.classList.contains('hidden')) {
            const sessionData = {
                currentVocabulary,
                knownWords,
                unknownWords,
                currentCardIndex,
                displayFrontFirst
            };
            localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
        }
    }

    function clearSessionState() {
        localStorage.removeItem(SESSION_KEY);
    }

    function updateCardContent(card) {
        flashcard.classList.remove('flipped');
        isCardFlipped = false;

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
        updateCardContent(currentVocabulary[currentCardIndex]);
        updateProgress();
        saveSessionState();
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

                learningSetup.classList.add('hidden');
                flashcardSession.classList.remove('hidden');
                if (typeof showScreen === 'function') showScreen(learningModeScreen);

                if (currentCardIndex === 0) btnPrevCard.classList.add('hidden');
                else btnPrevCard.classList.remove('hidden');
                
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
            clearSessionState();
        }
    };
})();