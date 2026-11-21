// Local anesthetic dose and combined-toxicity fraction. Sum of (dose / max) must stay below 1.0.

export interface LocalAnestheticLimit {
  /** mg/kg limit for the selected formulation (plain or epinephrine-containing). */
  mgPerKg?: number;
  /** Absolute ceiling in mg, if the source defines one. */
  absoluteMaxMg?: number;
}

/** 1% = 10 mg/mL. */
export const percentToMgPerMl = (percent: number): number => percent * 10;

export const localAnestheticDoseMg = (volumeMl: number, percent: number): number =>
  volumeMl * percentToMgPerMl(percent);

export const maxAllowedMg = (limit: LocalAnestheticLimit, weightKg: number): number | null => {
  const candidates = [
    limit.mgPerKg !== undefined ? limit.mgPerKg * weightKg : undefined,
    limit.absoluteMaxMg,
  ].filter((value): value is number => value !== undefined);
  return candidates.length === 0 ? null : Math.min(...candidates);
};

export interface LocalAdministration {
  doseMg: number;
  maxMg: number;
}

export type ToxicityStatus = 'safe' | 'caution' | 'toxic';

export interface ToxicityFractionResult {
  fractions: number[];
  total: number;
  status: ToxicityStatus;
}

export const CAUTION_FRACTION = 0.7;

export const combinedToxicityFraction = (admins: LocalAdministration[]): ToxicityFractionResult => {
  const fractions = admins.map((a) => (a.maxMg > 0 ? a.doseMg / a.maxMg : 0));
  const total = fractions.reduce((sum, f) => sum + f, 0);
  const status: ToxicityStatus = total >= 1 ? 'toxic' : total >= CAUTION_FRACTION ? 'caution' : 'safe';
  return { fractions, total, status };
};
