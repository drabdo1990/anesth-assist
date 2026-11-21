export type CreatinineUnit = 'mgdl' | 'umol';

/** Serum creatinine: 1 mg/dL = 88.4 micromol/L (molar mass 113.12 g/mol). */
export const UMOL_PER_MGDL = 88.4;

/** Every calculation uses micromol/L. The unit setting only changes what the user types and reads. */
export const creatinineToUmol = (value: number, unit: CreatinineUnit): number => (unit === 'umol' ? value : value * UMOL_PER_MGDL);

export const creatinineFromUmol = (umol: number, unit: CreatinineUnit): number => (unit === 'umol' ? umol : umol / UMOL_PER_MGDL);
