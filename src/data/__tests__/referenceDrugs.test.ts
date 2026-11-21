import { describe, expect, it } from 'vitest';
import { REFERENCE_DRUGS } from '../referenceDrugs';
import { MEDICATIONS } from '../medications';
import { SOURCE_BY_ID } from '../sources';
import type { ReferenceInfusionLine } from '../types';

const medIds = new Set(MEDICATIONS.map((m) => m.id));

/** Returns the contradicting mass unit quoted in the record's own text, or null when consistent. */
const quotedMassContradiction = (i: Pick<ReferenceInfusionLine, 'rateMin' | 'unit' | 'notes' | 'suggested60kgRate'>): string | null => {
  const unitMass = i.unit.startsWith('mcg') ? 'mcg' : i.unit.startsWith('mg') ? 'mg' : null;
  if (!unitMass) return null;
  const text = `${i.notes ?? ''} ${i.suggested60kgRate ?? ''}`;
  const quoted = new RegExp(`(?:^|[^0-9.])${i.rateMin}(?:\\s*[–-]\\s*[0-9.]+)?\\s*(mcg|mg)\\s*/\\s*(?:kg\\s*/\\s*)?(?:min|h)`);
  const m = text.match(quoted);
  return m && m[1] !== unitMass ? m[1] : null;
};

describe('secondary-sourced reference drugs', () => {
  it('have unique ids that never collide with label-sourced medications', () => {
    const ids = REFERENCE_DRUGS.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(medIds.has(id), id).toBe(false);
  });

  it('cite registered sources', () => {
    // Reference-only figures may cite primary or label sources as well as secondary ones; they are never calculated.
    for (const d of REFERENCE_DRUGS) {
      expect(d.sourceIds.length, d.id).toBeGreaterThan(0);
      for (const s of d.sourceIds) expect(s in SOURCE_BY_ID, `${d.id} -> ${s}`).toBe(true);
    }
  });

  it('supplements point at an existing label-sourced medication and carry no doses', () => {
    for (const d of REFERENCE_DRUGS.filter((x) => x.supplementTo)) {
      expect(medIds.has(d.supplementTo as string), `${d.id} -> ${d.supplementTo}`).toBe(true);
      expect(d.doses, d.id).toEqual([]);
      expect(d.infusions.length > 0 || d.tivaTargets !== undefined, d.id).toBe(true);
    }
  });

  it('have ordered, positive ranges', () => {
    for (const d of REFERENCE_DRUGS) {
      for (const x of d.doses) {
        expect(x.min, d.id).toBeGreaterThan(0);
        if (x.max !== undefined) expect(x.max, d.id).toBeGreaterThanOrEqual(x.min);
      }
      for (const i of d.infusions) {
        expect(i.rateMin, `${d.id} ${i.indication}`).toBeGreaterThan(0);
        if (i.rateMax !== undefined) expect(i.rateMax, `${d.id} ${i.indication}`).toBeGreaterThanOrEqual(i.rateMin);
      }
    }
  });

  it('never prints a mass unit that contradicts the figures quoted in the same infusion record', () => {
    // Catches the 1000x errors in the raw notebook data (e.g. "30-60 mg/min" for 30-60 mcg/min).
    for (const d of REFERENCE_DRUGS) {
      for (const i of d.infusions) expect(quotedMassContradiction(i), `${d.id}: ${i.indication}`).toBeNull();
    }
  });

  it('the unit check catches the original raw notebook errors', () => {
    expect(quotedMassContradiction({ rateMin: 30, unit: 'mg/min', suggested60kgRate: '0–30 mL/h (30–60 mcg/min)' })).toBe('mcg');
    expect(quotedMassContradiction({ rateMin: 100, unit: 'mg/h', notes: '100 mcg/h fixed continuous infusion' })).toBe('mcg');
    expect(quotedMassContradiction({ rateMin: 30, unit: 'mcg/min', suggested60kgRate: '0–30 mL/h (30–60 mcg/min)' })).toBeNull();
  });

  it('keeps the corrected phenylephrine and fentanyl infusion units', () => {
    const find = (id: string, indication: string) => REFERENCE_DRUGS.find((d) => d.id === id)?.infusions.find((i) => i.indication.startsWith(indication));
    expect(find('phenylephrine-supplement', 'Adult Peripheral')?.unit).toBe('mcg/min');
    expect(find('fentanyl-supplement', 'ICU Sedation')?.unit).toBe('mcg/h');
  });

  it('flags the records whose printed figures disagree', () => {
    expect(REFERENCE_DRUGS.find((d) => d.id === 'calcium-gluconate')?.discrepancy).toBeTruthy();
    const phenyl = REFERENCE_DRUGS.find((d) => d.id === 'phenylephrine-supplement');
    expect(phenyl?.infusions.some((i) => i.discrepancy)).toBe(true);
  });

  it('includes verified aspiration prophylaxis and preoperative multimodal medications', () => {
    const aspIds = ['sodium-citrate', 'famotidine', 'pantoprazole', 'acetaminophen-iv', 'gabapentin'];
    for (const id of aspIds) {
      const drug = REFERENCE_DRUGS.find((d) => d.id === id);
      expect(drug, `drug ${id} exists`).toBeDefined();
      expect(drug!.doses.length, `drug ${id} has doses`).toBeGreaterThan(0);
      expect(drug!.sourceIds.length, `drug ${id} has sourceIds`).toBeGreaterThan(0);
      for (const s of drug!.sourceIds) expect(s in SOURCE_BY_ID, `${id} -> ${s}`).toBe(true);
    }
  });
});
