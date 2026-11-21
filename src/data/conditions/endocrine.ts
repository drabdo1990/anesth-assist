import { entry, type ConditionRecord } from './types';

export const ENDOCRINE_CONDITIONS: ConditionRecord[] = [
  // Inborn errors of metabolism (Ch 18)
  entry(
    'acute-porphyria',
    'Acute porphyrias',
    18,
    ['porphyria', 'acute intermittent porphyria', 'aip', 'variegate porphyria', 'hereditary coproporphyria'],
    {
      preop: [
        'Ask about family history: a silent porphyria can present for the first time after a triggering drug.',
        'Examine and record any neuropathy and autonomic instability, especially before a regional block.',
        'Keep fasting short; if a long fast is unavoidable, give a glucose-containing infusion, because caloric restriction can precipitate an attack.',
        'Decide before surgery which drug in each class you may need (antibiotics, antihypertensives, antiarrhythmics and others) is safe. The American Porphyria Foundation keeps a drug database.',
      ],
      intraop: [
        'Regional anesthesia is not contraindicated, and no local anesthetic is known to have triggered an attack; watch for hypotension with autonomic neuropathy or hypovolemia.',
        'Propofol is well tolerated for induction. Nitrous oxide, isoflurane, sevoflurane and desflurane are considered safe, as are most IV opioids, depolarizing and nondepolarizing relaxants and their reversal drugs.',
        'Benzodiazepines, proton pump indicators and H2 blockers can be used before surgery.',
        'Expect blood pressure lability from autonomic dysfunction.',
        'Several possible triggers together are more dangerous than any single drug.',
      ],
      avoid: [
        'Barbiturates (thiopental, methohexital), etomidate and ketamine.',
        'Ketorolac, amiodarone and many calcium channel blockers (check each one before giving it).',
      ],
      postop: [
        'If an attack is suspected, watch skeletal muscle strength and cranial nerve function: weakness warns of respiratory failure and aspiration. Postoperative ventilation is rarely needed.',
        'Ondansetron or scopolamine for PONV; codeine, oxycodone, hydrocodone, acetaminophen and many NSAIDs for pain. Tramadol has insufficient evidence.',
        'Treating a crisis: remove triggers, hydrate, give carbohydrate, correct electrolytes including magnesium, and give IV heme early in a severe attack.',
      ],
    },
  ),

  entry('lesch-nyhan', 'Lesch-Nyhan syndrome', 18, [], {
    preop: [
      'X-linked deficiency of hypoxanthine-guanine phosphoribosyltransferase (HPRT) with hyperuricemia, choreoathetosis, spasticity, and compulsive self-mutilation.',
      'Evaluate renal function: uric acid nephrolithiasis and obstructive uropathy are common complications.',
      'Assess severe involuntary athetoid movements, spastic contractures, and missing teeth or oral trauma from chronic self-biting.',
      'Continue allopurinol or febuxostat to suppress uric acid formation; maintain generous hydration before induction.',
    ],
    intraop: [
      'Aspiration prophylaxis is indicated due to pharyngeal incoordination, dysphagia, and poor airway protection.',
      'Prone to autonomic instability with exaggerated swings in blood pressure and heart rate during surgical stimulation.',
      'Positioning requires meticulous padding given joint contractures, skeletal deformities, and involuntary athetoid spasms.',
      'Normal response to succinylcholine and nondepolarizing neuromuscular blockers, but monitor with train-of-four to avoid overdosing.',
      'Maintain liberal intravenous hydration to ensure high urinary flow and prevent uric acid precipitation in renal tubules.',
    ],
    avoid: [
      'Dehydration and metabolic acidosis: both strongly promote uric acid crystallization and acute obstructive renal failure.',
      'Traumatic airway instrumentation: dentition may be fragile or damaged, and oral mucosa is easily lacerated.',
      'Prolonged physical restraint without adequate pharmacological sedation: triggers severe distress, autonomic surges, and self-harm behavior.',
    ],
    postop: [
      'Ensure smooth emergence with adequate sedation and analgesia to prevent acute agitation and self-injurious biting behaviors.',
      'Apply protective mouthguard or padded arm restraints during recovery in accordance with established patient protocol.',
      'Continue generous intravenous hydration until oral fluid intake is fully established.',
      'Multimodal analgesia with antiemetics to prevent distress and retching.',
    ],
  }),

  entry('hemochromatosis', 'Hemochromatosis', 18, ['haemochromatosis'], {
    preop: [
      'Autosomal recessive disorder of iron overload causing parenchymal iron deposition in liver, heart, pancreas, and endocrine glands.',
      'Screen for iron-overload cardiomyopathy: restrictive or dilated cardiomyopathy, diastolic dysfunction, conduction blocks, and arrhythmias.',
      'Assess liver involvement: transaminases, bilirubin, albumin, INR, and evaluate for cirrhosis and portal hypertension.',
      'Screen for diabetes mellitus ("bronze diabetes") from pancreatic islet damage, as well as hypopituitarism and adrenal insufficiency.',
      'Review therapeutic phlebotomy history, serum ferritin levels, and echocardiographic ventricular function.',
    ],
    intraop: [
      'Titrate anesthetic agents cautiously in patients with cardiac dysfunction; avoid myocardial depressants and large drops in systemic vascular resistance.',
      'Invasive arterial pressure monitoring is indicated if significant cardiomyopathy or advanced cirrhosis is present.',
      'Maintain cardiac preload and sinus rhythm: restrictive cardiomyopathy tolerates tachycardia and loss of atrial contribution poorly.',
      'Account for altered drug clearance in hepatic cirrhosis: use neuromuscular blockers with organ-independent elimination (cisatracurium).',
      'Monitor blood glucose closely during prolonged cases because of impaired islet function and erratic glycogen stores.',
    ],
    avoid: [
      'Myocardial depressants and excessive vasodilators in patients with restrictive or dilated cardiomyopathy.',
      'Hepatotoxic medications and high doses of acetaminophen in patients with hepatic cirrhosis.',
      'Excessive fluid administration in patients with restrictive ventricular physiology and diastolic heart failure.',
    ],
    postop: [
      'Continuous telemetry monitoring for conduction disturbances, supraventricular arrhythmias, and ventricular dysrhythmias.',
      'Monitor blood glucose closely with insulin sliding scale; avoid severe hyperglycemia or hypoglycemia.',
      'Optimize fluid balance to prevent pulmonary edema or hepatorenal syndrome.',
    ],
  }),

  entry('wilson-disease', 'Wilson disease', 18, ['hepatolenticular degeneration'], {
    preop: [
      'Autosomal recessive defect in ATP7B copper transport leading to toxic copper accumulation in liver, basal ganglia, and cornea.',
      'Assess hepatic function: degree of fibrosis or cirrhosis, portal hypertension, ascites, and coagulopathy (platelets, INR, fibrinogen).',
      'Evaluate neurological and bulbar involvement: dysarthria, dysphagia, saliva pooling, tremor, choreiform movements, and dystonia.',
      'Continue copper-chelating agents (penicillamine, trientine) or zinc therapy; check for penicillamine-induced bone marrow suppression or myasthenia-like weakness.',
      'Review baseline renal function: copper deposition can produce renal tubular acidosis and aminoaciduria.',
    ],
    intraop: [
      'High aspiration risk due to pharyngeal dystonia and impaired protective airway reflexes: consider rapid sequence induction or cuffed tube.',
      'Titrate anesthetic agents cautiously considering reduced hepatic clearance and altered protein binding.',
      'Nondepolarizing neuromuscular blockers: use quantitative train-of-four monitoring; prefer cisatracurium or rocuronium with sugammadex readiness.',
      'Maintain hepatic perfusion: avoid severe systemic hypotension, hypovolemia, or excessive positive end-expiratory pressure (PEEP).',
    ],
    avoid: [
      'Hepatotoxic medications and drugs extensively cleared by hepatic microsomal enzymes in patients with liver decompensation.',
      'Dopamine receptor antagonists (droperidol, metoclopramide, phenothiazines): strongly exacerbate extrapyramidal symptoms and dystonia.',
      'Hypothermia and shivering: severely worsens tremor, rigidity, and basal ganglia movement disorders.',
    ],
    postop: [
      'Assess airway reflexes, vocal cord function, and swallowing ability before extubation and oral intake.',
      'Monitor for postoperative hepatic decompensation, encephalopathy, and coagulopathy in the surgical intensive care unit.',
      'Provide antiemetics that do not block dopamine receptors (5-HT3 antagonists such as ondansetron).',
    ],
  }),

  // Endocrine disease (Ch 22)
  entry(
    'pheochromocytoma',
    'Pheochromocytoma',
    22,
    ['phaeochromocytoma', 'pheo', 'catecholamine-secreting tumor'],
    {
      preop: [
        'Start alpha blockade first (phenoxybenzamine most often; prazosin or doxazosin are alternatives). Aim for normal blood pressure, relief of symptoms and resolution of ST-T changes and arrhythmias. The best duration is unknown: 3 days to 2 weeks or longer.',
        'Add a beta blocker only after alpha blockade, for heart rate above 120 or arrhythmias.',
        'Phenoxybenzamine has been stopped 24 to 48 hours before surgery to avoid vascular unresponsiveness after the tumor is removed.',
        'Correct hypovolemia. A calcium channel blocker or metyrosine can be added in resistant cases.',
      ],
      intraop: [
        'Place an arterial line before induction. A central venous line is usually enough; a PA catheter or TEE helps with very active tumors or cardiac involvement.',
        'Expect systolic pressure above 200 mmHg during pneumoperitoneum and tumor handling even after alpha blockade. Have nitroprusside (the agent of choice), phentolamine, nitroglycerin, labetalol, esmolol and magnesium ready.',
        'Expect hypotension after the tumor veins are ligated: a large positive fluid balance and vasopressors are usually needed, and the response to vasopressors may be blunted. Lightening anesthesia helps.',
        'Treat ventricular arrhythmias with lidocaine or a beta blocker such as esmolol.',
        'Minimize fear, stress, pain, shivering, hypoxia and hypercarbia: all release catecholamines.',
      ],
      avoid: [
        'A nonselective beta blocker before alpha blockade: unopposed alpha vasoconstriction can cause a hypertensive crisis.',
        'Histamine releasers (morphine, atracurium).',
        'Vagolytic or sympathomimetic drugs: atropine, ketamine, pancuronium, succinylcholine.',
      ],
      postop: [
        'Check blood glucose: insulin rises after resection and hypoglycemia can occur.',
        'Give glucocorticoids after bilateral adrenalectomy or when hypoadrenalism is possible.',
        'About half of patients stay hypertensive for several days, because catecholamines take 7 to 10 days to normalize. If hypertension persists, consider a missed tumor, renal ischemia or essential hypertension.',
      ],
    },
  ),

  entry('insulinoma', 'Insulinoma', 22, [], {
    preop: [
      'Neuroendocrine tumor of pancreatic beta cells producing unregulated insulin secretion: presents with fasting hypoglycemia and neuroglycopenic symptoms.',
      'Maintain continuous intravenous dextrose infusion (5% or 10% dextrose) to keep blood glucose between 80 and 120 mg/dL prior to surgery.',
      'Review medical therapy: diazoxide suppresses insulin release but causes fluid retention; octreotide may be used preoperatively.',
      'Assess cardiovascular status: recurrent hypoglycemia triggers intense adrenergic surges that can cause myocardial ischemia or arrhythmias.',
    ],
    intraop: [
      'Place an arterial line for frequent serial arterial blood glucose measurements (every 15 to 30 minutes throughout the case).',
      'Maintain continuous dextrose infusion and titrate based on serial glucose readings; general anesthesia completely masks neurovegetative signs of hypoglycemia.',
      'Anticipate a rapid rebound increase in blood glucose (often exceeding 150 mg/dL) within 30 to 60 minutes after successful tumor resection or vein ligation.',
      'If glucose fails to rise after presumed tumor removal, suspect incomplete resection or multiple ectopic adenomas.',
    ],
    avoid: [
      'Unchecked hypoglycemia: general anesthesia masks all clinical warning signs (sweating, tachycardia, tremors, pupillary dilation).',
      'Beta-adrenergic antagonists if possible: blunts autonomic counter-regulatory tachycardia and glucose mobilization during hypoglycemia.',
      'Abrupt discontinuation of dextrose infusion prior to tumor resection.',
    ],
    postop: [
      'Rebound hyperglycemia is common following tumor excision due to chronic suppression of normal beta cells; manage conservatively with small insulin doses.',
      'Continue serial blood glucose monitoring every 1 to 2 hours until normal glycemic regulation is firmly established.',
      'Monitor for surgical complications including pancreatic leak, acute pancreatitis, and intra-abdominal hemorrhage.',
    ],
  }),

  entry('cushing', 'Cushing syndrome (hypercortisolism)', 22, ['hypercortisolism', 'cushing disease'], {
    preop: [
      'Excess glucocorticoids resulting in central obesity, systemic hypertension, hypokalemic alkalosis, hyperglycemia, muscle wasting, and capillary fragility.',
      'Airway evaluation: anticipate difficult mask ventilation and intubation from short thick neck, prominent fat pads, obesity, and obstructive sleep apnea.',
      'Control hypertension and correct hypokalemia and metabolic alkalosis preoperatively using spironolactone, potassium supplements, or steroid synthesis inhibitors.',
      'Assess bone and skin fragility: high risk of pathological fractures, severe bruising, and skin avulsion from minor trauma.',
    ],
    intraop: [
      'Anticipate difficult airway: have video laryngoscopy, ramped positioning, and advanced airway equipment readily available.',
      'Meticulous positioning and padding: protect all bony prominences and nerve sites to avoid fractures and pressure ulcers.',
      'Careful handling of skin and veins: gentle tape removal, soft dressings, and careful blood pressure cuff application to avoid hematomas and tears.',
      'Skeletal muscle weakness and hypokalemia increase sensitivity to neuromuscular blockers: titrate nondepolarizing agents with train-of-four monitoring.',
      'Strict aseptic technique: hypercortisolism causes significant immunosuppression and high surgical site infection risk.',
    ],
    avoid: [
      'Rough positioning or excessive torque on extremities and spine: high risk of osteoporotic fractures.',
      'Aggressive adhesives or adhesive tapes directly on thin, fragile skin.',
      'Uncorrected hypokalemia before induction: increases risk of cardiac arrhythmias and prolonged neuromuscular block.',
    ],
    postop: [
      'Postoperative adrenal insufficiency occurs immediately after curative resection (hypophysectomy or adrenalectomy): initiate stress-dose steroid coverage.',
      'Monitor closely for upper airway obstruction and respiratory failure; nurse in semi-upright position with CPAP support if indicated for OSA.',
      'High incidence of deep vein thrombosis and pulmonary embolism: implement early mechanical and chemical thromboprophylaxis.',
    ],
  }),

  entry('conn', 'Primary hyperaldosteronism (Conn syndrome)', 22, ['conn syndrome', 'hyperaldosteronism'], {
    preop: [
      'Autonomous aldosterone hypersecretion from adrenal adenoma or bilateral hyperplasia causing sodium retention, potassium wasting, and hypertension.',
      'Control hypertension and normalize serum potassium preoperatively: spironolactone or eplerenone with oral potassium supplementation.',
      'Check ECG for hypokalemic manifestations: flattened T waves, prominent U waves, ST depression, prolonged QT interval, and ventricular arrhythmias.',
      'Assess intravascular volume: hypervolemia with diastolic hypertension is characteristic; evaluate for end-organ hypertensive damage.',
    ],
    intraop: [
      'Monitor serum potassium and acid-base status intraoperatively with serial arterial blood gas analyses.',
      'Avoid hyperventilation: respiratory alkalosis drives potassium into cells, sharply exacerbating hypokalemia and precipitating arrhythmias.',
      'Hypokalemia potentiates nondepolarizing neuromuscular blockade: titrate relaxants carefully with quantitative train-of-four monitoring.',
      'Expect hemodynamic swings during laparoscopic adrenalectomy during pneumoperitoneum and tumor manipulation.',
    ],
    avoid: [
      'Hyperventilation and respiratory alkalosis: acute hypocapnia dangerously drops serum potassium levels.',
      'Potassium-free intravenous fluids when uncorrected hypokalemia persists.',
      'Nephrotoxic agents, particularly if chronic hypertension has impaired baseline renal function.',
    ],
    postop: [
      'Monitor serum potassium and blood pressure closely: transient hyperkalemia can occur post-adrenalectomy due to chronic suppression of contralateral adrenal cortex.',
      'Discontinue spironolactone and potassium supplementation immediately following unilateral adrenalectomy.',
      'Temporary mineralocorticoid replacement (fludrocortisone) is rarely needed unless bilateral adrenalectomy was performed.',
    ],
  }),

  entry('acromegaly', 'Acromegaly', 22, [], {
    preop: [
      'Growth hormone excess causing skeletal overgrowth, macroglossia, laryngeal soft tissue hypertrophy, glottic narrowing, and obstructive sleep apnea.',
      'Airway evaluation: major predictor of difficult mask ventilation and difficult intubation; hypertrophied epiglottis and thickened vocal cords narrow glottis.',
      'Screen for severe obstructive sleep apnea and daytime hypersomnolence; evaluate baseline arterial blood gases if hypoventilation is suspected.',
      'Cardiovascular evaluation: concentric biventricular hypertrophy, diastolic and systolic heart failure, hypertension, and conduction disturbances.',
      'Check endocrine status: secondary diabetes mellitus, thyroid dysfunction, and anterior pituitary hormone deficiencies.',
      'Evaluate for peripheral nerve entrapment (carpal tunnel syndrome): may compromise radial artery catheterization.',
    ],
    intraop: [
      'Prepare for difficult airway: video laryngoscopy, flexible fiberoptic bronchoscope, and smaller-than-predicted endotracheal tubes (subglottic aperture is narrowed).',
      'Preoxygenate meticulously; preserve spontaneous ventilation until the airway is secured if anatomical difficulty is suspected.',
      'Place an arterial line for invasive pressure monitoring during transsphenoidal resection: test collateral ulnar flow before radial artery cannulation.',
      'Position carefully with generous padding: peripheral nerves are unusually susceptible to compression injury.',
    ],
    avoid: [
      'Selecting oversized endotracheal tubes: hypertrophy of vocal cords and subglottic mucosa necessitates smaller tube sizes (e.g., 6.5 to 7.0 mm).',
      'Blind nasal intubation or aggressive nasal instrumentation: enlarged turbinates bleed easily; nasal route is contraindicated if transsphenoidal surgery is planned.',
      'Administering full doses of neuromuscular blockers before verifying ability to mask ventilate.',
    ],
    postop: [
      'High risk of acute postoperative airway obstruction: extubate fully awake, in upright position, after complete neuromuscular reversal.',
      'Continuous pulse oximetry and CPAP support for patients with underlying obstructive sleep apnea; avoid excessive opioid sedation.',
      'Monitor fluid balance, urine output, and serum sodium for diabetes insipidus or SIADH following transsphenoidal pituitary surgery.',
      'Provide glucocorticoid replacement if anterior pituitary insufficiency or hypophysectomy occurs.',
    ],
  }),
];
