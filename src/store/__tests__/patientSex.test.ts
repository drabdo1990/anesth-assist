import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EMPTY_PATIENT, useAppStore } from '../useAppStore';

describe('patient sex starts unset', () => {
  beforeEach(() => {
    useAppStore.getState().newCase();
  });

  it('the empty patient has no sex', () => {
    expect(EMPTY_PATIENT.sex).toBeNull();
    expect(useAppStore.getState().patient.sex).toBeNull();
  });

  it('choosing a sex sticks, and New case clears it again', () => {
    useAppStore.getState().setPatient({ sex: 'female' });
    expect(useAppStore.getState().patient.sex).toBe('female');
    useAppStore.getState().newCase();
    expect(useAppStore.getState().patient.sex).toBeNull();
  });

  it('entering weight and height does not pick a sex', () => {
    useAppStore.getState().setPatient({ tbwKg: 80, heightCm: 180 });
    expect(useAppStore.getState().patient.sex).toBeNull();
  });

  it('sex is never written to storage (zero-PHI rule)', async () => {
    const written = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => written.get(k) ?? null,
      setItem: (k: string, v: string) => void written.set(k, v),
      removeItem: (k: string) => void written.delete(k),
    });
    vi.resetModules();
    try {
      const { useAppStore: fresh } = await import('../useAppStore');
      fresh.getState().setPatient({ sex: 'male', tbwKg: 70, heightCm: 175, ageYears: 40 });
      fresh.getState().setMhContact('ext 1234');
      const raw = written.get('anesthassist-storage') ?? '';
      expect(raw).toContain('mhContact'); // storage really was written
      for (const forbidden of ['sex', 'patient', 'tbwKg', 'heightCm', 'ageYears']) {
        expect(raw, forbidden).not.toContain(forbidden);
      }
    } finally {
      vi.unstubAllGlobals();
      vi.resetModules();
    }
  });
});
