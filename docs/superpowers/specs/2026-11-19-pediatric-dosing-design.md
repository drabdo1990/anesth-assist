# Pediatric Medication Dosing Architecture & Design Spec

**Date:** 2026-11-19  
**Status:** Approved  
**Topic:** Pediatric Perioperative Medication Dosing and Dilution System  
**Target:** `anesth-helper` (Dosing Engine, Formulary Data Layer, Biometric Gating)

---

## 1. Executive Summary & Clinical Context

In anesthesia practice, pediatric dosing differs fundamentally from adult dosing:
1. **Weight Scalars:** Adult formulas like Devine IBW and Janmahasatian LBW are anatomically invalid for pediatric patients (< 152.4 cm). Pediatric dosing is almost universally calculated on **Total Body Weight (TBW)**.
2. **Age-Bracketed Pharmacokinetics:** Neonates and infants have larger extracellular fluid volumes and immature hepatic/renal clearance pathways, requiring higher per-kg doses of water-soluble drugs (e.g. Suxamethonium 2 mg/kg in infants vs. 1–1.5 mg/kg in older children, Propofol 2.5–3.5 mg/kg in infants vs. 2–3 mg/kg in children).
3. **Adult Single-Dose Ceiling:** In larger children and adolescents, weight-based calculations can exceed safe adult maximum single doses (e.g. 75 kg adolescent at 15 mg/kg Paracetamol = 1,125 mg, whereas the adult maximum single-dose ceiling is 1,000 mg). Hard capping at the adult maximum is essential to prevent overdose.
4. **Dilution & Measurable Volumes:** Administering adult commercial concentrations to infants leads to dangerously fractional, unmeasurable volumes (e.g. Fentanyl 50 mcg/mL in a 4 kg infant = 0.08 mL). Standard pediatric dilutions (e.g. Fentanyl 10 mcg/mL, Atropine 0.1 mg/mL, Ketamine 10 mg/mL) must be provided with exact mL calculation and clear preparation guidelines.

Previously, AnesthAssist completely withheld the Dosing calculator for patients under 18 with a blocking warning banner. This design integrates a validated, evidence-based pediatric dosing engine into the existing Dosing tab, re-enabling the Pediatric rapid plan card and providing interactive dosing with safety ceilings.

---

## 2. Core Architectural Principles & Invariants

1. **Zero Breaking Changes / 100% Backward Compatibility:**
   - Existing adult medication records remain intact. Doses that omit the new `population` field default to `'adult'`.
   - Adult calculations continue using existing scalars (TBW, IBW, LBW, ABW40).
2. **Strict Pediatric TBW Lock:**
   - For any pediatric dose, the calculation engine strictly evaluates against `tbwKg`. Adult scalars (IBW, LBW) are ignored, and the scalar selector in the UI is locked to TBW.
3. **Hard Adult Maximum Single-Dose Ceilings:**
   - `calculatedMass = min(dosePerKg * tbwKg, absoluteMax.value)`.
   - When capped, an amber badge explicitly alerts the clinician: `Capped at adult max: {value} {unit}`.
4. **Mandatory Minimum Effective Floors:**
   - Where subtherapeutic dosing causes paradoxical adverse reactions (e.g., Atropine < 0.1 mg provoking paradoxical central vagotonic bradycardia), the calculator enforces the minimum floor and flags it with an informational badge.
5. **Seamless Auto-Selection with Manual Control:**
   - When `patient.ageYears < 18`, the Dosing tab automatically defaults to **Pediatric** mode.
   - A segmented control (`[ Adult | Pediatric ]`) allows clinicians to switch views if needed.
   - If `patient.ageYears === null`, the safety gate banner remains active: `Age required before using the dosing calculator`.
6. **Zero PHI & Offline-First:**
   - All pediatric data is bundled client-side with zero external API calls. Patient biometrics remain local and ephemeral.

---

## 3. Data Model Extensions (`src/data/types.ts`)

