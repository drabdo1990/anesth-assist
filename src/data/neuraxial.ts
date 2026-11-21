// Neuraxial (spinal and epidural) reference regimens for a 70 kg adult.
// Transcribed from the project notebook (Miller 6e Tables 14-7 and 14-8, Oxford Handbook). Reference only:
// these are shown as printed and are never scaled by patient weight or fed into the toxicity calculator.
// Where a printed total dose cannot be reached with the stated concentration x volume, the record carries a
// `discrepancy` note and the UI shows it instead of silently correcting the figure.

import type { NeuraxialRegimen } from './types';

const MILLER = ['miller-6e'];
const MILLER_OXFORD = ['miller-6e', 'oxford-handbook'];

export const NEURAXIAL_REGIMENS: NeuraxialRegimen[] = [
  // ---- Spinal (Miller Table 14-8) ----
  { id: 'sp-lido', agent: 'Lidocaine', route: 'spinal', concLabel: '1.5% or 5.0%', concPercent: [1.5, 5], volumeMl: [1, 2], totalDoseMg: [30, 100], baricity: 'Hyperbaric', glucosePercent: 7.5, durationMin: [30, 90], sourceIds: MILLER_OXFORD },
  { id: 'sp-bupi-iso', agent: 'Bupivacaine', route: 'spinal', concLabel: '0.5%', concPercent: [0.5, 0.5], volumeMl: [3, 4], totalDoseMg: [15, 20], baricity: 'Isobaric', glucosePercent: 0, durationMin: [75, 150], sourceIds: MILLER_OXFORD },
  { id: 'sp-bupi-hyper', agent: 'Bupivacaine', route: 'spinal', concLabel: '0.75%', concPercent: [0.75, 0.75], volumeMl: [2, 3], totalDoseMg: [15, 22.5], baricity: 'Hyperbaric', glucosePercent: 8.25, durationMin: [75, 150], sourceIds: MILLER_OXFORD },
  { id: 'sp-mepi', agent: 'Mepivacaine', route: 'spinal', concLabel: '4.0%', concPercent: [4, 4], volumeMl: [1, 2], totalDoseMg: [40, 80], baricity: 'Hyperbaric', glucosePercent: 9, durationMin: [30, 90], sourceIds: MILLER },
  { id: 'sp-tetra-hyper', agent: 'Tetracaine', route: 'spinal', concLabel: '0.25-1.0%', concPercent: [0.25, 1], volumeMl: [1, 4], totalDoseMg: [5, 20], baricity: 'Hyperbaric', glucosePercent: 5, durationMin: [75, 150], sourceIds: MILLER },
  {
    id: 'sp-tetra-hypo', agent: 'Tetracaine', route: 'spinal', concLabel: '0.25%', concPercent: [0.25, 0.25], volumeMl: [2, 6], totalDoseMg: [5, 20], baricity: 'Hypobaric', glucosePercent: 0, durationMin: [75, 150], sourceIds: MILLER,
    discrepancy: '0.25% x 6 mL = 15 mg, below the printed 20 mg upper total.',
  },
  { id: 'sp-tetra-iso', agent: 'Tetracaine', route: 'spinal', concLabel: '1.0%', concPercent: [1, 1], volumeMl: [1, 2], totalDoseMg: [5, 20], baricity: 'Isobaric', glucosePercent: 0, durationMin: [75, 150], sourceIds: MILLER },

  // ---- Epidural (Miller Table 14-7) ----
  { id: 'ep-lido', agent: 'Lidocaine', route: 'epidural', concLabel: '1.0-2.0%', concPercent: [1, 2], volumeMl: [15, 30], totalDoseMg: [150, 500], onsetMin: [5, 15], durationMin: [60, 120], sourceIds: MILLER_OXFORD },
  { id: 'ep-bupi', agent: 'Bupivacaine', route: 'epidural', concLabel: '0.25-0.75%', concPercent: [0.25, 0.75], volumeMl: [15, 30], totalDoseMg: [37.5, 225], onsetMin: [10, 20], durationMin: [180, 300], sourceIds: MILLER_OXFORD },
  {
    id: 'ep-levobupi', agent: 'Levobupivacaine', route: 'epidural', concLabel: '0.5-0.75%', concPercent: [0.5, 0.75], volumeMl: [15, 20], totalDoseMg: [150, 225], durationMin: [150, 240], sourceIds: MILLER_OXFORD,
    discrepancy: '0.75% x 20 mL = 150 mg, below the printed 225 mg upper total.',
  },
  { id: 'ep-ropi', agent: 'Ropivacaine', route: 'epidural', concLabel: '0.75-1.0%', concPercent: [0.75, 1], volumeMl: [15, 20], totalDoseMg: [140, 180], durationMin: [150, 200], sourceIds: MILLER },
  { id: 'ep-mepi', agent: 'Mepivacaine', route: 'epidural', concLabel: '1.0-2.0%', concPercent: [1, 2], volumeMl: [15, 30], totalDoseMg: [150, 500], onsetMin: [5, 15], durationMin: [60, 180], sourceIds: MILLER },
  { id: 'ep-prilo', agent: 'Prilocaine', route: 'epidural', concLabel: '1.0-3.0%', concPercent: [1, 3], volumeMl: [15, 30], totalDoseMg: [150, 600], onsetMin: [5, 15], sourceIds: MILLER },
  { id: 'ep-chloro', agent: 'Chloroprocaine', route: 'epidural', concLabel: '2.0-3.0%', concPercent: [2, 3], volumeMl: [15, 30], totalDoseMg: [300, 900], onsetMin: [5, 15], durationMin: [30, 90], sourceIds: MILLER },
];

/** Most drug the stated concentration and volume can deliver (1% = 10 mg/mL). */
export const maxDeliverableMg = (r: Pick<NeuraxialRegimen, 'concPercent' | 'volumeMl'>): number =>
  r.concPercent[1] * 10 * r.volumeMl[1];
