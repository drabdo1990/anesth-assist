// ASRA Pain Medicine fifth edition (2025): what to do before placing a neuraxial or deep plexus/peripheral block, and around
// catheters, for patients on antithrombotic drugs. Every instruction is the guideline's own sentence (grade included), copied
// from its full text on 2026-11-17. Nothing is rounded, merged or inferred. ASRA's aim is to prevent bleeding, so it is more
// conservative than guidelines written to prevent thrombosis.

import type { PeriopMedRule } from './periopMeds';

export const ASRA_WARFARIN: PeriopMedRule = {
  id: 'asra-warfarin',
  drugClass: 'Warfarin: spinal, epidural or deep block (ASRA)',
  section: 'ASRA: spinal, epidural and deep blocks',
  action: 'hold',
  summary:
    'Stop 5 days before the block, and check that the INR is normal before needle placement.',
  why:
    'ASRA bases this on warfarin pharmacology, the clinical relevance of vitamin K coagulation factor levels, case series and case reports of spinal hematoma.',
  cautions: [
    "These are ASRA's recommendations for placing a spinal, epidural or deep plexus/peripheral block and for removing catheters. Deviation may be acceptable in the judgment of the responsible anesthesiologist, and a bloody or difficult needle placement needs a case-by-case decision.",
  ],
  drugs: [
    {
      id: 'warfarin',
      name: 'Warfarin',
      timings: [
        { when: 'Before the block', text: 'We recommend that the anticoagulant therapy be stopped 5 days prior to the planned procedure, and the INR be measured and normalized (normal range of the local laboratory) prior to needle placement (grade IB)' },
        { text: 'In patients receiving an initial dose of warfarin prior to surgery, we suggest the INR should be checked prior to needle placement if the first dose was given >24 hours earlier, or if a second dose of oral anticoagulant has been administered (grade IIC)' },
      ],
      catheter: [
        'In patients receiving low-dose warfarin therapy during epidural analgesia, we suggest that their INR be monitored daily (grade IIC)',
        'We suggest that neuraxial catheters be removed when the INR is <1.5 (grade IIC)',
        'In patients with INR >1.5 but <3, the increased risk of maintaining a neuraxial catheter remains unknown. We suggest indwelling catheters may be maintained or removed with caution, closely following the INR and duration of warfarin therapy (grade IIC)',
        'In patients with an INR >3, we recommend that the warfarin dose be held or reduced in patients with indwelling neuraxial catheters (grade IA)',
        'We suggest that neurological assessment be continued for at least 48 hours following catheter removal (grade IIC)',
        'Neurological testing of sensory and motor function should be performed routinely during epidural analgesia for patients on warfarin therapy. To facilitate neurological evaluation, we recommend that the type of analgesic solution be tailored to minimize the degree of sensory and motor blockade (grade IC)',
      ],
      sourceId: 'asra-anticoag-2025',
    },
  ],
  sourceIds: ['asra-anticoag-2025'],
};

