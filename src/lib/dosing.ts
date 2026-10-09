import type { Scalars } from './biometrics'
import type { Drug, DoseOption } from './drugs'

export interface DoseResult {
  label: string
  unit: 'mg' | 'mcg'
  massLow: number
  massHigh: number | null
  volLow: number
  volHigh: number | null
  ceilingHit: boolean
  uncappedHigh: number
}

export function calcOption(
  drug: Drug,
  opt: DoseOption,
  scalars: Scalars,
  conc: number,
): DoseResult {
  const kg = scalars[drug.scalar]
  const raw = (v: number) => (opt.basis === 'perKg' ? v * kg : v)
  const cap = (m: number) => (drug.maxMass === undefined ? m : Math.min(m, drug.maxMass))

  const rawLow = raw(opt.low)
  const rawHigh = raw(opt.high ?? opt.low)
  const low = cap(rawLow)
  const high = cap(rawHigh)
  const isRange = opt.high !== undefined && opt.high !== opt.low && low !== high

  return {
    label: opt.label,
    unit: drug.unit,
    massLow: low,
    massHigh: isRange ? high : null,
    volLow: low / conc,
    volHigh: isRange ? high / conc : null,
    ceilingHit: drug.maxMass !== undefined && rawHigh >= drug.maxMass,
    uncappedHigh: rawHigh,
  }
}
