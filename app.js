// app.js

// --- DOM 요소 참조 ---
const startScreen = document.getElementById('start-screen');
const listModeScreen = document.getElementById('list-mode');
const learningMode = document.getElementById('learning-mode');
const resultsScreen = document.getElementById('results-screen');
const gameSelectionMode = document.getElementById('game-selection-mode'); // 게임 선택 화면

const startListBtn = document.getElementById('start-list-btn');
const startLearningBtn = document.getElementById('start-learning-btn');
const startGameModeBtn = document.getElementById('start-game-mode-btn'); // 게임 모드 진입 버튼
const backToStartFromLearningBtn = document.getElementById('back-to-start-from-learning');

const backToStartBtn = document.getElementById('back-to-start-btn');
const vocabularyListContainer = document.getElementById('vocabulary-list-container');
const listControls = document.getElementById('list-controls');
const toggleWordBtn = document.getElementById('toggle-word-btn');
const toggleMeaningBtn = document.getElementById('toggle-meaning-btn');
const wordCountInput = document.getElementById('word-count');
const vocabSetSelect = document.getElementById('vocab-set-select');
const wordCountControls = document.getElementById('word-count-controls');
const rangeCheckbox = document.getElementById('range-checkbox');
const rangeSelection = document.getElementById('range-selection');
const rangeStartInput = document.getElementById('range-start');
const rangeEndInput = document.getElementById('range-end');
const initialDisplayRadios = document.querySelectorAll('input[name="initial-display"]');
const startSessionBtn = document.getElementById('start-session-btn');

const learningSetup = document.getElementById('learning-setup');
const flashcardSession = document.getElementById('flashcard-session');
const flashcard = document.getElementById('flashcard');
const cardFront = flashcard.querySelector('.card-front');
const cardBack = flashcard.querySelector('.card-back');

const toggleReadingCheckbox = document.getElementById('toggle-reading-checkbox');
const btnPrevCard = document.getElementById('btn-prev-card');
const btnKnown = document.getElementById('btn-known');
const btnFavorite = document.getElementById('btn-favorite');
const btnUnknown = document.getElementById('btn-unknown');
const progressText = document.getElementById('progress-text');
const restartLearningBtn = document.getElementById('restart-learning-btn');

const resumeOverlay = document.getElementById('resume-overlay');
const btnResumeYes = document.getElementById('btn-resume-yes');
const btnResumeNo = document.getElementById('btn-resume-no');

// 스피드퀴즈 모드 관련 요소
const backToStartFromGameSelectionBtn = document.getElementById('back-to-start-from-game-selection');
const openSpeedQuizBtn = document.getElementById('open-speed-quiz-btn');
const backToStartFromSpeedQuizBtn = document.getElementById('back-to-start-from-speed-quiz');
const restartSpeedQuizBtn = document.getElementById('restart-speed-quiz-btn');

// --- 전역 상태 변수 ---
let currentVocabulary = []; // 현재 라운드에 학습할 단어들
let knownWords = []; // '알고 있음'으로 분류된 단어들
let unknownWords = []; // '모름'으로 분류된 단어들
let currentCardIndex = 0; // 현재 표시 중인 카드의 인덱스
let displayFrontFirst = 'japanese'; // 'japanese' (일본어/독음) 또는 'meaning' (뜻)
let isCardFlipped = false; // 카드가 뒤집혔는지 여부
let favoriteWordIds = []; // 즐겨찾기된 단어 ID 목록
let isViewingWordList = false; // 목록 모드에서 단어 목록을 보고 있는지 여부
let areWordsHidden = false; // 목록 모드에서 단어가 숨겨졌는지 여부
let areMeaningsHidden = false; // 목록 모드에서 뜻이 숨겨졌는지 여부
let screenHistory = []; // 화면 이동 기록 스택

const SESSION_KEY = 'japaneseAppSessionData';

