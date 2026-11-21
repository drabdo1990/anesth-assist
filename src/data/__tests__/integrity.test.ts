import { describe, expect, it } from 'vitest';
import { DATA_VERSION, SOURCES, SOURCE_BY_ID } from '../sources';
import { CATEGORY_ORDER, CATEGORY_PLACEHOLDERS, LOCAL_ANESTHETICS, MEDICATIONS } from '../medications';
import { AIRWAY_PRINCIPLES, AIRWAY_RULES, LMA_BANDS, PEDS_ETT_FORMULAS } from '../airwayDevices';
import { VENTILATION_SCENARIOS, VENT_ALARMS, VENT_MODES, VENT_TROUBLESHOOTING } from '../ventilation';
import { CHECKLISTS } from '../checklists';
import { CICO_PLANS, LAST_STEPS, MH_STEPS } from '../emergencies';
import { LOCAL_OVERRIDES } from '../localOverrides';
import { resolveUpperLimit, resolveWithOverrides } from '../resolve';
import { SOURCES_WITHOUT_DERIVED_VALUES, derivedValuesBySource } from '../derived';

const known = (id: string): boolean => id in SOURCE_BY_ID;

describe('source registry', () => {
  it('has unique ids and required fields', () => {
    const ids = SOURCES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const s of SOURCES) {
      expect(s.tag.length).toBeGreaterThan(0);
      expect(s.name.length).toBeGreaterThan(0);
      expect(s.year.length).toBeGreaterThan(0);
      expect(s.scope.length).toBeGreaterThan(0);
      expect([1, 2, 3, 4]).toContain(s.tier);
    }
  });

  it('every label and guideline source has a url, except where no public page exists', () => {
    const noUrl = SOURCES.filter((s) => !s.url).map((s) => s.id);
    expect(noUrl.sort()).toEqual([
      'aagbi-2012',
      'aln-2025',
      'app-generic',
      'asa-airway-2022',
      'clinical-cases-anesth',
      'dunn-2017',
      'fda-1993',
      'local-protocol',
      'miller-6e',
      'oxford-handbook',
      'project-notebook',
      'samba-ponv-2020',
      'stoelting-8e',
    ]);
  });

  it('declares a data version', () => {
    expect(DATA_VERSION).toMatch(/^\d{4}\.\d{2}\.\d{2}/);
  });

  it('ships the local protocol tier empty', () => {
    expect(Object.keys(LOCAL_OVERRIDES)).toEqual([]);
  });
});

