import { entry, type ConditionRecord } from './types';

export const MULTISYSTEM_CONDITIONS: ConditionRecord[] = [
  // Liver, gut and metabolism
  entry('gilbert', 'Gilbert syndrome', 16, [], {
    preop: [
      'Benign hereditary unconjugated hyperbilirubinemia from reduced UDP-glucuronosyltransferase (UGT1A1) activity.',
      'Jaundice is typically mild and triggered by fasting, dehydration, emotional stress, infection, or fatigue.',
      'Liver architecture, transaminases, and synthetic hepatic function are completely normal.',
      'Reassure patient; minimize preoperative fasting duration and avoid hypocaloric dehydration.',
    ],
    intraop: [
      'Avoid prolonged dehydration or starvation during surgery; administer intravenous glucose-containing fluids if fasting is extended.',
      'Standard anesthetic drugs are well tolerated; volatile agents and intravenous anesthetics can be used safely.',
      'Acetaminophen clearance may be modestly reduced, but standard therapeutic doses remain safe.',
      'Maintain normothermia and hemodynamic stability throughout the perioperative period.',
    ],
    avoid: [
      'Prolonged starvation, dehydration, and fasting without intravenous fluids (markedly elevates serum bilirubin).',
      'Unnecessary extensive hepatic testing or delaying surgery for asymptomatic mild jaundice.',
    ],
    postop: [
      'Anticipate that mild scleral icterus and jaundice may transiently worsen due to surgical stress and fasting.',
      'Reassure the surgical team and patient that postoperative jaundice reflects benign unconjugated hyperbilirubinemia and not liver injury.',
      'Resume oral intake promptly to normalize bilirubin clearance.',
    ],
  }),

  entry('crigler-najjar', 'Crigler-Najjar syndrome', 16, [], {
    preop: [
      'Severe inherited deficiency of UGT1A1 enzyme with life-threatening unconjugated hyperbilirubinemia and high kernicterus risk.',
      'Type 1 has absent enzyme activity (transfusion and phototherapy dependent, requiring liver transplantation); Type 2 has partial activity and responds to phenobarbital.',
      'Review baseline total and unconjugated bilirubin, neurological status, and regular phototherapy schedule.',
      'Ensure serum albumin is within normal limits to provide sufficient bilirubin-binding capacity.',
    ],
    intraop: [
      'Maintain continuous phototherapy in the operating room whenever feasible; ensure protective eye shielding.',
      'Preserve normal albumin levels: administer human albumin if necessary to bind free unconjugated bilirubin and prevent central nervous system entry.',
      'Use anesthetic agents with minimal albumin-displacement effects.',
      'Maintain strict normothermia, normocarbia, and normal pH: acidemia and hypothermia promote bilirubin penetration through the blood-brain barrier.',
    ],
    avoid: [
      'Medications that displace bilirubin from albumin binding sites: sulfonamides, ceftriaxone, furosemide, salicylates, and diazepam.',
      'Metabolic acidosis, hypothermia, and hypoalbuminemia: all markedly increase the fraction of free toxic bilirubin.',
    ],
    postop: [
      'Resume intensive phototherapy and liberal hydration immediately in the post-anesthesia care unit.',
      'Perform serial unconjugated bilirubin measurements and close neurological evaluations for signs of acute bilirubin encephalopathy.',
      'Maintain normothermia and physiological acid-base balance.',
    ],
  }),

  entry('achalasia', 'Achalasia', 17, [], {
    preop: [
      'Failure of lower esophageal sphincter relaxation with esophageal aperistalsis, resulting in megaesophagus and retained food secretions.',
      'Extreme aspiration risk: treat as a full stomach regardless of fasting duration or NPO interval.',
      'Screen for chronic pulmonary aspiration, nocturnal coughing, recurrent pneumonia, and esophageal dilation on imaging.',
      'Preoperative clear liquid diet for 48 hours is often advised prior to elective surgery.',
    ],
    intraop: [
      'Treat as full stomach: perform esophageal decompression via large-bore suction tube prior to induction in semi-upright position if massive dilation is present.',
      'Rapid sequence induction (RSI) with cricoid pressure and cuffed endotracheal tube, or awake fiberoptic intubation with head elevated.',
      'Maintain smooth depth of anesthesia; avoid coughing, bucking, or straining during airway instrumentation.',
      'Coordinate carefully with surgeons during esophageal myotomy or endoscopic procedures to avoid esophageal perforation.',
    ],
    avoid: [
      'Induction of general anesthesia in a flat supine position without securing the airway.',
      'Light planes of anesthesia that provoke vomiting, retching, or active regurgitation during induction.',
      'Blind forceful insertion of esophageal dilators or temperature probes (high risk of esophageal wall perforation).',
    ],
    postop: [
      'Extubate only when patient is fully conscious, upright, with complete recovery of protective airway reflexes.',
      'Observe for signs of intraoperative esophageal perforation (mediastinitis, surgical emphysema, pleural effusion, unexplained tachycardia, fever).',
      'Provide effective multimodal analgesia and chest physiotherapy.',
    ],
  }),

  entry('zollinger-ellison', 'Zollinger-Ellison syndrome', 17, ['gastrinoma'], {
    preop: [
      'Gastrin-secreting neuroendocrine tumor (gastrinoma) causing massive gastric acid hypersecretion, peptic ulcers, and secretory diarrhea.',
      'Patients often present with dehydration, hypokalemia, and metabolic alkalosis from high-volume gastric output.',
      'Continue high-dose proton pump inhibitors (PPIs) without interruption up to the time of surgery; switch to IV pantoprazole.',
      'Assess fluid balance and correct electrolyte abnormalities (hypokalemia, hypochloremia) before induction.',
    ],
    intraop: [
      'Extreme aspiration risk: massive volume of highly acidic gastric secretions.',
      'Administer intravenous H2-receptor antagonists and high-dose PPIs; consider preoperative nasogastric decompression.',
      'Perform rapid sequence induction (RSI) with cricoid pressure and a cuffed endotracheal tube.',
      'Monitor arterial blood gases and potassium levels during long procedures.',
    ],
    avoid: [
      'Omitting acid-suppressive therapy on the morning of surgery.',
      'Unprotected airway instrumentation or mask ventilation without cricoid pressure before intubation.',
    ],
    postop: [
      'Continue parenteral proton pump inhibitor therapy around the clock to prevent acute rebound acid hypersecretion and stress ulceration.',
      'Maintain continuous gastric decompression if postoperative ileus or abdominal distension occurs.',
      'Monitor serum electrolytes, renal function, and fluid balance in the recovery unit.',
    ],
  }),

  entry(
    'carcinoid-syndrome',
    'Carcinoid syndrome',
    17,
    ['carcinoid tumor', 'carcinoid crisis', 'neuroendocrine tumor'],
    {
      preop: [
        'Give octreotide 24 to 48 hours before surgery and continue it through the procedure: somatostatin analogues can prevent a carcinoid crisis.',
        'Look for right-sided heart disease (fibrosis of the tricuspid and pulmonary valves), dehydration and electrolyte loss from diarrhea, and wheezing.',
      ],
      intraop: [
        'Use invasive arterial pressure monitoring: blood pressure can change rapidly.',
        'Give octreotide again before the tumor is handled; it attenuates most adverse hemodynamic responses.',
        'Carcinoid crisis: intense flushing, diarrhea, tachycardia, and hypertension or hypotension, sometimes with bronchospasm.',
        'Bronchospasm is often resistant to treatment, and beta agonists can worsen it through mediator release; octreotide and antihistamines with ipratropium have been used.',
        'Drugs not known to release mediators: propofol, etomidate, vecuronium, cisatracurium, rocuronium, fentanyl, sufentanil, alfentanil, remifentanil and all inhalation agents (desflurane may suit liver metastases).',
        'Epidural analgesia is safe after adequate octreotide treatment if the local anesthetic is given gradually with careful hemodynamic monitoring.',
      ],
      avoid: [
        'Histamine-releasing drugs.',
        'Drugs that may provoke mediator release: succinylcholine, mivacurium, atracurium, epinephrine, norepinephrine, dopamine, isoproterenol and thiopental.',
      ],
      postop: [
        'Delayed awakening has been described; plan ICU monitoring when needed.',
        'Symptoms can persist after palliative surgery or with metastases.',
        'Ondansetron is a good antiemetic for these patients.',
      ],
    },
  ),

  // Kidney
  entry('goodpasture', 'Goodpasture syndrome', 21, ['anti-gbm disease'], {
    preop: [
      'Autoimmune anti-glomerular basement membrane (anti-GBM) antibody disease causing glomerulonephritis and necrotizing pulmonary alveolar hemorrhage.',
      'Screen for active alveolar bleeding: hemoptysis, dyspnea, bilateral pulmonary infiltrates, and acute drop in hematocrit.',
      'Evaluate renal impairment, severe oliguria, and electrolyte imbalances; coordinate preoperative hemodialysis or plasmapheresis.',
      'Review immunosuppressive therapy (cyclophosphamide, high-dose corticosteroids) and infection vulnerability.',
    ],
    intraop: [
      'High risk of sudden intraoperative pulmonary hemorrhage and refractory hypoxemia.',
      'Prepare for lung isolation (double-lumen tube or bronchial blocker) to protect the unaffected lung if unilateral bleeding occurs.',
      'Employ gentle lung-protective ventilation: low tidal volumes, moderate PEEP, and avoid high peak airway pressures.',
      'Avoid nephrotoxic medications; titrate fluid administration strictly according to volume status.',
    ],
    avoid: [
      'Fluid overload in oliguric or anuric renal failure: dangerously worsens alveolar hemorrhage and pulmonary edema.',
      'Excessive ventilatory airway pressures that provoke capillary barotrauma and fresh pulmonary hemorrhage.',
      'Nephrotoxic drugs (NSAIDs, aminoglycosides).',
    ],
    postop: [
      'Admit to intensive care with continuous arterial line and pulse oximetry monitoring.',
      'Perform serial chest radiographs and arterial blood gas measurements to detect occult or recurrent alveolar bleeding.',
      'Continue post-procedure hemodialysis and immunosuppressive therapy as directed by nephrology.',
    ],
  }),

  entry('polycystic-kidney', 'Polycystic kidney disease', 21, ['adpkd'], {
    preop: [
      'Autosomal dominant polycystic kidney disease (ADPKD) with enlarged cystic kidneys, hypertension, hepatic cysts, and intracranial berry aneurysms.',
      'Intracranial berry aneurysms occur in 10% to 15% of patients: screen for severe headaches or family history of subarachnoid hemorrhage.',
      'Assess renal function, chronic hypertension, and hepatic cyst burden (hepatomegaly may reduce diaphragm mobility and functional residual capacity).',
      'Screen for cardiac valvular abnormalities: mitral valve prolapse and aortic regurgitation occur with increased frequency.',
    ],
    intraop: [
      'Strict blood pressure control: prevent intraoperative hypertension during induction, intubation, and emergence to minimize berry aneurysm rupture risk.',
      'Full-stomach precautions: massively enlarged kidneys and liver compress the stomach and raise intra-abdominal pressure, increasing aspiration risk.',
      'Careful positioning to protect protruding flanks and polycystic organs from external pressure.',
      'Titrate fluid administration carefully and avoid nephrotoxic agents.',
    ],
    avoid: [
      'Severe hypertension or sympathetic surges during intubation and emergence (risk of intracranial berry aneurysm rupture).',
      'Nephrotoxic medications (NSAIDs, aminoglycosides).',
      'Direct abdominal pressure on large, fragile renal cysts.',
    ],
    postop: [
      'Maintain tight blood pressure control in recovery to avoid hemorrhagic complications.',
      'Continuous cardiac telemetry for patients with mitral valve prolapse or conduction defects.',
      'Urgent neurosurgical consultation and imaging for any acute postoperative headache, vomiting, or neurological changes.',
    ],
  }),

  entry('bartter-gitelman', 'Bartter and Gitelman syndromes', 21, ['bartter syndrome', 'gitelman syndrome'], {
    preop: [
      'Inherited renal tubular defects (Bartter: thick ascending loop of Henle; Gitelman: distal convoluted tubule) causing renal salt wasting and hypokalemic alkalosis.',
      'Key laboratory abnormalities: hypokalemia, hypomagnesemia, metabolic alkalosis, and hyperreninemic hyperaldosteronism with normal or low blood pressure.',
      'Check potassium, magnesium, calcium, and intravascular volume status; aggressive preoperative electrolyte replenishment is required.',
      'Review chronic spironolactone, ACE inhibitors, or oral potassium/magnesium supplementation.',
    ],
    intraop: [
      'Severe hypokalemia and hypomagnesemia predispose to cardiac arrhythmias (prolonged QT interval, torsades de pointes, ventricular ectopy).',
      'Hypokalemia potentiates nondepolarizing neuromuscular blockade: monitor train-of-four and titrate relaxants with caution.',
      'Monitor arterial blood gases, potassium, and magnesium during long procedures.',
      'Maintain normal intravascular volume with balanced electrolyte crystalloids.',
    ],
    avoid: [
      'Hyperventilation and respiratory alkalosis: acutely shifts extracellular potassium into cells, precipitating life-threatening ventricular arrhythmias.',
      'Potassium-free intravenous fluids.',
      'Loop or thiazide diuretics.',
    ],
    postop: [
      'Continue intravenous potassium and magnesium supplementation with serial laboratory verification until oral intake resumes.',
      'Continuous ECG telemetry monitoring for arrhythmias and QT prolongation in the recovery unit.',
      'Monitor neuromuscular function closely for signs of residual weakness.',
    ],
  }),

  entry('fanconi-syndrome', 'Fanconi syndrome', 21, [], {
    preop: [
      'Generalized proximal tubular dysfunction causing renal loss of glucose, amino acids, phosphate, bicarbonate (type 2 proximal RTA), and potassium.',
      'Patients exhibit chronic metabolic acidosis, hypokalemia, hypophosphatemia, dehydration, and osteomalacia or rickets with bone fragility.',
      'Check baseline arterial blood gases, serum bicarbonate, electrolytes, phosphate, and volume status.',
      'Review chronic bicarbonate, potassium, and phosphate supplementation therapy.',
    ],
    intraop: [
      'Maintain intravenous hydration using balanced crystalloids with bicarbonate supplementation if severe acidosis persists.',
      'Hypophosphatemia and hypokalemia cause diaphragmatic and skeletal muscle weakness and prolong neuromuscular block: monitor train-of-four.',
      'Handle extremities with extreme gentleness: osteomalacia and demineralized bones fracture easily under minimal stress.',
      'Maintain normothermia and normal ventilatory parameters to avoid worsening acidosis.',
    ],
    avoid: [
      'Large infusions of unbuffered normal saline: worsens hyperchloremic metabolic acidosis.',
      'Rough handling, aggressive limb manipulation, or excessive pressure on osteomalacic bones (fracture risk).',
      'Dehydration and hypovolemia.',
    ],
    postop: [
      'Serial monitoring of serum electrolytes, bicarbonate, and phosphate.',
      'Continue replacement infusions until oral intake is established.',
      'Assess respiratory muscle strength and ventilatory mechanics before extubation.',
    ],
  }),

  // Skin and connective tissue
  entry('epidermolysis-bullosa', 'Epidermolysis bullosa', 24, ['eb'], {
    preop: [
      'Inherited mechano-bullous disorder where minor friction or shearing forces produce intraepidermal or subepidermal blisters and skin denudation.',
      'Airway involvement: microstomia, ankyloglossia, pharyngeal scarring, esophageal strictures, and laryngeal narrowing.',
      'Strictly avoid adhesive tape, standard identification bands, and shearing skin contact on arrival in the operating suite.',
      'Plan airway technique: prepare video laryngoscopy, fiberoptic equipment, and smaller endotracheal tubes.',
    ],
    intraop: [
      'Strictly NO adhesive tape: secure lines, eyes, and tubes with soft silicone wraps, petrolatum gauze, or rolled gauze bandages.',
      'Generously lubricate face masks, oral airways, and laryngoscope blades with hydrocortisone ointment or water-soluble lubricant.',
      'Select a smaller endotracheal tube than predicted; gently insert without twisting or shearing mucous membranes.',
      'Pad all pressure points, operating table surfaces, and positioning aids with non-adherent silicone gel pads.',
      'Place blood pressure cuff over soft cotton padding and cycle manually or at extended intervals.',
    ],
    avoid: [
      'Any friction, shear, or rubbing force on skin or mucous membranes.',
      'Standard adhesive tapes, adhesive monitoring electrodes, and sticky dressings.',
      'Forceful or repetitive airway instrumentation.',
    ],
    postop: [
      'Protect all blisters: aspirate large bullae with sterile fine-needle decompression without stripping the epidermal blister roof.',
      'Transfer patient with wide sliding sheets; never drag or pull on limbs.',
      'Multimodal analgesia with antiemetics to prevent distress, thrashing, and oral retching.',
    ],
  }),

  entry('pemphigus', 'Pemphigus', 24, [], {
    preop: [
      'Autoimmune intraepidermal blistering disease (anti-desmoglein antibodies) producing flaccid bullae, mucosal ulcerations, and a positive Nikolsky sign.',
      'Patients are chronically immunosuppressed with high-dose corticosteroids, azathioprine, mycophenolate, or rituximab.',
      'Evaluate mucosal involvement of lips, tongue, pharynx, and larynx; determine stress-dose corticosteroid requirements.',
      'Examine skin lesions and plan atraumatic positioning and line placement.',
    ],
    intraop: [
      'Avoid frictional trauma and shear forces on skin and mucous membranes.',
      'Use generously lubricated face masks and non-adhesive silicone dressings; avoid standard adhesive tapes on skin.',
      'Atraumatic airway management: inspect oropharynx carefully and perform gentle intubation to avoid denuding friable mucosal lesions.',
      'Administer intravenous stress-dose hydrocortisone before surgical incision.',
      'Strict aseptic technique: extensive skin breakdown and chronic immunosuppression create high risk for systemic infection.',
    ],
    avoid: [
      'Adhesive tapes and abrasive monitoring adhesives directly on skin.',
      'Forceful suctioning or traumatic direct laryngoscopy that shears oral or pharyngeal mucosa.',
    ],
    postop: [
      'Continue stress-dose corticosteroid coverage and taper according to surgical stress protocol.',
      'Meticulous skin and wound care with non-adherent sterile dressings.',
      'Monitor closely for secondary surgical site or systemic bacterial infections.',
    ],
  }),

  entry('mastocytosis', 'Mastocytosis', 24, ['urticaria pigmentosa'], {
    preop: [
      'Abnormal proliferation and accumulation of mast cells in skin (urticaria pigmentosa) and visceral organs (systemic mastocytosis).',
      'Predisposed to sudden, massive mast cell degranulation with histamine, prostaglandin, and leukotriene release causing profound shock.',
      'Premedicate with H1-receptor antagonists (diphenhydramine) and H2-receptor antagonists (famotidine), plus oral corticosteroids or cromolyn.',
      'Identify and document patient-specific triggers (temperature changes, stress, mechanical friction, specific medications).',
    ],
    intraop: [
      'Maintain strict normothermia: avoid rapid temperature changes, shivering, cold intravenous fluids, and mechanical skin friction.',
      'Have emergency resuscitation drugs immediately available: epinephrine, vasopressin, antihistamines, and large-volume crystalloids.',
      'Safe anesthetic agents: propofol, etomidate, volatile agents, fentanyl, vecuronium, and cisatracurium are clinically well tolerated.',
      'Invasive arterial pressure monitoring is recommended for major surgical procedures.',
    ],
    avoid: [
      'Histamine-releasing drugs: morphine, codeine, meperidine, atracurium, mivacurium, and succinylcholine.',
      'Physical and mechanical triggers: hypothermia, hyperthermia, shivering, mechanical skin rubbing, and cold IV fluid boluses.',
      'Nonsteroidal anti-inflammatory drugs (NSAIDs) if patient has a history of aspirin/NSAID-induced degranulation.',
    ],
    postop: [
      'Observe in PACU or ICU for delayed mast cell degranulation and hemodynamic collapse.',
      'Continue scheduled H1 and H2 antihistamine therapy into the recovery period.',
      'Treat acute hypotensive episodes promptly with epinephrine and intravenous fluid resuscitation.',
    ],
  }),

  entry('scleroderma', 'Scleroderma', 24, ['systemic sclerosis'], {
    preop: [
      'Multisystem autoimmune disease characterized by vascular damage, fibrosis of skin, lungs, gastrointestinal tract, heart, and kidneys.',
      'Airway evaluation: microstomia, tight facial skin, reduced mandibular excursion, and stiff neck tissues predict difficult intubation.',
      'Severe gastrointestinal dysmotility and lower esophageal incompetence: high aspiration risk.',
      'Cardiopulmonary assessment: screen for restrictive interstitial lung disease, pulmonary arterial hypertension, and Raynaud phenomenon.',
    ],
    intraop: [
      'Anticipate difficult airway: prepare video laryngoscopy or flexible fiberoptic bronchoscope.',
      'Full-stomach precautions: perform rapid sequence induction with cricoid pressure and cuffed endotracheal tube.',
      'Keep the operating room warm; use fluid warmers and padded extremity wraps to prevent severe Raynaud digital vasospasm and necrosis.',
      'Invasive arterial monitoring is recommended for major cases; avoid radial lines if severe digital ischemia or Raynaud disease is present.',
      'Use lung-protective ventilation with low tidal volumes in patients with restrictive pulmonary fibrosis.',
    ],
    avoid: [
      'Hypothermia, cold operating rooms, and cold intravenous infusions (precipitates severe Raynaud vasospasm and tissue ischemia).',
      'High ventilatory airway pressures in patients with stiff, fibrotic lungs.',
      'Peripheral vasoconstrictors unless absolutely necessary.',
    ],
    postop: [
      'Maintain warm room temperature and adequate analgesia to prevent sympathetic Raynaud flare-ups.',
      'Monitor blood pressure and renal function closely: acute hypertension warns of scleroderma renal crisis, requiring immediate ACE inhibitor therapy.',
      'High vigilance for post-extubation aspiration and respiratory failure.',
    ],
  }),

  entry('pseudoxanthoma-elasticum', 'Pseudoxanthoma elasticum', 24, [], {
    preop: [
      'Inherited fragmentation and calcification of elastic fibers (ABCC6 mutation) affecting skin, eyes (angioid streaks), and arteries.',
      'Cardiovascular risks: premature coronary artery disease, calcified peripheral arteries, renovascular hypertension, and cardiac ischemia.',
      'Gastrointestinal risks: fragile mucosal vessels cause spontaneous and traumatic upper gastrointestinal bleeding.',
      'Screen for angina, exercise intolerance, claudication, and history of GI hemorrhage.',
    ],
    intraop: [
      'Arterial cannulation may be difficult due to calcified, occluded peripheral arteries; verify collateral circulation before cannulation.',
      'Fragile mucosal vasculature: gentle intubation and suctioning; avoid aggressive nasogastric tube insertion (risk of massive mucosal bleeding).',
      'Maintain stable hemodynamics: avoid tachycardia and hypotension to prevent myocardial ischemia in premature coronary disease.',
      'Careful patient positioning with generous padding on all bony points.',
    ],
    avoid: [
      'Traumatic instrumentation of mucous membranes (high risk of mucosal and upper gastrointestinal hemorrhage).',
      'Nonsteroidal anti-inflammatory drugs (NSAIDs) and antiplatelet agents.',
      'Severe hemodynamic fluctuations that compromise coronary or cerebral perfusion.',
    ],
    postop: [
      'Continuous ECG telemetry monitoring for myocardial ischemia and arrhythmias.',
      'Monitor serial hematocrit and inspect for signs of gastrointestinal hemorrhage.',
      'Maintain stable blood pressure control to protect fragile, calcified arterial vasculature.',
    ],
  }),

  entry('ehlers-danlos', 'Ehlers-Danlos syndrome', 24, ['eds'], {
    preop: [
      'Heterogeneous connective tissue disorder of collagen synthesis; vascular type (Type IV) carries extreme risk of arterial, bowel, and uterine rupture.',
      'Classical and hypermobility types feature severe joint laxity, skin hyperextensibility, tissue fragility, and easy bruising.',
      'Screen for aortic root dilation, mitral valve prolapse, spontaneous pneumothorax history, and vascular type diagnosis.',
      'Evaluate coagulation: bleeding time may be prolonged despite normal standard coagulation assays.',
    ],
    intraop: [
      'Vascular access precautions: invasive arterial and central venous cannulation carries catastrophic vessel dissection/rupture risk in vascular EDS; avoid unless life-saving.',
      'Employ low ventilatory airway pressures to prevent spontaneous alveolar rupture and tension pneumothorax.',
      'Meticulous positioning and padding: joints subluxate and dislocate easily during transfer and positioning.',
      'Gentle airway instrumentation to prevent pharyngeal lacerations, vocal cord hematomas, and temporomandibular joint dislocation.',
    ],
    avoid: [
      'Invasive arterial and central venous lines in vascular EDS unless mandatory (high arterial dissection and rupture risk).',
      'High peak inspiratory airway pressures (pneumothorax risk).',
      'Rough joint manipulation or extreme hyperextension during positioning.',
      'Intramuscular injections and blind regional nerve blocks.',
    ],
    postop: [
      'Monitor closely for occult vascular hemorrhage, retroperitoneal bleeding, pneumothorax, and hematoma expansion.',
      'Avoid vigorous physical therapy or aggressive joint mobilization in early recovery.',
      'Provide multimodal analgesia with antiemetics to prevent straining and retching.',
    ],
  }),

  entry('marfan', 'Marfan syndrome', 24, [], {
    preop: [
      'Autosomal dominant fibrillin-1 mutation causing aortic root dilation, aortic dissection, mitral valve prolapse, and skeletal deformities.',
      'Pulmonary risk: spontaneous pneumothorax from apical bullae, pectus excavatum, and scoliosis.',
      'Airway evaluation: high-arched palate, retrognathia, and temporomandibular joint laxity may complicate airway management.',
      'Review recent echocardiogram (aortic root diameter, valvular regurgitation) and continue beta-blocker therapy up to induction.',
    ],
    intraop: [
      'Strict hemodynamic control: prevent hypertension, tachycardia, and increased myocardial contractility (dP/dt) to protect the fragile aortic root.',
      'Continue beta-blockers; treat acute hypertensive episodes promptly with esmolol, labetalol, or nitroprusside.',
      'Gentle airway instrumentation: avoid trauma to high-arched palate and loose dentition.',
      'Employ protective lung ventilation with low tidal volumes and low peak pressures to prevent rupture of apical pulmonary blebs.',
    ],
    avoid: [
      'Intraoperative hypertension and tachycardia: sharply increases aortic wall shear stress and dissection risk.',
      'High airway pressures and vigorous positive-pressure ventilation (spontaneous pneumothorax risk).',
    ],
    postop: [
      'Maintain tight blood pressure and heart rate control with intravenous beta-blockers in PACU and ICU.',
      'Continuous cardiac telemetry monitoring for arrhythmias.',
      'Urgent diagnostic evaluation (CT angiogram or TEE) for any acute chest, back, or abdominal pain.',
    ],
  }),

  // Bone and joints
  entry('kyphoscoliosis', 'Kyphoscoliosis', 24, ['scoliosis'], {
    preop: [
      'Severe spinal deformity producing restrictive lung defect, reduced vital capacity, ventilation-perfusion mismatch, and pulmonary hypertension.',
      'Curvature Cobb angle > 100 degrees carries substantial risk of chronic cor pulmonale and postoperative respiratory failure.',
      'Review pulmonary function tests, baseline arterial blood gases, echocardiogram, and spinal imaging.',
      'Assess airway and cervical mobility: associated cervical deformities may complicate intubation.',
    ],
    intraop: [
      'Anticipate difficult mask ventilation, positioning challenges, and reduced chest wall compliance.',
      'Intraoperative neuromonitoring (SSEP/MEP) during corrective spinal surgery: use total intravenous anesthesia (TIVA) without muscle relaxants after induction.',
      'Blood loss can be extensive: employ cell salvage, tranexamic acid, and have crossmatched blood available.',
      'Use lung-protective ventilation; monitor for elevated peak airway pressures.',
    ],
    avoid: [
      'Prolonged neuromuscular blockade during motor evoked potential monitoring.',
      'Nitrous oxide in patients with underlying pulmonary arterial hypertension.',
      'Excessive crystalloid resuscitation causing pulmonary edema in low-capacity lungs.',
    ],
    postop: [
      'High risk of postoperative respiratory failure, atelectasis, and prolonged mechanical ventilation.',
      'Admit to ICU; implement aggressive pulmonary toilet, incentive spirometry, and noninvasive respiratory support.',
      'Multimodal analgesia with neuraxial or regional techniques (epidural or erector spinae blocks) to avoid opioid-induced hypoventilation.',
    ],
  }),

  entry('ankylosing-spondylitis', 'Ankylosing spondylitis', 24, ['bamboo spine'], {
    preop: [
      'Chronic inflammatory spondyloarthropathy causing spinal fusion ("bamboo spine"), fixed cervical kyphosis, and restricted chest expansion.',
      'Airway warning: severe restriction of cervical spine mobility, reduced mouth opening (TMJ involvement), and rigid thoracic cage.',
      'Cardiac evaluation: screen for aortic insufficiency, cardiac conduction defects, and bundle branch blocks.',
      'Plan awake fiberoptic intubation or video laryngoscopy in the pre-formed neutral position.',
    ],
    intraop: [
      'Anticipate impossible direct laryngoscopy and impossible neck extension: perform awake fiberoptic intubation.',
      'Brittle, rigid spine: handle patient with extreme care; minor trauma or neck manipulation can cause cervical spine fracture and quadriplegia.',
      'Neuraxial anesthesia is technically difficult or impossible due to ossified interspinous ligaments and fused vertebrae.',
      'Pad all pressure points carefully to conform to the patient\'s fixed posture.',
    ],
    avoid: [
      'Any attempt to forcefully extend the cervical spine: high risk of catastrophic cervical spine fracture and spinal cord transection.',
      'Forceful direct laryngoscopy with rigid blades.',
      'Blind attempts at neuraxial anesthesia without imaging guidance.',
    ],
    postop: [
      'Maintain strict cervical spine immobilization in neutral position until patient is fully conscious and cooperative.',
      'Monitor for restrictive hypoventilation, atelectasis, and airway compromise.',
      'Perform detailed neurological checks of all four extremities postoperatively.',
    ],
  }),

  entry('paget', 'Paget disease of bone', 24, [], {
    preop: [
      'Disorganized bone remodeling causing enlarged, structurally weak, highly vascular bones, skull deformities, and platybasia.',
      'Extensive skeletal involvement acts as an arteriovenous shunt, producing high-output cardiac failure.',
      'Evaluate cranial nerve function, cervical spine involvement, and cardiac function on echocardiography.',
      'Review baseline serum alkaline phosphatase, calcium levels, and bisphosphonate or calcitonin therapy.',
    ],
    intraop: [
      'Examine airway for restricted cervical motion, platybasia, and basilar invagination.',
      'Anticipate massive intraoperative surgical hemorrhage during orthopedic bone surgery due to intense bone hypervascularity.',
      'Have large-bore intravenous access, cell salvage, and crossmatched blood products prepared.',
      'Manage high-output cardiac state carefully; avoid myocardial depressants and large swings in systemic vascular resistance.',
    ],
    avoid: [
      'Extreme cervical neck flexion or extension in patients with platybasia or basilar invagination.',
      'Underestimating surgical blood loss during bone reaming or osteotomy.',
    ],
    postop: [
      'Monitor closely for postoperative hemorrhage, hematoma expansion, and high-output heart failure decompensation.',
      'Check serum calcium levels: hypocalcemia can develop following bisphosphonate administration or extensive remodeling.',
      'Continue cardiac telemetry monitoring.',
    ],
  }),

  entry('achondroplasia', 'Achondroplasia', 24, ['dwarfism'], {
    preop: [
      'Most common skeletal dysplasia (FGFR3 mutation) causing disproportionate dwarfism, macrocephaly, and midface hypoplasia.',
      'Neurological and skeletal risks: foramen magnum stenosis, craniocervical instability, spinal stenosis, and kyphoscoliosis.',
      'Respiratory risks: severe obstructive sleep apnea, restrictive pulmonary mechanics, and pulmonary hypertension.',
      'Airway assessment: large tongue, small mouth, midface retrusion, and limited neck extension.',
    ],
    intraop: [
      'Difficult airway: avoid neck hyperextension during laryngoscopy due to foramen magnum stenosis and cervicomedullary compression.',
      'Use video laryngoscopy or flexible fiberoptic intubation with in-line cervical stabilization.',
      'Neuraxial anesthesia is technically challenging (narrow epidural space, spinal stenosis); drastically reduce local anesthetic dosing due to diminished CSF volume.',
      'Position carefully with generous padding; protect large head and neck.',
    ],
    avoid: [
      'Neck hyperextension or extreme flexion during airway management and positioning (causes acute brainstem or spinal cord compression).',
      'Standard adult local anesthetic dosing for spinal anesthesia (causes dangerously high or total spinal block).',
    ],
    postop: [
      'High risk of postoperative upper airway obstruction, sleep apnea, and respiratory depression: extubate fully awake in upright position.',
      'Continuous pulse oximetry and respiratory monitoring in PACU or step-down unit.',
      'Avoid heavy opioid sedation; utilize multimodal non-opioid analgesics.',
    ],
  }),

  entry('russell-silver', 'Russell-Silver syndrome', 24, ['silver-russell syndrome'], {
    preop: [
      'Congenital growth disorder with prenatal and postnatal dwarfism, characteristic triangular facies, micrognathia, and body asymmetry.',
      'High vulnerability to fasting hypoglycemia due to scarce muscle mass and depleted hepatic glycogen stores.',
      'Assess airway: micrognathia and small mouth predict difficult laryngoscopy.',
      'Check baseline blood glucose; avoid prolonged fasting and start intravenous dextrose infusion prior to surgery.',
    ],
    intraop: [
      'Anticipate difficult airway: have video laryngoscopy and fiberoptic equipment prepared; select smaller endotracheal tubes.',
      'Maintain continuous intravenous dextrose infusion; perform frequent intraoperative blood glucose checks.',
      'Precarious thermoregulation: utilize forced-air warming blankets and warmed fluids to prevent rapid hypothermia.',
      'Careful positioning to protect asymmetric limbs and fragile skeletal structures.',
    ],
    avoid: [
      'Prolonged preoperative fasting without intravenous dextrose supplementation.',
      'Hypothermia: small body mass leads to rapid thermal loss.',
      'Using oversized endotracheal tubes: larynx and subglottis are proportionately small.',
    ],
    postop: [
      'Continue serial blood glucose monitoring until regular oral intake is established.',
      'Close respiratory monitoring for post-extubation airway edema or croup.',
      'Maintain active warming until normal body temperature is secured.',
    ],
  }),

  entry('tracheomegaly', 'Tracheomegaly', 24, ['mounier-kuhn syndrome'], {
    preop: [
      'Marked congenital dilation of trachea and main bronchi from muscular and elastic tissue atrophy (Mounier-Kuhn syndrome).',
      'Presents with recurrent lower respiratory tract infections, bronchiectasis, copious sputum, and dynamic tracheobronchial collapse.',
      'Review chest CT imaging to evaluate the exact internal tracheal diameter and sites of dynamic collapse.',
      'Optimize pulmonary status with preoperative chest physiotherapy and bronchodilators.',
    ],
    intraop: [
      'Standard endotracheal tube cuffs may fail to seal the abnormally dilated trachea, producing massive ventilatory leaks and aspiration risk.',
      'Prepare specialized large-diameter tubes, tubes with extra-large cuffs, or place the tube distal to the tracheal enlargement.',
      'High risk of dynamic airway collapse during exhalation: apply positive end-expiratory pressure (PEEP) to stent airways open.',
      'Avoid high inspiratory peak pressures that cause tracheal overdistension or diverticular rupture.',
    ],
    avoid: [
      'High peak inspiratory airway pressures that risk rupture of fragile, dilated tracheal diverticula.',
      'Overinflating standard ETT cuffs to extreme pressures to seal leaks (causes tracheal mucosal ischemia and necrosis).',
    ],
    postop: [
      'High risk of dynamic tracheobronchial collapse upon extubation: extubate with CPAP and have noninvasive positive pressure ventilation ready.',
      'Aggressive chest physiotherapy, humidified oxygen, and clearance of thick retained secretions.',
      'Observe closely in PACU or ICU for signs of acute respiratory compromise.',
    ],
  }),

  entry('prader-willi', 'Prader-Willi syndrome', 24, [], {
    preop: [
      'Neurodevelopmental disorder (chromosome 15q deletion) with morbid hyperphagic obesity, hypotonia, and severe obstructive sleep apnea.',
      'Associated conditions: daytime hypersomnolence, pulmonary hypertension, cor pulmonale, type 2 diabetes, and altered pain threshold.',
      'High aspiration risk: chronic food gorging and delayed gastric emptying mean full stomach must be assumed regardless of stated fasting history.',
      'Screen for difficult airway from obesity and short thick neck.',
    ],
    intraop: [
      'Perform rapid sequence induction (RSI) with cricoid pressure and cuffed endotracheal tube.',
      'Difficult mask ventilation and intubation: prepare ramped positioning, video laryngoscopy, and supraglottic airways.',
      'Prone to severe temperature instability (hypothermia or unexplained hyperthermia): monitor temperature continuously.',
      'Extreme sensitivity to central respiratory depressants: titrate opioids sparingly.',
    ],
    avoid: [
      'Relying on patient or family fasting history (secret binge eating and hoarding are characteristic features).',
      'Excessive opioid administration: prolonged postoperative apnea and hypoventilation are common.',
    ],
    postop: [
      'Continuous pulse oximetry and respiratory monitoring in ICU or monitored step-down unit.',
      'High risk of postoperative obstructive apnea, hypoventilation, and atelectasis: use CPAP/BiPAP support.',
      'Implement early mobilization and aggressive mechanical and chemical venous thromboembolism prophylaxis.',
    ],
  }),

  entry('prune-belly', 'Prune-belly syndrome', 24, ['eagle-barrett syndrome'], {
    preop: [
      'Triad of congenital absence or hypoplasia of abdominal wall muscles, urinary tract dilation with renal dysplasia, and cryptorchidism.',
      'Pulmonary hypoplasia and absent abdominal expulsive muscles produce severe cough impairment and chronic respiratory compromise.',
      'Evaluate baseline renal function, electrolytes, and urinary tract anatomy.',
      'Assess respiratory status: screen for recurrent pulmonary infections and baseline oxygen saturation.',
    ],
    intraop: [
      'Absent abdominal musculature severely impairs ability to generate cough and clear secretions postoperatively.',
      'Response to nondepolarizing neuromuscular blockers is unpredictable: titrate carefully using quantitative train-of-four monitoring.',
      'Maintain renal perfusion with balanced crystalloids; avoid nephrotoxic drugs.',
      'Handle extremities and position gently: associated skeletal deformities are common.',
    ],
    avoid: [
      'Overdosing neuromuscular blockers in the presence of weak abdominal and respiratory musculature.',
      'Nephrotoxic medications in patients with baseline renal dysplasia.',
    ],
    postop: [
      'Aggressive pulmonary toilet, suctioning, and assisted cough maneuvers are essential for secretion clearance.',
      'Close monitoring of renal function, electrolytes, and urine output.',
      'Observe for postoperative atelectasis and respiratory fatigue in a monitored unit.',
    ],
  }),

  entry('meige', 'Meige syndrome', 24, [], {
    preop: [
      'Focal cranial dystonia characterized by blepharospasm and oromandibular dystonia (jaw clenching, involuntary tongue protrusion, and grimacing).',
      'Involvement of laryngeal and pharyngeal musculature can cause spasmodic dysphonia and upper airway obstruction.',
      'Review current medications: anticholinergics, baclofen, and botulinum toxin injections.',
      'Assess speech, swallowing, and airway patency prior to induction.',
    ],
    intraop: [
      'Oromandibular spasms or laryngeal adductor dystonia can cause acute airway obstruction during induction or emergence.',
      'Ensure smooth induction with adequate anesthetic depth and complete neuromuscular blockade before laryngoscopy.',
      'Avoid dopamine antagonists which provoke acute dystonic crises.',
      'Ensure complete reversal of neuromuscular blockade before attempting extubation.',
    ],
    avoid: [
      'Dopamine receptor antagonists: metoclopramide, droperidol, haloperidol, and phenothiazines.',
      'Light planes of anesthesia during airway instrumentation that precipitate reflex laryngeal spasm.',
    ],
    postop: [
      'Extubate only when patient is fully conscious with intact bulbar reflexes and complete neuromuscular recovery.',
      'Observe closely in PACU for acute oromandibular dystonic spasms or tongue retraction.',
      'Have anticholinergic agents (diphenhydramine, benztropine) available to treat acute dystonic flare-ups.',
    ],
  }),

  entry('spasmodic-dysphonia', 'Spasmodic dysphonia', 24, [], {
    preop: [
      'Task-specific focal laryngeal dystonia causing involuntary spasms of vocal cord muscles during phonation.',
      'Adductor type (most common) causes strained, strangled voice; abductor type causes breathy, whispering voice.',
      'Patients often receive regular laryngeal botulinum toxin injections; determine interval since last injection.',
      'Evaluate airway for residual vocal cord paresis, aspiration history, or stridor.',
    ],
    intraop: [
      'Examine vocal cords during laryngoscopy for spasms or asymmetry; select appropriately sized endotracheal tubes.',
      'Ensure deep anesthesia and adequate muscle relaxation before intubation to prevent traumatic laryngospasm.',
      'Atraumatic airway management: avoid mucosal trauma or edema that worsens baseline vocal cord dysfunction.',
      'Monitor neuromuscular blockade with train-of-four.',
    ],
    avoid: [
      'Light anesthesia or premature airway manipulation that triggers reflex vocal cord adduction and severe laryngospasm.',
      'Traumatic intubation that damages delicate vocal cord tissues.',
    ],
    postop: [
      'Perform smooth extubation to prevent coughing, bucking, or post-extubation laryngospasm.',
      'Observe in PACU for upper airway patency, stridor, and swallowing safety.',
      'Provide humidified oxygen and voice rest in the immediate recovery period.',
    ],
  }),

  entry('chondrodysplasia-calcificans', 'Chondrodysplasia calcificans', 24, [], {
    preop: [
      'Rare congenital skeletal dysplasia (Conradi-Hünermann syndrome) with punctate epiphyseal calcifications, asymmetric limb shortening, and cataracts.',
      'Craniofacial and spinal dysmorphism: midface hypoplasia, micrognathia, saddle nose, kyphoscoliosis, and cervical vertebral instability.',
      'Assess airway, cervical spine mobility, and restrictive pulmonary defect.',
      'Check for associated cardiac septal defects and renal anomalies.',
    ],
    intraop: [
      'Difficult airway: anticipate challenging bag-mask ventilation and direct laryngoscopy; have video laryngoscopy and fiberoptic bronchoscope ready.',
      'Select smaller endotracheal tubes due to tracheal and subglottic hypoplasia.',
      'Gentle positioning with meticulous padding: contractures, asymmetric limb shortening, and scoliosis make positioning precarious.',
      'Avoid forceful neck manipulation during intubation.',
    ],
    avoid: [
      'Neck hyperextension during laryngoscopy in the presence of cervical vertebral instability or spinal stenosis.',
      'Forceful airway instrumentation.',
    ],
    postop: [
      'Close airway observation in PACU for post-extubation croup, stridor, and subglottic narrowing.',
      'Monitor respiratory mechanics and pulse oximetry.',
      'Provide multimodal analgesia with careful attention to positioning comfort.',
    ],
  }),

  entry('erythromelalgia', 'Erythromelalgia', 24, [], {
    preop: [
      'Rare neurovascular disorder (voltage-gated sodium channel SCN9A mutation) causing episodic burning pain, erythema, and increased warmth in extremities.',
      'Episodes are triggered by warmth, exercise, or dependency and relieved by elevation and cold exposure.',
      'Identify patient-specific triggers, successful cooling strategies, and chronic neuropathic analgesics.',
      'Screen for underlying myeloproliferative disorders in secondary erythromelalgia.',
    ],
    intraop: [
      'Maintain cool or neutral ambient operating room temperature: avoid warming affected extremities (warmth triggers excruciating flare-ups).',
      'Regional anesthesia (epidural, peripheral nerve blocks) provides sympathetic blockade and exceptional perioperative pain relief.',
      'If general anesthesia is used, employ multimodal analgesia (lidocaine infusion, ketamine) to suppress neuropathic pain cascades.',
      'Avoid prolonged extremity dependency.',
    ],
    avoid: [
      'Direct heat, forced-air warming blankets placed directly over affected limbs, and high ambient OR temperatures.',
      'Prolonged immersion of limbs in ice water (risks severe frostbite, tissue necrosis, and ulceration).',
    ],
    postop: [
      'Continue regional nerve blocks or epidural infusions for postoperative pain management.',
      'Maintain comfortable, cool ambient room temperatures; avoid placing heavy warm blankets over feet and hands.',
      'Monitor for rebound vasodilation and burning pain upon resolution of regional anesthesia.',
    ],
  }),

  entry('klippel-feil', 'Klippel-Feil syndrome', 24, [], {
    preop: [
      'Congenital fusion of cervical vertebrae: classic triad of short neck, low posterior hairline, and severely limited cervical range of motion.',
      'Major airway alert: impossible neck extension, craniocervical instability, and high risk of spinal cord injury during airway management.',
      'Associated anomalies: scoliosis, cardiac septal defects, renal agenesis, and Sprengel deformity of the scapula.',
      'Review cervical spine imaging and perform comprehensive preoperative neurological examination.',
    ],
    intraop: [
      'Severe limitation of cervical flexion and extension makes direct laryngoscopy hazardous or impossible: perform awake fiberoptic intubation.',
      'Maintain strict in-line cervical spine stabilization; absolutely avoid neck extension or rotation during intubation and positioning.',
      'Position patient with generous padding tailored to their fixed cervical anatomy.',
      'Neuraxial techniques are generally contraindicated or technically challenging due to extensive spinal anomalies.',
    ],
    avoid: [
      'Any forceful cervical extension, flexion, or manipulation (carries high risk of spinal cord compression and permanent quadriplegia).',
      'Blind direct laryngoscopy.',
    ],
    postop: [
      'Maintain neutral cervical alignment until patient is fully conscious and cooperative.',
      'Perform detailed neurological examinations of all four extremities immediately upon emergence and in PACU.',
      'Observe closely for airway edema or respiratory insufficiency.',
    ],
  }),

  entry('osteogenesis-imperfecta', 'Osteogenesis imperfecta', 24, ['brittle bone disease', 'oi'], {
    preop: [
      'Inherited defect in type I collagen synthesis causing extreme bone fragility, recurrent fractures, blue sclerae, and dentinogenesis imperfecta.',
      'Associated features: kyphoscoliosis, restrictive lung defect, platelet dysfunction, and hypermetabolic state mimicking malignant hyperthermia.',
      'Airway evaluation: brittle teeth, fragile mandible, short neck, and basilar invagination.',
      'Plan atraumatic transfer and positioning; prepare video laryngoscopy.',
    ],
    intraop: [
      'Extreme fragility: minimal trauma causes fractures; pad all operating surfaces and avoid aggressive manipulation.',
      'Cycle blood pressure cuff manually or at extended intervals; avoid overinflation (cuff inflation can fracture the humerus).',
      'Atraumatic airway management: gentle mask application and video laryngoscopy to protect fragile teeth and cervical spine.',
      'Hyperthermia and hypermetabolism can occur intraoperatively; monitor temperature and EtCO2 closely (differentiate from MH; volatile agents are not contraindicated).',
    ],
    avoid: [
      'Succinylcholine: violent muscle fasciculations can produce multiple bone fractures.',
      'Automated high-pressure cycling of blood pressure cuffs (causes humerus and arm fractures).',
      'Forceful jaw thrust, tight mask straps, or aggressive direct laryngoscopy (fractures mandible or cervical spine).',
    ],
    postop: [
      'Meticulous nursing transfer: lift patient using wide support draw-sheets; never pull or lift by limbs.',
      'Monitor for postoperative bleeding and hematoma formation due to capillary fragility and platelet dysfunction.',
      'Provide effective multimodal analgesia.',
    ],
  }),

  entry('fop', 'Fibrodysplasia ossificans progressiva', 24, ['fop'], {
    preop: [
      'Catastrophic genetic disorder (ACVR1 mutation) with progressive heterotopic ossification of skeletal muscle, tendons, ligaments, and fascia.',
      'Minor trauma, intramuscular injections, biopsies, and muscle stretching trigger explosive new bone formation and permanent joint ankylosis.',
      'Temporomandibular joint is typically completely ankylosed (zero mouth opening); severe thoracic insufficiency from fused chest wall.',
      'Plan awake fiberoptic nasotracheal intubation; assess nasal airway patency.',
    ],
    intraop: [
      'Complete TMJ ankylosis makes oral intubation impossible: awake fiberoptic nasotracheal intubation is mandatory.',
      'Never attempt to force the jaw open or use oral airways (causes irreversible jaw ossification and complete airway obstruction).',
      'Position patient strictly in their pre-existing fixed posture using customized pillows, gel pads, and foam supports.',
      'Strictly avoid all intramuscular injections: administer all medications intravenously.',
    ],
    avoid: [
      'ANY intramuscular injection, muscle stretching, or surgical biopsy (triggers catastrophic heterotopic ossification).',
      'Forcible opening of the mouth, jaw thrust, or direct oral laryngoscopy.',
      'Attempting to straighten or force rigid limbs into conventional surgical positions.',
    ],
    postop: [
      'Maintain patient in their custom fixed posture without manipulating limbs.',
      'Continue strictly atraumatic care and intravenous medication delivery.',
      'High vigilance for respiratory failure due to rigid thoracic cage and restrictive lung disease.',
    ],
  }),

  // Malignant hyperthermia
  entry(
    'mh-susceptibility',
    'Malignant hyperthermia susceptibility',
    24,
    ['mh', 'mhs', 'malignant hyperthermia'],
    {
      preop: [
        'Plan a trigger-free anesthetic: any combination of sedation, TIVA or regional anesthesia.',
        'Have the MH cart with dantrolene immediately available.',
        'Treat central core disease and King-Denborough syndrome as MH susceptible unless proven otherwise; Duchenne and Becker muscular dystrophies are also highly associated.',
      ],
      intraop: [
        'Prepare the machine: remove the vaporizers, change the CO2 absorbent and the breathing circuit, and fit activated charcoal filters on the inspiratory and expiratory limbs.',
        'Flush with fresh gas at 10 to 15 L/min for 10 to 15 minutes (some authors suggest up to 60 minutes for modern machines), then confirm the gas analyzer reads zero volatile agent in both limbs.',
        'Early signs of a crisis: rising EtCO2, tachycardia, tachypnea, masseter or generalized rigidity, mixed acidosis, sweating, mottled skin, arrhythmias and labile blood pressure. A rising temperature is a later sign.',
      ],
      avoid: [
        'All halogenated volatile anesthetics: sevoflurane, desflurane, isoflurane, halothane, enflurane and methoxyflurane.',
        'Succinylcholine.',
      ],
      postop: [
        'After masseter rigidity from succinylcholine, observe for 12 to 24 hours (EtCO2, urine, creatine kinase, potassium and blood gases). MHAUS advises creatine kinase and urine myoglobin every 6 hours for 36 hours.',
        'After a crisis, admit to ICU for at least 24 hours and continue dantrolene, because recurrence is common. Crisis steps and dantrolene doses are in SOS › MH.',
      ],
    },
    'mh',
  ),

  // Immune, cancer and psychiatric
  entry('hereditary-angioedema', 'Hereditary angioedema', 26, ['hae', 'c1 esterase inhibitor deficiency'], {
    preop: [
      'Deficiency or dysfunction of C1 esterase inhibitor producing unregulated bradykinin release, causing severe episodic angioedema.',
      'Surgical trauma, dental work, and airway manipulation are potent triggers of life-threatening laryngeal edema.',
      'Administer preoperative prophylaxis: C1-esterase inhibitor concentrate (plasma-derived or recombinant), or fresh frozen plasma if concentrate is unavailable.',
      'Examine airway and have emergency rescue medications in the operating room prior to induction.',
    ],
    intraop: [
      'Have targeted rescue medications immediately at hand: C1-esterase inhibitor concentrate, icatibant (bradykinin B2 antagonist), or ecallantide.',
      'Standard anaphylaxis treatments (epinephrine, antihistamines, corticosteroids) are ineffective because HAE is mediated by bradykinin, not histamine.',
      'Perform gentle, atraumatic airway instrumentation; minimize pharyngeal and laryngeal friction.',
      'Maintain hemodynamic stability and minimize surgical stress.',
    ],
    avoid: [
      'Relying on epinephrine, antihistamines, or corticosteroids to treat an acute HAE attack (ineffective against bradykinin).',
      'Traumatic or repetitive airway manipulation.',
      'Angiotensin-converting enzyme (ACE) inhibitors: strictly contraindicated (blocks bradykinin breakdown and precipitates fatal attacks).',
    ],
    postop: [
      'High risk of delayed laryngeal edema: swelling can develop up to 24 to 72 hours postoperatively.',
      'Observe in PACU or ICU with immediate fiberoptic airway rescue and tracheostomy capability ready at bedside.',
      'Continue prophylactic therapy until tissue inflammation and surgical wounds have stabilized.',
    ],
  }),

  entry('svc-syndrome', 'Superior vena cava / superior mediastinal syndrome', 27, ['anterior mediastinal mass', 'svc obstruction'], {
    preop: [
      'Obstruction of superior vena cava and tracheobronchial tree by anterior mediastinal mass (lymphoma, thymoma, germ cell tumor).',
      'Presents with facial, neck, and airway edema, venous engorgement, elevated intracranial pressure, orthopnea, and stridor.',
      'Review CT imaging: evaluate cross-sectional tracheal area, carinal compression, and cardiac or pulmonary artery involvement.',
      'Assess symptoms in supine position: severe orthopnea or dyspnea predicts catastrophic complete airway collapse under general anesthesia.',
    ],
    intraop: [
      'Induction of general anesthesia and muscle relaxation eliminates spontaneous negative-pressure breathing, causing fatal, irreversible airway collapse and RV outflow obstruction.',
      'Prefer local anesthesia with ketamine sedation preserving spontaneous ventilation, or awake fiberoptic intubation in semi-Fowler position.',
      'Establish lower-extremity intravenous access (femoral or saphenous): upper extremity venous return is obstructed and drugs are delayed.',
      'Have rigid bronchoscope, repositioning plan (prone/lateral), and ECMO/cardiopulmonary bypass backup immediately on standby.',
    ],
    avoid: [
      'Neuromuscular blockers and general anesthesia with loss of spontaneous ventilation before establishing airway safety and bypass standby.',
      'Upper-extremity intravenous access for emergency resuscitation drugs and fluid administration.',
      'Supine positioning: compresses tracheobronchial tree and heart under the tumor.',
    ],
    postop: [
      'Extubate only when patient is fully awake, spontaneous ventilation is robust, and in sitting or head-up position.',
      'Nurse in head-elevated position to reduce facial, cerebral, and laryngeal venous edema.',
      'Maintain immediate access to rigid bronchoscopy and emergency airway equipment.',
    ],
  }),

  entry('nms', 'Neuroleptic malignant syndrome', 29, ['nms'], {
    preop: [
      'Life-threatening idiosyncratic reaction to dopamine receptor antagonists (antipsychotics, metoclopramide) or withdrawal of dopaminergic agents.',
      'Manifests with hyperthermia, generalized "lead-pipe" muscle rigidity, altered mental status, autonomic lability, and marked creatine kinase elevation.',
      'Evaluate renal function, electrolytes, urine myoglobin, and arterial blood gases; coordinate ICU stabilization.',
      'Differentiate from malignant hyperthermia: NMS involves central dopamine depletion, not a primary ryanodine receptor channelopathy.',
    ],
    intraop: [
      'Emergency management: active external cooling, generous intravenous fluid hydration, and dantrolene or bromocriptine administration.',
      'Administer balanced crystalloids to maintain brisk urine output and prevent acute renal failure from rhabdomyolysis and myoglobinuria.',
      'Invasive arterial pressure monitoring is indicated to manage profound blood pressure lability and autonomic storms.',
      'Continuous core temperature monitoring with esophageal or bladder probes.',
    ],
    avoid: [
      'Dopamine receptor antagonists: haloperidol, droperidol, metoclopramide, and phenothiazines.',
      'Succinylcholine: high risk of catastrophic hyperkalemic cardiac arrest secondary to extensive rhabdomyolysis.',
    ],
    postop: [
      'Admit to intensive care for continuous hemodynamic monitoring, active cooling, and renal protection.',
      'Maintain forced alkaline diuresis to prevent myoglobin-induced acute tubular necrosis.',
      'Continue bromocriptine or dantrolene until muscle rigidity and hyperthermia resolve.',
    ],
  }),

  // Pediatric
  entry('cdh', 'Congenital diaphragmatic hernia', 31, ['cdh'], {
    preop: [
      'Herniation of abdominal viscera into the thoracic cavity causing bilateral pulmonary hypoplasia, pulmonary hypertension, and persistent fetal circulation.',
      'Decompress stomach immediately with a continuous-suction Replogle or nasogastric tube to prevent gut distension.',
      'Assess preoperative echocardiogram for pulmonary artery pressures, ductal shunting, and associated cardiac defects.',
      'Avoid emergency surgery: postpone operative repair until pulmonary vascular resistance and hemodynamics stabilize.',
    ],
    intraop: [
      'Avoid bag-mask ventilation prior to intubation: forces gas into the herniated stomach and bowel, worsening pulmonary compression.',
      'Immediate gentle intubation by experienced provider; employ gentle lung-protective ventilation.',
      'Maintain low peak inspiratory pressures (< 25 cmH2O) and accept permissive hypercapnia to avoid barotrauma to the fragile hypoplastic contralateral lung.',
      'Have inhaled nitric oxide (iNO) and inotropes immediately available for acute pulmonary hypertensive crises.',
    ],
    avoid: [
      'Bag-valve-mask positive pressure ventilation before intubation (inflates intrathoracic bowel and causes respiratory arrest).',
      'High peak inspiratory pressures (causes contralateral pneumothorax, pulmonary hemorrhage, and death).',
      'Nitrous oxide: diffuses rapidly into herniated bowel loops, causing massive mediastinal shift.',
    ],
    postop: [
      'Transport directly to neonatal intensive care unit intubated; continue lung-protective ventilation and pulmonary vasodilator therapy.',
      'High vigilance for sudden desaturation: immediately suspect contralateral tension pneumothorax or acute pulmonary hypertensive crisis.',
      'Delayed extubation until pulmonary vascular remodeling allows adequate oxygenation.',
    ],
  }),

  entry('ea-tef', 'Esophageal atresia and tracheoesophageal fistula', 31, ['tef', 'oesophageal atresia'], {
    preop: [
      'Congenital esophageal discontinuity with fistula connecting trachea to lower esophagus (Type C most common).',
      'High risk of gastric distension, aspiration of acidic secretions, and chemical pneumonitis.',
      'Maintain continuous suctioning of blind proximal pouch with a Replogle catheter; nurse in semi-upright position.',
      'Screen for VACTERL association (vertebral, anal, cardiac, TEF, renal, limb anomalies); perform echocardiogram to rule out right-sided aortic arch.',
    ],
    intraop: [
      'Perform gentle awake or inhalational induction preserving spontaneous breathing until airway is intubated.',
      'Position endotracheal tube carefully so the tip lies distal to the tracheal fistula but proximal to the carina.',
      'Avoid positive pressure mask ventilation prior to intubation: air enters the fistula, causing massive gastric distension and impaired diaphragmatic excursion.',
      'If gastric distension prevents ventilation, surgical gastrostomy or emergency fistula occlusion may be necessary.',
    ],
    avoid: [
      'Positive pressure mask ventilation before intubation (inflates stomach, elevates diaphragm, and risks gastric rupture).',
      'Placing the endotracheal tube bevel or tip proximal to the fistula opening.',
    ],
    postop: [
      'Transport intubated to neonatal ICU; avoid neck hyperextension which places tension on the fresh esophageal anastomosis.',
      'Maintain low airway pressures to prevent anastomotic leak or tracheal disruption.',
      'Avoid blind suctioning of the esophagus: mark suction catheters to prevent catheter tip from disrupting surgical repair.',
    ],
  }),

  entry('spina-bifida', 'Spina bifida', 31, ['myelomeningocele'], {
    preop: [
      'Neural tube defect with herniation of meninges and spinal cord; strongly associated with Chiari II malformation and hydrocephalus.',
      'Latex allergy alert: patients have extremely high rates of latex sensitization; enforce strict 100% latex-free precautions from birth.',
      'Assess for signs of brainstem compression from Chiari II malformation: stridor, central sleep apnea, dysphagia, and weak cry.',
      'Protect the open neural placode with sterile saline dressings; prevent hypothermia.',
    ],
    intraop: [
      'Strict latex-free environment throughout the surgical suite, including gloves, catheters, and equipment.',
      'Induction and intubation in supine position with the open defect supported in a padded sterile donut ring, or in lateral position.',
      'Prone positioning requires careful chest and pelvic rolls to ensure free abdominal excursion and prevent elevated airway pressures.',
      'Maintain aggressive thermoregulation: neonates lose heat rapidly through exposed neural tissue.',
    ],
    avoid: [
      'ANY latex-containing medical equipment, gloves, or materials.',
      'Direct pressure or trauma to the unprotected neural placode during induction, positioning, or surgery.',
    ],
    postop: [
      'Nurse in prone or lateral position to prevent tension on the spinal surgical incision.',
      'Continuous monitoring for central apnea, stridor, and vocal cord dysfunction secondary to Chiari II malformation.',
      'Maintain latex-free precautions indefinitely across all hospital units.',
    ],
  }),

  entry('sma', 'Spinal muscular atrophy', 31, ['sma', 'werdnig-hoffmann disease'], {
    preop: [
      'Autosomal recessive motor neuron degeneration (SMN1 mutation) causing progressive symmetrical muscle weakness, hypotonia, and bulbar paralysis.',
      'Severe restrictive pulmonary impairment, weak cough, inability to clear secretions, and recurrent aspiration pneumonias.',
      'Review pulmonary function, baseline oxygen saturation, scoliosis, and recent nusinersen or gene therapy history.',
      'Assess cardiac function: cardiomyopathy and conduction abnormalities can occur.',
    ],
    intraop: [
      'Extreme sensitivity to nondepolarizing neuromuscular blockers: if used, drastically reduce dosing under quantitative train-of-four monitoring.',
      'Prefer total intravenous anesthesia (TIVA) without muscle relaxants whenever feasible.',
      'Absolute contraindication to succinylcholine: denervated skeletal muscles release massive, fatal amounts of potassium.',
      'Full-stomach precautions: bulbar dysfunction and gastric hypomotility increase aspiration risk.',
    ],
    avoid: [
      'Succinylcholine: causes catastrophic hyperkalemic cardiac arrest.',
      'Standard doses of nondepolarizing neuromuscular blockers: leads to prolonged postoperative paralysis.',
    ],
    postop: [
      'High risk of postoperative respiratory failure, atelectasis, and extubation failure: prepare noninvasive positive pressure ventilation (BiPAP).',
      'Aggressive airway suctioning, cough assistance, and chest physiotherapy.',
      'Observe in pediatric intensive care unit with close monitoring of ventilatory mechanics.',
    ],
  }),

  entry('pierre-robin', 'Pierre Robin sequence', 31, [], {
    preop: [
      'Congenital triad of micrognathia, glossoptosis, and cleft palate resulting in severe neonatal upper airway obstruction.',
      'Prone or lateral positioning often relieves airway obstruction by allowing the posterior tongue to fall forward.',
      'Assess severity of airway obstruction, feeding difficulties, chronic hypoxemia, and secondary pulmonary hypertension.',
      'Plan primary difficult airway strategy: assemble specialized pediatric airway equipment.',
    ],
    intraop: [
      'Major difficult airway: bag-mask ventilation and direct laryngoscopy are exceptionally difficult due to micrognathia and tongue displacement.',
      'Prepare video laryngoscopy, paraglossal straight-blade approach, supraglottic airway devices, and flexible fiberoptic bronchoscope.',
      'Preserve spontaneous ventilation during inhalational induction until the airway is secured; avoid muscle relaxants before intubation.',
      'Position patient prone or lateral if supine ventilation becomes impossible.',
    ],
    avoid: [
      'Administering neuromuscular blockers prior to confirming ability to ventilate and intubate.',
      'Supine induction without airway adjuncts or position modification.',
    ],
    postop: [
      'High risk of severe upper airway obstruction upon extubation.',
      'Extubate only when fully awake, in prone or lateral position, with immediate availability of airway rescue gear.',
      'Continuous pulse oximetry and respiratory monitoring in neonatal intensive care.',
    ],
  }),

  entry('hemifacial-microsomia', 'Hemifacial microsomia', 31, ['goldenhar syndrome'], {
    preop: [
      'Asymmetric hypoplasia of structures derived from 1st and 2nd branchial arches: unilateral mandibular and maxillary hypoplasia and microtia.',
      'Goldenhar variant includes epibulbar dermoids, vertebral anomalies (cervical spine fusion/hemivertebrae), and congenital heart disease.',
      'Airway evaluation: marked facial asymmetry, limited mouth opening, and deviated laryngeal anatomy.',
      'Screen for cervical spine instability and congenital cardiac defects on echocardiography.',
    ],
    intraop: [
      'Anticipate severe unilateral difficult airway: laryngoscopy is complicated by asymmetric mandibular hypoplasia and a deviated larynx.',
      'Use video laryngoscopy or flexible fiberoptic intubation; introduce blade from the less affected, larger side of the mouth.',
      'Avoid forceful neck manipulation during airway instrumentation in patients with uncharacterized cervical vertebral anomalies.',
      'Protect epibulbar dermoids and eyes with sterile lubricant and protective shields.',
    ],
    avoid: [
      'Assuming symmetrical airway anatomy during mask ventilation and laryngoscopy.',
      'Forceful neck extension or rotation in patients with cervical spine hemivertebrae.',
    ],
    postop: [
      'Close observation in recovery for stridor, unilateral soft tissue obstruction, and airway compromise.',
      'Position head to optimize airway patency toward the unaffected side.',
      'Provide humidified oxygen and multimodal analgesia.',
    ],
  }),

  entry('treacher-collins', 'Treacher Collins syndrome', 31, [], {
    preop: [
      'Mandibulofacial dysostosis (TCOF1 mutation) with severe bilateral micrognathia, malar hypoplasia, cleft palate, and choanal atresia.',
      'Airway difficulty is severe and worsens progressively with age as facial structures grow disproportionately.',
      'Screen for obstructive sleep apnea, choanal atresia/stenosis, and associated hearing loss.',
      'Formulate primary and secondary difficult airway management plans with pediatric ENT support.',
    ],
    intraop: [
      'Major difficult airway alert: direct laryngoscopy is frequently impossible (grade 4 view in majority of patients).',
      'Use video laryngoscopy, optical stylets, or fiberoptic intubation through a supraglottic airway device.',
      'Maintain spontaneous ventilation during inhalational induction until the airway is definitively secured.',
      'Nasal intubation may be impossible due to choanal stenosis or atresia; evaluate nasal patency before attempting nasal passage.',
    ],
    avoid: [
      'Administering neuromuscular blockers before the trachea is successfully intubated.',
      'Blind nasal intubation or aggressive nasal instrumentation without confirming choanal patency.',
    ],
    postop: [
      'High risk of catastrophic post-extubation airway obstruction: extubate fully awake, in upright or prone position.',
      'Tracheostomy equipment and advanced airway rescue carts must remain at bedside.',
      'Admit to pediatric intensive care unit for continuous respiratory and oxygenation monitoring.',
    ],
  }),

  entry('apert', 'Apert syndrome', 31, [], {
    preop: [
      'Craniosynostosis syndrome with midface hypoplasia, high-arched palate, choanal stenosis, complex hand/foot syndactyly, and elevated ICP.',
      'High incidence of cervical spine anomalies (C5-C6 fusion present in up to 70% of patients).',
      'Assess for severe obstructive sleep apnea, elevated intracranial pressure, and restricted cervical motion.',
      'Plan for massive blood loss and brain relaxation during cranial vault remodeling procedures.',
    ],
    intraop: [
      'Difficult mask ventilation and intubation due to midface retrusion, narrow nasopharynx, and high-arched constricted palate.',
      'Handle cervical spine with extreme care: maintain in-line stabilization during laryngoscopy and positioning.',
      'Blood loss during craniosynostosis repair can be rapid and massive: ensure large-bore venous access, arterial line, and crossmatched blood.',
      'Avoid hypercapnia and maintain brain relaxation to prevent acute herniation.',
    ],
    avoid: [
      'Neck hyperextension during airway management and positioning (risk of cervical cord compression).',
      'Hypoventilation causing hypercapnia and acute intracranial pressure spikes.',
    ],
    postop: [
      'High risk of postoperative upper airway obstruction from facial edema and underlying sleep apnea: nurse in head-elevated position.',
      'Admit to pediatric intensive care unit following craniofacial surgery.',
      'Monitor neurological status, hematocrit, and coagulation parameters closely.',
    ],
  }),

  entry('crouzon', 'Crouzon syndrome', 31, [], {
    preop: [
      'Craniosynostosis syndrome with bicoronal synostosis, midface hypoplasia, shallow orbits with severe proptosis, and elevated ICP.',
      'Unlike Apert syndrome, extremities are normal (no complex syndactyly) and cervical spine fusion is less frequent.',
      'Screen for obstructive sleep apnea, elevated intracranial pressure, and chronic airway compromise.',
      'Evaluate degree of proptosis: extreme eye prominence requires meticulous corneal protection.',
    ],
    intraop: [
      'Difficult mask ventilation and intubation from midface hypoplasia and narrow pharyngeal dimensions; prepare video laryngoscopy.',
      'Protect protruding eyes with lubricating ointment, moisture chambers, and careful tape application (high risk of corneal ulceration).',
      'Manage intraoperative blood loss and brain relaxation during cranial vault remodeling surgery.',
      'Maintain tight control of EtCO2 and hemodynamics to preserve cerebral perfusion pressure.',
    ],
    avoid: [
      'Direct pressure on protruding globes during mask ventilation or positioning (causes corneal abrasion or globe subluxation).',
      'Hypercapnia and venous hypertension that elevate intracranial pressure.',
    ],
    postop: [
      'Close respiratory monitoring in PICU for stridor, upper airway obstruction, and sleep apnea.',
      'Maintain continuous eye protection and lubrication into the recovery period.',
      'Serial neurological evaluations for signs of elevated intracranial pressure.',
    ],
  }),

  entry('laryngeal-papillomatosis', 'Laryngeal papillomatosis', 31, ['recurrent respiratory papillomatosis'], {
    preop: [
      'Human papillomavirus (HPV 6 and 11) infection causing recurrent exophytic papillomas of the larynx, vocal cords, and subglottis.',
      'Presents with progressive hoarseness, stridor, and life-threatening upper airway obstruction.',
      'Review operative laryngoscopy records and imaging to assess extent of glottic obstruction.',
      'Plan shared airway management with the ENT surgical team: discuss tubeless anesthesia, laser precautions, and jet ventilation.',
    ],
    intraop: [
      'Shared airway: close communication between anesthesiologist and surgeon is essential throughout the procedure.',
      'Techniques include inhalational induction preserving spontaneous breathing, intermittent apnea with small endotracheal tube, or jet ventilation.',
      'If laser surgery is performed, strictly adhere to airway fire protocol: FiO2 <= 30%, laser-safe endotracheal tube with saline-filled cuff.',
      'Gentle instrumentation to prevent dislodging papilloma clusters into distal tracheobronchial tree.',
    ],
    avoid: [
      'Laser ablation in high FiO2 environments (catastrophic airway fire hazard).',
      'Dislodging friable papilloma fragments into distal airways during instrumentation (causes pulmonary dissemination).',
    ],
    postop: [
      'High risk of acute postoperative laryngeal edema, vocal cord spasm, and stridor.',
      'Administer intravenous dexamethasone and humidified oxygen.',
      'Observe in PACU with emergency re-intubation and tracheostomy equipment immediately available at bedside.',
    ],
  }),

  entry('down-syndrome', 'Down syndrome (trisomy 21)', 31, ['trisomy 21'], {
    preop: [
      'Trisomy 21 with high prevalence of congenital heart disease (AV canal defects, VSD, ASD, ToF), atlantoaxial instability, and sleep apnea.',
      'Atlantoaxial instability occurs in 15% to 20%: review cervical spine flexion/extension radiographs and screen for neurological signs.',
      'Airway evaluation: macroglossia, tonsillar hypertrophy, small mouth, and subglottic stenosis.',
      'Review echocardiogram for residual shunts, pulmonary hypertension, or ventricular dysfunction.',
    ],
    intraop: [
      'Cervical spine precautions: maintain neutral neck alignment; avoid extreme flexion or extension during intubation and positioning.',
      'Airway sizing: macroglossia and subglottic stenosis are common; select an endotracheal tube 0.5 to 1.0 mm smaller than expected for age.',
      'Profound bradycardia during inhalational induction is common; treat with glycopyrrolate or atropine.',
      'Venous access may be difficult due to obesity and small peripheral vessels: prepare ultrasound guidance.',
    ],
    avoid: [
      'Extreme neck flexion or extension during laryngoscopy, intubation, and positioning (risk of atlantoaxial subluxation and spinal cord injury).',
      'Using oversized endotracheal tubes: high risk of mucosal injury and severe post-extubation subglottic edema.',
    ],
    postop: [
      'High risk of post-extubation croup, subglottic stridor, and airway obstruction: nurse in head-up position with humidified oxygen.',
      'Continuous pulse oximetry and ECG monitoring for bradycardia and desaturations in recovery.',
      'Careful airway observation before discharge from PACU.',
    ],
  }),
];
