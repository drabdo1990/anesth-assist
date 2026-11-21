import { describe, expect, it } from 'vitest';
import { creatinineClearance } from '../crcl';
import { creatinineToUmol } from '../units';

const man = { ageYears: 70, tbwKg: 70, sex: 'male' as const, creatinineUmolL: creatinineToUmol(1.0, 'mgdl') };

describe('creatinineClearance (Cockcroft-Gault, actual body weight)', () => {
  it('man, 70 y, 70 kg, creatinine 1.0 mg/dL: (70 x 70) / 72 = 68 mL/min', () => {
    const r = creatinineClearance(man);
    if (r.kind !== 'ok') throw new Error('expected ok');
    expect(r.mlPerMin).toBeCloseTo(68.06, 2);
  });

  it('woman, 60 y, 60 kg, creatinine 1.2 mg/dL: (80 x 60) / (72 x 1.2) x 0.85 = 47.2 mL/min', () => {
    const r = creatinineClearance({ ageYears: 60, tbwKg: 60, sex: 'female', creatinineUmolL: creatinineToUmol(1.2, 'mgdl') });
    if (r.kind !== 'ok') throw new Error('expected ok');
    expect(r.mlPerMin).toBeCloseTo(47.22, 2);
  });

  it('lists every missing input, in a fixed order', () => {
    expect(creatinineClearance({ ageYears: null, tbwKg: null, sex: null, creatinineUmolL: null })).toEqual({
      kind: 'incomplete',
      missing: ['age', 'actual weight', 'biological sex', 'serum creatinine'],
    });
  });

  it('gives no number for a patient under 18', () => {
    expect(creatinineClearance({ ...man, ageYears: 17 })).toEqual({ kind: 'incomplete', missing: ['age 18 or over'] });
  });

  it('accepts exactly 18', () => {
    expect(creatinineClearance({ ...man, ageYears: 18 }).kind).toBe('ok');
  });

  it.each([0, -5])('treats creatinine %s as missing instead of dividing by zero', (bad) => {
    expect(creatinineClearance({ ...man, creatinineUmolL: bad })).toEqual({ kind: 'incomplete', missing: ['serum creatinine'] });
  });
});
