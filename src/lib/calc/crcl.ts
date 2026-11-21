import type { Sex } from './biometrics';
import { creatinineFromUmol } from './units';

export interface CrclInput {
  ageYears: number | null;
  tbwKg: number | null;
  sex: Sex | null;
  creatinineUmolL: number | null;
}

export type CrclResult = { kind: 'ok'; mlPerMin: number } | { kind: 'incomplete'; missing: string[] };

export const MIN_CG_AGE = 18;

/**
 * Cockcroft-Gault with ACTUAL body weight (the convention in the DOAC trials and the US rivaroxaban label).
 * shortcut: no ideal or adjusted weight option, add one only if a sourced local protocol needs it.
 */
export const creatinineClearance = (i: CrclInput): CrclResult => {
  const missing: string[] = [];
  if (i.ageYears === null) missing.push('age');
  else if (i.ageYears < MIN_CG_AGE) missing.push(`age ${MIN_CG_AGE} or over`);
  if (i.tbwKg === null) missing.push('actual weight');
  if (i.sex === null) missing.push('biological sex');
  if (i.creatinineUmolL === null || i.creatinineUmolL <= 0) missing.push('serum creatinine');
  if (missing.length > 0 || i.ageYears === null || i.tbwKg === null || i.sex === null || i.creatinineUmolL === null) {
    return { kind: 'incomplete', missing };
  }
  const mgDl = creatinineFromUmol(i.creatinineUmolL, 'mgdl');
  const mlPerMin = (((140 - i.ageYears) * i.tbwKg) / (72 * mgDl)) * (i.sex === 'female' ? 0.85 : 1);
  return { kind: 'ok', mlPerMin };
};
