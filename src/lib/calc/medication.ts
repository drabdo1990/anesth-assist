// Turns a sourced MedicationDose + a chosen value + patient biometrics into mass, volume/rate and
// maximum-dose status. Pure. All limit checks use unrounded numbers.

import type { AbsoluteMax, DoseUnit, MedicationDose, WeightScalar } from '../../data/types';
import type { Biometrics } from './biometrics';
import {
  calculateDose as calculateRawDose,
  calculateInfusion,
  checkAbsoluteMax,
  checkRateMax,
  type DoseResult,
  type InfusionResult,
  type MaxDoseStatus,
} from './dosing';

export const scalarWeightKg = (b: Biometrics, scalar: WeightScalar): number => {
  switch (scalar) {
    case 'TBW':
      return b.tbw;
    case 'IBW':
      return b.ibw;
    case 'LBW':
      return b.lbw;
    case 'ABW40':
      return b.abw40;
  }
};

/**
 * Index of the saved concentration (matched by strength in mg/mL, never by position).
 * Falls back to the first listed concentration when the saved strength no longer exists.
 */
export const resolveConcentrationIndex = (
  concentrations: ReadonlyArray<{ mgPerMl: number }>,
  savedMgPerMl: number | undefined,
  fallbackMgPerMl: number | undefined = concentrations[0]?.mgPerMl,
): number => {
  const savedIndex = savedMgPerMl === undefined ? -1 : concentrations.findIndex((c) => c.mgPerMl === savedMgPerMl);
  if (savedIndex >= 0) return savedIndex;
  const fallbackIndex = concentrations.findIndex((c) => c.mgPerMl === fallbackMgPerMl);
  return fallbackIndex >= 0 ? fallbackIndex : 0;
};

const PER_KG_UNITS = new Set(['mg/kg', 'mcg/kg', 'mcg/kg/min']);

export const isWeightBased = (dose: MedicationDose): boolean => PER_KG_UNITS.has(dose.unit);

/** Whether a dose applies at this actual body weight (cefazolin bands). */
export const doseAppliesToWeight = (dose: MedicationDose, tbwKg: number): boolean => {
  const band = dose.weightBandKg;
  if (!band) return true;
  if (band.min !== undefined && tbwKg < band.min) return false;
  if (band.max !== undefined && tbwKg > band.max) return false;
  if (band.maxExclusive !== undefined && tbwKg >= band.maxExclusive) return false;
  return true;
};

/** Compare a planned dose plus the already-logged total against a cumulative ceiling. */
export const cumulativeDoseStatus = (givenMg: number, plannedMg: number, limitMg: number): MaxDoseStatus => {
  const total = givenMg + plannedMg;
  if (total > limitMg) return 'exceeds';
  return total === limitMg ? 'at-limit' : 'ok';
};

export interface DoseComputation {
  kind: 'bolus' | 'infusion';
  value: number;
  unit: MedicationDose['unit'];
  scalar?: WeightScalar;
  scalarKg?: number;
  bolus?: DoseResult;
  infusion?: InfusionResult;
  max: MaxDoseStatus;
  /** Percent of the absolute maximum reached (unrounded), if a maximum applies. */
  percentOfMax?: number;
  absoluteMax?: AbsoluteMax;
  companion?: { name: string; massMg: number; volumeMl: number };
}

export interface ComputeOptions {
  /** Overrides the dose's scalar (user switch on the card). */
  scalarOverride?: WeightScalar;
  /** Resolved absolute maximum (after local-protocol resolution); defaults to the dose's own. */
  absoluteMax?: AbsoluteMax;
  companion?: { name: string; ratioMgPerMg: number; concentrationMgPerMl: number };
}

export const computeMedicationDose = (
  dose: MedicationDose,
  value: number,
  concentrationMgPerMl: number,
  biometrics: Biometrics,
  options: ComputeOptions = {},
): DoseComputation => {
  const scalar = isWeightBased(dose)
    ? dose.population === 'pediatric'
      ? 'TBW'
      : (options.scalarOverride ?? dose.scalar ?? 'TBW')
    : undefined;
  const scalarKg = scalar ? scalarWeightKg(biometrics, scalar) : undefined;
  const weight = dose.population === 'pediatric' ? biometrics.tbw : (scalarKg ?? biometrics.tbw);
  const absoluteMax = options.absoluteMax ?? dose.absoluteMax;

  if (dose.unit === 'mcg/kg/min' || dose.unit === 'mcg/min') {
    const infusion = calculateInfusion(value, dose.unit, weight, concentrationMgPerMl);
    const max: MaxDoseStatus =
      absoluteMax?.unit === 'mcg/min' ? checkRateMax(infusion, absoluteMax.value) : 'ok';
    return {
      kind: 'infusion',
      value,
      unit: dose.unit,
      scalar,
      scalarKg,
      infusion,
      max,
      percentOfMax:
        absoluteMax?.unit === 'mcg/min' ? (infusion.mcgPerMin / absoluteMax.value) * 100 : undefined,
      absoluteMax,
    };
  }

  const bolus = calculateRawDose(value, dose.unit, weight, concentrationMgPerMl);
  let max: MaxDoseStatus = 'ok';
  let percentOfMax: number | undefined;
  if (absoluteMax && absoluteMax.unit !== 'mcg/min') {
    max = checkAbsoluteMax(bolus, { value: absoluteMax.value, unit: absoluteMax.unit });
    const actual =
      absoluteMax.unit === 'mL' ? bolus.volumeMl : absoluteMax.unit === 'mcg' ? bolus.massMg * 1000 : bolus.massMg;
    percentOfMax = (actual / absoluteMax.value) * 100;
  }

  const companion = options.companion
    ? (() => {
        const massMg = bolus.massMg * options.companion.ratioMgPerMg;
        return {
          name: options.companion.name,
          massMg,
          volumeMl: massMg / options.companion.concentrationMgPerMl,
        };
      })()
    : undefined;

  return { kind: 'bolus', value, unit: dose.unit, scalar, scalarKg, bolus, max, percentOfMax, absoluteMax, companion };
};

