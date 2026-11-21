# Implementation Plan: Sync Clinical Reference Notebook into `anesth-helper`

**Goal:** Integrate the verified clinical measures, equipment specs, drug dosages, local anesthetic tables, and ventilator parameters from `src/constants/anesthesia_reference_data.md` into the strongly-typed data layer, calculation utilities, and views of `anesth-helper`, ensuring 100% test coverage and source-badge traceability.

---

### Phase 1: Register Reference Sources (`src/data/sources.ts`)
1. Open `src/data/sources.ts` and inspect the `Source` interface in `src/data/types.ts`.
2. Add the verified notebook citations if not already present:
   - `miller-6e`: *Miller's Anesthesia, 6th Ed. (2005)*
   - `rose-mclarney-2015`: *Anesthesia Equipment Simplified (2015)*
   - `aagbi-2012`: *AAGBI Checklist for Anaesthetic Equipment (2012)*
   - `fda-1993`: *FDA Anesthesia Apparatus Checkout Recommendations (1993)*
   - `clinical-cases-anesth`: *Clinical Cases in Anesthesia (Table 77.4)*
   - `aln-2025`: *Anesthesiology 2025; 143:1211–24*
3. **Verification:** Run `npx vitest run src/data/__tests__/integrity.test.ts` to verify all source IDs validate cleanly.

---

### Phase 2: Update Drug Dosages, Infusions & TIVA Targets (`src/data/medications.ts` & `src/lib/calc/medication.ts`)
1. Inspect `src/data/medications.ts` and `src/data/types.ts`.
2. Update or add the following medication entries with `sourceId: 'miller-6e'` or `'clinical-cases-anesth'`:
   - **Induction Barbiturates**:
     - `thiopental`: Induction `3–4 mg/kg` IV (onset `10–30 s`), maintenance bolus `50–100 mg q10–12min`.
     - `methohexital`: Induction `1–1.5 mg/kg` IV (onset `10–30 s`), maintenance bolus `20–40 mg q4–7min`.
   - **Opioid Boluses & Continuous Infusions**:
     - `fentanyl`: Bolus `1–3 µg/kg`, Infusion `0.01–0.05 µg/kg/min`.
     - `sufentanil`: Bolus `0.1–0.3 µg/kg`, Infusion `0.0015–0.01 µg/kg/min`.
     - `alfentanil`: Bolus `10–20 µg/kg`, Infusion `0.25–0.75 µg/kg/min`.
     - `remifentanil`: Infusion `0.05–0.25 µg/kg/min`.
     - `meperidine`: Bolus `50–100 mg` IV (`1.0–1.5 mg/kg` IM premedication).
     - `morphine`: Premedication `0.2 mg/kg` IM (`5–15 mg`).
   - **Neuromuscular Blocker Infusions (90%–95% twitch suppression)**:
     - `rocuronium` (`9–12 µg/kg/min`), `vecuronium` (`0.8–1 µg/kg/min`), `cisatracurium` (`1–2 µg/kg/min`), `atracurium` (`4–12 µg/kg/min`), `mivacurium` (`3–15 µg/kg/min`).
   - **Premedications, Antiemetics & Vasopressors**:
     - `midazolam`: Induction `0.2 mg/kg` IV, Premed `0.03–0.07 mg/kg` IM (`2.5–5 mg`), concentrations `[1, 5] mg/mL`.
     - `diazepam` (`0.1–0.15 mg/kg` PO/IM, `5 mg/mL`), `lorazepam` (`0.03–0.06 mg/kg` PO/IM, `[2, 4] mg/mL`), `clonidine` (`5 µg/kg` PO).
     - `ondansetron` (`0.1 mg/kg` peds, `1–4 mg` adult IV), `dexamethasone` (`0.5–1.0 mg/kg` peds, `4–10 mg` adult IV), `metoclopramide` (`0.1–0.2 mg/kg` peds, `10–20 mg` adult IV), `prochlorperazine` (`5–10 mg` IV/IM), `ephedrine` (`10–25 mg` IV/IM), `scopolamine` (`0.006 mg/kg` IM or `0.5 mg/72h` patch).
3. Add a `tivaTargets` lookup in `src/data/medications.ts` (Table 11-8 & Table 12-3 plasma concentrations for Propofol, Fentanyl, Sufentanil, Alfentanil, Remifentanil, Methohexital, Thiopental) so `DrugCard.tsx` or `DosingView.tsx` can display target effect-site/plasma ranges.
4. **Verification:** Run `npx vitest run src/lib/calc/__tests__/medication.test.ts`.

---