export const ASRA_UFH: PeriopMedRule = {
  id: 'asra-ufh',
  drugClass: 'Unfractionated heparin: spinal, epidural or deep block (ASRA)',
  section: 'ASRA: spinal, epidural and deep blocks',
  action: 'hold',
  summary:
    'Intravenous: stop the infusion 4 to 6 hours before, with coagulation assessed. Subcutaneous: the interval depends on the dose.',
  why:
    'ASRA bases the subcutaneous intervals on the pharmacology of a 5000-unit dose, which starts to act 1 hour after administration and persists for 4 to 6 hours.',
  cautions: [
    "These are ASRA's recommendations for placing a spinal, epidural or deep plexus/peripheral block and for removing catheters. Deviation may be acceptable in the judgment of the responsible anesthesiologist, and a bloody or difficult needle placement needs a case-by-case decision.",
  ],
  drugs: [
    {
      id: 'ufh-iv',
      name: 'Unfractionated heparin, intravenous',
      timings: [
        { when: 'Before the block', text: 'Discontinue heparin infusion for a minimum of 4–6 hours and coagulation status be assessed and normal prior to neuraxial block or deep plexus/peripheral block (grade IA)' },
        { when: 'After needle placement', text: 'Delay intravenous heparin administration for a minimum of 1 hour after needle placement (grade IA)' },
        { when: 'Heparin for more than 4 days', text: 'Since heparin-induced thrombocytopenia may occur during heparin administration, we recommend that patients receiving intravenous or subcutaneous UFH for >4 days have a platelet count assessed (grade IC)' },
      ],
      catheter: [
        "Remove indwelling neuraxial catheters 4 to 6 hours after the last heparin dose (and after assessment of the patient's coagulation status); reheparinize 1 hour after catheter removal (grade 1A).",
        'Monitor the patient postoperatively to provide early detection of motor blockade and consider use of minimal concentration of local anesthetics to enhance the early detection of a spinal hematoma (grade 1A).',
        'Although the occurrence of a bloody or difficult neuraxial needle placement may increase the risk of hematoma, there are no data to support mandatory cancellation of a case. Direct communication with the surgeon and a specific risk-benefit decision about proceeding in each case is recommended (grade IA)',
        'It is not suggested to maintain neuraxial or deep plexus/peripheral catheters in the setting of full anticoagulation during cardiac surgery. If unanticipated heparinization occurs, we suggest postoperative monitoring of neurological status and consider use of minimal concentration of local anesthetics to enhance early detection of neuraxial hematoma (grade IIC)',
      ],
      sourceId: 'asra-anticoag-2025',
    },
    {
      id: 'ufh-sc',
      name: 'Unfractionated heparin, subcutaneous',
      timings: [
        { when: 'Low dose', text: 'Preoperative low-dose UFH for thromboprophylaxis (5000 U two times per day or three times per day). We suggest needle placement occur a minimum of 4–6 hours after heparin administration or coagulation status be assessed and normal (grade IIC)' },
        { when: '7500–10 000 U two times per day or a daily dose of ≤20 000 U', text: 'We suggest neuraxial block occur a minimum of 12 hours after subcutaneous heparin administration and confirmation of normal coagulation status (grade IIC)' },
        { when: '>10 000 U subcutaneously per dose, or >20 000 U total daily dose', text: 'We suggest neuraxial block occur a minimum of 24 hours after subcutaneous heparin administration and confirmation of normal coagulation status (grade IIC)' },
      ],
      catheter: [
        'There is no contraindication to maintaining neuraxial catheters in the presence of low-dose UFH. We suggest catheter removal occurs a minimum of 4–6 hours after heparin administration. Subsequent heparin administration may occur immediately after catheter removal (grade IIC)',
        'The safety of indwelling neuraxial catheters in patients receiving doses >5000 U at a time or >15 000 U of UFH daily has not been established. We suggest that the risk and benefits be assessed on an individual basis and that techniques to facilitate detection of new/progressive neurological deficits (eg, enhanced neurological monitoring occur and neuraxial solutions to minimize sensory and motor block) be applied (grade IIC)',
      ],
      sourceId: 'asra-anticoag-2025',
    },
  ],
  sourceIds: ['asra-anticoag-2025'],
};

