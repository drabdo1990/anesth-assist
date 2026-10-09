import { describe, expect, it } from 'vitest'
import { CICO_PLANS, LAST_STEPS, MH_STEPS, dantrolene, lastLipid, ryanodex } from './crisis'

describe('lastLipid', () => {
  it('1.5 mL/kg bolus, 0.25 mL/kg/min infusion, 12 mL/kg total', () => {
    const r = lastLipid(60)!
    expect(r.bolusMl).toBe(90)
    expect(r.bolusCapped).toBe(false)
    expect(r.infusionMlMin).toBe(15)
    expect(r.infusionMlHr).toBe(900)
    expect(r.maxTotalMl).toBe(720)
  })
  it('caps the bolus at 100 mL and reports the uncapped value', () => {
    const r = lastLipid(120)!
    expect(r.bolusMl).toBe(100)
    expect(r.bolusCapped).toBe(true)
    expect(r.uncappedBolusMl).toBe(180)
  })
  it('returns null for invalid weight', () => {
    expect(lastLipid(null)).toBeNull()
    expect(lastLipid(0)).toBeNull()
    expect(lastLipid(NaN)).toBeNull()
  })
})

describe('dantrolene / ryanodex', () => {
  it('80 kg: 200 mg = 10 x 20 mg vials = 600 mL (60 mL per vial); 10 mg/kg ceiling 800 mg', () => {
    const d = dantrolene(80)!
    expect(d.doseMg).toBe(200)
    expect(d.vials).toBe(10)
    expect(d.volumeMl).toBeCloseTo(600, 6)
    expect(d.maxTotalMg).toBe(800)
  })
  it('80 kg ryanodex: 200 mg = 1 x 250 mg vial = 4 mL (50 mg/mL)', () => {
    const r = ryanodex(80)!
    expect(r.doseMg).toBe(200)
    expect(r.vials).toBe(1)
    expect(r.volumeMl).toBe(4)
  })
  it('rounds vials up', () => {
    expect(dantrolene(70)!.vials).toBe(9) // 175 mg / 20
    expect(ryanodex(110)!.vials).toBe(2) // 275 mg / 250
  })
  it('null on invalid weight', () => {
    expect(dantrolene(null)).toBeNull()
    expect(ryanodex(-1)).toBeNull()
  })
})

describe('protocol data', () => {
  it('has unique step ids and non-empty lists', () => {
    for (const steps of [LAST_STEPS, MH_STEPS, ...CICO_PLANS.map((p) => p.steps)]) {
      const ids = steps.map((s) => s.id)
      expect(new Set(ids).size).toBe(ids.length)
      expect(steps.length).toBeGreaterThan(0)
    }
    expect(MH_STEPS[0].text.toLowerCase()).toContain('volatile')
  })
  it('CICO runs A to D and D is front-of-neck access', () => {
    expect(CICO_PLANS.map((p) => p.id)).toEqual(['A', 'B', 'C', 'D'])
    expect(CICO_PLANS[3].title.toLowerCase()).toContain('front of neck')
  })
})

describe('Plan C wording', () => {
  it('no single step mentions both paralysis and sugammadex', () => {
    for (const p of CICO_PLANS) for (const s of p.steps) {
      const t = `${s.text} ${s.detail ?? ''}`.toLowerCase()
      expect(t.includes('paralysis') && t.includes('sugammadex')).toBe(false)
    }
  })
  it('Plan C has the two ventilation branches', () => {
    const ids = CICO_PLANS.find((p) => p.id === 'C')!.steps.map((s) => s.id)
    expect(ids).toContain('c-mask-ok')
    expect(ids).toContain('c-mask-fail')
  })
})
