// Ventilation reference. Only tidal-volume and plateau limits that trace to a named source are
// encoded. Respiratory rate, PEEP, FiO2 and I:E are NOT supplied as defaults; they are entered by
// the user, because no verified source value was available (see each scenario's `unsourced`).

import type { VentilationScenario } from './types';

export const VENTILATION_SCENARIOS: VentilationScenario[] = [
  {
    id: 'ards',
    name: 'ARDS / lung-protective',
    tidalVolumeMlPerKgPbw: { target: 6, min: 4, max: 8 },
    plateauPressureLimit: 30,
    cautions: [
      'Use predicted body weight (PBW), never actual body weight.',
      'If plateau pressure stays above 30 cmH2O at 6 mL/kg PBW, consider reducing toward 4 mL/kg PBW.',
    ],
    unsourced: ['I:E ratio (numeric)'],
    sourceIds: ['ats-ards-2017', 'ardsnet-protocol-2008'],
  },
  {
    id: 'periop-adult',
    name: 'Normal adult (intraoperative)',
    tidalVolumeMlPerKgPbw: { target: 6, min: 6, max: 8, targetIsAssumed: true },
    plateauPressureLimit: 30,
    cautions: [
      'The source gives a 6-8 mL/kg PBW range and a plateau below 28-30 cmH2O; it does not name a single target, so the lower bound is used as the starting point.',
      'The 2019 expert consensus advises PEEP of 5 cmH2O or more, then individualized, and FiO2 0.4 after intubation, then the lowest FiO2 for SpO2 94% or higher. No preset default is supplied.',
    ],
    unsourced: ['Respiratory rate', 'I:E ratio'],
    sourceIds: ['esaic-periop-vent', 'young-bja-2019'],
  },
  {
    id: 'laparoscopic',
    name: 'Laparoscopic surgery',
    cautions: [
      'ESAIC/PROVE: Lung-protective ventilation (6-8 mL/kg PBW) and moderate PEEP (5-10 cmH2O) counteract cephalad diaphragm shift from pneumoperitoneum.',
      'CO2 pneumoperitoneum lowers thoracopulmonary compliance and raises PaCO2 by 15-25% (plateauing at 20-30 min). Adjust minute ventilation to maintain normocapnia/permissive mild hypercapnia.',
    ],
    unsourced: ['Preset tidal volume default', 'Preset respiratory rate', 'Preset PEEP'],
    sourceIds: ['esaic-prove-lap-2019', 'miller-6e'],
  },
  {
    id: 'obesity',
    name: 'Obesity / bariatric',
    cautions: [
      'PROBESE trial & ESPCOP: Tidal volume must be calculated strictly from PBW (7-8 mL/kg PBW), never actual weight.',
      'Higher PEEP (8-12 cmH2O with recruitment maneuvers) maintains functional residual capacity in obese patients; titrate against driving pressure and hemodynamics.',
    ],
    unsourced: ['Preset tidal volume default', 'Preset respiratory rate', 'Preset PEEP'],
    sourceIds: ['probese-protocol-2017'],
  },
  {
    id: 'one-lung',
    name: 'One-lung ventilation',
    cautions: ['ERAS/ESTS 2019: PEEP usually 5-10 cmH2O; FiO2 1.0 immediately before starting one-lung ventilation. The guideline gives no tidal volume, rate or I:E ratio.'],
    unsourced: ['Tidal volume', 'Respiratory rate', 'I:E ratio'],
    sourceIds: ['eras-ests-lung-2019'],
  },
  {
    id: 'pediatric',
    name: 'Pediatric',
    cautions: [
      'PALICC-2: In children without severe lung disease, target tidal volume 5-8 mL/kg based on ideal/predicted weight; plateau pressure limit <= 28 cmH2O (or <= 29-32 cmH2O with reduced chest wall compliance).',
      'The adult Devine PBW formula is not valid for children.',
    ],
    unsourced: ['Preset tidal volume default', 'Preset respiratory rate', 'Preset PEEP'],
    sourceIds: ['palicc-2-2023'],
  },
  {
    id: 'obstetric',
    name: 'Obstetric',
    cautions: [
      'SOAP/OAA: Target tidal volume 6-8 mL/kg PBW with baseline PEEP 5 cmH2O.',
      'Normal pregnancy has a baseline physiologic respiratory alkalosis (PaCO2 30-32 mmHg). Target EtCO2 around 30-32 mmHg to prevent severe maternal acidosis or fetal hypoperfusion.',
    ],
    unsourced: ['Preset tidal volume default', 'Preset respiratory rate', 'Preset PEEP'],
    sourceIds: ['soap-oaa-obs-2020'],
  },
];

export interface ReferenceItem {
  title: string;
  points: string[];
  sourceIds: string[];
}

