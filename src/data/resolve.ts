// Guideline vs local-protocol resolution for upper limits (maximum doses).
// Rule (spec §2, Tier 4): never silently override a guideline safety limit with local data.

import { LOCAL_OVERRIDES, type LocalOverrideEntry } from './localOverrides';

export type GuidelineSet = 'international' | 'local';

export type LimitOrigin =
  | 'guideline'
  | 'local-more-restrictive'
  | 'local-selected'
  | 'guideline-conflict-default';

export interface ResolvedLimit {
  value: number;
  origin: LimitOrigin;
  guidelineValue: number;
  localValue?: number;
  /** True when the local value is LESS restrictive than the guideline. */
  conflict: boolean;
  /** Badge text for the value actually used. */
  tag: 'guideline' | 'Local protocol';
}

export const resolveUpperLimit = (
  guidelineValue: number,
  localValue: number | undefined,
  active: GuidelineSet,
): ResolvedLimit => {
  if (localValue === undefined || localValue === guidelineValue) {
    return { value: guidelineValue, origin: 'guideline', guidelineValue, localValue, conflict: false, tag: 'guideline' };
  }
  if (localValue < guidelineValue) {
    return {
      value: localValue,
      origin: 'local-more-restrictive',
      guidelineValue,
      localValue,
      conflict: false,
      tag: 'Local protocol',
    };
  }
  // Local is less restrictive than the guideline: conflict. Default to the guideline.
  return active === 'local'
    ? { value: localValue, origin: 'local-selected', guidelineValue, localValue, conflict: true, tag: 'Local protocol' }
    : {
        value: guidelineValue,
        origin: 'guideline-conflict-default',
        guidelineValue,
        localValue,
        conflict: true,
        tag: 'guideline',
      };
};

export const resolveWithOverrides = (
  key: string,
  guidelineValue: number,
  active: GuidelineSet,
  overrides: Record<string, LocalOverrideEntry> = LOCAL_OVERRIDES,
): ResolvedLimit => resolveUpperLimit(guidelineValue, overrides[key]?.value, active);
