// Rapid plan cards. A card groups items the app already holds: every phase lists existing checklist item ids,
// so each line keeps its own source and no new clinical statement is written here.

import { CHECKLISTS } from './checklists';
import type { ChecklistItemRecord } from './types';

export const PLAN_PHASES = ['preop', 'induction', 'maintenance', 'emergence', 'redFlags'] as const;
export type PlanPhase = (typeof PLAN_PHASES)[number];

export const PLAN_PHASE_LABEL: Record<PlanPhase, string> = {
  preop: 'Pre-op',
  induction: 'Induction and airway',
  maintenance: 'Maintenance',
  emergence: 'Emergence',
  redFlags: 'Red flags',
};

export interface PlanCardLinks {
  /** Opens Intra-op > Vent on this scenario. */
  ventScenarioId?: string;
  /** Opens Intra-op > Airway. */
  airway?: boolean;
  /** Opens Intra-op > Dosing (adult or pediatric calculator). */
  dosing?: boolean;
  /** Opens Intra-op > Lists (checklists and the crisis lists). */
  lists?: boolean;
  /** Opens the Drug reference sheet (reference only, never calculated). */
  references?: boolean;
}

export interface PlanCard {
  id: string;
  title: string;
  population: string;
  /** What the card is, in one sentence. Not a clinical claim. */
  why: string;
  /** Existing checklist item ids. An empty phase shows NO_SOURCE_VALUE. */
  phases: Record<PlanPhase, string[]>;
  links: PlanCardLinks;
}

const WHY = 'Groups items already in this app, with the sources they already have. It adds no new clinical statements.';

export const PLAN_CARDS: PlanCard[] = [
  {
    id: 'peds',
    title: 'Pediatric',
    population: 'Children and infants. Calculated pediatric dosing, airway and ventilation available.',
    why: WHY,
    phases: {
      preop: ['fasting-peds-clear', 'fasting-breast-milk', 'fasting-formula', 'fasting-risk-conditions'],
      induction: ['pre-airway-assess', 'pre-suction', 'pre-dif-airway', 'awp-sizes', 'awp-preox', 'awp-capno', 'awp-attempts', 'awp-escalate'],
      maintenance: ['intra-temp', 'intra-fluids', 'intra-vent'],
      emergence: ['em-reversal', 'em-ventilation', 'em-oxygenation', 'em-reflexes', 'em-suction', 'em-risk'],
      redFlags: [],
    },
    links: { ventScenarioId: 'pediatric', airway: true, dosing: true, references: true, lists: true },
  },
  {
    id: 'ob-cs-neuraxial',
    title: 'Obstetric: cesarean under neuraxial',
    population: 'Cesarean delivery planned under spinal or epidural anesthesia.',
    why: WHY,
    phases: {
      preop: ['fasting-elective-obstetric', 'fasting-risk-conditions'],
      induction: ['nxp-consent', 'nxp-coag', 'nxp-ready', 'nxp-regimen', 'nxp-asepsis', 'lad-max', 'lad-lipid'],
      maintenance: ['intra-temp', 'intra-fluids', 'intra-blood', 'intra-infusions'],
      emergence: [],
      redFlags: [],
    },
    links: { dosing: true, ventScenarioId: 'obstetric', lists: true },
  },
  {
    id: 'obesity',
    title: 'Obesity',
    population: 'Obesity or previous bariatric surgery.',
    why: WHY,
    phases: {
      preop: ['fasting-bariatric', 'fasting-risk-conditions'],
      induction: ['pre-airway-assess', 'pre-suction', 'pre-dif-airway', 'awp-sizes', 'awp-preox', 'awp-capno', 'awp-attempts', 'awp-escalate'],
      maintenance: ['intra-vent', 'intra-position', 'intra-nmb'],
      emergence: ['em-reversal', 'em-ventilation', 'em-oxygenation', 'em-reflexes', 'em-risk'],
      redFlags: [],
    },
    links: { ventScenarioId: 'obesity', airway: true, dosing: true },
  },
  {
    id: 'rsi',
    title: 'RSI / full stomach',
    population: 'Emergency or urgent anesthesia, or a patient at risk of aspiration.',
    why: WHY,
    phases: {
      preop: ['fasting-emergency', 'fasting-risk-conditions', 'fasting-pocus'],
      induction: ['pre-fasting', 'pre-airway-assess', 'pre-suction', 'pre-dif-airway', 'awp-preox', 'awp-capno', 'awp-attempts', 'awp-escalate'],
      maintenance: [],
      emergence: ['em-reflexes', 'em-ventilation', 'em-risk'],
      redFlags: [],
    },
    links: { airway: true, dosing: true, references: true, lists: true },
  },
];

const ITEM_BY_ID = new Map<string, ChecklistItemRecord>(CHECKLISTS.flatMap((l) => l.items).map((i) => [i.id, i]));

export const planItems = (card: PlanCard, phase: PlanPhase): ChecklistItemRecord[] =>
  card.phases[phase].map((id) => {
    const item = ITEM_BY_ID.get(id);
    if (!item) throw new Error(`Plan card ${card.id} lists unknown checklist item "${id}"`);
    return item;
  });

export const cardSourceIds = (card: PlanCard): string[] => [
  ...new Set(PLAN_PHASES.flatMap((p) => planItems(card, p).flatMap((i) => i.sourceIds))),
];
