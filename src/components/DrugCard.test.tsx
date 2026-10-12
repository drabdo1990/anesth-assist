// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { DRUGS } from '../lib/drugs'
import { useStore } from '../store'
import { DrugCard } from './DrugCard'

const byId = (id: string) => DRUGS.find((d) => d.id === id)!

describe('DrugCard', () => {
  beforeEach(() => {
    useStore.setState({ weightKg: 80, heightCm: 175, sex: 'male', concOverrides: {} })
  })

  it('shows the dose range for valid biometrics', () => {
    render(<DrugCard drug={byId('propofol')} />)
    expect(screen.getByText(/1\.5–2\.5 mg\/kg/)).toBeTruthy()
    expect(screen.queryByText(/enter valid weight/i)).toBeNull()
  })

  it('asks for valid biometrics when weight is missing', () => {
    useStore.setState({ weightKg: null, heightCm: null })
    render(<DrugCard drug={byId('propofol')} />)
    expect(screen.getByText(/enter valid weight/i)).toBeTruthy()
  })

  it('flags a capped dose and shows the uncapped value', () => {
    useStore.setState({ weightKg: 150, heightCm: 175, sex: 'male' })
    render(<DrugCard drug={byId('succinylcholine')} />)
    expect(screen.getByText(/capped at 200 mg/i)).toBeTruthy()
    expect(screen.getByText(/uncapped 225 mg/i)).toBeTruthy()
  })

  it('filters drug options by patientType: adult shows adult options only, peds shows peds options only', () => {
    // Adult mode
    useStore.setState({ patientType: 'adult', weightKg: 70, heightCm: 170, sex: 'male' })
    const { unmount } = render(<DrugCard drug={byId('propofol')} />)
    expect(screen.getByText(/Adult induction/i)).toBeTruthy()
    expect(screen.queryByText(/Peds induction/i)).toBeNull()
    unmount()

    // Pediatric mode
    useStore.setState({ patientType: 'pediatric', weightKg: 20, ageYears: 6 })
    render(<DrugCard drug={byId('propofol')} />)
    expect(screen.getByText(/Peds induction/i)).toBeTruthy()
    expect(screen.queryByText(/Adult induction/i)).toBeNull()
  })

  it('never shows fixed adult vasopressor boluses in pediatric mode', () => {
    useStore.setState({ patientType: 'pediatric', weightKg: 10, ageYears: 1 })
    for (const id of ['phenylephrine', 'ephedrine']) {
      const { unmount } = render(<DrugCard drug={byId(id)} />)
      expect(screen.getByText(/adult indication only/i)).toBeTruthy()
      expect(screen.queryByText(/bolus/i)).toBeNull()
      unmount()
    }
  })

  it('does not flag a fixed dose that exactly equals the ceiling', () => {
    useStore.setState({ patientType: 'adult', weightKg: 80, heightCm: 175 })
    render(<DrugCard drug={byId('ondansetron')} />)
    expect(screen.queryByText(/capped/i)).toBeNull()
  })

  it('hides the weight badge for weight-independent drugs but keeps it for per-kg drugs', () => {
    useStore.setState({ patientType: 'adult', weightKg: 80, heightCm: 175, sex: 'male' })
    // phenylephrine bolus and infusion are both weight-independent (fixed/fixedMin)
    const phe = render(<DrugCard drug={byId('phenylephrine')} />)
    expect(phe.container.textContent).not.toMatch(/TBW:/)
    phe.unmount()

    const propofol = render(<DrugCard drug={byId('propofol')} />)
    expect(propofol.container.textContent).toMatch(/LBW:/)
  })
})