// 학습 상태 저장
function saveSessionState() {
    // 학습 모드가 활성화되어 있을 때만 저장
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

// 학습 상태 삭제
function clearSessionState() {
    localStorage.removeItem(SESSION_KEY);
}

// --- 즐겨찾기 관리 함수 (localStorage 사용) ---
const FAVORITES_KEY = 'japaneseAppFavorites';

// localStorage에서 즐겨찾기 ID 불러오기
function loadFavoriteIds() {
    const storedFavorites = localStorage.getItem(FAVORITES_KEY);
    favoriteWordIds = storedFavorites ? JSON.parse(storedFavorites) : [];
}

// localStorage에 즐겨찾기 ID 저장하기
function saveFavoriteIds() {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favoriteWordIds));
}

// 단어가 즐겨찾기 상태인지 확인
function isFavorite(wordId) {
    return favoriteWordIds.includes(wordId);
}

// 즐겨찾기 상태 토글
function toggleFavorite(wordId) {
    const index = favoriteWordIds.indexOf(wordId);
    if (index > -1) {
        // 이미 즐겨찾기 상태면 제거
        favoriteWordIds.splice(index, 1);
    } else {
        // 즐겨찾기 상태가 아니면 추가
        favoriteWordIds.push(wordId);
    }
    saveFavoriteIds();
}

// 즐겨찾기 데이터 내보내기
function exportFavorites() {
    const data = JSON.stringify(favoriteWordIds);
    prompt("아래 코드를 전체 복사(Ctrl+A, Ctrl+C)하여 다른 기기에서 '가져오기'를 하세요.", data);
}

// 즐겨찾기 데이터 가져오기
function importFavorites() {
    const data = prompt("다른 기기에서 복사한 코드를 여기에 붙여넣으세요.");
    if (data) {
        try {
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed)) {
                favoriteWordIds = parsed;
                saveFavoriteIds();
                alert("즐겨찾기 데이터가 성공적으로 복원되었습니다.");
                showVocabSetList(); // 목록 화면 갱신
            } else {
                alert("올바르지 않은 데이터 형식입니다.");
            }
        } catch (e) {
            alert("데이터 처리 중 오류가 발생했습니다. 코드를 정확히 복사했는지 확인해주세요.");
        }
    }
}

// --- 유틸리티 함수 ---
// 배열 섞기 (Fisher-Yates 셔플 알고리즘)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]; // ES6 배열 비구조화 할당을 이용한 교환
    }
    return array;
}

// 전체 단어 목록에서 랜덤으로 N개 단어 선택
function getRandomWords(count, data) {
    if (count >= data.length) {
        return shuffleArray([...data]); // 개수가 전체 단어보다 많으면 전체를 섞어서 반환
    }
    const shuffledData = shuffleArray([...data]);
    return shuffledData.slice(0, count);
}

// 화면 전환 함수
function showScreen(screenElement, addToHistory = true) {
    const activeScreen = document.querySelector('.screen.active');
    if (addToHistory && activeScreen && activeScreen !== screenElement) {
        screenHistory.push(activeScreen);
    }

    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    screenElement.classList.add('active');
}

// 뒤로가기 함수
function goBack() {
    if (screenHistory.length > 0) {
        const previousScreen = screenHistory.pop();
        showScreen(previousScreen, false);
    } else {
        showScreen(startScreen, false);
    }
}

// --- 목록 모드 함수 ---

