// Airway device sizing reference. Only rules traceable to a named source are included.
// Anything else (adult ETT size, adult blades, face masks, double-lumen tubes, bougie sizing)
// is listed in AIRWAY_UNSOURCED and shown as "No high-quality source value specified".

import type { AirwayDeviceRule } from './types';

/** Pediatric ETT validity window in years (the source calculator covers ages 1 to 8). */
export const PEDS_ETT_AGE_RANGE_YEARS = { min: 1, max: 8 } as const;

export interface PedsEttFormula {
  id: string;
  label: string;
  /** ID (mm) = ageYears / 4 + constant */
  constant: number;
  cuffed: boolean;
  sourceId: string;
}

export const PEDS_ETT_FORMULAS: PedsEttFormula[] = [
  { id: 'cuffed-msd', label: 'Cuffed: age/4 + 3.5', constant: 3.5, cuffed: true, sourceId: 'msd-peds-ett' },
  { id: 'cuffed-iowa', label: 'Cuffed (alternate): age/4 + 3', constant: 3, cuffed: true, sourceId: 'iowa-peds-ett' },
  { id: 'uncuffed-msd', label: 'Uncuffed: age/4 + 4', constant: 4, cuffed: false, sourceId: 'msd-peds-ett' },
];

/** Oral ETT depth (cm) = 3 x internal diameter (mm), per the MSD calculator source. */
export const PEDS_ETT_DEPTH_FACTOR = 3;

export interface LmaSizeBand {
  size: string;
  /** Patient weight band in kg: from (exclusive) to (inclusive); null = open ended. */
  fromKg: number | null;
  toKg: number | null;
  maxCuffVolumeMl: number;
}

/** LMA Classic sizes by weight (Teleflex); cuff volumes from the e-safe table (ceiling, not target). */
export const LMA_BANDS: LmaSizeBand[] = [
  { size: '1', fromKg: null, toKg: 5, maxCuffVolumeMl: 4 },
  { size: '1.5', fromKg: 5, toKg: 10, maxCuffVolumeMl: 7 },
  { size: '2', fromKg: 10, toKg: 20, maxCuffVolumeMl: 10 },
  { size: '2.5', fromKg: 20, toKg: 30, maxCuffVolumeMl: 14 },
  { size: '3', fromKg: 30, toKg: 50, maxCuffVolumeMl: 20 },
  { size: '4', fromKg: 50, toKg: 70, maxCuffVolumeMl: 30 },
  { size: '5', fromKg: 70, toKg: 100, maxCuffVolumeMl: 40 },
  { size: '6', fromKg: 100, toKg: null, maxCuffVolumeMl: 50 },
];

export const LMA_MAX_CUFF_PRESSURE_CMH2O = 60;

export interface BladeBand {
  label: string;
  /** Age band in months: from (inclusive) to (exclusive). */
  fromMonths: number;
  toMonths: number;
  blade: string;
}

/** Pediatric laryngoscope blade by age (WikEM). Ages not listed here have no sourced value. */
export const PEDS_BLADES: BladeBand[] = [
  { label: 'Neonate', fromMonths: 0, toMonths: 1, blade: 'Miller 0' },
  { label: 'About 6 months to 1 year', fromMonths: 6, toMonths: 12, blade: 'Miller 1' },
  { label: '2 to 3 years', fromMonths: 24, toMonths: 48, blade: 'Miller 1.5' },
  { label: '4 to 6 years', fromMonths: 48, toMonths: 84, blade: 'Miller 2 or Macintosh 2' },
];

