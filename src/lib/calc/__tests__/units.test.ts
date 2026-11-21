import { describe, expect, it } from 'vitest';
import { UMOL_PER_MGDL, creatinineFromUmol, creatinineToUmol } from '../units';

describe('creatinine units', () => {
  it('converts 1 mg/dL to 88.4 umol/L and back', () => {
    expect(creatinineToUmol(1, 'mgdl')).toBeCloseTo(88.4, 6);
    expect(creatinineFromUmol(88.4, 'mgdl')).toBeCloseTo(1, 6);
  });

  it('leaves umol/L unchanged', () => {
    expect(creatinineToUmol(120, 'umol')).toBe(120);
    expect(creatinineFromUmol(120, 'umol')).toBe(120);
  });

  it('round-trips typed mg/dL values without drifting', () => {
    for (const v of [0.6, 1.0, 2.0, 5.5]) {
      expect(creatinineFromUmol(creatinineToUmol(v, 'mgdl'), 'mgdl')).toBeCloseTo(v, 9);
    }
  });

  it('uses 88.4 as the conversion factor', () => {
    expect(UMOL_PER_MGDL).toBe(88.4);
  });
});
