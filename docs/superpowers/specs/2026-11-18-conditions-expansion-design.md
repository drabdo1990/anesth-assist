# Conditions Expansion: Perioperative Disease Management Plans Design Spec

- **Date:** 2026-11-18
- **Status:** Approved in brainstorming, awaiting review of this written spec
- **Scope:** Expand the Diseases tab in `anesth-helper` from 6 core planned conditions to full, structured perioperative management plans across all 71 conditions currently stubbed from *Stoelting's Anesthesia and Co-Existing Disease* (8th Edition, 2022).
- **Source:** Grounded on the verified NotebookLM Stoelting 8e notebook (`https://notebooklm.google.com/notebook/1ce36864-79d5-4dbc-b3fa-51b63c6a401f`).

---

## 1. Intent & Clinical Context

### Audience
Anesthesiologists, anesthesia residents, nurse anesthetists, and perioperative care teams seeking rapid, evidence-grounded perioperative management guidance for uncommon comorbidities and rare diseases at the point of care.

### Goal
Populate comprehensive, high-yield, and evidence-based perioperative management plans (`preop`, `intraop`, `avoid`, `postop`) for the remaining 65 condition records in `anesth-helper`, faithfully representing Stoelting 8e while maintaining clean modular code architecture and zero-PHI offline operation.

### Success Criteria
1. Every condition plan is grounded directly in Stoelting's 8th edition via NotebookLM queries; zero hallucinations or unsourced clinical statements.
2. `src/data/conditions.ts` remains 100% backward compatible for all existing consumers (`ConditionsView.tsx`, `conditionSearch.ts`, `derived.ts`, and test suites).
3. The underlying data is decomposed into maintainable organ-system modules under `src/data/conditions/` rather than a monolithic 3,000-line file.
4. `npm.cmd test`, `npx.cmd tsc -b`, and `npx.cmd vite build` pass cleanly at every stage.
5. All clinical safety invariants (e.g. no conflicting hardcoded `mg/kg` crisis doses, crisis panel linkage) are strictly preserved.

---

## 2. Architecture & File Structure

To prevent `src/data/conditions.ts` from becoming an unmanageable monolithic file, the comorbidity database is organized into clean, domain-specific modules by organ system:

```
src/data/conditions/
  ├── types.ts              // ConditionRecord, ConditionPlan, STOELTING_CHAPTERS, entry() helper
  ├── plannedIds.ts         // PLANNED_CONDITION_IDS array tracking conditions with written plans
  ├── cardiovascular.ts     // Congenital, conduction/arrhythmias, cardiomyopathies, vascular (Ch. 7, 8, 10, 12)
  ├── respiratory.ts        // Obstructive, restrictive, transplantation (Ch. 2, 3)
  ├── neurologic.ts         // Brain, spine/spinal cord, autonomic & peripheral nervous systems (Ch. 13, 14, 15)
  ├── endocrine.ts          // Endocrine diseases & inborn errors of metabolism (Ch. 18, 22)
  ├── hematologic.ts        // Hematologic disorders & oncologic disease (Ch. 23, 27)
  ├── multisystem.ts        // Liver, GI, renal, collagen, immune, pediatric, psychiatric (Ch. 16, 17, 21, 24, 26, 29, 31)
  └── index.ts              // Merges all specialty lists into CONDITIONS, re-exports types and constants
```

### Backward Compatibility Facade
`src/data/conditions.ts` is preserved as a transparent re-export:
```typescript
export * from './conditions/index';
```
Existing consumers continue to import from `../data/conditions` without any modifications:
- `src/views/ConditionsView.tsx`
- `src/lib/conditionSearch.ts`
- `src/data/derived.ts`
- `src/data/__tests__/conditions.test.ts`
- `src/lib/__tests__/conditionSearch.test.ts`

---

## 3. Data Schema & Clinical Content Standards

### Data Model
```typescript
export interface ConditionPlan {
  preop: string[];   // Preoperative assessment, risk stratification, diagnostic workup, med management
  intraop: string[]; // Hemodynamic goals, monitor selection, induction/maintenance agents, ventilation
  avoid: string[];   // Contraindicated drugs, high-risk interactions, detrimental physiological triggers
  postop: string[];  // Extubation criteria, ICU/telemetry requirements, postop pain, complications
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
```

### Clinical Safety & Content Invariants
1. **No Duplicate Emergency `mg/kg` Dosing**:
   - Condition plans state drug classes, mechanisms, target hemodynamic endpoints, and titration goals.
   - Plans **must not** contain hardcoded `mg/kg` crisis drug dosing (enforced by `expect(JSON.stringify(plan(id)), id).not.toMatch(/mg\/kg/)`), ensuring the dedicated Drug Calculators and Crisis SOS panels remain the sole authoritative source of weight-based emergency dosing.
2. **Crisis SOS Linkage**:
   - Malignant Hyperthermia Susceptibility retains `crisis: 'mh'` linking directly to the red emergency SOS panel.
3. **Substantive Content Invariant**:
   - Every section (`preop`, `intraop`, `avoid`, `postop`) must contain at least 1 clinical directive.
   - Every individual bullet string must exceed 10 characters and provide actionable clinical guidance.
4. **Source Registration & Integrity**:
   - Every record carries `sourceIds: ['stoelting-8e']`.
   - Every condition with an active `plan` is registered in `PLANNED_CONDITION_IDS`, ensuring automatic inclusion in `derivedValuesBySource()` and passing `integrity.test.ts`.

