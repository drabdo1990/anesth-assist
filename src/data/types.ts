// Data models for the versioned clinical reference layer (spec §12, extended).
// Every clinical record carries sourceIds that must resolve in sources.ts (enforced by tests).

export type WeightScalar = 'TBW' | 'IBW' | 'LBW' | 'ABW40';

/** Where the weight scalar choice comes from. */
export type ScalarBasis = 'label' | 'literature' | 'unspecified';

export type SourceVerification = 'primary' | 'label' | 'secondary';

export interface ClinicalSource {
  id: string;
  /** Short badge text, e.g. "ASRA LAST", "Product label". */
  tag: string;
  name: string;
  publisher: string;
  year: string;
  version?: string;
  url?: string;
  tier: 1 | 2 | 3 | 4;
  scope: string[];
  /** How the content in this build was checked. */
  verification: SourceVerification;
  /** Plain-language note on what could and could not be accessed. */
  accessNote?: string;
}

export type DoseUnit = 'mg/kg' | 'mcg/kg' | 'mg' | 'mcg' | 'mcg/kg/min' | 'mcg/min';

export interface AbsoluteMax {
  value: number;
  unit: 'mg' | 'mcg' | 'mL' | 'mcg/min';
  /** e.g. "cumulative" when the ceiling is not per dose. */
  scope?: string;
}

export type TargetPopulation = 'adult' | 'pediatric' | 'both';

export interface AgeBracket {
  minYears?: number;
  maxYears?: number;
  label: string;
}

export interface MedicationDose {
  id: string;
  indication: string;
  min?: number;
  max?: number;
  default?: number;
  unit: DoseUnit;
  /** Strength this dose was written for, when one strength is the safe default. */
  preferredConcentrationMgPerMl?: number;
  /** Ignored for fixed (mg, mcg, mcg/min) units. */
  scalar?: WeightScalar;
  scalarBasis?: ScalarBasis;
  absoluteMax?: AbsoluteMax;
  /** Applies only inside this actual-body-weight band (e.g. cefazolin 3 g at >=120 kg). */
  weightBandKg?: { min?: number; max?: number; maxExclusive?: number };
  notes?: string[];
  sourceIds: string[];
  /** Target population for this dose line. Defaults to 'adult' if omitted. */
  population?: TargetPopulation;
  /** Age bracket specification for auto-matching patient age. */
  ageBracket?: AgeBracket;
  /** Minimum dose floor to avoid subtherapeutic adverse effects (e.g. Atropine 0.1 mg). */
  minimumFloor?: { value: number; unit: 'mg' | 'mcg' };
  /** Explicitly flags that dose must never exceed adult single-dose ceiling. */
  cappedAtAdultMax?: boolean;
}

export interface MedicationConcentration {
  label: string;
  mgPerMl: number;
  sourceId: string;
  /** Needs dilution before IV use (e.g. ketamine 100 mg/mL). */
  requiresDilution?: boolean;
  /** When true, preselected as default concentration in pediatric mode. */
  isPediatricDefault?: boolean;
  /** Concise step-by-step preparation instruction for nursing/anesthesia staff. */
  pediatricInstructions?: string;
}

export type MedicationCategory =
  | 'preinduction'
  | 'induction'
  | 'opioids'
  | 'nmba'
  | 'reversal'
  | 'vasoactive'
  | 'postoperative'
  | 'local';

export interface Medication {
  id: string;
  name: string;
  class: string;
  category: MedicationCategory;
  doses: MedicationDose[];
  concentrations: MedicationConcentration[];
  preparation?: string[];
  cautions?: string[];
  /** Companion drug dosed as a ratio of this drug's calculated mass. */
  companion?: { name: string; ratioMgPerMg: number; concentrationMgPerMl: number; sourceId: string };
  sourceIds: string[];
}

export interface CategoryPlaceholder {
  category: MedicationCategory;
  /** Topic with no sourced content in this build, e.g. "Aspiration prophylaxis". */
  topic: string;
}

export interface LocalAnestheticLimitRecord {
  /** Primary limit used in calculations. */
  mgPerKg?: number;
  absoluteMaxMg?: number;
  sourceIds: string[];
  note?: string;
}

export interface LocalAnestheticAlternate {
  label: string;
  absoluteMaxMg?: number;
  mgPerKg?: number;
  sourceId: string;
}

export interface LocalAnesthetic {
  id: string;
  name: string;
  plain?: LocalAnestheticLimitRecord;
  withEpinephrine?: LocalAnestheticLimitRecord;
  /** Conflicting or additional published figures, shown beside the default. */
  alternates?: LocalAnestheticAlternate[];
  concentrationsPercent: number[];
  cautions?: string[];
  sourceIds: string[];
  /** Pediatric safe plain maximum dose limit in mg/kg. */
  pedsPlainMaxMgPerKg?: number;
}

