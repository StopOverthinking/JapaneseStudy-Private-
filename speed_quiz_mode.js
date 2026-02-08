const SpeedQuizMode = (() => {
    // 설정 상수
    const QUESTIONS_COUNT_OBJECTIVE = 30;
    const QUESTIONS_COUNT_SUBJECTIVE = 10;
    const TIME_LIMIT_SECONDS = 10;
    const TIME_LIMIT_SUBJECTIVE = 20; // 주관식 문제 시간 (2배)
    const NICKNAME_KEY = 'japaneseAppNickname';
    
    // 상태 변수
    let questions = [];
    let currentQuestionIndex = 0;
    let score = 0;
    let timerInterval = null;
    let timeLeft = 0;
    let isGameActive = false;
    let wrongAnswers = []; // 틀린 단어 저장
    
    // 신규 추가 상태 변수
    let gameMode = 'single'; // 'single' or 'bot'
    let currentQuizType = 'objective'; // 'objective' or 'subjective'
    let selectedSingleType = 'objective'; // 싱글 모드 대기 화면에서 선택된 타입
    let totalQuestions = QUESTIONS_COUNT_OBJECTIVE;
    let playerName = '플레이어';
    let botName = 'Bot';
    let questionStartTime = 0;
    let totalResponseTime = 0; // 총 소요 시간 누적
    let botScore = 0;
    let botCurrentIndex = 0;
    let botTimer = null;
    let playerFinished = false;
    let botFinished = false;
    let totalMaxScore = 0;
    let playerCorrectCount = 0;
    let botCorrectCount = 0;
    let botSurrendered = false;
    
    // 봇 설정 변수
    let botBaseTime = 0; // 봇 기준 속도
    let botAccuracy = 0; // 봇 정답률

    // DOM 요소
    const gameScreen = document.getElementById('speed-quiz-mode');
    const menuEl = document.getElementById('speed-quiz-menu');
    const menuTitle = document.getElementById('speed-quiz-title');
    const modeSelectEl = document.getElementById('speed-quiz-mode-select');
    const singlePreScreenEl = document.getElementById('single-mode-pre-screen');
    const btnStartSingle = document.getElementById('btn-start-single-game');
    const gameAreaEl = document.getElementById('speed-quiz-game-area');
    
    const questionEl = document.getElementById('speed-quiz-question');
    const optionsContainer = document.getElementById('speed-quiz-options');
    const inputAreaEl = document.getElementById('speed-quiz-input-area');
    const quizInputEl = document.getElementById('speed-quiz-input');
    const btnSubmitAnswer = document.getElementById('btn-submit-answer');

    const progressEl = document.getElementById('speed-quiz-progress');
    const scoreEl = document.getElementById('speed-quiz-score');
    const botScoreEl = document.getElementById('speed-quiz-bot-score');
    const timerFill = document.getElementById('speed-quiz-timer-fill');
    const gameContent = document.getElementById('speed-quiz-content');
    const gameResult = document.getElementById('speed-quiz-result');
    const finalScoreEl = document.getElementById('final-score');
    const averageTimeEl = document.getElementById('average-time');
    const wrongListContainer = document.getElementById('speed-quiz-wrong-list');
    const recordListEl = document.getElementById('record-list');
    
    // 티어 관련 DOM
    const tierScreen = document.getElementById('tier-result-screen');
    const tierBadge = document.getElementById('tier-badge');
    const tierNameEl = document.getElementById('tier-name');
    const tierDivisionEl = document.getElementById('tier-division');
    const mmrProgressBar = document.getElementById('mmr-progress-bar');
    const mmrChangeText = document.getElementById('mmr-change-text');
    const closeTierScreenBtn = document.getElementById('close-tier-screen-btn');

    const playerRaceFill = document.getElementById('player-race-fill');
    const botRaceRow = document.getElementById('bot-race-row');
    const botRaceFill = document.getElementById('bot-race-fill');
    const debugInfoEl = document.getElementById('speed-quiz-debug-info');

    // 인트로 및 카운트다운 DOM
    const matchIntroScreen = document.getElementById('match-intro-screen');
    const countdownOverlay = document.getElementById('countdown-overlay');
    const countdownNumber = document.getElementById('countdown-number');

    // 닉네임 관련 DOM
    const currentNicknameEl = document.getElementById('current-nickname');
    const btnEditNickname = document.getElementById('btn-edit-nickname');
    const nicknameModal = document.getElementById('nickname-modal');
    const nicknameEditInput = document.getElementById('nickname-edit-input');
    const btnSaveNickname = document.getElementById('btn-save-nickname');
    const btnCancelNickname = document.getElementById('btn-cancel-nickname');

    // 버튼 이벤트 연결
    document.getElementById('btn-single-objective').addEventListener('click', () => showSinglePreScreen('objective'));
    document.getElementById('btn-single-subjective').addEventListener('click', () => showSinglePreScreen('subjective'));
    document.getElementById('btn-vs-objective').addEventListener('click', () => startMatchmaking('objective'));
    document.getElementById('btn-vs-subjective').addEventListener('click', () => startMatchmaking('subjective'));
    if (closeTierScreenBtn) closeTierScreenBtn.addEventListener('click', closeTierScreen);
    if (btnStartSingle) btnStartSingle.addEventListener('click', () => startGame('single', selectedSingleType));
    
    // 주관식 제출 버튼
    if (btnSubmitAnswer) btnSubmitAnswer.addEventListener('click', handleSubjectiveSubmit);
    if (quizInputEl) {
        quizInputEl.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleSubjectiveSubmit();
        });
    }

    // 닉네임 수정 이벤트
    if (btnEditNickname) btnEditNickname.addEventListener('click', openNicknameModal);
    if (btnSaveNickname) btnSaveNickname.addEventListener('click', saveNickname);
    if (btnCancelNickname) btnCancelNickname.addEventListener('click', closeNicknameModal);

    // 초기화: 즐겨찾기 버튼 이벤트 리스너 등록
    if (wrongListContainer) {
        wrongListContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('list-favorite-btn')) {
                const wordId = e.target.dataset.id;
                if (typeof toggleFavorite === 'function') {
                    toggleFavorite(wordId);
                    // UI 업데이트
                    const isFav = isFavorite(wordId);
                    e.target.textContent = isFav ? '★' : '☆';
                    e.target.classList.toggle('favorited', isFav);
                }
            }
        });
    }

    // --- 닉네임 관리 함수 ---
    function loadNickname() {
        const saved = localStorage.getItem(NICKNAME_KEY);
        playerName = saved || '플레이어';
        if (currentNicknameEl) currentNicknameEl.textContent = playerName;
    }
    
    // 초기화 시 닉네임 로드 (새로고침 시 초기화 방지)
    loadNickname();

    function openNicknameModal() {
        nicknameEditInput.value = playerName;
        nicknameModal.classList.remove('hidden');
        nicknameEditInput.focus();
    }

    function closeNicknameModal() {
        nicknameModal.classList.add('hidden');
    }

    function saveNickname() {
        const newName = nicknameEditInput.value.trim();
        if (newName) {
            playerName = newName;
            localStorage.setItem(NICKNAME_KEY, playerName);
            if (currentNicknameEl) currentNicknameEl.textContent = playerName;
            closeNicknameModal();
        } else {
            alert('닉네임을 입력해주세요.');
        }
    }

    // 모드 진입 (메뉴 표시)
    function showMenu() {
        if (allVocabulary.length < 5) {
            alert('스피드퀴즈 모드를 시작하려면 최소 5개의 단어가 필요합니다.');
            return;
        }
        
        showScreen(gameScreen);
        menuEl.classList.remove('hidden');
        gameAreaEl.classList.add('hidden');
        gameResult.classList.add('hidden');
        tierScreen.classList.remove('active'); // 티어 화면 숨김

        // 메뉴 상태 초기화 (모드 선택 화면)
        menuTitle.textContent = '스피드퀴즈 모드 선택';
        modeSelectEl.classList.remove('hidden');
        singlePreScreenEl.classList.add('hidden');

        // 저장된 닉네임 불러오기
        loadNickname();
    }

    // 싱글 플레이 대기 화면 (기록 + 시작 버튼)
    function showSinglePreScreen(type) {
        selectedSingleType = type;
        const typeName = type === 'objective' ? '객관식' : '발음(주관식)';
        menuTitle.textContent = `싱글 플레이 - ${typeName}`;
        modeSelectEl.classList.add('hidden');
        singlePreScreenEl.classList.remove('hidden');
        
        loadAndDisplayRecords(); // 기록 로드
    }

    // 매칭 시작 함수 (신규)
    function startMatchmaking(type) {
        if (!playerName) {
            alert('닉네임을 설정해주세요.');
            openNicknameModal();
            return;
        }
        
        // 오버레이 표시
        const overlay = document.getElementById('matchmaking-overlay');
        if (overlay) {
            overlay.classList.remove('hidden');
            
            // 2~6초 랜덤 지연
            const delay = 2000 + Math.random() * 4000;
            
            setTimeout(() => {
                overlay.classList.add('hidden');
                startGame('bot', type);
            }, delay);
        } else {
            startGame('bot', type);
        }
    }

    // 게임 시작 (모드 선택 후)
    function startGame(mode, type) {
        gameMode = mode;
        
        if (!playerName) {
            alert('닉네임을 설정해주세요.');
            openNicknameModal();
            return;
        }
        
        // 퀴즈 타입 설정
        currentQuizType = type;
        totalQuestions = currentQuizType === 'objective' ? QUESTIONS_COUNT_OBJECTIVE : QUESTIONS_COUNT_SUBJECTIVE;

        isGameActive = true;
        score = 0;
        botScore = 0;
        botCurrentIndex = 0;
        currentQuestionIndex = 0;
        wrongAnswers = [];
        totalResponseTime = 0;
        playerFinished = false;
        botFinished = false;
        totalMaxScore = 0;
        playerCorrectCount = 0;
        botCorrectCount = 0;
        botSurrendered = false;

        // UI 전환
        menuEl.classList.add('hidden');
        gameAreaEl.classList.remove('hidden');
        gameContent.classList.remove('hidden');
        gameResult.classList.add('hidden');

        // 모드별 UI 설정
        playerRaceFill.style.width = '0%';
        
        // 레이스 바에 닉네임 표시
        const raceLabels = document.querySelectorAll('.race-label');
        if (raceLabels[0]) raceLabels[0].textContent = playerName;

        if (gameMode === 'bot') {
            botScoreEl.classList.remove('hidden');
            botRaceRow.classList.remove('hidden');
            botRaceFill.style.width = '0%';
            debugInfoEl.classList.remove('hidden');
            
            // 봇 닉네임 랜덤 설정
            botName = (typeof BOT_NICKNAMES !== 'undefined' && BOT_NICKNAMES.length > 0) 
                ? BOT_NICKNAMES[Math.floor(Math.random() * BOT_NICKNAMES.length)] 
                : 'AI Bot';
            botScoreEl.textContent = `${botName}: 0`;
            
            // 봇 레이스 라벨 업데이트
            if (raceLabels[1]) raceLabels[1].textContent = botName;
            
            calculateBotSettings(); // 봇 설정 계산
        } else {
            botScoreEl.classList.add('hidden');
            botRaceRow.classList.add('hidden');
            debugInfoEl.classList.add('hidden');
        }
        
        // 문제 생성 (타입에 따라 개수 및 유형 다름)
        questions = generateQuestions(allVocabulary, totalQuestions);
        
        // 전체 만점 점수 계산 (진행 바 비율 계산용)
        totalMaxScore = questions.reduce((sum, q) => {
            const difficulty = q.word.difficulty || 30; // 난이도 없으면 기본 30
            const maxTime = q.type === 'reading_quiz' ? TIME_LIMIT_SUBJECTIVE : TIME_LIMIT_SECONDS;
            return sum + (difficulty * 10 * 2); // 시간 보너스 최대 2배 (공식 동일)
        }, 0);

        // 게임 시작 시퀀스 (인트로 -> 카운트다운 -> 시작)
        if (gameMode === 'bot') {
            showMatchIntro();
        } else {
            startCountdown();
        }
    }

    // 대전 상대 소개 화면
    function showMatchIntro() {
        document.getElementById('intro-player-name').textContent = playerName;
        document.getElementById('intro-bot-name').textContent = botName;
        
        // 퀴즈 타입 표시 (인트로에 추가)
        const typeText = currentQuizType === 'objective' ? '객관식 스피드 퀴즈 (30문제)' : '주관식 발음 퀴즈 (10문제)';
        const typeEl = document.createElement('div');
        typeEl.id = 'intro-quiz-type';
        typeEl.textContent = typeText;
        typeEl.style.position = 'absolute';
        typeEl.style.bottom = '20%';
        typeEl.style.fontSize = '1.5em';
        typeEl.style.color = '#FFC107';
        typeEl.style.fontWeight = 'bold';
        
        // 기존 타입 표시가 있다면 제거
        const oldTypeEl = document.getElementById('intro-quiz-type');
        if(oldTypeEl) oldTypeEl.remove();
        
        matchIntroScreen.querySelector('.vs-container').appendChild(typeEl);

        // .screen 클래스가 있으므로 active 클래스를 추가해야 보임
        matchIntroScreen.classList.remove('hidden');
        matchIntroScreen.classList.add('active');

        setTimeout(() => {
            if(isGameActive) {
                matchIntroScreen.classList.remove('active');
                matchIntroScreen.classList.add('hidden');
            }
            startCountdown();
        }, 2000); // 2초간 표시
    }

    // 3초 카운트다운
    function startCountdown() {
        if (!isGameActive) return;
        countdownOverlay.classList.remove('hidden');
        let count = 3;
        countdownNumber.textContent = count;

        const countInterval = setInterval(() => {
            if (!isGameActive) {
                clearInterval(countInterval);
                countdownOverlay.classList.add('hidden');
                return;
            }
            count--;
            if (count > 0) {
                countdownNumber.textContent = count;
            } else {
                clearInterval(countInterval);
                countdownOverlay.classList.add('hidden');
                beginGameLogic();
            }
        }, 1000);
    }

    // 실제 게임 로직 시작 (타이머 및 봇 시작)
    function beginGameLogic() {
        updateScoreDisplay();
        loadNextQuestion();
        
        if (gameMode === 'bot') {
            runBotTurn(); // 봇 플레이 시작
        }
    }

    // 헬퍼 함수: 뜻에서 쉼표 앞부분만 추출
    function processMeaning(text) {
        if (!text) return "";
        
        // 괄호 안의 쉼표는 무시하고 첫 번째 쉼표에서 자르기
        let depth = 0;
        for (let i = 0; i < text.length; i++) {
            if (text[i] === '(') depth++;
            else if (text[i] === ')') depth = Math.max(0, depth - 1);
            else if (text[i] === ',' && depth === 0) {
                return text.substring(0, i).trim();
            }
        }
        return text.trim();
    }

    // 헬퍼 함수: 중복 검사를 위해 괄호 내용 제거
    function getEffectiveMeaning(text) {
        if (!text) return "";
        return text.replace(/\([^)]*\)/g, '').trim();
    }

    // 문제 생성 (타입에 따라 문제 생성 로직 분리)
    function generateQuestions(sourceData, count) {
        const shuffled = [...sourceData].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, Math.min(count, sourceData.length));
        
        return selected.map(word => {
            let type;
            let answer;

            if (currentQuizType === 'subjective') {
                // 주관식 모드: 100% 발음 퀴즈
                type = 'reading_quiz'; // 주관식 발음 퀴즈
                answer = word.reading; // 정답은 히라가나 독음
            } else {
                // 객관식 모드: 50% 확률로 '단어 보고 뜻' 또는 '뜻 보고 단어'
                type = Math.random() > 0.5 ? 'word_to_meaning' : 'meaning_to_word';
                answer = type === 'word_to_meaning' ? processMeaning(word.meaning) : word.japanese;
            }

            return {
                word: word,
                type: type,
                correctAnswer: answer
            };
        });
    }

    // 다음 문제 로드
    function loadNextQuestion() {
        if (currentQuestionIndex >= questions.length) {
            finishPlayerTurn();
            return;
        }

        const currentQ = questions[currentQuestionIndex];
        progressEl.textContent = `${currentQuestionIndex + 1} / ${questions.length}`;
        
        // 문제 표시
        if (currentQ.type === 'reading_quiz') {
            // 주관식: 일본어 단어 제시 -> 발음 입력
            questionEl.textContent = currentQ.word.japanese;
            questionEl.className = 'japanese-text';
            
            optionsContainer.classList.add('hidden');
            inputAreaEl.classList.remove('hidden');
            quizInputEl.value = '';
            
            // 모바일 키보드 호출을 위해 포커스
            setTimeout(() => quizInputEl.focus(), 100);

        } else if (currentQ.type === 'word_to_meaning') {
            questionEl.textContent = currentQ.word.japanese;
            questionEl.className = 'japanese-text'; // 스타일 적용
            optionsContainer.classList.remove('hidden');
            inputAreaEl.classList.add('hidden');
        } else {
            // 규칙 적용: 문제로 나오는 뜻도 쉼표 앞부분만
            questionEl.textContent = processMeaning(currentQ.word.meaning);
            questionEl.className = 'meaning-text';
            optionsContainer.classList.remove('hidden');
            inputAreaEl.classList.add('hidden');
        }

        if (currentQ.type !== 'reading_quiz') {
            const options = generateOptions(currentQ);
            renderOptions(options, currentQ);
        }

        // 타이머 시작
        questionStartTime = Date.now(); // 시간 측정 시작
        startTimer(currentQ.type === 'reading_quiz' ? TIME_LIMIT_SUBJECTIVE : TIME_LIMIT_SECONDS);
    }

    // 보기 생성 (정답 포함 5개)
    function generateOptions(currentQ) {
        const correct = currentQ.correctAnswer;
        const targetType = currentQ.word.type;
        const targetVerbInfo = currentQ.word.verb_info;
        const isMeaningOptions = currentQ.type === 'word_to_meaning';

        // 중복 검사용 배열 (괄호 제거된 텍스트 기준)
        const selectedEffective = [];
        if (isMeaningOptions) {
            selectedEffective.push(getEffectiveMeaning(correct));
        } else {
            selectedEffective.push(correct);
        }

        const distractors = [];
        const candidates = [...allVocabulary].sort(() => 0.5 - Math.random());

        for (const w of candidates) {
            if (distractors.length >= 4) break;
            if (w.id === currentQ.word.id) continue;
            if (w.type !== targetType) continue;
            if (targetType === 'verb' && targetVerbInfo && w.verb_info !== targetVerbInfo) continue;

            let optionText;
            let effectiveText;

            if (isMeaningOptions) {
                optionText = processMeaning(w.meaning);
                effectiveText = getEffectiveMeaning(optionText);
            } else {
                optionText = w.japanese;
                effectiveText = w.japanese;
            }

            // 중복 검사 (이미 선택된 보기들과 비교)
            if (selectedEffective.includes(effectiveText)) continue;

            distractors.push(optionText);
            selectedEffective.push(effectiveText);
        }
        
        const allOptions = [correct, ...distractors];
        return allOptions.sort(() => 0.5 - Math.random()); // 보기 순서 섞기
    }

    // 보기 렌더링
    function renderOptions(options, currentQ) {
        optionsContainer.innerHTML = '';
        options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'speed-quiz-option-btn';
            btn.textContent = opt;
            btn.onclick = () => handleAnswer(btn, opt === currentQ.correctAnswer);
            optionsContainer.appendChild(btn);
        });
    }

    // 타이머 로직
    function startTimer(limitSeconds) {
        clearInterval(timerInterval);
        timeLeft = limitSeconds;
        updateTimerBar(limitSeconds);

        timerInterval = setInterval(() => {
            timeLeft -= 0.1;
            updateTimerBar(limitSeconds);
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                handleTimeOut();
            }
        }, 100);
    }

    function updateTimerBar(limitSeconds) {
        const percentage = (timeLeft / limitSeconds) * 100;
        timerFill.style.width = `${percentage}%`;
        
        // 시간이 얼마 안 남았을 때 색상 변경
        if (percentage < 30) {
            timerFill.style.backgroundColor = '#dc3545';
        } else {
            timerFill.style.backgroundColor = '#4CAF50';
        }
    }

    // 시각 효과 함수
    function triggerFlash(isCorrect) {
        const className = isCorrect ? 'flash-correct' : 'flash-wrong';
        gameScreen.classList.add(className);
        setTimeout(() => {
            gameScreen.classList.remove(className);
        }, 1000);
    }

    // --- 로마자 -> 히라가나 변환기 (간이 구현) ---
    function toHiragana(input) {
        let str = input.toLowerCase().trim();
        
        // 가타카나 -> 히라가나 변환
        str = str.replace(/[\u30a1-\u30f6]/g, function(match) {
            return String.fromCharCode(match.charCodeAt(0) - 0x60);
        });

        // 로마자 변환 테이블 (주요 패턴)
        const romajiMap = {
            // 모음
            'a': 'あ', 'i': 'い', 'u': 'う', 'e': 'え', 'o': 'お',
            // K행
            'ka': 'か', 'ki': 'き', 'ku': 'く', 'ke': 'け', 'ko': 'こ',
            'kya': 'きゃ', 'kyu': 'きゅ', 'kyo': 'きょ',
            // S행
            'sa': 'さ', 'shi': 'し', 'si': 'し', 'su': 'す', 'se': 'せ', 'so': 'そ',
            'sha': 'しゃ', 'shu': 'しゅ', 'sho': 'しょ', 'sya': 'しゃ', 'syu': 'しゅ', 'syo': 'しょ',
            // T행
            'ta': 'た', 'chi': 'ち', 'ti': 'ち', 'tsu': 'つ', 'tu': 'つ', 'te': 'て', 'to': 'と',
            'cha': 'ちゃ', 'chu': 'ちゅ', 'cho': 'ちょ', 'cya': 'ちゃ', 'cyu': 'ちゅ', 'cyo': 'ちょ',
            'tya': 'ちゃ', 'tyu': 'ちゅ', 'tyo': 'ちょ',
            // N행
            'na': 'な', 'ni': 'に', 'nu': 'ぬ', 'ne': 'ね', 'no': 'の',
            'nya': 'にゃ', 'nyu': 'にゅ', 'nyo': 'にょ', 'nn': 'ん', 'n': 'ん',
            // H행
            'ha': 'は', 'hi': 'ひ', 'fu': 'ふ', 'hu': 'ふ', 'he': 'へ', 'ho': 'ほ',
            'hya': 'ひゃ', 'hyu': 'ひゅ', 'hyo': 'ひょ',
            // M행
            'ma': 'ま', 'mi': 'み', 'mu': 'む', 'me': 'め', 'mo': 'も',
            'mya': 'みゃ', 'myu': 'みゅ', 'myo': 'みょ',
            // Y행
            'ya': 'や', 'yu': 'ゆ', 'yo': 'よ',
            // R행
            'ra': 'ら', 'ri': 'り', 'ru': 'る', 're': 'れ', 'ro': 'ろ',
            'rya': 'りゃ', 'ryu': 'りゅ', 'ryo': 'りょ',
            // W행
            'wa': 'わ', 'wo': 'を',
            // G행
            'ga': 'が', 'gi': 'ぎ', 'gu': 'ぐ', 'ge': 'げ', 'go': 'ご',
            'gya': 'ぎゃ', 'gyu': 'ぎゅ', 'gyo': 'ぎょ',
            // Z행
            'za': 'ざ', 'ji': 'じ', 'zi': 'じ', 'zu': 'ず', 'ze': 'ぜ', 'zo': 'ぞ',
            'ja': 'じゃ', 'ju': 'じゅ', 'jo': 'じょ', 'jya': 'じゃ', 'jyu': 'じゅ', 'jyo': 'じょ',
            // D행
            'da': 'だ', 'di': 'ぢ', 'du': 'づ', 'de': 'で', 'do': 'ど',
            'dya': 'ぢゃ', 'dyu': 'ぢゅ', 'dyo': 'ぢょ',
            // B행
            'ba': 'ば', 'bi': 'び', 'bu': 'ぶ', 'be': 'べ', 'bo': 'ぼ',
            'bya': 'びゃ', 'byu': 'びゅ', 'byo': 'びょ',
            // P행
            'pa': 'ぱ', 'pi': 'ぴ', 'pu': 'ぷ', 'pe': 'ぺ', 'po': 'ぽ',
            'pya': 'ぴゃ', 'pyu': 'ぴゅ', 'pyo': 'ぴょ',
            // 기타
            '-': 'ー'
        };

        // 긴 문자열부터 매칭하기 위해 정렬된 키 사용 권장되나, 여기서는 간단히 반복 치환
        // 3글자 -> 2글자 -> 1글자 순으로 치환해야 함
        // 여기서는 간단한 구현을 위해 반복적으로 치환 시도
        
        // 작은 '츠' (촉음) 처리: 자음 반복 (tt, kk, ss, pp) -> っ
        str = str.replace(/([ksthmyrwgzbpd])\1/g, 'っ$1');

        // 매핑 테이블 적용
        // 3글자 이상 패턴 먼저 처리
        const keys = Object.keys(romajiMap).sort((a, b) => b.length - a.length);
        for (const key of keys) {
            const regex = new RegExp(key, 'g');
            str = str.replace(regex, romajiMap[key]);
        }
        
        return str;
    }

    // 주관식 제출 처리
    function handleSubjectiveSubmit() {
        if (!isGameActive) return;
        const inputVal = quizInputEl.value;
        const converted = toHiragana(inputVal);
        const currentQ = questions[currentQuestionIndex];
        
        // 정답 비교 (히라가나 기준)
        const isCorrect = converted === currentQ.correctAnswer;
        
        // UI 피드백을 위해 가짜 버튼 요소 생성 (시각 효과용)
        const feedbackEl = document.createElement('div');
        handleAnswer(feedbackEl, isCorrect, true); // true = isSubjective
    }

    // 답변 처리
    function handleAnswer(uiElement, isCorrect, isSubjective = false) {
        if (!isGameActive) return;
        clearInterval(timerInterval); // 타이머 정지

        // 소요 시간 계산 및 누적
        const timeTaken = (Date.now() - questionStartTime) / 1000;
        totalResponseTime += timeTaken;
        const currentQ = questions[currentQuestionIndex];
        const limitTime = currentQ.type === 'reading_quiz' ? TIME_LIMIT_SUBJECTIVE : TIME_LIMIT_SECONDS;

        // 모든 버튼 비활성화
        if (!isSubjective) {
            const buttons = optionsContainer.querySelectorAll('button');
            buttons.forEach(b => b.disabled = true);
        } else {
            quizInputEl.disabled = true;
            btnSubmitAnswer.disabled = true;
        }

        triggerFlash(isCorrect);

        if (isCorrect) {
            if (!isSubjective) uiElement.classList.add('correct');
            else quizInputEl.style.backgroundColor = '#d4edda';

            // 점수 계산 (후보 1: 밸런스형)
            const difficulty = currentQ.word.difficulty || 30;
            const calculatedScore = Math.round((difficulty * 10) * (1 + (limitTime - timeTaken) / limitTime));
            score += calculatedScore;
            playerCorrectCount++;
            showScorePopup(calculatedScore);
            updateScoreDisplay();
        } else {
            if (!isSubjective) uiElement.classList.add('wrong');
            else quizInputEl.style.backgroundColor = '#f8d7da';

            // 틀린 단어 저장
            wrongAnswers.push(currentQ.word);

            // 정답 버튼 표시
            if (!isSubjective) {
                const buttons = optionsContainer.querySelectorAll('button');
                buttons.forEach(b => {
                    if (b.textContent === currentQ.correctAnswer) {
                        b.classList.add('correct');
                    }
                });
            } else {
                // 주관식 정답 표시
                quizInputEl.value = `${quizInputEl.value} (정답: ${currentQ.correctAnswer})`;
            }
        }

        // 잠시 후 다음 문제로
        setTimeout(() => {
            // 입력창 초기화
            if (isSubjective) {
                quizInputEl.disabled = false;
                btnSubmitAnswer.disabled = false;
                quizInputEl.style.backgroundColor = '';
            }
            currentQuestionIndex++;
            loadNextQuestion();
        }, 1000);
    }

    function handleTimeOut() {
        // 시간 초과 시 정답 표시 후 넘어감
        const currentQ = questions[currentQuestionIndex];
        const limitTime = currentQ.type === 'reading_quiz' ? TIME_LIMIT_SUBJECTIVE : TIME_LIMIT_SECONDS;
        
        totalResponseTime += limitTime;

        triggerFlash(false);

        // 시간 초과도 틀린 것으로 간주
        wrongAnswers.push(currentQ.word);

        if (currentQ.type === 'reading_quiz') {
            quizInputEl.value = `시간 초과 (정답: ${currentQ.correctAnswer})`;
            quizInputEl.disabled = true;
        } else {
            const buttons = optionsContainer.querySelectorAll('button');
            buttons.forEach(b => {
                b.disabled = true;
                if (b.textContent === currentQ.correctAnswer) {
                    b.classList.add('correct');
                }
            });
        }
        
        setTimeout(() => {
            if (currentQ.type === 'reading_quiz') {
                quizInputEl.disabled = false;
                quizInputEl.value = '';
            }
            currentQuestionIndex++;
            loadNextQuestion();
        }, 1500);
    }

    function showScorePopup(points) {
        const rect = scoreEl.getBoundingClientRect();
        const popup = document.createElement('div');
        popup.className = 'score-popup';
        popup.textContent = `+${points}`;
        
        // 점수판 오른쪽 근처에 표시
        popup.style.position = 'fixed';
        popup.style.left = `${rect.right + 20}px`;
        popup.style.top = `${rect.top}px`;
        popup.style.zIndex = '9999';
        popup.style.color = '#ff5722';
        popup.style.fontWeight = 'bold';
        popup.style.fontSize = '1.5em';
        popup.style.pointerEvents = 'none';
        
        document.body.appendChild(popup);
        
        // 애니메이션
        popup.animate([
            { transform: 'translateY(0)', opacity: 1 },
            { transform: 'translateY(-30px)', opacity: 0 }
        ], {
            duration: 1000,
            easing: 'ease-out'
        });

        setTimeout(() => popup.remove(), 900);
    }

    function updateScoreDisplay() {
        scoreEl.textContent = `점수: ${score}`;
        // 플레이어 레이스 바 업데이트 (진행도 기반: 푼 문제 수)
        // 점수가 0점이어도 진행도는 올라가야 함
        const playerProgress = totalQuestions > 0 ? (currentQuestionIndex / totalQuestions) * 100 : 0;
        playerRaceFill.style.width = `${Math.min(playerProgress, 100)}%`;
    }

    // 플레이어 턴 종료 (봇 대기 로직 포함)
    function finishPlayerTurn() {
        clearInterval(timerInterval);
        playerFinished = true;
        
        // 게임 화면 숨기기
        gameContent.classList.add('hidden');

        if (gameMode === 'single') {
            finalizeGame();
        } else {
            // 봇 기권 로직 체크
            // 조건: 플레이어 정확도 >= 봇 정확도 AND 봇이 20문제 이하로 풀었을 때
            const playerAccuracy = playerCorrectCount / totalQuestions;
            const currentBotAccuracy = botCurrentIndex > 0 ? (botCorrectCount / botCurrentIndex) : 0;

            // 주관식(10문제)일 때는 기권 로직 완화 (4문제 이하일 때만)
            const surrenderThreshold = currentQuizType === 'subjective' ? 4 : 20;

            if (playerAccuracy >= currentBotAccuracy && botCurrentIndex <= surrenderThreshold) {
                // 3~7초 후 기권
                const surrenderDelay = 3000 + Math.random() * 4000;
                setTimeout(() => {
                    // 여전히 게임 중이고 봇이 끝나지 않았다면 기권 처리
                    if (isGameActive && !botFinished) {
                        botSurrendered = true;
                        botFinished = true; // 봇 종료 처리
                        finalizeGame();
                    }
                }, surrenderDelay);
            }

            // 봇 모드일 경우 봇이 끝날 때까지 대기
            if (botFinished) {
                finalizeGame();
            } else {
                // 대기 메시지 표시
                const waitMsg = document.createElement('div');
                waitMsg.id = 'waiting-msg';
                waitMsg.innerHTML = '<h2 style="color:#555;">상대방이 문제를 푸는 중입니다...</h2><p>잠시만 기다려주세요.</p>';
                waitMsg.style.textAlign = 'center';
                waitMsg.style.marginTop = '50px';
                gameAreaEl.appendChild(waitMsg);
            }
        }
    }

    function finalizeGame() {
        isGameActive = false; // 게임 완전 종료
        clearInterval(timerInterval);
        clearTimeout(botTimer); // 봇 정지
        
        // 마지막 문제 진행바 채우기
        playerRaceFill.style.width = '100%';

        gameContent.classList.add('hidden');
        const waitMsg = document.getElementById('waiting-msg');
        if (waitMsg) waitMsg.remove();

        gameResult.classList.remove('hidden');
        
        // 결과 메시지 구성
        let resultText = `${score}점`;
        if (gameMode === 'bot') {
            // 봇 대전일 경우 결과 화면 버튼 변경 (티어 확인하러 가기)
            const restartBtn = document.getElementById('restart-speed-quiz-btn');
            restartBtn.textContent = '티어 변동 확인';
            restartBtn.onclick = () => showTierResult(score > botScore, botSurrendered);

            if (botSurrendered) {
                resultText += ` <span style="color:blue; font-size:1.2em;">(WIN!)</span>`;
                resultText += `<br><span style="font-size:0.9em; color:#FF5722; font-weight:bold;">상대방이 게임을 포기했습니다. (기권)</span>`;
                resultText += `<br><span style="font-size:0.8em; color:#666;">(${botName} 점수: ${botScore}점 / ${botCurrentIndex}문제)</span>`;
            } else if (score > botScore) {
                resultText += ` <span style="color:blue; font-size:1.2em;">(WIN!)</span>`;
            } else if (score < botScore) {
                resultText += ` <span style="color:red; font-size:1.2em;">(LOSE...)</span>`;
            } else {
                resultText += ` <span style="color:gray; font-size:1.2em;">(DRAW)</span>`;
            }
            resultText += `<br><span style="font-size:0.8em; color:#666;">(${botName} 점수: ${botScore}점)</span>`;
        }
        else {
            // 싱글 모드일 경우 원래대로
            const restartBtn = document.getElementById('restart-speed-quiz-btn');
            restartBtn.textContent = '메뉴로 돌아가기';
            restartBtn.onclick = showMenu;
        }
        finalScoreEl.innerHTML = resultText;
        
        // 평균 시간 계산 및 표시
        const avgTime = questions.length > 0 ? (totalResponseTime / questions.length).toFixed(2) : 0;
        averageTimeEl.textContent = avgTime;

        // 싱글 모드일 경우 기록 저장
        if (gameMode === 'single') {
            saveRecord(score, parseFloat(avgTime));
        } else if (gameMode === 'bot') {
            // 봇 모드 기록 저장 (다음 게임 난이도 조절용)
            saveBotModeHistory(score, parseFloat(avgTime));
        }

        // 틀린 단어 목록 렌더링
        wrongListContainer.innerHTML = '';
        if (wrongAnswers.length > 0) {
            const h3 = document.createElement('h3');
            h3.textContent = '틀린 단어 복습';
            h3.style.color = '#dc3545';
            wrongListContainer.appendChild(h3);

            wrongAnswers.forEach(word => {
                const item = document.createElement('div');
                item.className = 'vocab-item';
                const isFav = typeof isFavorite === 'function' ? isFavorite(word.id) : false;
                
                item.innerHTML = `
                    <div class="word-id">${word.id.split('_')[1]}</div>
                    <div class="japanese-group">
                        <div class="japanese">${word.japanese}</div>
                        <div class="reading">${word.reading}</div>
                    </div>
                    <div class="meaning">${word.meaning}</div>
                    <button class="list-favorite-btn ${isFav ? 'favorited' : ''}" data-id="${word.id}">
                        ${isFav ? '★' : '☆'}
                    </button>
                `;
                wrongListContainer.appendChild(item);
            });
        } else {
            wrongListContainer.innerHTML = '<p style="color: #4CAF50; font-weight: bold; margin-top: 20px;">축하합니다! 모든 문제를 맞췄습니다!</p>';
        }
    }

    // --- 봇 로직 ---
    const BOT_HISTORY_KEY = 'speedQuizBotHistory';
    const BOT_HISTORY_KEY_SUBJECTIVE = 'speedQuizBotHistory_subjective';

    function calculateBotSettings() {
        // 퀴즈 타입에 따라 다른 히스토리 키 사용
        const historyKey = currentQuizType === 'subjective' ? BOT_HISTORY_KEY_SUBJECTIVE : BOT_HISTORY_KEY;
        const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
        
        // 기록이 없으면 기본값 사용
        // 객관식: 5초, 정답률 70%
        // 주관식: 15초, 정답률 40%
        const defaultTime = currentQuizType === 'subjective' ? 15 : 5;
        const defaultAccuracy = currentQuizType === 'subjective' ? 0.4 : 0.7;

        // 기록이 5개 미만이면 부족한 만큼 기본값으로 채움
        const filledHistory = [...history];
        while (filledHistory.length < 5) {
            filledHistory.push({ time: defaultTime, accuracy: defaultAccuracy });
        }

        // 최근 5회 기록 사용
        const recentHistory = filledHistory.slice(-5);
        
        // 평균 속도 및 정답률 계산
        const avgTime = recentHistory.reduce((sum, h) => sum + h.time, 0) / recentHistory.length;
        // 데이터 오염 방지를 위해 accuracy 최대값 1로 제한 (기존에 잘못 저장된 10000% 데이터 방어)
        const avgAccuracy = recentHistory.reduce((sum, h) => sum + Math.min(h.accuracy, 1), 0) / recentHistory.length;

        // 봇 설정: 속도는 ±30% 변동, 정답률은 플레이어와 유사하게
        // 속도 계수: 0.7 ~ 1.3
        const speedFactor = 0.7 + Math.random() * 0.6;
        botBaseTime = avgTime * speedFactor;
        botAccuracy = avgAccuracy;

        // 디버그 정보 표시
        debugInfoEl.innerHTML = `
            [DEBUG]<br>
            모드: ${currentQuizType === 'objective' ? '객관식' : '주관식'}<br>
            플레이어(${playerName}) 평균 속도: ${avgTime.toFixed(2)}초 / 정답률: ${(avgAccuracy * 100).toFixed(0)}%<br>
            <strong>봇 설정 속도: ${botBaseTime.toFixed(2)}초 / 정답률: ${(botAccuracy * 100).toFixed(0)}%</strong>
        `;
    }

    function runBotTurn() {
        // 게임이 강제 종료되었거나 봇이 이미 끝났으면 중단
        if (!isGameActive || botFinished) return;

        // 이번 문제 풀이 속도: 설정 속도의 50% ~ 150%
        const currentSpeedFactor = 0.5 + Math.random() * 1.0;
        const solveTime = botBaseTime * currentSpeedFactor;
        
        // 봇이 현재 풀고 있는 문제 정보 가져오기 (플레이어와 동일한 문제 세트 사용 가정)
        const currentQ = questions[botCurrentIndex];
        const difficulty = currentQ ? (currentQ.word.difficulty || 30) : 30;
        const isSubjective = currentQ && currentQ.type === 'reading_quiz';
        const limitTime = isSubjective ? TIME_LIMIT_SUBJECTIVE : TIME_LIMIT_SECONDS;
        
        // 주관식 문제는 봇도 2배의 시간이 걸린다고 가정
        // calculateBotSettings에서 이미 주관식 기록을 기반으로 계산하므로 추가 보정은 최소화
        // 다만, 객관식 기록이 섞여있을 경우를 대비해 최소 시간 보장
        const effectiveSolveTime = Math.max(solveTime, 1.0);

        botTimer = setTimeout(() => {
            if (!isGameActive) return;

            // 정답 여부 결정
            const isCorrect = Math.random() < botAccuracy;
            if (isCorrect) {
                botCorrectCount++;
                // 봇 점수 계산 (플레이어와 동일 공식)
                // 봇의 소요 시간은 solveTime이지만, 제한시간(10초)을 넘기면 0점 처리 로직 등은 단순화하여
                // 10초 이내에 풀었다고 가정하고 계산 (혹은 solveTime이 10초 넘으면 0점)
                let points = 0;
                if (effectiveSolveTime <= limitTime) {
                    points = Math.round((difficulty * 10) * (1 + (limitTime - effectiveSolveTime) / limitTime));
                }
                
                botScore += points;
                botScoreEl.textContent = `${botName}: ${botScore}`;
            }

            botCurrentIndex++;
            
            // 봇 레이스 바 업데이트 (진행도 기반: 푼 문제 수)
            const botProgress = totalQuestions > 0 ? (botCurrentIndex / totalQuestions) * 100 : 0;
            botRaceFill.style.width = `${Math.min(botProgress, 100)}%`;

            if (botCurrentIndex >= totalQuestions) {
                botFinished = true;
                if (playerFinished) {
                    finalizeGame();
                }
            } else {
                // 다음 문제로 넘어가기 전 딜레이 (플레이어와 동일하게 1초)
                botTimer = setTimeout(runBotTurn, 1000);
            }

        }, effectiveSolveTime * 1000);
    }

    function saveBotModeHistory(score, avgTime) {
        const historyKey = currentQuizType === 'subjective' ? BOT_HISTORY_KEY_SUBJECTIVE : BOT_HISTORY_KEY;
        const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
        
        // 문제를 푼 개수가 너무 적으면 기록하지 않음 (객관식 10개, 주관식 3개 기준)
        const minQuestions = currentQuizType === 'subjective' ? 3 : 10;
        if (currentQuestionIndex <= minQuestions) return;

        // 점수제가 변경되었으므로 score(점수) 대신 playerCorrectCount(맞춘 개수)로 정확도 계산
        const accuracy = playerCorrectCount / totalQuestions;
        
        history.push({ time: avgTime, accuracy: accuracy });
        
        // 최근 20개 기록만 유지
        if (history.length > 20) {
            history.shift();
        }
        
        localStorage.setItem(historyKey, JSON.stringify(history));
    }

    // --- 기록 관리 (싱글 플레이) ---
    const RECORDS_KEY = 'speedQuizRecords';
    const RECORDS_KEY_SUBJECTIVE = 'speedQuizRecords_subjective';

    function saveRecord(finalScore, avgTime) {
        // 점수제 변경으로 인해 만점 기준이 모호해졌으므로, 상위 10위 안에 들면 저장하도록 변경하거나
        // 일단 여기서는 기존 로직(만점 저장)을 유지하되, 점수가 높아졌으므로 기준을 수정해야 함.
        // 임시로: 0점 이상이면 저장 (Top 10 로직에 맡김)
        if (finalScore <= 0) return;

        const key = currentQuizType === 'subjective' ? RECORDS_KEY_SUBJECTIVE : RECORDS_KEY;
        const records = JSON.parse(localStorage.getItem(key) || '[]');
        const newRecord = {
            score: finalScore,
            time: avgTime,
            date: new Date().toLocaleDateString()
        };
        
        records.push(newRecord);
        
        // 정렬: 점수 높은 순 -> 시간 짧은 순
        records.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return a.time - b.time;
        });

        // Top 10 유지
        const top10 = records.slice(0, 10);
        localStorage.setItem(key, JSON.stringify(top10));
    }

    function loadAndDisplayRecords() {
        const key = selectedSingleType === 'subjective' ? RECORDS_KEY_SUBJECTIVE : RECORDS_KEY;
        const records = JSON.parse(localStorage.getItem(key) || '[]');
        recordListEl.innerHTML = '';
        
        if (records.length === 0) {
            recordListEl.innerHTML = '<li style="justify-content:center; color:#999;">아직 만점 기록이 없습니다.</li>';
            return;
        }

        records.forEach((rec, index) => {
            const li = document.createElement('li');
            li.innerHTML = `<span class="record-rank">${index + 1}위</span> <span class="record-score">${rec.score}점</span> <span class="record-time">평균 ${rec.time}초</span> <span class="record-date">${rec.date}</span>`;
            recordListEl.appendChild(li);
        });
    }

    // --- 티어 시스템 로직 ---
    const MMR_KEY = 'speedQuizPlayerMMR';
    const MMR_KEY_SUBJECTIVE = 'speedQuizPlayerMMR_subjective';
    
    // 티어 정의
    const TIERS = [
        { name: 'Bronze', color: '#cd7f32', min: 0 },
        { name: 'Silver', color: '#c0c0c0', min: 500 },
        { name: 'Gold', color: '#ffd700', min: 1000 },
        { name: 'Platinum', color: '#00ced1', min: 1500 },
        { name: 'Emerald', color: '#50c878', min: 2000 },
        { name: 'Master', color: '#9932cc', min: 2500 },
        { name: 'Champion', color: '#ff4500', min: 3000 }
    ];

    function getPlayerMMR() {
        const key = currentQuizType === 'subjective' ? MMR_KEY_SUBJECTIVE : MMR_KEY;
        return parseInt(localStorage.getItem(key) || '0', 10);
    }

    function setPlayerMMR(mmr) {
        const key = currentQuizType === 'subjective' ? MMR_KEY_SUBJECTIVE : MMR_KEY;
        localStorage.setItem(key, Math.max(0, Math.round(mmr)));
    }

    function getTierInfo(mmr) {
        let tier = TIERS[0];
        for (let i = TIERS.length - 1; i >= 0; i--) {
            if (mmr >= TIERS[i].min) {
                tier = TIERS[i];
                break;
            }
        }

        // 챔피언은 단계 없음
        if (tier.name === 'Champion') {
            return { ...tier, division: '', lp: mmr - tier.min };
        }

        // 그 외 티어는 5단계 (0~99: 5, 100~199: 4, ...)
        const relativeMMR = mmr - tier.min;
        const divisionIndex = Math.floor(relativeMMR / 100); // 0, 1, 2, 3, 4
        const division = 5 - divisionIndex; // 5, 4, 3, 2, 1
        const lp = relativeMMR % 100;

        return { ...tier, division: division, lp: lp };
    }

    // 봇의 실력을 MMR로 환산
    function calculateBotRating(accuracy, baseTime) {
        // 기준: 
        // 최하위 (Acc 0.3, Time 10s) -> MMR 0
        // 최상위 (Acc 1.0, Time 1s) -> MMR 3000
        
        // 공식: R = 2800 * (Acc - 0.3) + 115 * (10 - Time)
        // Acc < 0.3 이면 0.3으로 보정, Time > 10 이면 10으로 보정
        
        const effAcc = Math.max(0.3, accuracy);
        const effTime = Math.min(10, Math.max(1, baseTime));
        
        const rating = 2800 * (effAcc - 0.3) + 115 * (10 - effTime);
        return Math.max(0, Math.round(rating));
    }

    function toRoman(num) {
        const romans = {1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V'};
        return romans[num] || num;
    }

    function showTierResult(isWin, isSurrender) {
        // 결과 화면 숨기고 티어 화면 표시
        gameResult.classList.add('hidden');
        showScreen(tierScreen);

        const currentMMR = getPlayerMMR();
        const botRating = calculateBotRating(botAccuracy, botBaseTime);
        
        // Elo Rating 계산
        // 승리 확률 기대값 E = 1 / (1 + 10^((Rb - Rp) / 400))
        const expectedScore = 1 / (1 + Math.pow(10, (botRating - currentMMR) / 400));
        
        // 실제 점수 (승: 1, 패: 0, 무승부: 0.5)
        let actualScore = 0;
        if (isWin) actualScore = 1;
        else if (score === botScore) actualScore = 0.5; // 무승부
        
        // K-Factor (변동폭 계수)
        const K = 50;
        
        let mmrChange = Math.round(K * (actualScore - expectedScore));
        
        // 기권승 보너스 (약간 더 줌)
        if (isSurrender) mmrChange += 10;

        // 최소/최대 변동폭 보정 (너무 적게 변하면 재미없음)
        if (isWin && mmrChange < 10) mmrChange = 10;
        if (!isWin && actualScore === 0 && mmrChange > -5) mmrChange = -5;

        const newMMR = Math.max(0, currentMMR + mmrChange);
        setPlayerMMR(newMMR);

        // UI 업데이트
        const tierInfo = getTierInfo(newMMR);
        
        tierBadge.style.backgroundColor = tierInfo.color;
        tierBadge.textContent = tierInfo.name[0]; // 첫 글자만 표시
        
        if (tierInfo.name === 'Champion') {
            tierNameEl.textContent = tierInfo.name;
            tierDivisionEl.textContent = `${tierInfo.lp} LP`;
            mmrProgressBar.style.width = '100%'; // 챔피언은 꽉 참
        } else {
            // 예: Bronze III
            tierNameEl.textContent = `${tierInfo.name} ${toRoman(tierInfo.division)}`;
            tierDivisionEl.textContent = `${tierInfo.lp} / 100 LP`;
            // 애니메이션을 위해 setTimeout 사용
            mmrProgressBar.style.width = '0%';
            setTimeout(() => {
                mmrProgressBar.style.width = `${tierInfo.lp}%`;
            }, 100);
        }
        
        tierNameEl.style.color = tierInfo.color;

        // 변동 텍스트
        const sign = mmrChange >= 0 ? '+' : '';
        mmrChangeText.textContent = `${sign}${mmrChange} LP`;
        mmrChangeText.style.color = mmrChange >= 0 ? '#4CAF50' : '#dc3545';

        // 디버그용: 봇 레이팅 표시 (콘솔)
        console.log(`Bot Rating: ${botRating}, Player MMR: ${currentMMR} -> ${newMMR}, Change: ${mmrChange}`);
    }

    function closeTierScreen() {
        showMenu();
    }

    // 게임 중 이탈 처리
    function handleQuit() {
        if (!isGameActive) {
            showMenu();
            return;
        }

        let msg = '게임 중 이탈 시 진행 상황은 저장되지 않습니다.\n정말 나가시겠습니까?';
        if (gameMode === 'bot') {
            msg = '게임 중 이탈하면 패배 처리됩니다.\n(점수/LP가 하락합니다)\n정말 나가시겠습니까?';
        }

        if (confirm(msg)) {
            // 패배 처리 로직
            isGameActive = false;
            clearInterval(timerInterval);
            clearTimeout(botTimer);

            if (gameMode === 'bot') {
                // 현재까지의 기록 저장 (10문제 초과 시에만 saveBotModeHistory 내부에서 저장됨)
                const avgTime = currentQuestionIndex > 0 ? (totalResponseTime / currentQuestionIndex) : 0;
                saveBotModeHistory(score, avgTime);

                // 레이팅 패배 처리 (강제 패배)
                // showTierResult를 호출하되, 화면을 보여주지 않고 내부 계산만 하거나
                // 혹은 패배 화면을 잠깐 보여주고 나가는 방식이 자연스러움.
                // 여기서는 MMR만 깎고 메뉴로 이동.
                
                // 강제로 봇 점수를 높게 설정하여 패배 처리
                botScore = score + 100; 
                showTierResult(false, false); // isWin=false, isSurrender=false
                
                // 티어 화면이 떴을 텐데, 바로 닫고 메뉴로 이동
                tierScreen.classList.remove('active');
                matchIntroScreen.classList.remove('active');
                matchIntroScreen.classList.add('hidden');
            }
            
            showMenu();
        }
    }

    // 외부 노출 API
    return {
        start: showMenu,
        handleQuit: handleQuit, // 이탈 처리 함수 노출
        isGameRunning: () => isGameActive,
        stopGame: () => {
            isGameActive = false;
            clearInterval(timerInterval);
            clearTimeout(botTimer);
        }
    };
})();