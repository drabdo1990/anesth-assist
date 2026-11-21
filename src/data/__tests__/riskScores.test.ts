import { describe, expect, it } from 'vitest';
import { POSTOP_SCORES, RISK_SCORES } from '../riskScores';
import { SOURCE_BY_ID } from '../sources';

const ALL = [...RISK_SCORES, ...POSTOP_SCORES];

describe('risk score records', () => {
  it('cite sources that exist in the registry', () => {
    for (const s of ALL) {
      expect(s.sourceIds.length, s.id).toBeGreaterThan(0);
      for (const id of s.sourceIds) expect(SOURCE_BY_ID[id], `${s.id} -> ${id}`).toBeDefined();
    }
  });

  it('have unique item ids across all scores', () => {
    const ids = ALL.flatMap((s) => s.items.map((i) => i.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('have bands that start at 0, ascend, and stay within the item count', () => {
    for (const s of ALL) {
      expect(s.bands[0].min, s.id).toBe(0);
      for (let k = 1; k < s.bands.length; k++) expect(s.bands[k].min, s.id).toBeGreaterThan(s.bands[k - 1].min);
      expect(s.bands[s.bands.length - 1].min, s.id).toBeLessThanOrEqual(s.items.length);
    }
  });

  it('Apfel: four one-point items, adults only, bands low 0 / medium 1 / high 3', () => {
    const apfel = POSTOP_SCORES.find((s) => s.id === 'apfel')!;
    expect(apfel.items).toHaveLength(4);
    expect(apfel.adultOnly).toBe(true);
    expect(apfel.bands.map((b) => [b.min, b.label])).toEqual([[0, 'Low risk'], [1, 'Medium risk'], [3, 'High risk']]);
  });
});