/** Ventilator mode reference prompts. */
export const VENT_MODES: ReferenceItem[] = [
  { title: 'Volume control (VC)', points: ['Set tidal volume; pressure varies with compliance and resistance.'], sourceIds: ['app-generic', 'miller-vent-modes'] },
  { title: 'Pressure control (PC)', points: ['Set inspiratory pressure; tidal volume varies. Watch delivered volume.'], sourceIds: ['app-generic', 'miller-vent-modes'] },
  { title: 'Pressure support (PSV)', points: ['Patient-triggered, pressure-supported breaths; needs spontaneous effort and a backup plan.'], sourceIds: ['app-generic', 'miller-vent-modes'] },
  { title: 'SIMV', points: ['Set mandatory breaths synchronized to patient effort, with spontaneous breaths between.'], sourceIds: ['app-generic', 'miller-vent-modes'] },
];

/**
 * Reference values from consensus guidelines and literature.
 */
export const VENT_ADVANCED_REFERENCE: ReferenceItem[] = [
  {
    title: 'Baseline intraoperative IPPV (consensus)',
    points: [
      'Tidal volume 6-8 mL/kg predicted body weight (PBW), never actual weight.',
      'Limit FiO2 to 0.6 or less where possible to reduce absorption atelectasis.',
      'Respiratory rate 12-16 breaths/min (conventional IPPV: keep below 30/min).',
      'PEEP baseline 5-10 cmH2O. Plateau pressure below 30 cmH2O. Driving pressure (plateau minus PEEP) below 14-15 cmH2O.',
    ],
    sourceIds: ['young-bja-2019', 'esaic-periop-vent'],
  },
  {
    title: 'High-frequency and apneic modalities (Miller p. 1061, 1451)',
    points: [
      'HFPV: tidal volume 3-4 mL/kg at 60-100 breaths/min.',
      'Thoracic HFV: tidal volume below 2 mL/kg at 60-2400 breaths/min.',
      'Low-flow apneic oxygenation: 100% O2 with 5-10 cmH2O CPAP can maintain adequate PaO2 for at least 20 minutes, but PaCO2 rises about 6 mmHg in the first minute and 3-4 mmHg each minute after (reported PaCO2 103-250 mmHg, pH 6.72-6.97). The safe period is well below 10 minutes. Monitor SpO2.',
    ],
    sourceIds: ['miller-6e'],
  },
  {
    title: 'Apneic threshold and laparoscopy (Miller p. 168, 1702)',
    points: [
      'Apneic threshold: the highest PaCO2 at which a patient stays apneic is 4-5 mmHg below the resting PaCO2.',
      'CO2 pneumoperitoneum lowers thoracopulmonary compliance. PaCO2 rises by 15-25% and plateaus after 20-30 minutes.',
    ],
    sourceIds: ['miller-6e'],
  },
  {
    title: 'One-lung ventilation (ERAS/ESTS & thoracic consensus)',
    points: ['FiO2 1.0 immediately before starting OLV; pressure control preferred; plateau pressure below 30 cmH2O; PEEP 5-10 cmH2O to the dependent lung and CPAP to the operative lung if hypoxemic.'],
    sourceIds: ['eras-ests-lung-2019', 'miller-6e'],
  },
  {
    title: 'Respiratory mechanics terms (Anesthesiology 2025, p. 1211)',
    points: [
      'Driving pressure = plateau pressure - PEEP.',
      'Respiratory system compliance = tidal volume / (plateau pressure - PEEP).',
      'Recruited volume: volume gained above the baseline compliance curve. Recruitment-to-inflation (R/I) ratio: assesses recruitability.',
      'End-expiratory lung volume (EELV) and impedance (EELI): functional volume monitoring.',
      'Breath phase variables: trigger, limit and cycle (pressure, volume, flow or time).',
    ],
    sourceIds: ['aln-2025'],
  },
  {
    title: 'ARDS ventilation protocol (ARDSNet)',
    points: [
      'Start at 8 mL/kg predicted body weight, then reduce by 1 mL/kg at intervals of 2 hours or more to 6 mL/kg. Predicted body weight: men 50 + 2.3 x (height in inches - 60); women 45.5 + 2.3 x (height in inches - 60).',
      'Plateau pressure goal 30 cmH2O or less. Set respiratory rate not above 35 breaths/min, starting near the baseline minute ventilation. Minimum PEEP 5 cmH2O. Inspiration is kept shorter than expiration; no numeric ratio is given.',
      'Oxygenation goal: PaO2 55-80 mmHg or SpO2 88-95%.',
      'Lower PEEP / higher FiO2 table (FiO2 : PEEP in cmH2O): 0.3:5, 0.4:5, 0.4:8, 0.5:8, 0.5:10, 0.6:10, 0.7:10, 0.7:12, 0.7:14, 0.8:14, 0.9:14, 0.9:16, 0.9:18, 1.0:18-24.',
      'Higher PEEP / lower FiO2 table (FiO2 : PEEP in cmH2O): 0.3:5, 0.3:8, 0.3:10, 0.3:12, 0.3:14, 0.4:14, 0.4:16, 0.5:16, 0.5:18, 0.5-0.8:20, 0.8:22, 0.9:22, 1.0:22, 1.0:24.',
    ],
    sourceIds: ['ardsnet-protocol-2008'],
  },
  {
    title: 'Intraoperative lung-protective ventilation (2019 expert consensus)',
    points: [
      'Tidal volume 6-8 mL/kg predicted body weight (strong recommendation).',
      'Start PEEP at 5 cmH2O or more, then individualize it.',
      'FiO2 0.4 after intubation, then the lowest FiO2 that keeps SpO2 at 94% or higher (weak recommendation).',
      'No respiratory rate, I:E ratio or ventilation mode is recommended: the panel found the evidence lacking.',
    ],
    sourceIds: ['young-bja-2019'],
  },
  {
    title: 'FiO2 during general anesthesia: guidance differs',
    points: [
      'WHO 2016: 80% FiO2 intraoperatively for adults under general anesthesia with intubation, and if feasible for 2-6 hours afterwards (a strong recommendation in 2016; reported as changed to conditional in the 2018 update).',
      'The 2019 lung-protective consensus advises 0.4 after intubation, then the lowest FiO2 for SpO2 94% or higher. The two disagree, so no default is set here.',
    ],
    sourceIds: ['who-ssi-2018', 'young-bja-2019'],
  },
  {
    title: 'One-lung ventilation (ERAS/ESTS 2019)',
    points: [
      'PEEP is usually in the range of 5-10 cmH2O.',
      'FiO2 1.0 immediately before starting one-lung ventilation speeds collapse of the non-ventilated lung.',
      'Lowering tidal volume from the traditional 10 mL/kg ideal body weight to 4-6 mL/kg is described as likely less injurious; large trials are lacking.',
      'No respiratory rate, I:E ratio or plateau limit is given.',
    ],
    sourceIds: ['eras-ests-lung-2019'],
  },
  {
    title: 'Obesity: PROBESE trial settings (a trial protocol, not a recommendation)',
    points: [
      'Tidal volume 7 mL/kg predicted body weight, volume control, I:E 1:2.',
      'PEEP 12 cmH2O with recruitment maneuvers versus 4 cmH2O without.',
      'Respiratory rate adjusted for end-tidal CO2 35-45 mmHg; FiO2 at least 0.4 with SpO2 above 92%.',
      'Recruitment: tidal volume raised in 4 mL/kg steps until plateau pressure reaches 40-50 cmH2O, held for 3 breaths; peak pressure limit 55 cmH2O.',
    ],
    sourceIds: ['probese-protocol-2017'],
  },
];

