# Fix Bugs and Caveats Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolve technical, UI, state persistence, and clinical calculation edge cases across AnesthAssist (UTF-16 README corruption, handoff input length validation, Zustand local storage reset, weight-banded drug dose visibility, and pediatric/short-stature PBW ventilation gating).

**Architecture:** 
1. Re-encode `README.md` as clean UTF-8 text so it is recognized as markdown by git and viewers.
2. Align UI `maxLength` with validator constraints in `ChecklistsView.tsx`.
3. Use Zustand's native `persist.clearStorage()` API in `SettingsSheet.tsx` for reliable storage wipes.
4. Update `DrugCard.tsx` dose filtering logic so weight-banded indications remain visible with informative prompts when weight is null.
5. Enhance `BiometricHeader.tsx` and `VentilationView.tsx` with robust pediatric/short-stature gating (< 152.4 cm) preventing misleading adult tidal volumes for pediatric patients.

**Tech Stack:** React 19, TypeScript 5.7, Zustand 5, Vitest 3.2, Tailwind CSS 3.4

---

## Global Constraints
- All existing 140 Vitest unit tests must continue to pass.
- Maintain strict type checking (`tsc -b`).
- Preserve zero-PHI persistence rules: no patient biometric or session data in `localStorage`.
- All clinical calculations must remain unrounded internally; rounding only for display.

---

## Review Focus
1. `README.md` byte encoding (must be UTF-8 without BOM, zero null bytes).
2. Handoff `FreeText` input (must strictly prevent entering more than 60 characters).
3. Zustand `clearStorage` (must clear `anesthassist-storage` without re-persisting on reload).
4. Cefazolin & weight-banded drugs (must display primary indications when weight is null with a prompt to enter weight).
5. Pediatric & short-stature ventilation (< 152.4 cm) (must warn and suppress/flag adult PBW tidal volume).

---

### Task 1: Fix `README.md` Encoding (UTF-16LE to UTF-8)

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Convert `README.md` from UTF-16LE to standard UTF-8**
Read the Little-Endian UTF-16 content and rewrite it with UTF-8 encoding without BOM.

- [ ] **Step 2: Verify git recognizes `README.md` as text**
Run: `git diff --stat README.md`
Expected: Line additions/deletions, NOT `Bin -> bytes`.

- [ ] **Step 3: Commit**
Run:
```bash
git add README.md
git commit -m "fix(docs): re-encode README.md as UTF-8"
```

---

### Task 2: Align Handoff Input MaxLength with Validator

**Files:**
- Modify: `src/views/ChecklistsView.tsx:61-68`
- Test: `src/lib/__tests__/handoff.test.ts`

**Interfaces:**
- Consumes: `MAX_FREE_TEXT_LENGTH = 60` from `src/lib/handoff.ts`
- Produces: `FreeText` component enforcing `maxLength={MAX_FREE_TEXT_LENGTH}`

- [ ] **Step 1: Write test in `handoff.test.ts` checking boundary of MAX_FREE_TEXT_LENGTH**
Verify `scrubFreeText` boundary condition at 60 characters and 61 characters.

- [ ] **Step 2: Update `FreeText` in `ChecklistsView.tsx`**
Change `maxLength={MAX_FREE_TEXT_LENGTH + 20}` to `maxLength={MAX_FREE_TEXT_LENGTH}` so users cannot type beyond the allowed limit.

- [ ] **Step 3: Run Vitest**
Run: `npm test`
Expected: All tests pass.

- [ ] **Step 4: Commit**
```bash
git add src/views/ChecklistsView.tsx src/lib/__tests__/handoff.test.ts
git commit -m "fix(handoff): cap FreeText input at MAX_FREE_TEXT_LENGTH"
```

---

### Task 3: Reliable Zustand Storage Reset

**Files:**
- Modify: `src/components/SettingsSheet.tsx:35-43`

- [ ] **Step 1: Update `clearSaved` in `SettingsSheet.tsx`**
Call `useAppStore.persist.clearStorage()` before clearing `localStorage` and reloading, and invoke `useAppStore.getState().newCase()`.

- [ ] **Step 2: Verify build and test**
Run: `npm test && npm run build`
Expected: Passes cleanly.

- [ ] **Step 3: Commit**
```bash
git add src/components/SettingsSheet.tsx
git commit -m "fix(storage): use persist.clearStorage for reliable reset"
```

---

### Task 4: Fix Weight-Banded Medication Display When Weight Is Null

**Files:**
- Modify: `src/components/DrugCard.tsx:66-86`
- Test: `src/lib/calc/__tests__/medication.test.ts`

- [ ] **Step 1: Write unit test in `medication.test.ts` for dose visibility with null weight**
Verify behavior of medication dose filtering when weight is null vs populated.

- [ ] **Step 2: Update `DrugCard.tsx` applicable dose selection**
When `tbw === null`, do not filter out doses that have `weightBandKg`. Instead, include all doses and when a weight-banded dose is selected without a patient weight, display an info banner indicating actual weight is needed to calculate this dose.

- [ ] **Step 3: Run Vitest**
Run: `npm test`
Expected: Passes cleanly.

- [ ] **Step 4: Commit**
```bash
git add src/components/DrugCard.tsx src/lib/calc/__tests__/medication.test.ts
git commit -m "fix(dosing): retain weight-banded dose visibility when weight is unset"
```

---

### Task 5: Pediatric & Short-Stature Devine PBW Ventilation Gating

**Files:**
- Modify: `src/components/BiometricHeader.tsx:158-165`
- Modify: `src/views/VentilationView.tsx:80-96, 129-134, 158-173`
- Test: `src/lib/calc/__tests__/calc.test.ts`

- [ ] **Step 1: Write tests in `calc.test.ts` for Devine floor detection**
Verify height < 152.4 cm warning flags and PBW validity checks.

- [ ] **Step 2: Update `BiometricHeader.tsx` warning banner**
Display a warning when `patient.heightCm !== null && patient.heightCm < 152.4` informing that the Devine IBW/PBW formula hit its 5-foot floor and is not validated for patients under 152.4 cm or children.

- [ ] **Step 3: Update `VentilationView.tsx` tidal volume display**
When `pediatric || scenario.id === 'pediatric' || (patient.heightCm !== null && patient.heightCm < 152.4)`, flag the tidal volume calculation with a red warning banner indicating Devine PBW is invalid for this patient height/age, and prevent displaying an uncapped adult tidal volume as normal.

- [ ] **Step 4: Run Vitest and type-check**
Run: `npm test && npm run build`
Expected: All 140+ tests pass with zero type errors.

- [ ] **Step 5: Commit**
```bash
git add src/components/BiometricHeader.tsx src/views/VentilationView.tsx src/lib/calc/__tests__/calc.test.ts
git commit -m "fix(ventilation): gate Devine PBW tidal volume for pediatric and short stature"
```
