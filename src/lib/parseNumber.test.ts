import { describe, expect, it } from 'vitest'
import { parseVolume } from './parseNumber'

describe('parseVolume', () => {
  it('empty is null and not invalid', () => expect(parseVolume('')).toEqual({ value: null, invalid: false }))
  it('parses integers', () => expect(parseVolume('12')).toEqual({ value: 12, invalid: false }))
  it('accepts comma decimal', () => expect(parseVolume('1,5')).toEqual({ value: 1.5, invalid: false }))
  it('trims', () => expect(parseVolume(' 2.5 ')).toEqual({ value: 2.5, invalid: false }))
  it('rejects letters', () => expect(parseVolume('abc')).toEqual({ value: null, invalid: true }))
  it('rejects double dot', () => expect(parseVolume('1.5.2')).toEqual({ value: null, invalid: true }))
  it('rejects negative', () => expect(parseVolume('-3')).toEqual({ value: null, invalid: true }))
  it('zero is valid', () => expect(parseVolume('0')).toEqual({ value: 0, invalid: false }))
})
