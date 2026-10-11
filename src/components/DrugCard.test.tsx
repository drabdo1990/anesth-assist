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
})
