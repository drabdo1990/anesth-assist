export interface VentRow {
  label: string
  vtMl: number
}

/** Lung-protective VT rows at 6/7/8 mL/kg of the dosing weight (IBW in adults). */
export function vtRows(dosingWeightKg: number): VentRow[] {
  return [6, 7, 8].map((v) => ({ label: `${v} mL/kg`, vtMl: v * dosingWeightKg }))
}

export function minuteVentilation(vtMl: number, rr: number): number {
  if (!Number.isFinite(vtMl) || !Number.isFinite(rr) || vtMl <= 0 || rr <= 0) return 0
  return (vtMl * rr) / 1000 // L/min
}

/** Adult baseline RR 10–14; pediatric 20–30. */
export function rrBaseline(isPeds: boolean): [number, number] {
  return isPeds ? [20, 30] : [10, 14]
}

export const PPLAT_LIMIT = 30 // cmH2O
export const DP_TARGET = 14 // cmH2O (spec target <14–15)
export const DP_LIMIT = 15 // cmH2O
export const PEEP_BASELINE: [number, number] = [5, 8] // cmH2O intraoperative

export function drivingPressure(pplat: number, peep: number): number | null {
  if (!Number.isFinite(pplat) || !Number.isFinite(peep)) return null
  return pplat - peep
}

export type Tone = 'ok' | 'caution' | 'danger'

export function drivingTone(dp: number | null): Tone | null {
  if (dp === null) return null
  if (dp < DP_TARGET) return 'ok'
  if (dp <= DP_LIMIT) return 'caution'
  return 'danger'
}

export function pplatTone(pplat: number | null): Tone | null {
  if (pplat === null) return null
  return pplat < PPLAT_LIMIT ? 'ok' : 'danger'
}

/** Warn when dialing VT against actual body weight would over-ventilate
 * an obese patient (TBW meaningfully above IBW). */
export function volutraumaRisk(tbw: number, ibw: number): boolean {
  return Number.isFinite(tbw) && Number.isFinite(ibw) && ibw > 0 && tbw / ibw > 1.3
}