export const AIRWAY_RULES: AirwayDeviceRule[] = [
  {
    id: 'peds-ett-cuffed',
    device: 'Endotracheal tube, cuffed',
    population: 'pediatric',
    basis: 'age',
    sizeRange: 'Age 1 to 8 years',
    depth: 'Oral depth = 3 x internal diameter (cm)',
    cautions: [
      'Two published cuffed formulas differ by 0.5 mm; check the alternate value and have the next size up and down ready.',
      'Confirm tube position with capnography and auscultation; check cuff pressure.',
    ],
    sourceIds: ['msd-peds-ett', 'iowa-peds-ett', 'asa-airway-2022'],
  },
  {
    id: 'peds-ett-uncuffed',
    device: 'Endotracheal tube, uncuffed',
    population: 'pediatric',
    basis: 'age',
    sizeRange: 'Age 1 to 8 years',
    depth: 'Oral depth = 3 x internal diameter (cm)',
    sourceIds: ['msd-peds-ett'],
  },
  {
    id: 'lma-classic',
    device: 'Laryngeal mask airway (LMA Classic)',
    population: 'adult',
    basis: 'weight',
    sizeRange: 'Size 1 to 6 by weight band',
    cautions: [
      'Weight-based sizing is approximate.',
      'Maximum cuff volume is a ceiling, not a target. Maximum cuff pressure 60 cmH2O.',
    ],
    sourceIds: ['teleflex-lma', 'esafe-lma-cuff'],
  },
  {
    id: 'peds-blade',
    device: 'Laryngoscope blade',
    population: 'pediatric',
    basis: 'age',
    cautions: ['Verify against a current pediatric resuscitation reference.'],
    sourceIds: ['wikem-peds-airway'],
  },
  {
    id: 'opa',
    device: 'Oropharyngeal airway',
    population: 'adult',
    basis: 'clinical',
    recommendedSize: 'Landmark: centre of the incisors to the angle of the mandible, measured with the airway on the face',
    sourceIds: ['rch-airway'],
  },
  {
    id: 'npa',
    device: 'Nasopharyngeal airway',
    population: 'adult',
    basis: 'clinical',
    recommendedSize: 'Landmark: tip of the nose to the tragus',
    sourceIds: ['wikem-peds-airway'],
  },
  {
    id: 'adult-ett',
    device: 'Endotracheal tube (adult)',
    population: 'adult',
    basis: 'sex',
    sizeRange: 'Female 7.0–7.5 mm ID, Male 8.0–8.5 mm ID',
    depth: 'Female 20–22 cm, Male 22–24 cm to teeth',
    sourceIds: ['oxford-miller-airway'],
  },
  {
    id: 'dlt',
    device: 'Double-lumen endobronchial tube (DLT)',
    population: 'adult',
    basis: 'height',
    sizeRange: '<165 cm: 35–37 Fr, 165–178 cm: 37–39 Fr, >178 cm: 39–41 Fr',
    sourceIds: ['oxford-miller-airway'],
  },
];

export interface AdultAirwayRule {
  sex: 'male' | 'female';
  idRangeMm: string;
  frenchRange: string;
  oralDepthRangeCm: string;
  blade: string;
  sourceIds: string[];
}

export const ADULT_AIRWAY_RULES: Record<'male' | 'female', AdultAirwayRule> = {
  female: {
    sex: 'female',
    idRangeMm: '7.0–7.5',
    frenchRange: '28–30',
    oralDepthRangeCm: '20–22',
    blade: 'Macintosh 3',
    sourceIds: ['oxford-miller-airway'],
  },
  male: {
    sex: 'male',
    idRangeMm: '8.0–8.5',
    frenchRange: '32–34',
    oralDepthRangeCm: '22–24',
    blade: 'Macintosh 3–4',
    sourceIds: ['oxford-miller-airway'],
  },
};

export interface DltBand {
  minHeightCm: number | null;
  maxHeightCm: number | null;
  sizeFr: string;
  category: string;
  sourceIds: string[];
}

export const DLT_BANDS: DltBand[] = [
  {
    minHeightCm: null,
    maxHeightCm: 165,
    sizeFr: '35–37 Fr',
    category: 'Short (< 165 cm / < 5\'5")',
    sourceIds: ['oxford-miller-airway'],
  },
  {
    minHeightCm: 165,
    maxHeightCm: 178,
    sizeFr: '37–39 Fr',
    category: 'Medium (165–178 cm / 5\'5"–5\'10")',
    sourceIds: ['oxford-miller-airway'],
  },
  {
    minHeightCm: 178,
    maxHeightCm: null,
    sizeFr: '39–41 Fr',
    category: 'Tall (> 178 cm / > 5\'10")',
    sourceIds: ['oxford-miller-airway'],
  },
];

/**
 * APP SAFETY RULE, NOT FROM A SOURCE. The sourced DLT bands above only say "Short: under 165 cm" and name no lower
 * limit. This app refuses to show a double-lumen tube size below the height floor or under the age limit because a
 * size chosen from an adult height table could be unsafe there. `sourceIds` is empty on purpose: the value needs
 * clinician sign-off, and the UI says so wherever it is applied.
 */
