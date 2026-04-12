import { shuffleArray } from '@/lib/random'
import type { VocabularyWord, WordType } from '@/features/vocab/model/types'
import { smartReviewPromptOverrides } from '@/features/smart-review/smartReviewPromptLibrary'
import type {
  SmartReviewProfile,
  SmartReviewProfileMap,
  SmartReviewSessionItemState,
  SmartReviewSessionResult,
  SmartReviewSessionRecord,
  SmartReviewSetupSummary,
  SmartReviewStudyPrompt,
  StartSmartReviewPayload,
} from '@/features/smart-review/smartReviewTypes'

const REVIEW_INTERVALS_DAYS = [1, 3, 7, 14, 30, 90] as const
const INITIAL_SUCCESS_STAGE = 2

function addDays(base: Date, days: number) {
  const next = new Date(base)
  next.setDate(next.getDate() + days)
  return next
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function normalizeDate(value: unknown) {
  return typeof value === 'string' && value.length > 0 ? value : null
}

function normalizeFiniteNumber(value: unknown, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, Math.trunc(value))
  }

  const parsed = Number.parseInt(String(value ?? fallback), 10)
  return Number.isFinite(parsed) ? Math.max(0, parsed) : fallback
}

export function normalizeSmartReviewProfile(raw: unknown, wordId: string): SmartReviewProfile {
  if (!isObject(raw)) {
    return createEmptyProfile(wordId)
  }

  const status = raw.status
  const normalizedStatus =
    status === 'learning' || status === 'reviewing' || status === 'mastered' ? status : 'new'

  return {
    wordId,
    status: normalizedStatus,
    stage: normalizeFiniteNumber(raw.stage),
    dueAt: normalizeDate(raw.dueAt),
    lastReviewedAt: normalizeDate(raw.lastReviewedAt),
    totalCorrectSessions: normalizeFiniteNumber(raw.totalCorrectSessions),
    totalWrongSessions: normalizeFiniteNumber(raw.totalWrongSessions),
    consecutiveCorrectSessions: normalizeFiniteNumber(raw.consecutiveCorrectSessions),
    lapseCount: normalizeFiniteNumber(raw.lapseCount),
    masteredAt: normalizeDate(raw.masteredAt),
  }
}

export function normalizeSmartReviewProfileMap(raw: unknown): SmartReviewProfileMap {
  if (!isObject(raw)) return {}

  const entries = Object.entries(raw).map(([wordId, value]) => [wordId, normalizeSmartReviewProfile(value, wordId)] as const)
  return Object.fromEntries(entries)
}

export function createEmptyProfile(wordId: string): SmartReviewProfile {
  return {
    wordId,
    status: 'new',
    stage: 0,
    dueAt: null,
    lastReviewedAt: null,
    totalCorrectSessions: 0,
    totalWrongSessions: 0,
    consecutiveCorrectSessions: 0,
    lapseCount: 0,
    masteredAt: null,
  }
}

export function normalizeSmartReviewSessionRecord(raw: unknown): SmartReviewSessionRecord | null {
  if (!isObject(raw)) return null
  if (!Array.isArray(raw.selectedWordIds) || !Array.isArray(raw.activeQueue)) return null

  const selectedWordIds = raw.selectedWordIds.filter((value): value is string => typeof value === 'string')
  const activeQueue = raw.activeQueue.filter((value): value is string => typeof value === 'string')
  const retryQueue = Array.isArray(raw.retryQueue)
    ? raw.retryQueue.filter((value): value is string => typeof value === 'string')
    : []

  if (selectedWordIds.length === 0 || activeQueue.length === 0) return null

  const currentIndex = Math.min(
    normalizeFiniteNumber(raw.currentIndex),
    Math.max(0, activeQueue.length - 1),
  )

  const rawItemStates = isObject(raw.itemStates) ? raw.itemStates : {}
  const itemStates = Object.fromEntries(
    selectedWordIds.map((wordId) => {
      const state = rawItemStates[wordId]
      const normalizedState: SmartReviewSessionItemState = isObject(state)
        ? {
            wordId,
            attempts: normalizeFiniteNumber(state.attempts),
            wrongCount: normalizeFiniteNumber(state.wrongCount),
            answeredCorrectly: Boolean(state.answeredCorrectly),
          }
        : {
            wordId,
            attempts: 0,
            wrongCount: 0,
            answeredCorrectly: false,
          }

      return [wordId, normalizedState]
    }),
  )

  return {
    status: 'active',
    setId:
      raw.setId === 'all' || raw.setId === 'favorites' || typeof raw.setId === 'string'
        ? raw.setId
        : 'all',
    setName: typeof raw.setName === 'string' && raw.setName.trim().length > 0 ? raw.setName : '스마트 복습',
    selectedWordIds,
    activeQueue,
    retryQueue,
    currentIndex,
    currentWordId:
      typeof raw.currentWordId === 'string' && raw.currentWordId.length > 0
        ? raw.currentWordId
        : activeQueue[currentIndex] ?? null,
    round: Math.max(1, normalizeFiniteNumber(raw.round, 1)),
    itemStates,
    isAnswerRevealed: Boolean(raw.isAnswerRevealed),
    revealedIsCorrect:
      raw.revealedIsCorrect === true ? true : raw.revealedIsCorrect === false ? false : null,
    revealedAnswer: typeof raw.revealedAnswer === 'string' ? raw.revealedAnswer : '',
    startedAt: typeof raw.startedAt === 'string' ? raw.startedAt : new Date().toISOString(),
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : new Date().toISOString(),
  }
}

