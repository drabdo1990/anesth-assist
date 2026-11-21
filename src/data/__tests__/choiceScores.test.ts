import { describe, expect, it } from 'vitest';
import { CHOICE_SCORES, FOUR_AT, MODIFIED_ALDRETE, PADSS } from '../choiceScores';
import { SOURCE_BY_ID } from '../sources';

describe('choice score records', () => {
  it('cite sources that exist and have unique item ids', () => {
    for (const s of CHOICE_SCORES) {
      expect(s.sourceIds.length, s.id).toBeGreaterThan(0);
      for (const id of s.sourceIds) expect(SOURCE_BY_ID[id], `${s.id} -> ${id}`).toBeDefined();
    }
    const ids = CHOICE_SCORES.flatMap((s) => s.items.map((i) => i.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('have bands that start at 0 and ascend', () => {
    for (const s of CHOICE_SCORES) {
      expect(s.bands[0].min, s.id).toBe(0);
      for (let k = 1; k < s.bands.length; k++) expect(s.bands[k].min, s.id).toBeGreaterThan(s.bands[k - 1].min);
    }
  });

  it('4AT: the option points are exactly those on the form', () => {
    const points = FOUR_AT.items.map((i) => i.options.map((o) => o.points));
    expect(points).toEqual([[0, 0, 4], [0, 1, 2], [0, 1, 2], [0, 4]]);
    expect(FOUR_AT.items.map((i) => i.label)).toEqual(['Alertness', 'AMT4', 'Attention', 'Acute change or fluctuating course']);
  });

  it('4AT: is read from the primary form and its bands change at 1 and at 4', () => {
    expect(SOURCE_BY_ID['4at-bellelli-2014'].verification).toBe('primary');
    expect(FOUR_AT.bands.map((b) => b.min)).toEqual([0, 1, 4]);
  });

  it('4AT: says it was validated in hospitalised patients aged 70 or over, not specifically after surgery', () => {
    expect(FOUR_AT.note).toContain('aged 70 or over');
    expect(FOUR_AT.note).toContain('not specifically after surgery');
    expect(SOURCE_BY_ID['4at-bellelli-2014'].accessNote).toContain('not specifically after surgery');
  });

  it('Aldrete and PADSS: five items scored out of 10, with the discharge mark at 9', () => {
    expect(MODIFIED_ALDRETE.items.map((i) => i.options.map((o) => o.points))).toEqual([[2, 1, 0], [2, 1, 0], [2, 1, 0], [2, 1, 0], [2, 1, 0]]);
    expect(PADSS.items.map((i) => i.options.map((o) => o.points))).toEqual([[2, 1, 0], [2, 1, 0], [2, 1, 0], [2, 0], [2, 1, 0]]);
    for (const s of [MODIFIED_ALDRETE, PADSS]) expect(s.bands.map((b) => b.min), s.id).toEqual([0, 9]);
  });

  it('Aldrete and PADSS: flag the three items the two textbooks word differently', () => {
    const prompt = (s: typeof PADSS, id: string) => s.items.find((i) => i.id === id)?.prompt ?? '';
    expect(prompt(MODIFIED_ALDRETE, 'aldrete-circulation')).toContain('Miller 6e');
    expect(prompt(MODIFIED_ALDRETE, 'aldrete-spo2')).toContain('Miller 6e');
    expect(prompt(PADSS, 'padss-pain')).toContain('Miller 6e');
  });

  it('lists the scores in the order the Post-op tab shows them', () => {
    expect(CHOICE_SCORES.map((s) => s.id)).toEqual(['modified-aldrete', 'padss', '4at']);
  });
});
