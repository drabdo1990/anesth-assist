export type Sex = 'male' | 'female'
export type ScalarKey = 'tbw' | 'ibw' | 'lbw'
export type PatientType = 'adult' | 'pediatric'

export interface Scalars {
  tbw: number
  ibw: number
  lbw: number
  abw40: number
  // null in pediatric mode: BMI needs height, which peds mode does not collect
  bmi: number | null
}

// added: soft input ranges (hard validity ranges below, advisories further down)
export const WEIGHT_RANGE = { min: 1, max: 400 } as const
export const HEIGHT_RANGE = { min: 30, max: 250 } as const

const finite = (n: number | null): n is number => typeof n === 'number' && Number.isFinite(n)

export function isWeightValid(tbw: number | null): tbw is number {
  return finite(tbw) && tbw >= WEIGHT_RANGE.min && tbw <= WEIGHT_RANGE.max
}

function isHeightValid(h: number | null): h is number {
  return finite(h) && h >= HEIGHT_RANGE.min && h <= HEIGHT_RANGE.max
}

export function computeScalars(
  tbw: number | null,
  heightCm: number | null,
  sex: Sex,
): Scalars | null {
  if (!isWeightValid(tbw) || !isHeightValid(heightCm)) return null

  const bmi = tbw / (heightCm / 100) ** 2

  // Devine IBW; if TBW < calculated IBW, use TBW
  const devine = (sex === 'male' ? 50 : 45.5) + 0.905 * (heightCm - 152.4)
  const ibw = tbw < devine ? tbw : devine

  const abw40 = tbw > ibw ? ibw + 0.4 * (tbw - ibw) : tbw

  // Janmahasatian LBW, capped at TBW
  const rawLbw =
    sex === 'male' ? (9270 * tbw) / (6680 + 216 * bmi) : (9270 * tbw) / (8780 + 244 * bmi)
  const lbw = Math.min(rawLbw, tbw)

  return { tbw, ibw, lbw, abw40, bmi }
}

// Pediatric mode: adult-derived scalars (IBW/LBW/ABW40) are meaningless in children,
// so they collapse to TBW. Formulary pediatric dosing is TBW-based, which keeps
// drug cards keyed on IBW/LBW numerically correct without special-casing every card.
export function computePedsScalars(tbw: number | null): Scalars | null {
  if (!isWeightValid(tbw)) return null
  return { tbw, ibw: tbw, lbw: tbw, abw40: tbw, bmi: null }
}

export const AGE_RANGE = { min: 0, max: 14 } as const // years

// Age-appropriate weight estimation:
// - Neonate (0 yr): 3.5 kg
// - Infants (<1 yr in months): Weight (kg) = 0.5 × (ageYears × 12) + 4
// - Children (1–14 yr): APLS formula: Weight (kg) = (ageYears + 4) × 2
export function estimatePedsWeight(ageYears: number): number {
  if (ageYears <= 0) return 3.5
  if (ageYears < 1) return Math.round((ageYears * 12 * 0.5 + 4) * 10) / 10
  return (ageYears + 4) * 2
}

export function isAgeValid(ageYears: number | null): ageYears is number {
  return finite(ageYears) && ageYears >= AGE_RANGE.min && ageYears <= AGE_RANGE.max
}

export function inputAdvisories(tbw: number | null, heightCm: number | null) {
  // added: soft-warning bounds (weight 2-250 kg, height < 100 cm) are not in the brief
  const softWarnings: string[] = []
  if (finite(tbw) && (tbw < 2 || tbw > 250)) softWarnings.push('Weight looks unusual: check input')
  if (finite(heightCm) && heightCm < 100) softWarnings.push('Height looks unusual: check input')

  const bmi = isWeightValid(tbw) && isHeightValid(heightCm) ? tbw / (heightCm / 100) ** 2 : null
  // added: adult-only banner thresholds (height < 140 cm, weight < 30 kg, BMI >= 40)
  const adultOnly =
    (finite(heightCm) && heightCm < 140) || (finite(tbw) && tbw < 30) || (bmi !== null && bmi >= 40)
  return { softWarnings, adultOnly }
}
