// Chronic cardiac and antithrombotic drug statements from the 2024 AHA/ACC and 2022 ESC non-cardiac surgery guidelines. Each line
// is the guideline's own sentence, copied from its full text on 2026-11-17; ESC lines carry the class and level printed in its
// recommendation tables. Nothing is rounded, merged or inferred. These are for cardiac risk and thrombosis, not for the timing
// of a spinal or epidural (see the ASRA rules).

import type { PeriopMedRule } from './periopMeds';

export const BETA_BLOCKER_RULE: PeriopMedRule = {
  id: 'beta-blocker',
  drugClass: 'Beta-blockers',
  section: 'Cardiac drugs: AHA/ACC and ESC',
  action: 'continue',
  summary:
    'Continue chronic therapy through surgery; do not start one routinely, or on the day of surgery.',
  why:
    'AHA/ACC: acutely discontinuing beta blockers for long-term indications is harmful, and initiating them on the day of surgery is harmful, particularly at higher doses.',
  drugs: [
    {
      id: 'beta-blocker-aha',
      name: 'AHA/ACC 2024',
      timings: [
        { text: 'In patients on stable doses of beta blockers undergoing NCS, beta blockers should be continued through the perioperative period as appropriate based on the clinical circumstances.' },
        { text: 'In patients scheduled for elective NCS who have a new indication for beta blockade, beta blockers may be initiated far enough before surgery (optimally >7 days) to permit assessments of tolerability and drug titration if needed.' },
        { text: 'In patients undergoing NCS and with no immediate need for beta blockers, beta blockers should not be initiated on the day of surgery due to increased risk for postoperative mortality.' },
      ],
      sourceId: 'aha-acc-periop-2024',
    },
    {
      id: 'beta-blocker-esc',
      name: 'ESC 2022',
      timings: [
        { text: 'Peri-operative continuation of beta-blockers is recommended in patients currently receiving this medication. (Class I, level B)' },
        { text: 'Routine initiation of beta-blocker peri-operatively is not recommended. (Class III, level A)' },
      ],
      sourceId: 'esc-ncs-2022',
    },
  ],
  sourceIds: ['aha-acc-periop-2024', 'esc-ncs-2022'],
};

export const STATIN_RULE: PeriopMedRule = {
  id: 'statin',
  drugClass: 'Statins',
  section: 'Cardiac drugs: AHA/ACC and ESC',
  action: 'continue',
  summary:
    'Continue statins through surgery.',
  why:
    'ESC: the long-term use of statins in patients with cardiovascular disease or high risk of it is well established, while trials of starting a statin in the perioperative period are scarce.',
  drugs: [
    {
      id: 'statin-aha',
      name: 'AHA/ACC 2024',
      timings: [
        { text: 'In patients currently on statins and scheduled for NCS, continuation of statin therapy is recommended to reduce the risk of MACE.' },
        { text: 'In statin-naïve adult patients who meet criteria for statin use based on ASCVD history or 10-year risk assessment and are scheduled for NCS, perioperative initiation of statin is recommended with intention of long-term use.' },
      ],
      sourceId: 'aha-acc-periop-2024',
    },
    {
      id: 'statin-esc',
      name: 'ESC 2022',
      timings: [
        { text: 'In patients already on statins, it is recommended to continue statins during the peri-operative period. (Class I, level B)' },
      ],
      sourceId: 'esc-ncs-2022',
    },
  ],
  sourceIds: ['aha-acc-periop-2024', 'esc-ncs-2022'],
};

export const RAAS_RULE: PeriopMedRule = {
  id: 'raas-inhibitor',
  drugClass: 'ACE inhibitors, ARBs and other RAAS inhibitors',
  section: 'Cardiac drugs: AHA/ACC and ESC',
  action: 'individualise',
  summary:
    'The two guidelines differ by indication: continue for heart failure with reduced ejection fraction; consider withholding in hypertension or without heart failure.',
  drugs: [
    {
      id: 'raas-aha',
      name: 'AHA/ACC 2024',
      timings: [
        { text: 'In patients on chronic RAASi for HFrEF, perioperative continuation is reasonable.' },
      ],
      sourceId: 'aha-acc-periop-2024',
    },
    {
      id: 'raas-esc',
      name: 'ESC 2022',
      timings: [
        { text: 'Transient discontinuation of ACEIs or ARBs before NCS in hypertensive patients should be considered. (Class IIa)' },
        { text: 'In patients without HF, withholding RAAS inhibitors on the day of NCS should be considered to prevent peri-operative hypotension. (Class IIa)' },
      ],
      sourceId: 'esc-ncs-2022',
    },
  ],
  sourceIds: ['aha-acc-periop-2024', 'esc-ncs-2022'],
};

