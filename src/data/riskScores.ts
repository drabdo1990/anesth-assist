// Risk score definitions. Every score cites sourceIds that exist in sources.ts (enforced by tests).
// Items are one point each. Add a `points` field when the first weighted score (ARISCAT) is added.

export type DerivedKey = 'age>50' | 'male' | 'female' | 'bmi>35' | 'creatinine>2.0mgdl';

export interface RiskScoreItem {
  id: string;
  label: string;
  /** Filled from the patient inputs and locked, so it can never disagree with them. */
  derive?: DerivedKey;
}

export interface RiskBand {
  /** Lowest score in this band. */
  min: number;
  label: string;
  detail?: string;
}

export interface RiskScore {
  id: string;
  name: string;
  items: RiskScoreItem[];
  bands: RiskBand[];
  note?: string;
  /** Only validated in adults (age 18 or over); children get "not applicable". */
  adultOnly?: boolean;
  /** One-sentence rationale for trainees. */
  why?: string;
  sourceIds: string[];
}

const rcriRate = (validation: string, derivation: string): string =>
  `Major cardiac complications: ${validation} in the validation cohort (${derivation} in the derivation cohort).`;

export const RCRI: RiskScore = {
  id: 'rcri',
  name: 'Revised Cardiac Risk Index (RCRI)',
  items: [
    { id: 'rcri-high-risk-surgery', label: 'High-risk surgery (intraperitoneal, intrathoracic or suprainguinal vascular)' },
    { id: 'rcri-ihd', label: 'Ischemic heart disease (previous MI, positive exercise test, ischemic chest pain or nitrate use, or Q waves on ECG)' },
    { id: 'rcri-chf', label: 'Heart failure (history of heart failure, pulmonary edema or PND, bilateral rales or S3, or pulmonary vascular redistribution on chest X-ray)' },
    { id: 'rcri-cvd', label: 'Cerebrovascular disease (previous TIA or stroke)' },
    { id: 'rcri-insulin', label: 'Insulin treatment for diabetes' },
    { id: 'rcri-creatinine', label: 'Serum creatinine above 2.0 mg/dL (177 micromol/L)', derive: 'creatinine>2.0mgdl' },
  ],
  bands: [
    { min: 0, label: '0 factors', detail: rcriRate('0.4%', '0.5%') },
    { min: 1, label: '1 factor', detail: rcriRate('0.9%', '1.3%') },
    { min: 2, label: '2 factors', detail: rcriRate('6.6%', '3.6%') },
    { min: 3, label: '3 or more factors', detail: rcriRate('11.0%', '9.1%') },
  ],
  note: 'The rates come from one 1999 hospital cohort of patients aged 50 or over having elective major non-cardiac surgery. They describe that cohort, not an individual patient.',
  why: 'Each factor adds one point of independent risk for a major cardiac complication after non-cardiac surgery.',
  sourceIds: ['rcri-lee-1999'],
};

export const STOP_BANG: RiskScore = {
  id: 'stop-bang',
  name: 'STOP-Bang (obstructive sleep apnea screen)',
  items: [
    { id: 'sb-snoring', label: 'Snoring: do you snore loudly (louder than talking, or heard through a closed door)?' },
    { id: 'sb-tired', label: 'Tired: do you often feel tired, fatigued or sleepy in the daytime?' },
    { id: 'sb-observed', label: 'Observed: has anyone seen you stop breathing during sleep?' },
    { id: 'sb-pressure', label: 'Pressure: do you have, or are you treated for, high blood pressure?' },
    { id: 'sb-bmi', label: 'BMI above 35 kg/m²', derive: 'bmi>35' },
    { id: 'sb-age', label: 'Age above 50', derive: 'age>50' },
    { id: 'sb-neck', label: 'Neck circumference above 40 cm (16 in)' },
    { id: 'sb-male', label: 'Male', derive: 'male' },
  ],
  bands: [
    { min: 0, label: 'Low risk', detail: 'Of moderate to severe obstructive sleep apnea (score 0 to 2).' },
    { min: 3, label: 'Intermediate risk', detail: 'Of moderate to severe obstructive sleep apnea (score 3 to 4).' },
    { min: 5, label: 'High risk', detail: 'Of moderate to severe obstructive sleep apnea (score 5 to 8).' },
  ],
  note: 'A screening tool, not a diagnosis. The paper adds a second step for scores of 3 to 4 that this screen does not apply.',
  why: 'Eight yes/no items; each yes scores one point. A higher score means a higher chance of moderate to severe sleep apnea.',
  sourceIds: ['stop-bang-chung-2016', 'stop-chung-2008'],
};

export const RISK_SCORES: RiskScore[] = [RCRI, STOP_BANG];

export const APFEL: RiskScore = {
  id: 'apfel',
  name: 'Apfel PONV risk score (adults)',
  adultOnly: true,
  items: [
    { id: 'apfel-female', label: 'Female gender', derive: 'female' },
    { id: 'apfel-history', label: 'History of PONV and/or motion sickness' },
    { id: 'apfel-nonsmoker', label: 'Nonsmoking status' },
    { id: 'apfel-opioids', label: 'Use of postoperative opioids' },
  ],
  bands: [
    { min: 0, label: 'Low risk', detail: 'Postoperative nausea and vomiting occurs in approximately 10% of patients with no risk factor.' },
    { min: 1, label: 'Medium risk', detail: 'Approximately 20% with one risk factor and 40% with two.' },
    { min: 3, label: 'High risk', detail: 'Approximately 60% with three risk factors and 80% with four.' },
  ],
  note: 'The incidences are approximate. They and the low, medium and high classification (0, 1-2, 3 or more factors) come from the 2025 ASER consensus, which cites the 1999 Apfel paper. The consensus says adult models such as the Apfel score are poorly suited to pediatric postoperative vomiting.',
  why: 'Four yes/no risk factors; each yes scores one point. More factors mean a higher chance of nausea and vomiting after surgery.',
  sourceIds: ['aser-ponv-5th-2025', 'apfel-1999'],
};

/** Scores shown on the Post-op tab. RISK_SCORES stays the Pre-op Assess set. */
export const POSTOP_SCORES: RiskScore[] = [APFEL];
