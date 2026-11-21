# Pediatric Medication Dosing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Implement a comprehensive, evidence-based pediatric medication dosing and dilution system in AnesthAssist's Dosing tab with weight-scalar locking (TBW), age-bracket auto-matching, adult single-dose ceiling caps, and safe dilution volume calculations.

**Architecture:** Extend the medication schema in `src/data/types.ts` to support population tagging (`adult` | `pediatric`), age brackets, minimum floors, and pediatric dilution presets. Update `src/lib/calc/medication.ts` to enforce pediatric calculation invariants (strict TBW basis, hard caps at adult max ceilings, minimum floor enforcement). Replace the Dosing view's blocking pediatric banner with an interactive segmented control (`Adult | Pediatric`), enhance `DrugCard.tsx` with dilution instructions and safety badges, and link the Pediatric rapid plan card directly to Dosing.

**Tech Stack:** TypeScript 5.7, React 19, Zustand 5, Tailwind CSS 3.4, Vitest 4, Vite 6 PWA.

**Spec:** [`docs/superpowers/specs/2026-11-19-pediatric-dosing-design.md`](file:///e:/coding-agents-files/antigravity/anesth-helper/docs/superpowers/specs/2026-11-19-pediatric-dosing-design.md)

---

## Global Constraints

- 100% backward compatibility for all existing adult doses and calculations.
- Strict TBW lock for pediatric calculations (never use Devine IBW or Janmahasatian LBW for pediatrics).
- Every pediatric dose and dilution preset must resolve to valid registered `sourceIds` (`oxford-handbook`, `miller-6e`, `dailymed-labels`).
- Zero hardcoded crisis doses in prose; calculations must use structured `min`, `max`, `default`, `unit`, and `absoluteMax`.
- Zero-PHI, offline-first client architecture; patient biometrics remain local and ephemeral.

## Review Focus

1. **Obese adolescent over-dosing:** A 75 kg 13-year-old receiving Paracetamol 15 mg/kg calculates 1,125 mg; must cap strictly at the adult maximum of 1,000 mg and display the amber cap badge.
2. **Infant subtherapeutic atropine:** A 3 kg neonate receiving Atropine 15 mcg/kg calculates 45 mcg; must raise/flag to the minimum floor of 100 mcg (0.1 mg) to avoid paradoxical central bradycardia.
3. **Fractional volume unmeasurability:** A 4 kg infant receiving Fentanyl 1.5 mcg/kg calculates 6 mcg; at neat 50 mcg/mL this equals 0.12 mL, but at 10 mcg/mL dilution preset this calculates a measurable 0.6 mL with preparation instructions.
4. **Age bracket auto-matching:** When patient age is 1.5 years, Propofol must auto-select the Infant (< 2 yr) bracket (2.5–3.5 mg/kg) with an `Age match` badge, while allowing manual override to Child (2–12 yr) if desired.
5. **Biometric gating:** If patient age is unset (`null`), Dosing retains the amber `Age required` warning to prevent unvalidated dose calculations.

---

### Task 1: Data Model Extensions & Calculation Engine Hardening

**Files:**
- Modify: `src/data/types.ts:1-75`
- Modify: `src/lib/calc/medication.ts:1-120`
- Test: `src/lib/calc/__tests__/medication.test.ts`

**Interfaces:**
- Consumes: `MedicationDose`, `MedicationConcentration`, `WeightScalar` from `types.ts`.
- Produces:
  ```typescript
  export type TargetPopulation = 'adult' | 'pediatric' | 'both';
  export interface AgeBracket { minYears?: number; maxYears?: number; label: string; }
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

- [x] **Step 1: Write the failing calculation tests for pediatric safety invariants**

In `src/lib/calc/__tests__/medication.test.ts`, add test suite `describe('pediatric dose calculations')`:
```typescript
it('locks weight scalar to TBW for pediatric doses even if adult scalar is passed', () => {
  const pedDose: MedicationDose = {
    id: 'test-ped-propofol',
    indication: 'Pediatric induction',
    min: 2.5,
    max: 3.5,
    default: 3.0,
    unit: 'mg/kg',
    population: 'pediatric',
    scalar: 'TBW',
    sourceIds: ['oxford-handbook'],
  };
  const res = calculateDose({
    dose: pedDose,
    tbwKg: 10,
    ibwKg: 8,
    lbwKg: 7,
    abw40Kg: 8.8,
    selectedScalar: 'LBW',
  });
  expect(res.scalar).toBe('TBW');
  expect(res.scalarWeightKg).toBe(10);
  expect(res.calculatedMass).toBe(30); // 3.0 * 10
});

it('caps pediatric dose strictly at adult single-dose ceiling', () => {
  const pedParacetamol: MedicationDose = {
    id: 'test-ped-paracetamol',
    indication: 'Pediatric analgesia',
    min: 15,
    max: 15,
    default: 15,
    unit: 'mg/kg',
    population: 'pediatric',
    absoluteMax: { value: 1000, unit: 'mg' },
    cappedAtAdultMax: true,
    sourceIds: ['oxford-handbook'],
  };
  const res = calculateDose({
    dose: pedParacetamol,
    tbwKg: 75,
    ibwKg: null,
    lbwKg: null,
    abw40Kg: null,
  });
  expect(res.calculatedMass).toBe(1000); // 75 * 15 = 1125, capped at 1000
  expect(res.isCapped).toBe(true);
});

it('enforces minimum dose floor for atropine', () => {
  const pedAtropine: MedicationDose = {
    id: 'test-ped-atropine',
    indication: 'Vagolysis',
    min: 10,
    max: 20,
    default: 15,
    unit: 'mcg/kg',
    population: 'pediatric',
    minimumFloor: { value: 100, unit: 'mcg' }, // 0.1 mg floor
    sourceIds: ['oxford-handbook'],
  };
  const res = calculateDose({
    dose: pedAtropine,
    tbwKg: 3, // 3 * 15 = 45 mcg
    ibwKg: null,
    lbwKg: null,
    abw40Kg: null,
  });
  expect(res.calculatedMass).toBe(100);
  expect(res.isFloorEnforced).toBe(true);
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `npx.cmd vitest run src/lib/calc/__tests__/medication.test.ts`
Expected: FAIL due to missing types and properties on `DoseCalculationResult`.

- [x] **Step 3: Update `src/data/types.ts` and `src/lib/calc/medication.ts`**

In `src/data/types.ts`:
Add `TargetPopulation`, `AgeBracket`, `minimumFloor`, `cappedAtAdultMax` to `MedicationDose`, and `isPediatricDefault`, `pediatricInstructions` to `MedicationConcentration`.

In `src/lib/calc/medication.ts`:
Update `calculateDose()`:
1. If `dose.population === 'pediatric'`, force `scalar = 'TBW'` and `weight = tbwKg`.
2. Compute `rawMass = doseVal * weight`.
3. Check `dose.absoluteMax`: if `rawMass > dose.absoluteMax.value`, cap at `dose.absoluteMax.value` and set `isCapped = true`.
4. Check `dose.minimumFloor`: if `rawMass < dose.minimumFloor.value`, elevate to `dose.minimumFloor.value` and set `isFloorEnforced = true`.
5. Compute volume `volumeMl` from selected concentration.

- [x] **Step 4: Run test to verify it passes**

Run: `npx.cmd vitest run src/lib/calc/__tests__/medication.test.ts`
Expected: PASS.

- [x] **Step 5: Run full test suite and compile**

Run: `npm.cmd test` && `npx.cmd tsc -b`
Expected: All 433+ tests pass, 0 type errors.

- [x] **Step 6: Commit**

```bash
git add src/data/types.ts src/lib/calc/medication.ts src/lib/calc/__tests__/medication.test.ts
git commit -m "feat(calc): add pediatric TBW locking, adult ceiling caps, and dose floor enforcement"
```

---

### Task 2: Pediatric Clinical Formulary Records

**Files:**
- Modify: `src/data/medications.ts`
- Test: `src/data/__tests__/periopMeds.test.ts`
- Test: `src/data/__tests__/integrity.test.ts`

**Interfaces:**
- Consumes: `MedicationDose`, `MedicationConcentration` with pediatric fields from `types.ts`.
- Produces: Populated pediatric doses and dilution presets in `MEDICATIONS`.

- [x] **Step 1: Write the failing tests for pediatric formulary entries**

In `src/data/__tests__/periopMeds.test.ts`:
```typescript
it('contains pediatric doses with valid age brackets and adult ceilings', () => {
  const pedsDoses = MEDICATIONS.flatMap((m) => m.doses).filter((d) => d.population === 'pediatric');
  expect(pedsDoses.length).toBeGreaterThan(15);
  for (const d of pedsDoses) {
    expect(d.scalar).toBe('TBW');
    if (d.ageBracket) {
      if (d.ageBracket.minYears !== undefined && d.ageBracket.maxYears !== undefined) {
        expect(d.ageBracket.minYears).toBeLessThan(d.ageBracket.maxYears);
      }
    }
  }
});

it('provides pediatric dilution presets for fentanyl and atropine', () => {
  const fentanyl = MEDICATIONS.find((m) => m.id === 'fentanyl-bolus');
  expect(fentanyl?.concentrations?.some((c) => c.isPediatricDefault)).toBe(true);
  const atropine = MEDICATIONS.find((m) => m.id === 'atropine-premed');
  expect(atropine?.concentrations?.some((c) => c.isPediatricDefault)).toBe(true);
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `npx.cmd vitest run src/data/__tests__/periopMeds.test.ts`
Expected: FAIL (no pediatric doses populated yet).

- [x] **Step 3: Add pediatric doses and dilution presets to `src/data/medications.ts`**

Add verified pediatric doses matching the spec:
1. `midazolam-premed`: IV (`0.05–0.1 mg/kg`, max `2 mg`), PO (`0.25–0.5 mg/kg`, max `15 mg`).
2. `atropine-premed`: IV (`10–20 mcg/kg`, min floor `100 mcg`, max `0.5 mg`/`1.0 mg`). Dilution: `0.1 mg/mL` with prep instruction.
3. `glycopyrrolate-reversal`: IV (`4–10 mcg/kg`, max `0.2 mg`).
4. `propofol-induction`: Infant < 2y (`2.5–3.5 mg/kg`), Child 2–12y (`2.0–3.0 mg/kg`), Teen > 12y (`1.5–2.5 mg/kg`).
5. `ketamine-induction`: IV (`1.0–2.0 mg/kg`, max `100 mg`), IM (`5.0–10.0 mg/kg`). Dilution `10 mg/mL`.
6. `etomidate-induction`: IV (`0.2–0.3 mg/kg`, max `20 mg`).
7. `succinylcholine-intubation`: Infant < 1y (`2.0 mg/kg`), Child 1–12y (`1.0–1.5 mg/kg`), IM (`3.0–4.0 mg/kg`, max `150 mg`). Boxed warning on routine pediatric use.
8. `rocuronium-intubation`: Routine (`0.6–1.0 mg/kg`, max `50 mg`), RSI (`1.2 mg/kg`, max `100 mg`). Dilution `1 mg/mL`.
9. `sugammadex-reversal`: Moderate (`2.0 mg/kg`), Deep (`4.0 mg/kg`).
10. `neostigmine-reversal`: (`0.03–0.07 mg/kg`, max `5.0 mg`).
11. `fentanyl-bolus`: (`1.0–2.0 mcg/kg`, max `100 mcg`). Dilution `10 mcg/mL` with prep instruction.
12. `morphine-analgesia`: (`0.05–0.1 mg/kg`, max `2–4 mg`). Dilution `1 mg/mL`.
13. `acetaminophen-analgesia`: (`15 mg/kg`, max `1,000 mg`).
14. `ketorolac-analgesia`: (`0.5 mg/kg`, max `15 mg`).
15. `epinephrine-resuscitation`: PALS IV (`10 mcg/kg`, max `1,000 mcg`), Anaphylaxis IM (`10 mcg/kg`, max `0.3–0.5 mg`).
16. `phenylephrine-bolus`: (`2.0–5.0 mcg/kg`, max `100 mcg`).
17. `ondansetron-ponv`: (`0.1 mg/kg`, max `4.0 mg`).
18. `dexamethasone-ponv`: (`0.15 mg/kg`, max `4.0–8.0 mg`).
19. Local anesthetics in `LOCAL_ANESTHETICS`: Add pediatric ceiling specifications.

- [x] **Step 4: Run test to verify it passes**

Run: `npx.cmd vitest run src/data/__tests__/periopMeds.test.ts src/data/__tests__/integrity.test.ts`
Expected: PASS.

- [x] **Step 5: Run full test suite and compile**

Run: `npm.cmd test` && `npx.cmd tsc -b`
Expected: PASS.

- [x] **Step 6: Commit**

```bash
git add src/data/medications.ts src/data/__tests__/periopMeds.test.ts
git commit -m "feat(meds): add pediatric dosing records and dilution presets across core categories"
```

---

### Task 3: Dosing UI Population Switching & Pediatric Drug Card Rendering

**Files:**
- Modify: `src/views/DosingView.tsx`
- Modify: `src/components/DrugCard.tsx`
- Modify: `src/data/planCards.ts`
- Test: `src/data/__tests__/planCards.test.ts`

**Interfaces:**
- Consumes: `population` from `types.ts`, `MEDICATIONS` from `medications.ts`, `patient.ageYears` from store.
- Produces: Interactive Adult/Pediatric mode switch, age-bracket matching UI, dilution preset preselection, and linked Pediatric plan card.

- [x] **Step 1: Write the failing test for plan cards**

In `src/data/__tests__/planCards.test.ts`, update the test verifying pediatric plan card links:
```typescript
it('pediatric plan card links to Dosing in pediatric mode', () => {
  const pedsCard = PLAN_CARDS.find((c) => c.id === 'peds');
  expect(pedsCard?.links.dosing).toBe(true);
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `npx.cmd vitest run src/data/__tests__/planCards.test.ts`
Expected: FAIL (`expected undefined to be true`).

- [x] **Step 3: Implement UI updates in `DosingView.tsx` and `DrugCard.tsx`**

1. In `DosingView.tsx`:
   - Replace the blocking `if (pediatric) return <WarningBanner ...>` block with state:
     ```tsx
     const [population, setPopulation] = useState<'adult' | 'pediatric'>(
       ageYears !== null && ageYears < 18 ? 'pediatric' : 'adult'
     );
     // Sync population if age changes
     useEffect(() => {
       if (ageYears !== null) {
         setPopulation(ageYears < 18 ? 'pediatric' : 'adult');
       }
     }, [ageYears]);
     ```
   - Render segmented toggle `[ Adult | Pediatric ]` at top of view.
   - Filter `MEDICATIONS` to those with doses matching active `population` (or `'both'`).
2. In `DrugCard.tsx`:
   - If active mode is `'pediatric'`:
     - Filter visible doses to `d.population === 'pediatric' || d.population === 'both'`.
     - Highlight dose matching `patient.ageYears` with an `Age match` badge and auto-select it.
     - Lock scalar selector to `TBW`.
     - Pre-select concentration with `isPediatricDefault: true`.
     - Render `pediatricInstructions` in a muted helper banner under the volume display.
     - Render amber badge `Capped at adult max: {val} {unit}` when `isCapped === true`.
     - Render info badge `Minimum floor: {val} {unit}` when `isFloorEnforced === true`.
3. In `src/data/planCards.ts`:
   - Update `peds` card: set `links.dosing: true`, update description to highlight pediatric dosing availability.

- [x] **Step 4: Run test to verify it passes**

Run: `npx.cmd vitest run src/data/__tests__/planCards.test.ts`
Expected: PASS.

- [x] **Step 5: Run full test suite and compile**

Run: `npm.cmd test` && `npx.cmd tsc -b`
Expected: All tests pass, clean TypeScript compilation.

- [x] **Step 6: Commit**

```bash
git add src/views/DosingView.tsx src/components/DrugCard.tsx src/data/planCards.ts src/data/__tests__/planCards.test.ts
git commit -m "feat(ui): add Adult/Pediatric segmented control, age-bracket matching, and dilution guidance"
```

---

### Task 4: Full End-to-End Verification, Documentation & Production Build

**Files:**
- Modify: `README.md`
- Test: Full Vitest suite (`npm.cmd test`)
- Compile: `npx.cmd tsc -b`
- Build: `npx.cmd vite build`

- [x] **Step 1: Update README.md documentation**

Update `README.md` section on Dosing and Plans to document that the Dosing calculator provides both Adult and Pediatric modes with strict TBW scalars, age-bracket auto-matching, adult single-dose caps, and safe dilution presets.

- [x] **Step 2: Run full test suite, type-check, and build**

Run:
```powershell
npm.cmd test
npx.cmd tsc -b
npx.cmd vite build
```
Verify: 100% tests pass, 0 compile errors, clean PWA production bundle generated.

- [x] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: document pediatric perioperative dosing and dilution engine"
```