export const ASRA_LMWH: PeriopMedRule = {
  id: 'asra-lmwh',
  drugClass: 'Low molecular weight heparin: spinal, epidural or deep block (ASRA)',
  section: 'ASRA: spinal, epidural and deep blocks',
  action: 'hold',
  summary:
    'Low dose: at least 12 hours before needle placement. High (therapeutic) dose: at least 24 hours.',
  why:
    'In a small study cited by ASRA, almost 60% of patients on high-dose enoxaparin still had higher than expected anti-Xa levels at least 24 hours after the last dose.',
  cautions: [
    "These are ASRA's recommendations for placing a spinal, epidural or deep plexus/peripheral block and for removing catheters. Deviation may be acceptable in the judgment of the responsible anesthesiologist, and a bloody or difficult needle placement needs a case-by-case decision.",
  ],
  drugs: [
    {
      id: 'lmwh',
      name: 'Low molecular weight heparin (enoxaparin, dalteparin, tinzaparin)',
      timings: [
        { when: 'What ASRA calls low dose', text: 'Low-dose LMWH regimens administered for prophylaxis include enoxaparin 40 mg/day, enoxaparin 30 mg every 12 hours, dalteparin 5000 IU daily. The target aXa level for prophylaxis (measured 4 hours after a dose) is regarded to be 0.2–0.5 IU/mL.' },
        { when: 'What ASRA calls high dose', text: 'High-dose LMWH regimens for treatment of VTE or bridging therapy involves administering a much higher dose that is typically weight based, such as enoxaparin 1 mg/kg every 12 hours, enoxaparin 1.5 mg/kg daily, dalteparin 120 IU/kg every 12 hours, dalteparin 200 IU/kg daily, or tinzaparin 175 IU/kg daily. It is advisable to maintain peak aXa levels between 0.5 U/mL and 1 U/mL (measured 3–4 hours after the LMWH dose). With high-dose LMWH, it is recommended that the last dose should occur at least 24 hours preoperatively and the last dose should be halved in patients with moderate (CrCl 30–49 mL/min) to severe (CrCl <30 mL/min) renal insufficiency to avoid an exaggerated or prolonged response.' },
        { when: 'Low dose', text: 'We recommend that needle placement should occur at least 12 hours after low-dose LMWH (grade IC)' },
        { text: 'Consider checking aXa activity level if <12 hours (grade 2C). An acceptable level of residual aXa activity remains undetermined, therefore we suggest aXa value of ≤0.1 IU/mL (grade IIC)' },
        { when: 'High (therapeutic) dose', text: 'In patients receiving high (therapeutic) doses of LMWH, we recommend delay of at least 24 hours prior to needle/catheter placement (grade IC)' },
        { text: 'Consider checking aXa activity level if <24 hours particularly in elderly patients (age >75 years) and patients with renal insufficiency (CrCl ≤30 mL/min). An acceptable level of residual aXa activity remains undetermined, therefore we suggest aXa value of ≤0.1 IU/mL (grade IIC)' },
        { when: 'LMWH for more than 4 days', text: 'Heparin-induced thrombocytopenia may occur during LMWH administration; therefore, we recommend that patients receiving LMWH for >4 days have a platelet count assessed prior to needle placement (grade IC)' },
        { when: 'Blood during needle or catheter placement', text: 'The presence of blood during needle and catheter placement does not necessitate postponement of surgery. We suggest that initiation of LMWH therapy in this setting should be delayed for 24 hours postoperatively and that this consideration be discussed with the surgeon (grade IIC)' },
      ],
      catheter: [
        'Antiplatelet or oral anticoagulant medications administered in combination with LMWH increases the risk of neuraxial hematoma. We recommend against concomitant administration of medications affecting hemostasis, such as antiplatelet drugs, standard heparin, or dextran, regardless of LMWH dosing regimen when there is an indwelling neuraxial catheter (grade IA)',
        'Twice-daily low dose. We recommend the first dose of LMWH be administered the following day and at least 12 hours after needle/catheter placement. Indwelling catheters should be removed prior to initiation of LMWH. Administration of LMWH should be delayed for 4 hours after catheter removal (grade IC)',
        'Single daily low dose. We recommend the first postoperative LMWH dose should be administered at least 12 hours after needle/catheter placement. The second postoperative dose should occur no sooner than 24 hours after the first dose. Indwelling neuraxial catheters do not appear to represent increased risk and may be maintained. However, no additional hemostasis altering medications should be administered due to the additive effects. The catheter should be removed 12 hours after the last dose of LMWH. Subsequent LMWH dosing should occur at least 4 hours after catheter removal (grade IC)',
        'Single or twice-daily high (therapeutic) dosing. High-dose LMWH may be resumed 24 hours after non-high-bleeding-risk surgery and 48–72 hours after high-bleeding-risk surgery. We recommend that indwelling neuraxial catheters be removed 4 hours prior to the first postoperative dose and the first postoperative dose should be at least 24 hours after needle/catheter placement, whichever is greater (grade IC)',
      ],
      sourceId: 'asra-anticoag-2025',
    },
  ],
  sourceIds: ['asra-anticoag-2025'],
};

