// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Checklist } from './Checklist'

const items = [
  { id: 'a', text: 'Alpha' },
  { id: 'b', text: 'Beta', critical: true },
]

describe('Checklist', () => {
  it('counts completed items and resets', () => {
    render(<Checklist items={items} />)
    expect(screen.getByText('0/2 complete')).toBeTruthy()

    fireEvent.click(screen.getByRole('checkbox', { name: 'Alpha' }))
    expect(screen.getByText('1/2 complete')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /reset/i }))
    expect(screen.getByText('0/2 complete')).toBeTruthy()
  })
})
