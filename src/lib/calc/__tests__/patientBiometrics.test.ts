import { describe, expect, it } from 'vitest';
import { computeBiometrics, computePatientBiometrics } from '../biometrics';

describe('computePatientBiometrics (unset fields are named, never assumed)', () => {
  it('names every missing field', () => {
    const r = computePatientBiometrics({ tbwKg: null, heightCm: null, sex: null });
    expect(r).toEqual({ ok: false, error: 'Enter actual weight, height and biological sex.' });
  });

  it('asks only for sex when weight and height are in', () => {
    const r = computePatientBiometrics({ tbwKg: 70, heightCm: 175, sex: null });
    expect(r).toEqual({ ok: false, error: 'Enter biological sex.' });
  });

  it('keeps a two-field message grammatical', () => {
    expect(computePatientBiometrics({ tbwKg: null, heightCm: null, sex: 'male' })).toEqual({
      ok: false,
      error: 'Enter actual weight and height.',
    });
    expect(computePatientBiometrics({ tbwKg: 70, heightCm: null, sex: null })).toEqual({
      ok: false,
      error: 'Enter height and biological sex.',
    });
  });

  it('never returns biometrics without a sex, even with valid weight and height', () => {
    expect(computePatientBiometrics({ tbwKg: 70, heightCm: 175, sex: null }).ok).toBe(false);
  });

  it('matches computeBiometrics exactly once everything is set', () => {
    for (const sex of ['male', 'female'] as const) {
      expect(computePatientBiometrics({ tbwKg: 70, heightCm: 175, sex })).toEqual(
        computeBiometrics({ tbwKg: 70, heightCm: 175, sex }),
      );
    }
  });

  it('gives different PBW for male and female, which is why sex cannot be defaulted', () => {
    const m = computePatientBiometrics({ tbwKg: 70, heightCm: 175, sex: 'male' });
    const f = computePatientBiometrics({ tbwKg: 70, heightCm: 175, sex: 'female' });
    if (!m.ok || !f.ok) throw new Error('expected ok');
    expect(m.value.pbw).toBeGreaterThan(f.value.pbw);
  });

  it('still rejects invalid numbers with the existing validation message', () => {
    const r = computePatientBiometrics({ tbwKg: 0, heightCm: 175, sex: 'male' });
    expect(r).toEqual({ ok: false, error: 'Weight must be greater than 0 kg.' });
  });
});