export const ASRA_FONDAPARINUX: PeriopMedRule = {
  id: 'asra-fondaparinux',
  drugClass: 'Fondaparinux: spinal, epidural or deep block (ASRA)',
  section: 'ASRA: spinal, epidural and deep blocks',
  action: 'hold',
  summary:
    'Long intervals that depend on the dose and on renal function.',
  why:
    'ASRA notes that fondaparinux has a long half-life and direct renal excretion, and that protamine would not be an effective reversal strategy.',
  cautions: [
    "These are ASRA's recommendations for placing a spinal, epidural or deep plexus/peripheral block and for removing catheters. Deviation may be acceptable in the judgment of the responsible anesthesiologist, and a bloody or difficult needle placement needs a case-by-case decision.",
  ],
  drugs: [
    {
      id: 'fondaparinux',
      name: 'Fondaparinux (Arixtra)',
      timings: [
        { when: 'Low dose (2.5 mg once per day)', text: 'We suggest holding low-dose fondaparinux (2.5 mg once per day) for 36 hours (young patients) to 42 hours (elderly patients) in healthy patients with normal renal function (grade IIC)' },
        { text: 'We suggest holding fondaparinux for a minimum of 58 hours in patients with moderate renal insufficiency (CrCl 30–50 mL/min) (grade 2C)' },
        { when: 'CrCl below 30 mL/min', crclBelow: 30, text: 'We suggest not performing neuraxial or deep plexus/peripheral blocks in patients with severe renal impairment (CrCl <30 mL/min) due to the 72 hours half-life (grade IIC)' },
        { text: 'We suggest testing aXa activity calibrated to fondaparinux if placing the needle prior to these recommended times is considered (aXa ≤0.1 IU/mL) (grade IIC)' },
        { when: 'High-dose fondaparinux (5–10 mg once per day)', text: 'We suggest holding fondaparinux for a minimum of 70 hours in young patients with normal renal function (grade IIC)' },
        { text: 'We suggest holding fondaparinux for a minimum of 105 hours in elderly patients with normal renal function (grade IIC)' },
        { text: 'We suggest testing aXa activity calibrated to fondaparinux if placing needle prior to the recommended times is considered (aXa ≤0.1 IU/mL) (grade IIC)' },
      ],
      catheter: [
        'We suggest that neuraxial catheters be removed at least 6 hours prior to the first postoperative dose (grade IIC)',
      ],
      sourceId: 'asra-anticoag-2025',
    },
  ],
  sourceIds: ['asra-anticoag-2025'],
};