### Phase 3: Local Anesthetics & Neuraxial Dosing (`src/lib/calc/localAnesthetic.ts` & `src/components/LocalAnestheticPanel.tsx`)
1. Open `src/lib/calc/localAnesthetic.ts` and `src/components/LocalAnestheticPanel.tsx`.
2. Sync maximum infiltration doses (70-kg baseline scaled by weight) and physicochemical properties (`pKa`, partition coefficient, relative potency) from Miller 6e Table 14-4 & p. 475:
   - `lidocaine`: Plain `300 mg` (`~4.3 mg/kg`), With Epi `500 mg` (`~7 mg/kg`), Bier block `3 mg/kg` (0.5%plain).
   - `bupivacaine`: Plain `175 mg` (`2.5 mg/kg`), With Epi `225 mg` (`~3.2 mg/kg`).
   - `ropivacaine`: Epidural `140–180 mg` (`0.75–1.0%`, `15–20 mL`).
   - `levobupivacaine`: Epidural `150–225 mg` (`0.5–0.75%`, `15–20 mL`).
   - `mepivacaine`: Plain `300 mg`, With Epi `500 mg`.
   - `prilocaine`: Plain `500 mg`, With Epi `600 mg`.
   - `chloroprocaine`: Plain `800 mg`, With Epi `1000 mg`.
   - `procaine`: Plain `400 mg`, With Epi `600 mg`.
   - `etidocaine`: Plain `300 mg`, With Epi `400 mg`.
3. Add a structured reference tab/accordion inside `LocalAnestheticPanel.tsx` (or `ClinicalReferenceGuide.tsx`) for **Epidural (Table 14-7)** and **Spinal (Table 14-8)** regimens including baricity and glucose percentages.
4. **Verification:** Run `npx vitest run src/lib/calc/__tests__/calc.test.ts`.

---

### Phase 4: Ventilation Parameters & Physiological Alerts (`src/data/ventilation.ts`, `src/lib/calc/ventilation.ts` & `src/views/VentilationView.tsx`)
1. Open `src/data/ventilation.ts` and `src/lib/calc/ventilation.ts`.
2. Add/verify ventilation mode presets and clinical pearls:
   - **Conventional IPPV**: `VT` range, `RR < 30/min`, `FiO2 <= 0.6` advisory badge.
   - **HFPV Mode**: `VT` `3–4 mL/kg`, `RR` `60–100 breaths/min` (`miller-6e`).
   - **HFV (Thoracic)**: `VT < 2 mL/kg`, `RR 60–2400 breaths/min`.
   - **Apneic Insufflation (Thoracic)**: `100% O2` + `5–10 cm H2O CPAP` (max safe window `20 min`).
3. Add physiological calculators/advisories to `VentilationView.tsx`:
   - **Apneic Threshold Estimator**: Display `Resting PaCO2 - 4 to 5 mmHg`.
   - **Laparoscopic Pneumoperitoneum Toggle**: Warn of decreased thoracopulmonary compliance and expected `+15% to +25% PaCO2` rise plateauing at `20–30 min`.
   - **Lung Mechanics Glossary (`aln-2025`)**: Driving Pressure ($\Delta P = P_{plat} - PEEP$), $C_{RS}$, $EELV$, and Recruitment-to-Inflation ($R/I$) ratio.
4. **Verification:** Run unit tests in `src/lib/calc/__tests__/`.

---

### Phase 5: Airway Equipment & Machine Checklists (`src/data/airwayDevices.ts` & `src/data/checklists.ts`)
1. Open `src/data/airwayDevices.ts` and verify sizing against Chapter 58 & Miller 6e p. 1209:
   - Adult Anatomic Facemasks (`#3 Small`, `#4 Medium`, `#5 Large`), Pediatric **Rendell-Baker-Soucek** mask.
   - Disaster/Portable Kit baseline: LMA `#2` & `#4`, Laryngoscope blades `MAC 3` & `Miller 2`, OPA `60, 70, 80, 90 mm`, Cuffed ETT `4.0` & `7.0 mm`, Pediatric AMBU (`up to 600 mL TV`).
2. Open `src/data/checklists.ts` and add/update three structured checklists with `<ChecklistItem />` support:
   - **FDA 1993 / AAGBI 2012 Pre-Case Machine & "Two-Bag" Test** (Bellows test, O2 flush, unidirectional valves, vaporizer fit/fill/leak, Bain/T-piece check, gas outlet, monitor alarms).
   - **ASA Basic Monitoring & NORA / MRI Checklist** (NIBP q5min max interval, continuous ECG/SpO2/ETCO2, low-FiO2 alarm, disconnect alarm, backup O2 cylinder, self-inflating AMBU bag, suction, scavenging, MR Safe/Conditional verification).
   - **Machine Pressure Circuit Quick-Reference** (`ClinicalReferenceGuide.tsx`): High-pressure (O2 `2200 -> 45 psig`, N2O `750 -> 45 psig`), Intermediate (`45 psig` cylinder / `50–55 psig` pipeline -> `14/26 psig` second-stage), Low-pressure (flow tubes -> vaporizers -> check valve -> common gas outlet; Sevoflurane Compound A warning).

---

### Phase 6: Reference Loader & Test Suite Validation
1. Inspect `src/services/referenceDataLoader.ts` and `src/services/__tests__/referenceDataLoader.test.ts` to ensure the updated markdown headings and tables in `src/constants/anesthesia_reference_data.md` parse cleanly into `ClinicalReferenceGuide.tsx` and `ReferencesView.tsx`.
2. Run the full test suite and production build:
   ```bash
   npx vitest run
   npm run build