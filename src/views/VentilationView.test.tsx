// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { act } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useStore } from '../store'
import { VentilationView } from './VentilationView'

describe('VentilationView', () => {
  beforeEach(() => {
    useStore.setState({ patientType: 'adult', weightKg: 70, heightCm: 175, sex: 'male' })
  })

  it('renders tidal volumes based on IBW in adult mode with default RR 12', () => {
    render(<VentilationView />)
    const rrInput = screen.getByLabelText(/respiratory rate/i) as HTMLInputElement
    expect(rrInput.value).toBe('12')
    expect(screen.getByText(/6–8 mL\/kg IBW/i)).toBeTruthy()
  })

  it('updates baseline respiratory rate when toggling patientType from adult to pediatric', () => {
    render(<VentilationView />)
    const rrInput = screen.getByLabelText(/respiratory rate/i) as HTMLInputElement
    expect(rrInput.value).toBe('12')

    act(() => {
      useStore.setState({ patientType: 'pediatric', weightKg: 15, ageYears: 3 })
    })

    expect(rrInput.value).toBe('24')
    expect(screen.getByText(/6–8 mL\/kg TBW/i)).toBeTruthy()
  })
})
