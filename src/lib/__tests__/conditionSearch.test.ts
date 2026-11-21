import { describe, expect, it } from 'vitest';
import { CONDITIONS } from '../../data/conditions';
import { normalize, searchConditions } from '../conditionSearch';

const ids = (q: string) => searchConditions(q).map((c) => c.id);

describe('normalize', () => {
  it('drops case, accents and punctuation', () => {
    expect(normalize('Guillain-Barré  Syndrome')).toBe('guillain barre syndrome');
    expect(normalize('  Trisomy-21 ')).toBe('trisomy 21');
  });
});

describe('searchConditions', () => {
  it('lists every condition for an empty or blank query', () => {
    expect(searchConditions('').length).toBe(CONDITIONS.length);
    expect(searchConditions('   ').length).toBe(CONDITIONS.length);
  });

  it('finds names regardless of accents, case and hyphens', () => {
    expect(ids('guillain barre')).toContain('guillain-barre');
    expect(ids('EHLERS DANLOS')).toContain('ehlers-danlos');
    expect(ids('myasth')).toContain('myasthenia-gravis');
  });

  it('finds conditions by their abbreviations and other names', () => {
    expect(ids('mh')).toContain('mh-susceptibility');
    expect(ids('aip')).toContain('acute-porphyria');
    expect(ids('pheo')).toContain('pheochromocytoma');
    expect(ids('gbs')).toContain('guillain-barre');
    expect(ids('trisomy 21')).toContain('down-syndrome');
  });

  it('puts names that start with the query first', () => {
    expect(ids('myo')[0]).toMatch(/^myo/);
    expect(searchConditions('marfan')[0].id).toBe('marfan');
  });

  it('returns nothing for a query that matches no condition', () => {
    expect(searchConditions('zzqx')).toEqual([]);
  });
});
