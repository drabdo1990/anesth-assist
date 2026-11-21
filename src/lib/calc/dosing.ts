// Pure dose/volume calculations and absolute-maximum checks. All checks use unrounded values.

export type DoseUnit = 'mg/kg' | 'mcg/kg' | 'mg' | 'mcg';
export type MassUnit = 'mg' | 'mcg';

export const calculateVolumeMl = (doseMg: number, concentrationMgPerMl: number): number =>
  doseMg / concentrationMgPerMl;

export const mcgToMg = (mcg: number): number => mcg / 1000;
export const mgToMcg = (mg: number): number => mg * 1000;

export interface DoseResult {
  /** Mass in the dose's natural unit (mg or mcg). */
  mass: number;
  massUnit: MassUnit;
  massMg: number;
  volumeMl: number;
}

/** Compute mass and volume for a dose. `weightKg` is ignored for fixed (non per-kg) units. */
export const calculateDose = (
  dosePerUnit: number,
  unit: DoseUnit,
  weightKg: number,
  concentrationMgPerMl: number,
): DoseResult => {
  const perKg = unit === 'mg/kg' || unit === 'mcg/kg';
  const mass = perKg ? dosePerUnit * weightKg : dosePerUnit;
  const massUnit: MassUnit = unit === 'mcg/kg' || unit === 'mcg' ? 'mcg' : 'mg';
  const massMg = massUnit === 'mcg' ? mcgToMg(mass) : mass;
  return { mass, massUnit, massMg, volumeMl: calculateVolumeMl(massMg, concentrationMgPerMl) };
};

export type RateUnit = 'mcg/kg/min' | 'mcg/min';

export interface InfusionResult {
  mcgPerMin: number;
  mlPerHr: number;
}

/** Infusion rate and pump setting. `weightKg` is ignored for the fixed mcg/min unit. */
export const calculateInfusion = (
  rate: number,
  unit: RateUnit,
  weightKg: number,
  concentrationMgPerMl: number,
): InfusionResult => {
  const mcgPerMin = unit === 'mcg/kg/min' ? rate * weightKg : rate;
  const mgPerHr = (mcgPerMin * 60) / 1000;
  return { mcgPerMin, mlPerHr: mgPerHr / concentrationMgPerMl };
};

/** Compare an unrounded infusion rate against a ceiling in mcg/min. */
export const checkRateMax = (result: InfusionResult, maxMcgPerMin: number): MaxDoseStatus =>
  result.mcgPerMin > maxMcgPerMin ? 'exceeds' : result.mcgPerMin === maxMcgPerMin ? 'at-limit' : 'ok';

export type MaxDoseStatus = 'ok' | 'at-limit' | 'exceeds';

export interface AbsoluteMax {
  value: number;
  unit: 'mg' | 'mcg' | 'mL';
}

/** Compare an unrounded calculated dose against an absolute ceiling expressed in mg, mcg or mL. */
export const checkAbsoluteMax = (
  result: Pick<DoseResult, 'massMg' | 'volumeMl'>,
  max: AbsoluteMax,
): MaxDoseStatus => {
  const actual =
    max.unit === 'mL' ? result.volumeMl : max.unit === 'mcg' ? mgToMcg(result.massMg) : result.massMg;
  if (actual > max.value) return 'exceeds';
  if (actual === max.value) return 'at-limit';
  return 'ok';
};
