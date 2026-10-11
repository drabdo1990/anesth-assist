// @vitest-environment jsdom
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Timer } from './Timer'

describe('Timer', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('counts up after start and resets to zero', () => {
    render(<Timer title="Elapsed" label="CICO" />)
    fireEvent.click(screen.getByRole('button', { name: /start cico timer/i }))
    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(screen.getByText('00:03')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /reset cico timer/i }))
    expect(screen.getByText('00:00')).toBeTruthy()
  })

  it('flashes a rhythm-check alert at each cycle', () => {
    render(<Timer title="CPR" label="CPR" cycleSeconds={120} />)
    fireEvent.click(screen.getByRole('button', { name: /start cpr timer/i }))
    act(() => {
      vi.advanceTimersByTime(120000)
    })
    expect(screen.getByText(/rhythm \/ pulse check now/i)).toBeTruthy()
  })
})
