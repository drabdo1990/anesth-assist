// Emergency protocol content: LAST, malignant hyperthermia, CICO / failed airway.
// Numeric dosing for LAST and MH is calculated in src/lib/calc/lipid.ts and dantrolene.ts.
// Steps carry no numeric doses beyond those verified in sources.ts. Anything else is described
// qualitatively and says "per protocol" so no unverified dose is displayed.

export interface EmergencyStep {
  id: string;
  text: string;
  critical?: boolean;
  note?: string;
  sourceIds: string[];
}

export const LAST_STEPS: EmergencyStep[] = [
  {
    id: 'last-stop',
    text: 'Stop injecting local anesthetic. Call for help. Get the lipid emulsion / LAST kit.',
    critical: true,
    sourceIds: ['asra-last-2020'],
  },
  {
    id: 'last-airway',
    text: 'Manage the airway and ventilate with 100% oxygen.',
    critical: true,
    sourceIds: ['asra-last-2020'],
  },
  {
    id: 'last-seizure',
    text: 'Treat seizures. Benzodiazepines are preferred.',
    note: 'Propofol is not a substitute for lipid emulsion.',
    sourceIds: ['asra-last-2020'],
  },
  {
    id: 'last-lipid-bolus',
    text: 'Give 20% lipid emulsion bolus (dose from the calculator below for this weight).',
    critical: true,
    sourceIds: ['asra-last-2020'],
  },
  {
    id: 'last-lipid-infusion',
    text: 'Start the 20% lipid emulsion infusion (dose from the calculator below).',
    critical: true,
    note: 'Continue for at least 10 minutes after hemodynamic stability.',
    sourceIds: ['asra-last-2020'],
  },
  {
    id: 'last-acls',
    text: 'If cardiac arrest: follow ACLS with LAST modifications. Reduce epinephrine doses. Avoid vasopressin, calcium channel blockers, beta blockers and further local anesthetic.',
    critical: true,
    note: 'Use the ASRA checklist for the epinephrine dose; do not rely on local anesthetic-related interventions alone.',
    sourceIds: ['asra-last-2020'],
  },
  {
    id: 'last-repeat',
    text: 'If instability continues: repeat the lipid bolus and double the infusion rate (do not exceed the cumulative ceiling).',
    sourceIds: ['asra-last-2020'],
  },
  {
    id: 'last-bypass',
    text: 'Alert the nearest facility with cardiopulmonary bypass / ECMO capability early if refractory.',
    sourceIds: ['asra-last-2020'],
  },
];

export const MH_STEPS: EmergencyStep[] = [
  {
    id: 'mh-stop-triggers',
    text: 'Stop all volatile anesthetics and succinylcholine.',
    critical: true,
    sourceIds: ['mhaus', 'emhg-2024'],
  },
  {
    id: 'mh-help',
    text: 'Call for help and declare an MH emergency. Get the MH cart / dantrolene.',
    critical: true,
    sourceIds: ['mhaus', 'emhg-2024'],
  },
  {
    id: 'mh-hyperventilate',
    text: 'Hyperventilate with 100% oxygen at high flow.',
    critical: true,
    sourceIds: ['mhaus', 'emhg-2024'],
  },
  {
    id: 'mh-dantrolene',
    text: 'Give dantrolene IV (initial dose from the calculator below, on actual body weight).',
    critical: true,
    sourceIds: ['mhaus', 'label-ryanodex', 'label-revonto'],
  },
  {
    id: 'mh-repeat',
    text: 'Repeat dantrolene until signs of MH are controlled. Track the cumulative dose.',
    note: 'Both product labels cite 10 mg/kg as the maximum cumulative dose.',
    sourceIds: ['mhaus', 'label-ryanodex', 'label-revonto'],
  },
  {
    id: 'mh-cooling',
    text: 'Start active cooling.',
    sourceIds: ['mhaus', 'emhg-2024'],
  },
  {
    id: 'mh-metabolic',
    text: 'Treat hyperkalemia and acidosis per the MHAUS / EMHG protocol.',
    critical: true,
    sourceIds: ['mhaus', 'emhg-2024'],
  },
  {
    id: 'mh-arrhythmia',
    text: 'Treat arrhythmias per the MHAUS / EMHG protocol.',
    sourceIds: ['mhaus', 'emhg-2024'],
  },
  {
    id: 'mh-monitor',
    text: 'Monitor temperature, end-tidal CO2, blood gases, potassium and urine output.',
    sourceIds: ['mhaus', 'emhg-2024'],
  },
  {
    id: 'mh-contact',
    text: 'Contact your MH hotline / local MH contact (set in Settings).',
    sourceIds: ['mhaus'],
  },
];

export interface CicoPlan {
  id: 'A' | 'B' | 'C' | 'D';
  title: string;
  steps: EmergencyStep[];
  /** Conditions that mean this plan has failed and the next plan starts. */
  failureCriteria: string[];
}

export const CICO_PLANS: CicoPlan[] = [
  {
    id: 'A',
    title: 'Plan A: Tracheal intubation',
    steps: [
      { id: 'cico-a-oxygen', text: 'Preoxygenate and keep oxygenating throughout (supplemental oxygen).', critical: true, sourceIds: ['asa-airway-2022'] },
      { id: 'cico-a-optimize', text: 'Optimize each attempt (position, device, operator). Limit the number of attempts.', sourceIds: ['asa-airway-2022'] },
      { id: 'cico-a-capno', text: 'After intubation, confirm placement with capnography (waveform end-tidal CO2).', critical: true, sourceIds: ['asa-airway-2022'] },
    ],
    failureCriteria: [
      'Tracheal intubation not achieved within your attempt limit',
      'Oxygenation falling or cannot be maintained',
    ],
  },
  {
    id: 'B',
    title: 'Plan B: Alternative intubation technique or supraglottic airway',
    steps: [
      { id: 'cico-b-sga', text: 'Use an alternative technique or place a supraglottic airway. Limit attempts.', sourceIds: ['asa-airway-2022'] },
      { id: 'cico-b-capno', text: 'Confirm ventilation with capnography.', critical: true, sourceIds: ['asa-airway-2022'] },
    ],
    failureCriteria: ['Ventilation or oxygenation not achieved through the alternative device'],
  },
  {
    id: 'C',
    title: 'Plan C: Face-mask ventilation / rescue oxygenation',
    steps: [
      { id: 'cico-c-mask', text: 'Optimize face-mask ventilation (two-person technique, adjuncts). Consider waking the patient if feasible.', sourceIds: ['asa-airway-2022'] },
      { id: 'cico-c-call', text: 'Call for help now if not already done.', critical: true, sourceIds: ['asa-airway-2022'] },
    ],
    failureCriteria: [
      'Cannot oxygenate or ventilate by any non-invasive route: declare CICO and go to Plan D without delay',
    ],
  },
  {
    id: 'D',
    title: 'Plan D: Emergency front-of-neck access (eFONA)',
    steps: [
      { id: 'cico-d-declare', text: "Declare \"Can't intubate, can't oxygenate\" and call for the invasive airway kit.", critical: true, sourceIds: ['asa-airway-2022'] },
      { id: 'cico-d-access', text: 'Perform invasive airway access without delay, using the technique you are trained in and your local kit.', critical: true, sourceIds: ['asa-airway-2022'] },
      { id: 'cico-d-capno', text: 'Confirm ventilation with capnography.', critical: true, sourceIds: ['asa-airway-2022'] },
    ],
    failureCriteria: [],
  },
];
