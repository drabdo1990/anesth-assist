// ASRA LAST 20% lipid emulsion dosing. Values are cross-checked against the source in src/data/emergencies.ts.

export const LIPID_WEIGHT_THRESHOLD_KG = 70;
export const LIPID_MAX_CUMULATIVE_ML_PER_KG = 12;

export interface LipidPlan {
  stratum: 'under-70' | 'at-or-over-70';
  bolusMl: number;
  bolusMinutes: [number, number];
  /** <70 kg stratum: weight-based infusion. */
  infusionMlPerMin?: number;
  infusionMlPerHr?: number;
  doubledInfusionMlPerMin?: number;
  /** >=70 kg stratum: fixed volume over a time window. */
  infusionTotalMl?: number;
  infusionMinutes?: [number, number];
  maxCumulativeMl: number;
}

export const lipidPlan = (weightKg: number): LipidPlan => {
  const maxCumulativeMl = LIPID_MAX_CUMULATIVE_ML_PER_KG * weightKg;
  if (weightKg < LIPID_WEIGHT_THRESHOLD_KG) {
    const infusionMlPerMin = 0.25 * weightKg;
    return {
      stratum: 'under-70',
      bolusMl: 1.5 * weightKg,
      bolusMinutes: [2, 3],
      infusionMlPerMin,
      infusionMlPerHr: infusionMlPerMin * 60,
      doubledInfusionMlPerMin: infusionMlPerMin * 2,
      maxCumulativeMl,
    };
  }
  return {
    stratum: 'at-or-over-70',
    bolusMl: 100,
    bolusMinutes: [2, 3],
    infusionTotalMl: 250,
    infusionMinutes: [15, 20],
    maxCumulativeMl,
  };
};

export interface LipidCumulativeStatus {
  givenMl: number;
  maxMl: number;
  remainingMl: number;
  status: 'ok' | 'at-limit' | 'exceeds';
}

/** Track total lipid given against the 12 mL/kg ceiling. */
export const lipidCumulativeStatus = (weightKg: number, givenMl: number): LipidCumulativeStatus => {
  const maxMl = LIPID_MAX_CUMULATIVE_ML_PER_KG * weightKg;
  return {
    givenMl,
    maxMl,
    remainingMl: Math.max(0, maxMl - givenMl),
    status: givenMl > maxMl ? 'exceeds' : givenMl === maxMl ? 'at-limit' : 'ok',
  };
};