// 단어장 목록 표시
function showVocabSetList() {
    isViewingWordList = false;
    listModeScreen.querySelector('h2').textContent = '단어장';
    vocabularyListContainer.innerHTML = '';

    // 목록 모드 상태 초기화
    areWordsHidden = false;
    areMeaningsHidden = false;
    toggleWordBtn.textContent = '단어 숨기기';
    toggleMeaningBtn.textContent = '뜻 숨기기';
    listControls.classList.add('hidden');


    // 즐겨찾기 단어장 추가
    const favoriteSetItem = document.createElement('div');
    favoriteSetItem.className = 'vocab-set-item favorite-set';
    favoriteSetItem.textContent = `★ 즐겨찾기 (${favoriteWordIds.length}개)`;
    favoriteSetItem.dataset.type = 'favorites';
    vocabularyListContainer.appendChild(favoriteSetItem);

    // 나머지 단어장 목록 추가
    vocabularySets.forEach((set, index) => {
        const setItem = document.createElement('div');
        setItem.className = 'vocab-set-item';
        setItem.textContent = `${set.name} (${set.words.length}개)`;
        setItem.dataset.type = 'set';
        setItem.dataset.index = index;
        vocabularyListContainer.appendChild(setItem);
    });

    // 데이터 관리(내보내기/가져오기) 버튼 영역 추가
    const dataManageContainer = document.createElement('div');
    dataManageContainer.style.marginTop = '30px';
    dataManageContainer.style.textAlign = 'center';
    dataManageContainer.style.borderTop = '1px solid #ddd';
    dataManageContainer.style.paddingTop = '15px';

    const exportBtn = document.createElement('button');
    exportBtn.textContent = '즐겨찾기 내보내기';
    exportBtn.onclick = exportFavorites;
    exportBtn.style.marginRight = '10px';

    const importBtn = document.createElement('button');
    importBtn.textContent = '즐겨찾기 가져오기';
    importBtn.onclick = importFavorites;

    dataManageContainer.appendChild(exportBtn);
    dataManageContainer.appendChild(importBtn);
    vocabularyListContainer.appendChild(dataManageContainer);

    showScreen(listModeScreen);
}

// 특정 단어 목록 표시 (단어장 또는 즐겨찾기)
function showWordList(type, index = -1) {
    isViewingWordList = true;
    vocabularyListContainer.innerHTML = '';

    let wordsToShow = [];
    if (type === 'favorites') {
        listModeScreen.querySelector('h2').textContent = '즐겨찾기';
        wordsToShow = allVocabulary.filter(word => isFavorite(word.id));
    } else { // type === 'set'
        const selectedSet = vocabularySets[index];
        listModeScreen.querySelector('h2').textContent = selectedSet.name;
        wordsToShow = selectedSet.words;
    }

    // 단어 목록이 표시될 때만 컨트롤 버튼 보이기
    listControls.classList.remove('hidden');

    // 품사 태그 맵핑
    const posMap = {
        'noun': '(명)',
        'verb': '(동)',
        'i_adj': '(い)',
        'na_adj': '(な)',
        'conj': '(접)',
        'interj': '(감)',
        'rentaishi': '(연)',
        'adv': '(부)',
        'particle': '(조)',
        'aux_verb': '(조동)'
    };

    // 선택된 단어 목록을 화면에 표시
    wordsToShow.forEach(word => {
        const isFav = isFavorite(word.id);
        const posTag = word.type && posMap[word.type] ? `<span class="pos-tag">${posMap[word.type]}</span>` : '';
        const item = document.createElement('div');
        item.className = 'vocab-item';
        item.dataset.id = word.id;
        item.innerHTML = `
            <div class="word-id">${word.id.split('_')[1]}</div>
            <div class="japanese-group ${areWordsHidden ? 'concealed' : ''}">
                <div class="japanese">${word.japanese}${posTag}</div>
                <div class="reading">${word.reading}</div>
            </div>
            <div class="meaning ${areMeaningsHidden ? 'concealed' : ''}">${word.meaning}</div>
            <button class="list-favorite-btn ${isFav ? 'favorited' : ''}" data-id="${word.id}">
                ${isFav ? '★' : '☆'}
            </button>
        `;
        vocabularyListContainer.appendChild(item);
    });

    if (wordsToShow.length === 0) {
        vocabularyListContainer.innerHTML = '<p style="text-align: center; color: #888; margin-top: 20px;">즐겨찾기한 단어가 없습니다.</p>';
    }
}

// --- 학습 모드 핵심 함수 ---

