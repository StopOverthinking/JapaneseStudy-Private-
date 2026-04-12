import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Tooltip } from '@/components/Tooltip'

describe('Tooltip', () => {
  it('shows the tooltip on keyboard focus', () => {
    render(
      <Tooltip label="설명">
        <button type="button">버튼</button>
      </Tooltip>,
    )

    const trigger = screen.getByRole('button', { name: '버튼' })
    const wrapper = trigger.parentElement

    if (!wrapper) {
      throw new Error('Tooltip wrapper was not rendered.')
    }

    fireEvent.focus(trigger)

    expect(wrapper).toHaveAttribute('data-active', 'true')
  })

  it('does not stay active after touch interaction', () => {
    render(
      <Tooltip label="설명">
        <button type="button">버튼</button>
      </Tooltip>,
    )

    const trigger = screen.getByRole('button', { name: '버튼' })
    const wrapper = trigger.parentElement

    if (!wrapper) {
      throw new Error('Tooltip wrapper was not rendered.')
    }

    fireEvent.pointerDown(trigger, { pointerType: 'touch' })
    fireEvent.focus(trigger)
    fireEvent.pointerUp(trigger, { pointerType: 'touch' })

    expect(wrapper).toHaveAttribute('data-active', 'false')
  })
})
