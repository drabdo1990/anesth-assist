// Generic OR checklists use 'app-generic'. The Fasting / NPO checklist is sourced to named guidelines.
// Replace or extend these with your institutional checklists (tag them 'local-protocol').
// Items are anonymous: progress is stored without any patient data.

import { QRH_CHECKLISTS } from './checklistsQrh';
import type { ChecklistGroup, ChecklistRecord } from './types';

/** Display order of the Lists-tab groups. */
export const CHECKLIST_GROUPS: ChecklistGroup[] = ['Pre-op', 'Machine', 'Airway', 'Ventilation', 'Regional', 'Intra/post-op', 'Crises'];

const generic = ['app-generic'];

const BASE_CHECKLISTS: ChecklistRecord[] = [
  {
    id: 'pre-induction',
    group: 'Pre-op',
    title: 'Pre-induction',
    items: [
      { id: 'pre-patient', text: 'Patient identity confirmed', sourceIds: generic },
      { id: 'pre-procedure', text: 'Procedure confirmed', sourceIds: generic },
      { id: 'pre-side', text: 'Side / site confirmed (if applicable)', sourceIds: generic },
      { id: 'pre-consent', text: 'Consent confirmed', sourceIds: generic },
      { id: 'pre-fasting', text: 'Fasting status confirmed', sourceIds: generic },
      { id: 'pre-allergies', text: 'Allergies reviewed', sourceIds: generic },
      { id: 'pre-airway-assess', text: 'Airway assessment done', sourceIds: generic },
      { id: 'pre-iv', text: 'IV access adequate', sourceIds: generic },
      { id: 'pre-monitoring', text: 'Monitoring applied and working', sourceIds: generic },
      { id: 'pre-blood', text: 'Blood availability confirmed (if needed)', sourceIds: generic },
      { id: 'pre-equipment', text: 'Equipment check complete', sourceIds: generic },
      { id: 'pre-drugs', text: 'Drugs prepared and labeled', sourceIds: generic },
      { id: 'pre-suction', text: 'Suction available and working', sourceIds: generic },
      { id: 'pre-dif-airway', text: 'Difficult-airway equipment available', sourceIds: generic },
    ],
  },
  {
    id: 'fasting-npo',
    group: 'Pre-op',
    title: 'Fasting / NPO',
    note: 'Draft for clinician review. Times are minimum fasting intervals before anesthesia or sedation for healthy elective patients; special scenarios and local protocols change them. Avoid routine NPO after midnight. GLP-1 guidance conflicts: use one locally adopted protocol, not a mix.',
    items: [
      {
        id: 'fasting-assessment',
        text: 'Record the time, type and amount of last oral intake, procedure urgency and aspiration risk. Fasting does not guarantee an empty stomach.',
        sourceIds: ['adult-fasting-2026', 'acep-unscheduled-2026'],
      },
      {
        id: 'fasting-solids',
        text: 'Solid food / light meal: at least 6 h. Large, fatty, fried or meat-containing meals: at least 8 h; assess amount and type.',
        sourceIds: ['asa-fasting-2017', 'adult-fasting-2026'],
      },
      {
        id: 'fasting-nonclear',
        text: 'Non-clear liquids: at least 6 h, including milk, milk products, meal-replacement drinks and enteral formulas.',
        sourceIds: ['asa-fasting-2017', 'adult-fasting-2026'],
      },
      {
        id: 'fasting-clear',
        text: 'Clear liquids: until 2 h before anesthesia or sedation. Examples: water, pulp-free clear juice, tea/coffee, lemonade, clear carbohydrate drinks; no alcohol. The 2026 international consensus counts tea/coffee with milk up to one-fifth of total volume as clear; otherwise follow the local definition.',
        sourceIds: ['asa-fasting-2017', 'adult-fasting-2026'],
      },
      {
        id: 'fasting-clear-liberal',
        text: 'Clear liquids <2 h, including "Sip Til Send": only under an explicit institutional protocol; not an individual clinician shortcut.',
        sourceIds: ['adult-fasting-2026'],
      },
      {
        id: 'fasting-carbohydrate',
        text: 'Healthy adults: simple or complex carbohydrate clear liquids may be taken until 2 h; up to 400 mL is considered an appropriate volume (ASA 2023). Protein-added clear liquids are not preferred for lack of evidence; do not confuse them with milk or meal-replacement drinks, which need 6 h.',
        sourceIds: ['asa-fasting-2023', 'adult-fasting-2026'],
      },
      {
        id: 'fasting-gum',
        text: 'Gum or lollipops may be used until transfer under the 2026 adult consensus, but remove before induction or sedation. Do not delay a healthy adult solely because of gum (ASA 2023).',
        sourceIds: ['asa-fasting-2023', 'adult-fasting-2026'],
      },
      {
        id: 'fasting-peds-clear',
        text: 'Children: allow clear liquids as close to 2 h as possible. ASA 2023 found insufficient evidence to choose 1 h over 2 h; use a shorter interval only under a pediatric protocol or clinical judgment.',
        sourceIds: ['asa-fasting-2023'],
      },
      {
        id: 'fasting-breast-milk',
        text: 'Neonates and infants: breast milk for at least 4 h.',
        sourceIds: ['asa-fasting-2017'],
      },
      {
        id: 'fasting-formula',
        text: 'Infants: formula or nonhuman milk for at least 6 h.',
        sourceIds: ['asa-fasting-2017'],
      },
      {
        id: 'fasting-enteral',
        text: 'Enteral feeding: at least 6 h, but preprocedural discontinuation is not required for most patients with an already secure airway (for example, cuffed tracheostomy or tracheal tube in situ).',
        sourceIds: ['adult-fasting-2026'],
      },
      {
        id: 'fasting-risk-conditions',
        text: 'Do not apply healthy-patient intervals automatically with: significant uncontrolled reflux or supine regurgitation, hiatal hernia, Zenker diverticulum, achalasia or stricture; previous gastric surgery; gastroparesis; diabetes; end-stage kidney disease; opioid use; GI obstruction or acute abdomen; pregnancy; obesity; frailty/comorbidity; emergency status. Individualize the aspiration plan.',
        sourceIds: ['asa-fasting-2023', 'adult-fasting-2026'],
      },
      {
        id: 'fasting-bariatric',
        text: 'Obesity or previous gastric/bariatric surgery: individualize fasting and aspiration risk; gastric ultrasound may be technically harder after gastric surgery.',
        sourceIds: ['asa-fasting-2023', 'adult-fasting-2026'],
      },
      {
        id: 'fasting-glp-assessment',
        text: 'GLP-1 RA or tirzepatide: document drug, dose, schedule, last dose, escalation phase, GI symptoms and other delayed-emptying risks. Most patients continue therapy rather than routinely withholding it; use the locally adopted protocol.',
        sourceIds: ['glp1-multisociety-2024', 'glp1-spaqi-2025'],
      },
      {
        id: 'fasting-glp-symptoms',
        text: 'GLP-1 escalation phase or significant GI symptoms: defer elective care until resolved (2024 multisociety). SPAQI 2025 defines significant as severe nausea, vomiting or inability to tolerate oral intake (not fullness or early satiety) and requires prescriber review before elective care.',
        sourceIds: ['glp1-multisociety-2024', 'glp1-spaqi-2025'],
      },
      {
        id: 'fasting-glp-high-risk',
        text: 'Higher GLP-1 dose or another cause of delayed emptying: consider a 24 h liquid-only diet, aspiration-plan changes and trained gastric ultrasound; delay in selected cases when risk is expected to decrease (2024 multisociety).',
        sourceIds: ['glp1-multisociety-2024'],
      },
      {
        id: 'fasting-glp-spaqi',
        text: 'If the SPAQI 2025 protocol is locally adopted: continue GLP-1 RA if there are no significant GI symptoms; solids 24 h (clear liquids only); clear liquids <10% glucose 4 h and ≥10% glucose 8 h. Do not mix these times with another GLP-1 protocol.',
        sourceIds: ['glp1-spaqi-2025'],
      },
      {
        id: 'fasting-elective-obstetric',
        text: 'Uncomplicated elective cesarean or obstetric surgery: moderate clear liquids until 2 h; solids 6-8 h depending on fat content (ASA 2016).',
        sourceIds: ['asa-obstetric-2016'],
      },
      {
        id: 'fasting-labor',
        text: 'Active labor: avoid solid food; encourage clear liquids, especially electrolyte-containing drinks, in uncomplicated labor. High-risk patients may need stricter limits, and never deny neuraxial analgesia or anesthesia solely for NPO status.',
        sourceIds: ['asa-labor-2022'],
      },
      {
        id: 'fasting-emergency',
        text: 'Emergency or urgent anesthesia: elective minimums do not apply automatically. Document last intake, assess aspiration risk and let urgency plus the anesthesia plan determine any delay.',
        sourceIds: ['asa-fasting-2023', 'adult-fasting-2026'],
      },
      {
        id: 'fasting-unscheduled-sedation',
        text: 'Unscheduled procedural sedation: assess timing and nature of intake plus aspiration risk; do not delay urgent or emergent procedures solely for fasting. Refer moderate-risk patients for prompt anesthesia care when available (ACEP 2026).',
        sourceIds: ['acep-unscheduled-2026'],
      },
      {
        id: 'fasting-pocus',
        text: 'Gastric ultrasound: a trained provider may use it when additional information would change management; do not treat it as routine screening or a guarantee of an empty stomach.',
        sourceIds: ['adult-fasting-2026'],
      },
      {
        id: 'fasting-bowel-prep',
        text: 'Bowel preparation or a procedure requiring specific gastric conditions: follow the procedure-specific diet and fasting instructions; routine intervals are not a substitute.',
        sourceIds: ['adult-fasting-2026'],
      },
    ],
  },
  {
    id: 'machine-check',
    group: 'Machine',
    title: 'Anesthesia machine / breathing system',
    note: 'Use your institutional checklist. This is a generic structure only and contains no device-specific steps.',
    items: [
      { id: 'mach-local', text: 'Institutional pre-use checklist completed', sourceIds: generic },
      { id: 'mach-power-gas', text: 'Power and gas supply confirmed', sourceIds: generic },
      { id: 'mach-circuit', text: 'Breathing system assembled and leak-tested', sourceIds: generic },
      { id: 'mach-vent', text: 'Ventilator working', sourceIds: generic },
      { id: 'mach-scavenge', text: 'Scavenging connected', sourceIds: generic },
      { id: 'mach-alarms', text: 'Monitors and alarms working', sourceIds: generic },
      { id: 'mach-backup', text: 'Backup means of ventilation available', sourceIds: generic },
    ],
  },
  {
    id: 'intra-op',
    group: 'Intra/post-op',
    title: 'Intraoperative safety prompts',
    items: [
      { id: 'intra-position', text: 'Positioning and pressure points', sourceIds: generic },
      { id: 'intra-temp', text: 'Temperature', sourceIds: generic },
      { id: 'intra-fluids', text: 'Fluids', sourceIds: generic },
      { id: 'intra-blood', text: 'Blood loss', sourceIds: generic },
      { id: 'intra-nmb', text: 'Neuromuscular blockade monitoring', sourceIds: generic },
      { id: 'intra-abx', text: 'Antibiotic redosing due?', sourceIds: generic },
      { id: 'intra-vent', text: 'Ventilation checks', sourceIds: generic },
      { id: 'intra-infusions', text: 'Vasopressor and infusion checks', sourceIds: generic },
    ],
  },
  {
    id: 'emergence',
    group: 'Intra/post-op',
    title: 'Emergence and extubation',
    items: [
      { id: 'em-reversal', text: 'Reversal given or blockade resolved', sourceIds: generic },
      { id: 'em-ventilation', text: 'Adequate spontaneous ventilation', sourceIds: generic },
      { id: 'em-oxygenation', text: 'Adequate oxygenation', sourceIds: generic },
      { id: 'em-reflexes', text: 'Airway protective reflexes present', sourceIds: generic },
      { id: 'em-hemo', text: 'Hemodynamically stable', sourceIds: generic },
      { id: 'em-temp', text: 'Temperature acceptable', sourceIds: generic },
      { id: 'em-suction', text: 'Suction available', sourceIds: generic },
      { id: 'em-risk', text: 'Extubation risk factors identified', sourceIds: generic },
    ],
  },
];

