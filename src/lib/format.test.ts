import { describe, expect, it } from 'vitest'
import { fmtFraction } from './format'

describe('fmtFraction', () => {
  it('floors so 0.996 never shows as 1.00', () => expect(fmtFraction(0.996)).toBe('0.99'))
  it('exact 1', () => expect(fmtFraction(1)).toBe('1.00'))
  it('1.07', () => expect(fmtFraction(1.07)).toBe('1.07'))
  it('0', () => expect(fmtFraction(0)).toBe('0.00'))
})
