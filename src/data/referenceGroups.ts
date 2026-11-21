// Which dosing-view filter shows which group of secondary-sourced reference drugs.
// The Record below is exhaustive on purpose: adding a ReferenceDrugGroup fails the build until it is mapped, so a
// group can never be silently unreachable. Groups with no matching drug category go under their own chip.

import type { MedicationCategory, ReferenceDrugGroup } from './types';

export const OTHER_REFERENCE_FILTER = 'other-reference' as const;

/** Everything the dosing view can filter by. */
export type DosingFilter = MedicationCategory | 'all' | typeof OTHER_REFERENCE_FILTER;

export const OTHER_REFERENCE_LABEL = 'Electrolytes & emergency (reference)';

export const REFERENCE_GROUP_FILTER: Record<ReferenceDrugGroup, MedicationCategory | typeof OTHER_REFERENCE_FILTER> = {
  induction: 'induction',
  premedication: 'preinduction',
  opioid: 'opioids',
  nmba: 'nmba',
  vasoactive: 'vasoactive',
  antiemetic: 'postoperative',
  'analgesic-adjunct': 'local',
  'electrolyte-metabolic': OTHER_REFERENCE_FILTER,
  emergency: OTHER_REFERENCE_FILTER,
};

/** Display order of the groups. */
export const REFERENCE_GROUP_ORDER = Object.keys(REFERENCE_GROUP_FILTER) as ReferenceDrugGroup[];

export const referenceGroupsForFilter = (filter: DosingFilter): ReferenceDrugGroup[] =>
  filter === 'all' ? REFERENCE_GROUP_ORDER : REFERENCE_GROUP_ORDER.filter((g) => REFERENCE_GROUP_FILTER[g] === filter);
