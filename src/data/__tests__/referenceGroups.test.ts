import { describe, expect, it } from 'vitest';
import { CATEGORY_ORDER } from '../medications';
import { REFERENCE_DRUGS } from '../referenceDrugs';
import {
  OTHER_REFERENCE_FILTER,
  REFERENCE_GROUP_FILTER,
  REFERENCE_GROUP_ORDER,
  referenceGroupsForFilter,
  type DosingFilter,
} from '../referenceGroups';

// The dosing view offers one chip per category plus the reference-only chip, plus "All".
const CHIPS: DosingFilter[] = [...CATEGORY_ORDER, OTHER_REFERENCE_FILTER];

describe('reference drug filters', () => {
  it('"All" shows every group, in a stable order', () => {
    expect(referenceGroupsForFilter('all')).toEqual(REFERENCE_GROUP_ORDER);
    expect(REFERENCE_GROUP_ORDER.length).toBe(Object.keys(REFERENCE_GROUP_FILTER).length);
  });

  it('every mapped filter is a real chip, so no group points at a filter that does not exist', () => {
    for (const [group, filter] of Object.entries(REFERENCE_GROUP_FILTER)) {
      expect(CHIPS, `${group} -> ${filter}`).toContain(filter);
    }
  });

  it('every group is reachable from exactly one chip', () => {
    for (const group of REFERENCE_GROUP_ORDER) {
      const chips = CHIPS.filter((c) => referenceGroupsForFilter(c).includes(group));
      expect(chips, group).toHaveLength(1);
    }
  });

  it('every reference drug can be found under some chip (nothing is visible only under "All")', () => {
    for (const d of REFERENCE_DRUGS) {
      const visible = CHIPS.some((c) => referenceGroupsForFilter(c).includes(d.group));
      expect(visible, `${d.id} (${d.group})`).toBe(true);
    }
  });

  it('electrolytes and emergency drugs live under the reference-only chip', () => {
    const groups = referenceGroupsForFilter(OTHER_REFERENCE_FILTER);
    expect(groups).toContain('electrolyte-metabolic');
    expect(groups).toContain('emergency');
    const ids = REFERENCE_DRUGS.filter((d) => groups.includes(d.group)).map((d) => d.id);
    expect(ids).toEqual(expect.arrayContaining(['magnesium-sulfate', 'calcium-gluconate', 'carboprost']));
  });

  it('a category with no reference drugs simply shows none', () => {
    expect(referenceGroupsForFilter('reversal')).toEqual([]);
  });
});