export function buildSmartReviewSummary(words: VocabularyWord[], profileMap: SmartReviewProfileMap, now = new Date()): SmartReviewSetupSummary {
  let dueCount = 0
  let newCount = 0
  let learningCount = 0
  let masteredCount = 0

  for (const word of words) {
    const profile = profileMap[word.id]
    if (!profile || profile.status === 'new') {
      newCount += 1
      continue
    }

    if (profile.status === 'mastered') {
      masteredCount += 1
      continue
    }

    learningCount += 1

    if (!profile.dueAt || new Date(profile.dueAt).getTime() <= now.getTime()) {
      dueCount += 1
    }
  }

  return { dueCount, newCount, learningCount, masteredCount }
}

export function selectSmartReviewWords(payload: StartSmartReviewPayload, profileMap: SmartReviewProfileMap, now = new Date()) {
  const dueWords: VocabularyWord[] = []
  const newWords: VocabularyWord[] = []

  for (const word of payload.words) {
    const profile = profileMap[word.id]
    if (!profile || profile.status === 'new') {
      newWords.push(word)
      continue
    }

    if (profile.status === 'mastered') {
      continue
    }

    if (!profile.dueAt || new Date(profile.dueAt).getTime() <= now.getTime()) {
      dueWords.push(word)
    }
  }

  dueWords.sort((left, right) => {
    const leftProfile = profileMap[left.id]
    const rightProfile = profileMap[right.id]
    const leftDue = leftProfile?.dueAt ? new Date(leftProfile.dueAt).getTime() : 0
    const rightDue = rightProfile?.dueAt ? new Date(rightProfile.dueAt).getTime() : 0
    if (leftDue !== rightDue) return leftDue - rightDue
    return (left.difficulty ?? 0) - (right.difficulty ?? 0)
  })

  const shuffledNewWords = shuffleArray(newWords, now.getTime())
  const selected = [...dueWords]

  for (const word of shuffledNewWords) {
    if (selected.length >= payload.wordCount) break
    selected.push(word)
  }

  const queueSeed = (now.getTime() ^ 0x9e3779b9) >>> 0
  return shuffleArray(selected.slice(0, payload.wordCount), queueSeed)
}

export function createSmartReviewSession(payload: StartSmartReviewPayload, profileMap: SmartReviewProfileMap, now = new Date()): SmartReviewSessionRecord | null {
  const selectedWords = selectSmartReviewWords(payload, profileMap, now)
  if (selectedWords.length === 0) return null

  const selectedWordIds = selectedWords.map((word) => word.id)
  const itemStates = Object.fromEntries(
    selectedWordIds.map((wordId) => [
      wordId,
      {
        wordId,
        attempts: 0,
        wrongCount: 0,
        answeredCorrectly: false,
      } satisfies SmartReviewSessionItemState,
    ]),
  )

  const timestamp = now.toISOString()

  return {
    status: 'active',
    setId: payload.setId,
    setName: payload.setName,
    selectedWordIds,
    activeQueue: [...selectedWordIds],
    retryQueue: [],
    currentIndex: 0,
    currentWordId: selectedWordIds[0] ?? null,
    round: 1,
    itemStates,
    isAnswerRevealed: false,
    revealedIsCorrect: null,
    revealedAnswer: '',
    startedAt: timestamp,
    updatedAt: timestamp,
  }
}

