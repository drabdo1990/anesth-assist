import type { PeriopDrug, PeriopTiming } from '../../data/periopMeds';

/** 'always': no CrCl condition, shown to everyone. 'unknown': conditional, but no CrCl yet, so the line stays visible. */
export type TimingMatch = 'yes' | 'no' | 'unknown' | 'always';

export interface MatchedTiming {
  timing: PeriopTiming;
  match: TimingMatch;
}

/**
 * Marks which label timing fits the patient's creatinine clearance (mL/min, unrounded).
 * Nothing is ever removed: without a CrCl every conditional line stays visible, so the longer interval is never hidden.
 */
export const matchTimings = (drug: PeriopDrug, crclMlPerMin: number | null): MatchedTiming[] =>
  drug.timings.map((timing) => {
    if (timing.crclMin === undefined && timing.crclBelow === undefined) return { timing, match: 'always' };
    if (crclMlPerMin === null) return { timing, match: 'unknown' };
    const fits =
      (timing.crclMin === undefined || crclMlPerMin >= timing.crclMin) &&
      (timing.crclBelow === undefined || crclMlPerMin < timing.crclBelow);
    return { timing, match: fits ? 'yes' : 'no' };
  });
