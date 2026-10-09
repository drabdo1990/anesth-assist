import { describe, expect, it } from 'vitest'
import { EXTUBATION_ITEMS, PACU_FIELDS, WHO_ITEMS, buildPacuSummary } from './checklists'

describe('checklist data', () => {
  it('has unique ids', () => {
    for (const list of [WHO_ITEMS, EXTUBATION_ITEMS]) {
      const ids = list.map((i) => i.id)
      expect(new Set(ids).size).toBe(ids.length)
      expect(list.length).toBeGreaterThan(4)
    }
  })
  it('PACU form has no identifier fields', () => {
    const text = PACU_FIELDS.map((f) => f.label.toLowerCase()).join(' ')
    for (const banned of ['name', 'mrn', 'birth', 'dob', 'address', 'phone']) {
      expect(text).not.toContain(banned)
    }
  })
})

describe('buildPacuSummary', () => {
  it('includes only filled fields, trimmed, in field order', () => {
    const out = buildPacuSummary({ procedure: '  Lap chole ', asa: '2', pain: '' })
    const lines = out.split('\n')
    expect(lines[0]).toBe('PACU HANDOFF')
    expect(out).toContain('ASA class: 2')
    expect(out).toContain('Procedure: Lap chole')
    expect(out).not.toContain('Pain')
    expect(out.indexOf('ASA class')).toBeLessThan(out.indexOf('Procedure'))
  })
  it('empty input still returns a header and a note', () => {
    const out = buildPacuSummary({})
    expect(out.startsWith('PACU HANDOFF')).toBe(true)
    expect(out).toContain('No details entered')
  })
})
