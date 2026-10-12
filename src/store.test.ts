import { describe, expect, it } from 'vitest'
import { sanitizePersisted, storedPrefs, useStore } from './store'

const defaults = {
  patientType: 'adult',
  weightKg: null,
  heightCm: null,
  ageYears: null,
  sex: 'male',
  concOverrides: {},
}

describe('sanitizePersisted', () => {
  it('accepts a well-formed state', () => {
    expect(
      sanitizePersisted({
        patientType: 'pediatric',
        weightKg: 80,
        heightCm: 175,
        ageYears: 4,
        sex: 'female',
        concOverrides: { ketamine: 50 },
      }),
    ).toEqual({
      patientType: 'pediatric',
      weightKg: 80,
      heightCm: 175,
      ageYears: 4,
      sex: 'female',
      concOverrides: { ketamine: 50 },
    })
  })
  it('falls back to defaults on corrupt data', () => {
    expect(sanitizePersisted(null)).toEqual(defaults)
    expect(sanitizePersisted('garbage')).toEqual(defaults)
    expect(
      sanitizePersisted({
        weightKg: 'x',
        heightCm: NaN,
        ageYears: 99,
        sex: 'alien',
        patientType: 'neither',
        concOverrides: [1, 2],
      }),
    ).toEqual(defaults)
  })
  it('clamps age to the valid range', () => {
    expect(sanitizePersisted({ ageYears: 10 }).ageYears).toBe(10)
    expect(sanitizePersisted({ ageYears: 20 }).ageYears).toBeNull()
    expect(sanitizePersisted({ ageYears: -1 }).ageYears).toBeNull()
  })
  it('drops non-numeric or non-positive concentration overrides', () => {
    expect(sanitizePersisted({ concOverrides: { a: 5, b: 'x', c: -1 } }).concOverrides).toEqual({
      a: 5,
    })
  })
})

describe('persistence (zero PHI storage)', () => {
  it('stores only provider preferences, never patient biometrics', () => {
    useStore.setState({
      patientType: 'adult',
      weightKg: 80,
      heightCm: 175,
      ageYears: null,
      sex: 'female',
      concOverrides: { ketamine: 50 },
    })
    const stored = useStore.persist.getOptions().partialize!(useStore.getState())
    expect(stored).toEqual({ patientType: 'adult', concOverrides: { ketamine: 50 } })
  })
  it('discards biometrics left in storage by older versions', () => {
    expect(storedPrefs({ patientType: 'pediatric', weightKg: 80, concOverrides: {} })).toEqual({
      patientType: 'pediatric',
      concOverrides: {},
    })
  })
})

describe('setPatientType', () => {
  it('clears biometrics when the patient type changes', () => {
    useStore.setState({ patientType: 'adult', weightKg: 70, heightCm: 170, ageYears: null })
    useStore.getState().setPatientType('pediatric')
    const s = useStore.getState()
    expect([s.patientType, s.weightKg, s.heightCm, s.ageYears]).toEqual([
      'pediatric',
      null,
      null,
      null,
    ])
  })
  it('keeps biometrics when re-selecting the same type', () => {
    useStore.setState({ patientType: 'adult', weightKg: 70, heightCm: 170 })
    useStore.getState().setPatientType('adult')
    expect(useStore.getState().weightKg).toBe(70)
  })
})

describe('clearBiometrics', () => {
  it('clears weight, height, age and resets sex, keeping type + concOverrides', () => {
    useStore.setState({
      patientType: 'pediatric',
      weightKg: 80,
      heightCm: 170,
      ageYears: 4,
      sex: 'female',
      concOverrides: { a: 5 },
    })
    useStore.getState().clearBiometrics()
    const s = useStore.getState()
    expect([s.weightKg, s.heightCm, s.ageYears, s.sex]).toEqual([null, null, null, 'male'])
    expect(s.patientType).toBe('pediatric')
    expect(s.concOverrides).toEqual({ a: 5 })
  })
})