// Notebook-sourced checklists (sections 5.2-5.4). Item text is quoted from the notebook; no step is added to it.
const ASA_MONITORING = ['asa-1986', 'miller-6e'];
const NORA = ['asa-1994-nora', 'miller-6e'];

const NOTEBOOK_CHECKLISTS: ChecklistRecord[] = [
  {
    id: 'two-bag-test',
    group: 'Machine',
    title: 'Pre-case "two-bag" test (AAGBI 2012)',
    note: 'Do this after the breathing system, vaporisers and ventilator have been checked individually (Fundamentals of Anesthesia 4e, Ch 46, p. 905). Follow your institutional checklist for your machine.',
    items: [
      { id: 'twobag-attach', text: 'Attach the patient end of the breathing system (including angle piece and filter) to a test lung or bag', sourceIds: ['aagbi-2012'] },
      { id: 'twobag-manual', text: 'Set fresh gas flow to 5 L/min and ventilate manually. Check the whole breathing system is patent and the unidirectional valves are moving. Check the APL valve by squeezing both bags', sourceIds: ['aagbi-2012'] },
      { id: 'twobag-vent-vaporisers', text: 'Turn on the ventilator to ventilate the test lung. Turn off the fresh gas flow, or reduce it to a minimum. Open and close each vaporiser in turn. There should be no loss of volume in the system', sourceIds: ['aagbi-2012'] },
    ],
  },
  {
    id: 'fda-ventilator-check',
    group: 'Machine',
    title: 'Pre-case ventilator check (FDA 1993 excerpts)',
    note: 'Excerpts from the FDA 1993 apparatus checkout (step 12 ventilator test, step 13 monitors). The vaporizer interlock, fit, fill and leak item was transcribed earlier and was not located in the notebook text retrieved: confirm it against the full checkout. Follow your institutional checklist for your machine.',
    items: [
      { id: 'fda-second-bag', text: 'Attach a second breathing bag to the Y-piece', sourceIds: ['fda-1993'] },
      { id: 'fda-bellows', text: 'Ventilator ON: bellows deliver the appropriate tidal volume on inspiration and fill completely on expiration', sourceIds: ['fda-1993'] },
      { id: 'fda-valves', text: 'Verify unidirectional valves, vaporizer interlocks, and vaporizer fit, fill and leaks', sourceIds: ['fda-1993'] },
      { id: 'fda-analyzers', text: 'Check and calibrate the capnometer and O2 analyzer', sourceIds: ['fda-1993'] },
    ],
  },
  {
    id: 'asa-monitoring',
    group: 'Intra/post-op',
    title: 'ASA basic monitoring standards',
    note: 'Transcribed from the project notebook (Miller 6e p. 2027).',
    items: [
      { id: 'asa-presence', text: 'Qualified anesthesia personnel continuously present', sourceIds: ASA_MONITORING },
      { id: 'asa-oxygenation', text: 'Oxygenation: inspired O2 low-limit alarm and SpO2', sourceIds: ASA_MONITORING },
      { id: 'asa-ventilation', text: 'Ventilation: ETCO2 and disconnect alarm', sourceIds: ASA_MONITORING },
      { id: 'asa-circulation', text: 'Circulation: ECG and NIBP at intervals of 5 minutes at most', sourceIds: ASA_MONITORING },
      { id: 'asa-temperature', text: 'Temperature evaluated', sourceIds: ASA_MONITORING },
    ],
  },
  {
    id: 'nora-mri',
    group: 'Machine',
    title: 'Non-operating-room anesthesia (NORA / MRI)',
    note: 'Transcribed from the project notebook (Miller 6e p. 2025).',
    items: [
      { id: 'nora-o2', text: 'Dedicated reliable O2 source plus a full backup cylinder', sourceIds: NORA },
      { id: 'nora-suction', text: 'Reliable suction and scavenging', sourceIds: NORA },
      { id: 'nora-monitors', text: 'Full ASA monitors and a self-inflating hand resuscitator bag (AMBU)', sourceIds: NORA },
      { id: 'nora-mr', text: 'MR Safe / MR Conditional / MR Unsafe status verified for all equipment', sourceIds: NORA },
    ],
  },
];

