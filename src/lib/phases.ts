import { CHECKLISTS } from '../data/checklists';
import type { ChecklistRecord } from '../data/types';

export type AppTab = 'preop' | 'plans' | 'intraop' | 'postop' | 'conditions';
export type IntraopView = 'dosing' | 'airway' | 'vent' | 'lists';

const PREOP_IDS = ['fasting-npo'];
const POSTOP_IDS = ['emergence'];

const phaseOf = (c: ChecklistRecord): AppTab =>
  PREOP_IDS.includes(c.id) ? 'preop' : POSTOP_IDS.includes(c.id) ? 'postop' : 'intraop';

/** Intra-op takes every list not claimed by pre-op or post-op, so a new list is never left out. */
export const listsFor = (tab: AppTab): ChecklistRecord[] => CHECKLISTS.filter((c) => phaseOf(c) === tab);

/** Scores and dose math need the biometric header; the checklists and the handoff do not. Post-op shows it for the Apfel score (sex and age). */
export const needsBiometrics = (tab: AppTab, view: IntraopView): boolean =>
  tab === 'preop' || tab === 'postop' || (tab === 'intraop' && view !== 'lists');
