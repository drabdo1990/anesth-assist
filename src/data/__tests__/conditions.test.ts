import { describe, expect, it } from 'vitest';
import { CONDITIONS, PLANNED_CONDITION_IDS, STOELTING_CHAPTERS } from '../conditions';
import { SOURCE_BY_ID } from '../sources';

describe('conditions', () => {
  it('have unique ids and unique names', () => {
    expect(new Set(CONDITIONS.map((c) => c.id)).size).toBe(CONDITIONS.length);
    expect(new Set(CONDITIONS.map((c) => c.name.toLowerCase())).size).toBe(CONDITIONS.length);
  });

  it('is the full first list, so an entry cannot be dropped by accident', () => {
    expect(CONDITIONS.length).toBe(110);
  });

  it('each point to a Stoelting 8e chapter that exists', () => {
    for (const c of CONDITIONS) expect(STOELTING_CHAPTERS[c.chapter], c.id).toBeTruthy();
  });

  it('each cite Stoelting 8e, and every cited source is registered', () => {
    for (const c of CONDITIONS) {
      expect(c.sourceIds, c.id).toContain('stoelting-8e');
      for (const id of c.sourceIds) expect(SOURCE_BY_ID[id], `${c.id} -> ${id}`).toBeDefined();
    }
  });

  it('carry a plan only for the planned ids, so an index entry never shows invented text', () => {
    expect(CONDITIONS.filter((c) => c.plan).map((c) => c.id).sort()).toEqual([...PLANNED_CONDITION_IDS].sort());
    for (const c of CONDITIONS.filter((x) => !x.plan)) expect(Object.keys(c).sort(), c.id).toEqual(['aliases', 'chapter', 'id', 'name', 'sourceIds']);
  });

  it('has lower-case aliases with no duplicates within a record', () => {
    for (const c of CONDITIONS) {
      for (const a of c.aliases) expect(a, c.id).toBe(a.toLowerCase());
      expect(new Set(c.aliases).size, c.id).toBe(c.aliases.length);
    }
  });
});

const plan = (id: string) => {
  const p = CONDITIONS.find((c) => c.id === id)?.plan;
  if (!p) throw new Error(`no plan for ${id}`);
  return p;
};
const text = (lines: string[]) => lines.join(' ');

describe('condition plans', () => {
  it('covers the core 6 rare diseases and all planned conditions', () => {
    const core6 = ['acute-porphyria', 'carcinoid-syndrome', 'mh-susceptibility', 'myasthenia-gravis', 'myotonic-dystrophy', 'pheochromocytoma'];
    for (const id of core6) {
      expect(PLANNED_CONDITION_IDS).toContain(id);
    }
  });

  it('have every section filled and no empty line', () => {
    for (const id of PLANNED_CONDITION_IDS) {
      const p = plan(id);
      for (const section of [p.preop, p.intraop, p.avoid, p.postop]) {
        expect(section.length, id).toBeGreaterThan(0);
        for (const l of section) expect(l.trim().length, id).toBeGreaterThan(10);
      }
    }
  });

  it('keep the safety-critical statements', () => {
    expect(text(plan('mh-susceptibility').avoid)).toMatch(/volatile/);
    expect(text(plan('mh-susceptibility').avoid)).toMatch(/Succinylcholine/);
    expect(text(plan('acute-porphyria').avoid)).toMatch(/etomidate/);
    expect(text(plan('acute-porphyria').avoid)).toMatch(/ketamine/);
    expect(text(plan('acute-porphyria').avoid)).toMatch(/Barbiturates/);
    expect(text(plan('myotonic-dystrophy').avoid)).toMatch(/Succinylcholine/);
    expect(text(plan('pheochromocytoma').avoid)).toMatch(/beta blocker before alpha blockade/);
    expect(text(plan('carcinoid-syndrome').preop)).toMatch(/octreotide 24 to 48 hours before surgery/);
    expect(text(plan('myasthenia-gravis').intraop)).toMatch(/one-half to two-thirds/);
  });

  it('send MH to the SOS panel instead of retyping dantrolene doses', () => {
    expect(CONDITIONS.find((c) => c.id === 'mh-susceptibility')?.crisis).toBe('mh');
    for (const id of PLANNED_CONDITION_IDS) expect(JSON.stringify(plan(id)), id).not.toMatch(/mg\/kg/);
  });
});