export function advanceSmartReviewSession(record: SmartReviewSessionRecord) {
  if (record.currentIndex < record.activeQueue.length - 1) {
    const currentIndex = record.currentIndex + 1
    return {
      done: false as const,
      record: {
        ...record,
        currentIndex,
        currentWordId: record.activeQueue[currentIndex] ?? null,
        isAnswerRevealed: false,
        revealedIsCorrect: null,
        revealedAnswer: '',
        updatedAt: new Date().toISOString(),
      },
    }
  }

  if (record.retryQueue.length > 0) {
    return {
      done: false as const,
      record: {
        ...record,
        activeQueue: [...record.retryQueue],
        retryQueue: [],
        currentIndex: 0,
        currentWordId: record.retryQueue[0] ?? null,
        round: record.round + 1,
        isAnswerRevealed: false,
        revealedIsCorrect: null,
        revealedAnswer: '',
        updatedAt: new Date().toISOString(),
      },
    }
  }

  return {
    done: true as const,
    record,
  }
}

export function gradeSmartReviewAnswer(expectedAnswer: string, submittedAnswer: string) {
  return normalizeReviewAnswer(expectedAnswer) === normalizeReviewAnswer(submittedAnswer)
}

export function normalizeReviewAnswer(value: string) {
  return value.normalize('NFKC').replace(/\s+/g, '').trim()
}

function hashWordId(wordId: string) {
  let hash = 0

  for (const char of wordId) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  }

  return hash
}

function pickTemplate(word: VocabularyWord, templates: Array<(gloss: string) => SmartReviewStudyPrompt>, gloss: string) {
  const index = hashWordId(word.id) % templates.length
  return templates[index]?.(gloss) ?? templates[0](gloss)
}

