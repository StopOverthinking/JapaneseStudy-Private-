const SpeedQuizMode = (() => {
    // 설정 상수
    const TOTAL_QUESTIONS = 30;
    const TIME_LIMIT_SECONDS = 10;
    
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

    // 버튼 이벤트 연결
    document.getElementById('btn-single-mode').addEventListener('click', showSinglePreScreen);
    document.getElementById('btn-vs-bot-mode').addEventListener('click', () => startGame('bot'));
    if (closeTierScreenBtn) closeTierScreenBtn.addEventListener('click', closeTierScreen);
    if (btnStartSingle) btnStartSingle.addEventListener('click', () => startGame('single'));

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
    }

    // 싱글 플레이 대기 화면 (기록 + 시작 버튼)
    function showSinglePreScreen() {
        menuTitle.textContent = '싱글 플레이';
        modeSelectEl.classList.add('hidden');
        singlePreScreenEl.classList.remove('hidden');
        
        loadAndDisplayRecords(); // 기록 로드
    }

    // 게임 시작 (모드 선택 후)
    function startGame(mode) {
        gameMode = mode;
        
        // 플레이어 닉네임 가져오기
        const inputName = document.getElementById('player-nickname-input').value.trim();
        playerName = inputName || '플레이어';

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
            
            calculateBotSettings(); // 봇 설정 계산
        } else {
            botScoreEl.classList.add('hidden');
            botRaceRow.classList.add('hidden');
            debugInfoEl.classList.add('hidden');
        }
        
        // 30개 문제 랜덤 선택 (전체 단어에서)
        questions = generateQuestions(allVocabulary, TOTAL_QUESTIONS);
        
        // 전체 만점 점수 계산 (진행 바 비율 계산용)
        totalMaxScore = questions.reduce((sum, q) => {
            const difficulty = q.word.difficulty || 30; // 난이도 없으면 기본 30
            return sum + (difficulty * 10 * 2); // 시간 보너스 최대 2배 적용 시 점수
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
        matchIntroScreen.classList.remove('hidden');

        setTimeout(() => {
            matchIntroScreen.classList.add('hidden');
            startCountdown();
        }, 2000); // 2초간 표시
    }

    // 3초 카운트다운
    function startCountdown() {
        countdownOverlay.classList.remove('hidden');
        let count = 3;
        countdownNumber.textContent = count;

        const countInterval = setInterval(() => {
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

    // 문제 생성 (단어 30개 뽑기 + 문제 유형 결정)
    function generateQuestions(sourceData, count) {
        const shuffled = [...sourceData].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, Math.min(count, sourceData.length));
        
        return selected.map(word => {
            // 50% 확률로 '단어 보고 뜻 맞추기' 또는 '뜻 보고 단어 맞추기'
            const type = Math.random() > 0.5 ? 'word_to_meaning' : 'meaning_to_word';
            return {
                word: word,
                type: type,
                correctAnswer: type === 'word_to_meaning' ? word.meaning : word.japanese
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
        
        // 문제 표시 (발음은 표시하지 않음)
        if (currentQ.type === 'word_to_meaning') {
            questionEl.textContent = currentQ.word.japanese;
            questionEl.className = 'japanese-text'; // 스타일 적용
        } else {
            questionEl.textContent = currentQ.word.meaning;
            questionEl.className = 'meaning-text';
        }

        // 보기 생성 (정답 1개 + 오답 4개)
        const options = generateOptions(currentQ);
        renderOptions(options, currentQ);

        // 타이머 시작
        questionStartTime = Date.now(); // 시간 측정 시작
        startTimer();
    }

    // 보기 생성 (정답 포함 5개)
    function generateOptions(currentQ) {
        const correct = currentQ.correctAnswer;
        const targetType = currentQ.word.type;
        const targetVerbInfo = currentQ.word.verb_info;

        const distractors = allVocabulary
            .filter(w => {
                if (w.id === currentQ.word.id) return false; // 정답 단어 제외
                if (w.type !== targetType) return false; // 품사 다르면 제외
                
                // 동사이고 verb_info가 있는 경우, 같은 종류끼리만 묶음
                if (targetType === 'verb' && targetVerbInfo) {
                    return w.verb_info === targetVerbInfo;
                }
                return true;
            })
            .sort(() => 0.5 - Math.random()) // 섞기
            .slice(0, 4) // 4개 선택 (부족하면 부족한 대로)
            .map(w => currentQ.type === 'word_to_meaning' ? w.meaning : w.japanese);
        
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
    function startTimer() {
        clearInterval(timerInterval);
        timeLeft = TIME_LIMIT_SECONDS;
        updateTimerBar();

        timerInterval = setInterval(() => {
            timeLeft -= 0.1;
            updateTimerBar();
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                handleTimeOut();
            }
        }, 100);
    }

    function updateTimerBar() {
        const percentage = (timeLeft / TIME_LIMIT_SECONDS) * 100;
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

    // 답변 처리
    function handleAnswer(btnElement, isCorrect) {
        if (!isGameActive) return;
        clearInterval(timerInterval); // 타이머 정지

        // 소요 시간 계산 및 누적
        const timeTaken = (Date.now() - questionStartTime) / 1000;
        totalResponseTime += timeTaken;

        // 모든 버튼 비활성화
        const buttons = optionsContainer.querySelectorAll('button');
        buttons.forEach(b => b.disabled = true);

        const currentQ = questions[currentQuestionIndex];

        triggerFlash(isCorrect);

        if (isCorrect) {
            btnElement.classList.add('correct');
            // 점수 계산 (후보 1: 밸런스형)
            const difficulty = currentQ.word.difficulty || 30;
            const calculatedScore = Math.round((difficulty * 10) * (1 + (TIME_LIMIT_SECONDS - timeTaken) / TIME_LIMIT_SECONDS));
            score += calculatedScore;
            playerCorrectCount++;
            showScorePopup(calculatedScore);
            updateScoreDisplay();
        } else {
            btnElement.classList.add('wrong');
            // 틀린 단어 저장
            wrongAnswers.push(currentQ.word);

            // 정답 버튼 표시
            buttons.forEach(b => {
                if (b.textContent === currentQ.correctAnswer) {
                    b.classList.add('correct');
                }
            });
        }

        // 잠시 후 다음 문제로
        setTimeout(() => {
            currentQuestionIndex++;
            loadNextQuestion();
        }, 1000);
    }

    function handleTimeOut() {
        // 시간 초과 시 정답 표시 후 넘어감
        // 시간 초과 시 10초(제한시간)를 소요 시간으로 간주
        totalResponseTime += TIME_LIMIT_SECONDS;

        triggerFlash(false);

        const buttons = optionsContainer.querySelectorAll('button');
        const currentQ = questions[currentQuestionIndex];
        
        // 시간 초과도 틀린 것으로 간주
        wrongAnswers.push(currentQ.word);

        buttons.forEach(b => {
            b.disabled = true;
            if (b.textContent === currentQ.correctAnswer) {
                b.classList.add('correct');
            }
        });
        
        setTimeout(() => {
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
        popup.style.left = `${rect.right + 10}px`;
        popup.style.top = `${rect.top}px`;
        
        document.body.appendChild(popup);
        setTimeout(() => popup.remove(), 1000);
    }

    function updateScoreDisplay() {
        scoreEl.textContent = `점수: ${score}`;
        // 플레이어 레이스 바 업데이트 (점수 기반)
        const playerProgress = totalMaxScore > 0 ? (score / totalMaxScore) * 100 : 0;
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
            const playerAccuracy = playerCorrectCount / TOTAL_QUESTIONS;
            const currentBotAccuracy = botCurrentIndex > 0 ? (botCorrectCount / botCurrentIndex) : 0;

            if (playerAccuracy >= currentBotAccuracy && botCurrentIndex <= 20) {
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
                waitMsg.innerHTML = '<h2 style="color:#555;">상대방(봇)이 문제를 푸는 중입니다...</h2><p>잠시만 기다려주세요.</p>';
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

    function calculateBotSettings() {
        const history = JSON.parse(localStorage.getItem(BOT_HISTORY_KEY) || '[]');
        
        // 기록이 없으면 기본값 사용 (5초, 정답률 70%) - 요청사항 반영
        // 기록이 5개 미만이면 부족한 만큼 기본값으로 채움
        const filledHistory = [...history];
        while (filledHistory.length < 5) {
            filledHistory.push({ time: 5, accuracy: 0.7 });
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
                if (solveTime <= TIME_LIMIT_SECONDS) {
                    points = Math.round((difficulty * 10) * (1 + (TIME_LIMIT_SECONDS - solveTime) / TIME_LIMIT_SECONDS));
                }
                
                botScore += points;
                botScoreEl.textContent = `${botName}: ${botScore}`;
            }

            botCurrentIndex++;
            
            // 봇 레이스 바 업데이트
            const botProgress = totalMaxScore > 0 ? (botScore / totalMaxScore) * 100 : 0;
            botRaceFill.style.width = `${Math.min(botProgress, 100)}%`;

            if (botCurrentIndex >= TOTAL_QUESTIONS) {
                botFinished = true;
                if (playerFinished) {
                    finalizeGame();
                }
            } else {
                // 다음 문제로 넘어가기 전 딜레이 (플레이어와 동일하게 1초)
                botTimer = setTimeout(runBotTurn, 1000);
            }

        }, solveTime * 1000);
    }

    function saveBotModeHistory(score, avgTime) {
        const history = JSON.parse(localStorage.getItem(BOT_HISTORY_KEY) || '[]');
        
        // 문제를 푼 개수가 10개 이하라면 기록하지 않음 (요청사항 반영)
        if (currentQuestionIndex <= 10) return;

        // 점수제가 변경되었으므로 score(점수) 대신 playerCorrectCount(맞춘 개수)로 정확도 계산
        const accuracy = playerCorrectCount / TOTAL_QUESTIONS;
        
        history.push({ time: avgTime, accuracy: accuracy });
        
        // 최근 20개 기록만 유지
        if (history.length > 20) {
            history.shift();
        }
        
        localStorage.setItem(BOT_HISTORY_KEY, JSON.stringify(history));
    }

    // --- 기록 관리 (싱글 플레이) ---
    const RECORDS_KEY = 'speedQuizRecords';

    function saveRecord(finalScore, avgTime) {
        // 점수제 변경으로 인해 만점 기준이 모호해졌으므로, 상위 10위 안에 들면 저장하도록 변경하거나
        // 일단 여기서는 기존 로직(만점 저장)을 유지하되, 점수가 높아졌으므로 기준을 수정해야 함.
        // 임시로: 0점 이상이면 저장 (Top 10 로직에 맡김)
        if (finalScore <= 0) return;

        const records = JSON.parse(localStorage.getItem(RECORDS_KEY) || '[]');
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
        localStorage.setItem(RECORDS_KEY, JSON.stringify(top10));
    }

    function loadAndDisplayRecords() {
        const records = JSON.parse(localStorage.getItem(RECORDS_KEY) || '[]');
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
        return parseInt(localStorage.getItem(MMR_KEY) || '0', 10);
    }

    function setPlayerMMR(mmr) {
        localStorage.setItem(MMR_KEY, Math.max(0, Math.round(mmr)));
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
        tierNameEl.textContent = tierInfo.name;
        tierNameEl.style.color = tierInfo.color;
        
        if (tierInfo.name === 'Champion') {
            tierDivisionEl.textContent = `${tierInfo.lp} LP`;
            mmrProgressBar.style.width = '100%'; // 챔피언은 꽉 참
        } else {
            tierDivisionEl.textContent = `${tierInfo.division}단계 (${tierInfo.lp} / 100 LP)`;
            // 애니메이션을 위해 setTimeout 사용
            mmrProgressBar.style.width = '0%';
            setTimeout(() => {
                mmrProgressBar.style.width = `${tierInfo.lp}%`;
            }, 100);
        }

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

        if (confirm('게임 중 이탈 시 패배 처리됩니다.\n정말 나가시겠습니까?')) {
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
            }
            
            showMenu();
        }
    }

    // 외부 노출 API
    return {
        start: showMenu,
        handleQuit: handleQuit // 이탈 처리 함수 노출
    };
})();