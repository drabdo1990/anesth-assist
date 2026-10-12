// @vitest-environment jsdom
import { fireEvent, render } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useStore } from '../store'
import { BiometricBar } from './BiometricBar'

describe('BiometricBar pediatric weight estimation', () => {
  beforeEach(() => {
    useStore.setState({
      patientType: 'pediatric',
      weightKg: null,
      heightCm: null,
      ageYears: null,
      sex: 'male',
      weightIsManual: false,
      concOverrides: {},
    })
  })

  it('auto-estimates weight when entering age and updates when age changes if not manually set', () => {
    const { container } = render(<BiometricBar />)
    const ageInput = container.querySelector('input[aria-label="Age"]') as HTMLInputElement
    const weightInput = container.querySelector(
      'input[aria-label="Weight (TBW)"]',
    ) as HTMLInputElement

    // Enter age 4 yr -> should estimate 16 kg
    fireEvent.change(ageInput, { target: { value: '4' } })
    expect(useStore.getState().weightKg).toBe(16)
    expect(weightInput.value).toBe('16')

    // Change age to 6 yr -> should automatically update estimate to 20 kg
    fireEvent.change(ageInput, { target: { value: '6' } })
    expect(useStore.getState().weightKg).toBe(20)
    expect(weightInput.value).toBe('20')
  })

  it('preserves manually entered weight when age changes', () => {
    const { container } = render(<BiometricBar />)
    const ageInput = container.querySelector('input[aria-label="Age"]') as HTMLInputElement
    const weightInput = container.querySelector(
      'input[aria-label="Weight (TBW)"]',
    ) as HTMLInputElement

    // Enter age 4 yr -> auto-estimates 16 kg
    fireEvent.change(ageInput, { target: { value: '4' } })
    expect(useStore.getState().weightKg).toBe(16)

    // User manually enters scale weight of 18 kg
    fireEvent.change(weightInput, { target: { value: '18' } })
    expect(useStore.getState().weightKg).toBe(18)

    // User tweaks age to 5 yr -> manual weight 18 kg should be preserved!
    fireEvent.change(ageInput, { target: { value: '5' } })
    expect(useStore.getState().weightKg).toBe(18)
    expect(weightInput.value).toBe('18')
  })

  it('preserves a manually entered weight across a remount (tab switch)', () => {
    const first = render(<BiometricBar />)
    const ageInput = () =>
      first.container.querySelector('input[aria-label="Age"]') as HTMLInputElement
    const weightInput = () =>
      first.container.querySelector('input[aria-label="Weight (TBW)"]') as HTMLInputElement

    fireEvent.change(ageInput(), { target: { value: '4' } }) // auto-estimates 16
    fireEvent.change(weightInput(), { target: { value: '18' } }) // user types a scale weight
    expect(useStore.getState().weightKg).toBe(18)
    first.unmount()

    // App unmounts the full bar when switching to Crisis/Lists and remounts it on return
    const second = render(<BiometricBar />)
    fireEvent.change(
      second.container.querySelector('input[aria-label="Age"]') as HTMLInputElement,
      { target: { value: '6' } },
    )
    expect(useStore.getState().weightKg).toBe(18) // manual weight survives the remount
  })
})
