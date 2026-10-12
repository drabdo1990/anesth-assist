import type { Scalars } from './biometrics'
import type { DoseOption, Drug } from './drugs'

export interface DoseResult {
  label: string
  unit: 'mg' | 'mcg'
  massLow: number
  massHigh: number | null
  volLow: number
  volHigh: number | null
  ceilingHit: boolean
  uncappedHigh: number
  /** true for infusion-style options: mass is per hour, volume is mL/h */
  perHour: boolean
}

export function calcOption(
  drug: Drug,
  opt: DoseOption,
  scalars: Scalars,
  conc: number,
): DoseResult {
  const kg = scalars[drug.scalar]
  // infusion-style bases are converted to mass-per-hour so cards can render mL/h
  const perHourMass = (v: number): { mass: number; perHour: boolean } => {
    switch (opt.basis) {
      case 'perKgMin':
        return { mass: v * kg * 60, perHour: true }
      case 'perKgH':
        return { mass: v * kg, perHour: true }
      case 'fixedMin':
        return { mass: v * 60, perHour: true }
      case 'perKg':
        return { mass: v * kg, perHour: false }
      case 'fixed':
        return { mass: v, perHour: false }
    }
  }

  const cap = (m: number) => (drug.maxMass === undefined ? m : Math.min(m, drug.maxMass))

  const a = perHourMass(opt.low)
  const b = perHourMass(opt.high ?? opt.low)
  const perHour = a.perHour
  const low = cap(a.mass)
  const high = cap(b.mass)
  const isRange = opt.high !== undefined && opt.high !== opt.low && low !== high

  return {
    label: opt.label,
    unit: drug.unit,
    massLow: low,
    massHigh: isRange ? high : null,
    volLow: low / conc,
    volHigh: isRange ? high / conc : null,
    ceilingHit: drug.maxMass !== undefined && b.mass >= drug.maxMass,
    uncappedHigh: b.mass,
    perHour,
  }
}
