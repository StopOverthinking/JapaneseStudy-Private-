import { create } from 'zustand'
import {
  applyBotTurn,
  applyPlayerAnswer,
  createGameSession,
  getTierInfo,
  recordBotHistory,
  recordSingleModeResult,
  resolveMmrChange,
} from '@/features/game/gameEngine'
import {
  loadBotHistory,
  loadPlayerMmr,
  loadSingleModeRecords,
  saveBotHistory,
  savePlayerMmr,
  saveSingleModeRecords,
} from '@/features/game/gameStorage'
import type {
  AnswerResolution,
  BotResolution,
  GameResult,
  GameSessionRecord,
  GameSetupPayload,
} from '@/features/game/gameTypes'

type GameState = {
  session: GameSessionRecord | null
  lastResult: GameResult | null
  lastSetup: GameSetupPayload | null
  startGame: (payload: GameSetupPayload) => void
  restartLastGame: () => boolean
  recordPlayerAnswer: (params: {
    questionId: string
    isCorrect: boolean
    timeTakenSeconds: number
  }) => AnswerResolution | null
  advanceBotTurn: (params: { solveTimeSeconds: number }) => BotResolution | null
  surrenderBot: () => void
  finalizeGame: () => void
  abandonGame: () => void
  clearResult: () => void
}

export const useGameStore = create<GameState>((set, get) => ({
  session: null,
  lastResult: null,
  lastSetup: null,
  startGame: (payload) => {
    const history = payload.mode === 'bot' ? loadBotHistory(payload.quizType) : []
    set({
      session: createGameSession(payload, history),
      lastResult: null,
      lastSetup: payload,
    })
  },
  restartLastGame: () => {
    const lastSetup = get().lastSetup
    if (!lastSetup) return false

    get().startGame(lastSetup)
    return true
  },
  recordPlayerAnswer: (params) => {
    const session = get().session
    if (!session) return null

    const result = applyPlayerAnswer(session, params)
    if (!result) return null

    set({ session: result.nextSession })
    return result.resolution
  },
  advanceBotTurn: (params) => {
    const session = get().session
    if (!session) return null

    const result = applyBotTurn(session, params)
    if (!result) return null

    set({ session: result.nextSession })
    return result.resolution
  },
  surrenderBot: () => {
    const session = get().session
    if (!session?.bot) return

    set({
      session: {
        ...session,
        bot: {
          ...session.bot,
          surrendered: true,
          finished: true,
        },
      },
    })
  },
  finalizeGame: () => {
    const session = get().session
    if (!session) return

    const averageTime = session.totalQuestions > 0 ? Number((session.totalResponseTime / session.totalQuestions).toFixed(2)) : 0
    const singleRecords = session.mode === 'single'
      ? recordSingleModeResult(loadSingleModeRecords(session.quizType), session.score, averageTime)
      : loadSingleModeRecords(session.quizType)

    if (session.mode === 'single') {
      saveSingleModeRecords(session.quizType, singleRecords)
    }

    let botResult: GameResult['bot'] = null

    if (session.mode === 'bot' && session.bot) {
      const history = recordBotHistory(loadBotHistory(session.quizType), session, averageTime)
      saveBotHistory(session.quizType, history)

      const previousMmr = loadPlayerMmr(session.quizType)
      const mmrChange = resolveMmrChange({
        previousMmr,
        botRating: session.bot.settings.rating,
        playerScore: session.score,
        botScore: session.bot.score,
        surrendered: session.bot.surrendered,
      })
      const newMmr = Math.max(0, previousMmr + mmrChange)
      savePlayerMmr(session.quizType, newMmr)

      botResult = {
        name: session.bot.settings.name,
        score: session.bot.score,
        correctCount: session.bot.correctCount,
        rating: session.bot.settings.rating,
        outcome: session.score > session.bot.score ? 'win' : session.score < session.bot.score ? 'lose' : 'draw',
        surrendered: session.bot.surrendered,
        previousMmr,
        mmrChange,
        newMmr,
        tierInfo: getTierInfo(newMmr),
      }
    }

    set({
      session: null,
      lastResult: {
        setId: session.setId,
        setName: session.setName,
        mode: session.mode,
        quizType: session.quizType,
        playerName: session.playerName,
        playerScore: session.score,
        playerCorrectCount: session.playerCorrectCount,
        totalQuestions: session.totalQuestions,
        averageTime,
        wrongWordIds: session.wrongWordIds,
        completedAt: new Date().toISOString(),
        singleRecords,
        bot: botResult,
      },
    })
  },
  abandonGame: () => set({ session: null }),
  clearResult: () => set({ lastResult: null }),
}))
