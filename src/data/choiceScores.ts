// Scores whose items have several answers worth different points (the yes/no RiskScore cannot express them).
// The 4AT wording and points are copied from the 4AT form, version 1 (supplementary appendix of Bellelli 2014).
// The modified Aldrete score and PADSS wording comes from Miller 6e (Table 71-4) and Clinical Cases in Anesthesia (Tables 78.1 and 78.2).

import type { RiskBand } from './riskScores';

export interface ChoiceOption {
  label: string;
  points: number;
}

export interface ChoiceItem {
  id: string;
  label: string;
  /** How to ask or observe, as the form words it. */
  prompt?: string;
  options: ChoiceOption[];
}

export interface ChoiceScore {
  id: string;
  name: string;
  items: ChoiceItem[];
  bands: RiskBand[];
  note?: string;
  /** One-sentence rationale for trainees. */
  why?: string;
  sourceIds: string[];
}

export const FOUR_AT: ChoiceScore = {
  id: '4at',
  name: '4AT delirium screen',
  items: [
    {
      id: '4at-alertness',
      label: 'Alertness',
      prompt:
        'This includes patients who may be markedly drowsy (eg. difficult to rouse and/or obviously sleepy during assessment) or agitated/hyperactive. Observe the patient. If asleep, attempt to wake with speech or gentle touch on shoulder. Ask the patient to state their name and address to assist rating.',
      options: [
        { label: 'Normal (fully alert, but not agitated, throughout assessment)', points: 0 },
        { label: 'Mild sleepiness for <10 seconds after waking, then normal', points: 0 },
        { label: 'Clearly abnormal', points: 4 },
      ],
    },
    {
      id: '4at-amt4',
      label: 'AMT4',
      prompt: 'Age, date of birth, place (name of the hospital or building), current year.',
      options: [
        { label: 'No mistakes', points: 0 },
        { label: '1 mistake', points: 1 },
        { label: '2 or more mistakes/untestable', points: 2 },
      ],
    },
    {
      id: '4at-attention',
      label: 'Attention',
      prompt:
        'Ask the patient: "Please tell me the months of the year in backwards order, starting at December." To assist initial understanding one prompt of "what is the month before December?" is permitted.',
      options: [
        { label: 'Achieves 7 months or more correctly', points: 0 },
        { label: 'Starts but scores < 7 months / refuses to start', points: 1 },
        { label: 'Untestable (cannot start because unwell, drowsy, inattentive)', points: 2 },
      ],
    },
    {
      id: '4at-change',
      label: 'Acute change or fluctuating course',
      prompt:
        'Evidence of significant change or fluctuation in: alertness, cognition, other mental function (eg. paranoia, hallucinations) arising over the last 2 weeks and still evident in last 24hrs.',
      options: [
        { label: 'No', points: 0 },
        { label: 'Yes', points: 4 },
      ],
    },
  ],
  bands: [
    { min: 0, label: 'Delirium or cognitive impairment unlikely', detail: 'But delirium is still possible if the acute change item (4) information is incomplete.' },
    { min: 1, label: 'Possible cognitive impairment', detail: 'A score of 1 to 3.' },
    { min: 4, label: 'Possible delirium +/- cognitive impairment', detail: 'A score of 4 or above.' },
  ],
  note: 'A screening instrument, not a diagnosis: a score of 4 or more suggests delirium, and more detailed assessment of mental status may be required. Items 1 to 3 are rated on observation of the patient at the time of assessment. Item 4 needs information from one or more sources (for example your own knowledge of the patient, other staff, case notes, carers). Take account of hearing impairment, dysphasia and lack of a common language. It was validated in hospitalised patients aged 70 or over, not specifically after surgery. This is version 1 of the form; check www.the4AT.com for the current one.',
  why: 'Four quick items (alertness, a short memory test, attention, and any recent change) add up to 0 to 12. A score of 4 or more flags possible delirium.',
  sourceIds: ['4at-bellelli-2014'],
};

