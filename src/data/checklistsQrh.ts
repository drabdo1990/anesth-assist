// Crisis checklists adapted from the Association of Anaesthetists Quick Reference Handbook (QRH),
// www.anaesthetists.org/qrh. The QRH is licensed CC BY-NC-SA 4.0, so the content of THIS FILE is shared
// under CC BY-NC-SA 4.0 (attribution, non-commercial, share-alike) and not under the repository's MIT licence.
// Steps are shortened and reworded; doses are as printed in the cited QRH page. By adapting the QRH we, not
// the Association, are responsible for this wording: check it against the original before clinical use.

import type { ChecklistRecord } from './types';

const ANA = ['qrh-anaphylaxis-2022'];
const MBL = ['qrh-blood-loss-2018'];
const BRO = ['qrh-bronchospasm-2023'];
const LAR = ['qrh-laryngospasm-2018'];

export const QRH_CHECKLISTS: ChecklistRecord[] = [
  {
    id: 'crisis-anaphylaxis',
    group: 'Crises',
    title: 'Anaphylaxis',
    note: 'Adapted from QRH 3-1 Anaphylaxis v5 (2022). Adrenaline doses are the QRH figures; ANZAAG-ANZCA gives graded doses (see the epinephrine reference on the Dosing tab). Follow your local protocol. Cardiac arrest: follow your arrest algorithm.',
    items: [
      { id: 'ana-help', text: 'Call for help and note the time. Stop or do not start non-essential surgery', sourceIds: ANA },
      { id: 'ana-kit', text: 'Send for the cardiac arrest trolley, anaphylaxis treatment pack and investigation pack', sourceIds: ANA },
      { id: 'ana-trigger', text: 'Remove possible triggers (antibiotics, neuromuscular blockers, patent blue, chlorhexidine, IV colloids). Maintain anaesthesia; change to an inhalational agent', sourceIds: ANA },
      { id: 'ana-oxygen', text: 'Give 100% oxygen and ensure adequate ventilation; secure the airway with a tracheal tube if needed', sourceIds: ANA },
      { id: 'ana-legs', text: 'Elevate the legs if hypotensive', sourceIds: ANA },
      { id: 'ana-cpr', text: 'Systolic pressure below 50 mmHg or cardiac arrest: start CPR immediately', sourceIds: ANA },
      { id: 'ana-adrenaline', text: 'Adrenaline, adult: IV 50 mcg (0.5 mL of 1:10 000), repeat as necessary; IM 0.5 mg (0.5 mL of 1:1000) if IV is not possible. Child: IV 1 mcg/kg (0.1 mL/kg of 1:100 000)', sourceIds: ANA },
      { id: 'ana-infusion', text: 'Consider an adrenaline infusion after three boluses (adult: 3 mg in 50 mL saline, start at 3 mL/h, titrate to a maximum of 40 mL/h)', sourceIds: ANA },
      { id: 'ana-resistant', text: 'Resistant hypotension: add another vasopressor (e.g. metaraminol, noradrenaline infusion, vasopressin adult 2 units repeated as necessary). Beta-blocked and unresponsive to adrenaline: glucagon adult 1 mg, repeat as necessary', sourceIds: ANA },
      { id: 'ana-fluid', text: 'Rapid IV crystalloid: 20 mL/kg initial bolus, repeated until hypotension resolves', sourceIds: ANA },
      { id: 'ana-bronchospasm', text: 'Persistent bronchospasm: open the Bronchospasm list', sourceIds: ANA },
      { id: 'ana-tryptase', text: 'Serum tryptase: 5-10 mL clotted blood as soon as the patient is stable; repeat at 1-2 hours and after 24 hours', sourceIds: ANA },
      { id: 'ana-steroid', text: 'Hydrocortisone and chlorphenamine are not part of acute treatment; consider steroids afterwards for refractory reactions or ongoing asthma/shock', sourceIds: ANA },
      { id: 'ana-after', text: 'Plan transfer to critical care; mark the allergy (band, notes, drug chart); arrange allergy referral and inform the patient and team', sourceIds: ANA },
    ],
  },
  {
    id: 'crisis-blood-loss',
    group: 'Crises',
    title: 'Massive blood loss',
    note: 'Adapted from QRH 3-2 Massive blood loss v2 (2018). This page has not been updated since 2018: use your local major haemorrhage protocol where its triggers or targets differ.',
    items: [
      { id: 'mbl-help', text: 'Call for help, tell the theatre team and note the time', sourceIds: MBL },
      { id: 'mbl-fio2', text: 'Increase FiO2; consider cautiously reducing anaesthetic agents', sourceIds: MBL },
      { id: 'mbl-access', text: 'Check and expose IV access', sourceIds: MBL },
      { id: 'mbl-control', text: 'Control obvious bleeding (pressure, uterotonics, tourniquet, haemostatic dressings)', sourceIds: MBL },
      { id: 'mbl-bank', text: 'Call the blood bank and activate the major haemorrhage protocol; say how fast and how much. Assign one person to liaise', sourceIds: MBL },
      { id: 'mbl-warm', text: 'Start active patient warming; use rapid infusion and fluid warming equipment', sourceIds: MBL },
      { id: 'mbl-plan', text: 'Agree the plan with surgical and nursing teams; consider interventional radiology and cell salvage; involve a haematologist for anticoagulants, bleeding disorders or uncontrolled non-surgical bleeding', sourceIds: MBL },
      { id: 'mbl-monitor', text: 'Monitor with point-of-care tests (Hb, lactate, coagulation) and lab tests including calcium and fibrinogen', sourceIds: MBL },
      { id: 'mbl-goals', text: 'Goals as printed (2018): Hb above 80 g/L; platelets above 75 x 10^9/L; PT and APTT below 1.5 x control; fibrinogen above 1.0 g/L; avoid acidosis, hypothermia, hypocalcaemia and hyperkalaemia', sourceIds: MBL },
      { id: 'mbl-calcium', text: 'Calcium, adult: 10 mL of 10% calcium chloride IV or 20 mL of 10% calcium gluconate IV. Child: 0.2 mL/kg chloride or 0.5 mL/kg gluconate', sourceIds: MBL },
      { id: 'mbl-txa', text: 'Consider tranexamic acid, adult: 1 g IV bolus, then 1 g over 8 hours (obstetric: repeat 1 g after 30 minutes instead). Child: 15 mg/kg then 2 mg/kg/h', sourceIds: MBL },
      { id: 'mbl-after', text: 'Plan ongoing care in an appropriate clinical area', sourceIds: MBL },
    ],
  },
  {
    id: 'crisis-bronchospasm',
    group: 'Crises',
    title: 'Bronchospasm',
    note: 'Adapted from QRH 3-4 Bronchospasm v3 (2023). Only first-line doses are listed here; the QRH page gives doses for ipratropium, adrenaline, ketamine, aminophylline and hydrocortisone.',
    items: [
      { id: 'bro-help', text: 'Call for help and tell the theatre team', sourceIds: BRO },
      { id: 'bro-oxygen', text: 'Give 100% oxygen. Stop surgery and other stimulation', sourceIds: BRO },
      { id: 'bro-examine', text: 'Expose and examine the chest. No wheeze may mean severe bronchospasm with no air movement', sourceIds: BRO },
      { id: 'bro-deepen', text: 'Deepen anaesthesia; avoid rapid increases of isoflurane or desflurane', sourceIds: BRO },
      { id: 'bro-exclude', text: 'Exclude mimics: mispositioned or blocked airway device, endobronchial or oesophageal intubation, blocked breathing system, pneumothorax, pulmonary oedema, laryngospasm', sourceIds: BRO },
      { id: 'bro-anaphylaxis', text: 'Consider anaphylaxis; if suspected open the Anaphylaxis list', sourceIds: BRO },
      { id: 'bro-salbutamol', text: 'First line: salbutamol by inhaler or nebuliser (adult and over 5 years 5 mg; under 5 years 2.5 mg). Remove the HME filter or nebulise downstream of it', sourceIds: BRO },
      { id: 'bro-second', text: 'Second line: salbutamol IV, adult 250 mcg diluted and given slowly. Magnesium IV 50 mg/kg (adult 2 g) over 20 minutes. Other drugs at clinician discretion', sourceIds: BRO },
      { id: 'bro-aspiration', text: 'Suspected aspiration: consider intubation and tracheal toilet; aspirate the stomach by nasogastric tube', sourceIds: BRO },
      { id: 'bro-vent', text: 'Ventilation: lengthen expiratory time, watch for breath stacking, consider pressure control and permissive hypercapnia', sourceIds: BRO },
      { id: 'bro-after', text: 'Chest X-ray when safe; plan post-procedure care', sourceIds: BRO },
    ],
  },
  {
    id: 'crisis-laryngospasm',
    group: 'Crises',
    title: 'Laryngospasm',
    note: 'Adapted from QRH 3-6 Laryngospasm and stridor v1 (2018). A correctly positioned tracheal tube rules out laryngospasm.',
    items: [
      { id: 'lar-help', text: 'Call for help and tell the theatre team', sourceIds: LAR },
      { id: 'lar-jaw', text: 'Jaw thrust; stop all other stimulation', sourceIds: LAR },
      { id: 'lar-clear', text: 'Remove airway devices and anything stimulating or blocking the airway (suction catheter, blood, vomit); look and suction if in doubt', sourceIds: LAR },
      { id: 'lar-cpap', text: 'CPAP with 100% oxygen by face mask. Avoid forceful inflation (it fills the stomach). Add an oral or nasal airway if the upper airway may not be clear', sourceIds: LAR },
      { id: 'lar-persist', text: 'If it persists: continue CPAP, deepen anaesthesia, give a neuromuscular blocker', sourceIds: LAR },
      { id: 'lar-drugs', text: 'Doses as printed: 0.25-0.5 mg/kg IV of propofol, rocuronium, atracurium or suxamethonium; suxamethonium IM (including tongue) 4 mg/kg', sourceIds: LAR },
      { id: 'lar-intubate', text: 'Consider tracheal intubation, especially if likely to recur', sourceIds: LAR },
      { id: 'lar-stomach', text: 'Decompress the stomach with a nasogastric tube', sourceIds: LAR },
      { id: 'lar-causes', text: 'Consider other causes: foreign body, infection, anaphylaxis, tumour, vocal cord paralysis, airway obstruction or compression', sourceIds: LAR },
      { id: 'lar-after', text: 'Plan a safe wake-up; continued support may be needed after aspiration or negative-pressure pulmonary oedema', sourceIds: LAR },
    ],
  },
];
