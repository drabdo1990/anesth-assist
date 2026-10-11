// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useStore } from '../store'
import { LocalMaxView } from './LocalMaxView'

describe('LocalMaxView', () => {
  beforeEach(() => {
    useStore.setState({ weightKg: 70 })
  })

  it('prompts for a weight when none is set', () => {
    useStore.setState({ weightKg: null })
    render(<LocalMaxView />)
    expect(screen.getByText(/enter a valid patient weight/i)).toBeTruthy()
  })

  it('flags toxic when the combined fractions reach 1.0', () => {
    render(<LocalMaxView />)
    const [lido, bupi] = screen.getAllByLabelText(/volume in ml/i)
    fireEvent.change(lido, { target: { value: '10' } }) // lidocaine 100 mg / 280 = 0.357
    fireEvent.change(bupi, { target: { value: '25' } }) // bupivacaine 125 mg / 140 = 0.893
    expect(screen.getByText(/toxic risk/i)).toBeTruthy()
    expect(screen.getByText(/largest: bupivacaine/i)).toBeTruthy()
  })

  it('warns that invalid volumes are excluded from the total', () => {
    render(<LocalMaxView />)
    const [lido] = screen.getAllByLabelText(/volume in ml/i)
    fireEvent.change(lido, { target: { value: 'abc' } })
    expect(screen.getByRole('alert')).toBeTruthy()
  })
})