// 카드 내용 업데이트 및 초기화
function updateCardContent(card) {
    // 카드 뒤집힘 상태 초기화
    flashcard.classList.remove('flipped');
    isCardFlipped = false;

    // 즐겨찾기 버튼 상태 업데이트
    btnFavorite.textContent = isFavorite(card.id) ? '★' : '☆';

    // 사용자의 초기 표시 설정에 따라 앞면과 뒷면 내용 설정
    if (displayFrontFirst === 'japanese') {
        cardFront.innerHTML = `<p class="japanese-text">${card.japanese}</p><p class="reading-text">${card.reading}</p>`;
        cardBack.innerHTML = `<p class="meaning-text">${card.meaning}</p>`;
    } else { // displayFrontFirst === 'meaning'
        cardFront.innerHTML = `<p class="meaning-text">${card.meaning}</p>`;
        cardBack.innerHTML = `<p class="japanese-text">${card.japanese}</p><p class="reading-text">${card.reading}</p>`;
    }
}

// 카드 뒤집기
function flipCard() {
    flashcard.classList.toggle('flipped');
    isCardFlipped = !isCardFlipped;
}

// 진행 상황 텍스트 업데이트
function updateProgress() {
    progressText.textContent = `${currentCardIndex + 1}/${currentVocabulary.length}`;
}

// 이전 카드로 이동
function prevCard() {
    if (currentCardIndex > 0) {
        currentCardIndex--;
        updateCardContent(currentVocabulary[currentCardIndex]);
        updateProgress();
        if (currentCardIndex === 0) {
            btnPrevCard.classList.add('hidden');
        }
        saveSessionState(); // 상태 저장
    }
}

// 다음 카드로 이동
function nextCard() {
    currentCardIndex++;
    if (currentCardIndex < currentVocabulary.length) {
        updateCardContent(currentVocabulary[currentCardIndex]);
        updateProgress();
        // 다음 카드로 이동하면 '이전' 버튼 활성화
        if (btnPrevCard.classList.contains('hidden')) {
            btnPrevCard.classList.remove('hidden');
        }
    } else {
        // 현재 라운드의 모든 카드를 확인했으면 라운드 종료
        endRound();
    }
}

// 카드 분류 ('알고 있음' 또는 '모름')
function markCard(status) {
    // 1. 카드에 fade-out 클래스를 추가하여 애니메이션 시작
    flashcard.classList.add('fade-out');

    // 2. 애니메이션 시간(0.2초)만큼 기다린 후 다음 로직 실행
    setTimeout(() => {
        const currentCard = currentVocabulary[currentCardIndex];
        if (status === 'known') {
            knownWords.push(currentCard);
        } else { // status === 'unknown'
            unknownWords.push(currentCard);
        }
        
        // 다음 카드로 이동
        nextCard();

        // 3. 새 카드가 준비되면 fade-out 클래스를 제거하여 카드를 다시 표시
        flashcard.classList.remove('fade-out');
        saveSessionState(); // 상태 저장
    }, 200); // CSS transition 시간과 일치
}