export const ASRA_DOAC: PeriopMedRule = {
  id: 'asra-doac',
  drugClass: 'DOACs: spinal, epidural or deep block (ASRA)',
  section: 'ASRA: spinal, epidural and deep blocks',
  action: 'hold',
  summary:
    'High dose of apixaban, edoxaban or rivaroxaban: at least 72 hours. Low-dose intervals are shorter. Dabigatran depends on creatinine clearance.',
  why:
    'ASRA bases its intervals on pharmacology, with the intent of near-complete resolution of the antithrombotic effect at the time of the block.',
  cautions: [
    "These are ASRA's recommendations for placing a spinal, epidural or deep plexus/peripheral block and for removing catheters. Deviation may be acceptable in the judgment of the responsible anesthesiologist, and a bloody or difficult needle placement needs a case-by-case decision.",
    "ASRA's high and low doses decide which line applies, and this app cannot tell which dose the patient takes. The part of the guideline that this app could read does not state the doses behind 'high' and 'low'; check the guideline's tables.",
    'The manufacturers recommend that in case of a traumatic neuraxial puncture the administration of the next dose of apixaban and rivaroxaban should be delayed for 48 hours and 24 hours, respectively. There is no such recommendation for dabigatran and edoxaban.',
    'If a DOAC were to be inadvertently administered in the presence of an indwelling neuraxial catheter, a therapy-free interval identical to the ones recommended prior to a neuraxial intervention should be observed, or the absence of any residual anticoagulant activity should be documented using an appropriate hemostatic assay.',
  ],
  drugs: [
    {
      id: 'apixaban-asra',
      name: 'Apixaban',
      timings: [
        { when: 'High dose', text: 'We suggest that a high dose of apixaban be discontinued at least 72 hours prior to neuraxial block or deep plexus/peripheral block. Consider checking apixaban or aXa plasma level if <72 hours (grade IIC)' },
        { when: 'Low dose', text: 'We suggest that a low dose of apixaban be discontinued for at least 36 hours prior to neuraxial block or deep plexus/peripheral block. Consider checking apixaban or aXa plasma level if <36 hours (grade IIC)' },
        { when: 'Residual level, either dose', text: 'We suggest that a residual apixaban plasma level <30 ng/mL or a residual aXa activity plasma level ≤0.1 IU/mL is acceptable prior to neuraxial block or deep plexus/peripheral block (grade IIC)' },
      ],
      catheter: [
        'With the unanticipated administration of high dose of apixaban with a neuraxial catheter in situ, we suggest that apixaban dosing be withheld for at least 72 hours, or a residual apixaban plasma level <30 ng/mL or a residual aXa activity plasma level ≤0.1 IU/mL before the catheter is removed (grade IIC)',
        'With the unanticipated administration of low dose of apixaban with a neuraxial catheter in situ, we suggest that apixaban dosing be withheld for at least 36 hours, or a residual apixaban plasma level <30 ng/mL or a residual aXa activity plasma level ≤0.1 IU/mL before the catheter is removed (grade IIC)',
      ],
      restart:
        'High dose: We suggest that needle placement/catheter removal occurs at least 24 hours prior to the first postoperative dose (grade IIC) Low dose: We suggest that needle placement/catheter removal occurs at least 6 hours prior to the first postoperative dose (grade IIC)',
      sourceId: 'asra-anticoag-2025',
    },
    {
      id: 'edoxaban-asra',
      name: 'Edoxaban',
      timings: [
        { when: 'High dose', text: 'We suggest that a high dose of edoxaban be discontinued for at least 72 hours prior to neuraxial block or deep plexus/peripheral block. Consider checking edoxaban or aXa activity plasma level if <72 hours (grade IIC)' },
        { when: 'Low dose', text: 'There is no FDA-approved medical indication for low-dose edoxaban.' },
        { when: 'Residual level', text: 'We suggest that a residual edoxaban plasma level <30 ng/mL or a residual aXa activity plasma level ≤0.1 IU/mL is acceptable prior to neuraxial block or deep plexus/peripheral block (grade IIC)' },
      ],
      catheter: [
        'With the unanticipated administration of high dose of edoxaban with a neuraxial catheter in situ, we suggest that edoxaban dosing be withheld for at least 72 hours, or a residual edoxaban plasma level <30 ng/mL or a residual aXa activity plasma level ≤0.1 IU/mL before the catheter is removed (grade IIC)',
      ],
      restart:
        'High dose: We suggest that needle placement/catheter removal occurs at least 24 hours prior to the first (postoperative) dose (grade IIC)',
      sourceId: 'asra-anticoag-2025',
    },
    {
      id: 'rivaroxaban-asra',
      name: 'Rivaroxaban',
      timings: [
        { when: 'High dose', text: 'We suggest that a high dose of rivaroxaban be discontinued for at least 72 hours prior to neuraxial block or deep plexus/peripheral block. Consider checking rivaroxaban or aXa activity plasma level if <72 hours (grade IIC)' },
        { when: 'Low dose', text: 'We suggest that a low dose of rivaroxaban be discontinued for at least 24 hours (30 hours if CrCl <30 mL/min) prior to neuraxial block or deep plexus/peripheral block. Consider checking rivaroxaban or aXa activity plasma level if <24 hours (grade IIC)' },
        { when: 'Residual level, either dose', text: 'We suggest that a residual rivaroxaban plasma level <30 ng/mL or a residual aXa activity plasma level ≤0.1 IU/mL is acceptable prior to neuraxial block or deep plexus/peripheral block (grade IIC)' },
      ],
      catheter: [
        'With the unanticipated administration of high dose of rivaroxaban with a neuraxial catheter in situ, we suggest that rivaroxaban dosing be withheld for at least 72 hours, or a residual rivaroxaban plasma level <30 ng/mL or a residual aXa activity plasma level ≤0.1 IU/mL before the catheter is removed (grade IIC)',
        'With the unanticipated administration of low dose of rivaroxaban with a neuraxial catheter in situ, we suggest that rivaroxaban dosing be withheld for at least 24 hours (30 hours if CrCl <30 mL/min), or a residual rivaroxaban plasma level <30 ng/mL or a residual aXa activity plasma level ≤0.1 IU/mL before the catheter is removed (grade IIC)',
      ],
      restart:
        'High dose: We suggest that needle placement/catheter removal occurs at least 24 hours prior to the first postoperative dose (grade IIC) Low dose: We suggest that needle placement/catheter removal occurs at least 6 hours prior to the first postoperative dose (grade IIC)',
      sourceId: 'asra-anticoag-2025',
    },
    {
      id: 'dabigatran-asra',
      name: 'Dabigatran',
      timings: [
        { when: 'High dose, CrCl 50 mL/min or more', crclMin: 50, text: 'We suggest that a high dose of dabigatran be discontinued for at least 72 hours in patients with a CrCl ≥50 mL/min prior to neuraxial block or deep plexus/peripheral block. Consider checking dabigatran plasma level if <72 hours (grade IIC)' },
        { when: 'High dose, CrCl 30 to 49 mL/min', crclMin: 30, crclBelow: 50, text: 'We suggest that a high dose of dabigatran be discontinued for 120 hours in patients with a CrCl 30–49 mL/min prior to neuraxial block or deep plexus/peripheral block. Consider checking dabigatran plasma level if <120 hours (grade IIC)' },
        { when: 'Either dose, CrCl below 30 mL/min', crclBelow: 30, text: 'We suggest against the performance of neuraxial or deep plexus/peripheral blocks in patients with a CrCl <30 mL/min unless a dabigatran plasma level is obtained and <30 ng/mL (grade IIC)' },
        { when: 'Low dose', text: 'We suggest that a low dose of dabigatran be discontinued for at least 48 hours prior to neuraxial block or deep plexus/peripheral block. Consider checking dabigatran plasma level if <48 hours (grade IIC)' },
        { when: 'Residual level, either dose', text: 'Prior to neuraxial block or deep plexus/peripheral block we suggest that a residual dabigatran plasma level <30 ng/mL is acceptable (grade IIC)' },
      ],
      catheter: [
        'With the unanticipated administration of high-dose dabigatran with a neuraxial catheter in situ, we suggest that dabigatran dosing be withheld for at least 72 hours (120 hours if CrCl 30–49 mL/min) or a residual dabigatran plasma level <30 ng/mL before the catheter is removed (grade IIC)',
        'With the unanticipated administration of low dose of dabigatran with a neuraxial catheter in situ, we suggest that dabigatran dosing be withheld for at least 48 hours, or a residual dabigatran plasma level <30 ng/mL before the catheter is removed (grade IIC)',
      ],
      restart:
        'High dose: We suggest that needle placement/catheter removal occurs at least 24 hours prior to the first postoperative dose (grade IIC) Low dose: We suggest that needle placement/catheter removal occurs at least 6 hours prior to the first postoperative dose (grade IIC)',
      sourceId: 'asra-anticoag-2025',
    },
  ],
  sourceIds: ['asra-anticoag-2025'],
};

