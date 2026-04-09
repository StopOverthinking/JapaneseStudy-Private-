import type { ReactNode } from 'react'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { createExamSession } from '@/features/exam/examEngine'
import { ExamSetupPage } from '@/features/exam/ExamSetupPage'
import { useExamStore } from '@/features/exam/examStore'
import { HomePage } from '@/features/home/HomePage'
import { LearnSetupPage } from '@/features/learn/LearnSetupPage'
import { usePreferencesStore } from '@/features/preferences/preferencesStore'
import { createSessionRecord } from '@/features/session/sessionEngine'
import { useLearnSessionStore } from '@/features/session/learnSessionStore'
import { allWords } from '@/features/vocab/model/selectors'

const sampleWords = allWords.slice(0, 3)
const defaultLearnDefaults = {
  frontMode: 'japanese' as const,
  favoritesOnly: false,
  wordCount: 10,
  rangeEnabled: false,
  rangeStart: 1,
  rangeEnd: 10,
}

function renderWithRouter(element: ReactNode) {
  return render(<MemoryRouter>{element}</MemoryRouter>)
}

describe('Resume banner discard actions', () => {
  beforeEach(() => {
    localStorage.clear()

    usePreferencesStore.setState({
      themeMode: 'dark',
      lastSelectedSetId: 'all',
      learnDefaults: defaultLearnDefaults,
    })

    useLearnSessionStore.setState({
      status: 'active',
      record: createSessionRecord({
        setId: 'all',
        setName: '테스트 학습',
        frontMode: 'japanese',
        words: sampleWords,
      }),
      previousSnapshot: null,
      lastResult: null,
    })

    useExamStore.setState({
      status: 'active',
      session: createExamSession({
        setId: 'set-a',
        setName: '테스트 시험',
        gradingMode: 'auto',
        words: sampleWords,
      }, 42),
      lastResult: null,
      wrongAnswerIds: [],
    })
  })

  afterEach(() => {
    cleanup()
    localStorage.clear()
    vi.restoreAllMocks()

    useLearnSessionStore.setState({
      status: 'idle',
      record: null,
      previousSnapshot: null,
      lastResult: null,
    })

    useExamStore.setState({
      status: 'idle',
      session: null,
      lastResult: null,
      wrongAnswerIds: [],
    })
  })

  it('discards a learn session from the learn setup banner after confirmation', async () => {
    const user = userEvent.setup()
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    renderWithRouter(<LearnSetupPage />)

    await user.click(screen.getByRole('button', { name: '학습 파기' }))

    expect(window.confirm).toHaveBeenCalledTimes(1)
    expect(useLearnSessionStore.getState().record).toBeNull()
    expect(useLearnSessionStore.getState().status).toBe('idle')
  })

  it('keeps the learn session when discard confirmation is cancelled', async () => {
    const user = userEvent.setup()
    vi.spyOn(window, 'confirm').mockReturnValue(false)

    renderWithRouter(<LearnSetupPage />)

    await user.click(screen.getByRole('button', { name: '학습 파기' }))

    expect(window.confirm).toHaveBeenCalledTimes(1)
    expect(useLearnSessionStore.getState().record).not.toBeNull()
    expect(useLearnSessionStore.getState().status).toBe('active')
  })

  it('discards an exam session from the exam setup banner after confirmation', async () => {
    const user = userEvent.setup()
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    renderWithRouter(<ExamSetupPage />)

    await user.click(screen.getByRole('button', { name: '시험 파기' }))

    expect(window.confirm).toHaveBeenCalledTimes(1)
    expect(useExamStore.getState().session).toBeNull()
    expect(useExamStore.getState().status).toBe('idle')
  })

  it('shows discard buttons on the top menu resume banners and clears both sessions when confirmed', async () => {
    const user = userEvent.setup()
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    renderWithRouter(<HomePage />)

    await user.click(screen.getByRole('button', { name: '학습 파기' }))
    await user.click(screen.getByRole('button', { name: '시험 파기' }))

    expect(window.confirm).toHaveBeenCalledTimes(2)
    expect(useLearnSessionStore.getState().record).toBeNull()
    expect(useExamStore.getState().session).toBeNull()
  })
})
