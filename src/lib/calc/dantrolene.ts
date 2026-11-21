// Dantrolene dosing for malignant hyperthermia. Always based on actual body weight.

export const DANTROLENE_INITIAL_MG_PER_KG = 2.5;
export const DANTROLENE_CUMULATIVE_CAUTION_MG_PER_KG = 10;

export interface DantroleneFormulation {
  id: 'dantrium-revonto' | 'ryanodex';
  mgPerVial: number;
  diluentMlPerVial: number;
}

export const DANTROLENE_FORMULATIONS: DantroleneFormulation[] = [
  { id: 'dantrium-revonto', mgPerVial: 20, diluentMlPerVial: 60 },
  { id: 'ryanodex', mgPerVial: 250, diluentMlPerVial: 5 },
];

export const dantroleneDoseMg = (
  actualWeightKg: number,
  mgPerKg: number = DANTROLENE_INITIAL_MG_PER_KG,
): number => actualWeightKg * mgPerKg;

export interface VialPlan {
  vials: number;
  diluentMl: number;
}

export const vialsFor = (doseMg: number, f: DantroleneFormulation): VialPlan => {
  const vials = Math.ceil(doseMg / f.mgPerVial);
  return { vials, diluentMl: vials * f.diluentMlPerVial };
};

export interface DantroleneCumulative {
  givenMg: number;
  givenMgPerKg: number;
  cautionMgPerKg: number;
  status: 'ok' | 'reached' | 'exceeded';
}

export const dantroleneCumulativeStatus = (actualWeightKg: number, givenMg: number): DantroleneCumulative => {
  const givenMgPerKg = givenMg / actualWeightKg;
  return {
    givenMg,
    givenMgPerKg,
    cautionMgPerKg: DANTROLENE_CUMULATIVE_CAUTION_MG_PER_KG,
    status:
      givenMgPerKg > DANTROLENE_CUMULATIVE_CAUTION_MG_PER_KG
        ? 'exceeded'
        : givenMgPerKg === DANTROLENE_CUMULATIVE_CAUTION_MG_PER_KG
          ? 'reached'
          : 'ok',
  };
};
