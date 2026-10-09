import { isWeightValid } from './biometrics'

export interface Step {
  id: string
  text: string
  detail?: string
  critical?: boolean
}

export function lastLipid(kg: number | null) {
  if (!isWeightValid(kg)) return null
  const uncappedBolusMl = 1.5 * kg
  const bolusMl = Math.min(uncappedBolusMl, 100)
  const infusionMlMin = 0.25 * kg
  return {
    bolusMl,
    bolusCapped: uncappedBolusMl > 100,
    uncappedBolusMl,
    infusionMlMin,
    infusionMlHr: infusionMlMin * 60,
    maxTotalMl: 12 * kg, // added: ASRA upper limit for total 20% lipid
  }
}

export function dantrolene(kg: number | null) {
  if (!isWeightValid(kg)) return null
  const doseMg = 2.5 * kg
  return {
    doseMg,
    vials: Math.ceil(doseMg / 20), // added: 20 mg vials
    volumeMl: (doseMg * 60) / 20, // added: each 20 mg vial reconstituted in 60 mL
    maxTotalMg: 10 * kg, // added: cumulative 10 mg/kg flag
  }
}

export function ryanodex(kg: number | null) {
  if (!isWeightValid(kg)) return null
  const doseMg = 2.5 * kg
  return {
    doseMg,
    vials: Math.ceil(doseMg / 250), // added: 250 mg vials
    volumeMl: doseMg / 50, // added: 50 mg/mL after reconstitution (250 mg in 5 mL)
  }
}

export const LAST_STEPS: Step[] = [
  { id: 'stop', text: 'STOP injecting local anesthetic', critical: true },
  { id: 'help', text: 'CALL FOR HELP; get the lipid emulsion and a LAST kit', critical: true },
  { id: 'airway', text: 'Airway: 100% O2, ventilate, secure the airway if needed' },
  { id: 'seizure', text: 'Seizures: benzodiazepine first', detail: 'Avoid propofol in large doses' },
  { id: 'bolus', text: 'Give 20% lipid emulsion bolus', detail: 'Over 2–3 min (dose above)', critical: true },
  { id: 'infusion', text: 'Start lipid infusion', detail: 'Rate above; continue ≥10 min after circulatory stability' },
  { id: 'repeat', text: 'No response: repeat bolus once or twice and double the infusion rate', detail: 'Keep within the 12 mL/kg total' },
  { id: 'arrest', text: 'Cardiac arrest: CPR; reduced-dose epinephrine ≤1 mcg/kg', detail: 'Avoid vasopressin, calcium-channel blockers, beta-blockers and further local anesthetic' },
  { id: 'monitor', text: 'Monitor ≥4–6 h (≥12 h if cardiac event); notify ICU and the LAST registry' },
]

export const MH_STEPS: Step[] = [
  { id: 'volatile', text: 'STOP volatile agents and succinylcholine', critical: true },
  { id: 'help', text: 'CALL FOR HELP; call the MH hotline', critical: true },
  { id: 'o2', text: 'Hyperventilate with 100% O2 at high flow (10 L/min or more)', critical: true },
  { id: 'circuit', text: 'Switch to a clean circuit or machine if possible; continue anesthesia with TIVA' },
  { id: 'dantrolene', text: 'Give dantrolene as soon as possible', detail: 'Dose above; repeat until signs resolve (cumulative ceiling shown)', critical: true },
  { id: 'cool', text: 'Active cooling: stop when temperature < 38 °C', detail: 'Cold IV saline, surface ice, cool lavage' },
  { id: 'k', text: 'Treat hyperkalaemia and arrhythmia; check K+, ABG, CK, lactate' },
  { id: 'urine', text: 'Insert a urinary catheter; keep urine output > 1 mL/kg/h (myoglobinuria)' },
  { id: 'icu', text: 'Admit to ICU; monitor for recurrence for ≥24 h' },
]

export interface CicoPlan {
  id: 'A' | 'B' | 'C' | 'D'
  title: string
  goal: string
  steps: Step[]
  failure: string
}

export const CICO_PLANS: CicoPlan[] = [
  {
    id: 'A',
    title: 'Plan A: Face-mask ventilation and tracheal intubation',
    goal: 'Maximum 3 attempts at laryngoscopy, then move on.',
    steps: [
      { id: 'a-pos', text: 'Optimise position and pre-oxygenate (ramped, 100% O2)' },
      { id: 'a-nmb', text: 'Confirm full neuromuscular blockade' },
      { id: 'a-ext', text: 'Optimise laryngoscopy: BURP, bougie, video-laryngoscope' },
      { id: 'a-three', text: 'Limit to 3 attempts; call for help after the first failure', critical: true },
    ],
    failure: 'Failed intubation: go to Plan B (supraglottic airway).',
  },
  {
    id: 'B',
    title: 'Plan B: Maintain oxygenation with a supraglottic airway',
    goal: 'Maximum 3 insertion attempts.',
    steps: [
      { id: 'b-sad', text: 'Insert a 2nd-generation supraglottic airway' },
      { id: 'b-cuff', text: 'Check cuff pressure; confirm capnography trace' },
      { id: 'b-ox', text: 'Oxygenation adequate? If yes, wake or intubate through the device per local plan' },
    ],
    failure: 'Cannot oxygenate through the device: go to Plan C.',
  },
  {
    id: 'C',
    title: 'Plan C: Final attempt at face-mask ventilation',
    goal: 'Last non-invasive attempt while preparing for Plan D.',
    steps: [
      { id: 'c-mask-ok', text: 'If face-mask ventilation is possible: oxygenate, then wake the patient (sugammadex 16 mg/kg reverses rocuronium; dose is on the Calculator tab)' },
      { id: 'c-mask-fail', text: 'If face-mask ventilation is NOT possible (CICO): confirm full neuromuscular blockade, give more neuromuscular blocker if needed, do NOT give sugammadex, go to Plan D', critical: true },
      { id: 'c-mask', text: 'Two-handed jaw thrust, oropharyngeal and nasopharyngeal airways' },
      { id: 'c-prep', text: 'Open the front-of-neck kit now', critical: true },
    ],
    failure: 'CICO persists: go to Plan D immediately.',
  },
  {
    id: 'D',
    title: 'Plan D: Emergency front of neck access (eFONA)',
    goal: 'Scalpel-bougie-tube technique.',
    steps: [
      { id: 'd-announce', text: 'Announce "CICO: performing front-of-neck access"', critical: true },
      { id: 'd-neck', text: 'Extend the neck; palpate the laryngeal handshake' },
      { id: 'd-cut', text: 'Scalpel: transverse stab through the cricothyroid membrane, rotate the blade 90°', critical: true },
      { id: 'd-bougie', text: 'Slide the bougie along the blade into the trachea; railroad a 6.0 cuffed tube' },
      { id: 'd-confirm', text: 'Inflate the cuff, ventilate, confirm with capnography' },
    ],
    failure: 'If the neck is not palpable: vertical midline incision first, then proceed.',
  },
]
