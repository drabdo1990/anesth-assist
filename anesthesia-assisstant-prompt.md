Act as a Senior Principal Frontend Engineer and Perioperative Clinical Informatics Specialist.
Build a mobile-first, zero-latency clinical decision support Progressive Web App (PWA) called "AnesthAssist OR" designed specifically for intra-operative anesthesia providers (Anesthesiologists, CRNAs, Anesthesia Residents/Fellows).

### 1. CORE PURPOSE & CLINICAL BENCHMARKS
The app serves as a rapid, real-time bedside sizing, dosing, and mechanical ventilation companion across pre-, intra-, and post-operative phases.
Clinical benchmark standards derived from reference texts (Miller's Anesthesia, Oxford Handbook of Anaesthesia, Clinical Cases in Anesthesia):
- Dosing Scalars: Strictly discriminate between Lean Body Weight (LBW), Ideal Body Weight (IBW), and Total Body Weight (TBW), particularly in obesity and high-BMI patients.
- Airway Sizing: Exact pediatric anatomical age/weight formulas and adult standards for endotracheal tubes (cuffed vs. uncuffed), oral/nasal airways, LMA/i-gel supraglottic devices, and double-lumen endobronchial tubes (DLT).
- Mechanical Ventilation: Lung-protective ventilation standards (VT 6–8 mL/kg IBW, Pplat < 30 cmH2O, driving pressure < 15 cmH2O, individualised PEEP).

### 2. ERGONOMIC & SAFETY LAWS (OR ENVIRONMENT)
- Mobile-first, one-thumb navigation: Touch targets must be >= 48px to accommodate gloved hands.
- Dark theme default: Background `#080c14` (Deep Navy Slate), Card `#111827`, Borders `#1f293d`, Text `#f3f4f6`.
- Accent palette: Cyan (`#06b6d4`) for biometrics/ventilation, Amber (`#f59e0b`) for airway sizing, Emerald (`#10b981`) for analgesia/antiemetic recovery, Crimson (`#ef4444`) for emergency drugs/toxicity ceilings.
- Monospace Tabular Numerics: All calculation values rendered in `font-mono` to prevent layout shift during biometric adjustments.
- Offline-First PWA: Client-side only calculations with `vite-plugin-pwa` caching. Zero telemetry, zero cloud calls, zero PHI storage.

### 3. TECH STACK & STATE ARCHITECTURE
- Framework: Vite + React 19 + TypeScript + Tailwind CSS + Lucide React icons.
- State Engine: Zustand with `localStorage` persistence for persistent provider defaults (e.g., standard vial concentrations, preferred formula selections).
- High-Performance Derivations: All drug dosages, tube depths, and tidal volumes recalculate reactively upon typing or toggling biometrics.

---

### 4. CORE APPLICATION MODULES & INTERFACES

#### A. GLOBAL BIOMETRIC CONTROLLER (Sticky Top Bar)
- Patient Type Toggle: [Adult] | [Pediatric / Neonate]
- Inputs:
  * For Adults: Actual Weight (TBW in kg, 30–250 kg), Height (cm, 120–220 cm), Biological Sex (Male / Female).
  * For Pediatrics: Age (Neonatal / Months / Years: 0 to 14 yr) + Weight (kg). Auto-estimates weight if unknown: `Weight (kg) = (Age + 4) * 2` (or standard reference chart).
- Reactive Metric Pill Strip:
  * Adult: BMI (kg/m²), Devine IBW (kg), Janmahasatian LBW (kg), ABW40 (kg).
  * Pediatric: Age-appropriate estimated baseline parameters.

#### B. TAB 1: [PERIOPERATIVE PHARMACOPEIA & DOSING]
Categorized drug cards displaying calculated mass (mg/mcg) and exact volume (mL) based on standard vial dilutions, with explicit scalar badges:

1. Pre-operative & Premedication:
   * Midazolam: Premed IV (0.02–0.04 mg/kg on TBW) | Paediatric oral/nasal premed (0.2–0.5 mg/kg).
   * Clonidine: IV (1–2 mcg/kg) | Caudal adjunct (1 mcg/kg).
   * Antiemetic Prophylaxis: Dexamethasone (4–8 mg IV adult, 0.15 mg/kg peds) | Ondansetron (4 mg IV adult, 0.1 mg/kg peds, max 4 mg).
2. Induction & Hypnotics:
   * Propofol: Healthy adult (1.5–2.5 mg/kg on LBW; vial 10 mg/mL) | Obese/Elderly titration (1.0–1.5 mg/kg on LBW) | Paediatric induction (2.5–3.5 mg/kg on TBW).
   * Etomidate: 0.2–0.3 mg/kg on TBW (vial 2 mg/mL; cardiostable).
   * Ketamine: Induction (1.0–2.0 mg/kg IV on TBW; vial 50 mg/mL) | Multimodal sub-dissociative analgesia (0.25–0.5 mg/kg).
   * Thiopental: 3–5 mg/kg (adult), 5–6 mg/kg (pediatric).
3. Neuromuscular Blockers & Reversals:
   * Rocuronium: Standard intubation 0.6 mg/kg (2x ED95 on IBW) | RSI 1.0–1.2 mg/kg on IBW | Maintenance 0.1–0.15 mg/kg.
   * Succinylcholine: 1.0–1.5 mg/kg on TBW (vial 20 mg/mL, max 200 mg).
   * Cisatracurium: 0.15–0.2 mg/kg on IBW (vial 2 mg/mL).
   * Sugammadex: Routine reversal (2 twitches on TOF: 2.0 mg/kg on TBW) | Deep block (PTC 1–2: 4.0 mg/kg on TBW) | Immediate rescue post-Roc 1.2 mg/kg (16.0 mg/kg on TBW).
   * Neostigmine + Glycopyrrolate: Neostigmine 0.05 mg/kg (max 5.0 mg) + Glycopyrrolate 0.01 mg/kg (or 0.2 mg per 1 mg neostigmine).
4. Maintenance Infusions (TIVA & Vasoactive Titrations):
   * Propofol TIVA: 100–200 mcg/kg/min (or 6–12 mg/kg/h on LBW).
   * Remifentanil TIVA: 0.1–0.5 mcg/kg/min on LBW (diluted 20–50 mcg/mL).
   * Norepinephrine Infusion: 0.02–0.5 mcg/kg/min (concentration 4 mg/50 mL = 80 mcg/mL).
   * Phenylephrine: Bolus (50–100 mcg) | Infusion (20–50 mcg/min).
   * Ephedrine: Bolus (5–10 mg IV).
5. Postoperative & Multimodal Analgesia:
   * IV Acetaminophen (Paracetamol): 15 mg/kg (max 1000 mg q6h; cap at 4g/day).
   * Ketorolac: 15–30 mg IV adult (caution in renal/elderly).
   * Morphine: 0.05–0.1 mg/kg IV titration on IBW.
   * Fentanyl: 1–2 mcg/kg IV bolus on LBW.
   * Systemic IV Lidocaine: Bolus 1–1.5 mg/kg IBW over 10 min, then infusion 1–2 mg/kg/h IBW.

#### C. TAB 2: [AIRWAY EQUIPMENT CALCULATOR & SIZING GUIDE]
Dynamic selector matching age, sex, and height:

1. Endotracheal Tubes (ETT):
   * Adult: Female standard ID 7.0–7.5 mm (depth ~20–21 cm at teeth) | Male standard ID 8.0–8.5 mm (depth ~22–23 cm at teeth).
   * Pediatric Uncuffed Tube Size: `(Age / 4) + 4.0` mm ID.
   * Pediatric Cuffed Tube Size: `(Age / 4) + 3.5` (or `Age/4 + 3.0` for microcuff) mm ID.
   * Pediatric Oral Depth (cm at lip): `(Age / 2) + 12` cm (or `ID x 3`).
   * Pediatric Nasal Depth (cm): `(Age / 2) + 15` cm.
   * Cuff Pressure Threshold: Display maximum recommended cuff pressure: <= 20–25 cmH2O (prevent subglottic ischemic damage).
2. Supraglottic Airway Devices (SAD / LMA / i-gel):
   * Sizing Table with dynamic selection:
     - Size 1: Neonate / Infants < 5 kg (cuff air max 4 mL).
     - Size 1.5: Infants 5–10 kg (cuff air max 7 mL).
     - Size 2: Children 10–20 kg (cuff air max 10 mL).
     - Size 2.5: Children 20–30 kg (cuff air max 14 mL).
     - Size 3: Children / Small adults 30–50 kg (cuff air max 20 mL).
     - Size 4: Normal adults 50–70 kg (cuff air max 30 mL).
     - Size 5: Large adults > 70 kg (cuff air max 40 mL).
   * Specific i-gel sizes auto-mapped by identical weight categories.
3. Thoracic & Double-Lumen Endobronchial Tubes (DLT):
   * Left-sided Robertshaw DLT sizing based on patient height & sex:
     - Short (< 160 cm / 5'3"): 35 French.
     - Medium (160–175 cm / 5'3" - 5'9"): 37 French (Females) / 39 French (Males).
     - Tall (> 175 cm / 5'9"): 39–41 French.
   * Bronchial blocker sizing guidelines (9 Fr, 7 Fr, 5 Fr matching single-lumen tube inner diameters).
4. Pharyngeal Airways & Masks:
   * Guedel Oropharyngeal Airway sizing (Size 000 up to Size 5; measurement landmark: corner of mouth to angle of mandible).
   * Laryngoscope blade recommendation (Miller 0-1 for neonates/infants; Mac 3/4 for adults).

#### D. TAB 3: [MECHANICAL VENTILATION BENCHMARK & CALCULATOR]
Real-time calculator providing initial ventilator setup and lung-protective boundaries:

1. Lung-Protective Ventilation Targets (ARDSNet & Perioperative Standards):
   * Tidal Volume ($V_T$): Strictly calculated on **IBW (Predicted Body Weight)**, NOT TBW:
     - 6 mL/kg IBW (Lung protective baseline).
     - 7 mL/kg IBW (Intermediate setting).
     - 8 mL/kg IBW (Upper limit of protective ventilation).
     - Auto-highlighted warning if actual dialed $V_T / \text{TBW}$ creates volutrauma in obese patients.
   * Minute Ventilation ($V_E$) & Respiratory Rate:
     - Recommended baseline RR: 10–14 breaths/min (Adults), 20–30 breaths/min (Pediatrics).
     - Target $P_aCO_2$: 35–40 mmHg ($ETCO_2$ 30–35 mmHg).
2. Pressure & Driving Limits:
   * Plateau Pressure ($P_{plat}$): Safe limit $< 30 \text{ cmH}_2\text{O}$.
   * Driving Pressure ($\Delta P = P_{plat} - \text{PEEP}$): Target $< 14\text{--}15 \text{ cmH}_2\text{O}$ (proven determinant of dynamic lung strain).
   * PEEP Baseline: 5–8 $\text{cmH}_2\text{O}$ standard intraoperatively; decremental titration advice.
3. Obstructive / Restrictive Modifiers (Interactive Switch):
   * COPD / Obstructive Lung toggle: Prolong expiratory time ($I:E = 1:3\text{ to }1:4$), lower RR (< 10–12/min) to prevent intrinsic PEEP (auto-PEEP) and gas trapping.
   * Laparoscopy / Trendelenburg toggle: Anticipate decreased compliance; monitor driving pressure elevation due to pneumoperitoneum cephalad diaphragm displacement.

---

### 5. MATHEMATICAL FORMULAS (STRICT IMPLEMENTATION)

1. Devine Formula for Ideal Body Weight (IBW):
   * Male: `50.0 + 0.905 * (heightCm - 152.4)`
   * Female: `45.5 + 0.905 * (heightCm - 152.4)`
   * If TBW < calculated IBW, IBW = TBW.
2. Janmahasatian Formula for Lean Body Weight (LBW):
   * BMI = `tbwKg / ((heightCm / 100) ^ 2)`
   * Male LBW = `(9270 * tbwKg) / (6680 + (216 * BMI))`
   * Female LBW = `(9270 * tbwKg) / (8780 + (244 * BMI))`
   * Capped at TBW.
3. Adjusted Body Weight (ABW40):
   * `IBW + 0.4 * (TBW - IBW)` (if TBW > IBW, else TBW).
4. Pediatric ETT Sizing:
   * Uncuffed ID: `(ageYears / 4) + 4.0`
   * Cuffed ID: `(ageYears / 4) + 3.5`
   * Oral insertion depth: `(ageYears / 2) + 12` cm.

---

### 6. DESIGN & CODE POLISH EXPECTATIONS
- Zero external UI libraries requiring remote CDNs; fully self-contained Tailwind + Lucide implementation.
- Safety disclaimers: Persistent sticky bottom banner: "Cognitive aid only. Clinical judgment and direct patient evaluation take precedence over calculated values."
- Ready-to-run file structure:
  * `/src/store/useAnesthesiaStore.ts`
  * `/src/constants/formulary.ts`
  * `/src/constants/airwayEquipment.ts`
  * `/src/components/BiometricBar.tsx`
  * `/src/components/DrugCalculator.tsx`
  * `/src/components/AirwayGuide.tsx`
  * `/src/components/VentilationGuide.tsx`