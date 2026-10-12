import type { ScalarKey } from './biometrics'

export type Category =
  | 'Premed'
  | 'Induction'
  | 'NMBA'
  | 'Reversal'
  | 'Infusion'
  | 'Vasopressor'
  | 'Analgesia'

export type DoseBasis = 'perKg' | 'fixed' | 'perKgMin' | 'perKgH' | 'fixedMin'
export type PatientTarget = 'adult' | 'pediatric' | 'all'

export interface DoseOption {
  label: string
  basis: DoseBasis
  low: number
  high?: number
  target?: PatientTarget
}

export interface Drug {
  id: string
  name: string
  category: Category
  scalar: ScalarKey
  unit: 'mg' | 'mcg'
  options: DoseOption[]
  maxMass?: number // absolute ceiling in `unit`
  concentrations: number[] // `unit` per mL
  defaultConc: number
  note?: string
  companion?: Drug
  target?: PatientTarget
}

export const CATEGORIES: Category[] = [
  'Premed',
  'Induction',
  'NMBA',
  'Reversal',
  'Infusion',
  'Vasopressor',
  'Analgesia',
]

const glycopyrrolate: Drug = {
  id: 'glycopyrrolate',
  name: 'Glycopyrrolate',
  category: 'Reversal',
  scalar: 'tbw',
  unit: 'mg',
  options: [{ label: '0.01 mg/kg', basis: 'perKg', low: 0.01 }],
  maxMass: 1,
  concentrations: [0.2],
  defaultConc: 0.2,
}

