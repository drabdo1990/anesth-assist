import { estimatePedsWeight, type Sex } from './biometrics'

const round1 = (n: number) => Math.round(n * 10) / 10

// ── Endotracheal tubes ───────────────────────────────────────────────────────

export interface AdultEtt {
  idLow: number
  idHigh: number
  depthLow: number
  depthHigh: number
}

export function adultEtt(sex: Sex): AdultEtt {
  return sex === 'female'
    ? { idLow: 7.0, idHigh: 7.5, depthLow: 20, depthHigh: 21 }
    : { idLow: 8.0, idHigh: 8.5, depthLow: 22, depthHigh: 23 }
}

export interface PedsEtt {
  uncuffedId: number
  cuffedId: number
  microcuffId: number
  oralDepth: number
  nasalDepth: number
}

/** Pediatric ETT formulas (age in years): uncuffed (age/4)+4, cuffed (age/4)+3.5,
 * microcuff (age/4)+3.0, oral depth (age/2)+12 cm, nasal depth (age/2)+15 cm. */
export function pedsEtt(ageYears: number): PedsEtt {
  const q = ageYears / 4
  return {
    uncuffedId: round1(q + 4),
    cuffedId: round1(q + 3.5),
    microcuffId: round1(q + 3.0),
    oralDepth: round1(ageYears / 2 + 12),
    nasalDepth: round1(ageYears / 2 + 15),
  }
}

/** Max recommended ETT cuff pressure to prevent subglottic ischemic damage. */
export const CUFF_PRESSURE_MAX = 25 // cmH2O (target 20–25)

// ── Supraglottic airway devices (LMA / i-gel) ────────────────────────────────

export interface SadRow {
  size: string
  minKg: number
  maxKg: number | null
  cuffMl: number
}

export const SAD_TABLE: SadRow[] = [
  { size: '1', minKg: 0, maxKg: 5, cuffMl: 4 },
  { size: '1.5', minKg: 5, maxKg: 10, cuffMl: 7 },
  { size: '2', minKg: 10, maxKg: 20, cuffMl: 10 },
  { size: '2.5', minKg: 20, maxKg: 30, cuffMl: 14 },
  { size: '3', minKg: 30, maxKg: 50, cuffMl: 20 },
  { size: '4', minKg: 50, maxKg: 70, cuffMl: 30 },
  { size: '5', minKg: 70, maxKg: null, cuffMl: 40 },
]

export function selectSad(weightKg: number | null): SadRow | null {
  if (weightKg === null || !Number.isFinite(weightKg) || weightKg < 0) return null
  for (const row of SAD_TABLE) {
    if (row.maxKg === null) return weightKg >= row.minKg ? row : null
    if (weightKg < row.maxKg) return row
  }
  return null
}

/** i-gel uses the identical weight-band mapping as cuffed LMAs (sizes 1–5). */
export function igelSize(weightKg: number | null): string | null {
  return selectSad(weightKg)?.size ?? null
}

// ── Double-lumen endobronchial tubes (thoracic) ──────────────────────────────

export function dltSize(heightCm: number, sex: Sex): string {
  if (!Number.isFinite(heightCm)) return '—'
  if (heightCm < 160) return '35 Fr'
  if (heightCm <= 175) return sex === 'female' ? '37 Fr' : '39 Fr'
  return '39–41 Fr'
}

// ── Bronchial blockers (match to single-lumen tube ID) ──────────────────────

export const BRONCHIAL_BLOCKERS = [
  { size: '9 Fr', slt: 'SLT ID ≥ 7.5–8.0 mm' },
  { size: '7 Fr', slt: 'SLT ID ≥ 6.5–7.0 mm' },
  { size: '5 Fr', slt: 'SLT ID ≥ 4.5–5.0 mm (pediatric)' },
] as const

// ── Pharyngeal airways & laryngoscope blades ────────────────────────────────

export const GUEDEL_TABLE = [
  { size: '000', minKg: 0, maxKg: 5, patient: 'Neonate < 5 kg' },
  { size: '00', minKg: 5, maxKg: 10, patient: 'Infant 5–10 kg' },
  { size: '0', minKg: 10, maxKg: 20, patient: 'Infant / toddler 10–20 kg' },
  { size: '1', minKg: 20, maxKg: 30, patient: 'Child 20–30 kg' },
  { size: '2', minKg: 30, maxKg: 50, patient: 'Large child 30–50 kg' },
  { size: '3', minKg: 50, maxKg: 70, patient: 'Small adult 50–70 kg' },
  { size: '4', minKg: 70, maxKg: 90, patient: 'Medium adult 70–90 kg' },
  { size: '5', minKg: 90, maxKg: null, patient: 'Large adult > 90 kg' },
] as const

export function guedelSize(weightKg: number | null): string | null {
  if (weightKg === null || !Number.isFinite(weightKg) || weightKg < 0) return null
  for (const row of GUEDEL_TABLE) {
    if (row.maxKg === null) return weightKg >= row.minKg ? row.size : null
    if (weightKg < row.maxKg) return row.size
  }
  return null
}

export function bladeRecommendation(ageYears: number | null, isPeds: boolean): string {
  if (!isPeds) return 'Macintosh 3 (Mac 4 for large adult or difficult airway)'
  if (ageYears === null) return 'Miller 0–1 for neonates/infants; Mac 2 from ~5 years'
  if (ageYears < 1) return 'Miller 0–1 (neonate / infant)'
  if (ageYears < 5) return 'Miller 1–2 (toddler)'
  if (ageYears < 10) return 'Mac 2 (child)'
  return 'Mac 3 (adolescent)'
}

/** Age-appropriate baseline parameter pills for the pediatric biometric strip. */
export function pedsBaselinePills(ageYears: number): { label: string; value: string }[] {
  const e = pedsEtt(ageYears)
  return [
    { label: 'ETT uncuffed', value: `${e.uncuffedId} mm` },
    { label: 'ETT cuffed', value: `${e.cuffedId} mm` },
    { label: 'Oral depth', value: `${e.oralDepth} cm` },
    { label: 'LMA size', value: selectSad(estimatePedsWeight(ageYears))?.size ?? '—' },
  ]
}