// 학습 세션 시작 (초기 시작 또는 '모름' 단어 재학습)
function startSession(isRetryRound = false) {
    if (!isRetryRound) {
        const wordCount = parseInt(wordCountInput.value, 10);
        displayFrontFirst = document.querySelector('input[name="initial-display"]:checked').value;
        const selectedSetKey = vocabSetSelect.value;

        let sourceWords = [];
        if (selectedSetKey === 'all') {
            sourceWords = allVocabulary;
        } else if (selectedSetKey === 'favorites') {
            sourceWords = allVocabulary.filter(word => isFavorite(word.id));
        } else {
            // 'set-0', 'set-1' ...
            const setIndex = parseInt(selectedSetKey.split('-')[1], 10);
            if (vocabularySets[setIndex]) {
                sourceWords = vocabularySets[setIndex].words;
            }
        }

        // 범위 지정이 활성화된 경우 단어 필터링
        if (rangeCheckbox.checked) {
            const start = parseInt(rangeStartInput.value, 10);
            const end = parseInt(rangeEndInput.value, 10);

            if (isNaN(start) || isNaN(end) || start <= 0 || end <= 0) {
                alert('학습 범위를 올바르게 입력해주세요.');
                return;
            }
            if (start > end) {
                alert('시작 번호는 끝 번호보다 클 수 없습니다.');
                return;
            }

            // 단어 ID를 기준으로 필터링합니다.
            // vocabulary.js의 단어 ID는 1부터 순차적으로 증가한다고 가정합니다.
            sourceWords = sourceWords.filter(word => {
                const wordNum = parseInt(word.id.split('_')[1], 10);
                return wordNum >= start && wordNum <= end;
            });

            if (sourceWords.length === 0) {
                alert('지정한 범위에 해당하는 단어가 없습니다. 범위를 다시 확인해주세요.');
                return;
            }
        }


        // 첫 학습 세션 설정
        if (wordCount <= 0 || isNaN(wordCount)) {
            alert('학습할 단어 개수를 올바르게 입력해주세요.');
            return;
        }
        currentVocabulary = getRandomWords(wordCount, sourceWords);
        knownWords = [];
        unknownWords = [];
    } else {
        // '모름' 단어 재학습 라운드
        if (unknownWords.length === 0) {
            showScreen(resultsScreen); // 모든 단어를 학습 완료!
            return;
        }
        currentVocabulary = shuffleArray([...unknownWords]); // '모름' 단어만 섞어서 재학습
        knownWords = []; // 이번 라운드의 '알고 있음' 초기화
        unknownWords = []; // 이번 라운드의 '모름' 초기화
    }

    if (currentVocabulary.length === 0) {
        alert('학습할 단어가 없습니다. 단어 목록을 확인해주세요.');
        showScreen(startScreen);
        return;
    }

    currentCardIndex = 0;
    learningSetup.classList.add('hidden'); // 설정 화면 숨기기
    flashcardSession.classList.remove('hidden'); // 플래시카드 화면 보이기
    showScreen(learningMode); // 학습 모드 화면 활성화

    btnPrevCard.classList.add('hidden'); // 첫 카드이므로 '이전' 버튼 숨기기
    updateCardContent(currentVocabulary[currentCardIndex]);
    updateProgress();
    saveSessionState(); // 초기 상태 저장
}

// 라운드 종료 처리
function endRound() {
    if (unknownWords.length > 0) {
        // '모름' 단어가 남아있으면 해당 단어들로 새 라운드 시작
        alert(`${unknownWords.length}개의 단어를 다시 학습합니다.`);
        startSession(true); // 재학습 라운드 시작
    } else {
        // 모든 단어를 '알고 있음'으로 분류했으면 학습 완료
        showScreen(resultsScreen);
        flashcardSession.classList.add('hidden'); // 플래시카드 화면 숨기기
        learningSetup.classList.remove('hidden'); // 다음 학습을 위해 설정 화면 다시 보이기
        clearSessionState(); // 학습 완료 시 임시 데이터 삭제
    }
}

// --- 이벤트 리스너 ---
startListBtn.addEventListener('click', showVocabSetList);

backToStartBtn.addEventListener('click', () => {
    if (isViewingWordList) {
        // 단어 목록을 보고 있었다면 단어장 목록으로 돌아감
        showVocabSetList();
    } else {
        // 단어장 목록을 보고 있었다면 시작 화면으로 돌아감
        goBack();
    }
});

backToStartFromLearningBtn.addEventListener('click', () => {
    // 학습 세션 중단 및 상태 초기화 (선택적)
    currentVocabulary = [];
    currentCardIndex = 0;
    flashcardSession.classList.add('hidden');
    learningSetup.classList.remove('hidden');
    goBack();
    clearSessionState(); // 학습 중단 시 임시 데이터 삭제
});