function buildPromptByType(word: VocabularyWord, gloss: string) {
  const templates: Record<WordType, Array<(gloss: string) => SmartReviewStudyPrompt>> = {
    verb: [
      (value) => ({
        japaneseSentence: '今日は迷わず、最後まで ____ つもりです。',
        translationSentence: `오늘은 망설이지 않고 끝까지 ${value} 생각이다.`,
        note: '결심하는 어조',
      }),
      (value) => ({
        japaneseSentence: 'まさかこの場面で ____ とは、だれも思っていなかった。',
        translationSentence: `설마 이런 장면에서 ${value} 줄은 아무도 몰랐다.`,
        note: '극적인 어조',
      }),
      (value) => ({
        japaneseSentence: 'そんなふうに急に ____ なんて、少しも聞いていない。',
        translationSentence: `그렇게 갑자기 ${value}라니, 전혀 듣지 못했다.`,
        note: '대화체',
      }),
      (value) => ({
        japaneseSentence: 'ここまで来た以上、静かに ____ だけだ。',
        translationSentence: `여기까지 온 이상 조용히 ${value} 뿐이다.`,
        note: '담담한 어조',
      }),
      (value) => ({
        japaneseSentence: '窓の外を見ながら、もう一度 ____ ことにした。',
        translationSentence: `창밖을 보며 다시 한 번 ${value} 하기로 했다.`,
        note: '회상하는 어조',
      }),
    ],
    noun: [
      (value) => ({
        japaneseSentence: 'この企画の鍵になるのは、____ です。',
        translationSentence: `이 기획의 핵심이 되는 것은 ${value}이다.`,
        note: '공식적인 어조',
      }),
      (value) => ({
        japaneseSentence: '結局、最後に残ったのは ____ だった。',
        translationSentence: `결국 마지막에 남은 것은 ${value}였다.`,
        note: '담담한 어조',
      }),
      (value) => ({
        japaneseSentence: 'そんな話を聞くと、まず ____ が気になる。',
        translationSentence: `그런 이야기를 들으면 우선 ${value}이 신경 쓰인다.`,
        note: '친근한 구어',
      }),
      (value) => ({
        japaneseSentence: '報告書では、____ の扱いが重要です。',
        translationSentence: `보고서에서는 ${value}의 다루는 방식이 중요하다.`,
        note: '실무적인 어조',
      }),
      (value) => ({
        japaneseSentence: '机の上には、____ だけがぽつんと残っていた。',
        translationSentence: `책상 위에는 ${value}만 덩그러니 남아 있었다.`,
        note: '문학적인 어조',
      }),
    ],
    i_adj: [
      (value) => ({
        japaneseSentence: '思っていたより、ずっと ____。',
        translationSentence: `생각했던 것보다 훨씬 ${value}.`,
        note: '친근한 구어',
      }),
      (value) => ({
        japaneseSentence: '朝の空気がやけに ____。',
        translationSentence: `아침 공기가 유난히 ${value}.`,
        note: '서정적인 어조',
      }),
      (value) => ({
        japaneseSentence: 'その説明はシンプルだが、実際はかなり ____。',
        translationSentence: `그 설명은 단순하지만 실제로는 꽤 ${value}.`,
        note: '분석적인 어조',
      }),
      (value) => ({
        japaneseSentence: '遠くから見ると、妙に ____ 景色だった。',
        translationSentence: `멀리서 보니 묘하게 ${value} 풍경이었다.`,
        note: '문학적인 어조',
      }),
      (value) => ({
        japaneseSentence: '今日の課題は、見た目より ____ です。',
        translationSentence: `오늘 과제는 보기보다 ${value}.`,
        note: '차분한 어조',
      }),
    ],
    na_adj: [
      (value) => ({
        japaneseSentence: 'その判断は、十分に ____ と言える。',
        translationSentence: `그 판단은 충분히 ${value}고 말할 수 있다.`,
        note: '공식적인 어조',
      }),
      (value) => ({
        japaneseSentence: '見た目は穏やかでも、中身はかなり ____。',
        translationSentence: `겉보기는 온화해도 속은 꽤 ${value}.`,
        note: '대조적인 어조',
      }),
      (value) => ({
        japaneseSentence: '今の空気をひと言で言うなら、たぶん ____。',
        translationSentence: `지금 분위기를 한마디로 말하면 아마 ${value}.`,
        note: '친근한 구어',
      }),
      (value) => ({
        japaneseSentence: '報告書としては、かなり ____ 内容だった。',
        translationSentence: `보고서로서는 꽤 ${value} 내용이었다.`,
        note: '실무적인 어조',
      }),
      (value) => ({
        japaneseSentence: '彼の説明は、いつも不思議なくらい ____。',
        translationSentence: `그의 설명은 늘 이상할 만큼 ${value}.`,
        note: '관찰하는 어조',
      }),
    ],
    adv: [
      (value) => ({
        japaneseSentence: '担当の方が ____ 説明してくれた。',
        translationSentence: `담당자가 ${value} 설명해 주었다.`,
        note: '차분한 어조',
      }),
      (value) => ({
        japaneseSentence: '彼はドアを開けるなり、____ 走り出した。',
        translationSentence: `그는 문을 열자마자 ${value} 달려 나갔다.`,
        note: '속도감 있는 어조',
      }),
      (value) => ({
        japaneseSentence: 'そんなに ____ 決めなくても大丈夫だよ。',
        translationSentence: `그렇게 ${value} 정하지 않아도 괜찮아.`,
        note: '친근한 구어',
      }),
      (value) => ({
        japaneseSentence: '先生は難しい話を ____ まとめてくれた。',
        translationSentence: `선생님은 어려운 이야기를 ${value} 정리해 주셨다.`,
        note: '수업 장면',
      }),
      (value) => ({
        japaneseSentence: '雨がやんだあと、風だけが ____ 吹いていた。',
        translationSentence: `비가 그친 뒤 바람만 ${value} 불고 있었다.`,
        note: '문학적인 어조',
      }),
    ],
    expression: [
      (value) => ({
        japaneseSentence: 'この場面では、____ と言うのがいちばん自然だ。',
        translationSentence: `이 장면에서는 ${value}라고 말하는 것이 가장 자연스럽다.`,
        note: '설명하는 어조',
      }),
      (value) => ({
        japaneseSentence: '友だち相手なら、ふっと ____ と言いたくなる。',
        translationSentence: `친구를 상대로라면 문득 ${value}라고 말하고 싶어진다.`,
        note: '친근한 어조',
      }),
      (value) => ({
        japaneseSentence: '静かな別れ際に、ただ ____ とだけ残した。',
        translationSentence: `조용한 작별의 순간에 그저 ${value}라고만 남겼다.`,
        note: '문학적인 어조',
      }),
    ],
    other: [
      (value) => ({
        japaneseSentence: 'この場面で中心になるのは、____ です。',
        translationSentence: `이 장면의 중심이 되는 것은 ${value}이다.`,
        note: '차분한 어조',
      }),
      (value) => ({
        japaneseSentence: '最後まで耳に残ったのは、____ だった。',
        translationSentence: `끝까지 귀에 남은 것은 ${value}였다.`,
        note: '회상하는 어조',
      }),
      (value) => ({
        japaneseSentence: 'それだけで、十分に ____ だと思った。',
        translationSentence: `그것만으로도 충분히 ${value}고 생각했다.`,
        note: '담담한 어조',
      }),
    ],
  }

  return pickTemplate(word, templates[word.type] ?? templates.other, gloss)
}