// Dose rates and scalars come from the spec.
// added: default vial concentrations (concentrations/defaultConc on every drug) are
// standard values not in the original brief, editable per drug; see spec section 9.
export const DRUGS: Drug[] = [
  // ── Pre-operative & Premedication ─────────────────────────────────────────
  {
    id: 'midazolam',
    name: 'Midazolam',
    category: 'Premed',
    scalar: 'tbw',
    unit: 'mg',
    options: [
      {
        label: 'IV premed 0.02–0.04 mg/kg',
        basis: 'perKg',
        low: 0.02,
        high: 0.04,
        target: 'adult',
      },
      {
        label: 'Peds PO/IN 0.2–0.5 mg/kg',
        basis: 'perKg',
        low: 0.2,
        high: 0.5,
        target: 'pediatric',
      },
    ],
    concentrations: [1, 5],
    defaultConc: 1,
    note: 'Titrate to effect in elderly; wait 2–3 min between increments.',
  },
  {
    id: 'clonidine',
    name: 'Clonidine',
    category: 'Premed',
    scalar: 'tbw',
    unit: 'mcg',
    options: [
      { label: 'IV premed 1–2 mcg/kg', basis: 'perKg', low: 1, high: 2 },
      { label: 'Caudal adjunct 1 mcg/kg', basis: 'perKg', low: 1 },
    ],
    concentrations: [150],
    defaultConc: 150,
    note: 'Ampoule 150 mcg/mL.',
  },
  {
    id: 'dexamethasone',
    name: 'Dexamethasone',
    category: 'Premed',
    scalar: 'tbw',
    unit: 'mg',
    options: [
      { label: 'Adult antiemetic 4–8 mg', basis: 'fixed', low: 4, high: 8, target: 'adult' },
      { label: 'Peds 0.15 mg/kg', basis: 'perKg', low: 0.15, target: 'pediatric' },
    ],
    concentrations: [4, 5],
    defaultConc: 4,
  },
  {
    id: 'ondansetron',
    name: 'Ondansetron',
    category: 'Premed',
    scalar: 'tbw',
    unit: 'mg',
    options: [
      { label: 'Adult 4 mg', basis: 'fixed', low: 4, target: 'adult' },
      { label: 'Peds 0.1 mg/kg', basis: 'perKg', low: 0.1, target: 'pediatric' },
    ],
    maxMass: 4,
    concentrations: [2],
    defaultConc: 2,
  },

  // ── Induction & Hypnotics ──────────────────────────────────────────────────
  {
    id: 'propofol',
    name: 'Propofol',
    category: 'Induction',
    scalar: 'lbw',
    unit: 'mg',
    options: [
      {
        label: 'Adult induction 1.5–2.5 mg/kg (LBW)',
        basis: 'perKg',
        low: 1.5,
        high: 2.5,
        target: 'adult',
      },
      {
        label: 'Obese / elderly 1.0–1.5 mg/kg (LBW)',
        basis: 'perKg',
        low: 1,
        high: 1.5,
        target: 'adult',
      },
      {
        label: 'Peds induction 2.5–3.5 mg/kg (TBW)',
        basis: 'perKg',
        low: 2.5,
        high: 3.5,
        target: 'pediatric',
      },
    ],
    concentrations: [10],
    defaultConc: 10,
  },
  {
    id: 'etomidate',
    name: 'Etomidate',
    category: 'Induction',
    scalar: 'tbw',
    unit: 'mg',
    options: [{ label: 'Induction 0.2–0.3 mg/kg', basis: 'perKg', low: 0.2, high: 0.3 }],
    concentrations: [2],
    defaultConc: 2,
    note: 'Cardiostable; may cause myoclonus and adrenal suppression.',
  },
  {
    id: 'ketamine',
    name: 'Ketamine',
    category: 'Induction',
    scalar: 'tbw',
    unit: 'mg',
    options: [
      { label: 'Induction 1–2 mg/kg IV', basis: 'perKg', low: 1, high: 2 },
      { label: 'Sub-dissociative analgesia 0.25–0.5 mg/kg', basis: 'perKg', low: 0.25, high: 0.5 },
    ],
    concentrations: [10, 50, 100],
    defaultConc: 10,
  },
  {
    id: 'thiopental',
    name: 'Thiopental',
    category: 'Induction',
    scalar: 'tbw',
    unit: 'mg',
    options: [
      { label: 'Adult 3–5 mg/kg', basis: 'perKg', low: 3, high: 5, target: 'adult' },
      { label: 'Peds 5–6 mg/kg', basis: 'perKg', low: 5, high: 6, target: 'pediatric' },
    ],
    concentrations: [25],
    defaultConc: 25,
  },

  // ── Neuromuscular Blockers & Reversals ────────────────────────────────────
  {
    id: 'rocuronium',
    name: 'Rocuronium',
    category: 'NMBA',
    scalar: 'ibw',
    unit: 'mg',
    options: [
      { label: 'Standard intubation 0.6 mg/kg (2× ED95)', basis: 'perKg', low: 0.6 },
      { label: 'RSI 1.0–1.2 mg/kg', basis: 'perKg', low: 1, high: 1.2 },
      { label: 'Maintenance 0.1–0.15 mg/kg', basis: 'perKg', low: 0.1, high: 0.15 },
    ],
    concentrations: [10],
    defaultConc: 10,
  },
  {
    id: 'succinylcholine',
    name: 'Succinylcholine',
    category: 'NMBA',
    scalar: 'tbw',
    unit: 'mg',
    options: [{ label: '1.0–1.5 mg/kg', basis: 'perKg', low: 1, high: 1.5 }],
    maxMass: 200,
    concentrations: [20, 100],
    defaultConc: 20,
  },
  {
    id: 'cisatracurium',
    name: 'Cisatracurium',
    category: 'NMBA',
    scalar: 'ibw',
    unit: 'mg',
    options: [{ label: 'Intubation 0.15–0.2 mg/kg', basis: 'perKg', low: 0.15, high: 0.2 }],
    concentrations: [2],
    defaultConc: 2,
    note: 'Hofmann elimination — organ-independent.',
  },
  {
    id: 'sugammadex',
    name: 'Sugammadex',
    category: 'Reversal',
    scalar: 'tbw',
    unit: 'mg',
    options: [
      { label: 'Routine reversal (TOF = 2) 2 mg/kg', basis: 'perKg', low: 2 },
      { label: 'Deep block (PTC 1–2) 4 mg/kg', basis: 'perKg', low: 4 },
      { label: 'Immediate rescue post-Roc 1.2 mg/kg → 16 mg/kg', basis: 'perKg', low: 16 },
    ],
    concentrations: [100],
    defaultConc: 100,
  },
  {
    id: 'neostigmine',
    name: 'Neostigmine + Glycopyrrolate',
    category: 'Reversal',
    scalar: 'tbw',
    unit: 'mg',
    options: [{ label: 'Neostigmine 0.05 mg/kg', basis: 'perKg', low: 0.05 }],
    maxMass: 5,
    concentrations: [1, 0.5],
    defaultConc: 1,
    note: 'Give with glycopyrrolate 0.2 mg per 1 mg neostigmine.',
    companion: glycopyrrolate,
  },

  // ── Maintenance Infusions (TIVA & vasoactive) ─────────────────────────────
  {
    id: 'propofol-tiva',
    name: 'Propofol TIVA',
    category: 'Infusion',
    scalar: 'lbw',
    unit: 'mg',
    options: [
      { label: 'TIVA 6–12 mg/kg/h (= 100–200 mcg/kg/min)', basis: 'perKgH', low: 6, high: 12 },
    ],
    concentrations: [10],
    defaultConc: 10,
    note: 'Dose on LBW. Rate shown as mg/h and mL/h.',
  },
  {
    id: 'remifentanil',
    name: 'Remifentanil',
    category: 'Infusion',
    scalar: 'lbw',
    unit: 'mcg',
    options: [{ label: 'TIVA 0.1–0.5 mcg/kg/min', basis: 'perKgMin', low: 0.1, high: 0.5 }],
    concentrations: [20, 50],
    defaultConc: 50,
    note: 'Dilute 20–50 mcg/mL. Dose on LBW. Rate shown per hour.',
  },
  {
    id: 'norepinephrine',
    name: 'Norepinephrine',
    category: 'Infusion',
    scalar: 'tbw',
    unit: 'mcg',
    options: [{ label: 'Infusion 0.02–0.5 mcg/kg/min', basis: 'perKgMin', low: 0.02, high: 0.5 }],
    concentrations: [80],
    defaultConc: 80,
    note: 'Standard bag 4 mg / 50 mL = 80 mcg/mL. Central access preferred.',
  },

  // ── Vasopressors (bolus) ───────────────────────────────────────────────────
  {
    id: 'phenylephrine',
    name: 'Phenylephrine',
    category: 'Vasopressor',
    scalar: 'tbw',
    unit: 'mcg',
    options: [
      { label: 'Bolus 50–100 mcg', basis: 'fixed', low: 50, high: 100 },
      { label: 'Infusion 20–50 mcg/min', basis: 'fixedMin', low: 20, high: 50 },
    ],
    concentrations: [100],
    defaultConc: 100,
    note: 'Diluted syringe (100 mcg/mL).',
  },
  {
    id: 'ephedrine',
    name: 'Ephedrine',
    category: 'Vasopressor',
    scalar: 'tbw',
    unit: 'mg',
    options: [{ label: 'Bolus 5–10 mg IV', basis: 'fixed', low: 5, high: 10 }],
    concentrations: [5, 50],
    defaultConc: 5,
  },

  // ── Postoperative & Multimodal Analgesia ──────────────────────────────────
  {
    id: 'paracetamol',
    name: 'IV Acetaminophen',
    category: 'Analgesia',
    scalar: 'tbw',
    unit: 'mg',
    options: [{ label: 'IV 15 mg/kg q6h', basis: 'perKg', low: 15 }],
    maxMass: 1000,
    concentrations: [10],
    defaultConc: 10,
    note: 'Max 1000 mg per dose and 4 g/day (adults); 60 mg/kg/day in children.',
  },
  {
    id: 'ketorolac',
    name: 'Ketorolac',
    category: 'Analgesia',
    scalar: 'tbw',
    unit: 'mg',
    options: [{ label: 'Adult 15–30 mg IV', basis: 'fixed', low: 15, high: 30, target: 'adult' }],
    concentrations: [15, 30],
    defaultConc: 30,
    note: 'Caution: renal impairment, elderly, bleeding risk. Avoid in aortic surgery.',
  },
  {
    id: 'morphine',
    name: 'Morphine',
    category: 'Analgesia',
    scalar: 'ibw',
    unit: 'mg',
    options: [{ label: 'IV titration 0.05–0.1 mg/kg', basis: 'perKg', low: 0.05, high: 0.1 }],
    concentrations: [1, 10],
    defaultConc: 1,
    note: 'Titrate in increments; histamine release at higher doses.',
  },
  {
    id: 'fentanyl',
    name: 'Fentanyl',
    category: 'Analgesia',
    scalar: 'lbw',
    unit: 'mcg',
    options: [{ label: 'IV bolus 1–2 mcg/kg', basis: 'perKg', low: 1, high: 2 }],
    concentrations: [10, 50],
    defaultConc: 50,
  },
  {
    id: 'lidocaine-iv',
    name: 'IV Lidocaine (systemic)',
    category: 'Analgesia',
    scalar: 'ibw',
    unit: 'mg',
    options: [
      { label: 'Bolus 1–1.5 mg/kg over 10 min', basis: 'perKg', low: 1, high: 1.5 },
      { label: 'Infusion 1–2 mg/kg/h', basis: 'perKgH', low: 1, high: 2 },
    ],
    concentrations: [10, 20],
    defaultConc: 10,
    note: 'Dose on IBW. Stop at signs of local anesthetic systemic toxicity.',
  },
]
