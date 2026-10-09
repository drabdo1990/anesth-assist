import { isWeightValid } from './biometrics'

export interface LAAgent {
  id: string
  name: string
  mgPerKgPlain: number
  mgPerKgEpi: number
  absPlain: number
  absEpi: number
  concentrations: number[] // percent
}

// Lidocaine and bupivacaine mg/kg values come from the spec.
// added: absolute ceilings (absPlain/absEpi) for every agent, and the whole
// ropivacaine, mepivacaine and chloroprocaine rows, are standard published values
// not in the original brief (spec section 9).
export const LA_AGENTS: LAAgent[] = [
  { id: 'lidocaine', name: 'Lidocaine', mgPerKgPlain: 4, mgPerKgEpi: 7, absPlain: 300, absEpi: 500, concentrations: [0.5, 1, 1.5, 2] },
  { id: 'bupivacaine', name: 'Bupivacaine', mgPerKgPlain: 2, mgPerKgEpi: 2.5, absPlain: 175, absEpi: 225, concentrations: [0.25, 0.5, 0.75] },
  { id: 'ropivacaine', name: 'Ropivacaine', mgPerKgPlain: 3, mgPerKgEpi: 3, absPlain: 200, absEpi: 200, concentrations: [0.2, 0.5, 0.75, 1] },
  { id: 'mepivacaine', name: 'Mepivacaine', mgPerKgPlain: 4, mgPerKgEpi: 7, absPlain: 400, absEpi: 550, concentrations: [1, 1.5, 2] },
  { id: 'chloroprocaine', name: 'Chloroprocaine', mgPerKgPlain: 11, mgPerKgEpi: 14, absPlain: 800, absEpi: 1000, concentrations: [2, 3] },
]

export function maxDoseMg(agent: LAAgent, epi: boolean, tbw: number): number {
  const perKg = epi ? agent.mgPerKgEpi : agent.mgPerKgPlain
  const abs = epi ? agent.absEpi : agent.absPlain
  return Math.min(perKg * tbw, abs)
}

export interface LAEntry {
  agentId: string
  epi: boolean
  volumeMl: number | null
  conc: number // percent
}

export interface LARow {
  agentId: string
  name: string
  mg: number
  maxMg: number
  fraction: number
}

export interface LAResult {
  rows: LARow[]
  total: number
  level: 'ok' | 'caution' | 'toxic'
  worst: LARow | null
}

export function evaluateLA(entries: LAEntry[], tbw: number | null): LAResult | null {
  if (!isWeightValid(tbw)) return null

  const rows: LARow[] = []
  for (const e of entries) {
    const agent = LA_AGENTS.find((a) => a.id === e.agentId)
    if (!agent) continue
    const vol = e.volumeMl !== null && Number.isFinite(e.volumeMl) && e.volumeMl > 0 ? e.volumeMl : 0
    const mg = e.conc * 10 * vol
    const maxMg = maxDoseMg(agent, e.epi, tbw)
    rows.push({ agentId: agent.id, name: agent.name, mg, maxMg, fraction: mg / maxMg })
  }

  const total = rows.reduce((s, r) => s + r.fraction, 0)
  // added: 0.8 caution threshold is not in the original brief (spec section 9)
  // small epsilon so float error cannot hide an exact 1.0 or 0.8
  // fail closed: a non-finite total (e.g. NaN concentration) is never reported as safe
  const level = !Number.isFinite(total) || total >= 1 - 1e-9 ? 'toxic' : total >= 0.8 - 1e-9 ? 'caution' : 'ok'
  const worst = rows.reduce<LARow | null>(
    (w, r) => (w === null || r.fraction > w.fraction ? r : w),
    null,
  )
  return { rows, total, level, worst }
}

export type DisplayTone = 'ok' | 'caution' | 'toxic' | 'incomplete'

// A green "ok" must never sit beside invalid volumes that were left out of the total.
export function localMaxDisplay(level: LAResult['level'], anyInvalid: boolean): { tone: DisplayTone; message: string } {
  if (level === 'toxic') return { tone: 'toxic', message: 'TOXIC RISK: total ≥ 1.0' }
  if (level === 'caution') return { tone: 'caution', message: 'CAUTION: approaching the combined maximum (≥ 0.8)' }
  if (anyInvalid) return { tone: 'incomplete', message: 'Incomplete: fix invalid volumes' }
  return { tone: 'ok', message: 'Safe if total stays below 1.0.' }
}
