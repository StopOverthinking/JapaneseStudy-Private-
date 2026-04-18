import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { ExamSessionPage } from '@/features/exam/ExamSessionPage'
import { useExamStore } from '@/features/exam/examStore'
import { allWords, getWordById } from '@/features/vocab/model/selectors'

const sampleWords = allWords.slice(0, 2)

describe('ExamSessionPage manual grading flow', () => {
  beforeEach(() => {
    localStorage.clear()
    useExamStore.setState({
      status: 'idle',
      session: null,
      lastResult: null,
      wrongAnswerIds: [],
    })
  })

  afterEach(() => {
    cleanup()
    localStorage.clear()
    useExamStore.setState({
      status: 'idle',
      session: null,
      lastResult: null,
      wrongAnswerIds: [],
    })
  })

  it('uses reveal and self-grading controls instead of answer input in manual mode', async () => {
    const user = userEvent.setup()

    useExamStore.getState().startExam({
      setId: 'set-a',
      setName: '수동 시험',
      words: sampleWords,
      gradingMode: 'manual',
    })
    const currentWordId = useExamStore.getState().session?.questionIds[0]
    const currentWord = currentWordId ? getWordById(currentWordId) : null

    render(
      <MemoryRouter>
        <ExamSessionPage />
      </MemoryRouter>,
    )

    expect(screen.queryByPlaceholderText('일본어 정답 입력')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '키보드 입력' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '정답 확인' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '정답 확인' }))

    expect(currentWord).not.toBeNull()
    expect(screen.getByText(currentWord!.japanese)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '맞음' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '틀림' })).toBeInTheDocument()
  })
})
