import { beforeEach, describe, expect, it } from 'vitest'
import { createSessionRecord } from '@/features/session/sessionEngine'
import { useLearnSessionStore } from '@/features/session/learnSessionStore'
import { allWords } from '@/features/vocab/model/selectors'

const sampleWords = allWords.slice(0, 3)

describe('useLearnSessionStore', () => {
  beforeEach(() => {
    localStorage.clear()
    useLearnSessionStore.setState({
      status: 'idle',
      record: null,
      previousSnapshot: null,
      snapshotHistory: [],
      lastResult: null,
    })
  })

  it('supports undoing multiple cards in sequence', () => {
    useLearnSessionStore.setState({
      status: 'active',
      record: createSessionRecord({
        setId: 'all',
        setName: '테스트 세트',
        frontMode: 'japanese',
        words: sampleWords,
      }),
      previousSnapshot: null,
      snapshotHistory: [],
      lastResult: null,
    })

    const [firstWord, secondWord, thirdWord] = sampleWords

    useLearnSessionStore.getState().markKnown()
    let state = useLearnSessionStore.getState()

    expect(state.record?.currentCardId).toBe(secondWord.id)
    expect(state.previousSnapshot?.currentCardId).toBe(firstWord.id)
    expect(state.snapshotHistory).toHaveLength(1)

    useLearnSessionStore.getState().markUnknown()
    state = useLearnSessionStore.getState()

    expect(state.record?.currentCardId).toBe(thirdWord.id)
    expect(state.previousSnapshot?.currentCardId).toBe(secondWord.id)
    expect(state.snapshotHistory).toHaveLength(2)

    useLearnSessionStore.getState().undo()
    state = useLearnSessionStore.getState()

    expect(state.record?.currentCardId).toBe(secondWord.id)
    expect(state.previousSnapshot?.currentCardId).toBe(firstWord.id)
    expect(state.snapshotHistory).toHaveLength(1)

    useLearnSessionStore.getState().undo()
    state = useLearnSessionStore.getState()

    expect(state.record?.currentCardId).toBe(firstWord.id)
    expect(state.previousSnapshot).toBeNull()
    expect(state.snapshotHistory).toHaveLength(0)
  })
})
