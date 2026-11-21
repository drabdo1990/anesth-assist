import { describe, expect, it } from 'vitest';
import { migratePersisted } from '../useAppStore';

// Shape written by the previous app version (persist version 0): it saved the patient, local
// anesthetic entries (including a default 20 mL bupivacaine entry) and a dismissed-disclaimer flag.
const OLD_PAYLOAD = {
  patient: { tbwKg: 95, heightCm: 180, sex: 'male' },
  selectedTiers: { propofol: 'propofol-adult' },
  localAdmins: [{ id: 'x', drugId: 'bupivacaine', concentrationPercent: 0.5, volumeGivenMl: 20, withEpi: false }],
  cprAudioAlert: false,
  disclaimerDismissed: true,
};

describe('migratePersisted (upgrade from the previous app version)', () => {
  it('drops patient values, local anesthetic entries and every other non-preference key', () => {
    const next = migratePersisted(OLD_PAYLOAD);
    const json = JSON.stringify(next);
    expect(json).not.toMatch(/tbwKg|heightCm|patient|localAdmins|bupivacaine|selectedTiers|disclaimer/i);
    expect(Object.keys(next).sort()).toEqual(
      ['audioEnabled', 'checks', 'concentrationChoice', 'creatinineUnit', 'guidelineSet', 'mhContact', 'preferredScalar', 'recents', 'ventScenarioId'].sort(),
    );
  });

  it('carries over only the one old preference that still applies (sound off)', () => {
    expect(migratePersisted(OLD_PAYLOAD).audioEnabled).toBe(false);
  });

  it('resets checklist ticks and concentration choices, whose meaning may have changed', () => {
    const next = migratePersisted({ checks: { 'pre-patient': true }, concentrationChoice: { ketamine: 1 } });
    expect(next.checks).toEqual({});
    expect(next.concentrationChoice).toEqual({});
  });

  it('keeps valid preferences and rejects invalid ones', () => {
    expect(migratePersisted({ guidelineSet: 'local', preferredScalar: 'LBW', mhContact: '123' })).toMatchObject({
      guidelineSet: 'local',
      preferredScalar: 'LBW',
      mhContact: '123',
    });
    expect(migratePersisted({ guidelineSet: 'bogus', preferredScalar: 'XYZ', mhContact: 42 })).toMatchObject({
      guidelineSet: 'international',
      preferredScalar: 'auto',
      mhContact: '',
    });
  });

  it.each([undefined, null, 'string', 7, []])('is safe on garbage input (%s)', (garbage) => {
    const next = migratePersisted(garbage);
    expect(next.guidelineSet).toBe('international');
    expect(next.checks).toEqual({});
  });

  it('keeps a valid creatinine unit and defaults an invalid one to mg/dL', () => {
    expect(migratePersisted({ creatinineUnit: 'umol' }).creatinineUnit).toBe('umol');
    expect(migratePersisted({ creatinineUnit: 'bogus' }).creatinineUnit).toBe('mgdl');
    expect(migratePersisted(undefined).creatinineUnit).toBe('mgdl');
  });
});