export const ASRA_ANTIPLATELET: PeriopMedRule = {
  id: 'asra-antiplatelet',
  drugClass: 'Antiplatelet drugs: spinal, epidural or deep block (ASRA)',
  section: 'ASRA: spinal, epidural and deep blocks',
  action: 'individualise',
  summary:
    'Aspirin and NSAIDs: no added risk. Clopidogrel 5 to 7 days, prasugrel 7 to 10 days, ticagrelor 5 days.',
  why:
    'ASRA notes that aspirin affects platelet function for the life of the platelet, while other NSAIDs produce a short-term defect that normalizes within 3 days.',
  cautions: [
    "These are ASRA's recommendations for placing a spinal, epidural or deep plexus/peripheral block and for removing catheters. Deviation may be acceptable in the judgment of the responsible anesthesiologist, and a bloody or difficult needle placement needs a case-by-case decision.",
    'NSAIDs alone do not significantly increase the risk of spinal hematoma. However, combination therapy with UFH, LMWH, oral anticoagulants, and thrombolytics have been demonstrated to increase the frequency of spontaneous hemorrhagic complications, bleeding at puncture sites, and spinal hematoma.',
  ],
  drugs: [
    {
      id: 'aspirin-nsaids',
      name: 'Aspirin and other NSAIDs',
      timings: [
        { text: 'NSAIDs appear to represent no added risk for the development of major bleeding after regional anesthetic techniques. NSAIDs (including aspirin) do not create a level of risk that will interfere with the performance of neuraxial or deep plexus/peripheral blocks. In patients receiving these medications, we do not identify specific concerns as to the timing of single-injection or catheter techniques, postoperative monitoring, or the timing of neuraxial catheter removal (grade IC)' },
      ],
      sourceId: 'asra-anticoag-2025',
    },
    {
      id: 'thienopyridines',
      name: 'Clopidogrel and prasugrel',
      timings: [
        { text: 'Based on labeling and surgical/procedural experience, the suggested time interval between discontinuation of thienopyridine therapy and needle placement is 5–7 days for clopidogrel, and 7–10 days for prasugrel (grade IIC)' },
      ],
      catheter: [
        'Neuraxial and deep plexus/peripheral catheters should not be maintained with prasugrel due to the rapid onset. However, since the antiplatelet effect is not immediate with clopidogrel, they may be maintained for 1–2 days, provided a loading dose of the antiplatelet agent is not administered (grade IIC)',
      ],
      restart:
        'Thienopyridine therapy may be resumed immediately after needle placement/catheter removal, provided a loading dose of the drugs is not administered. If a loading dose is administered, we suggest a time interval of 6 hours between catheter removal and administration (grade IIC)',
      sourceId: 'asra-anticoag-2025',
    },
    {
      id: 'ticagrelor',
      name: 'Ticagrelor',
      timings: [
        { text: 'Based on labeling and surgical/procedural experience, the recommended time interval between discontinuation of ticagrelor therapy and needle placement is 5 days (grade 2C)' },
      ],
      catheter: [
        'Neuraxial catheters should not be maintained with ticagrelor due to the rapid onset (grade IIC)',
      ],
      restart:
        'Ticagrelor therapy may be resumed immediately after needle placement/catheter removal, provided a loading dose of the drug is not administered. If a loading dose is administered, we suggest a time interval of 6 hours between catheter removal and administration (grade IIC)',
      sourceId: 'asra-anticoag-2025',
    },
    {
      id: 'cilostazol',
      name: 'Cilostazol',
      timings: [
        { text: 'The risk of serious bleeding in the presence of residual cilostazol effect is unknown. Based on the elimination half-life, we suggest that needle placement be avoided for 2 days after discontinuation of cilostazol (grade IIC)' },
      ],
      catheter: [
        'We suggest that neuraxial and deep plexus/peripheral catheters be removed prior to reinstitution of cilostazol therapy postoperatively (grade IIC)',
      ],
      restart:
        'We suggest that the first postoperative dose of cilostazol be administered 6 hours after neuraxial or deep plexus/peripheral catheter removal (grade IIC)',
      sourceId: 'asra-anticoag-2025',
    },
    {
      id: 'cangrelor',
      name: 'Cangrelor',
      timings: [
        { text: 'The risk of serious bleeding in the presence of residual cangrelor effect is unknown. Based on the elimination half-life, we suggest that needle placement be avoided for 3 hours after discontinuation of cangrelor (grade IIC)' },
      ],
      catheter: [
        'We suggest that neuraxial and deep plexus/peripheral catheters be removed prior to reinstitution of cangrelor therapy postoperatively (grade IIC)',
      ],
      restart:
        'We suggest that the first postoperative dose of cangrelor be administered 8 hours after neuraxial or deep plexus/peripheral catheter removal (grade IIC)',
      sourceId: 'asra-anticoag-2025',
    },
    {
      id: 'gp2b3a',
      name: 'Platelet GP IIb/IIIa inhibitors (abciximab, eptifibatide, tirofiban)',
      timings: [
        { text: 'The platelet GP IIb/IIIa inhibitors exert a profound effect on platelet aggregation. Following administration, the time to normal platelet aggregation is 24–48 hours for abciximab and 4–8 hours for eptifibatide and tirofiban. We recommend that needle placement should be avoided until platelet function—as impacted by the GP IIb/IIIa inhibitor—has recovered. Caution in patients on dual therapy who may still have residual NSAID effect (grade IC)' },
      ],
      catheter: [
        'Postoperative. Although GP IIb/IIIa antagonists are contraindicated within 4 weeks of surgery, should one be emergently administered in the postoperative period following a neuraxial or deep plexus/peripheral technique, we recommend the neuraxial infusion should be limited to drugs minimizing sensory and motor block to facilitate assessment of neurological function and that the patient be carefully monitored neurologically (grade IC)',
        'Timing of catheter removal is based on ongoing risk of thromboembolism and need for continued antithrombotic therapy and the potential for spinal bleeding during catheter maintenance and removal (grade IIC)',
      ],
      sourceId: 'asra-anticoag-2025',
    },
  ],
  sourceIds: ['asra-anticoag-2025'],
};

