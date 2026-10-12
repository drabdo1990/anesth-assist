import { describe, expect, it } from 'vitest'
import {
  computePedsScalars,
  computeScalars,
  estimatePedsWeight,
  inputAdvisories,
  isAgeValid,
  isWeightValid,
} from './biometrics'

describe('computeScalars', () => {
  it('male 175 cm / 80 kg matches hand-computed values', () => {
    const s = computeScalars(80, 175, 'male')!
    expect(s.bmi).toBeCloseTo(26.122, 2)
    expect(s.ibw).toBeCloseTo(70.453, 2)
    expect(s.lbw).toBeCloseTo(60.18, 1)
    expect(s.abw40).toBeCloseTo(74.27, 1)
    expect(s.tbw).toBe(80)
  })

  it('female uses 45.5 base and the female LBW constants', () => {
    const s = computeScalars(70, 165, 'female')!
    // IBW = 45.5 + 0.905*(165-152.4) = 56.903
    expect(s.ibw).toBeCloseTo(56.903, 2)
    const bmi = 70 / 1.65 ** 2
    expect(s.lbw).toBeCloseTo((9270 * 70) / (8780 + 244 * bmi), 6)
  })

  it('height under 152.4 cm uses the base IBW (max(0, ...))', () => {
    expect(computeScalars(60, 150, 'male')!.ibw).toBe(50)
    expect(computeScalars(60, 150, 'female')!.ibw).toBe(45.5)
  })

  it('IBW falls back to TBW when TBW < IBW, and ABW40 equals TBW', () => {
    const s = computeScalars(50, 160, 'female')! // IBW formula = 52.378 > 50
    expect(s.ibw).toBe(50)
    expect(s.abw40).toBe(50)
  })

  it('caps LBW at TBW', () => {
    const s = computeScalars(30, 200, 'male')! // raw LBW = 33.5 > 30
    expect(s.lbw).toBe(30)
  })

  it('returns null for missing, zero, negative, NaN or out-of-range input', () => {
    expect(computeScalars(null, 175, 'male')).toBeNull()
    expect(computeScalars(80, null, 'male')).toBeNull()
    expect(computeScalars(0, 175, 'male')).toBeNull()
    expect(computeScalars(-5, 175, 'male')).toBeNull()
    expect(computeScalars(NaN, 175, 'male')).toBeNull()
    expect(computeScalars(401, 175, 'male')).toBeNull()
    expect(computeScalars(80, 29, 'male')).toBeNull()
    expect(computeScalars(80, 251, 'male')).toBeNull()
  })
})

describe('isWeightValid', () => {
  it('accepts 1..400 only', () => {
    expect(isWeightValid(1)).toBe(true)
    expect(isWeightValid(400)).toBe(true)
    expect(isWeightValid(0.5)).toBe(false)
    expect(isWeightValid(null)).toBe(false)
  })
})

describe('inputAdvisories', () => {
  it('flags soft-range values', () => {
    expect(inputAdvisories(1.5, 175).softWarnings.length).toBe(1)
    expect(inputAdvisories(300, 175).softWarnings.length).toBe(1)
    expect(inputAdvisories(70, 90).softWarnings.length).toBe(1)
    expect(inputAdvisories(70, 175).softWarnings).toEqual([])
  })
  it('flags adult-only banner for short, light or BMI >= 40', () => {
    expect(inputAdvisories(70, 135).adultOnly).toBe(true)
    expect(inputAdvisories(25, 175).adultOnly).toBe(true)
    expect(inputAdvisories(140, 170).adultOnly).toBe(true) // BMI 48
    expect(inputAdvisories(70, 175).adultOnly).toBe(false)
  })
})

describe('pediatric mode', () => {
  it('estimates weight as (age + 4) × 2', () => {
    expect(estimatePedsWeight(0)).toBe(8)
    expect(estimatePedsWeight(4)).toBe(16)
    expect(estimatePedsWeight(10)).toBe(28)
  })
  it('collapses IBW/LBW/ABW40 to TBW and nulls BMI', () => {
    const s = computePedsScalars(18)!
    expect(s).toEqual({ tbw: 18, ibw: 18, lbw: 18, abw40: 18, bmi: null })
  })
  it('returns null for missing or invalid weight', () => {
    expect(computePedsScalars(null)).toBeNull()
    expect(computePedsScalars(0)).toBeNull()
    expect(computePedsScalars(NaN)).toBeNull()
  })
  it('validates age 0–14 years', () => {
    expect(isAgeValid(0)).toBe(true)
    expect(isAgeValid(0.5)).toBe(true) // 6 months
    expect(isAgeValid(14)).toBe(true)
    expect(isAgeValid(null)).toBe(false)
    expect(isAgeValid(-1)).toBe(false)
    expect(isAgeValid(15)).toBe(false)
  })
})