export const DLT_SAFETY_FLOOR = {
  minHeightCm: 150,
  minAgeYears: 18,
  sourceIds: [] as string[],
} as const;

export interface AirwayEquipmentItem {
  title: string;
  points: string[];
  sourceIds: string[];
}

/** Adjunct equipment reference from the project notebook (section 3.4, Miller 6e p. 1019, 1209) and manufacturer standards. */
export const AIRWAY_EQUIPMENT_REFERENCE: AirwayEquipmentItem[] = [
  {
    title: 'Facemasks',
    points: [
      'Adult anatomic masks: Small (#3), Medium (#4), Large (#5).',
      'Pediatric: Newborn, Infant and Child sizes, and the flat Rendell-Baker-Soucek mask (minimal dead space).',
    ],
    sourceIds: ['miller-6e', 'facemask-sizing-spec'],
  },
  {
    title: 'Anatomical face-mask sizing by patient size and age (Ambu & Laerdal specifications)',
    points: [
      'Size 00 / 0: Premature / Neonate (< 2.5 kg).',
      'Size 1: Infant (2.5–10 kg).',
      'Size 2: Toddler / Child (10–20 kg).',
      'Size 3: Small Child / Pediatric / Petite Adult (20–40 kg).',
      'Size 4: Medium Adult (40–70 kg).',
      'Size 5: Large Adult (> 70 kg).',
    ],
    sourceIds: ['facemask-sizing-spec'],
  },
  {
    title: 'Guedel oropharyngeal airway sizes',
    points: ['Sizes 000 to 0 (50 mm), 1 (60 mm), 2 (70 mm), 3 (80 mm), 4 (90 mm), 5 (100 mm).'],
    sourceIds: ['miller-6e'],
  },
  {
    title: 'Disaster / portable emergency airway kit (RADAR)',
    points: [
      'LMA size 2 and size 4.',
      'Laryngoscope handle with MAC 3 and Miller 2 blades.',
      'Cuffed ETT 4.0 mm and 7.0 mm.',
      'OPA 60, 70, 80 and 90 mm.',
      'Resuscitator bags: adult and pediatric facemask, and a pediatric AMBU bag (up to 600 mL tidal volume).',
    ],
    sourceIds: ['miller-6e'],
  },
  {
    title: 'Bougie / tracheal tube introducer sizes (manufacturer documents)',
    points: [
      'Cook Frova 14 Fr, 70 cm: for an endotracheal tube with an internal diameter of 6 mm or larger.',
      'Cook Frova 8 Fr, 35 cm: for an endotracheal tube with an internal diameter of 3 mm or larger (FDA 510(k) K171917).',
      'Portex single-use bougie, coude tip, 15 Fr (5.0 mm), 700 mm: recommended tube internal diameter 6.0-11.0 mm.',
    ],
    sourceIds: ['cook-frova-ifu', 'fda-k171917', 'icumed-portex-bougie'],
  },
  {
    title: 'Stylet and bougie internal caliber compatibility (manufacturer specifications)',
    points: [
      'Pediatric stylet (6 Fr): compatible with ETT internal diameter 2.5–3.5 mm.',
      'Small / child stylet (10 Fr): compatible with ETT internal diameter 4.0–5.5 mm.',
      'Adult stylet (14 Fr): compatible with ETT internal diameter 6.0–10.0 mm.',
      'Cook Frova 8 Fr (35 cm): recommended for ETT internal diameter 3.0 mm or larger (FDA K171917).',
      'Cook Frova 14 Fr (70 cm) & Portex 15 Fr (70 cm): recommended for ETT internal diameter 6.0 mm or larger.',
    ],
    sourceIds: ['stylet-bougie-compat', 'cook-frova-ifu', 'fda-k171917', 'icumed-portex-bougie'],
  },
  {
    title: 'Video laryngoscope blade selection (McGrath MAC & GlideScope)',
    points: [
      'McGrath MAC (Medtronic): Size 1 (infant 1.5–10 kg); Size 2 (child 10–25 kg); Size 3 (adult > 25 kg); Size 4 (large adult / deep pharynx); X-Blade (extreme anterior / difficult airway).',
      'GlideScope Spectrum (Verathon): LoPro S1 (1.5–5 kg); LoPro S2 (10–28 kg); LoPro S3 (30–80 kg); LoPro S4 (> 80 kg); Miller 0/1 for neonates/infants.',
    ],
    sourceIds: ['mcgrath-mac-ifu', 'glidescope-ifu'],
  },
  {
    title: 'Adult nasal ETT depth (one study)',
    points: [
      'Depth from the nares to the tube tip, head neutral: men 28.9 +/- 1.3 cm, women 26.6 +/- 1.5 cm (110 Korean adults, ASA 1-2, oral and maxillofacial surgery).',
      'Regression: depth (cm) = 19.856 + 0.267 x (sum of three external distances), R2 = 0.43. The text read does not define the three distances.',
      'Single-center cohort with modest fit: a reference only.',
    ],
    sourceIds: ['nasal-ett-depth-korea-2017'],
  },
  {
    title: 'Pediatric ETT size and depth outside the 1-8 year formulas (Polish consensus 2025)',
    points: [
      'Under 1 kg: uncuffed 2.0-2.5 mm, 7 cm from the mouth. 1-2 kg: uncuffed 2.5-3.0 mm, 8 cm. 2-3 kg: uncuffed 3.0 mm, cuffed 3.0 mm, 9 cm. Over 3 kg: uncuffed 3.5 mm, cuffed 3.0 mm, 10 cm.',
      '1-6 months (4-6 kg): uncuffed 3.5-4.0 mm, cuffed 3.0 mm, 11 cm. 6-12 months (6-10 kg): uncuffed 3.5-4.0 mm, cuffed 3.5 mm, 12 cm.',
      '1-2 years (10-12 kg): uncuffed 4.0 mm, cuffed 3.5-4.0 mm, 13 cm. 2-4 years (12-16 kg): uncuffed 4.5 mm, cuffed 4.5 mm, 14 cm.',
      'Under-3-years formulas: uncuffed ID = age/4 + 4 mm; cuffed ID = age/4 + 3 mm; oral depth = age/2 + 12 cm; nasal depth = age/2 + 15 cm.',
      'Over 3 years, internal diameter (French): 3-5 years 5.5 mm (24); 5-7 years 6.0 mm (26); 7-9 years 6.5 mm (28); 9-11 years 7.0 mm (30); boys over 11 years 7.0 mm with cuff (32); girls over 11 years 6.5 mm with cuff (30). No depth column is given.',
      'Published cuffed-tube formulas disagree (age/4 + 3 here, age/4 + 3.5 in the calculator above). The calculator is unchanged.',
    ],
    sourceIds: ['polish-peds-under3-2025', 'polish-peds-over3-2025'],
  },
  {
    title: 'Double-lumen tube size by height and sex (review)',
    points: [
      'Women under 160 cm: 35 Fr; women over 160 cm: 37 Fr. Men under 170 cm: 39 Fr; men over 170 cm: 41 Fr.',
      'Additions credited to Slinger: women under 150 cm 32 Fr; men under 160 cm 37 Fr.',
      'For patients shorter than 140 cm the authors use a bronchial blocker. Availability: 32 Fr is made only by Bronchocath; 28 Fr by Bronchocath and Sheridan; Portex and Rusch make none below 35 Fr.',
      'No source read gives a minimum age or height for adult-type tubes. The height bands above differ from the app bands, and the app height and age floor stays an app safety rule.',
    ],
    sourceIds: ['dlt-sizing-review-aca-2023', 'slinger-campos-dlt-2011'],
  },
];

/** Airway topics with no sourced size/depth in this build. */
export const AIRWAY_UNSOURCED: string[] = [
  'Pediatric ETT calculator outside 1 to 8 years (reference tables above; published formulas disagree)',
];

/** Principles shown on the Airway tab, from the ASA difficult airway guideline. */
export const AIRWAY_PRINCIPLES: { text: string; sourceIds: string[] }[] = [
  { text: 'Preoxygenate and keep supplemental oxygen going throughout airway management.', sourceIds: ['asa-airway-2022'] },
  { text: 'Confirm tracheal intubation with capnography.', sourceIds: ['asa-airway-2022'] },
  { text: 'Limit repeated attempts at any one technique; track time and oxygen saturation.', sourceIds: ['asa-airway-2022'] },
  { text: 'Escalate early when ventilation or oxygenation fails; do not delay invasive airway access when CICO is declared.', sourceIds: ['asa-airway-2022'] },
];
