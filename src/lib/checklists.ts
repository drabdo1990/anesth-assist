export interface ChecklistItem {
  id: string
  text: string
  detail?: string
  critical?: boolean
}

export const WHO_ITEMS: ChecklistItem[] = [
  { id: 'who-id', text: 'Patient identity, procedure, site and consent confirmed' },
  { id: 'who-site', text: 'Surgical site marked (if applicable)' },
  { id: 'who-machine', text: 'Anesthesia machine and medication check complete', detail: 'Leak test, backup ventilation, suction' },
  { id: 'who-ox', text: 'Pulse oximeter on and functioning' },
  { id: 'who-allergy', text: 'Known allergy?', critical: true },
  { id: 'who-airway', text: 'Difficult airway or aspiration risk? Equipment and help available', critical: true },
  { id: 'who-blood', text: 'Risk of blood loss > 500 mL: IV access and fluids planned' },
  { id: 'who-abx', text: 'Antibiotic prophylaxis given within the last 60 minutes, if indicated' },
  { id: 'who-drugs', text: 'Emergency drugs drawn up or immediately available', detail: 'Vasopressors, succinylcholine, atropine' },
  { id: 'who-pos', text: 'Positioning and pressure points checked' },
]

export const EXTUBATION_ITEMS: ChecklistItem[] = [
  { id: 'ext-reversal', text: 'Neuromuscular blockade reversed', detail: 'TOF ratio ≥ 0.9 on quantitative monitoring', critical: true },
  { id: 'ext-resp', text: 'Spontaneous breathing: adequate rate and tidal volume' },
  { id: 'ext-sat', text: 'SpO2 adequate on low FiO2; EtCO2 acceptable' },
  { id: 'ext-aware', text: 'Awake: eyes open, follows commands, or deep anesthetic level planned' },
  { id: 'ext-reflex', text: 'Airway reflexes present: cough, swallow' },
  { id: 'ext-hemo', text: 'Hemodynamically stable' },
  { id: 'ext-temp', text: 'Temperature acceptable; shivering controlled' },
  { id: 'ext-pain', text: 'Analgesia in place; nausea prophylaxis given' },
  { id: 'ext-suction', text: 'Oropharynx suctioned; throat pack removed' },
  { id: 'ext-rescue', text: 'Re-intubation equipment ready and difficult-airway plan known', critical: true },
]

export type PacuKey =
  | 'asa'
  | 'procedure'
  | 'anesthetic'
  | 'airway'
  | 'access'
  | 'meds'
  | 'fluids'
  | 'events'
  | 'pain'
  | 'nausea'
  | 'concerns'

export interface PacuField {
  key: PacuKey
  label: string
  multiline?: boolean
  placeholder?: string
}

export const PACU_FIELDS: PacuField[] = [
  { key: 'asa', label: 'ASA class', placeholder: 'e.g. 2' },
  { key: 'procedure', label: 'Procedure', placeholder: 'Procedure type (no names)' },
  { key: 'anesthetic', label: 'Anesthetic', placeholder: 'GA / regional / MAC' },
  { key: 'airway', label: 'Airway', placeholder: 'ETT / LMA / grade of view' },
  { key: 'access', label: 'Lines and access', placeholder: 'PIV x2, art line' },
  { key: 'meds', label: 'Key meds given', multiline: true, placeholder: 'Opioids, antiemetics, reversal, antibiotics' },
  { key: 'fluids', label: 'Fluids, EBL and urine output', placeholder: 'e.g. 1000 mL crystalloid, EBL 100 mL' },
  { key: 'events', label: 'Intra-op events', multiline: true },
  { key: 'pain', label: 'Pain score', placeholder: '0–10' },
  { key: 'nausea', label: 'Nausea / vomiting' },
  { key: 'concerns', label: 'Post-op concerns and plan', multiline: true },
]

export function buildPacuSummary(values: Partial<Record<PacuKey, string>>): string {
  const lines = PACU_FIELDS.flatMap((f) => {
    const v = (values[f.key] ?? '').trim()
    return v ? [`${f.label}: ${v}`] : []
  })
  return ['PACU HANDOFF', ...(lines.length ? lines : ['No details entered'])].join('\n')
}