export interface DoseCalculationResult {
  scalar: WeightScalar;
  scalarWeightKg: number;
  calculatedMass: number;
  unit: DoseUnit;
  volumeMl: number | null;
  concentrationMgPerMl: number | null;
  isCapped: boolean;
  cappedMessage?: string;
  isFloorEnforced: boolean;
  floorMessage?: string;
  ageBracketMatched?: boolean;
}

export interface CalculateDoseParams {
  dose: MedicationDose;
  tbwKg: number;
  ibwKg?: number | null;
  lbwKg?: number | null;
  abw40Kg?: number | null;
  selectedScalar?: WeightScalar;
  doseValue?: number;
  concentrationMgPerMl?: number | null;
  patientAgeYears?: number | null;
}

export const calculateDose = (params: CalculateDoseParams): DoseCalculationResult => {
  const { dose, tbwKg, ibwKg, lbwKg, abw40Kg, selectedScalar, doseValue, concentrationMgPerMl, patientAgeYears } =
    params;

  let scalar: WeightScalar;
  let scalarWeightKg: number;

  if (dose.population === 'pediatric') {
    scalar = 'TBW';
    scalarWeightKg = tbwKg;
  } else {
    scalar = selectedScalar ?? dose.scalar ?? 'TBW';
    switch (scalar) {
      case 'TBW':
        scalarWeightKg = tbwKg;
        break;
      case 'IBW':
        scalarWeightKg = ibwKg ?? tbwKg;
        break;
      case 'LBW':
        scalarWeightKg = lbwKg ?? tbwKg;
        break;
      case 'ABW40':
        scalarWeightKg = abw40Kg ?? tbwKg;
        break;
    }
  }

  const doseVal = doseValue ?? dose.default ?? dose.min ?? 0;
  const isMcg = dose.unit === 'mcg' || dose.unit === 'mcg/kg';
  const weightBased = isWeightBased(dose);
  const rawMass = weightBased ? doseVal * scalarWeightKg : doseVal;

  let calculatedMass = rawMass;
  let isCapped = false;
  let cappedMessage: string | undefined;

  if (dose.absoluteMax) {
    const maxValInDoseUnit =
      dose.absoluteMax.unit === 'mg' && isMcg
        ? dose.absoluteMax.value * 1000
        : dose.absoluteMax.unit === 'mcg' && !isMcg
          ? dose.absoluteMax.value / 1000
          : dose.absoluteMax.value;

    if (rawMass > maxValInDoseUnit) {
      calculatedMass = maxValInDoseUnit;
      isCapped = true;
      cappedMessage = `Capped at adult max (${dose.absoluteMax.value} ${dose.absoluteMax.unit})`;
    }
  }

  let isFloorEnforced = false;
  let floorMessage: string | undefined;

  if (dose.minimumFloor) {
    const floorValInDoseUnit =
      dose.minimumFloor.unit === 'mg' && isMcg
        ? dose.minimumFloor.value * 1000
        : dose.minimumFloor.unit === 'mcg' && !isMcg
          ? dose.minimumFloor.value / 1000
          : dose.minimumFloor.value;

    if (calculatedMass < floorValInDoseUnit) {
      calculatedMass = floorValInDoseUnit;
      isFloorEnforced = true;
      floorMessage = `Minimum floor applied (${dose.minimumFloor.value} ${dose.minimumFloor.unit})`;
    }
  }

  let volumeMl: number | null = null;
  if (concentrationMgPerMl !== undefined && concentrationMgPerMl !== null && concentrationMgPerMl > 0) {
    const massMg = isMcg ? calculatedMass / 1000 : calculatedMass;
    volumeMl = massMg / concentrationMgPerMl;
  }

  let ageBracketMatched: boolean | undefined = undefined;
  if (patientAgeYears !== undefined && patientAgeYears !== null && dose.ageBracket) {
    const minOk = dose.ageBracket.minYears === undefined || patientAgeYears >= dose.ageBracket.minYears;
    const maxOk = dose.ageBracket.maxYears === undefined || patientAgeYears < dose.ageBracket.maxYears;
    ageBracketMatched = minOk && maxOk;
  }

  return {
    scalar,
    scalarWeightKg,
    calculatedMass,
    unit: dose.unit,
    volumeMl,
    concentrationMgPerMl: concentrationMgPerMl ?? null,
    isCapped,
    cappedMessage,
    isFloorEnforced,
    floorMessage,
    ageBracketMatched,
  };
};