// Checklists restating values the app already cites elsewhere (Airway, Vent and Dosing tabs). No new clinical value is introduced here.
const VENT_GENERIC = ['app-generic', 'miller-vent-modes'];
const LA_LIMITS = ['label-lidocaine', 'rosenberg-2004'];

const CLINICAL_CHECKLISTS: ChecklistRecord[] = [
  {
    id: 'airway-plan',
    group: 'Airway',
    title: 'Airway management plan',
    note: 'Principles from the ASA 2022 difficult airway guideline as already shown on the Airway tab. If oxygenation fails, open SOS > CICO for Plans A-D.',
    items: [
      { id: 'awp-sizes', text: 'Device sizes chosen and checked for this patient (Airway tab)', sourceIds: generic },
      { id: 'awp-preox', text: 'Preoxygenate and keep supplemental oxygen going throughout airway management', sourceIds: ['asa-airway-2022'] },
      { id: 'awp-capno', text: 'Confirm tracheal intubation with capnography', sourceIds: ['asa-airway-2022'] },
      { id: 'awp-attempts', text: 'Limit repeated attempts at any one technique; track time and oxygen saturation', sourceIds: ['asa-airway-2022'] },
      { id: 'awp-escalate', text: 'Escalate early when ventilation or oxygenation fails; do not delay invasive airway access when CICO is declared', sourceIds: ['asa-airway-2022'] },
    ],
  },
  {
    id: 'vent-lung-protective',
    group: 'Ventilation',
    title: 'Lung-protective setup',
    note: 'Intraoperative settings from the 2019 international expert consensus. It recommends no respiratory rate, I:E ratio or mode. Use the Vent tab for the tidal volume in mL.',
    items: [
      { id: 'vlp-pbw', text: 'Tidal volume set from predicted body weight, never actual weight (Vent tab)', sourceIds: ['young-bja-2019'] },
      { id: 'vlp-vt', text: 'Tidal volume 6-8 mL/kg predicted body weight', sourceIds: ['young-bja-2019'] },
      { id: 'vlp-peep', text: 'PEEP started at 5 cmH2O or more, then individualized', sourceIds: ['young-bja-2019'] },
      { id: 'vlp-fio2', text: 'FiO2 0.4 after intubation, then the lowest FiO2 that keeps SpO2 at 94% or higher', sourceIds: ['young-bja-2019'] },
      { id: 'vlp-pressures', text: 'Plateau pressure below 30 cmH2O; driving pressure (plateau minus PEEP) below 14-15 cmH2O', sourceIds: ['young-bja-2019', 'esaic-periop-vent'] },
    ],
  },
  {
    id: 'vent-olv',
    group: 'Ventilation',
    title: 'One-lung ventilation',
    note: 'From the ERAS/ESTS 2019 lung surgery guideline, which gives no respiratory rate, I:E ratio or plateau limit and notes that large trials of low tidal volume are lacking.',
    items: [
      { id: 'olv-fio2', text: 'FiO2 1.0 immediately before starting one-lung ventilation (speeds collapse of the non-ventilated lung)', sourceIds: ['eras-ests-lung-2019'] },
      { id: 'olv-vt', text: 'Tidal volume lowered towards 4-6 mL/kg ideal body weight (described as likely less injurious than the traditional 10 mL/kg)', sourceIds: ['eras-ests-lung-2019'] },
      { id: 'olv-peep', text: 'PEEP usually in the range of 5-10 cmH2O', sourceIds: ['eras-ests-lung-2019'] },
    ],
  },
  {
    id: 'vent-high-pressure',
    group: 'Ventilation',
    title: 'High airway pressure',
    note: 'Generic troubleshooting prompts, as on the Vent tab. Treat the alarm as a real problem until excluded.',
    items: [
      { id: 'vhp-hand', text: 'Disconnect and hand-ventilate to separate a patient problem from a machine problem', sourceIds: VENT_GENERIC },
      { id: 'vhp-tube', text: 'Tube position or kink, and secretions, checked', sourceIds: VENT_GENERIC },
      { id: 'vhp-lungs', text: 'Bronchospasm and pneumothorax considered', sourceIds: VENT_GENERIC },
      { id: 'vhp-external', text: 'Abdominal or positioning cause, and depth of block, considered', sourceIds: VENT_GENERIC },
      { id: 'vhp-autopeep', text: 'Auto-PEEP: expiratory flow returns to zero; if not, allow longer expiration and disconnect briefly if unstable', sourceIds: VENT_GENERIC },
    ],
  },
  {
    id: 'vent-hypoxemia',
    group: 'Ventilation',
    title: 'Hypoxemia on the ventilator',
    note: 'Generic troubleshooting prompts, as on the Vent tab.',
    items: [
      { id: 'vhx-o2', text: 'Give 100% oxygen and confirm ventilation (capnography waveform and chest movement)', sourceIds: VENT_GENERIC },
      { id: 'vhx-tube', text: 'Tube position and the circuit checked before other causes', sourceIds: VENT_GENERIC },
      { id: 'vhx-leak', text: 'Leak or disconnection excluded (cuff, circuit, mask); self-inflating bag available as backup', sourceIds: VENT_GENERIC },
      { id: 'vhx-manual', text: 'No waveform or chest movement: start manual ventilation', sourceIds: VENT_GENERIC },
    ],
  },
  {
    id: 'regional-la-dose',
    group: 'Regional',
    title: 'Local anesthetic dose check',
    note: 'Use Dosing > Local anesthetics for the maximum in mg for this patient. If toxicity is suspected, open SOS > LAST.',
    items: [
      { id: 'lad-max', text: 'Maximum dose worked out for this agent and weight, plain or with epinephrine, before drawing up', sourceIds: LA_LIMITS },
      { id: 'lad-combined', text: 'More than one local anesthetic: the fractions of each maximum add up to less than 1.0', sourceIds: generic },
      { id: 'lad-document', text: 'Total cumulative local anesthetic dose discussed with the team and documented', sourceIds: ['cas-2025'] },
      { id: 'lad-lido-repeat', text: 'Lidocaine by continuous epidural or caudal: maximum dose not repeated at intervals under 90 minutes', sourceIds: ['label-lidocaine'] },
      { id: 'lad-lipid', text: 'Location of the 20% lipid emulsion / LAST kit known', sourceIds: ['asra-last-2020'] },
    ],
  },
  {
    id: 'neuraxial-prep',
    group: 'Regional',
    title: 'Spinal / epidural preparation',
    note: 'Generic structure only; follow your institutional neuraxial and anticoagulation policy. Reference regimens are for a 70 kg adult as printed and are never scaled by weight.',
    items: [
      { id: 'nxp-consent', text: 'Consent, indication and contraindications reviewed', sourceIds: generic },
      { id: 'nxp-coag', text: 'Coagulation status and anticoagulant timing checked against local policy', sourceIds: generic },
      { id: 'nxp-ready', text: 'IV access, monitoring, oxygen, suction and resuscitation drugs ready', sourceIds: generic },
      { id: 'nxp-regimen', text: 'Agent, concentration, volume and baricity checked against a reference regimen (Dosing tab)', sourceIds: ['miller-6e'] },
      { id: 'nxp-asepsis', text: 'Aseptic technique and drug labels confirmed', sourceIds: generic },
    ],
  },
];

export const CHECKLISTS: ChecklistRecord[] = [...BASE_CHECKLISTS, ...NOTEBOOK_CHECKLISTS, ...CLINICAL_CHECKLISTS, ...QRH_CHECKLISTS];

/** Selectable options for the handoff generator. These are categories, not clinical values. */
export const HANDOFF_OPTIONS = {
  asaStatus: ['I', 'II', 'III', 'IV', 'V', 'VI', 'I-E', 'II-E', 'III-E', 'IV-E', 'V-E'],
  airway: ['Face mask', 'Supraglottic airway', 'Oral ETT', 'Nasal ETT', 'Double-lumen tube', 'Tracheostomy', 'Own airway'],
  maintenance: ['Volatile', 'TIVA', 'Regional / neuraxial', 'MAC / sedation', 'Combined'],
  procedureCategories: ['General surgery', 'Orthopedic', 'Obstetric', 'Cardiac', 'Thoracic', 'Neuro', 'ENT', 'Urology', 'Vascular', 'Pediatric', 'Other'],
} as const;
