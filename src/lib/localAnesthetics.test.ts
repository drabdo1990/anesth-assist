import { describe, expect, it } from 'vitest'
import { evaluateLA, LA_AGENTS, localMaxDisplay, maxDoseMg } from './localAnesthetics'

const agent = (id: string) => LA_AGENTS.find((a) => a.id === id)!

describe('maxDoseMg', () => {
  it('lidocaine plain 4 mg/kg, epi 7 mg/kg, with absolute ceilings', () => {
    expect(maxDoseMg(agent('lidocaine'), false, 70)).toBe(280)
    expect(maxDoseMg(agent('lidocaine'), true, 70)).toBe(490)
    expect(maxDoseMg(agent('lidocaine'), false, 100)).toBe(300) // ceiling
    expect(maxDoseMg(agent('lidocaine'), true, 100)).toBe(500) // ceiling
  })
  it('bupivacaine plain 2 mg/kg, epi 2.5 mg/kg, ceilings 175/225', () => {
    expect(maxDoseMg(agent('bupivacaine'), false, 70)).toBe(140)
    expect(maxDoseMg(agent('bupivacaine'), true, 70)).toBe(175)
    expect(maxDoseMg(agent('bupivacaine'), false, 120)).toBe(175)
    expect(maxDoseMg(agent('bupivacaine'), true, 120)).toBe(225)
  })
})

describe('evaluateLA', () => {
  it('refuses without a valid weight', () => {
    expect(evaluateLA([], null)).toBeNull()
    expect(evaluateLA([], 0)).toBeNull()
  })

  it('converts mL x % to mg (1% = 10 mg/mL)', () => {
    const r = evaluateLA([{ agentId: 'lidocaine', epi: false, volumeMl: 10, conc: 1 }], 70)!
    expect(r.rows[0].mg).toBe(100)
    expect(r.rows[0].fraction).toBeCloseTo(100 / 280, 6)
    expect(r.level).toBe('ok')
  })

  it('lidocaine + bupivacaine crossing 1.0 is toxic and names the worst drug', () => {
    const r = evaluateLA(
      [
        { agentId: 'lidocaine', epi: false, volumeMl: 10, conc: 1 }, // 100/280 = 0.357
        { agentId: 'bupivacaine', epi: false, volumeMl: 20, conc: 0.5 }, // 100/140 = 0.714
      ],
      70,
    )!
    expect(r.total).toBeCloseTo(0.357 + 0.714, 2)
    expect(r.level).toBe('toxic')
    expect(r.worst!.agentId).toBe('bupivacaine')
  })

  it('below 0.8 is ok, 0.8 to below 1.0 is caution, exactly 1.0 is toxic', () => {
    const ok = evaluateLA([{ agentId: 'bupivacaine', epi: false, volumeMl: 22, conc: 0.5 }], 70)! // 110/140 = 0.786
    expect(ok.level).toBe('ok')
    const caution = evaluateLA(
      [{ agentId: 'bupivacaine', epi: false, volumeMl: 23, conc: 0.5 }],
      70,
    )! // 115/140 = 0.821
    expect(caution.level).toBe('caution')
    const toxic = evaluateLA([{ agentId: 'bupivacaine', epi: false, volumeMl: 28, conc: 0.5 }], 70)! // 140/140 = 1
    expect(toxic.level).toBe('toxic')
  })

  it('blank, zero or negative volume counts as 0 and an unknown agent is ignored', () => {
    const r = evaluateLA(
      [
        { agentId: 'lidocaine', epi: false, volumeMl: null, conc: 1 },
        { agentId: 'lidocaine', epi: false, volumeMl: -5, conc: 1 },
        { agentId: 'nope', epi: false, volumeMl: 10, conc: 1 },
      ],
      70,
    )!
    expect(r.total).toBe(0)
    expect(r.rows.length).toBe(2)
    expect(r.level).toBe('ok')
  })
})

describe('evaluateLA fail closed', () => {
  it('NaN concentration yields toxic', () => {
    const r = evaluateLA([{ agentId: 'lidocaine', epi: false, volumeMl: 5, conc: NaN }], 70)!
    expect(r.level).toBe('toxic')
  })
})

describe('localMaxDisplay', () => {
  it('ok and valid is ok', () => expect(localMaxDisplay('ok', false).tone).toBe('ok'))
  it('ok with invalid volumes is incomplete, not green', () => {
    const d = localMaxDisplay('ok', true)
    expect(d.tone).toBe('incomplete')
    expect(d.message).toBe('Incomplete: fix invalid volumes')
  })
  it('caution and toxic stay warnings even with invalid volumes', () => {
    expect(localMaxDisplay('caution', true).tone).toBe('caution')
    expect(localMaxDisplay('toxic', true).tone).toBe('toxic')
  })
})
