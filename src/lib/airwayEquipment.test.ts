import { describe, expect, it } from 'vitest'
import {
  adultEtt,
  bladeRecommendation,
  dltSize,
  guedelSize,
  infantEtt,
  pedsBaselinePills,
  pedsEtt,
  SAD_TABLE,
  selectSad,
} from './airwayEquipment'
import { estimatePedsWeight } from './biometrics'

describe('pedsEtt formulas', () => {
  it('applies age/4 + 4.0 for uncuffed tubes', () => {
    expect(pedsEtt(4).uncuffedId).toBe(5)
    expect(pedsEtt(8).uncuffedId).toBe(6)
  })
  it('applies age/4 + 3.5 for cuffed and +3.0 for microcuff', () => {
    const e = pedsEtt(6)
    expect(e.cuffedId).toBe(5.0)
    expect(e.microcuffId).toBe(4.5)
  })
  it('computes oral and nasal depths', () => {
    const e = pedsEtt(4)
    expect(e.oralDepth).toBe(14)
    expect(e.nasalDepth).toBe(17)
  })
  it('handles fractional ages (neonate 0.5 yr = 6 months)', () => {
    const e = pedsEtt(0.5)
    expect(e.uncuffedId).toBe(4.1)
    expect(e.cuffedId).toBe(3.6)
    expect(e.oralDepth).toBe(12.3)
  })
})

describe('adultEtt', () => {
  it('uses 7.0–7.5 mm and 20–21 cm for females', () => {
    expect(adultEtt('female')).toEqual({ idLow: 7.0, idHigh: 7.5, depthLow: 20, depthHigh: 21 })
  })
  it('uses 8.0–8.5 mm and 22–23 cm for males', () => {
    expect(adultEtt('male')).toEqual({ idLow: 8.0, idHigh: 8.5, depthLow: 22, depthHigh: 23 })
  })
})

describe('SAD sizing', () => {
  it('maps weight bands to sizes 1–5', () => {
    expect(selectSad(4)?.size).toBe('1')
    expect(selectSad(7)?.size).toBe('1.5')
    expect(selectSad(15)?.size).toBe('2')
    expect(selectSad(25)?.size).toBe('2.5')
    expect(selectSad(40)?.size).toBe('3')
    expect(selectSad(60)?.size).toBe('4')
    expect(selectSad(85)?.size).toBe('5')
  })
  it('band edges fall into the upper band', () => {
    expect(selectSad(5)?.size).toBe('1.5')
    expect(selectSad(10)?.size).toBe('2')
    expect(selectSad(70)?.size).toBe('5')
  })
  it('returns null without a usable weight', () => {
    expect(selectSad(null)).toBeNull()
    expect(selectSad(-3)).toBeNull()
  })
  it('table covers every weight from 0 upward', () => {
    for (let kg = 0; kg <= 150; kg++) {
      expect(selectSad(kg)).not.toBeNull()
    }
  })
  it('has 7 rows with ascending cuff volumes', () => {
    expect(SAD_TABLE).toHaveLength(7)
    for (let i = 1; i < SAD_TABLE.length; i++) {
      expect(SAD_TABLE[i].cuffMl).toBeGreaterThan(SAD_TABLE[i - 1].cuffMl)
    }
  })
})

describe('DLT sizing', () => {
  it('uses height bands with a sex split in the middle band', () => {
    expect(dltSize(155, 'male')).toBe('35 Fr')
    expect(dltSize(165, 'female')).toBe('37 Fr')
    expect(dltSize(165, 'male')).toBe('39 Fr')
    expect(dltSize(180, 'female')).toBe('39–41 Fr')
    expect(dltSize(180, 'male')).toBe('39–41 Fr')
  })
})

describe('Guedel + blade', () => {
  it('sizes the oropharyngeal airway by weight', () => {
    expect(guedelSize(3)).toBe('000')
    expect(guedelSize(25)).toBe('1')
    expect(guedelSize(80)).toBe('4')
    expect(guedelSize(95)).toBe('5')
    expect(guedelSize(null)).toBeNull()
  })
  it('recommends Miller blades for small children and Mac for adults', () => {
    expect(bladeRecommendation(0, true)).toContain('Miller 0–1')
    expect(bladeRecommendation(3, true)).toContain('Miller')
    expect(bladeRecommendation(8, true)).toContain('Mac 2')
    expect(bladeRecommendation(null, false)).toContain('Macintosh 3')
  })
})

describe('pedsBaselinePills', () => {
  it('estimates weight from age and reports tube sizes', () => {
    const pills = pedsBaselinePills(4)
    expect(estimatePedsWeight(4)).toBe(16)
    const labels = pills.map((p) => p.label)
    expect(labels).toContain('ETT uncuffed')
    expect(labels).toContain('ETT cuffed')
    expect(labels).toContain('Oral depth')
    expect(labels).toContain('LMA size')
    expect(pills.find((p) => p.label === 'ETT uncuffed')?.value).toBe('5 mm')
    expect(pills.find((p) => p.label === 'LMA size')?.value).toBe('2')
  })
})

describe('infantEtt (< 1 year)', () => {
  it('term neonate 3.5 kg: 3.5 mm uncuffed at weight + 6 cm, not the 4.0 mm / 12 cm formula', () => {
    const e = infantEtt(0, 3.5)
    expect(e.uncuffed).toBe('3.5')
    expect(e.oralDepth).toBe(9.5)
    expect(e.depthRule).toMatch(/weight/)
  })
  it('preterm sizes have no cuffed recommendation', () => {
    expect(infantEtt(0, 0.8)).toMatchObject({ uncuffed: '2.5', cuffed: null, oralDepth: 7 })
    expect(infantEtt(0, 1.5)).toMatchObject({ uncuffed: '3.0', cuffed: null })
  })
  it('older infants use 3 × ID depth', () => {
    expect(infantEtt(0.75, 8)).toMatchObject({ uncuffed: '4.0', cuffed: '3.5', oralDepth: 12 })
  })
  it('baseline pills switch to infant bands below 1 year', () => {
    const pills = pedsBaselinePills(0, 3.5)
    expect(pills.find((p) => p.label === 'ETT uncuffed')?.value).toBe('3.5 mm')
    expect(pills.find((p) => p.label === 'Oral depth')?.value).toBe('9.5 cm')
  })
})
