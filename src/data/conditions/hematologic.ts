import { entry, type ConditionRecord } from './types';

export const HEMATOLOGIC_CONDITIONS: ConditionRecord[] = [
  entry('thalassemia', 'Thalassemia', 23, ['thalassaemia'], {
    preop: [
      'Inherited defect in globin chain synthesis causing microcytic hemolytic anemia, ineffective erythropoiesis, and iron overload.',
      'Distinguish minor (mild microcytic anemia, usually asymptomatic) from major or intermedia (transfusion-dependent with severe anemia and hemochromatosis).',
      'Airway assessment: severe beta-thalassemia major causes maxillary hypertrophy, malocclusion, and prominent malar bones leading to difficult mask ventilation and intubation.',
      'Cardiovascular evaluation: screen for iron-overload cardiomyopathy, arrhythmias, and pulmonary hypertension; check serum ferritin and echocardiogram.',
      'Target preoperative hemoglobin: optimize to 9 to 10 g/dL for major surgery with packed red blood cell transfusion.',
    ],
    intraop: [
      'Anticipate difficult airway: have video laryngoscopy and fiberoptic equipment prepared.',
      'Maintain cardiac output and oxygen delivery: patients tolerate tachycardia and myocardial depression poorly if iron cardiomyopathy is present.',
      'Gentle positioning and padding: chronic marrow expansion causes significant osteopenia and risk of pathological fractures.',
      'Minimize surgical blood loss; have crossmatched blood readily available in the operating room.',
    ],
    avoid: [
      'Severe hypoxemia, acidosis, and hypothermia: impairs oxygen-carrying capacity and shifts oxyhemoglobin dissociation curve unfavorably.',
      'Forceful airway manipulation or excessive pressure on fragile maxillary structures and dentition.',
      'Unmonitored fluid overload in patients with iron-induced ventricular dysfunction.',
    ],
    postop: [
      'Monitor hematocrit and tissue oxygenation; transfuse packed red blood cells to maintain target hemoglobin levels.',
      'Provide continuous pulse oximetry and supplemental oxygen during early recovery.',
      'Resume iron chelation therapy once renal function and oral intake normalize.',
    ],
  }),

  entry('hereditary-spherocytosis', 'Hereditary spherocytosis', 23, [], {
    preop: [
      'Autosomal dominant red cell membrane defect (spectrin, ankyrin) causing spherical, fragile erythrocytes trapped and destroyed in the spleen.',
      'Clinical presentation includes hemolytic anemia, unconjugated hyperbilirubinemia, splenomegaly, and pigmented gallstones.',
      'Check baseline hemoglobin, reticulocyte count, unconjugated bilirubin, and spleen size (often presenting for splenectomy or cholecystectomy).',
      'Verify post-splenectomy immunization status (Pneumococcus, Meningococcus, Hib) at least 2 weeks before elective splenectomy.',
      'Screen for aplastic crisis history (often provoked by parvovirus B19 infection) or folate deficiency.',
    ],
    intraop: [
      'Avoid hypothermia, severe acidosis, and circulatory stasis that worsen red cell fragility and accelerate splenic destruction.',
      'Maintain generous intravenous hydration and renal perfusion to prevent pigment nephropathy from acute hemolysis.',
      'Splenectomy carries significant bleeding risk: establish large-bore intravenous access and verify blood product availability.',
      'Monitor for platelet count rebound and surgical hemostasis following splenic vein ligation.',
    ],
    avoid: [
      'Hypothermia and profound metabolic acidosis: exacerbates erythrocyte fragility and splenic sequestration.',
      'Hypovolemia or inadequate diuresis if acute hemolysis occurs (risk of renal tubular damage from free hemoglobin).',
    ],
    postop: [
      'Monitor hemoglobin, bilirubin, and platelet count: reactive thrombocytosis is common post-splenectomy; initiate VTE prophylaxis.',
      'Educate on overwhelming post-splenectomy infection (OPSI) risk and emergency fever protocols.',
      'Maintain intravenous hydration to flush hemoglobin breakdown products and ensure robust urine output.',
    ],
  }),

  entry('g6pd', 'G6PD deficiency', 23, ['glucose-6-phosphate dehydrogenase deficiency', 'favism'], {
    preop: [
      'X-linked recessive enzymatic defect impairing NADPH generation, leaving erythrocytes vulnerable to oxidative stress and acute hemolytic anemia.',
      'Screen for history of acute hemolytic crises, dark urine, or favism after oxidative drug exposures or infections.',
      'Check baseline CBC, reticulocyte count, renal function, and bilirubin levels.',
      'Strict review of perioperative medications to exclude known oxidative triggers.',
    ],
    intraop: [
      'Maintain normothermia, adequate oxygenation, and normocarbia; treat surgical stress and infections aggressively.',
      'Safe anesthetic agents: propofol, volatile anesthetics, fentanyl, remifentanil, rocuronium, and cisatracurium are clinically safe.',
      'If acute hemolysis occurs (dark tea-colored urine, sudden hematocrit drop), maintain brisk alkaline diuresis to protect renal tubules.',
      'Active patient warming with forced-air blankets and fluid warmers to avoid hypothermic shivering and metabolic stress.',
    ],
    avoid: [
      'Known oxidative triggers: methylene blue, rasburicase, primaquine, sulfonamides, dapsone, and nitrofurantoin.',
      'High-dose acetaminophen, prilocaine, and topical benzocaine sprays (induce oxidative stress and methemoglobinemia).',
      'Hypothermia, severe acidosis, and unmanaged surgical infection or stress.',
    ],
    postop: [
      'Inspect urine color closely: dark reddish-brown urine indicates free hemoglobinuria and acute intravascular hemolysis.',
      'Monitor serial hemoglobin, hematocrit, and renal function if clinical signs of hemolysis emerge.',
      'Provide clear discharge counseling and medication lists excluding oxidative pharmaceuticals.',
    ],
  }),

  entry('sickle-cell', 'Sickle cell disease', 23, ['sickle cell anemia', 'sickle cell anaemia', 'hbss'], {
    preop: [
      'Homozygous HbSS causing deoxygenated erythrocyte polymerization, vaso-occlusion, acute chest syndrome, stroke, and chronic organ damage.',
      'Review baseline hemoglobin, reticulocyte count, baseline oxygen saturation, and HbS percentage.',
      'Transfusion strategy: target hemoglobin 10 g/dL with simple transfusion for moderate-risk surgery; exchange transfusion for high-risk procedures or HbS reduction < 30%.',
      'Evaluate end-organ injury: pulmonary hypertension, restrictive lung disease, renal dysfunction, and history of stroke.',
      'Prevent preoperative dehydration: avoid prolonged fasting; start intravenous fluids prior to surgery.',
    ],
    intraop: [
      'Meticulously prevent the sickling tetrad: hypoxemia, acidosis, hypothermia, and hypovolemia or vascular stasis.',
      'Administer high FiO2 (maintain SpO2 at baseline or >= 96%); use active warming with forced-air blankets and warmed fluids.',
      'Provide deep anesthesia and effective analgesia to prevent sympathetic vasoconstriction and microvascular stasis.',
      'Regional anesthesia is acceptable and reduces opioid-induced hypoventilation, but avoid hypotension or prolonged tourniquet ischemia.',
    ],
    avoid: [
      'Hypoxemia: even brief desaturations trigger rapid HbS polymerization and vaso-occlusion.',
      'Hypothermia and shivering: produces intense peripheral vasoconstriction and erythrocyte sickling.',
      'Dehydration and metabolic acidosis: worsens sickling and sludging in microcirculation.',
      'Prolonged tourniquet times: localized hypoxia and acidemia in ischemic limb provoke sickling upon reperfusion.',
    ],
    postop: [
      'High risk of acute chest syndrome (ACS) within 48 to 72 hours postop: use incentive spirometry every 2 hours and early ambulation.',
      'Continue supplemental oxygen to maintain SpO2 >= 96% and IV hydration at maintenance or 1.5x maintenance.',
      'Aggressively manage postoperative pain with multimodal analgesia while avoiding excessive sedation and hypoventilation.',
    ],
  }),

  entry('methemoglobinemia', 'Methemoglobinemia', 23, ['methaemoglobinaemia'], {
    preop: [
      'Oxidation of ferrous iron to ferric iron in hemoglobin, unable to bind oxygen and shifting dissociation curve left, producing cellular hypoxia.',
      'Screen for congenital cytochrome b5 reductase deficiency or hemoglobin M variants, or history of drug-induced methemoglobinemia.',
      'Identify exposure to oxidizing triggers: benzocaine sprays, prilocaine, lidocaine (in massive doses), nitrates/nitrites, and dapsone.',
    ],
    intraop: [
      'Standard pulse oximetry is unreliable: absorption at 660 nm and 940 nm equalizes, causing SpO2 to plateau around 85% regardless of true arterial oxygenation.',
      'Obtain co-oximetry blood gas analysis to directly measure methemoglobin percentage and true oxyhemoglobin saturation.',
      'Administer 100% inspired oxygen.',
      'In symptomatic patients or methemoglobin levels > 20% to 30%, administer intravenous methylene blue (1% solution over 5 minutes); note that methylene blue requires functional G6PD to reduce ferric iron.',
    ],
    avoid: [
      'Topical benzocaine sprays (Hurricaine, Cetacaine) for airway topicalization: major cause of severe iatrogenic methemoglobinemia.',
      'Prilocaine and excessive doses of local anesthetics or nitrates.',
      'Methylene blue in patients with known or suspected G6PD deficiency: can trigger massive acute hemolytic anemia; use ascorbic acid or exchange transfusion instead.',
    ],
    postop: [
      'Serial co-oximetry measurements: rebound methemoglobinemia can occur several hours later as lipophilic drugs continue to leach from tissue stores.',
      'Continuous hemodynamic monitoring and supplemental oxygen until methemoglobin level drops below 5%.',
      'Document triggering oxidizing agent clearly in patient allergy and electronic medical record.',
    ],
  }),

  entry('polycythemia-vera', 'Polycythemia vera', 23, ['polycythaemia vera'], {
    preop: [
      'Myeloproliferative neoplasm (JAK2 mutation) causing autonomous erythrocyte overproduction, hyperviscosity, and high risk of thrombosis and hemorrhage.',
      'Optimize hematocrit before elective surgery: phlebotomy or cytoreduction to target hematocrit < 45% (men) or < 42% (women) to normalize blood viscosity.',
      'Check platelet count and coagulation profile: extreme thrombocytosis can paradoxically cause acquired von Willebrand disease and bleeding.',
      'Screen for history of thrombosis (DVT, PE, stroke, Budd-Chiari) or mucosal bleeding.',
    ],
    intraop: [
      'Maintain liberal hydration to prevent hemoconcentration and severe microvascular stasis.',
      'High risk of perioperative thromboembolism: apply sequential compression devices throughout surgery and avoid venous stasis.',
      'Careful arterial and venous cannulation: increased risk of both vascular thrombosis and hematoma formation.',
      'Maintain strict normothermia; cold temperatures substantially increase blood viscosity.',
    ],
    avoid: [
      'Proceeding with elective surgery when hematocrit > 45%: massive increase in perioperative stroke and myocardial infarction risk.',
      'Dehydration and prolonged fasting without intravenous fluid maintenance.',
      'Venous pooling, prolonged immobilization, or extreme lithotomy positioning that promotes venous thrombosis.',
    ],
    postop: [
      'Early mobilization and aggressive venous thromboembolism (VTE) prophylaxis (mechanical and pharmacological as soon as surgical hemostasis permits).',
      'Continue intravenous hydration until oral fluid intake is robust.',
      'Monitor CBC, hematocrit, and clinical signs of thrombotic or hemorrhagic complications.',
    ],
  }),

  entry('hemophilia', 'Hemophilia A and B', 23, ['haemophilia', 'factor viii deficiency', 'factor ix deficiency'], {
    preop: [
      'X-linked bleeding disorder caused by deficiency of factor VIII (Hemophilia A) or factor IX (Hemophilia B); high risk of hemarthroses and severe surgical bleeding.',
      'Hematology consultation and inhibitor testing (Bethesda assay) are mandatory before elective surgery.',
      'Factor replacement target: raise factor VIII or IX levels to 80% to 100% of normal immediately before major surgery (50% for minor surgery).',
      'In mild Hemophilia A, desmopressin (DDAVP) may be used to release endogenous factor VIII and vWF; test dose preoperatively.',
      'Factor IX requires larger replacement doses due to extensive extravascular distribution.',
    ],
    intraop: [
      'Neuraxial anesthesia (spinal, epidural) and deep peripheral nerve blocks are strictly contraindicated unless factor levels are 100% normalized and cleared by hematology.',
      'Gentle airway instrumentation: intubation and suctioning must be atraumatic to prevent retropharyngeal or glottic hematomas that cause fatal airway obstruction.',
      'Coordinate intraoperative continuous factor infusions or boluses to maintain target trough levels (>50% for major surgery).',
      'Meticulous surgical hemostasis; antifibrinolytic agents (tranexamic acid or aminocaproic acid) are valuable adjuncts.',
    ],
    avoid: [
      'Intramuscular injections and blind deep regional nerve blocks.',
      'NSAIDs and antiplatelet agents (aspirin) that impair platelet plug formation.',
      'Traumatic airway manipulation, vigorous nasogastric tube insertion, or nasal intubation (severe mucosal bleeding).',
    ],
    postop: [
      'Maintain factor levels: keep trough levels > 50% for 7 to 14 days after major surgery, tapering per hematology protocol.',
      'Daily factor level assays to ensure adequate replacement and detect emergence of inhibitors.',
      'Monitor surgical drains, wound sites, and neuro checks for occult compartment syndromes or internal bleeding.',
    ],
  }),

  entry('von-willebrand', 'von Willebrand disease', 23, ['vwd'], {
    preop: [
      'Most common inherited bleeding disorder, characterized by quantitative or qualitative deficiency in von Willebrand factor (vWF), impairing platelet adhesion and factor VIII stabilization.',
      'Identify vWD type (Type 1 mild quantitative, Type 2 qualitative, Type 3 severe absent) and review hematology treatment plan.',
      'Type 1: DDAVP (desmopressin) trial induces release of stored vWF and factor VIII; useful for minor to moderate surgical procedures.',
      'Types 2 and 3, or major surgery: vWF-containing factor VIII concentrates (or recombinant vWF) administered before surgery to achieve vWF activity > 80% to 100%.',
    ],
    intraop: [
      'Neuraxial anesthesia is contraindicated unless vWF and factor VIII levels are verified normal and hematology approves.',
      'Gentle airway management to avoid pharyngeal or mucosal lacerations and hemorrhage.',
      'Antifibrinolytic therapy (tranexamic acid or aminocaproic acid) is a highly effective adjunct, particularly for mucosal surgery (ENT, dental, gynecologic).',
      'Monitor blood loss meticulously; have factor concentrates available in the operating theater.',
    ],
    avoid: [
      'NSAIDs, aspirin, and other antiplatelet drugs that further destabilize primary platelet hemostasis.',
      'Intramuscular injections and blind regional nerve blocks.',
      'Excessive fluid administration when repeated doses of DDAVP are used (risk of water retention and severe hyponatremia).',
    ],
    postop: [
      'Maintain vWF and factor VIII levels > 50% for 3 to 7 days postoperatively (longer for major orthopedic or vascular surgery).',
      'If DDAVP is used, restrict free water intake and monitor serum sodium closely to prevent hyponatremic seizures.',
      'Continue antifibrinolytic therapy until wound healing and mucosal recovery are complete.',
    ],
  }),

  entry('antiphospholipid', 'Antiphospholipid syndrome', 23, ['aps', 'lupus anticoagulant'], {
    preop: [
      'Autoimmune hypercoagulable state with antibodies against phospholipid-binding plasma proteins, causing paradoxical in vitro prolonged PTT but severe in vivo thrombosis risk.',
      'Coordinate perioperative anticoagulation bridging: patients are typically on therapeutic warfarin or DOACs; bridge with LMWH or unfractionated heparin.',
      'Screen for end-organ vascular injury: history of stroke, pulmonary hypertension, coronary thrombosis, renal microangiopathy, and Catastrophic Antiphospholipid Syndrome (CAPS).',
      'Check baseline platelet count (mild to moderate autoimmune thrombocytopenia is common).',
    ],
    intraop: [
      'Timing of regional anesthesia: neuraxial blocks require strict adherence to ASRA guidelines regarding heparin/LMWH timing; artifactually prolonged PTT cannot be used to assess bleeding safety.',
      'Prevent vascular stasis and hemoconcentration: ensure liberal hydration and intraoperative sequential compression devices.',
      'Arterial line placement: radial catheterization must be done atraumatically; high risk of catheter-related arterial thrombosis.',
      'Maintain strict normothermia; hypothermia promotes microvascular thrombosis.',
    ],
    avoid: [
      'Withholding anticoagulation longer than strictly necessary: rebound thrombosis risk is exceptionally high.',
      'Interpreting a prolonged PTT as a bleeding diathesis or contraindication to thromboprophylaxis without understanding the lupus anticoagulant artifact.',
      'Dehydration, venous stasis, and prolonged unpadded tourniquet use.',
    ],
    postop: [
      'Resume therapeutic anticoagulation as soon as surgical hemostasis is confirmed by the surgical team.',
      'High vigilance for Catastrophic Antiphospholipid Syndrome (CAPS): acute multi-organ microvascular thrombosis, thrombocytopenia, and systemic inflammatory response; treated with steroids, plasmapheresis, and anticoagulation.',
      'Monitor platelet counts and clinical signs of DVT, pulmonary embolism, or graft thrombosis.',
    ],
  }),
];
