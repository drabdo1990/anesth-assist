import type { DerivedKey, RiskBand, RiskScore, RiskScoreItem } from '../../data/riskScores';
import type { Sex } from './biometrics';
import { UMOL_PER_MGDL } from './units';

export interface ScoreContext {
  ageYears: number | null;
  sex: Sex | null;
  bmi: number | null;
  creatinineUmolL: number | null;
}

export type ScoreResult =
  | { kind: 'ok'; points: number; max: number; band: RiskBand }
  | { kind: 'incomplete'; missing: string[] }
  | { kind: 'not-applicable'; reason: string };

/** value() is null when the patient input it needs has not been entered. */
const DERIVE: Record<DerivedKey, { needs: string; value: (c: ScoreContext) => boolean | null }> = {
  'age>50': { needs: 'age', value: (c) => (c.ageYears === null ? null : c.ageYears > 50) },
  male: { needs: 'biological sex', value: (c) => (c.sex === null ? null : c.sex === 'male') },
  female: { needs: 'biological sex', value: (c) => (c.sex === null ? null : c.sex === 'female') },
  'bmi>35': { needs: 'weight and height (BMI)', value: (c) => (c.bmi === null ? null : c.bmi > 35) },
  'creatinine>2.0mgdl': {
    needs: 'serum creatinine',
    value: (c) => (c.creatinineUmolL === null ? null : c.creatinineUmolL > 2.0 * UMOL_PER_MGDL),
  },
};

/** Derived items follow the patient inputs; manual items are false until ticked. */
export const itemValue = (item: RiskScoreItem, answers: Record<string, boolean>, ctx: ScoreContext): boolean =>
  item.derive ? DERIVE[item.derive].value(ctx) === true : answers[item.id] === true;

export const scoreResult = (score: RiskScore, answers: Record<string, boolean>, ctx: ScoreContext): ScoreResult => {
  if (score.adultOnly) {
    if (ctx.ageYears === null) return { kind: 'incomplete', missing: ['age'] };
    if (ctx.ageYears < 18) return { kind: 'not-applicable', reason: 'This score is for adults (age 18 or over).' };
  }
  const missing = [
    ...new Set(score.items.flatMap((i) => (i.derive && DERIVE[i.derive].value(ctx) === null ? [DERIVE[i.derive].needs] : []))),
  ];
  if (missing.length > 0) return { kind: 'incomplete', missing };
  const points = score.items.filter((i) => itemValue(i, answers, ctx)).length;
  const band = [...score.bands].reverse().find((b) => points >= b.min) ?? score.bands[0];
  return { kind: 'ok', points, max: score.items.length, band };
};