vocabularyListContainer.addEventListener('click', (e) => {
    const target = e.target;
    if (target.classList.contains('vocab-set-item')) {
        // 단어장 목록에서 아이템 클릭 시
        const type = target.dataset.type;
        const index = target.dataset.index;
        showWordList(type, index);
    } else if (target.classList.contains('list-favorite-btn')) {
        // 단어 목록에서 즐겨찾기 버튼 클릭 시
        const wordId = e.target.dataset.id;
        toggleFavorite(wordId);

        // 버튼 모양 업데이트
        const isFav = isFavorite(wordId);
        e.target.textContent = isFav ? '★' : '☆';
        e.target.classList.toggle('favorited', isFav);
    } else if (target.classList.contains('concealed')) {
        // 숨겨진 단어/뜻 클릭 시 해당 항목만 보이기
        target.classList.add('revealed');
    } else if (target.parentElement.classList.contains('concealed')) {
        // 숨겨진 항목의 자식 요소(p 태그 등)를 클릭했을 경우
        target.parentElement.classList.add('revealed');
    }
});

startLearningBtn.addEventListener('click', () => {
    // 학습 모드 화면을 먼저 보여주고, 그 안의 설정 화면을 표시
    showScreen(learningMode);
    learningSetup.classList.remove('hidden');
    flashcardSession.classList.add('hidden');
    populateVocabSetSelect(); // 학습 모드 진입 시 드롭다운 메뉴 채우기
});

// 게임 모드 진입 버튼
startGameModeBtn.addEventListener('click', () => {
    showScreen(gameSelectionMode);
});

// 게임 선택 화면에서 스피드퀴즈 시작
openSpeedQuizBtn.addEventListener('click', () => {
    SpeedQuizMode.start();
});

// 게임 선택 화면에서 시작 화면으로 돌아가기
backToStartFromGameSelectionBtn.addEventListener('click', () => {
    goBack();
});

// 학습 모드의 단어장 선택 드롭다운 메뉴를 채우는 함수
function populateVocabSetSelect() {
    vocabSetSelect.innerHTML = ''; // 기존 옵션 초기화

    // 1. 전체 단어
    const allOption = new Option(`전체 단어 (${allVocabulary.length}개)`, 'all');
    vocabSetSelect.add(allOption);

    // 2. 즐겨찾기
    const favOption = new Option(`★ 즐겨찾기 (${favoriteWordIds.length}개)`, 'favorites');
    vocabSetSelect.add(favOption);

    // 3. 나머지 단어장
    vocabularySets.forEach((set, index) => {
        const setOption = new Option(`${set.name} (${set.words.length}개)`, `set-${index}`);
        vocabSetSelect.add(setOption);
    });
};

wordCountControls.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') {
        const currentValue = parseInt(wordCountInput.value, 10) || 0;
        const changeValue = parseInt(e.target.dataset.value, 10);
        let newValue = currentValue + changeValue;

        if (newValue < 1) {
            newValue = 1; // 최소값은 1
        }

        wordCountInput.value = newValue;
    }
});

rangeCheckbox.addEventListener('change', () => {
    // 체크박스 상태에 따라 범위 입력 필드를 보이거나 숨김
    rangeSelection.classList.toggle('hidden', !rangeCheckbox.checked);
});

toggleWordBtn.addEventListener('click', () => {
    areWordsHidden = !areWordsHidden;
    toggleWordBtn.textContent = areWordsHidden ? '단어 보이기' : '단어 숨기기';
    document.querySelectorAll('.vocab-item .japanese-group').forEach(el => {
        el.classList.toggle('concealed', areWordsHidden);
        // 전체 토글 시 개별적으로 'revealed' 된 상태는 초기화
        if (areWordsHidden) {
            el.classList.remove('revealed');
        }
    });
});

