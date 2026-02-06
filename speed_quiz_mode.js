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
    let questionStartTime = 0;
    let totalResponseTime = 0; // 총 소요 시간 누적
    let botScore = 0;
    let botCurrentIndex = 0;
    let botTimer = null;
    
    // 봇 설정 변수
    let botBaseTime = 0; // 봇 기준 속도
    let botAccuracy = 0; // 봇 정답률

    // DOM 요소
    const gameScreen = document.getElementById('speed-quiz-mode');
    const menuEl = document.getElementById('speed-quiz-menu');
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
    
    const playerRaceFill = document.getElementById('player-race-fill');
    const botRaceRow = document.getElementById('bot-race-row');
    const botRaceFill = document.getElementById('bot-race-fill');
    const debugInfoEl = document.getElementById('speed-quiz-debug-info');

    // 버튼 이벤트 연결
    document.getElementById('btn-single-mode').addEventListener('click', () => startGame('single'));
    document.getElementById('btn-vs-bot-mode').addEventListener('click', () => startGame('bot'));

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
        
        loadAndDisplayRecords(); // 기록 표시
    }

    // 게임 시작 (모드 선택 후)
    function startGame(mode) {
        gameMode = mode;
        isGameActive = true;
        score = 0;
        botScore = 0;
        botCurrentIndex = 0;
        currentQuestionIndex = 0;
        wrongAnswers = [];
        totalResponseTime = 0;

        // UI 전환
        menuEl.classList.add('hidden');
        gameAreaEl.classList.remove('hidden');
        gameContent.classList.remove('hidden');
        gameResult.classList.add('hidden');

        // 모드별 UI 설정
        playerRaceFill.style.width = '0%';
        if (gameMode === 'bot') {
            botScoreEl.classList.remove('hidden');
            botScoreEl.textContent = `봇: 0`;
            botRaceRow.classList.remove('hidden');
            botRaceFill.style.width = '0%';
            debugInfoEl.classList.remove('hidden');
            
            calculateBotSettings(); // 봇 설정 계산
            runBotTurn(); // 봇 플레이 시작
        } else {
            botScoreEl.classList.add('hidden');
            botRaceRow.classList.add('hidden');
            debugInfoEl.classList.add('hidden');
        }
        
        // 30개 문제 랜덤 선택 (전체 단어에서)
        questions = generateQuestions(allVocabulary, TOTAL_QUESTIONS);
        
        updateScoreDisplay();
        loadNextQuestion();
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
            endGame();
            return;
        }

        const currentQ = questions[currentQuestionIndex];
        progressEl.textContent = `${currentQuestionIndex + 1} / ${questions.length}`;
        
        // 플레이어 레이스 바 업데이트
        const playerProgress = (currentQuestionIndex / questions.length) * 100;
        playerRaceFill.style.width = `${playerProgress}%`;
        
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
            score++;
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

    function updateScoreDisplay() {
        scoreEl.textContent = `점수: ${score}`;
    }

    function endGame() {
        isGameActive = false;
        clearInterval(timerInterval);
        clearTimeout(botTimer); // 봇 정지
        
        // 마지막 문제 진행바 채우기
        playerRaceFill.style.width = '100%';

        gameContent.classList.add('hidden');
        gameResult.classList.remove('hidden');
        finalScoreEl.textContent = `${score} / ${questions.length}`;
        
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
        
        // 기록이 없으면 기본값 사용 (10초, 정답률 50%)
        // 기록이 5개 미만이면 부족한 만큼 기본값으로 채움
        const filledHistory = [...history];
        while (filledHistory.length < 5) {
            filledHistory.push({ time: 10, accuracy: 0.5 });
        }

        // 최근 5회 기록 사용
        const recentHistory = filledHistory.slice(-5);
        
        // 평균 속도 및 정답률 계산
        const avgTime = recentHistory.reduce((sum, h) => sum + h.time, 0) / recentHistory.length;
        const avgAccuracy = recentHistory.reduce((sum, h) => sum + h.accuracy, 0) / recentHistory.length;

        // 봇 설정: 속도는 ±30% 변동, 정답률은 플레이어와 유사하게
        // 속도 계수: 0.7 ~ 1.3
        const speedFactor = 0.7 + Math.random() * 0.6;
        botBaseTime = avgTime * speedFactor;
        botAccuracy = avgAccuracy;

        // 디버그 정보 표시
        debugInfoEl.innerHTML = `
            [DEBUG]<br>
            플레이어 평균 속도: ${avgTime.toFixed(2)}초 / 정답률: ${(avgAccuracy * 100).toFixed(0)}%<br>
            <strong>봇 설정 속도: ${botBaseTime.toFixed(2)}초 / 정답률: ${(botAccuracy * 100).toFixed(0)}%</strong>
        `;
    }

    function runBotTurn() {
        if (!isGameActive || botCurrentIndex >= TOTAL_QUESTIONS) return;

        // 이번 문제 풀이 속도: 설정 속도의 50% ~ 150%
        const currentSpeedFactor = 0.5 + Math.random() * 1.0;
        const solveTime = botBaseTime * currentSpeedFactor;

        botTimer = setTimeout(() => {
            if (!isGameActive) return;

            // 정답 여부 결정
            const isCorrect = Math.random() < botAccuracy;
            if (isCorrect) {
                botScore++;
                botScoreEl.textContent = `봇: ${botScore}`;
            }

            botCurrentIndex++;
            
            // 봇 레이스 바 업데이트
            const botProgress = (botCurrentIndex / TOTAL_QUESTIONS) * 100;
            botRaceFill.style.width = `${botProgress}%`;

            // 다음 문제로 넘어가기 전 딜레이 (플레이어와 동일하게 1초)
            botTimer = setTimeout(runBotTurn, 1000);

        }, solveTime * 1000);
    }

    function saveBotModeHistory(score, avgTime) {
        const history = JSON.parse(localStorage.getItem(BOT_HISTORY_KEY) || '[]');
        const accuracy = score / TOTAL_QUESTIONS;
        
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
        // 만점(전체 정답)인 경우에만 기록 저장
        if (finalScore !== questions.length) return;

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

    // 외부 노출 API
    return {
        start: showMenu // start 호출 시 메뉴를 보여주도록 변경
    };
})();