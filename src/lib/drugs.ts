import type { ScalarKey } from './biometrics'

export type Category = 'Induction' | 'NMBA' | 'Reversal' | 'Vasopressor'

export interface DoseOption {
  label: string
  basis: 'perKg' | 'fixed'
  low: number
  high?: number
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
}

export const CATEGORIES: Category[] = ['Induction', 'NMBA', 'Reversal', 'Vasopressor']

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

// Dose rates and scalars come from the spec. Vial concentrations are added defaults
// (editable per drug); see spec section 9.
export const DRUGS: Drug[] = [
  {
    id: 'propofol',
    name: 'Propofol',
    category: 'Induction',
    scalar: 'lbw',
    unit: 'mg',
    options: [{ label: 'Induction 1.5–2.5 mg/kg', basis: 'perKg', low: 1.5, high: 2.5 }],
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
  },
  {
    id: 'ketamine',
    name: 'Ketamine',
    category: 'Induction',
    scalar: 'tbw',
    unit: 'mg',
    options: [{ label: 'Induction 1–2 mg/kg', basis: 'perKg', low: 1, high: 2 }],
    concentrations: [10, 50, 100],
    defaultConc: 10,
  },
  {
    id: 'rocuronium',
    name: 'Rocuronium',
    category: 'NMBA',
    scalar: 'ibw',
    unit: 'mg',
    options: [
      { label: 'Standard 0.6 mg/kg', basis: 'perKg', low: 0.6 },
      { label: 'RSI 1.2 mg/kg', basis: 'perKg', low: 1.2 },
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
    id: 'sugammadex',
    name: 'Sugammadex',
    category: 'Reversal',
    scalar: 'tbw',
    unit: 'mg',
    options: [
      { label: 'Routine 2 mg/kg', basis: 'perKg', low: 2 },
      { label: 'Deep 4 mg/kg', basis: 'perKg', low: 4 },
      { label: 'Immediate 16 mg/kg', basis: 'perKg', low: 16 },
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
    companion: glycopyrrolate,
  },
  {
    id: 'phenylephrine',
    name: 'Phenylephrine',
    category: 'Vasopressor',
    scalar: 'tbw',
    unit: 'mcg',
    options: [{ label: 'Bolus 50–100 mcg', basis: 'fixed', low: 50, high: 100 }],
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
    options: [{ label: 'Bolus 5–10 mg', basis: 'fixed', low: 5, high: 10 }],
    concentrations: [5, 50],
    defaultConc: 5,
  },
]
