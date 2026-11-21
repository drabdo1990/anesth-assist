# Perioperative Disease Management Plans Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Expand AnesthAssist's Diseases comorbidity database from 6 core planned conditions to full, structured perioperative management plans (`preop`, `intraop`, `avoid`, `postop`) across all 71 conditions stubbed from *Stoelting's Anesthesia and Co-Existing Disease* (8th Edition, 2022).

**Architecture:** Decompose the conditions database into clean, domain-specific TypeScript modules under `src/data/conditions/` organized by organ system, merged via `index.ts`, and re-exported through a backward-compatible facade in `src/data/conditions.ts`. Extract clinical plans via authenticated NotebookLM MCP session grounded on Stoelting 8e.

**Tech Stack:** TypeScript, React 19, Vite 6, Vitest, NotebookLM MCP.

**Spec:** [docs/superpowers/specs/2026-11-18-conditions-expansion-design.md](file:///e:/coding-agents-files/antigravity/anesth-helper/docs/superpowers/specs/2026-11-18-conditions-expansion-design.md)

---

## Global Constraints

- Sourced strictly from Stoelting 8e via NotebookLM (`https://notebooklm.google.com/notebook/1ce36864-79d5-4dbc-b3fa-51b63c6a401f`); zero unsourced clinical statements.
- `src/data/conditions.ts` must maintain 100% backward compatibility for existing consumers (`ConditionsView.tsx`, `conditionSearch.ts`, `derived.ts`, and test suites).
- Every condition record must maintain `sourceIds: ['stoelting-8e']` resolving in `sources.ts`.
- Every plan must carry all 4 sections: `preop`, `intraop`, `avoid`, and `postop`. Each section must have ≥1 bullet, and each bullet string must be >10 characters.
- Invariant: Condition plans describe drug selection and target clinical endpoints, but **must never** contain hardcoded `mg/kg` crisis drug doses (enforced by `conditions.test.ts`), keeping drug calculators and crisis SOS panels authoritative.
- Malignant Hyperthermia Susceptibility retains `crisis: 'mh'`.
- All Windows PowerShell test commands must be run as: `npm.cmd test`, `npx.cmd tsc -b`, `npx.cmd vite build`.
- Git write operations on Windows must be run with `BypassSandbox: true` to prevent `.git/index.lock` permission failures.

## Review Focus

1. **Total condition count invariant**: Exactly 110 total condition records must remain present in `CONDITIONS` array across all modules; no existing condition stub may be dropped.
2. **Planned ID synchronization**: Every condition record with a populated `plan` must have its ID registered in `PLANNED_CONDITION_IDS`; test `conditions.test.ts` fails if any planned condition is unlisted or vice versa.
3. **No `mg/kg` crisis dosing**: Condition plans must not contain `/mg\/kg/` dosing regex matches.
4. **Search aliases consistency**: All aliases must be lowercase strings without duplicate values within any single record.
5. **Chapter resolution**: Every condition must reference a valid numeric chapter existing in `STOELTING_CHAPTERS`.

---

## Tasks

### Task 1: Modular Foundation & Migration of Core 6 Conditions

**Files:**
- Create: `src/data/conditions/types.ts`
- Create: `src/data/conditions/plannedIds.ts`
- Create: `src/data/conditions/cardiovascular.ts`
- Create: `src/data/conditions/respiratory.ts`
- Create: `src/data/conditions/neurologic.ts`
- Create: `src/data/conditions/endocrine.ts`
- Create: `src/data/conditions/hematologic.ts`
- Create: `src/data/conditions/multisystem.ts`
- Create: `src/data/conditions/index.ts`
- Modify: `src/data/conditions.ts`

**Interfaces:**
- Consumes: `STOELTING_CHAPTERS`, `ConditionRecord`, `ConditionPlan` from existing `src/data/conditions.ts`.
- Produces: `src/data/conditions/types.ts` exporting interfaces & helpers; `src/data/conditions/index.ts` exporting `CONDITIONS`, `PLANNED_CONDITION_IDS`, `STOELTING_CHAPTERS`, `PROJECT_NOTEBOOK_URL`.

- [x] **Step 1: Create `src/data/conditions/types.ts`**
Extract `ConditionPlan`, `ConditionRecord`, `STOELTING_CHAPTERS`, `PROJECT_NOTEBOOK_URL`, and helper `entry()`:
```typescript
export interface ConditionPlan {
  preop: string[];
  intraop: string[];
  avoid: string[];
  postop: string[];
}

export interface ConditionRecord {
  id: string;
  name: string;
  aliases: string[];
  chapter: number;
  plan?: ConditionPlan;
  crisis?: 'mh';
  sourceIds: string[];
}

export const STOELTING_CHAPTERS: Record<number, string> = { /* existing 20 chapters */ };
export const PROJECT_NOTEBOOK_URL = 'https://notebooklm.google.com/notebook/1ce36864-79d5-4dbc-b3fa-51b63c6a401f';

export function entry(id: string, name: string, chapter: number, aliases: string[] = [], plan?: ConditionPlan, crisis?: 'mh'): ConditionRecord {
  return { id, name, aliases, chapter, plan, crisis, sourceIds: ['stoelting-8e'] };
}
```

- [x] **Step 2: Create `src/data/conditions/plannedIds.ts`**
Initialize with the current 6 planned condition IDs:
```typescript
export const PLANNED_CONDITION_IDS: string[] = [
  'mh-susceptibility',
  'acute-porphyria',
  'myasthenia-gravis',
  'myotonic-dystrophy',
  'pheochromocytoma',
  'carcinoid-syndrome',
];
```

- [x] **Step 3: Create specialty files partitioning existing 110 condition records**
- `cardiovascular.ts`: Ch. 7, 8, 10, 12 conditions.
- `respiratory.ts`: Ch. 2, 3 conditions.
- `neurologic.ts`: Ch. 13, 14, 15 conditions (including existing plans for `myasthenia-gravis` and `myotonic-dystrophy`).
- `endocrine.ts`: Ch. 18, 22 conditions (including existing plans for `acute-porphyria`, `pheochromocytoma`, and `carcinoid-syndrome`).
- `hematologic.ts`: Ch. 23, 27 conditions.
- `multisystem.ts`: Ch. 16, 17, 21, 24, 26, 29, 31 conditions (including existing plan for `mh-susceptibility`).

- [x] **Step 4: Create `src/data/conditions/index.ts`**
Aggregate records from all specialty modules into `CONDITIONS: ConditionRecord[]`.

- [x] **Step 5: Replace `src/data/conditions.ts` with re-export facade**
```typescript
export * from './conditions/index';
```

- [x] **Step 6: Run test suite to verify 100% backward compatibility**
Run: `npm.cmd test`
Expected: 433 tests in 38 files pass.
Run: `npx.cmd tsc -b`
Expected: 0 errors.

- [x] **Step 7: Commit**
```bash
git add src/data/conditions/ src/data/conditions.ts
git commit -m "refactor(conditions): modularize conditions database into organ-system modules"
```

---

### Task 2: Batch 1 — Cardiovascular & Congenital Conditions Plans

**Files:**
- Modify: `src/data/conditions/cardiovascular.ts`
- Modify: `src/data/conditions/plannedIds.ts`

**Interfaces:**
- Consumes: `entry()` from `types.ts`, NotebookLM Stoelting 8e queries (Ch. 7, 8, 10, 12).
- Produces: Updated condition records with full `ConditionPlan` objects.

- [x] **Step 1: Populate clinical plans for cardiovascular conditions**
Query NotebookLM session `58a46bdf` for Stoelting 8e perioperative guidance and populate plans for:
1. `tetralogy-of-fallot` (Ch. 7)
2. `eisenmenger-syndrome` (Ch. 7)
3. `transposition-of-great-arteries` (Ch. 7)
4. `coarctation-of-aorta` (Ch. 7)
5. `wolff-parkinson-white` (Ch. 8)
6. `long-qt-syndrome` (Ch. 8)
7. `brugada-syndrome` (Ch. 8)
8. `hypertrophic-cardiomyopathy` (Ch. 10)
9. `takotsubo-cardiomyopathy` (Ch. 10)
10. `cardiac-tamponade` (Ch. 10)
11. `aortic-stenosis` (Ch. 10)
12. `aortic-regurgitation` (Ch. 10)
13. `mitral-stenosis` (Ch. 10)
14. `mitral-regurgitation` (Ch. 10)

- [x] **Step 2: Update `PLANNED_CONDITION_IDS` in `src/data/conditions/plannedIds.ts`**
Add the 14 cardiovascular condition IDs.

- [x] **Step 3: Run tests to verify clinical invariants**
Run: `npm.cmd test`
Verify `conditions.test.ts` validates all sections (>10 chars, no `mg/kg`, unique IDs).
Run: `npx.cmd tsc -b`

- [x] **Step 4: Commit**
```bash
git add src/data/conditions/cardiovascular.ts src/data/conditions/plannedIds.ts
git commit -m "feat(conditions): add perioperative plans for cardiovascular conditions"
```

---

### Task 3: Batch 2 — Respiratory & Airway Conditions Plans

**Files:**
- Modify: `src/data/conditions/respiratory.ts`
- Modify: `src/data/conditions/plannedIds.ts`

**Interfaces:**
- Consumes: NotebookLM Stoelting 8e queries (Ch. 2, 3).
- Produces: Updated condition records with full `ConditionPlan` objects.

- [x] **Step 1: Populate clinical plans for respiratory conditions**
Query NotebookLM for Stoelting 8e perioperative guidance and populate plans for:
1. `cystic-fibrosis` (Ch. 2)
2. `bronchiectasis` (Ch. 2)
3. `sarcoidosis` (Ch. 3)
4. `scoliosis-restrictive-lung-disease` (Ch. 3)
5. `pulmonary-hypertension` (Ch. 3)
6. `cor-pulmonale` (Ch. 3)
7. `obstructive-sleep-apnea` (Ch. 2)
8. `lung-transplantation` (Ch. 3)

- [x] **Step 2: Update `PLANNED_CONDITION_IDS`**
Add the respiratory condition IDs to `src/data/conditions/plannedIds.ts`.

- [x] **Step 3: Run tests**
Run: `npm.cmd test` && `npx.cmd tsc -b`
Expected: PASS.

- [x] **Step 4: Commit**
```bash
git add src/data/conditions/respiratory.ts src/data/conditions/plannedIds.ts
git commit -m "feat(conditions): add perioperative plans for respiratory conditions"
```

---

### Task 4: Batch 3 — Neurologic & Neuromuscular Conditions Plans

**Files:**
- Modify: `src/data/conditions/neurologic.ts`
- Modify: `src/data/conditions/plannedIds.ts`

**Interfaces:**
- Consumes: NotebookLM Stoelting 8e queries (Ch. 13, 14, 15).
- Produces: Updated condition records with full `ConditionPlan` objects.

- [x] **Step 1: Populate clinical plans for neurologic conditions**
Query NotebookLM for Stoelting 8e perioperative guidance and populate plans for:
1. `amyotrophic-lateral-sclerosis` (Ch. 14)
2. `guillain-barre-syndrome` (Ch. 15)
3. `lambert-eaton-myasthenic-syndrome` (Ch. 15)
4. `multiple-sclerosis` (Ch. 13)
5. `autonomic-hyperreflexia` (Ch. 14)
6. `parkinson-disease` (Ch. 13)
7. `huntington-disease` (Ch. 13)
8. `intracranial-hypertension` (Ch. 13)
9. `spinal-cord-injury-acute` (Ch. 14)
10. `muscular-dystrophy-duchenne` (Ch. 15)

- [x] **Step 2: Update `PLANNED_CONDITION_IDS`**
Add the neurologic condition IDs to `src/data/conditions/plannedIds.ts`.

- [x] **Step 3: Run tests**
Run: `npm.cmd test` && `npx.cmd tsc -b`
Expected: PASS.

- [x] **Step 4: Commit**
```bash
git add src/data/conditions/neurologic.ts src/data/conditions/plannedIds.ts
git commit -m "feat(conditions): add perioperative plans for neurologic conditions"
```

---

### Task 5: Batch 4 — Endocrine & Metabolic Conditions Plans

**Files:**
- Modify: `src/data/conditions/endocrine.ts`
- Modify: `src/data/conditions/plannedIds.ts`

**Interfaces:**
- Consumes: NotebookLM Stoelting 8e queries (Ch. 18, 22).
- Produces: Updated condition records with full `ConditionPlan` objects.

- [x] **Step 1: Populate clinical plans for endocrine conditions**
Query NotebookLM for Stoelting 8e perioperative guidance and populate plans for:
1. `cushing-syndrome` (Ch. 22)
2. `acromegaly` (Ch. 22)
3. `primary-hyperaldosteronism` (Ch. 22)
4. `diabetes-insipidus` (Ch. 22)
5. `siadh` (Ch. 22)
6. `hyperparathyroidism` (Ch. 22)
7. `hypothyroidism-myxedema` (Ch. 22)
8. `thyroid-storm` (Ch. 22)
9. `diabetic-ketoacidosis` (Ch. 22)
10. `hypopituitarism` (Ch. 22)
11. `addison-disease` (Ch. 22)

- [x] **Step 2: Update `PLANNED_CONDITION_IDS`**
Add the endocrine condition IDs to `src/data/conditions/plannedIds.ts`.

- [x] **Step 3: Run tests**
Run: `npm.cmd test` && `npx.cmd tsc -b`
Expected: PASS.

- [x] **Step 4: Commit**
```bash
git add src/data/conditions/endocrine.ts src/data/conditions/plannedIds.ts
git commit -m "feat(conditions): add perioperative plans for endocrine conditions"
```

---

### Task 6: Batch 5 — Hematologic & Oncologic Conditions Plans

**Files:**
- Modify: `src/data/conditions/hematologic.ts`
- Modify: `src/data/conditions/plannedIds.ts`

**Interfaces:**
- Consumes: NotebookLM Stoelting 8e queries (Ch. 23, 27).
- Produces: Updated condition records with full `ConditionPlan` objects.

- [x] **Step 1: Populate clinical plans for hematologic & oncologic conditions**
Query NotebookLM for Stoelting 8e perioperative guidance and populate plans for:
1. `sickle-cell-disease` (Ch. 23)
2. `g6pd-deficiency` (Ch. 23)
3. `von-willebrand-disease` (Ch. 23)
4. `hemophilia-a` (Ch. 23)
5. `hemophilia-b` (Ch. 23)
6. `heparin-induced-thrombocytopenia` (Ch. 23)
7. `immune-thrombocytopenic-purpura` (Ch. 23)
8. `polycythemia-vera` (Ch. 23)
9. `multiple-myeloma` (Ch. 23)
10. `superior-vena-cava-syndrome` (Ch. 27)

- [x] **Step 2: Update `PLANNED_CONDITION_IDS`**
Add the hematologic condition IDs to `src/data/conditions/plannedIds.ts`.

- [x] **Step 3: Run tests**
Run: `npm.cmd test` && `npx.cmd tsc -b`
Expected: PASS.

- [x] **Step 4: Commit**
```bash
git add src/data/conditions/hematologic.ts src/data/conditions/plannedIds.ts
git commit -m "feat(conditions): add perioperative plans for hematologic conditions"
```

---

### Task 7: Batch 6 — Multisystem Conditions Plans

**Files:**
- Modify: `src/data/conditions/multisystem.ts`
- Modify: `src/data/conditions/plannedIds.ts`

**Interfaces:**
- Consumes: NotebookLM Stoelting 8e queries (Ch. 16, 17, 21, 24, 26, 29, 31).
- Produces: Updated condition records with full `ConditionPlan` objects.

- [x] **Step 1: Populate clinical plans for multisystem conditions**
Query NotebookLM for Stoelting 8e perioperative guidance and populate plans for:
1. `systemic-sclerosis` (Ch. 24)
2. `marfan-syndrome` (Ch. 24)
3. `ehlers-danlos-syndrome` (Ch. 24)
4. `ankylosing-spondylitis` (Ch. 24)
5. `end-stage-renal-disease` (Ch. 21)
6. `cirrhosis-portal-hypertension` (Ch. 16)
7. `systemic-lupus-erythematosus` (Ch. 26)
8. `rheumatoid-arthritis` (Ch. 26)
9. `morbid-obesity` (Ch. 17)
10. `anorexia-nervosa` (Ch. 29)
11. `mastocytosis` (Ch. 24)

- [x] **Step 2: Update `PLANNED_CONDITION_IDS`**
Add the multisystem condition IDs to `src/data/conditions/plannedIds.ts`.

- [x] **Step 3: Run tests**
Run: `npm.cmd test` && `npx.cmd tsc -b`
Expected: PASS.

- [x] **Step 4: Commit**
```bash
git add src/data/conditions/multisystem.ts src/data/conditions/plannedIds.ts
git commit -m "feat(conditions): add perioperative plans for multisystem conditions"
```

---

### Task 8: End-to-End Verification & Documentation

**Files:**
- Test: `src/data/__tests__/conditions.test.ts`
- Test: `src/data/__tests__/integrity.test.ts`
- Modify: `README.md` (or docs if recording expansion milestones)

- [x] **Step 1: Run full test suite & production build**
Run: `npm.cmd test`
Verify: All 71 planned conditions are validated, derived values resolve to `stoelting-8e`, 0 failures.
Run: `npx.cmd tsc -b`
Verify: Clean compile.
Run: `npx.cmd vite build`
Verify: Clean bundle.

- [x] **Step 2: Commit final verification**
```bash
git add README.md
git commit -m "docs: record completion of 71 Stoelting 8e perioperative disease management plans"
```