export const ASRA_THROMBOLYTIC: PeriopMedRule = {
  id: 'asra-thrombolytic',
  drugClass: 'Thrombolytic drugs: spinal, epidural or deep block (ASRA)',
  section: 'ASRA: spinal, epidural and deep blocks',
  action: 'hold',
  summary:
    'No needle placement for at least 48 hours after thrombolytic therapy.',
  why:
    'ASRA bases these on the profound effect on hemostasis, the use of concomitant heparin and/or antiplatelet agents, and the potential for neuraxial bleeding.',
  cautions: [
    "These are ASRA's recommendations for placing a spinal, epidural or deep plexus/peripheral block and for removing catheters. Deviation may be acceptable in the judgment of the responsible anesthesiologist, and a bloody or difficult needle placement needs a case-by-case decision.",
  ],
  drugs: [
    {
      id: 'thrombolytics',
      name: 'Fibrinolytic and thrombolytic drugs',
      timings: [
        { when: 'Before thrombolytic therapy', text: 'In patients scheduled to receive thrombolytic therapy, we recommend that the patient be queried, and the medical record reviewed for a recent history of lumbar puncture, spinal or epidural anesthesia, or epidural steroid injection to allow appropriate monitoring. Guidelines detailing original contraindications for thrombolytic drugs suggest avoidance of these drugs for 10 days following puncture of non-compressible vessels (grade IA)' },
        { when: 'After thrombolytic therapy', text: 'In patients who have received fibrinolytic and thrombolytic drugs, we recommend against needle placement for at least 48 hours. Documentation of normalization of clotting studies (including fibrinogen) is suggested (grade IA)' },
      ],
      catheter: [
        'In those patients who have received neuraxial blocks at or near the time of fibrinolytic and thrombolytic therapy, we recommend that frequent neurological monitoring (eg, every 2 hours) should be continued for at least 48 hours after the last dose. If neuraxial blocks have been combined with fibrinolytic and thrombolytic therapy and ongoing epidural catheter infusion, we recommend the infusion should be limited to drugs minimizing sensory and motor block to facilitate assessment of neurological function (grade IC)',
        'There is no definitive recommendation for removal of neuraxial catheters in patients who unexpectedly receive fibrinolytic and thrombolytic therapy during a neuraxial catheter infusion. We suggest the measurement of fibrinogen level (one of the last clotting factors to recover) to evaluate the presence of residual thrombolytic effect and appropriate timing of catheter removal. Patients should have frequent neurological monitoring for at least 48 hours following catheter removal (grade IIC)',
      ],
      sourceId: 'asra-anticoag-2025',
    },
  ],
  sourceIds: ['asra-anticoag-2025'],
};

export const ASRA_RULES: PeriopMedRule[] = [ASRA_WARFARIN, ASRA_UFH, ASRA_LMWH, ASRA_FONDAPARINUX, ASRA_DOAC, ASRA_ANTIPLATELET, ASRA_THROMBOLYTIC];