export const PCI_ANTIPLATELET_RULE: PeriopMedRule = {
  id: 'antiplatelet-pci',
  drugClass: 'Antiplatelet drugs after a coronary stent (aspirin, clopidogrel, prasugrel, ticagrelor)',
  section: 'Cardiac drugs: AHA/ACC and ESC',
  action: 'individualise',
  summary:
    'Keep aspirin if the bleeding risk allows; the timing of surgery and any P2Y12 interruption depend on the stent and are decided by the surgeon, anaesthesiologist and cardiologist together.',
  cautions: [
    'These statements are about cardiac and thrombotic risk. For the timing of a spinal, epidural or deep block, use the ASRA cards.',
  ],
  why:
    'AHA/ACC: the risk of perioperative stent thrombosis is greatest in the first 4 to 6 weeks after PCI, with excess risks that decline over time but persist to 6 months.',
  drugs: [
    {
      id: 'antiplatelet-aha',
      name: 'AHA/ACC 2024',
      timings: [
        { text: 'In patients with prior PCI undergoing NCS, it is recommended to continue aspirin∗ (75-100 mg), if possible, to reduce the risk of cardiac events.' },
        { text: '∗ Platelet adenosine diphosphate receptor (P2Y12) monotherapy may be considered if surgical bleeding risks are acceptable or if aspirin is not tolerated.' },
        { text: 'In patients with recent coronary artery balloon angioplasty without stent placement, elective NCS should be delayed for a minimum of 14 days to minimize perioperative MACE.' },
        { text: 'In patients with DES-PCI placed for CCD who require elective NCS with interruption of ≥1 antiplatelet agents, it is reasonable to delay surgery for ≥6 months after PCI to minimize perioperative MACE.' },
        { text: 'In patients with DES-PCI who require time-sensitive NCS with interruption of ≥1 antiplatelet agents, NCS may be considered ≥3 months after PCI if the risk of delaying surgery outweighs the risk of MACE.' },
        { text: 'In patients with CAD who require time-sensitive NCS within 30 days of PCI with BMS or <3 months of PCI with DES, DAPT should be continued unless the risk of bleeding outweighs the benefit of the prevention of stent thrombosis.' },
        { text: 'In patients with prior PCI in whom OAC monotherapy must be discontinued before NCS, aspirin should be substituted when feasible in the perioperative period until OAC can be safely reinitiated.' },
        { text: 'In select patients after PCI who have a high thrombotic risk, perioperative bridging with intravenous antiplatelet therapy may be considered <6 months after DES or <30 days after BMS if NCS cannot be deferred.' },
      ],
      sourceId: 'aha-acc-periop-2024',
    },
    {
      id: 'antiplatelet-esc',
      name: 'ESC 2022',
      timings: [
        { text: 'It is recommended to delay elective NCS until 6 months after elective PCI and 12 months after an ACS. (Class I, level A)' },
        { text: 'After elective PCI, it is recommended to delay time-sensitive NCS until a minimum of 1 month of DAPT treatment has been given. (Class I, level B)' },
        { text: 'In patients with a recent PCI scheduled for NCS, it is recommended that management of antiplatelet therapy is discussed between the surgeon, anaesthesiologist, and cardiologist. (Class I, level C)' },
        { text: 'In patients with a previous PCI, it is recommended to continue aspirin peri-operatively if the bleeding risk allows. (Class I, level B)' },
        { text: 'If interruption of P2Y12 inhibitor is indicated, it is recommended to withhold ticagrelor for 3–5 days, clopidogrel for 5 days, and prasugrel for 7 days prior to NCS. (Class I, level B)' },
        { text: 'For patients undergoing high bleeding risk surgery (e.g. intracranial, spinal neurosurgery, or vitroretinal eye surgery), it is recommended to interrupt aspirin for at least 7 days pre-operatively. (Class I, level C)' },
      ],
      restart:
        'If antiplatelet therapy has been interrupted before a surgical procedure, it is recommended to restart therapy as soon as possible (within 48 h) post-surgery, according to interdisciplinary risk assessment. (Class I, level C)',
      sourceId: 'esc-ncs-2022',
    },
  ],
  sourceIds: ['aha-acc-periop-2024', 'esc-ncs-2022'],
};

export const OAC_BRIDGING_RULE: PeriopMedRule = {
  id: 'oac-bridging',
  drugClass: 'Oral anticoagulants and bridging (cardiac guidelines)',
  section: 'Cardiac drugs: AHA/ACC and ESC',
  action: 'individualise',
  summary:
    'Routine bridging is not recommended. ESC: for minor-bleeding-risk procedures, do not interrupt the anticoagulant.',
  cautions: [
    'These statements are about cardiac and thrombotic risk. For the timing of a spinal, epidural or deep block, use the ASRA cards.',
  ],
  drugs: [
    {
      id: 'oac-aha',
      name: 'AHA/ACC 2024',
      timings: [
        { text: 'In most patients with CVD who are undergoing elective NCS where OAC interruption is warranted, routine periprocedural bridging is not recommended due to increased bleeding risk.' },
      ],
      sourceId: 'aha-acc-periop-2024',
    },
    {
      id: 'oac-esc',
      name: 'ESC 2022',
      timings: [
        { text: 'When an urgent surgical intervention is required, it is recommended that NOAC therapy is immediately interrupted. (Class I, level C)' },
        { text: 'In minor bleeding risk surgery and other procedures where bleeding can easily be controlled, it is recommended to perform surgery without interruption of OAC therapy. (Class I, level B)' },
        { text: 'In non-minor bleeding risk procedures in patients using a NOAC, it is recommended to use an interruption regimen based on the NOAC compound, renal function, and bleeding risk. (Class I, level B)' },
        { text: 'In patients using NOACs, it is recommended that minor bleeding risk procedures are performed at trough levels (typically 12–24 h after last intake). (Class I, level C)' },
        { text: 'LMWH is recommended, as an alternative to UFH, for bridging in patients with MHVs and high surgical risk. (Class I, level B)' },
        { text: 'Bridging of OAC therapy is not recommended in patients with low/moderate thrombotic risk undergoing NCS. (Class III, level B)' },
        { text: 'Use of reduced-dose NOAC to attenuate the risk of post-operative bleeding is not recommended. (Class III, level C)' },
      ],
      sourceId: 'esc-ncs-2022',
    },
  ],
  sourceIds: ['aha-acc-periop-2024', 'esc-ncs-2022'],
};

export const CARDIAC_RULES: PeriopMedRule[] = [BETA_BLOCKER_RULE, STATIN_RULE, RAAS_RULE, PCI_ANTIPLATELET_RULE, OAC_BRIDGING_RULE];
