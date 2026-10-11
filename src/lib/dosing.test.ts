import { describe, expect, it } from 'vitest'
import { computeScalars } from './biometrics'
import { calcOption } from './dosing'
import { DRUGS } from './drugs'
import { fmtNum, fmtRange, fmtVol } from './format'

const drug = (id: string) => DRUGS.find((d) => d.id === id)!
const male80 = computeScalars(80, 175, 'male')!

describe('calcOption', () => {
  it('propofol is dosed on LBW', () => {
    const p = drug('propofol')
    expect(p.scalar).toBe('lbw')
    const r = calcOption(p, p.options[0], male80, p.defaultConc)
    expect(r.massLow).toBeCloseTo(1.5 * male80.lbw, 6)
    expect(r.massHigh).toBeCloseTo(2.5 * male80.lbw, 6)
    expect(r.volLow).toBeCloseTo((1.5 * male80.lbw) / 10, 6)
  })

  it('rocuronium standard and RSI use IBW', () => {
    const r = drug('rocuronium')
    expect(r.scalar).toBe('ibw')
    expect(calcOption(r, r.options[0], male80, 10).massLow).toBeCloseTo(0.6 * male80.ibw, 6)
    expect(calcOption(r, r.options[1], male80, 10).massLow).toBeCloseTo(1.2 * male80.ibw, 6)
  })

  it('sugammadex has 2, 4 and 16 mg/kg on TBW', () => {
    const s = drug('sugammadex')
    expect(s.options.map((o) => o.low)).toEqual([2, 4, 16])
    expect(calcOption(s, s.options[2], male80, 100).massLow).toBe(1280)
    expect(calcOption(s, s.options[2], male80, 100).volLow).toBeCloseTo(12.8, 6)
  })

  it('succinylcholine caps at 200 mg for a heavy patient and reports the uncapped value', () => {
    const heavy = computeScalars(150, 175, 'male')!
    const sux = drug('succinylcholine')
    const r = calcOption(sux, sux.options[0], heavy, 20)
    expect(r.massLow).toBe(150) // 1.0 mg/kg, below cap
    expect(r.massHigh).toBe(200) // 1.5 mg/kg = 225 -> 200
    expect(r.ceilingHit).toBe(true)
    expect(r.uncappedHigh).toBe(225)
    expect(r.volHigh).toBe(10)
  })

  it('succinylcholine below cap is not flagged', () => {
    const sux = drug('succinylcholine')
    const r = calcOption(sux, sux.options[0], male80, 20)
    expect(r.ceilingHit).toBe(false)
    expect(r.massHigh).toBe(120)
  })

  it('neostigmine caps at 5 mg and collapses the range; glycopyrrolate caps at 1 mg', () => {
    const heavy = computeScalars(200, 180, 'male')!
    const neo = drug('neostigmine')
    const rn = calcOption(neo, neo.options[0], heavy, 1)
    expect(rn.massLow).toBe(5)
    expect(rn.massHigh).toBeNull()
    expect(rn.ceilingHit).toBe(true)
    const gly = neo.companion!
    const rg = calcOption(gly, gly.options[0], heavy, 0.2)
    expect(rg.massLow).toBe(1)
    expect(rg.ceilingHit).toBe(true)
    expect(rg.volLow).toBeCloseTo(5, 6)
  })

  it('phenylephrine and ephedrine are fixed boluses, independent of weight', () => {
    const phe = drug('phenylephrine')
    const r = calcOption(phe, phe.options[0], male80, 100)
    expect(r.unit).toBe('mcg')
    expect([r.massLow, r.massHigh]).toEqual([50, 100])
    expect([r.volLow, r.volHigh]).toEqual([0.5, 1])
    const eph = drug('ephedrine')
    const e = calcOption(eph, eph.options[0], male80, 5)
    expect([e.massLow, e.massHigh]).toEqual([5, 10])
    expect([e.volLow, e.volHigh]).toEqual([1, 2])
  })

  it('every drug default concentration is in its own concentration list', () => {
    for (const d of DRUGS) {
      expect(d.concentrations).toContain(d.defaultConc)
      if (d.companion) expect(d.companion.concentrations).toContain(d.companion.defaultConc)
    }
  })
})

describe('format', () => {
  it('fmtNum keeps sensible precision', () => {
    expect(fmtNum(105.4)).toBe('105')
    expect(fmtNum(42.27)).toBe('42.3')
    expect(fmtNum(3.5)).toBe('3.5')
    expect(fmtNum(0.8)).toBe('0.8')
    expect(fmtNum(0.05)).toBe('0.05')
  })
  it('fmtVol uses 0.01 below 1 mL, else 0.1', () => {
    expect(fmtVol(0.456)).toBe('0.46')
    expect(fmtVol(4.23)).toBe('4.2')
    expect(fmtVol(12.8)).toBe('12.8')
  })
  it('fmtRange collapses a null high', () => {
    expect(fmtRange(5, null)).toBe('5')
    expect(fmtRange(90, 150)).toBe('90–150')
  })
})