export function createStudyPrompt(word: VocabularyWord): SmartReviewStudyPrompt {
  const override = smartReviewPromptOverrides[word.id]
  if (override) return override

  const primaryMeaning = word.meaning.split(',')[0]?.trim() || word.meaning
  return buildPromptByType(word, primaryMeaning)
}

export function applySmartReviewOutcome(profileMap: SmartReviewProfileMap, session: SmartReviewSessionRecord, now = new Date()) {
  const nextProfiles = { ...profileMap }
  let promotedCount = 0
  let resetCount = 0
  let masteredCount = 0

  for (const wordId of session.selectedWordIds) {
    const currentProfile = nextProfiles[wordId] ?? createEmptyProfile(wordId)
    const itemState = session.itemStates[wordId]
    if (!itemState) continue

    const hadMistake = itemState.wrongCount > 0

    if (hadMistake) {
      const dueAt = addDays(now, REVIEW_INTERVALS_DAYS[0]).toISOString()
      nextProfiles[wordId] = {
        ...currentProfile,
        status: 'learning',
        stage: 0,
        dueAt,
        lastReviewedAt: now.toISOString(),
        totalWrongSessions: currentProfile.totalWrongSessions + 1,
        consecutiveCorrectSessions: 0,
        lapseCount: currentProfile.lapseCount + 1,
        masteredAt: null,
      }
      resetCount += 1
      continue
    }

    const baseStage = currentProfile.status === 'new' ? INITIAL_SUCCESS_STAGE : currentProfile.stage + 1
    const isMastered = baseStage >= REVIEW_INTERVALS_DAYS.length

    if (isMastered) {
      nextProfiles[wordId] = {
        ...currentProfile,
        status: 'mastered',
        stage: REVIEW_INTERVALS_DAYS.length,
        dueAt: null,
        lastReviewedAt: now.toISOString(),
        totalCorrectSessions: currentProfile.totalCorrectSessions + 1,
        consecutiveCorrectSessions: currentProfile.consecutiveCorrectSessions + 1,
        masteredAt: now.toISOString(),
      }
      masteredCount += 1
      continue
    }

    nextProfiles[wordId] = {
      ...currentProfile,
      status: baseStage >= 2 ? 'reviewing' : 'learning',
      stage: baseStage,
      dueAt: addDays(now, REVIEW_INTERVALS_DAYS[baseStage]).toISOString(),
      lastReviewedAt: now.toISOString(),
      totalCorrectSessions: currentProfile.totalCorrectSessions + 1,
      consecutiveCorrectSessions: currentProfile.consecutiveCorrectSessions + 1,
      masteredAt: null,
    }
    promotedCount += 1
  }

  return {
    nextProfiles,
    promotedCount,
    resetCount,
    masteredCount,
  }
}

export function buildSmartReviewResult(
  session: SmartReviewSessionRecord,
  _promotedCount: number,
  _resetCount: number,
  _masteredCount: number,
): SmartReviewSessionResult {
  const itemStates = Object.values(session.itemStates)
  const wrongWordIds = itemStates.filter((item) => item.wrongCount > 0).map((item) => item.wordId)

  return {
    setId: session.setId,
    setName: session.setName,
    totalWords: session.selectedWordIds.length,
    reviewCount: wrongWordIds.length,
    wrongWordIds,
    completedAt: new Date().toISOString(),
  }
}
