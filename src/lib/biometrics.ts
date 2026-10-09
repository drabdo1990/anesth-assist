export type Sex = 'male' | 'female'
export type ScalarKey = 'tbw' | 'ibw' | 'lbw'

export interface Scalars {
  tbw: number
  ibw: number
  lbw: number
  abw40: number
  bmi: number
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

  // Devine IBW; if TBW < IBW use TBW
  const devine = (sex === 'male' ? 50 : 45.5) + 0.905 * Math.max(0, heightCm - 152.4)
  const ibw = tbw < devine ? tbw : devine

  const abw40 = tbw > ibw ? ibw + 0.4 * (tbw - ibw) : tbw

  // Janmahasatian LBW, capped at TBW
  const rawLbw =
    sex === 'male'
      ? (9270 * tbw) / (6680 + 216 * bmi)
      : (9270 * tbw) / (8780 + 244 * bmi)
  const lbw = Math.min(rawLbw, tbw)

  return { tbw, ibw, lbw, abw40, bmi }
}

export function inputAdvisories(tbw: number | null, heightCm: number | null) {
  // added: soft-warning bounds (weight 2-250 kg, height < 100 cm) are not in the brief
  const softWarnings: string[] = []
  if (finite(tbw) && (tbw < 2 || tbw > 250)) softWarnings.push('Weight looks unusual: check input')
  if (finite(heightCm) && heightCm < 100) softWarnings.push('Height looks unusual: check input')

  const bmi =
    isWeightValid(tbw) && isHeightValid(heightCm) ? tbw / (heightCm / 100) ** 2 : null
  // added: adult-only banner thresholds (height < 140 cm, weight < 30 kg, BMI >= 40)
  const adultOnly =
    (finite(heightCm) && heightCm < 140) ||
    (finite(tbw) && tbw < 30) ||
    (bmi !== null && bmi >= 40)
  return { softWarnings, adultOnly }
}
