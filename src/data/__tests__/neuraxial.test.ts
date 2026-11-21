import { describe, expect, it } from 'vitest';
import { NEURAXIAL_REGIMENS, maxDeliverableMg } from '../neuraxial';
import { SOURCE_BY_ID } from '../sources';

describe('neuraxial reference regimens', () => {
  it('have unique ids and registered sources', () => {
    const ids = NEURAXIAL_REGIMENS.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const r of NEURAXIAL_REGIMENS) {
      expect(r.sourceIds.length, r.id).toBeGreaterThan(0);
      for (const s of r.sourceIds) expect(s in SOURCE_BY_ID, `${r.id} -> ${s}`).toBe(true);
    }
  });

  it('have ordered, positive ranges', () => {
    for (const r of NEURAXIAL_REGIMENS) {
      for (const range of [r.concPercent, r.volumeMl, r.totalDoseMg, r.onsetMin, r.durationMin]) {
        if (!range) continue;
        expect(range[0], r.id).toBeGreaterThan(0);
        expect(range[1], r.id).toBeGreaterThanOrEqual(range[0]);
      }
    }
  });

  it('flags exactly the regimens whose printed total exceeds concentration x volume', () => {
    const unreachable = NEURAXIAL_REGIMENS.filter((r) => r.totalDoseMg[1] > maxDeliverableMg(r)).map((r) => r.id);
    const flagged = NEURAXIAL_REGIMENS.filter((r) => r.discrepancy).map((r) => r.id);
    expect(flagged.sort()).toEqual(unreachable.sort());
  });
});
