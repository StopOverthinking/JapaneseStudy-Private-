import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { DebugPage } from '@/features/debug/DebugPage'
import { useDebugDateStore } from '@/features/debug/debugDateStore'

const initialState = useDebugDateStore.getState()

describe('DebugPage', () => {
  afterEach(() => {
    cleanup()
    localStorage.clear()
    useDebugDateStore.setState(initialState)
    vi.useRealTimers()
  })

  it('changes the simulated date with quick buttons and reset', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-18T09:00:00.000Z'))

    render(
      <MemoryRouter>
        <DebugPage />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: '실시간으로 되돌리기' }))
    expect(useDebugDateStore.getState().dayOffset).toBe(0)

    fireEvent.click(screen.getByRole('button', { name: /-7/ }))
    expect(useDebugDateStore.getState().dayOffset).toBe(-7)

    fireEvent.click(screen.getByRole('button', { name: /\+30/ }))
    expect(useDebugDateStore.getState().dayOffset).toBe(23)

    fireEvent.click(screen.getByRole('button', { name: /오늘/ }))
    expect(useDebugDateStore.getState().dayOffset).toBe(0)
    expect(screen.getByDisplayValue('2026-04-18')).toBeInTheDocument()
  })

  it('toggles god mode', () => {
    render(
      <MemoryRouter>
        <DebugPage />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: '꺼짐' }))
    expect(useDebugDateStore.getState().godMode).toBe(true)

    fireEvent.click(screen.getByRole('button', { name: '켜짐' }))
    expect(useDebugDateStore.getState().godMode).toBe(false)
  })
})