describe('every clinical value resolves to a named source (acceptance criterion 15)', () => {
  it('medications, doses and concentrations', () => {
    for (const m of MEDICATIONS) {
      expect(m.sourceIds.length, m.id).toBeGreaterThan(0);
      for (const id of m.sourceIds) expect(known(id), `${m.id} -> ${id}`).toBe(true);
      expect(m.doses.length, m.id).toBeGreaterThan(0);
      expect(m.concentrations.length, m.id).toBeGreaterThan(0);
      for (const d of m.doses) {
        expect(d.sourceIds.length, d.id).toBeGreaterThan(0);
        for (const id of d.sourceIds) expect(known(id), `${d.id} -> ${id}`).toBe(true);
        if (d.preferredConcentrationMgPerMl !== undefined) {
          expect(m.concentrations.some((c) => c.mgPerMl === d.preferredConcentrationMgPerMl), d.id).toBe(true);
        }
        if (d.absoluteMax?.scope === 'cumulative') expect(d.absoluteMax.unit, d.id).toBe('mg');
      }
      for (const c of m.concentrations) expect(known(c.sourceId), `${m.id} conc ${c.label}`).toBe(true);
      if (m.companion) expect(known(m.companion.sourceId)).toBe(true);
    }
  });

  it('local anesthetics', () => {
    for (const la of LOCAL_ANESTHETICS) {
      expect(la.sourceIds.length, la.id).toBeGreaterThan(0);
      for (const id of la.sourceIds) expect(known(id), `${la.id} -> ${id}`).toBe(true);
      for (const rec of [la.plain, la.withEpinephrine]) {
        if (!rec) continue;
        expect(rec.sourceIds.length).toBeGreaterThan(0);
        for (const id of rec.sourceIds) expect(known(id)).toBe(true);
        expect(rec.mgPerKg !== undefined || rec.absoluteMaxMg !== undefined, `${la.id} has a limit`).toBe(true);
      }
      for (const a of la.alternates ?? []) expect(known(a.sourceId)).toBe(true);
    }
  });

  it('airway rules and tables', () => {
    for (const r of AIRWAY_RULES) {
      expect(r.sourceIds.length, r.id).toBeGreaterThan(0);
      for (const id of r.sourceIds) expect(known(id), `${r.id} -> ${id}`).toBe(true);
    }
    for (const f of PEDS_ETT_FORMULAS) expect(known(f.sourceId)).toBe(true);
    for (const p of AIRWAY_PRINCIPLES) for (const id of p.sourceIds) expect(known(id)).toBe(true);
    expect(LMA_BANDS.length).toBeGreaterThan(0);
  });

  it('ventilation scenarios either cite a source or declare themselves unsourced', () => {
    for (const s of VENTILATION_SCENARIOS) {
      for (const id of s.sourceIds) expect(known(id)).toBe(true);
      if (s.tidalVolumeMlPerKgPbw) expect(s.sourceIds.length, `${s.id} has a tidal volume`).toBeGreaterThan(0);
      if (s.sourceIds.length === 0) expect(s.unsourced?.length, s.id).toBeGreaterThan(0);
    }
    for (const item of [...VENT_MODES, ...VENT_ALARMS, ...VENT_TROUBLESHOOTING]) {
      for (const id of item.sourceIds) expect(known(id)).toBe(true);
    }
  });

  it('all ventilation scenarios cite verified sources (none are left completely unsourced)', () => {
    for (const s of VENTILATION_SCENARIOS) {
      expect(s.sourceIds.length, `${s.id} cites a verified source`).toBeGreaterThan(0);
    }
  });

  it('checklists and emergency steps', () => {
    for (const c of CHECKLISTS) {
      for (const i of c.items) {
        expect(i.sourceIds.length, i.id).toBeGreaterThan(0);
        for (const id of i.sourceIds) expect(known(id)).toBe(true);
      }
    }
    for (const step of [...LAST_STEPS, ...MH_STEPS, ...CICO_PLANS.flatMap((p) => p.steps)]) {
      expect(step.sourceIds.length, step.id).toBeGreaterThan(0);
      for (const id of step.sourceIds) expect(known(id), `${step.id} -> ${id}`).toBe(true);
    }
  });
});