export const VENT_ALARMS: ReferenceItem[] = [
  { title: 'High airway pressure', points: ['Treat as a real problem until excluded: check the patient, circuit and tube.'], sourceIds: ['app-generic', 'miller-vent-modes'] },
  { title: 'Low airway pressure / disconnection', points: ['Check the circuit connections, the cuff and the machine.'], sourceIds: ['app-generic', 'miller-vent-modes'] },
  { title: 'Low or high minute ventilation', points: ['Compare with your set tidal volume and rate; look for leak, obstruction or patient effort.'], sourceIds: ['app-generic', 'miller-vent-modes'] },
  { title: 'Apnea', points: ['Confirm capnography waveform and chest movement; start manual ventilation if absent.'], sourceIds: ['app-generic', 'miller-vent-modes'] },
];

export const VENT_TROUBLESHOOTING: ReferenceItem[] = [
  { title: 'High airway pressure', points: ['Disconnect and hand-ventilate to separate a patient problem from a machine problem.', 'Think: tube position or kink, secretions, bronchospasm, pneumothorax, abdominal or positioning cause, depth of block.'], sourceIds: ['app-generic', 'miller-vent-modes'] },
  { title: 'Low tidal volume', points: ['Check for leak (cuff, circuit, mask), disconnection, or a mode change.'], sourceIds: ['app-generic', 'miller-vent-modes'] },
  { title: 'Hypoxemia', points: ['Give 100% oxygen and confirm ventilation; check tube position and the circuit before other causes.'], sourceIds: ['app-generic', 'miller-vent-modes'] },
  { title: 'Hypercapnia', points: ['Check minute ventilation, circuit and absorbent; consider increased CO2 production.'], sourceIds: ['app-generic', 'miller-vent-modes'] },
  { title: 'Circuit leak', points: ['Leak-test the circuit and check the cuff; use a self-inflating bag as backup.'], sourceIds: ['app-generic', 'miller-vent-modes'] },
  { title: 'Auto-PEEP', points: ['Look for an expiratory flow that does not return to zero; allow longer expiration and disconnect briefly if the patient is unstable.'], sourceIds: ['app-generic', 'miller-vent-modes'] },
];
