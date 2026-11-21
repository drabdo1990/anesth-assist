export interface ConditionPlan {
  preop: string[];
  intraop: string[];
  avoid: string[];
  postop: string[];
}

export interface ConditionRecord {
  id: string;
  name: string;
  /** Lower-case other names and abbreviations the search also matches. */
  aliases: string[];
  /** Chapter number in Stoelting 8e; the title is in STOELTING_CHAPTERS. */
  chapter: number;
  plan?: ConditionPlan;
  /** The SOS panel this plan links to. */
  crisis?: 'mh';
  sourceIds: string[];
}

export const STOELTING_CHAPTERS: Record<number, string> = {
  2: 'Anesthetic Considerations for Obstructive Lung Disease',
  3: 'Restrictive Respiratory Diseases and Lung Transplantation',
  7: 'Congenital Heart Disease',
  8: 'Abnormalities of Cardiac Conduction and Cardiac Rhythm',
  10: 'Heart Failure and Cardiomyopathies',
  12: 'Vascular Disease',
  13: 'Diseases Affecting the Brain',
  14: 'Disorders of the Spine and Spinal Cord',
  15: 'Diseases of the Autonomic and Peripheral Nervous Systems',
  16: 'Diseases of the Liver and Biliary Tract',
  17: 'Diseases of the Gastrointestinal System',
  18: 'Inborn Errors of Metabolism',
  21: 'Renal Disease',
  22: 'Endocrine Disease',
  23: 'Hematologic Disorders',
  24: 'Skin and Collagen Disorders',
  26: 'Diseases Related to Immune System Dysfunction',
  27: 'Cancer',
  29: 'Psychiatric Disease, Substance Use Disorders, and Drug Overdose',
  31: 'Pediatric Diseases',
};

/** The user's own NotebookLM notebook. Opens only for accounts it is shared with; the app sends nothing to it. */
export const PROJECT_NOTEBOOK_URL = 'https://notebooklm.google.com/notebook/1ce36864-79d5-4dbc-b3fa-51b63c6a401f';

export function entry(
  id: string,
  name: string,
  chapter: number,
  aliases: string[] = [],
  plan?: ConditionPlan,
  crisis?: 'mh',
): ConditionRecord {
  const rec: ConditionRecord = {
    id,
    name,
    aliases,
    chapter,
    sourceIds: ['stoelting-8e'],
  };
  if (plan !== undefined) {
    rec.plan = plan;
  }
  if (crisis !== undefined) {
    rec.crisis = crisis;
  }
  return rec;
}
