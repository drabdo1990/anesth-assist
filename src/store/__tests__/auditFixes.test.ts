import { beforeEach, describe, expect, it } from 'vitest';
import { useAppStore } from '../useAppStore';

describe('audit fixes in the store', () => {
  beforeEach(() => useAppStore.getState().newCase());

  it('starts a new local-anesthetic entry at a real concentration', () => {
    useAppStore.getState().addLaAdmin('lidocaine', 0.5);
    expect(useAppStore.getState().laAdmins[0]).toMatchObject({ anestheticId: 'lidocaine', percent: 0.5, volumeMl: 0 });
  });

  it('keeps dose concentrations separate for a bolus and an infusion', () => {
    useAppStore.getState().setConcentrationChoice('phenyl-bolus-initial', 0.1);
    useAppStore.getState().setConcentrationChoice('phenyl-infusion', 0.02);
    expect(useAppStore.getState().concentrationChoice).toMatchObject({
      'phenyl-bolus-initial': 0.1,
      'phenyl-infusion': 0.02,
    });
  });

  it('logs and undoes cumulative doses independently', () => {
    const store = useAppStore.getState();
    store.logDose('ephedrine', 10);
    store.logDose('ephedrine', 10);
    store.logDose('labetalol', 20);
    expect(useAppStore.getState().doseAdminLogs).toEqual({ ephedrine: [10, 10], labetalol: [20] });

    useAppStore.getState().undoDose('ephedrine');
    expect(useAppStore.getState().doseAdminLogs.ephedrine).toEqual([10]);
    useAppStore.getState().resetDoseLog('ephedrine');
    expect(useAppStore.getState().doseAdminLogs.ephedrine).toBeUndefined();
  });

  it('resets only the requested emergency tracker', () => {
    const store = useAppStore.getState();
    store.addLipid(100);
    store.addDantrolene(200);
    store.toggleEmergencyCheck('mh-help');
    store.timerStart('cico');
    useAppStore.getState().resetLipid();

    const next = useAppStore.getState();
    expect(next.lipidGivenMl).toBe(0);
    expect(next.dantroleneGivenMg).toBe(200);
    expect(next.emergencyChecks['mh-help']).toBe(true);
    expect(next.timers.cico?.running).toBe(true);
  });
});
