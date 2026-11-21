import { describe, expect, it } from 'vitest';
import { FOUR_AT, MODIFIED_ALDRETE, PADSS } from '../../../data/choiceScores';
import { choiceScoreResult } from '../choiceScores';

const answers = (...picks: number[]): Record<string, number> => Object.fromEntries(FOUR_AT.items.map((it, i) => [it.id, picks[i]]));
const ok = (r: ReturnType<typeof choiceScoreResult>) => {
  if (r.kind !== 'ok') throw new Error(`expected ok, got incomplete: ${r.missing.join(', ')}`);
  return r;
};

describe('4AT', () => {
  it.each([
    [[0, 0, 0, 0], 0, 'Delirium or cognitive impairment unlikely'],
    [[0, 1, 0, 0], 1, 'Possible cognitive impairment'],
    [[0, 2, 1, 0], 3, 'Possible cognitive impairment'],
    [[2, 0, 0, 0], 4, 'Possible delirium +/- cognitive impairment'],
    [[0, 0, 0, 1], 4, 'Possible delirium +/- cognitive impairment'],
    [[0, 2, 2, 0], 4, 'Possible delirium +/- cognitive impairment'],
    [[2, 2, 2, 1], 12, 'Possible delirium +/- cognitive impairment'],
  ])('choices %j -> %s points, %s', (picks, points, band) => {
    const r = ok(choiceScoreResult(FOUR_AT, answers(...picks)));
    expect(r.points).toBe(points);
    expect(r.band.label).toBe(band);
    expect(r.max).toBe(12);
  });

  it('mild sleepiness on waking scores 0, the same as normal alertness', () => {
    expect(ok(choiceScoreResult(FOUR_AT, answers(1, 0, 0, 0))).points).toBe(0);
  });

  it('is incomplete, and names the missing items, until every item is answered; nothing is defaulted', () => {
    const r = choiceScoreResult(FOUR_AT, { [FOUR_AT.items[0].id]: 0, [FOUR_AT.items[1].id]: 0 });
    expect(r.kind).toBe('incomplete');
    if (r.kind === 'incomplete') expect(r.missing).toEqual(['Attention', 'Acute change or fluctuating course']);
    expect(choiceScoreResult(FOUR_AT, {}).kind).toBe('incomplete');
  });

  it('treats an out-of-range option index as unanswered', () => {
    expect(choiceScoreResult(FOUR_AT, answers(0, 0, 0, 5)).kind).toBe('incomplete');
    expect(choiceScoreResult(FOUR_AT, answers(0, 0, 0, -1)).kind).toBe('incomplete');
  });
});

describe('PACU discharge scores', () => {
  const pick = (s: typeof PADSS, ...idx: number[]): Record<string, number> => Object.fromEntries(s.items.slice(0, idx.length).map((it, i) => [it.id, idx[i]]));

  it('Aldrete: 10 and 9 meet the discharge mark, 8 does not', () => {
    const r10 = choiceScoreResult(MODIFIED_ALDRETE, pick(MODIFIED_ALDRETE, 0, 0, 0, 0, 0));
    const r9 = choiceScoreResult(MODIFIED_ALDRETE, pick(MODIFIED_ALDRETE, 0, 0, 0, 0, 1));
    const r8 = choiceScoreResult(MODIFIED_ALDRETE, pick(MODIFIED_ALDRETE, 1, 0, 0, 0, 1));
    expect(r10.kind === 'ok' && [r10.points, r10.max, r10.band.min]).toEqual([10, 10, 9]);
    expect(r9.kind === 'ok' && [r9.points, r9.band.min]).toEqual([9, 9]);
    expect(r8.kind === 'ok' && [r8.points, r8.band.min]).toEqual([8, 0]);
  });

  it('PADSS: pain not acceptable takes an otherwise perfect score to 8, below the mark', () => {
    const r = choiceScoreResult(PADSS, pick(PADSS, 0, 0, 0, 1, 0));
    expect(r.kind === 'ok' && [r.points, r.max, r.band.min]).toEqual([8, 10, 0]);
  });

  it('PADSS: stays incomplete until every item is answered', () => {
    expect(choiceScoreResult(PADSS, pick(PADSS, 0, 0, 0, 0)).kind).toBe('incomplete');
  });
});