```typescript
export type TargetPopulation = 'adult' | 'pediatric' | 'both';

export interface AgeBracket {
  minYears?: number; // Inclusive lower age bound (e.g. 0 for neonate)
  maxYears?: number; // Exclusive upper age bound (e.g. 2 for infant < 2 yr)
  label: string;     // Display label, e.g. "Infant (< 2 yr)", "Child (2–12 yr)"
}

export interface MedicationDose {
  id: string;
  indication: string;
  min?: number;
  max?: number;
  default?: number;
  unit: DoseUnit;
  preferredConcentrationMgPerMl?: number;
  scalar?: WeightScalar;
  scalarBasis?: ScalarBasis;
  absoluteMax?: AbsoluteMax;
  weightBandKg?: { min?: number; max?: number; maxExclusive?: number };
  notes?: string[];
  sourceIds: string[];
  
  // --- Pediatric Extensions ---
  /** Target population for this dose line. Defaults to 'adult' if omitted. */
  population?: TargetPopulation;
  /** Age bracket specification for auto-matching patient age. */
  ageBracket?: AgeBracket;
  /** Minimum dose floor to avoid subtherapeutic adverse effects (e.g. Atropine 0.1 mg). */
  minimumFloor?: { value: number; unit: 'mg' | 'mcg' };
  /** Explicitly flags that dose must never exceed adult single-dose ceiling. */
  cappedAtAdultMax?: boolean;
}

export interface MedicationConcentration {
  label: string;
  mgPerMl: number;
  sourceId: string;
  requiresDilution?: boolean;
  
  // --- Pediatric Dilution Extensions ---
  /** When true, preselected as default concentration in pediatric mode. */
  isPediatricDefault?: boolean;
  /** Concise step-by-step preparation instruction for nursing/anesthesia staff. */
  pediatricInstructions?: string;
}
```

---

## 4. Clinical Formulary Scope & Pediatric Doses

