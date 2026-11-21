// Tier 4: local protocol / institutional notebook overrides. SHIPS EMPTY.
//
// No local notebook content was provided. To add a local value, add an entry here; it is then
// tagged "Local protocol" and compared with the guideline value by resolve.ts:
//   - local value more restrictive than the guideline -> the local value is used (labelled Local protocol)
//   - local value less restrictive (conflict)         -> both are shown; the guideline value is used
//                                                         unless the user selects "Use local protocol"
//
// Keys:
//   dose-max:<doseId>                       absolute maximum for a dose (in that dose's absoluteMax unit)
//   la:<anestheticId>:<plain|epi>:absoluteMaxMg
//   la:<anestheticId>:<plain|epi>:mgPerKg

export interface LocalOverrideEntry {
  value: number;
  note?: string;
}

export const LOCAL_OVERRIDES: Record<string, LocalOverrideEntry> = {};
