import { type ConditionRecord } from './types';

export const RESPIRATORY_CONDITIONS: ConditionRecord[] = [
  {
    id: 'cystic-fibrosis',
    name: 'Cystic fibrosis',
    aliases: ['cf'],
    chapter: 2,
    plan: {
      preop: [
        'Assess baseline pulmonary function (FEV1, FVC), baseline room-air oxygen saturation, sputum microbiology (colonization with Pseudomonas aeruginosa or Burkholderia cepacia), and chest physiotherapy regimen.',
        'Coordinate preop chest physiotherapy and nebulized bronchodilators or mucolytics to clear viscous endobronchial secretions.',
        'Screen for CF-related comorbidities: CF-related diabetes (check blood glucose and plan insulin management), cirrhosis with portal hypertension, and coagulopathy from malabsorption of fat-soluble vitamins (check PT/INR).',
        'Continue maintenance antibiotic and pulmonary therapies without interruption.',
      ],
      intraop: [
        'Maintain active humidification and warming of inspired gases throughout anesthesia to prevent inspissation of mucus.',
        'Perform thorough tracheal and bronchial suctioning under direct vision prior to extubation.',
        'Maintain lung-protective ventilation: cautious tidal volumes with adequate expiratory time to prevent dynamic hyperinflation and auto-PEEP.',
        'Invasive arterial line monitoring is indicated for major procedures with moderate-to-severe pulmonary impairment or blood gas monitoring.',
        'Strict infection control and barrier precautions to prevent cross-contamination (especially with Burkholderia cepacia).',
      ],
      avoid: [
        'Anticholinergic drying agents (atropine, glycopyrrolate) that desiccate airway secretions and create intractable mucus plugs.',
        'Dry, unhumidified anesthetic gas mixtures.',
        'Heavy sedative premedication without continuous monitoring due to high risk of hypoventilation and mucus retention.',
      ],
      postop: [
        'Aim for early extubation in the operating room to restore spontaneous coughing and deep breathing.',
        'Resume aggressive chest physiotherapy, postural drainage, and nebulized bronchodilators immediately in the recovery period.',
        'Provide multimodal, opioid-sparing analgesia (regional blocks, acetaminophen) to facilitate deep breathing and prevent splinting.',
      ],
    },
    sourceIds: ['stoelting-8e'],
  },
  {
    id: 'primary-ciliary-dyskinesia',
    name: 'Primary ciliary dyskinesia',
    aliases: ['kartagener syndrome', 'pcd'],
    chapter: 2,
    plan: {
      preop: [
        'Assess impaired mucociliary clearance, chronic purulent sputum production, baseline bronchodilator therapy, and extent of bronchiectasis.',
        'Evaluate for Kartagener syndrome triad (situs inversus totalis, chronic sinusitis, bronchiectasis): review chest imaging and confirm organ laterality.',
        'In patients with dextrocardia, plan lead placement: invert left and right arm ECG leads and place precordial leads V1-V6 on the right hemithorax.',
        'Preoperative chest physiotherapy and nebulized saline or bronchodilators to optimize airway clearance before surgery.',
      ],
      intraop: [
        'Utilize active warming and humidification of all inspired anesthetic gases to facilitate mucus clearance.',
        'Be mindful of reversed vascular and cardiac anatomy if central venous cannulation or emergency thoracostomy is required.',
        'Perform deep endotracheal suctioning prior to emergence to remove secretions accumulated during positive-pressure ventilation.',
        'Maintain lung-protective ventilation with positive end-expiratory pressure to prevent atelectasis in dependent lung segments.',
      ],
      avoid: [
        'Anticholinergic medications (glycopyrrolate, atropine) that increase secretion viscosity and defeat residual cough clearance.',
        'Prolonged periods of unhumidified mechanical ventilation.',
      ],
      postop: [
        'Prioritize early extubation once awake and generating adequate cough mechanics.',
        'Resume chest physiotherapy, flutter valve therapy, and pulmonary toilet early in the recovery room.',
        'Multimodal analgesia with regional techniques to facilitate effective coughing and deep inspiration.',
      ],
    },
    sourceIds: ['stoelting-8e'],
  },
  {
    id: 'sarcoidosis',
    name: 'Sarcoidosis',
    aliases: [],
    chapter: 3,
    plan: {
      preop: [
        'Multisystem granulomatous disorder: evaluate restrictive lung defect, diffusion capacity (DLCO), and baseline arterial blood gases.',
        'Evaluate for cardiac sarcoidosis: 12-lead ECG, troponin, and echocardiogram to detect complete heart block, bundle branch blocks, malignant ventricular arrhythmias, or cardiomyopathy.',
        'Assess airway involvement: examine for supraglottic, vocal cord, or subglottic granulomatous lesions and laryngeal stenosis that complicate tracheal intubation.',
        'Screen for hypercalcemia (calcitriol production by granulomas) and evaluate chronic corticosteroid therapy (plan stress-dose steroids).',
      ],
      intraop: [
        'Prepare for potentially difficult airway: have video laryngoscopy and flexible fiberoptic intubation equipment readily available.',
        'Continuous ST-segment and rhythm monitoring: high risk for intraoperative conduction disturbances and ventricular arrhythmias if cardiac involvement exists.',
        'Employ lung-protective ventilation with lower tidal volumes and cautious plateau pressures to prevent barotrauma in stiff, low-compliance lungs.',
        'Maintain normocarbia and avoid acute increases in pulmonary vascular resistance, especially in patients with associated pulmonary hypertension.',
      ],
      avoid: [
        'Aggressive blind or forceful airway instrumentation that could provoke bleeding from fragile granulomatous mucosal lesions.',
        'Acidosis, hypercarbia, and hypoxemia, which precipitate acute pulmonary vasoconstriction and right ventricular strain.',
      ],
      postop: [
        'Continuous ECG telemetry monitoring in recovery or step-down unit if cardiac sarcoidosis is suspected.',
        'Observe closely for post-extubation laryngeal edema or stridor when laryngeal granulomas are present.',
        'Administer scheduled perioperative stress-dose corticosteroids as planned.',
      ],
    },
    sourceIds: ['stoelting-8e'],
  },
  {
    id: 'lymphangioleiomyomatosis',
    name: 'Lymphangioleiomyomatosis',
    aliases: ['lam'],
    chapter: 3,
    plan: {
      preop: [
        'Rare disease of women of childbearing age characterized by smooth muscle cell proliferation and thin-walled pulmonary cysts: evaluate baseline dyspnea, SpO2, and DLCO.',
        'Obtain detailed history of recurrent spontaneous pneumothoraces, chylothorax, or prior pleurodesis; review recent high-resolution chest CT.',
        'Screen for extrapulmonary manifestations, particularly renal angiomyolipomas (bleeding risk) and retroperitoneal lymphangioleiomyomas.',
        'Continue mTOR inhibitor therapy (sirolimus) per institutional perioperative protocol.',
      ],
      intraop: [
        'Extremely high risk of intraoperative cyst rupture and tension pneumothorax under positive-pressure ventilation; maintain low tidal volumes, minimal peak inspiratory pressures, and low PEEP.',
        'Nitrous oxide is strictly contraindicated: N2O diffuses rapidly into air-filled thin-walled pulmonary cysts and closed pleural spaces, causing rapid expansion and tension pneumothorax.',
        'Have a dedicated chest thoracostomy tray and pleural drainage system immediately in the operating room.',
        'Maintain vigilance for sudden unexplained hypotension, rising peak airway pressures, or acute hypoxemia, which signals tension pneumothorax.',
      ],
      avoid: [
        'Nitrous oxide (N2O) in all circumstances.',
        'High peak inspiratory pressures, large tidal volumes, and vigorous manual bag-mask ventilation.',
      ],
      postop: [
        'Obtain immediate post-procedure chest radiography in PACU to rule out occult or developing pneumothorax.',
        'Monitor for signs of chylothorax or increasing pleural effusion.',
        'Provide regional analgesia (thoracic epidural or paravertebral block) for thoracic or upper abdominal procedures to minimize splinting without depressing respiratory drive.',
      ],
    },
    sourceIds: ['stoelting-8e'],
  },
];