All doses are derived from primary references and trusted textbooks registered in `src/data/sources.ts`:
- `oxford-handbook` (*Oxford Handbook of Anaesthesia*, 4th/5th ed., p. 948)
- `miller-6e` (*Miller's Anesthesia*, 6th ed., Ch. 10 & 68; 10th ed., 2024)
- `dailymed-labels` (FDA Approved Product Labels)

### 4.1 Pre-induction & Sedation
- **Midazolam (`midazolam-premed`)**
  - Pediatric IV: `0.05–0.1 mg/kg` (max 0.4 mg/kg total or 2 mg single). Age bracket: Child (6 mo – 12 yr).
  - Pediatric Oral: `0.25–0.5 mg/kg` (max 15 mg).
  - Concentrations: `1 mg/mL` (diluted default), `5 mg/mL` (neat).
- **Atropine (`atropine-premed`)**
  - Pediatric IV Vagolysis: `10–20 mcg/kg` (default `15 mcg/kg`).
  - Minimum floor: `0.1 mg` (`100 mcg`).
  - Absolute max: `0.5 mg` in children, `1.0 mg` in adolescents.
  - Concentration: `0.1 mg/mL` (`100 mcg/mL`, diluted default). Prep: *Dilute 1 mL (0.5 mg) with 4 mL saline to 5 mL (0.1 mg/mL)*.
- **Glycopyrrolate (`glycopyrrolate-reversal`)**
  - Pediatric IV: `4–10 mcg/kg` (default `5 mcg/kg`, max `0.2 mg`). Concentration: `0.2 mg/mL`.

### 4.2 Induction & Hypnotics
- **Propofol (`propofol-induction`)**
  - Infant (< 2 yr): `2.5–3.5 mg/kg` (default `3.0 mg/kg`).
  - Child (2–12 yr): `2.0–3.0 mg/kg` (default `2.5 mg/kg`).
  - Teen (> 12 yr): `1.5–2.5 mg/kg` (default `2.0 mg/kg`).
  - Concentration: `10 mg/mL` (neat 1%). Max single: `200 mg`.
  - Boxed Note: *Avoid prolonged ICU sedation infusions in pediatric patients due to risk of Propofol Infusion Syndrome (PRIS).*
- **Ketamine (`ketamine-induction`)**
  - Pediatric IV: `1.0–2.0 mg/kg` (default `1.5 mg/kg`, max `100 mg`).
  - Pediatric IM: `5.0–10.0 mg/kg` (default `5.0 mg/kg`).
  - Concentrations: `10 mg/mL` (diluted default for IV), `50 mg/mL` (for IM).
  - Prep: *Dilute 1 mL (50 mg) with 4 mL saline to 5 mL (10 mg/mL).*
- **Etomidate (`etomidate-induction`)**
  - Pediatric IV (> 2 yr): `0.2–0.3 mg/kg` (default `0.2 mg/kg`, max `20 mg`).

### 4.3 Neuromuscular Blockade & Reversal
- **Succinylcholine (`succinylcholine-intubation`)**
  - Infant (< 1 yr): `2.0 mg/kg` IV (default `2.0 mg/kg`).
  - Child (1–12 yr): `1.0–1.5 mg/kg` IV (default `1.0 mg/kg`).
  - Emergency IM (no IV / CICO): `3.0–4.0 mg/kg` IM (max `150 mg`).
  - Boxed Warning: *Elective use contraindicated in pediatric patients due to risk of hyperkalemic cardiac arrest in undiagnosed muscular dystrophy. Co-administer atropine in infants to prevent severe bradycardia.*
  - Concentrations: `20 mg/mL` (default), `50 mg/mL`.
- **Rocuronium (`rocuronium-intubation`)**
  - Pediatric Routine Intubation: `0.6–1.0 mg/kg` (default `0.6 mg/kg`).
  - Pediatric RSI: `1.2 mg/kg`.
  - Max single: `50 mg` (routine) / `100 mg` (RSI).
  - Concentrations: `10 mg/mL` (neat), `1 mg/mL` (diluted for neonates).
- **Sugammadex (`sugammadex-reversal`)**
  - Moderate block (2 twitches): `2.0 mg/kg` (approved age ≥ 2 yr).
  - Deep block (PTC 1–2): `4.0 mg/kg`.
  - Concentration: `100 mg/mL`.
- **Neostigmine (`neostigmine-reversal`)**
  - Pediatric Reversal: `0.03–0.07 mg/kg` (default `0.05 mg/kg`, max `5.0 mg`).
  - Paired with Glycopyrrolate `0.01 mg/kg` or Atropine `0.02 mg/kg`.

### 4.4 Opioids & Analgesics
- **Fentanyl (`fentanyl-bolus`)**
  - Pediatric IV Bolus: `1.0–2.0 mcg/kg` (default `1.0 mcg/kg`, max single `100 mcg`).
  - Concentrations: `10 mcg/mL` (diluted default), `50 mcg/mL` (neat).
  - Prep: *Draw 2 mL (100 mcg) + 8 mL saline = 10 mL at 10 mcg/mL.*
- **Morphine (`morphine-analgesia`)**
  - Pediatric IV: `0.05–0.1 mg/kg` (default `0.05 mg/kg`, max initial `2–4 mg`).
  - Concentration: `1 mg/mL` (diluted default).
- **Acetaminophen (`acetaminophen-analgesia`)**
  - Pediatric IV: `15 mg/kg` (term neonates: `7.5–10 mg/kg`, max single `1,000 mg`, max 24h `60 mg/kg` up to `4,000 mg`).
  - Concentration: `10 mg/mL` (neat IV infusion).
- **Ketorolac (`ketorolac-analgesia`)**
  - Pediatric IV (age ≥ 2 yr): `0.5 mg/kg` (default `0.5 mg/kg`, max single `15 mg`).

### 4.5 Emergency & Autonomic
- **Epinephrine (`epinephrine-resuscitation`)**
  - Pediatric Cardiac Arrest / Bradycardia: `10 mcg/kg` IV (`0.1 mL/kg` of `1:10,000` solution = `0.01 mg/kg`, max single `1,000 mcg`).
  - Pediatric Anaphylaxis IM: `10 mcg/kg` IM (`1:1,000` solution, max `0.3 mg` in child, `0.5 mg` in adolescent).
  - Concentrations: `1:10,000` (`0.1 mg/mL` IV default), `1:1,000` (`1.0 mg/mL` IM).
- **Phenylephrine (`phenylephrine-bolus`)**
  - Pediatric IV Bolus: `2.0–5.0 mcg/kg` (max single `100 mcg`).
  - Concentrations: `10 mcg/mL` or `20 mcg/mL`.

### 4.6 Antiemetics
- **Ondansetron (`ondansetron-ponv`)**
  - Pediatric IV: `0.1 mg/kg` (default `0.1 mg/kg`, max single `4.0 mg`). Concentration: `2 mg/mL`.
- **Dexamethasone (`dexamethasone-ponv`)**
  - Pediatric IV: `0.15 mg/kg` (max single `4.0–8.0 mg`). Concentration: `4 mg/mL`.

### 4.7 Local Anesthetics (Maximum Safe Limits)
- **Lidocaine Plain:** `5.0 mg/kg` (max single `200 mg`).
- **Lidocaine with Epinephrine:** `7.0 mg/kg` (max single `300–500 mg`).
- **Bupivacaine Plain:** `2.0 mg/kg` (neonates: `1.0 mg/kg`, max single `100 mg`).
- **Bupivacaine with Epinephrine:** `2.5–3.0 mg/kg`.
- **Ropivacaine:** `2.5–3.0 mg/kg`.

---

## 5. Calculation Architecture (`src/lib/calc/medication.ts`)

```typescript
export interface DoseCalculationResult {
  scalar: WeightScalar;
  scalarWeightKg: number;
  calculatedMass: number;
  unit: DoseUnit;
  volumeMl: number | null;
  concentrationMgPerMl: number | null;
  isCapped: boolean;
  cappedMessage?: string;
  isFloorEnforced: boolean;
  floorMessage?: string;
  ageBracketMatched?: boolean;
}
```

### Calculation Algorithm:
1. **Scalar Resolution:**
   - If `dose.population === 'pediatric'` or active population is `'pediatric'`, `effectiveScalar = 'TBW'` regardless of stored adult scalar.
   - `effectiveWeight = tbwKg`.
2. **Raw Mass Calculation:**
   - `rawMass = doseValue * effectiveWeight`.
3. **Adult Single-Dose Ceiling Check:**
   - If `dose.absoluteMax` is defined:
     ```typescript
     if (rawMass > dose.absoluteMax.value) {
       calculatedMass = dose.absoluteMax.value;
       isCapped = true;
       cappedMessage = `Capped at adult max: ${dose.absoluteMax.value} ${dose.absoluteMax.unit}`;
     } else {
       calculatedMass = rawMass;
       isCapped = false;
     }
     ```
4. **Minimum Effective Floor Check:**
   - If `dose.minimumFloor` is defined:
     ```typescript
     if (calculatedMass < dose.minimumFloor.value) {
       calculatedMass = dose.minimumFloor.value;
       isFloorEnforced = true;
       floorMessage = `Minimum floor applied: ${dose.minimumFloor.value} ${dose.minimumFloor.unit}`;
     }
     ```
5. **Volume (mL) Calculation:**
   - `volumeMl = calculatedMassInMg / concentrationMgPerMl`.

---

## 6. UI Implementation (`src/views/DosingView.tsx` & `src/components/DrugCard.tsx`)

### 6.1 `DosingView.tsx`
- Remove the blocking `<WarningBanner level="red" title="Pediatric dosing not available">`.
- Add a segmented mode control at the top:
  ```tsx
  <div className="flex bg-slate-800 p-1 rounded-lg">
    <button className={population === 'adult' ? 'active' : ''}>Adult</button>
    <button className={population === 'pediatric' ? 'active' : ''}>Pediatric</button>
  </div>
  ```
- **State Initialization:**
  - `patient.ageYears !== null && patient.ageYears < 18 ? 'pediatric' : 'adult'`.
  - Automatically updates when `patient.ageYears` changes in the BiometricHeader.
- Filter displayed medications to those matching the active population (`'pediatric'` or `'both'`).

### 6.2 `DrugCard.tsx`
- In pediatric mode:
  - If a dose has `ageBracket`, display the bracket label.
  - If `patient.ageYears` falls within `ageBracket`, show an `Age match` badge and auto-select that dose line.
  - Preselect the `isPediatricDefault` concentration.
  - Display `pediatricInstructions` in a muted callout under the volume display.
  - Show badges when `isCapped` (amber) or `isFloorEnforced` (blue/info).

### 6.3 `src/data/planCards.ts`
- Update the **Pediatric Plan Card**:
  - Set `dosing: true` in `links`.
  - Remove note stating calculated dosing is withheld.

---

## 7. Quality Assurance & Verification Matrix

| Test Suite | File | Assertions / Verification Target |
| :--- | :--- | :--- |
| **Dose Calculation Tests** | `src/lib/calc/__tests__/medication.test.ts` | • Lock to TBW in pediatrics.<br>• Adult single-dose cap (Paracetamol, Ketorolac, Ondansetron).<br>• Minimum floor enforcement (Atropine 0.1 mg).<br>• Volume calculations with pediatric dilutions (Fentanyl, Atropine). |
| **Data Integrity Tests** | `src/data/__tests__/integrity.test.ts` | • Every pediatric dose and dilution has resolvable `sourceIds`.<br>• `min <= default <= max` for all pediatric doses.<br>• Valid non-overlapping age bracket ranges. |
| **View Integration Tests** | `src/data/__tests__/planCards.test.ts` | • Pediatric plan card links to Dosing (`links.dosing === true`). |
| **Full Regression Suite** | `npm.cmd test` | All 433+ tests pass with zero regressions. |
| **TypeScript Strict Check** | `npx.cmd tsc -b` | 0 diagnostic errors. |
| **Production Vite Build** | `npx.cmd vite build` | Clean PWA bundle generation. |

---

## 8. Rollout & Phasing

1. **Phase 1: Types & Calculation Engine** (`src/data/types.ts`, `src/lib/calc/medication.ts`).
2. **Phase 2: Formulary Population** (`src/data/medications.ts` or modular `src/data/medications/pediatric.ts`).
3. **Phase 3: UI Integration** (`src/views/DosingView.tsx`, `src/components/DrugCard.tsx`, `src/data/planCards.ts`).
4. **Phase 4: Test Coverage & Verification** (`medication.test.ts`, `integrity.test.ts`, `planCards.test.ts`).
5. **Phase 5: Production Build & Deployment**.