export const MODIFIED_ALDRETE: ChoiceScore = {
  id: 'modified-aldrete',
  name: 'Modified Aldrete score (PACU discharge)',
  items: [
    {
      id: 'aldrete-activity',
      label: 'Activity',
      options: [
        { label: 'Moves all extremities voluntarily or on command', points: 2 },
        { label: 'Moves two extremities', points: 1 },
        { label: 'Unable to move extremities', points: 0 },
      ],
    },
    {
      id: 'aldrete-respiration',
      label: 'Respiration',
      options: [
        { label: 'Breathes deeply and coughs freely', points: 2 },
        { label: 'Dyspneic, shallow or limited breathing', points: 1 },
        { label: 'Apneic', points: 0 },
      ],
    },
    {
      id: 'aldrete-circulation',
      label: 'Circulation',
      prompt: "Textbooks differ: Clinical Cases in Anesthesia gives these bands in percent; Miller 6e prints them as ± 20, 20 to 50 and 50 mm of the pre-anesthetic level. Use your unit's form if it differs.",
      options: [
        { label: 'Blood pressure within ± 20% of the pre-anesthetic level', points: 2 },
        { label: 'Blood pressure ± 20% to 50% of the pre-anesthetic level', points: 1 },
        { label: 'Blood pressure more than ± 50% from the pre-anesthetic level', points: 0 },
      ],
    },
    {
      id: 'aldrete-consciousness',
      label: 'Consciousness',
      options: [
        { label: 'Fully awake', points: 2 },
        { label: 'Arousable on calling', points: 1 },
        { label: 'Not responding', points: 0 },
      ],
    },
    {
      id: 'aldrete-spo2',
      label: 'Oxygen saturation',
      prompt: 'Textbooks differ on 0 points: this is the Clinical Cases in Anesthesia wording; Miller 6e prints "SpO2 below 92% with oxygen", which overlaps its own 1-point level.',
      options: [
        { label: 'SpO2 above 92% on room air', points: 2 },
        { label: 'Needs supplemental oxygen to keep SpO2 above 90%', points: 1 },
        { label: 'SpO2 below 90% even with oxygen', points: 0 },
      ],
    },
  ],
  bands: [
    { min: 0, label: 'Below the discharge mark', detail: 'Fewer than 9 of 10.' },
    { min: 9, label: 'Meets the discharge mark', detail: '9 or more of 10 ("at least 9 out of 10", Miller 6e). The score supports the discharge decision; it does not make it.' },
  ],
  note: 'The 1995 modification of the Aldrete score replaced skin colour with pulse oximetry. The 1995 letter could not be read, so the wording comes from two textbooks, which differ on the two items marked above. Check your local PACU discharge form.',
  why: 'Five signs (activity, breathing, blood pressure, consciousness and oxygen saturation) are each scored 0 to 2; 9 or more of 10 suggests the patient can leave the PACU.',
  sourceIds: ['aldrete-1995', 'miller-6e', 'clinical-cases-anesth'],
};

export const PADSS: ChoiceScore = {
  id: 'padss',
  name: 'PADSS (home readiness after day surgery)',
  items: [
    {
      id: 'padss-vitals',
      label: 'Vital signs (blood pressure and pulse)',
      options: [
        { label: 'Within 20% of the preoperative baseline', points: 2 },
        { label: '20% to 40% of the preoperative baseline', points: 1 },
        { label: 'More than 40% from the preoperative baseline', points: 0 },
      ],
    },
    {
      id: 'padss-activity',
      label: 'Activity',
      options: [
        { label: 'Steady gait, no dizziness (or meets the preoperative level)', points: 2 },
        { label: 'Requires assistance', points: 1 },
        { label: 'Unable to ambulate', points: 0 },
      ],
    },
    {
      id: 'padss-ponv',
      label: 'Nausea and vomiting',
      options: [
        { label: 'Minimal: treated with oral medication', points: 2 },
        { label: 'Moderate: treated with intramuscular medication', points: 1 },
        { label: 'Severe: continues after repeated treatment', points: 0 },
      ],
    },
    {
      id: 'padss-pain',
      label: 'Pain',
      prompt:
        'Pain should be acceptable to the patient and controllable with oral analgesics, and its location, type and intensity consistent with the expected discomfort. Textbooks differ on "not acceptable": Clinical Cases in Anesthesia gives 0 points, Miller 6e gives 1.',
      options: [
        { label: 'Acceptable to the patient: yes', points: 2 },
        { label: 'Acceptable to the patient: no', points: 0 },
      ],
    },
    {
      id: 'padss-bleeding',
      label: 'Surgical bleeding',
      options: [
        { label: 'Minimal: no dressing change needed', points: 2 },
        { label: 'Moderate: up to two dressing changes', points: 1 },
        { label: 'Severe: more than three dressing changes', points: 0 },
      ],
    },
  ],
  bands: [
    { min: 0, label: 'Not yet home-ready by score', detail: 'Fewer than 9 of 10.' },
    { min: 9, label: 'Home-ready by score', detail: '9 or more of 10, with an adult escort (Miller 6e). The score supports the discharge decision; it does not make it.' },
  ],
  note: 'This is the revised PADSS (Marshall and Chung 1999), as both textbooks print it, with pain scored as acceptable or not. Voiding before discharge is no longer required, except after genitourinary, gynecologic, or inguinal or perineal surgery. The two textbooks differ on the item marked above. Check your local discharge policy.',
  why: 'Five criteria (vital signs, walking, nausea and vomiting, pain and bleeding) are each scored 0 to 2; 9 or more of 10 suggests readiness to go home after day surgery.',
  sourceIds: ['padss-marshall-chung-1999', 'miller-6e', 'clinical-cases-anesth'],
};

export const CHOICE_SCORES: ChoiceScore[] = [MODIFIED_ALDRETE, PADSS, FOUR_AT];
