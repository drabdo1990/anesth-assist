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

  it('rocuronium standard, RSI and maintenance use IBW', () => {
    const r = drug('rocuronium')
    expect(r.scalar).toBe('ibw')
    expect(calcOption(r, r.options[0], male80, 10).massLow).toBeCloseTo(0.6 * male80.ibw, 6)
    const rsi = calcOption(r, r.options[1], male80, 10)
    expect(rsi.massLow).toBeCloseTo(1.0 * male80.ibw, 6)
    expect(rsi.massHigh).toBeCloseTo(1.2 * male80.ibw, 6)
    const maint = calcOption(r, r.options[2], male80, 10)
    expect(maint.massLow).toBeCloseTo(0.1 * male80.ibw, 6)
    expect(maint.massHigh).toBeCloseTo(0.15 * male80.ibw, 6)
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

  it('norepinephrine 0.02–0.5 mcg/kg/min converts to per-hour mcg and mL/h at 80 mcg/mL', () => {
    const nor = drug('norepinephrine')
    expect(nor.defaultConc).toBe(80) // 4 mg / 50 mL
    const r = calcOption(nor, nor.options[0], male80, 80)
    expect(r.perHour).toBe(true)
    expect(r.massLow).toBeCloseTo(0.02 * 80 * 60, 6) // 96 mcg/h
    expect(r.massHigh).toBeCloseTo(0.5 * 80 * 60, 6) // 2400 mcg/h
    expect(r.volLow).toBeCloseTo(96 / 80, 6) // 1.2 mL/h
    expect(r.volHigh).toBeCloseTo(2400 / 80, 6) // 30 mL/h
  })

  it('propofol TIVA 6–12 mg/kg/h doses on LBW and yields mL/h', () => {
    const tiva = drug('propofol-tiva')
    expect(tiva.scalar).toBe('lbw')
    const r = calcOption(tiva, tiva.options[0], male80, 10)
    expect(r.perHour).toBe(true)
    expect(r.massLow).toBeCloseTo(6 * male80.lbw, 6)
    expect(r.massHigh).toBeCloseTo(12 * male80.lbw, 6)
    expect(r.volHigh).toBeCloseTo((12 * male80.lbw) / 10, 6)
  })

  it('remifentanil doses on LBW per kg/min', () => {
    const remi = drug('remifentanil')
    expect(remi.scalar).toBe('lbw')
    const r = calcOption(remi, remi.options[0], male80, 50)
    expect(r.perHour).toBe(true)
    expect(r.massLow).toBeCloseTo(0.1 * male80.lbw * 60, 6)
  })

  it('phenylephrine infusion 20–50 mcg/min is weight-independent, per hour', () => {
    const phe = drug('phenylephrine')
    const r = calcOption(phe, phe.options[1], male80, 100)
    expect(r.perHour).toBe(true)
    expect([r.massLow, r.massHigh]).toEqual([1200, 3000]) // mcg/h
    expect([r.volLow, r.volHigh]).toEqual([12, 30]) // mL/h
  })

  it('IV lidocaine has a per-kg bolus and per-kg/h infusion, both on IBW', () => {
    const lid = drug('lidocaine-iv')
    expect(lid.scalar).toBe('ibw')
    const bolus = calcOption(lid, lid.options[0], male80, 10)
    expect(bolus.perHour).toBe(false)
    expect(bolus.massHigh).toBeCloseTo(1.5 * male80.ibw, 6)
    const inf = calcOption(lid, lid.options[1], male80, 10)
    expect(inf.perHour).toBe(true)
    expect(inf.massHigh).toBeCloseTo(2 * male80.ibw, 6)
  })

  it('acetaminophen caps at 1000 mg and flags the ceiling', () => {
    const apap = drug('paracetamol')
    const heavy = computeScalars(150, 175, 'male')!
    const r = calcOption(apap, apap.options[0], heavy, 10)
    expect(r.massLow).toBe(1000) // 15 * 150 = 2250 -> capped
    expect(r.ceilingHit).toBe(true)
    expect(r.uncappedHigh).toBe(2250)
  })

  it('ondansetron peds dose caps at 4 mg', () => {
    const ond = drug('ondansetron')
    const heavy = computeScalars(150, 175, 'male')!
    const r = calcOption(ond, ond.options[1], heavy, 2)
    expect(r.massLow).toBe(4)
    expect(r.ceilingHit).toBe(true)
  })

  it('spec drug coverage: ids and scalars', () => {
    const byId = new Map(DRUGS.map((d) => [d.id, d]))
    const expectScalar = (id: string, scalar: string) => expect(byId.get(id)?.scalar).toBe(scalar)
    // spec scalars
    expectScalar('propofol', 'lbw')
    expectScalar('rocuronium', 'ibw')
    expectScalar('succinylcholine', 'tbw')
    expectScalar('cisatracurium', 'ibw')
    expectScalar('sugammadex', 'tbw')
    expectScalar('morphine', 'ibw')
    expectScalar('fentanyl', 'lbw')
    expectScalar('lidocaine-iv', 'ibw')
    expectScalar('remifentanil', 'lbw')
    expectScalar('propofol-tiva', 'lbw')
    // every spec drug exists
    for (const id of [
      'midazolam',
      'clonidine',
      'dexamethasone',
      'ondansetron',
      'propofol',
      'etomidate',
      'ketamine',
      'thiopental',
      'rocuronium',
      'succinylcholine',
      'cisatracurium',
      'sugammadex',
      'neostigmine',
      'propofol-tiva',
      'remifentanil',
      'norepinephrine',
      'phenylephrine',
      'ephedrine',
      'paracetamol',
      'ketorolac',
      'morphine',
      'fentanyl',
      'lidocaine-iv',
    ]) {
      expect(byId.has(id)).toBe(true)
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
