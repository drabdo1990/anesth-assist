import { describe, expect, it } from 'vitest';
import { CHECKLISTS } from '../../data/checklists';
import { listsFor, needsBiometrics } from '../phases';

describe('listsFor', () => {
  it('gives pre-op the fasting list and post-op the emergence list', () => {
    expect(listsFor('preop').map((c) => c.id)).toEqual(['fasting-npo']);
    expect(listsFor('postop').map((c) => c.id)).toEqual(['emergence']);
  });

  it('puts every other checklist in intra-op, so no list is orphaned or shown twice', () => {
    const all = (['preop', 'intraop', 'postop'] as const).flatMap((t) => listsFor(t).map((c) => c.id));
    expect(all.sort()).toEqual(CHECKLISTS.map((c) => c.id).sort());
  });

  it('keeps pre-induction and the crisis lists reachable under intra-op', () => {
    const intraop = listsFor('intraop');
    expect(intraop.some((c) => c.id === 'pre-induction')).toBe(true);
    expect(intraop.some((c) => c.group === 'Crises')).toBe(true);
  });

  it('gives the Plans tab no checklists of its own', () => {
    expect(listsFor('plans')).toEqual([]);
  });

  it('gives the Diseases tab no checklists of its own', () => {
    expect(listsFor('conditions')).toEqual([]);
  });
});

describe('needsBiometrics', () => {
  it.each([
    ['intraop', 'dosing', true],
    ['intraop', 'airway', true],
    ['intraop', 'vent', true],
    ['intraop', 'lists', false],
    ['preop', 'dosing', true],
    ['plans', 'dosing', false],
    ['postop', 'vent', true],
    ['conditions', 'dosing', false],
  ] as const)('%s / %s -> %s', (tab, view, want) => {
    expect(needsBiometrics(tab, view)).toBe(want);
  });
});
