// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useStore } from '../store'
import { AirwayView } from './AirwayView'

describe('AirwayView', () => {
  beforeEach(() => {
    useStore.setState({ patientType: 'adult', sex: 'female', heightCm: 165, weightKg: 65 })
  })

  it('renders adult ETT and DLT guidance in adult mode', () => {
    render(<AirwayView />)
    expect(screen.getByText(/Female standard ID/i)).toBeTruthy()
    expect(screen.getByText(/Double-Lumen Tubes/i)).toBeTruthy()
    expect(screen.getAllByText(/37 Fr/).length).toBeGreaterThan(0)
  })

  it('adapts to pediatric mode: shows pediatric ETT formulas and hides adult DLT table', () => {
    useStore.setState({ patientType: 'pediatric', ageYears: 4, weightKg: 16 })
    render(<AirwayView />)
    expect(screen.getByText(/Uncuffed ID/i)).toBeTruthy()
    expect(screen.getByText(/^5 mm$/)).toBeTruthy() // (4/4) + 4 = 5.0 mm
    expect(screen.getByText(/^4\.5 mm$/)).toBeTruthy() // (4/4) + 3.5 = 4.5 mm
    expect(screen.queryByText(/Double-Lumen Tubes \(left Robertshaw\)/i)).toBeNull()
    expect(screen.getByText(/Lung Isolation \/ Thoracic \(Pediatric\)/i)).toBeTruthy()
  })
})
