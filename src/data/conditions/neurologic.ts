import { entry, type ConditionRecord } from './types';

export const NEUROLOGIC_CONDITIONS: ConditionRecord[] = [
  // Brain, spine and nerves
  entry('moyamoya', 'Moyamoya disease', 13, [], {
    preop: [
      'Progressive stenosis of terminal internal carotid arteries with fragile basal collateral vessels: review stroke and TIA history.',
      'Identify triggers for transient ischemia: crying, hyperventilation, dehydration, hypotension, and pain.',
      'Maintain liberal hydration before surgery; continue antiplatelet therapy unless surgical bleeding risk strictly prohibits.',
    ],
    intraop: [
      'Maintain strict normocarbia (EtCO2 35 to 40 mmHg): avoid hyperventilation (causes cerebral vasoconstriction and infarction) and severe hypoventilation (causes intracerebral steal).',
      'Maintain baseline or slightly elevated mean arterial pressure to sustain flow through high-resistance collaterals.',
      'Ensure deep surgical anesthesia and aggressive analgesia to prevent sympathetic surges and hyperventilation.',
      'Maintain normothermia and normal hematocrit (target 30% to 35% for optimal cerebral oxygen delivery without hyperviscosity).',
    ],
    avoid: [
      'Hyperventilation and hypocapnia (potent cerebral vasoconstrictors).',
      'Systemic hypotension and hypovolemia.',
      'Agitation, pain, or crying during induction and emergence.',
    ],
    postop: [
      'Admit to neuro-ICU for continuous neurological checks and tight blood pressure titration.',
      'Maintain aggressive multimodal analgesia to prevent postoperative hyperventilation and crying.',
      'Continue generous IV hydration through the recovery period.',
    ],
  }),

  entry('chiari', 'Chiari malformation', 13, ['arnold-chiari malformation'], {
    preop: [
      'Herniation of cerebellar tonsils through foramen magnum: evaluate for signs of brainstem compression, syringomyelia, and elevated intracranial pressure.',
      'Screen for lower cranial nerve dysfunction: dysphagia, depressed gag reflex, vocal cord weakness, and central sleep apnea.',
      'Review cervical spine and posterior fossa neuroimaging for extent of tonsillar descent.',
    ],
    intraop: [
      'Avoid extreme neck flexion or extension during laryngoscopy and positioning: cervical manipulation can cause acute brainstem or cervicomedullary compression.',
      'Employ smooth induction with adequate depth and muscle relaxation to prevent coughing, bucking, or straining that raises intracranial pressure.',
      'Use video laryngoscopy or flexible fiberoptic intubation to minimize cervical spine motion.',
      'Neurophysiologic monitoring (somatosensory and motor evoked potentials) is commonly indicated for posterior fossa decompression.',
    ],
    avoid: [
      'Neck hyperflexion or hyperextension during airway management and prone or sitting positioning.',
      'Coughing, straining, or sudden increases in intrathoracic pressure on induction and emergence.',
      'High positive end-expiratory pressure (PEEP) or hypercapnia that elevates ICP.',
    ],
    postop: [
      'Observe closely in ICU for central respiratory depression, apneas, and vocal cord dysfunction.',
      'Assess swallowing function and gag reflex before initiating oral intake (high aspiration risk).',
    ],
  }),

  entry('tuberous-sclerosis', 'Tuberous sclerosis', 13, [], {
    preop: [
      'Autosomal dominant neurocutaneous disorder: evaluate for central nervous system tubers (refractory epilepsy, cognitive impairment, subependymal giant cell astrocytomas).',
      'Screen for cardiac rhabdomyomas with echocardiogram (may cause outflow tract obstruction, pre-excitation, or ventricular arrhythmias; typically regress with age).',
      'Assess for renal angiomyolipomas (bleeding risk) and pulmonary lymphangioleiomyomatosis in adult females.',
      'Continue home antiepileptic medications up to the morning of surgery.',
    ],
    intraop: [
      'Maintain anticonvulsant coverage and avoid anesthetic agents that precipitate seizure activity.',
      'Prepare for sudden intraoperative arrhythmias or ventricular outflow obstruction if cardiac rhabdomyomas are present.',
      'Employ lung-protective low-pressure ventilation if cystic pulmonary lesions exist.',
    ],
    avoid: [
      'Anesthetic agents that lower seizure threshold (enflurane, meperidine).',
      'Ketamine in patients with intracranial lesions or elevated ICP.',
      'Excessive peak airway pressures in patients with cystic pulmonary disease.',
    ],
    postop: [
      'Continuous ECG telemetry in recovery if cardiac rhabdomyomas or conduction defects exist.',
      'Resume oral antiepileptic medications as early as feasible.',
    ],
  }),

  entry('neurofibromatosis', 'Neurofibromatosis', 13, ['von recklinghausen disease', 'nf1'], {
    preop: [
      'Evaluate for neurofibromas involving the upper airway (tongue, posterior pharyngeal wall, larynx) causing difficult airway anatomy.',
      'Screen for associated undiagnosed pheochromocytoma (1% to 2% prevalence in NF-1): check blood pressure and history of headaches/palpitations.',
      'Assess for spinal deformities (severe kyphoscoliosis) and cervical spine neurofibromas prior to positioning or neuraxial procedures.',
    ],
    intraop: [
      'Prepare for difficult endotracheal intubation: have video laryngoscopy and fiberoptic equipment available.',
      'Expect unpredictable responses to neuromuscular blockers: patients may demonstrate normal response or sensitivity to succinylcholine, and either marked sensitivity or resistance to nondepolarizing agents.',
      'Use quantitative neuromuscular monitoring throughout.',
      'Place arterial line if severe kyphoscoliosis or suspected pheochromocytoma is present.',
    ],
    avoid: [
      'Blind or forceful airway instrumentation that could traumatize vascular neurofibromas.',
      'Unmonitored muscle relaxant dosing without train-of-four monitoring.',
      'Overlooking hypertension that could signify an occult pheochromocytoma.',
    ],
    postop: [
      'Observe closely in PACU for airway edema or stridor following extubation.',
      'Perform detailed documentation of neurological status.',
    ],
  }),

  entry('huntington', 'Huntington disease', 13, ['huntington chorea'], {
    preop: [
      'Progressive autosomal dominant neurodegenerative disorder: assess degree of choreiform movements, dysphagia, and chronic malnutrition.',
      'High risk of pulmonary aspiration due to pharyngeal muscle incoordination and impaired protective airway reflexes.',
      'Review psychiatric medications and continue neuroleptics if indicated.',
    ],
    intraop: [
      'Rapid sequence induction or aspiration prophylaxis is recommended.',
      'Altered response to neuromuscular blockers: sensitivity to both succinylcholine (prolonged apnea reported) and nondepolarizing relaxants (delayed recovery).',
      'Increased sensitivity to IV induction agents: titrate propofol slowly to prevent profound hypotension.',
      'Employ quantitative neuromuscular monitoring to confirm complete reversal.',
    ],
    avoid: [
      'Dopamine receptor antagonists (metoclopramide, droperidol, haloperidol, phenothiazines) that aggravate chorea and extrapyramidal symptoms.',
      'Full doses of neuromuscular blocking agents without objective twitch monitoring.',
    ],
    postop: [
      'Observe closely for post-extubation aspiration; nurse with head-of-bed elevation.',
      'Ensure complete reversal of neuromuscular blockade before extubation.',
    ],
  }),

  entry('multiple-sclerosis', 'Multiple sclerosis', 13, ['ms'], {
    preop: [
      'Document all preexisting motor, sensory, visual, and autonomic deficits thoroughly before surgery.',
      'Screen for autonomic dysfunction (labile blood pressure, resting tachycardia, gastroparesis) and respiratory muscle weakness.',
      'Evaluate chronic baclofen, corticosteroid, or immunosuppressive therapy.',
      'Inform the patient that perioperative relapses can occur regardless of the anesthetic technique chosen.',
    ],
    intraop: [
      'Maintain strict normothermia: an increase in core body temperature as small as 0.5 degrees C can block conduction across demyelinated axons (Uhthoff phenomenon) and trigger clinical relapse.',
      'Succinylcholine is strictly contraindicated: causes life-threatening hyperkalemia due to denervation-induced proliferation of extrajunctional acetylcholine receptors.',
      'Response to nondepolarizing muscle relaxants is variable: patients may exhibit resistance or prolonged weakness; monitor quantitatively.',
      'Spinal anesthesia has been associated with disease exacerbation due to local anesthetic neurotoxicity on demyelinated fibers; epidural and peripheral nerve blocks are considered safe.',
    ],
    avoid: [
      'Hyperthermia (even mild core temperature elevation).',
      'Succinylcholine in all stages of disease (risk of lethal hyperkalemia).',
      'Spinal (intrathecal) anesthesia when alternatives (general, epidural, peripheral block) are available.',
    ],
    postop: [
      'Active temperature management: treat any postoperative fever or shivering promptly with antipyretics and active cooling.',
      'Monitor for respiratory weakness and bulbar insufficiency in advanced disease.',
      'Continue perioperative corticosteroid coverage if chronically administered.',
    ],
  }),

  entry('kearns-sayre', 'Kearns-Sayre syndrome', 13, ['kearns-sayer syndrome'], {
    preop: [
      'Mitochondrial myopathy triad: progressive external ophthalmoplegia, pigmentary retinopathy, and progressive cardiac conduction block before age 20.',
      'Review 12-lead ECG and echocardiogram: high risk of sudden progression to complete atrioventricular heart block and syncope.',
      'Assess pacemaker status if present; ensure external pacing capability is ready in the operating room.',
      'Check baseline serum lactate and glucose.',
    ],
    intraop: [
      'Have transcutaneous or transvenous cardiac pacing immediately available in the room.',
      'Extreme sensitivity to volatile anesthetics, IV induction agents, and nondepolarizing muscle relaxants.',
      'Avoid prolonged infusions of propofol, which impairs mitochondrial fatty acid oxidation.',
      'Avoid lactate-containing IV solutions (Lactated Ringer) to prevent worsening metabolic lactic acidosis.',
      'Maintain normothermia: shivering dramatically increases oxygen consumption and precipitates metabolic decompensation.',
    ],
    avoid: [
      'Lactated Ringer solution and lactate-containing fluids.',
      'Succinylcholine (risk of hyperkalemia).',
      'Prolonged propofol infusions.',
      'Hypothermia, shivering, and prolonged fasting.',
    ],
    postop: [
      'Continuous ECG telemetry monitoring in recovery or step-down unit for progressive heart block.',
      'Monitor arterial blood gases and serum lactate levels.',
    ],
  }),

  entry('autonomic-hyperreflexia', 'Autonomic hyperreflexia (chronic spinal cord injury)', 14, ['autonomic dysreflexia'], {
    preop: [
      'Massive uninhibited sympathetic response in spinal cord injury at or above T6 triggered by cutaneous or visceral stimulation below the lesion (bladder distension, bowel dilation, surgical stimulation).',
      'Review history of autonomic crises (severe headache, facial flushing, profuse sweating above lesion, cutis anserina).',
      'Check baseline blood pressure; patients typically run low resting blood pressure (systolic 90 to 100 mmHg).',
    ],
    intraop: [
      'Establish deep general anesthesia or dense spinal anesthesia: both reliably block the afferent sensory pathway that initiates the reflex arc.',
      'Invasive arterial pressure monitoring is essential for real-time detection and treatment of severe paroxysmal hypertension.',
      'Have rapid-acting vasodilators immediately drawn up and connected to IV line: sodium nitroprusside, nicardipine, nitroglycerin, or phentolamine.',
      'Expect compensatory reflex bradycardia from intact baroreceptor vagal stimulation during hypertensive surges.',
    ],
    avoid: [
      'Light general anesthesia during bladder, pelvic, or lower extremity manipulation.',
      'Succinylcholine after the first 24 to 48 hours post-injury through at least 6 to 12 months or indefinitely (causes lethal hyperkalemia).',
      'Obstructed or full urinary bladder: confirm urinary catheter is draining freely throughout.',
    ],
    postop: [
      'Ensure urinary catheter patency before leaving the OR; bladder distension is the most common postoperative trigger.',
      'Maintain arterial blood pressure monitoring in PACU, as wound pain, vaginal packing, or surgical drains can provoke delayed episodes.',
    ],
  }),

  entry('als', 'Amyotrophic lateral sclerosis', 14, ['als', 'motor neuron disease', 'lou gehrig disease'], {
    preop: [
      'Progressive degeneration of upper and lower motor neurons: evaluate bulbar involvement (dysphagia, dysarthria, high aspiration risk).',
      'Assess pulmonary function: forced vital capacity (FVC < 50% predicts nocturnal hypoventilation and high risk of postop respiratory failure).',
      'Discuss postoperative ventilatory expectations and advanced directives regarding noninvasive ventilation or intubation.',
    ],
    intraop: [
      'Succinylcholine is strictly contraindicated: causes massive, potentially fatal hyperkalemia from widespread lower motor neuron denervation.',
      'Marked sensitivity to nondepolarizing muscle relaxants: small doses produce profound and prolonged paralysis; titrate with quantitative monitoring.',
      'Whenever possible, avoid neuromuscular blockers entirely by using volatile agents or remifentanil for intubation and maintenance.',
      'Maintain aspiration precautions with cuffed tube.',
    ],
    avoid: [
      'Succinylcholine under all circumstances.',
      'Standard doses of nondepolarizing muscle relaxants.',
      'High doses of long-acting opioids or sedatives that precipitate respiratory failure.',
    ],
    postop: [
      'Plan for early noninvasive ventilation (BiPAP) or prolonged mechanical ventilation if FVC is severely compromised.',
      'High risk of postoperative atelectasis and pulmonary aspiration; nurse with head elevated.',
    ],
  }),

  entry('friedreich-ataxia', 'Friedreich ataxia', 14, [], {
    preop: [
      'Autosomal recessive spinocerebellar degeneration: assess for prominent hypertrophic cardiomyopathy (present in up to 90% of patients).',
      'Review echocardiogram for symmetric or asymmetric ventricular hypertrophy and outflow tract obstruction.',
      'Review 12-lead ECG for T-wave inversions, ST abnormalities, and bundle branch blocks.',
      'Evaluate restrictive pulmonary disease secondary to thoracic kyphoscoliosis.',
    ],
    intraop: [
      'Manage hemodynamics according to hypertrophic cardiomyopathy principles: maintain adequate preload, afterload, and normal sinus rhythm.',
      'Avoid drops in systemic vascular resistance or hypovolemia that worsen dynamic left ventricular outflow tract obstruction.',
      'Succinylcholine is contraindicated due to risk of hyperkalemia from muscle degeneration.',
      'Titrate nondepolarizing muscle relaxants carefully with objective twitch monitoring.',
    ],
    avoid: [
      'Succinylcholine.',
      'Sympathomimetics with strong inotropic activity (epinephrine, isoproterenol) and vasodilators that worsen dynamic LVOT obstruction.',
      'Hypovolemia and tachycardia.',
    ],
    postop: [
      'Continuous ECG telemetry monitoring for atrial and ventricular arrhythmias.',
      'Monitor respiratory mechanics and pulmonary function in patients with severe scoliosis.',
    ],
  }),

  entry('multiple-system-atrophy', 'Multiple system atrophy', 15, ['msa', 'shy-drager syndrome'], {
    preop: [
      'Neurodegenerative disorder combining parkinsonism, cerebellar ataxia, and severe central autonomic failure (Shy-Drager syndrome).',
      'Assess for profound orthostatic hypotension, laryngeal stridor (from vocal cord abductor paralysis), and central sleep apnea.',
      'Review medications: continue antiparkinsonian agents and fludrocortisone or midodrine.',
    ],
    intraop: [
      'Invasive arterial pressure monitoring is essential: expect profound hypotension upon induction, positive-pressure ventilation, and position changes.',
      'Denervation supersensitivity: direct-acting vasopressors (phenylephrine, norepinephrine) produce an exaggerated hypertensive response; dilute and titrate carefully.',
      'Loss of baroreceptor reflexes blunts compensatory tachycardia.',
      'Inspect vocal cords during direct laryngoscopy: bilateral abductor paralysis can present as laryngeal stridor or difficult airway.',
    ],
    avoid: [
      'Indirect-acting vasopressors (ephedrine) due to depleted endogenous norepinephrine stores.',
      'Spinal or dense epidural anesthesia (causes severe, refractory hypotension).',
      'Rapid postural changes and hypovolemia.',
    ],
    postop: [
      'Observe closely in PACU for post-extubation laryngeal stridor and upper airway obstruction.',
      'High risk of postoperative aspiration and orthostatic syncope; continue invasive arterial monitoring.',
    ],
  }),

  entry('pots', 'Postural orthostatic tachycardia syndrome', 15, ['pots'], {
    preop: [
      'Excessive heart rate increase (at least 30 bpm) upon standing in the absence of orthostatic hypotension: evaluate resting volume status and heart rate.',
      'Patients are frequently chronically hypovolemic: administer liberal intravenous crystalloid hydration prior to surgery.',
      'Continue home medications (fludrocortisone, midodrine, beta-blockers, ivabradine) as planned.',
    ],
    intraop: [
      'Maintain generous intravascular volume expansion to preserve venous return and ventricular preload.',
      'Avoid light anesthesia, inadequate analgesia, or rapid emergence that provokes severe sinus tachycardia.',
      'Use phenylephrine rather than ephedrine if vasopressor support is needed, to avoid exacerbating tachycardia.',
    ],
    avoid: [
      'Hypovolemia and prolonged preoperative fasting without IV hydration.',
      'Vagolytic drugs (atropine, pancuronium) and beta-agonists.',
      'Histamine-releasing drugs that cause peripheral vasodilation and reflex tachycardia.',
    ],
    postop: [
      'Maintain intravenous fluid hydration until oral fluid intake is fully established.',
      'Apply lower-extremity compression stockings and avoid sudden head-up posture changes.',
      'Multimodal analgesia to prevent pain-induced sympathetic tachycardia.',
    ],
  }),

  entry('paraganglioma', 'Paraganglioma', 15, [], {
    preop: [
      'Extra-adrenal chromaffin cell tumor (carotid body, glomus jugulare, or retroperitoneal sympathetic chain): determine whether tumor is catecholamine-secreting.',
      'If secretory, manage identically to pheochromocytoma with alpha-adrenergic blockade for at least 1 to 2 weeks followed by beta-blockade if tachycardic.',
      'For carotid body tumors, evaluate cranial nerve function (cranial nerves IX, X, XII) and collateral cerebral blood flow.',
    ],
    intraop: [
      'For functional tumors, place an arterial line before induction and have sodium nitroprusside, phentolamine, and esmolol ready for hypertensive surges during manipulation.',
      'Manipulation of the carotid bifurcation can trigger profound bradycardia or hypotension from the carotid sinus reflex: infiltrate with local anesthetic.',
      'Expect sudden hypotension after tumor vein ligation or resection: volume expand and titrate norepinephrine or vasopressin.',
    ],
    avoid: [
      'Beta-adrenergic blockade before adequate alpha-adrenergic blockade in secretory tumors.',
      'Vigorous uncoordinated tumor palpation before vascular control.',
      'Histamine-releasing drugs in catecholamine-secreting tumors.',
    ],
    postop: [
      'Monitor for neck hematoma and airway compromise following head and neck paraganglioma resection.',
      'Assess cranial nerve function (swallowing, vocal cord movement, tongue deviation).',
      'Monitor blood glucose closely if secretory (rebound hypoglycemia from acute catecholamine withdrawal).',
    ],
  }),

  entry('familial-dysautonomia', 'Familial dysautonomia', 15, ['riley-day syndrome'], {
    preop: [
      'Autosomal recessive disorder affecting autonomic and sensory neurons: history of episodic autonomic crises (hypertension, tachycardia, diaphoresis, vomiting).',
      'Assess for chronic dehydration, recurrent aspiration pneumonias, and thoracic kyphoscoliosis.',
      'Corneal anesthesia and absent tearing: requires vigilant eye protection.',
    ],
    intraop: [
      'Marked hemodynamic lability: profound hypotension with induction agents and blunted response to surgical stimulation.',
      'Blunted ventilatory response to hypoxia and hypercapnia.',
      'Direct-acting vasopressors should be titrated in small dilute doses due to receptor denervation hypersensitivity.',
      'Apply generous ophthalmic lubricating ointment and tape eyes closed securely to prevent corneal ulceration.',
    ],
    avoid: [
      'Hypovolemia and sudden position changes.',
      'Indirect-acting sympathomimetics (ephedrine).',
      'Corneal abrasion (absent lacrimation and corneal reflex).',
    ],
    postop: [
      'Admit to ICU for hemodynamic monitoring and control of autonomic crises (treated with diazepam, clonidine).',
      'High risk of postoperative hypoventilation, aspiration, and hypothermia.',
    ],
  }),

  entry('charcot-marie-tooth', 'Charcot-Marie-Tooth disease', 15, ['cmt', 'hereditary motor and sensory neuropathy'], {
    preop: [
      'Hereditary motor and sensory neuropathy: assess degree of distal muscle weakness, foot deformities, and loss of deep tendon reflexes.',
      'Evaluate for associated thoracic kyphoscoliosis and restrictive pulmonary impairment in advanced cases.',
      'Document baseline peripheral neuropathies thoroughly before regional anesthesia.',
    ],
    intraop: [
      'Succinylcholine is contraindicated due to the risk of hyperkalemia from chronic denervation.',
      'Response to nondepolarizing muscle relaxants is variable: patients may exhibit prolonged blockade or heightened sensitivity; quantitative twitch monitoring is mandatory.',
      'Ensure meticulous protective padding of all bony prominences and peripheral nerve pathways.',
      'Neuraxial and peripheral nerve blocks have been performed safely, but require careful documentation of preexisting deficits.',
    ],
    avoid: [
      'Succinylcholine (risk of hyperkalemia).',
      'Unmonitored muscle relaxant administration.',
      'Excessive pressure or stretch on peripheral nerves during positioning.',
    ],
    postop: [
      'Ensure complete reversal of neuromuscular blockade before extubation.',
      'Reassess and document postoperative motor and sensory examination.',
    ],
  }),

  entry('guillain-barre', 'Guillain-Barré syndrome', 15, ['gbs', 'acute inflammatory demyelinating polyneuropathy', 'aidp'], {
    preop: [
      'Acute inflammatory demyelinating polyneuropathy: assess ascending motor weakness, cranial nerve involvement, and forced vital capacity.',
      'Evaluate for severe autonomic instability (cardiac arrhythmias, wide swings between severe hypertension and profound hypotension).',
      'Review recent treatment: intravenous immunoglobulin (IVIG) or plasma exchange.',
    ],
    intraop: [
      'Succinylcholine is strictly contraindicated: causes massive, potentially fatal hyperkalemic cardiac arrest due to widespread denervation-induced receptor upregulation; contraindication lasts for months to years.',
      'Expect extreme hemodynamic instability: exaggerated hypotensive response to anesthetic agents, positive-pressure ventilation, and position changes.',
      'Denervation supersensitivity: direct vasopressors (phenylephrine, norepinephrine) produce exaggerated pressor responses; titrate cautiously.',
      'Place an arterial line for continuous blood pressure monitoring in active or severe disease.',
    ],
    avoid: [
      'Succinylcholine under all circumstances.',
      'High doses of direct-acting vasopressors or vasodilators.',
      'Volatile anesthetic overdose causing refractory hypotension.',
    ],
    postop: [
      'High incidence of postoperative mechanical ventilation: extubate only after objective criteria for respiratory strength are fulfilled.',
      'Continuous ECG telemetry in ICU for life-threatening arrhythmias and autonomic instability.',
    ],
  }),

  // Muscle and neuromuscular junction
  entry('duchenne', 'Duchenne muscular dystrophy', 24, ['dmd', 'pseudohypertrophic muscular dystrophy'], {
    preop: [
      'X-linked recessive dystrophin deficiency: assess for progressive dilated cardiomyopathy (present in virtually all patients over age 18) with echocardiogram and 12-lead ECG.',
      'Evaluate restrictive pulmonary disease: progressive scoliosis and diaphragm weakness lead to nocturnal hypoventilation and reduced cough clearance.',
      'High risk of chronic aspiration due to pharyngeal weakness and delayed gastric emptying.',
    ],
    intraop: [
      'Succinylcholine is strictly contraindicated: causes massive rhabdomyolysis, hyperkalemic cardiac arrest, and intractable ventricular fibrillation.',
      'Avoid volatile halogenated anesthetics: can trigger anesthesia-induced rhabdomyolysis (AIR), which clinically mimics malignant hyperthermia with hyperkalemia, elevated creatine kinase, and cardiac arrest.',
      'Total intravenous anesthesia (TIVA) with propofol, opioids, and remifentanil is the technique of choice.',
      'Marked sensitivity to nondepolarizing muscle relaxants: duration of action is significantly prolonged; titrate with quantitative twitch monitoring.',
    ],
    avoid: [
      'Succinylcholine under all circumstances.',
      'Volatile halogenated anesthetics (risk of anesthesia-induced rhabdomyolysis and hyperkalemic arrest).',
      'Standard doses of nondepolarizing neuromuscular blockers.',
    ],
    postop: [
      'Admit to ICU or monitored step-down unit for respiratory monitoring and serial evaluation of cardiac function and urine for myoglobinuria.',
      'High incidence of postoperative pulmonary atelectasis and acute gastric dilatation.',
      'Use multimodal, opioid-sparing analgesia to prevent respiratory depression.',
    ],
  }),

  entry('becker', 'Becker muscular dystrophy', 24, [], {
    preop: [
      'Milder allelic form of dystrophinopathy: skeletal muscle weakness is slower, but severe dilated cardiomyopathy can occur early and disproportionately.',
      'Review echocardiogram for left ventricular ejection fraction and regional wall motion abnormalities.',
      'Review 12-lead ECG and evaluate baseline pulmonary function.',
    ],
    intraop: [
      'Succinylcholine is strictly contraindicated: precipitates massive rhabdomyolysis, acute hyperkalemia, and cardiac arrest.',
      'Avoid volatile halogenated anesthetics due to risk of rhabdomyolysis; total intravenous anesthesia is strongly preferred.',
      'Careful titration of fluid and anesthetic depth in the presence of dilated cardiomyopathy.',
      'Nondepolarizing muscle relaxants exhibit prolonged action; monitor quantitatively.',
    ],
    avoid: [
      'Succinylcholine.',
      'Volatile halogenated anesthetics.',
      'Myocardial depressant drugs in high concentrations.',
    ],
    postop: [
      'Continuous ECG telemetry in recovery/step-down unit.',
      'Monitor serum potassium and check urine for myoglobinuria if rhabdomyolysis is suspected.',
    ],
  }),

  entry('limb-girdle', 'Limb-girdle muscular dystrophy', 24, [], {
    preop: [
      'Heterogeneous group of muscular dystrophies primarily affecting shoulder and pelvic girdles: evaluate for associated cardiomyopathy (frequent in LGMD1B, LGMD2C-F).',
      'Assess for restrictive pulmonary defect from diaphragm and intercostal muscle involvement.',
      'Review 12-lead ECG and echocardiogram.',
    ],
    intraop: [
      'Succinylcholine is contraindicated due to risk of rhabdomyolysis and hyperkalemic cardiac arrest.',
      'Increased sensitivity and prolonged recovery with nondepolarizing muscle relaxants; use quantitative twitch monitoring.',
      'Consider total intravenous anesthesia (TIVA) to minimize myocardial depression.',
      'Position carefully with padding to protect weak, atrophic muscle groups.',
    ],
    avoid: [
      'Succinylcholine.',
      'Unmonitored muscle relaxant dosing.',
      'Prolonged periods of unmonitored respiratory depression.',
    ],
    postop: [
      'Observe respiratory rate and tidal volume closely before extubation.',
      'Monitor for delayed emergence and residual muscle weakness in PACU.',
    ],
  }),

  entry('fshd', 'Facioscapulohumeral muscular dystrophy', 24, ['fshd'], {
    preop: [
      'Autosomal dominant dystrophy with progressive weakness of facial, scapular, and upper arm musculature.',
      'Assess for respiratory muscle involvement and thoracic kyphoscoliosis; check baseline PFTs if dyspneic.',
      'Evaluate for cardiac arrhythmias and retinal telangiectasias (Coat syndrome).',
    ],
    intraop: [
      'Succinylcholine is avoided due to potential risk of hyperkalemia.',
      'Heightened sensitivity to nondepolarizing muscle relaxants; monitor train-of-four quantitatively.',
      'Vigilant eye protection: weakness of orbicularis oculi causes incomplete eyelid closure, predisposing to corneal exposure and ulceration.',
    ],
    avoid: [
      'Succinylcholine.',
      'Inadequate eye taping and corneal exposure.',
      'Excessive muscle relaxant dosing.',
    ],
    postop: [
      'Ensure complete reversal of neuromuscular blockade before tracheal extubation.',
      'Apply ophthalmic lubrication to prevent dry eye and exposure keratopathy.',
    ],
  }),

  entry('oculopharyngeal', 'Oculopharyngeal dystrophy', 24, [], {
    preop: [
      'Late-onset progressive dystrophy characterized by ptosis, dysphagia, and proximal limb weakness.',
      'Severe dysphagia leads to chronic aspiration risk, frequent pulmonary infections, and malnutrition.',
      'Evaluate swallowing mechanics, pulmonary history, and baseline nutritional status.',
    ],
    intraop: [
      'Rapid sequence induction or awake intubation is indicated for aspiration protection.',
      'Increased sensitivity to nondepolarizing muscle relaxants; titrate cautiously with twitch monitor.',
      'Use short-acting anesthetic agents to ensure rapid return of protective airway reflexes at emergence.',
    ],
    avoid: [
      'Full doses of nondepolarizing muscle relaxants without twitch monitoring.',
      'Extubation before full return of consciousness and intact airway reflexes.',
    ],
    postop: [
      'Maintain head-of-bed elevation in the postoperative period.',
      'Keep aspiration precautions active until oral intake is evaluated.',
    ],
  }),

  entry('emery-dreifuss', 'Emery-Dreifuss muscular dystrophy', 24, [], {
    preop: [
      'Triad of early contractures (elbows, Achilles tendons, posterior cervical spine), slowly progressive muscle weakness, and cardiac disease.',
      'High incidence of life-threatening cardiac conduction defects (complete heart block, atrial standstill, ventricular arrhythmias) and dilated cardiomyopathy.',
      'Interrogate pacemaker or ICD if implanted; ensure external pacing capability is immediately ready.',
      'Assess cervical spine mobility: posterior neck contractures frequently cause severe restriction of neck extension and difficult intubation.',
    ],
    intraop: [
      'Prepare for difficult airway management (video laryngoscopy, flexible bronchoscope) due to rigid cervical spine.',
      'Succinylcholine is strictly contraindicated (risk of hyperkalemia and rhabdomyolysis).',
      'Continuous cardiac rhythm monitoring: have transcutaneous pacing pads placed and external defibrillator in the room.',
      'Titrate anesthetic agents cautiously to avoid depressing an already compromised myocardium.',
    ],
    avoid: [
      'Succinylcholine.',
      'Forceful cervical spine extension during airway manipulation.',
      'High concentrations of negative inotropic anesthetic agents.',
    ],
    postop: [
      'Continuous ECG telemetry in ICU or cardiac step-down unit.',
      'Verify pacemaker function and monitor for delayed cardiac conduction blocks.',
    ],
  }),

  entry(
    'myotonic-dystrophy',
    'Myotonic dystrophy',
    24,
    ['myotonia dystrophica', 'dystrophia myotonica', 'steinert disease', 'dm1'],
    {
      preop: [
        'Look for cardiomyopathy and conduction disease: first-degree heart block is common, and complete heart block can cause sudden death.',
        'Assess respiratory muscle weakness. Pharyngeal and chest wall weakness raise aspiration risk; central sleep apnea and hypersomnolence add to sensitivity to sedatives.',
        'Many patients reach surgery with the myotonia unrecognized.',
      ],
      intraop: [
        'Keep the patient warm and prevent shivering: cold and shivering trigger myotonia.',
        'TIVA may be preferable to volatile agents, which can aggravate cardiomyopathy and conduction problems. Expect increased sensitivity to propofol, opioids and benzodiazepines.',
        'The response to nondepolarizing relaxants is normal, but existing weakness may make them unnecessary, which also avoids neostigmine.',
        'Myotonic contraction from surgical handling or diathermy is not relieved by relaxants or general or regional anesthesia; local anesthetic infiltration of the muscle, phenytoin, quinine or procainamide may help (quinine and procainamide can worsen conduction).',
        'Epidural anesthesia is considered safe.',
      ],
      avoid: [
        'Succinylcholine: it can cause prolonged myotonia that relaxants and anesthesia cannot reverse.',
        'Other myotonia triggers: methohexital, etomidate, neostigmine, hypothermia, and mechanical or electrical stimulation.',
      ],
      postop: [
        'Watch breathing closely: weak respiratory muscles add to any residual opioid, benzodiazepine or propofol effect. Perioperative complications are mainly cardiopulmonary.',
      ],
    },
  ),

  entry('nemaline', 'Nemaline rod myopathy', 24, [], {
    preop: [
      'Congenital myopathy with characteristic rod-like structures in skeletal muscle: evaluate for dysmorphic facial features (micrognathia, high-arched palate) that predict difficult intubation.',
      'Assess for disproportionate weakness of respiratory and bulbar muscles; obtain baseline PFTs and room-air saturation.',
      'Screen for cardiomyopathy and skeletal deformities (scoliosis, pectus excavatum).',
    ],
    intraop: [
      'Prepare for difficult airway management with video laryngoscopy or fiberoptic intubation.',
      'Succinylcholine is contraindicated due to reports of abnormal contractures and hyperkalemia.',
      'Marked sensitivity to nondepolarizing muscle relaxants: prolonged paralysis is common; monitor quantitatively.',
      'Volatile anesthetics can induce profound myocardial depression in affected patients.',
    ],
    avoid: [
      'Succinylcholine.',
      'Blind or traumatic airway instrumentation.',
      'Standard doses of nondepolarizing neuromuscular blockers.',
    ],
    postop: [
      'High rate of postoperative ventilatory failure: extubate only after full recovery of airway reflexes and respiratory mechanics.',
      'Plan for monitored ICU care with access to noninvasive or invasive ventilatory support.',
    ],
  }),

  entry('myotonia-congenita', 'Myotonia congenita', 24, [], {
    preop: [
      'Skeletal muscle chloride channel (CLCN1) mutation causing muscle stiffness after voluntary contraction that improves with repetition (warm-up phenomenon); absence of cardiomyopathy.',
      'Assess severity of stiffness; continue home antimyotonic therapy (mexiletine, carbamazepine).',
      'Check serum electrolytes and confirm absence of baseline weakness.',
    ],
    intraop: [
      'Maintain strict normothermia throughout: cold exposure and shivering are potent triggers for generalized, sustained myotonic contracture.',
      'Succinylcholine is strictly contraindicated: produces severe, generalized contracture that can prevent mask ventilation and endotracheal intubation.',
      'Nondepolarizing muscle relaxants do not abolish myotonic spasms induced by direct mechanical stimulation or electrocautery; local anesthetic infiltration at the surgical site can help relax the muscle.',
      'Regional anesthesia (epidural, spinal, peripheral blocks) is safe and effective.',
    ],
    avoid: [
      'Succinylcholine under all circumstances.',
      'Hypothermia, cold irrigation fluids, and post-extubation shivering.',
      'Neostigmine: anticholinesterases increase acetylcholine concentration at the motor endplate and can provoke severe myotonia.',
    ],
    postop: [
      'Ensure active warming continues in PACU until normothermia is verified.',
      'Provide effective analgesia to prevent shivering and muscle contracture.',
    ],
  }),

  entry('paramyotonia-congenita', 'Paramyotonia congenita', 24, [], {
    preop: [
      'Skeletal muscle sodium channel (SCN4A) mutation characterized by cold-induced myotonia that paradoxically worsens with exercise (paradoxical myotonia), followed by flaccid muscle weakness.',
      'Identify history of temperature sensitivity and episodes of potassium-induced weakness; continue mexiletine.',
      'Check baseline serum potassium and electrolytes.',
    ],
    intraop: [
      'Maintain active patient warming, warmed IV fluids, and warm operating room ambient temperature.',
      'Succinylcholine is strictly contraindicated: triggers massive myotonic contracture and hyperkalemia.',
      'Nondepolarizing relaxants do not relieve paramyotonic spasms; neostigmine can exacerbate myotonia.',
      'Avoid potassium-containing IV fluids.',
    ],
    avoid: [
      'Cold operating room environment, unheated IV fluids, and hypothermia.',
      'Succinylcholine.',
      'Neostigmine for reversal; use sugammadex if rocuronium or vecuronium was administered.',
      'Potassium-containing intravenous solutions.',
    ],
    postop: [
      'Maintain diligent active warming in recovery room until normal core temperature is sustained.',
      'Monitor serum potassium and muscle strength closely.',
    ],
  }),

  entry('periodic-paralysis', 'Periodic paralysis (hyperkalemic and hypokalemic)', 24, ['hyperkalemic periodic paralysis', 'hypokalemic periodic paralysis'], {
    preop: [
      'Identify disease subtype: hypokalemic (CACNA1S mutation; triggered by carbohydrate meals, rest after exercise, cold, and stress) versus hyperkalemic (SCN4A mutation; triggered by fasting, cold, stress, and potassium intake).',
      'Check baseline serum potassium, sodium, and magnesium.',
      'Continue home medications (acetazolamide, potassium supplements or potassium-sparing diuretics) as indicated.',
    ],
    intraop: [
      'Maintain strict normothermia: hypothermia and shivering trigger paralytic attacks in both types.',
      'In hypokalemic periodic paralysis: avoid glucose-containing IV fluids and beta-2 adrenergic agonists (which drive potassium intracellularly); monitor potassium closely.',
      'In hyperkalemic periodic paralysis: avoid potassium-containing fluids (Lactated Ringer) and prolonged fasting; maintain a mild glucose infusion to stimulate insulin-mediated potassium uptake.',
      'Succinylcholine is contraindicated in both types: can trigger profound hyperkalemia or sustained contracture.',
      'Titrate nondepolarizing muscle relaxants cautiously with quantitative twitch monitoring.',
    ],
    avoid: [
      'Succinylcholine in all forms of periodic paralysis.',
      'Hypothermia and post-anesthetic shivering.',
      'In hypokalemic: large glucose infusions, beta-2 agonists, and potassium-wasting diuretics.',
      'In hyperkalemic: potassium-containing IV fluids, prolonged fasting, and metabolic acidosis.',
    ],
    postop: [
      'Serial monitoring of serum potassium levels in PACU.',
      'Maintain active patient warming and aggressive pain management to prevent stress-induced attacks.',
    ],
  }),

  entry('central-core', 'Central core disease', 24, ['ccd'], {
    preop: [
      'Congenital myopathy linked to ryanodine receptor (RYR1) gene mutations: strongly associated with malignant hyperthermia susceptibility.',
      'Must be managed under strict Malignant Hyperthermia Susceptible precautions: prepare clean machine, trigger-free anesthetic, and verify dantrolene availability.',
      'Evaluate for musculoskeletal deformities: progressive kyphoscoliosis, congenital hip dislocation, and joint laxity.',
    ],
    intraop: [
      'Trigger-free anesthetic technique: total intravenous anesthesia (propofol, opioids) or regional anesthesia.',
      'Prepare anesthesia workstation: flush machine per protocol, remove vaporizers, change carbon dioxide absorbent, and install activated charcoal filters.',
      'Monitor continuously for signs of acute MH crisis: unexplained tachycardia, rising end-tidal CO2, mixed acidosis, and hyperthermia.',
      'Nondepolarizing muscle relaxants may show increased sensitivity; monitor quantitatively.',
    ],
    avoid: [
      'All volatile halogenated anesthetics: sevoflurane, desflurane, isoflurane.',
      'Succinylcholine.',
    ],
    postop: [
      'Observe in PACU or ICU for at least 12 to 24 hours for signs of delayed-onset malignant hyperthermia or rhabdomyolysis.',
      'Ensure crisis protocol and dantrolene remain accessible.',
    ],
  }),

  entry('centronuclear', 'Centronuclear myopathy', 24, ['myotubular myopathy'], {
    preop: [
      'Congenital myopathy characterized by centrally located nuclei in muscle fibers: evaluate for severe generalized weakness, ptosis, and ophthalmoplegia.',
      'High prevalence of severe restrictive respiratory disease and diaphragmatic weakness; assess baseline nocturnal ventilatory dependence.',
      'Review pulmonary function and history of chronic aspiration.',
    ],
    intraop: [
      'Prepare for potentially difficult airway management.',
      'Succinylcholine is contraindicated due to risk of rhabdomyolysis and hyperkalemic response.',
      'Extreme sensitivity to nondepolarizing muscle relaxants: marked prolongation of paralysis; avoid relaxants if feasible or use minimal doses with sugammadex reversal.',
      'Volatile anesthetics can cause significant myocardial depression in severe cases.',
    ],
    avoid: [
      'Succinylcholine.',
      'Standard doses of nondepolarizing muscle relaxants.',
      'Heavy sedative premedication without ventilatory support.',
    ],
    postop: [
      'High incidence of postoperative ventilatory failure: plan for postoperative mechanical ventilation in ICU.',
      'Extubate only when objective criteria for respiratory muscle strength and gas exchange are met.',
    ],
  }),

  entry('mitochondrial-myopathy', 'Mitochondrial myopathies', 24, ['mitochondrial disease'], {
    preop: [
      'Defects in mitochondrial oxidative phosphorylation: evaluate multiorgan involvement including cardiomyopathy, cardiac conduction blocks, epilepsy, and diabetes mellitus.',
      'Assess baseline serum lactate and blood glucose; avoid prolonged preoperative fasting.',
      'Continue anticonvulsants and cofactors (coenzyme Q10, carnitine) as prescribed.',
    ],
    intraop: [
      'Increased sensitivity to volatile anesthetics, IV induction agents, and muscle relaxants.',
      'Avoid prolonged or high-dose propofol infusions: propofol inhibits mitochondrial fatty acid oxidation and can trigger propofol infusion syndrome or severe lactic acidosis.',
      'Avoid lactate-containing IV solutions (Lactated Ringer) to prevent worsening metabolic acidosis; use normal saline or balanced non-lactate solutions with glucose.',
      'Maintain strict normothermia: shivering dramatically elevates cellular metabolic demand.',
    ],
    avoid: [
      'Prolonged propofol infusions.',
      'Lactated Ringer solution and lactate-containing fluids.',
      'Succinylcholine (risk of hyperkalemia).',
      'Hypothermia, shivering, and prolonged fasting.',
    ],
    postop: [
      'Monitor serial arterial blood gases, serum lactate, and blood glucose in PACU.',
      'Continuous ECG telemetry monitoring for cardiac conduction abnormalities.',
    ],
  }),

  entry(
    'myasthenia-gravis',
    'Myasthenia gravis',
    24,
    ['mg'],
    {
      preop: [
        'Tell the patient they may stay intubated and ventilated after surgery.',
        'After transsternal thymectomy, the need for ventilation correlated with disease longer than 6 years, pyridostigmine above 750 mg a day, vital capacity below 2.9 L and COPD unrelated to myasthenia.',
        'Bulbar weakness brings a high aspiration risk. Look for associated thyroid and other autoimmune disease.',
        'Infection, electrolyte disturbance, stress, surgery and some antibiotics (especially aminoglycosides) can worsen weakness.',
      ],
      intraop: [
        'Patients are very sensitive to nondepolarizing relaxants: if one is needed, reduce the initial dose by one-half to two-thirds and titrate with a nerve stimulator.',
        'Patients are resistant to succinylcholine (ED95 about 2.6 times normal), but usual doses still usually give adequate intubating conditions.',
        'Intubation is often possible without a relaxant, and volatile agents can reduce or remove the need for one.',
        'After rocuronium, sugammadex may reverse more reliably than neostigmine with glycopyrrolate.',
      ],
      avoid: [
        'Nondepolarizing relaxants in usual doses or without neuromuscular monitoring.',
        'Opioids for maintenance where possible: their respiratory effects can last into recovery.',
      ],
      postop: [
        'Delay extubation until respiratory function is clearly good: strength can seem adequate early and fall again a few hours later.',
        'Plan postoperative ventilation for patients who meet the risk criteria.',
      ],
    },
  ),

  entry('lambert-eaton', 'Lambert-Eaton myasthenic syndrome', 24, ['eaton-lambert syndrome', 'myasthenic syndrome', 'lems'], {
    preop: [
      'Presynaptic disorder with autoantibodies against P/Q-type voltage-gated calcium channels: proximal muscle weakness that transiently improves with exercise.',
      'Strongly associated with small cell lung cancer (up to 60% of cases): evaluate for underlying malignancy.',
      'Assess autonomic symptoms (orthostatic hypotension, dry mouth, impaired sweating); continue 3,4-diaminopyridine (amifampridine) or pyridostigmine.',
    ],
    intraop: [
      'Extreme, life-threatening sensitivity to BOTH succinylcholine AND nondepolarizing muscle relaxants.',
      'A small dose of nondepolarizing relaxant can produce profound paralysis lasting for hours; attempt tracheal intubation without muscle relaxants (using propofol/remifentanil or volatile agent) whenever possible.',
      'Quantitative neuromuscular monitoring (train-of-four) is mandatory.',
      'Expect autonomic lability with exaggerated hypotension on induction.',
    ],
    avoid: [
      'Succinylcholine and standard doses of nondepolarizing muscle relaxants.',
      'Aminoglycoside and polymyxin antibiotics (block presynaptic calcium channels and precipitate severe neuromuscular block).',
      'Calcium channel blockers and magnesium infusions unless strictly indicated.',
    ],
    postop: [
      'High incidence of postoperative ventilatory failure and delayed extubation: monitor in ICU or step-down setting.',
      'Reverse with sugammadex if rocuronium was used, but continue close observation as weakness may recur.',
    ],
  }),
];