export interface AirwayDeviceRule {
  id: string;
  device: string;
  population: 'adult' | 'pediatric' | 'neonate';
  basis: 'age' | 'weight' | 'height' | 'sex' | 'clinical';
  recommendedSize?: string;
  sizeRange?: string;
  depth?: string;
  cautions?: string[];
  sourceIds: string[];
}

export interface VentilationScenario {
  id: string;
  name: string;
  tidalVolumeMlPerKgPbw?: { target: number; min: number; max: number; targetIsAssumed?: boolean };
  respiratoryRate?: { min: number; max: number; default: number };
  peep?: { min: number; max: number; default: number };
  plateauPressureLimit?: number;
  cautions?: string[];
  /** Topics with no sourced value for this scenario. */
  unsourced?: string[];
  sourceIds: string[];
}

export interface ChecklistItemRecord {
  id: string;
  text: string;
  sourceIds: string[];
}

export type ChecklistGroup = 'Pre-op' | 'Machine' | 'Airway' | 'Ventilation' | 'Regional' | 'Intra/post-op' | 'Crises';

export interface ChecklistRecord {
  id: string;
  title: string;
  /** Lists-tab group the checklist is filed under. */
  group: ChecklistGroup;
  note?: string;
  items: ChecklistItemRecord[];
}

/** Reference-only neuraxial regimen for a 70 kg adult. Never scaled by patient weight. */
export interface NeuraxialRegimen {
  id: string;
  agent: string;
  route: 'spinal' | 'epidural';
  /** Display text, e.g. "1.5% or 5.0%". */
  concLabel: string;
  /** Numeric concentration bounds in %, used for arithmetic checks. */
  concPercent: [number, number];
  volumeMl: [number, number];
  totalDoseMg: [number, number];
  baricity?: 'Hyperbaric' | 'Isobaric' | 'Hypobaric';
  glucosePercent?: number;
  onsetMin?: [number, number];
  durationMin?: [number, number];
  /** Set when the transcribed total dose cannot be reached with the stated concentration and volume. */
  discrepancy?: string;
  sourceIds: string[];
}

export type ReferenceDrugGroup =
  | 'induction'
  | 'premedication'
  | 'opioid'
  | 'nmba'
  | 'vasoactive'
  | 'antiemetic'
  | 'analgesic-adjunct'
  | 'electrolyte-metabolic'
  | 'emergency';

/** Infusion units. Mass units must match the figures printed in the same record (checked by tests). */
export type ReferenceInfusionUnit =
  | 'mcg/kg/min'
  | 'mcg/kg/h'
  | 'mg/kg/h'
  | 'mg/min'
  | 'mcg/min'
  | 'mcg/h'
  | 'mg/h'
  | 'mL/kg/h'
  | 'mmol/h';

export interface ReferenceDoseLine {
  population: 'adult' | 'pediatric';
  route?: string;
  min: number;
  max?: number;
  /** Printed unit, e.g. "mg/kg", "mg", "mL/kg". */
  unit: string;
  /** Weight scalar named by the source, shown as text. Never applied by the app. */
  scalar?: string;
  maxAbsolute?: { value: number; unit: string };
  note?: string;
}

export interface ReferenceInfusionLine {
  indication: string;
  rateMin: number;
  rateMax?: number;
  unit: ReferenceInfusionUnit;
  loadingDose?: string;
  standardDilution?: string;
  suggested60kgRate?: string;
  notes?: string;
  /** Set when a printed figure in this record disagrees with another figure in the same record. */
  discrepancy?: string;
}

/**
 * Secondary-sourced drug reference. Shown as printed and never used to calculate a dose, volume or rate.
 * `supplementTo` links an entry to a label-sourced medication that already exists; that medication is not changed.
 */
export interface ReferenceDrug {
  id: string;
  name: string;
  group: ReferenceDrugGroup;
  supplementTo?: string;
  scalar?: string;
  concentrationsMgPerMl?: number[];
  doses: ReferenceDoseLine[];
  infusions: ReferenceInfusionLine[];
  tivaTargets?: Record<string, string>;
  onsetSeconds?: [number, number];
  durationMinutes?: [number, number];
  cautions?: string[];
  sideEffects?: string[];
  /** Set when printed figures in this record disagree with each other. */
  discrepancy?: string;
  sourceIds: string[];
}

export const NO_SOURCE_VALUE = 'No high-quality source value specified';
