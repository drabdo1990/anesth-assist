import { describe, expect, it } from 'vitest'
import { sanitizePersisted } from './store'

describe('sanitizePersisted', () => {
  it('accepts a well-formed state', () => {
    expect(
      sanitizePersisted({ weightKg: 80, heightCm: 175, sex: 'female', concOverrides: { ketamine: 50 } }),
    ).toEqual({ weightKg: 80, heightCm: 175, sex: 'female', concOverrides: { ketamine: 50 } })
  })
  it('falls back to defaults on corrupt data', () => {
    const d = { weightKg: null, heightCm: null, sex: 'male', concOverrides: {} }
    expect(sanitizePersisted(null)).toEqual(d)
    expect(sanitizePersisted('garbage')).toEqual(d)
    expect(
      sanitizePersisted({ weightKg: 'x', heightCm: NaN, sex: 'alien', concOverrides: [1, 2] }),
    ).toEqual(d)
  })
  it('drops non-numeric or non-positive concentration overrides', () => {
    expect(sanitizePersisted({ concOverrides: { a: 5, b: 'x', c: -1 } }).concOverrides).toEqual({ a: 5 })
  })
})
