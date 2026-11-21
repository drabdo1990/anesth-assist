// Ventilation calculations. Tidal volume is always derived from PBW, never actual body weight.

export const calculateTidalVolumeMl = (pbwKg: number, mlPerKgPbw: number): number => pbwKg * mlPerKgPbw;

export const calculateMinuteVentilationLMin = (tidalVolumeMl: number, respiratoryRate: number): number =>
  (tidalVolumeMl * respiratoryRate) / 1000;

/** Inspiratory time (s) for a respiratory rate and I:E ratio, e.g. rr 12, I:E 1:2 -> 1.67 s. */
export const inspiratoryTimeSeconds = (respiratoryRate: number, i: number, e: number): number =>
  ((60 / respiratoryRate) * i) / (i + e);

export const expiratoryTimeSeconds = (respiratoryRate: number, i: number, e: number): number =>
  ((60 / respiratoryRate) * e) / (i + e);

export const calculateDrivingPressure = (plateauCmH2O: number, peepCmH2O: number): number =>
  plateauCmH2O - peepCmH2O;

export type Severity = 'ok' | 'amber' | 'red';

export interface TidalVolumeRange {
  min: number;
  max: number;
}

/** Severity of a mL/kg PBW choice vs a scenario's accepted range: amber at an edge, red outside. */
export const tidalVolumeSeverity = (mlPerKgPbw: number, range: TidalVolumeRange): Severity => {
  if (mlPerKgPbw > range.max || mlPerKgPbw < range.min) return 'red';
  if (mlPerKgPbw === range.max || mlPerKgPbw === range.min) return 'amber';
  return 'ok';
};

export const PLATEAU_LIMIT_CMH2O = 30;

/** Amber within `amberMargin` of the limit, red above it. */
export const plateauSeverity = (
  plateau: number,
  limit: number = PLATEAU_LIMIT_CMH2O,
  amberMargin = 2,
): Severity => (plateau > limit ? 'red' : plateau >= limit - amberMargin ? 'amber' : 'ok');

export interface ArdsPlateauAdvice {
  suggestReduceTowardMlPerKg?: number;
}

/** If plateau stays above the limit at 6 mL/kg PBW (or lower, but above 4), prompt consideration of 4 mL/kg. */
export const ardsPlateauAdvice = (
  plateau: number,
  currentMlPerKgPbw: number,
  limit: number = PLATEAU_LIMIT_CMH2O,
): ArdsPlateauAdvice =>
  plateau > limit && currentMlPerKgPbw <= 6 && currentMlPerKgPbw > 4
    ? { suggestReduceTowardMlPerKg: 4 }
    : {};