toggleMeaningBtn.addEventListener('click', () => {
    areMeaningsHidden = !areMeaningsHidden;
    toggleMeaningBtn.textContent = areMeaningsHidden ? '뜻 보이기' : '뜻 숨기기';
    document.querySelectorAll('.vocab-item .meaning').forEach(el => {
        el.classList.toggle('concealed', areMeaningsHidden);
        // 전체 토글 시 개별적으로 'revealed' 된 상태는 초기화
        if (areMeaningsHidden) {
            el.classList.remove('revealed');
        }
    });
});


startSessionBtn.addEventListener('click', () => startSession(false)); // 첫 학습 세션 시작

flashcard.addEventListener('click', flipCard); // 카드 클릭 시 뒤집기

toggleReadingCheckbox.addEventListener('change', () => {
    // 체크박스 상태에 따라 flashcard에 'reading-hidden' 클래스를 토글
    flashcard.classList.toggle('reading-hidden', toggleReadingCheckbox.checked);
});

btnPrevCard.addEventListener('click', prevCard);

btnKnown.addEventListener('click', () => markCard('known'));

btnFavorite.addEventListener('click', () => {
    const currentCard = currentVocabulary[currentCardIndex];
    toggleFavorite(currentCard.id);
    btnFavorite.textContent = isFavorite(currentCard.id) ? '★' : '☆'; // 즉시 버튼 모양 변경
});
btnUnknown.addEventListener('click', () => markCard('unknown'));

restartLearningBtn.addEventListener('click', () => {
    showScreen(startScreen); // 시작 화면으로 돌아가기
    // 필요하다면 세션 관련 상태 초기화
});

// 페이지 이탈 시 확인 메시지
window.addEventListener('beforeunload', (e) => {
    // 학습 세션이 진행 중일 때만 확인
    if (!flashcardSession.classList.contains('hidden')) {
        e.preventDefault();
        e.returnValue = ''; // Chrome 등 최신 브라우저를 위한 설정
    }
});

// 이어하기 버튼 이벤트
btnResumeYes.addEventListener('click', () => {
    const savedSession = localStorage.getItem(SESSION_KEY);
    if (savedSession) {
        const data = JSON.parse(savedSession);
        currentVocabulary = data.currentVocabulary;
        knownWords = data.knownWords;
        unknownWords = data.unknownWords;
        currentCardIndex = data.currentCardIndex;
        displayFrontFirst = data.displayFrontFirst;

        // UI 복원
        resumeOverlay.classList.add('hidden');
        learningSetup.classList.add('hidden');
        flashcardSession.classList.remove('hidden');
        showScreen(learningMode);

        // 카드 상태 복원
        if (currentCardIndex === 0) {
            btnPrevCard.classList.add('hidden');
        } else {
            btnPrevCard.classList.remove('hidden');
        }
        updateCardContent(currentVocabulary[currentCardIndex]);
        updateProgress();
    }
});

btnResumeNo.addEventListener('click', () => {
    clearSessionState();
    resumeOverlay.classList.add('hidden');
});

// 스피드퀴즈 모드에서 게임 선택 화면으로 돌아가기
backToStartFromSpeedQuizBtn.addEventListener('click', () => {
    goBack();
});

// 스피드퀴즈 다시 하기
restartSpeedQuizBtn.addEventListener('click', () => {
    SpeedQuizMode.start();
});

// --- 초기 설정 ---
document.addEventListener('DOMContentLoaded', () => {
    // 등록된 모든 단어장을 합쳐서 전체 단어 목록 생성
    allVocabulary = vocabularySets.flatMap(set => set.words);

    loadFavoriteIds(); // 페이지 로드 시 localStorage에서 즐겨찾기 목록 불러오기
    showScreen(startScreen); // 페이지 로드 시 시작 화면 표시
    // 단어 개수 입력 필드에 기본값 설정
    if (wordCountInput.value === '' || parseInt(wordCountInput.value, 10) <= 0) {
        wordCountInput.value = 10;
    }

    // 저장된 학습 세션이 있는지 확인
    const savedSession = localStorage.getItem(SESSION_KEY);
    if (savedSession) {
        resumeOverlay.classList.remove('hidden');
    }
});