---

## 4. Phased Implementation Roadmap

### Phase 1: Structural Refactor & Foundation
- Scaffold `src/data/conditions/` directory (`types.ts`, `plannedIds.ts`, module files, `index.ts`).
- Migrate existing 6 core planned conditions into their specialty modules:
  - `mh-susceptibility` → `multisystem.ts` (or `neurologic.ts`)
  - `acute-porphyria` → `endocrine.ts`
  - `myasthenia-gravis` → `neurologic.ts`
  - `myotonic-dystrophy` → `neurologic.ts`
  - `pheochromocytoma` → `endocrine.ts`
  - `carcinoid-syndrome` → `endocrine.ts`
- Convert `src/data/conditions.ts` into the re-export facade.
- Run tests (`npm.cmd test`, `npx.cmd tsc -b`, `npx.cmd vite build`) to establish a zero-regression baseline.

### Phase 2: Batch 1 — Cardiovascular & Congenital (Chapters 7, 8, 10, 12)
- Query NotebookLM Stoelting 8e notebook for perioperative management.
- Populate plans for ~14 conditions, including:
  - `tetralogy-of-fallot`
  - `eisenmenger-syndrome`
  - `wolff-parkinson-white`
  - `long-qt-syndrome`
  - `brugada-syndrome`
  - `takotsubo-cardiomyopathy`
  - `hypertrophic-cardiomyopathy`
  - `coarctation-of-aorta`
  - `transposition-of-great-arteries`
  - `cardiac-tamponade`
  - `aortic-stenosis` / `aortic-regurgitation` / `mitral-stenosis` / `mitral-regurgitation`
- Update `PLANNED_CONDITION_IDS` and verify tests pass.

### Phase 3: Batch 2 — Respiratory & Airway (Chapters 2, 3)
- Query NotebookLM for:
  - `cystic-fibrosis`
  - `sarcoidosis`
  - `scoliosis-restrictive-lung-disease`
  - `bronchiectasis`
  - `pulmonary-hypertension`
  - `obstructive-sleep-apnea`
  - `lung-transplantation`
- Update `PLANNED_CONDITION_IDS` and verify tests pass.

### Phase 4: Batch 3 — Neurologic & Neuromuscular (Chapters 13, 14, 15)
- Query NotebookLM for:
  - `amyotrophic-lateral-sclerosis`
  - `guillain-barre-syndrome`
  - `lambert-eaton-myasthenic-syndrome`
  - `multiple-sclerosis`
  - `autonomic-hyperreflexia`
  - `parkinson-disease`
  - `huntington-disease`
  - `intracranial-hypertension`
  - `spinal-cord-injury-acute`
- Update `PLANNED_CONDITION_IDS` and verify tests pass.

### Phase 5: Batch 4 — Endocrine & Metabolic (Chapters 18, 22)
- Query NotebookLM for:
  - `cushing-syndrome`
  - `acromegaly`
  - `primary-hyperaldosteronism` (Conn)
  - `diabetes-insipidus`
  - `siadh`
  - `hyperparathyroidism`
  - `hypothyroidism-myxedema`
  - `thyroid-storm`
  - `diabetic-ketoacidosis`
- Update `PLANNED_CONDITION_IDS` and verify tests pass.

### Phase 6: Batch 5 — Hematologic & Oncologic (Chapters 23, 27)
- Query NotebookLM for:
  - `sickle-cell-disease`
  - `g6pd-deficiency`
  - `von-willebrand-disease`
  - `hemophilia-a`
  - `hemophilia-b`
  - `heparin-induced-thrombocytopenia`
  - `immune-thrombocytopenic-purpura`
  - `polycythemia-vera`
- Update `PLANNED_CONDITION_IDS` and verify tests pass.

### Phase 7: Batch 6 — Multisystem: Renal, Hepatic, Connective Tissue & Misc (Chapters 16, 17, 21, 24, 26, 29, 31)
- Query NotebookLM for:
  - `systemic-sclerosis` (Scleroderma)
  - `marfan-syndrome`
  - `ehlers-danlos-syndrome`
  - `ankylosing-spondylitis`
  - `end-stage-renal-disease`
  - `cirrhosis-portal-hypertension`
  - `systemic-lupus-erythematosus`
  - `rheumatoid-arthritis`
- Update `PLANNED_CONDITION_IDS` and run full regression suite.

---

## 5. Verification & Testing Matrix

For every phase:
1. **Unit Testing (`npm.cmd test`)**:
   - `conditions.test.ts`: Verifies unique IDs/names, 110 total condition count, valid chapter references, presence of all 4 plan sections, >10 char bullets, no `mg/kg` crisis dose patterns, and exact match with `PLANNED_CONDITION_IDS`.
   - `integrity.test.ts`: Verifies all condition records and derived values resolve to `stoelting-8e` in `sources.ts`.
   - `conditionSearch.test.ts`: Verifies fuzzy search across names, aliases, and comorbidity queries.
2. **Type Checking (`npx.cmd tsc -b`)**:
   - Zero TypeScript compiler diagnostics, strict type safety across all imported condition arrays.
3. **Production Build (`npx.cmd vite build`)**:
   - Asset bundling and tree-shaking verification.
4. **UI Validation**:
   - Start local dev server (`npm.cmd run dev`), inspect Diseases tab in browser to verify plan cards render cleanly with preop, intraop, avoid, postop sections and links.