describe('medication data invariants', () => {
  it('has unique ids', () => {
    const ids = MEDICATIONS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
    const doseIds = MEDICATIONS.flatMap((m) => m.doses.map((d) => d.id));
    expect(new Set(doseIds).size).toBe(doseIds.length);
  });

  it('keeps min <= default <= max and positive concentrations', () => {
    for (const m of MEDICATIONS) {
      for (const c of m.concentrations) expect(c.mgPerMl, `${m.id} ${c.label}`).toBeGreaterThan(0);
      for (const d of m.doses) {
        const lo = d.min ?? d.default;
        const hi = d.max ?? d.default;
        expect(lo, d.id).toBeDefined();
        if (d.default !== undefined && lo !== undefined && hi !== undefined) {
          expect(d.default, d.id).toBeGreaterThanOrEqual(lo);
          expect(d.default, d.id).toBeLessThanOrEqual(hi);
        }
      }
    }
  });

  it('gives every weight-based dose a scalar and a basis', () => {
    for (const m of MEDICATIONS) {
      for (const d of m.doses) {
        if (d.unit === 'mg/kg' || d.unit === 'mcg/kg' || d.unit === 'mcg/kg/min') {
          expect(d.scalar, d.id).toBeDefined();
          expect(d.scalarBasis, d.id).toBeDefined();
        }
      }
    }
  });

  it('uses the label scalar where the label names one', () => {
    const find = (id: string) => MEDICATIONS.flatMap((m) => m.doses).find((d) => d.id === id);
    expect(find('sug-moderate')?.scalar).toBe('TBW');
    expect(find('roc-standard')?.scalar).toBe('TBW');
    expect(find('remi-maint-propofol')?.scalar).toBe('IBW');
  });

  it('covers all eight categories', () => {
    for (const cat of CATEGORY_ORDER) {
      const hasMeds = MEDICATIONS.some((m) => m.category === cat);
      const hasPlaceholder = CATEGORY_PLACEHOLDERS.some((p) => p.category === cat);
      const isLocal = cat === 'local';
      expect(hasMeds || hasPlaceholder || isLocal, cat).toBe(true);
    }
  });

  it('carries the label ceilings the spec calls out', () => {
    const find = (id: string) => MEDICATIONS.flatMap((m) => m.doses).find((d) => d.id === id);
    expect(find('neo-short')?.absoluteMax).toEqual({ value: 5, unit: 'mg' });
    expect(find('ephedrine-bolus')?.absoluteMax).toMatchObject({ value: 50, unit: 'mg' });
    expect(find('phenyl-infusion')?.absoluteMax).toEqual({ value: 200, unit: 'mcg/min' });
  });
});

describe('references view index', () => {
  it('every source has derived values unless explicitly exempt', () => {
    const derived = derivedValuesBySource();
    const empty = SOURCES.filter((s) => (derived[s.id] ?? []).length === 0).map((s) => s.id);
    expect(empty.sort()).toEqual([...SOURCES_WITHOUT_DERIVED_VALUES].sort());
  });

  it('lists the lipid and dantrolene values the emergency screens use', () => {
    const derived = derivedValuesBySource();
    expect(derived['asra-last-2020'].join(' ')).toContain('12 mL/kg');
    expect(derived['label-ryanodex'].join(' ')).toBeDefined();
    expect(derived.mhaus.join(' ')).toContain('2.5 mg/kg');
  });
});

describe('guideline vs local protocol resolution', () => {
  it('uses the guideline value when there is no local value', () => {
    expect(resolveUpperLimit(300, undefined, 'international')).toMatchObject({ value: 300, origin: 'guideline', conflict: false });
  });

  it('labels an identical local value as guideline-consistent', () => {
    expect(resolveUpperLimit(300, 300, 'local')).toMatchObject({ value: 300, origin: 'guideline', tag: 'guideline' });
  });

  it('adopts a more restrictive local value and tags it Local protocol', () => {
    expect(resolveUpperLimit(300, 250, 'international')).toMatchObject({
      value: 250,
      origin: 'local-more-restrictive',
      tag: 'Local protocol',
      conflict: false,
    });
  });

  it('on a less restrictive local value, shows both and defaults to the guideline', () => {
    const r = resolveUpperLimit(300, 400, 'international');
    expect(r).toMatchObject({ value: 300, origin: 'guideline-conflict-default', conflict: true, localValue: 400, guidelineValue: 300 });
  });

  it('uses the less restrictive local value only when the user selects local protocol', () => {
    expect(resolveUpperLimit(300, 400, 'local')).toMatchObject({ value: 400, origin: 'local-selected', conflict: true, tag: 'Local protocol' });
  });

  it('looks up overrides by key', () => {
    expect(resolveWithOverrides('x', 100, 'local', { x: { value: 80 } }).value).toBe(80);
    expect(resolveWithOverrides('y', 100, 'local', { x: { value: 80 } }).value).toBe(100);
  });
});
