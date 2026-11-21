# Pre-op Assess: Risk Scores and CrCl Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an Assess section to the Pre-op tab with serum creatinine entry (mg/dL or µmol/L), Cockcroft-Gault creatinine clearance, the Revised Cardiac Risk Index and the STOP-Bang sleep apnea screen. Every value is sourced, and missing input reads "incomplete", never a default.

**Architecture:** Pure calculation modules (`units.ts`, `crcl.ts`, `scores.ts`) take plain inputs and return results or "incomplete". Score definitions are data in `src/data/riskScores.ts` and cite `sources.ts`. The store holds creatinine and the score answers in memory only. One reusable `ScorePanel` renders any score. The biometric header now also shows on Pre-op, because every score reads age, sex and BMI.

**Tech Stack:** React 19, Zustand 5, Tailwind 3, Vitest 4. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-11-17-perioperative-guide-design.md` (rollout step 2, trimmed; Task 4 records the trim and the reasons).

## Scope decisions (read first)

**In this plan:** serum creatinine + unit toggle, Cockcroft-Gault CrCl, RCRI, STOP-Bang, biometric header on Pre-op.

**Deliberately left out, with reasons:**
- **DASI, ARISCAT, Clinical Frailty Scale.** Each needs a weight table or scale text that has not been read from the paper yet, and CFS needs a later source for its current 9-point version and its threshold. They follow as step 2b once their texts are read, the same way RCRI was verified here.
- **ASA class picker and surgical-risk grade.** No ASA source is registered, and nothing reads them until the pre-op note (step 6).
- **CrCl bands.** Only the med rules in step 3 consume them, and they come from ASRA and the drug labels. Step 2 shows the number.
- **Glucose and Hb units.** Nothing reads them yet. Only creatinine has a unit toggle.
- **A `points` field on score items.** RCRI and STOP-Bang are one point per item. Add `points` with the first weighted score (ARISCAT).

**What was verified (2026-11-17):**
- **RCRI: read from the paper's full text** (open eScholarship copy). Items, definitions, the "intraperitoneal, intrathoracic, or suprainguinal vascular" surgery definition, and Table 3 rates. Validation cohort (n=1422): 0.4%, 0.9%, **6.6%**, 11.0% for 0, 1, 2, ≥3 factors. Derivation cohort (n=2893): 0.5%, 1.3%, 3.6%, 9.1%. The abstract rounds the two-factor figures to 7% and 4%.
- **Cockcroft-Gault citation:** confirmed by web search (Nephron 1976;16:31-41, doi 10.1159/000180580). The SI constants (1.23 men, 1.04 women, creatinine in µmol/L) and "actual body weight in the DOAC trials and the US rivaroxaban label" come from secondary summaries. The paper and the label were not opened.
- **STOP-Bang bands (0-2, 3-4, 5-8), the item list and the 40 cm neck threshold:** confirmed from the Chung 2016 citation and secondary excerpts. The paper's full text was not opened. The item wording is the standard questionnaire wording.

## Global Constraints

- Offline-first PWA. No clinical network calls. No new dependencies.
- Patient inputs, including serum creatinine and score answers, stay in memory only. Only the creatinine **unit** is persisted, as a preference.
- Every clinical record cites `sourceIds` that exist in `src/data/sources.ts`. A missing value shows "incomplete" or `NO_SOURCE_VALUE`, never a default.
- All calculations use SI internally: creatinine in µmol/L. The unit setting changes only what the user types and reads.
- Touch targets at least 48 px (`min-h-[48px]`). Tailwind 3. Literal class strings only.
- Bump `DATA_VERSION` in `sources.ts` in every task that changes a data file.
- Run only the affected test file first, then the full suite before finishing.
- **Tasks must run in order (1, 2, 3, 4).** Tasks 1 and 2 both edit `sources.ts`, `derived.ts` and `DATA_VERSION`, so running them in parallel would conflict.

## Review Focus

- **Creatinine of exactly 2.0 mg/dL must not count as "above 2.0".** A float slip would add a point. Task 2 pins 2.0 and 2.1.
- **Switching the unit must not change the stored value.** The value is stored in µmol/L. Task 1 tests the round trip, and Task 3 checks it by hand.
- **An under-18 patient must never get a CrCl number.** Task 1 pins it.
- **Creatinine of zero or less must not divide by zero or show a huge clearance.** Task 1 pins it.
- **A score with a missing derived input must read "incomplete", never "Low risk".** For example STOP-Bang with no age, sex or BMI entered. Task 2 pins it.
- **New case must clear creatinine and answers, and neither may reach localStorage.** Task 3 pins it.

---

### Task 1: Units and creatinine clearance

**Files:**
- Create: `src/lib/calc/units.ts`, `src/lib/calc/crcl.ts`
- Create: `src/lib/calc/__tests__/units.test.ts`, `src/lib/calc/__tests__/crcl.test.ts`
- Modify: `src/data/sources.ts` (append one source before the closing `];` of `SOURCES`; bump `DATA_VERSION`)
- Modify: `src/data/derived.ts` (one `PRINCIPLE_SOURCES` entry)

**Interfaces:**
- Consumes: `Sex` from `src/lib/calc/biometrics.ts`.
- Produces:
  - `type CreatinineUnit = 'mgdl' | 'umol'`
  - `UMOL_PER_MGDL = 88.4`
  - `creatinineToUmol(value: number, unit: CreatinineUnit): number`
  - `creatinineFromUmol(umol: number, unit: CreatinineUnit): number`
  - `type CrclResult = { kind: 'ok'; mlPerMin: number } | { kind: 'incomplete'; missing: string[] }`
  - `creatinineClearance(i: { ageYears: number | null; tbwKg: number | null; sex: Sex | null; creatinineUmolL: number | null }): CrclResult`
- Source id: `cockcroft-gault-1976`.

- [ ] **Step 0: Branch**

Work in your own worktree on a branch created from `feat/phase-navigation`. Do not touch the main checkout.

- [ ] **Step 1: Write the failing tests**

Create `src/lib/calc/__tests__/units.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { UMOL_PER_MGDL, creatinineFromUmol, creatinineToUmol } from '../units';

describe('creatinine units', () => {
  it('converts 1 mg/dL to 88.4 umol/L and back', () => {
    expect(creatinineToUmol(1, 'mgdl')).toBeCloseTo(88.4, 6);
    expect(creatinineFromUmol(88.4, 'mgdl')).toBeCloseTo(1, 6);
  });

  it('leaves umol/L unchanged', () => {
    expect(creatinineToUmol(120, 'umol')).toBe(120);
    expect(creatinineFromUmol(120, 'umol')).toBe(120);
  });

  it('round-trips typed mg/dL values without drifting', () => {
    for (const v of [0.6, 1.0, 2.0, 5.5]) {
      expect(creatinineFromUmol(creatinineToUmol(v, 'mgdl'), 'mgdl')).toBeCloseTo(v, 9);
    }
  });

  it('uses 88.4 as the conversion factor', () => {
    expect(UMOL_PER_MGDL).toBe(88.4);
  });
});
```

Create `src/lib/calc/__tests__/crcl.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { creatinineClearance } from '../crcl';
import { creatinineToUmol } from '../units';

const man = { ageYears: 70, tbwKg: 70, sex: 'male' as const, creatinineUmolL: creatinineToUmol(1.0, 'mgdl') };

describe('creatinineClearance (Cockcroft-Gault, actual body weight)', () => {
  it('man, 70 y, 70 kg, creatinine 1.0 mg/dL: (70 x 70) / 72 = 68 mL/min', () => {
    const r = creatinineClearance(man);
    if (r.kind !== 'ok') throw new Error('expected ok');
    expect(r.mlPerMin).toBeCloseTo(68.06, 2);
  });

  it('woman, 60 y, 60 kg, creatinine 1.2 mg/dL: (80 x 60) / (72 x 1.2) x 0.85 = 47.2 mL/min', () => {
    const r = creatinineClearance({ ageYears: 60, tbwKg: 60, sex: 'female', creatinineUmolL: creatinineToUmol(1.2, 'mgdl') });
    if (r.kind !== 'ok') throw new Error('expected ok');
    expect(r.mlPerMin).toBeCloseTo(47.22, 2);
  });

  it('lists every missing input, in a fixed order', () => {
    expect(creatinineClearance({ ageYears: null, tbwKg: null, sex: null, creatinineUmolL: null })).toEqual({
      kind: 'incomplete',
      missing: ['age', 'actual weight', 'biological sex', 'serum creatinine'],
    });
  });

  it('gives no number for a patient under 18', () => {
    expect(creatinineClearance({ ...man, ageYears: 17 })).toEqual({ kind: 'incomplete', missing: ['age 18 or over'] });
  });

  it('accepts exactly 18', () => {
    expect(creatinineClearance({ ...man, ageYears: 18 }).kind).toBe('ok');
  });

  it.each([0, -5])('treats creatinine %s as missing instead of dividing by zero', (bad) => {
    expect(creatinineClearance({ ...man, creatinineUmolL: bad })).toEqual({ kind: 'incomplete', missing: ['serum creatinine'] });
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run src/lib/calc/__tests__/units.test.ts src/lib/calc/__tests__/crcl.test.ts`
Expected: FAIL, cannot resolve `../units` and `../crcl`.

- [ ] **Step 3: Write the implementation**

Create `src/lib/calc/units.ts`:

```ts
export type CreatinineUnit = 'mgdl' | 'umol';

/** Serum creatinine: 1 mg/dL = 88.4 micromol/L (molar mass 113.12 g/mol). */
export const UMOL_PER_MGDL = 88.4;

/** Every calculation uses micromol/L. The unit setting only changes what the user types and reads. */
export const creatinineToUmol = (value: number, unit: CreatinineUnit): number => (unit === 'umol' ? value : value * UMOL_PER_MGDL);

export const creatinineFromUmol = (umol: number, unit: CreatinineUnit): number => (unit === 'umol' ? umol : umol / UMOL_PER_MGDL);
```

Create `src/lib/calc/crcl.ts`:

```ts
import type { Sex } from './biometrics';
import { creatinineFromUmol } from './units';

export interface CrclInput {
  ageYears: number | null;
  tbwKg: number | null;
  sex: Sex | null;
  creatinineUmolL: number | null;
}

export type CrclResult = { kind: 'ok'; mlPerMin: number } | { kind: 'incomplete'; missing: string[] };

export const MIN_CG_AGE = 18;

/**
 * Cockcroft-Gault with ACTUAL body weight (the convention in the DOAC trials and the US rivaroxaban label).
 * shortcut: no ideal or adjusted weight option, add one only if a sourced local protocol needs it.
 */
export const creatinineClearance = (i: CrclInput): CrclResult => {
  const missing: string[] = [];
  if (i.ageYears === null) missing.push('age');
  else if (i.ageYears < MIN_CG_AGE) missing.push(`age ${MIN_CG_AGE} or over`);
  if (i.tbwKg === null) missing.push('actual weight');
  if (i.sex === null) missing.push('biological sex');
  if (i.creatinineUmolL === null || i.creatinineUmolL <= 0) missing.push('serum creatinine');
  if (missing.length > 0 || i.ageYears === null || i.tbwKg === null || i.sex === null || i.creatinineUmolL === null) {
    return { kind: 'incomplete', missing };
  }
  const mgDl = creatinineFromUmol(i.creatinineUmolL, 'mgdl');
  const mlPerMin = (((140 - i.ageYears) * i.tbwKg) / (72 * mgDl)) * (i.sex === 'female' ? 0.85 : 1);
  return { kind: 'ok', mlPerMin };
};
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/lib/calc/__tests__/units.test.ts src/lib/calc/__tests__/crcl.test.ts`
Expected: PASS, 11 tests.

- [ ] **Step 5: Register the source and its derived value**

In `src/data/sources.ts`, change `DATA_VERSION` to `'2026.11.17-draft16'`, then append this entry as the last item of `SOURCES` (just before the closing `];`):

```ts
  {
    id: 'cockcroft-gault-1976',
    tag: 'Cockcroft-Gault',
    name: 'Prediction of creatinine clearance from serum creatinine',
    publisher: 'Cockcroft DW, Gault MH',
    year: '1976',
    version: 'Nephron 1976;16:31-41, doi 10.1159/000180580',
    url: 'https://pubmed.ncbi.nlm.nih.gov/1244564/',
    tier: 3,
    scope: ['creatinine clearance estimate for adults', 'weight convention for anticoagulant dosing'],
    verification: 'secondary',
    accessNote:
      'Citation confirmed by web search (2026-11-17); the paper was not opened and PubMed blocked automated fetches. The formula and its SI constants (1.23 men, 1.04 women, creatinine in micromol/L) come from NKF and UK NHS summaries. This build uses ACTUAL body weight, as the DOAC trials and the US rivaroxaban label do according to secondary summaries (label not opened). The weight choice in obesity is contested: confirm against local protocol. Adults only: the paper studied patients aged 18 to 92.',
  },
```

In `src/data/derived.ts`, add this entry inside `PRINCIPLE_SOURCES` (after the `'label-mepivacaine'` line):

```ts
  'cockcroft-gault-1976': ['Creatinine clearance (mL/min) = (140 - age) x actual weight (kg) / (72 x serum creatinine in mg/dL), x 0.85 for women; adults only (shown in the Pre-op Assess section)'],
```

- [ ] **Step 6: Run the data tests and the full suite**

Run: `npx vitest run src/data/__tests__/integrity.test.ts src/data/__tests__/sourceRefs.test.ts`
Expected: PASS.

Run: `npm run verify`
Expected: all tests pass, type-check clean, build succeeds.

- [ ] **Step 7: Commit**

```bash
git add src/lib/calc/units.ts src/lib/calc/crcl.ts src/lib/calc/__tests__/units.test.ts src/lib/calc/__tests__/crcl.test.ts src/data/sources.ts src/data/derived.ts
git commit -m "feat(assess): add creatinine units and Cockcroft-Gault clearance"
```

---

### Task 2: Risk score data and engine (RCRI, STOP-Bang)

**Files:**
- Create: `src/data/riskScores.ts`, `src/lib/calc/scores.ts`
- Create: `src/data/__tests__/riskScores.test.ts`, `src/lib/calc/__tests__/scores.test.ts`
- Modify: `src/data/sources.ts` (update the `rcri-lee-1999` entry, add `stop-bang-chung-2016`, bump `DATA_VERSION`)
- Modify: `src/data/derived.ts` (import, a loop, and the exempt list)

**Interfaces:**
- Consumes: `UMOL_PER_MGDL` and `creatinineToUmol` from `src/lib/calc/units.ts` (Task 1); `Sex` from `src/lib/calc/biometrics.ts`.
- Produces:
  - `type DerivedKey = 'age>50' | 'male' | 'bmi>35' | 'creatinine>2.0mgdl'`
  - `interface RiskScoreItem { id: string; label: string; derive?: DerivedKey }`
  - `interface RiskBand { min: number; label: string; detail?: string }`
  - `interface RiskScore { id: string; name: string; items: RiskScoreItem[]; bands: RiskBand[]; note?: string; why?: string; sourceIds: string[] }`
  - `RCRI`, `STOP_BANG`, `RISK_SCORES: RiskScore[]`
  - `interface ScoreContext { ageYears: number | null; sex: Sex | null; bmi: number | null; creatinineUmolL: number | null }`
  - `type ScoreResult = { kind: 'ok'; points: number; max: number; band: RiskBand } | { kind: 'incomplete'; missing: string[] }`
  - `itemValue(item, answers: Record<string, boolean>, ctx): boolean`
  - `scoreResult(score, answers: Record<string, boolean>, ctx): ScoreResult`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/calc/__tests__/scores.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { RCRI, STOP_BANG } from '../../../data/riskScores';
import { scoreResult, type ScoreContext } from '../scores';
import { creatinineToUmol } from '../units';

const ctx: ScoreContext = { ageYears: 40, sex: 'female', bmi: 25, creatinineUmolL: creatinineToUmol(1, 'mgdl') };

const ok = (r: ReturnType<typeof scoreResult>) => {
  if (r.kind !== 'ok') throw new Error(`expected ok, got incomplete: ${r.missing.join(', ')}`);
  return r;
};

/** The first n manual (not derived) item ids of a score, as ticked answers. */
const ticked = (score: typeof RCRI, n: number): Record<string, boolean> =>
  Object.fromEntries(score.items.filter((i) => !i.derive).slice(0, n).map((i) => [i.id, true]));

describe('RCRI', () => {
  it.each([
    [0, '0 factors'],
    [1, '1 factor'],
    [2, '2 factors'],
    [3, '3 or more factors'],
    [5, '3 or more factors'],
  ])('%s ticked items -> %s', (n, label) => {
    const r = ok(scoreResult(RCRI, ticked(RCRI, n), ctx));
    expect(r.points).toBe(n);
    expect(r.band.label).toBe(label);
  });

  it('counts creatinine exactly 2.0 mg/dL as NOT above the threshold, and 2.1 as above', () => {
    expect(ok(scoreResult(RCRI, {}, { ...ctx, creatinineUmolL: creatinineToUmol(2.0, 'mgdl') })).points).toBe(0);
    expect(ok(scoreResult(RCRI, {}, { ...ctx, creatinineUmolL: creatinineToUmol(2.1, 'mgdl') })).points).toBe(1);
  });

  it('adds the creatinine point to the ticked ones: 2 ticked + creatinine 2.1 = 3', () => {
    const r = ok(scoreResult(RCRI, ticked(RCRI, 2), { ...ctx, creatinineUmolL: creatinineToUmol(2.1, 'mgdl') }));
    expect(r.points).toBe(3);
    expect(r.max).toBe(6);
  });

  it('is incomplete until creatinine is entered, never a low score', () => {
    expect(scoreResult(RCRI, {}, { ...ctx, creatinineUmolL: null })).toEqual({ kind: 'incomplete', missing: ['serum creatinine'] });
  });
});

describe('STOP-Bang', () => {
  it.each([
    [2, 'Low risk'],
    [3, 'Intermediate risk'],
    [4, 'Intermediate risk'],
    [5, 'High risk'],
  ])('%s manual yes answers (derived items all no) -> %s', (n, label) => {
    expect(ok(scoreResult(STOP_BANG, ticked(STOP_BANG, n), ctx)).band.label).toBe(label);
  });

  it('fills age, sex and BMI from the patient: man, 60 y, BMI 36 -> 3 points', () => {
    const r = ok(scoreResult(STOP_BANG, {}, { ageYears: 60, sex: 'male', bmi: 36, creatinineUmolL: null }));
    expect(r.points).toBe(3);
    expect(r.band.label).toBe('Intermediate risk');
  });

  it('counts age exactly 50 and BMI exactly 35 as NOT above', () => {
    expect(ok(scoreResult(STOP_BANG, {}, { ageYears: 50, sex: 'female', bmi: 35, creatinineUmolL: null })).points).toBe(0);
  });

  it('ignores a manual tick on a derived item', () => {
    expect(ok(scoreResult(STOP_BANG, { 'sb-male': true, 'sb-age': true }, ctx)).points).toBe(0);
  });

  it('is incomplete, not "Low risk", when age, sex and BMI are all missing', () => {
    expect(scoreResult(STOP_BANG, {}, { ageYears: null, sex: null, bmi: null, creatinineUmolL: null })).toEqual({
      kind: 'incomplete',
      missing: ['weight and height (BMI)', 'age', 'biological sex'],
    });
  });
});
```

Create `src/data/__tests__/riskScores.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { RISK_SCORES } from '../riskScores';
import { SOURCE_BY_ID } from '../sources';

describe('risk score records', () => {
  it('cite sources that exist in the registry', () => {
    for (const s of RISK_SCORES) {
      expect(s.sourceIds.length, s.id).toBeGreaterThan(0);
      for (const id of s.sourceIds) expect(SOURCE_BY_ID[id], `${s.id} -> ${id}`).toBeDefined();
    }
  });

  it('have unique item ids across all scores', () => {
    const ids = RISK_SCORES.flatMap((s) => s.items.map((i) => i.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('have bands that start at 0, ascend, and stay within the item count', () => {
    for (const s of RISK_SCORES) {
      expect(s.bands[0].min, s.id).toBe(0);
      for (let k = 1; k < s.bands.length; k++) expect(s.bands[k].min, s.id).toBeGreaterThan(s.bands[k - 1].min);
      expect(s.bands[s.bands.length - 1].min, s.id).toBeLessThanOrEqual(s.items.length);
    }
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run src/lib/calc/__tests__/scores.test.ts src/data/__tests__/riskScores.test.ts`
Expected: FAIL, cannot resolve `riskScores` and `scores`.

- [ ] **Step 3: Write the score data**

Create `src/data/riskScores.ts`:

```ts
// Risk score definitions. Every score cites sourceIds that exist in sources.ts (enforced by tests).
// Items are one point each. Add a `points` field when the first weighted score (ARISCAT) is added.

export type DerivedKey = 'age>50' | 'male' | 'bmi>35' | 'creatinine>2.0mgdl';

export interface RiskScoreItem {
  id: string;
  label: string;
  /** Filled from the patient inputs and locked, so it can never disagree with them. */
  derive?: DerivedKey;
}

export interface RiskBand {
  /** Lowest score in this band. */
  min: number;
  label: string;
  detail?: string;
}

export interface RiskScore {
  id: string;
  name: string;
  items: RiskScoreItem[];
  bands: RiskBand[];
  note?: string;
  /** One-sentence rationale for trainees. */
  why?: string;
  sourceIds: string[];
}

const rcriRate = (validation: string, derivation: string): string =>
  `Major cardiac complications: ${validation} in the validation cohort (${derivation} in the derivation cohort).`;

export const RCRI: RiskScore = {
  id: 'rcri',
  name: 'Revised Cardiac Risk Index (RCRI)',
  items: [
    { id: 'rcri-high-risk-surgery', label: 'High-risk surgery (intraperitoneal, intrathoracic or suprainguinal vascular)' },
    { id: 'rcri-ihd', label: 'Ischemic heart disease (previous MI, positive exercise test, ischemic chest pain or nitrate use, or Q waves on ECG)' },
    { id: 'rcri-chf', label: 'Heart failure (history of heart failure, pulmonary edema or PND, bilateral rales or S3, or pulmonary vascular redistribution on chest X-ray)' },
    { id: 'rcri-cvd', label: 'Cerebrovascular disease (previous TIA or stroke)' },
    { id: 'rcri-insulin', label: 'Insulin treatment for diabetes' },
    { id: 'rcri-creatinine', label: 'Serum creatinine above 2.0 mg/dL (177 micromol/L)', derive: 'creatinine>2.0mgdl' },
  ],
  bands: [
    { min: 0, label: '0 factors', detail: rcriRate('0.4%', '0.5%') },
    { min: 1, label: '1 factor', detail: rcriRate('0.9%', '1.3%') },
    { min: 2, label: '2 factors', detail: rcriRate('6.6%', '3.6%') },
    { min: 3, label: '3 or more factors', detail: rcriRate('11.0%', '9.1%') },
  ],
  note: 'The rates come from one 1999 hospital cohort of patients aged 50 or over having elective major non-cardiac surgery. They describe that cohort, not an individual patient.',
  why: 'Each factor adds one point of independent risk for a major cardiac complication after non-cardiac surgery.',
  sourceIds: ['rcri-lee-1999'],
};

export const STOP_BANG: RiskScore = {
  id: 'stop-bang',
  name: 'STOP-Bang (obstructive sleep apnea screen)',
  items: [
    { id: 'sb-snoring', label: 'Snoring: do you snore loudly (louder than talking, or heard through a closed door)?' },
    { id: 'sb-tired', label: 'Tired: do you often feel tired, fatigued or sleepy in the daytime?' },
    { id: 'sb-observed', label: 'Observed: has anyone seen you stop breathing during sleep?' },
    { id: 'sb-pressure', label: 'Pressure: do you have, or are you treated for, high blood pressure?' },
    { id: 'sb-bmi', label: 'BMI above 35 kg/m²', derive: 'bmi>35' },
    { id: 'sb-age', label: 'Age above 50', derive: 'age>50' },
    { id: 'sb-neck', label: 'Neck circumference above 40 cm (16 in)' },
    { id: 'sb-male', label: 'Male', derive: 'male' },
  ],
  bands: [
    { min: 0, label: 'Low risk', detail: 'Of moderate to severe obstructive sleep apnea (score 0 to 2).' },
    { min: 3, label: 'Intermediate risk', detail: 'Of moderate to severe obstructive sleep apnea (score 3 to 4).' },
    { min: 5, label: 'High risk', detail: 'Of moderate to severe obstructive sleep apnea (score 5 to 8).' },
  ],
  note: 'A screening tool, not a diagnosis. The paper adds a second step for scores of 3 to 4 that this screen does not apply.',
  why: 'Eight yes/no items; each yes scores one point. A higher score means a higher chance of moderate to severe sleep apnea.',
  sourceIds: ['stop-bang-chung-2016', 'stop-chung-2008'],
};

export const RISK_SCORES: RiskScore[] = [RCRI, STOP_BANG];
```

Create `src/lib/calc/scores.ts`:

```ts
import type { DerivedKey, RiskBand, RiskScore, RiskScoreItem } from '../../data/riskScores';
import type { Sex } from './biometrics';
import { UMOL_PER_MGDL } from './units';

export interface ScoreContext {
  ageYears: number | null;
  sex: Sex | null;
  bmi: number | null;
  creatinineUmolL: number | null;
}

export type ScoreResult =
  | { kind: 'ok'; points: number; max: number; band: RiskBand }
  | { kind: 'incomplete'; missing: string[] };

/** value() is null when the patient input it needs has not been entered. */
const DERIVE: Record<DerivedKey, { needs: string; value: (c: ScoreContext) => boolean | null }> = {
  'age>50': { needs: 'age', value: (c) => (c.ageYears === null ? null : c.ageYears > 50) },
  male: { needs: 'biological sex', value: (c) => (c.sex === null ? null : c.sex === 'male') },
  'bmi>35': { needs: 'weight and height (BMI)', value: (c) => (c.bmi === null ? null : c.bmi > 35) },
  'creatinine>2.0mgdl': {
    needs: 'serum creatinine',
    value: (c) => (c.creatinineUmolL === null ? null : c.creatinineUmolL > 2.0 * UMOL_PER_MGDL),
  },
};

/** Derived items follow the patient inputs; manual items are false until ticked. */
export const itemValue = (item: RiskScoreItem, answers: Record<string, boolean>, ctx: ScoreContext): boolean =>
  item.derive ? DERIVE[item.derive].value(ctx) === true : answers[item.id] === true;

export const scoreResult = (score: RiskScore, answers: Record<string, boolean>, ctx: ScoreContext): ScoreResult => {
  const missing = [
    ...new Set(score.items.flatMap((i) => (i.derive && DERIVE[i.derive].value(ctx) === null ? [DERIVE[i.derive].needs] : []))),
  ];
  if (missing.length > 0) return { kind: 'incomplete', missing };
  const points = score.items.filter((i) => itemValue(i, answers, ctx)).length;
  const band = [...score.bands].reverse().find((b) => points >= b.min) ?? score.bands[0];
  return { kind: 'ok', points, max: score.items.length, band };
};
```

- [ ] **Step 4: Run the score tests to verify they pass**

Run: `npx vitest run src/lib/calc/__tests__/scores.test.ts src/data/__tests__/riskScores.test.ts`
Expected: `scores.test.ts` passes (16 tests). The data test's source lookup for `stop-bang-chung-2016` fails until Step 5 registers it. Continue to Step 5.

- [ ] **Step 5: Register the sources and the derived values**

In `src/data/sources.ts`, change `DATA_VERSION` to `'2026.11.17-draft17'`.

Replace the `rcri-lee-1999` entry's `scope`, `verification` and `accessNote` (anchor on its unique `scope` line) with:

```ts
    scope: ['Revised Cardiac Risk Index: six predictors, definitions and rates by factor count (Table 3)'],
    verification: 'primary',
    accessNote:
      'Full text read from the open eScholarship copy (2026-11-17). Table 3, validation cohort (n=1422): major cardiac complications 0.4%, 0.9%, 6.6%, 11.0% for 0, 1, 2, 3 or more factors; derivation cohort (n=2893): 0.5%, 1.3%, 3.6%, 9.1%. The abstract rounds the two-factor figures to 7% and 4%. High-risk surgery is intraperitoneal, intrathoracic or suprainguinal vascular. A 1999 single-centre cohort of patients aged 50 or over having elective major non-cardiac surgery.',
```

Append this entry as the last item of `SOURCES` (before the closing `];`):

```ts
  {
    id: 'stop-bang-chung-2016',
    tag: 'STOP-Bang 2016',
    name: 'STOP-Bang Questionnaire: A Practical Approach to Screen for Obstructive Sleep Apnea',
    publisher: 'Chung F, Abdullah HR, Liao P',
    year: '2016',
    version: 'Chest 2016;149:631-638, doi 10.1378/chest.15-0903',
    url: 'https://pubmed.ncbi.nlm.nih.gov/26378880/',
    tier: 3,
    scope: ['STOP-Bang: eight yes/no items, score bands 0-2 low, 3-4 intermediate, 5-8 high risk of moderate to severe OSA'],
    verification: 'secondary',
    accessNote:
      'Citation, scoring bands and the neck circumference threshold (above 40 cm, 16 in) confirmed from web-search excerpts (2026-11-17); the full text was not opened and PubMed blocked automated fetches. Item wording is the standard questionnaire wording. The paper adds a second step for scores of 3 to 4; this build does not apply it.',
  },
```

In `src/data/derived.ts`:

1. Add the import next to the other data imports: `import { RISK_SCORES } from './riskScores';`
2. Add this loop next to the other `add(...)` loops, before `for (const [id, lines] of Object.entries(PRINCIPLE_SOURCES))`:

```ts
  for (const s of RISK_SCORES) {
    add(s.sourceIds, `Risk score ${s.name}: ${s.items.length} items; bands ${s.bands.map((b) => `${b.min}+ ${b.label}`).join(', ')}`);
  }
```

3. In `SOURCES_WITHOUT_DERIVED_VALUES`, delete the two ids that now have derived values: `'rcri-lee-1999'` and `'stop-chung-2008'`.

- [ ] **Step 6: Run the data tests and the full suite**

Run: `npx vitest run src/data/__tests__/riskScores.test.ts src/data/__tests__/integrity.test.ts src/data/__tests__/sourceRefs.test.ts src/lib/calc/__tests__/scores.test.ts`
Expected: PASS.

Run: `npm run verify`
Expected: all tests pass, type-check clean, build succeeds.

- [ ] **Step 7: Commit**

```bash
git add src/data/riskScores.ts src/lib/calc/scores.ts src/data/__tests__/riskScores.test.ts src/lib/calc/__tests__/scores.test.ts src/data/sources.ts src/data/derived.ts
git commit -m "feat(assess): add RCRI and STOP-Bang score data and engine"
```

---

### Task 3: Store and the Assess UI

**Files:**
- Modify: `src/store/useAppStore.ts`, `src/lib/phases.ts`, `src/App.tsx`
- Create: `src/components/ScorePanel.tsx`, `src/views/AssessView.tsx`
- Test: modify `src/lib/__tests__/phases.test.ts`, `src/store/__tests__/migrate.test.ts`; create `src/store/__tests__/assess.test.ts`

**Interfaces:**
- Consumes: `CreatinineUnit`, `creatinineToUmol`, `creatinineFromUmol` (Task 1); `creatinineClearance` (Task 1); `RISK_SCORES`, `RiskScore` (Task 2); `scoreResult`, `itemValue`, `ScoreContext` (Task 2); `calculateBmi` from `biometrics.ts`.
- Produces: store fields `patient.creatinineUmolL: number | null`, `creatinineUnit: CreatinineUnit` (persisted), `scoreAnswers: Record<string, boolean>` (memory only), actions `setCreatinineUnit(unit)` and `toggleScoreItem(id)`. `needsBiometrics` is true on Pre-op.

- [ ] **Step 1: Write the failing tests**

In `src/lib/__tests__/phases.test.ts`, change the row `['preop', 'dosing', false],` to `['preop', 'dosing', true],` (the biometric header now shows on Pre-op).

In `src/store/__tests__/migrate.test.ts`:
- In the first test's key list, add `'creatinineUnit'` to the array (it is compared after sorting).
- Add this test inside the `describe`:

```ts
  it('keeps a valid creatinine unit and defaults an invalid one to mg/dL', () => {
    expect(migratePersisted({ creatinineUnit: 'umol' }).creatinineUnit).toBe('umol');
    expect(migratePersisted({ creatinineUnit: 'bogus' }).creatinineUnit).toBe('mgdl');
    expect(migratePersisted(undefined).creatinineUnit).toBe('mgdl');
  });
```

Create `src/store/__tests__/assess.test.ts`:

```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { useAppStore } from '../useAppStore';

describe('assess state', () => {
  beforeEach(() => useAppStore.getState().newCase());

  it('persists only the creatinine unit, never the creatinine or the score answers', () => {
    const persisted = useAppStore.persist.getOptions().partialize!(useAppStore.getState()) as Record<string, unknown>;
    const keys = Object.keys(persisted);
    expect(keys).toContain('creatinineUnit');
    for (const forbidden of ['patient', 'creatinineUmolL', 'scoreAnswers']) expect(keys).not.toContain(forbidden);
  });

  it('toggles a score item on and off', () => {
    useAppStore.getState().toggleScoreItem('rcri-ihd');
    expect(useAppStore.getState().scoreAnswers['rcri-ihd']).toBe(true);
    useAppStore.getState().toggleScoreItem('rcri-ihd');
    expect(useAppStore.getState().scoreAnswers['rcri-ihd']).toBe(false);
  });

  it('New case clears creatinine and score answers', () => {
    useAppStore.getState().setPatient({ creatinineUmolL: 150 });
    useAppStore.getState().toggleScoreItem('rcri-ihd');
    useAppStore.getState().newCase();
    expect(useAppStore.getState().patient.creatinineUmolL).toBeNull();
    expect(useAppStore.getState().scoreAnswers).toEqual({});
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run src/lib/__tests__/phases.test.ts src/store/__tests__/migrate.test.ts src/store/__tests__/assess.test.ts`
Expected: FAIL (the `preop/dosing` row, the key list, and missing store fields and actions).

- [ ] **Step 3: Store changes**

In `src/store/useAppStore.ts`:

1. Add to the imports: `import type { CreatinineUnit } from '../lib/calc/units';`
2. In `PatientInput`, after `ageYears: number | null;` add:

```ts
  /** Serum creatinine in micromol/L, whatever unit was typed. In memory only. */
  creatinineUmolL: number | null;
```

3. Replace the `EMPTY_PATIENT` line with:

```ts
export const EMPTY_PATIENT: PatientInput = { tbwKg: null, heightCm: null, sex: null, ageYears: null, creatinineUmolL: null };
```

4. In `PersistedPrefs`, after `audioEnabled: boolean;` add `creatinineUnit: CreatinineUnit;`
5. In `AppState`, after `intraopView: IntraopView;` add `scoreAnswers: Record<string, boolean>;` and, after `setAudioEnabled: (value: boolean) => void;`, add:

```ts
  setCreatinineUnit: (unit: CreatinineUnit) => void;
  toggleScoreItem: (id: string) => void;
```

6. In `migratePersisted`, after the `audioEnabled:` line add: `creatinineUnit: p.creatinineUnit === 'umol' ? 'umol' : 'mgdl',`
7. In the initial state, after `      audioEnabled: true,` add `      creatinineUnit: 'mgdl',`, and after `      intraopView: 'dosing',` add `      scoreAnswers: {},`
8. In `newCase`, after the line `vent: { ...DEFAULT_VENT, scenarioId: get().ventScenarioId },` add `scoreAnswers: {},`
9. After `      setAudioEnabled: (audioEnabled) => set({ audioEnabled }),` add:

```ts
      setCreatinineUnit: (creatinineUnit) => set({ creatinineUnit }),
      toggleScoreItem: (id) => set((s) => ({ scoreAnswers: { ...s.scoreAnswers, [id]: !s.scoreAnswers[id] } })),
```

10. In `partialize`, after `        audioEnabled: s.audioEnabled,` add `        creatinineUnit: s.creatinineUnit,`

Do **not** change the persist `version` (4). A version bump would run `migratePersisted` on existing installs and wipe their saved checklist ticks. Stored v4 data simply merges over the new default.

- [ ] **Step 4: Phase rule**

In `src/lib/phases.ts`, replace the `needsBiometrics` comment and function with:

```ts
/** Scores and dose math need the biometric header; checklists and the handoff do not. */
export const needsBiometrics = (tab: AppTab, view: IntraopView): boolean =>
  tab === 'preop' || (tab === 'intraop' && view !== 'lists');
```

- [ ] **Step 5: Score panel**

Create `src/components/ScorePanel.tsx`:

```tsx
import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import type { RiskScore } from '../data/riskScores';
import { itemValue, scoreResult, type ScoreContext } from '../lib/calc/scores';
import { Panel } from './hud/Panel';
import { WarningBanner } from './ui/WarningBanner';

interface ScoreItemProps {
  label: string;
  checked: boolean;
  locked: boolean;
  onToggle: () => void;
}

// Not ChecklistItem: that one strikes through and turns green when "done", which would read as good news for a risk factor.
const ScoreItem: React.FC<ScoreItemProps> = ({ label, checked, locked, onToggle }) => (
  <button
    type="button"
    role="checkbox"
    aria-checked={checked}
    disabled={locked}
    onClick={onToggle}
    className={`flex min-h-[48px] w-full items-start gap-3 rounded-xl border p-3 text-left text-sm font-semibold touch-manipulation disabled:cursor-default ${
      checked ? 'border-amber-500/60 bg-amber-950/30 text-amber-100' : 'border-clinical-border bg-clinical-card/50 text-slate-200'
    }`}
  >
    {checked ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" /> : <Circle className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />}
    <span className="min-w-0 flex-1">
      {label}
      {locked && <span className="mt-1 block text-xs font-normal text-slate-400">Set from the patient inputs</span>}
    </span>
  </button>
);

interface ScorePanelProps {
  score: RiskScore;
  answers: Record<string, boolean>;
  ctx: ScoreContext;
  onToggle: (id: string) => void;
}

export const ScorePanel: React.FC<ScorePanelProps> = ({ score, answers, ctx, onToggle }) => {
  const result = scoreResult(score, answers, ctx);
  return (
    <Panel title={score.name} sourceIds={score.sourceIds}>
      <div className="flex flex-col gap-1.5">
        {score.items.map((item) => (
          <ScoreItem
            key={item.id}
            label={item.label}
            checked={itemValue(item, answers, ctx)}
            locked={!!item.derive}
            onToggle={() => onToggle(item.id)}
          />
        ))}
      </div>
      <div aria-live="polite">
        {result.kind === 'incomplete' ? (
          <WarningBanner level="info">Incomplete: needs {result.missing.join(', ')}.</WarningBanner>
        ) : (
          <>
            <p className="font-mono text-lg font-bold text-cyan-300">
              {result.points} / {result.max} · {result.band.label}
            </p>
            {result.band.detail && <p className="text-xs text-slate-300">{result.band.detail}</p>}
          </>
        )}
      </div>
      {score.note && <p className="text-xs text-slate-400">{score.note}</p>}
    </Panel>
  );
};
```

- [ ] **Step 6: Assess view**

Create `src/views/AssessView.tsx`:

```tsx
import React from 'react';
import { RISK_SCORES } from '../data/riskScores';
import { calculateBmi } from '../lib/calc/biometrics';
import { creatinineClearance } from '../lib/calc/crcl';
import { creatinineFromUmol, creatinineToUmol, type CreatinineUnit } from '../lib/calc/units';
import { useAppStore } from '../store/useAppStore';
import { Panel } from '../components/hud/Panel';
import { ScorePanel } from '../components/ScorePanel';
import { NumericStepper } from '../components/ui/NumericStepper';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { WarningBanner } from '../components/ui/WarningBanner';

const UNIT_OPTIONS: { value: CreatinineUnit; label: string }[] = [
  { value: 'mgdl', label: 'mg/dL' },
  { value: 'umol', label: 'µmol/L' },
];

const STEPPER: Record<CreatinineUnit, { step: number; min: number; max: number; decimals: number; unit: string }> = {
  mgdl: { step: 0.1, min: 0.1, max: 15, decimals: 1, unit: 'mg/dL' },
  umol: { step: 10, min: 10, max: 1300, decimals: 0, unit: 'µmol/L' },
};

/** Pre-op assessment: serum creatinine, creatinine clearance and the risk scores. All inputs live in memory only. */
export const AssessView: React.FC = () => {
  const patient = useAppStore((s) => s.patient);
  const setPatient = useAppStore((s) => s.setPatient);
  const unit = useAppStore((s) => s.creatinineUnit);
  const setUnit = useAppStore((s) => s.setCreatinineUnit);
  const answers = useAppStore((s) => s.scoreAnswers);
  const toggle = useAppStore((s) => s.toggleScoreItem);

  const bmi = patient.tbwKg !== null && patient.heightCm !== null ? calculateBmi(patient.tbwKg, patient.heightCm) : null;
  const ctx = { ageYears: patient.ageYears, sex: patient.sex, bmi, creatinineUmolL: patient.creatinineUmolL };
  const crcl = creatinineClearance({ ageYears: patient.ageYears, tbwKg: patient.tbwKg, sex: patient.sex, creatinineUmolL: patient.creatinineUmolL });
  const s = STEPPER[unit];
  const shown = patient.creatinineUmolL === null ? null : Number(creatinineFromUmol(patient.creatinineUmolL, unit).toFixed(s.decimals));

  return (
    <div className="mb-3 flex flex-col gap-3">
      <Panel title="Serum creatinine">
        <SegmentedControl<CreatinineUnit> ariaLabel="Creatinine unit" value={unit} options={UNIT_OPTIONS} onChange={setUnit} />
        <NumericStepper
          label="Serum creatinine"
          value={shown}
          unit={s.unit}
          step={s.step}
          min={s.min}
          max={s.max}
          decimals={s.decimals}
          keypadTitle="Enter serum creatinine"
          onChange={(v) => setPatient({ creatinineUmolL: creatinineToUmol(v, unit) })}
        />
      </Panel>

      <Panel title="Creatinine clearance" basis="Cockcroft-Gault, actual body weight" sourceIds={['cockcroft-gault-1976', 'app-generic']}>
        {crcl.kind === 'ok' ? (
          <>
            <p className="font-mono text-2xl font-bold text-cyan-300">{Math.round(crcl.mlPerMin)} mL/min</p>
            <p className="text-xs text-slate-400">
              An estimate for adults. It is less reliable at extremes of body weight and while creatinine is changing.
            </p>
          </>
        ) : (
          <WarningBanner level="info">Incomplete: needs {crcl.missing.join(', ')}.</WarningBanner>
        )}
      </Panel>

      {RISK_SCORES.map((score) => (
        <ScorePanel key={score.id} score={score} answers={answers} ctx={ctx} onToggle={toggle} />
      ))}
    </div>
  );
};
```

- [ ] **Step 7: Wire it into the Pre-op tab**

In `src/App.tsx`, add the import `import { AssessView } from './views/AssessView';` and change the Pre-op container to:

```tsx
        <div className={activeTab === 'preop' ? '' : 'hidden'} aria-hidden={activeTab !== 'preop'}>
          <AssessView />
          <ChecklistsView phaseLists={listsFor('preop')} />
        </div>
```

- [ ] **Step 8: Run the tests**

Run: `npx vitest run src/lib/__tests__/phases.test.ts src/store/__tests__/migrate.test.ts src/store/__tests__/assess.test.ts`
Expected: PASS.

Run: `npm run verify`
Expected: all tests pass, type-check clean, build succeeds.

- [ ] **Step 9: Check by hand**

Run `npm run dev` and open http://localhost:5173.
- **Pre-op** shows the patient bar, then Serum creatinine, Creatinine clearance, RCRI, STOP-Bang, then the Fasting / NPO checklist.
- With nothing entered, CrCl, RCRI and STOP-Bang each say "Incomplete: needs …" and none shows a score.
- Enter a man, age 70, 70 kg, 170 cm, creatinine 1.0 mg/dL. CrCl reads **68 mL/min**.
- Switch the unit to µmol/L: the field shows 88, CrCl is unchanged. Switch back: 1.0.
- Enter creatinine 2.1 mg/dL: the RCRI creatinine item turns on and locks. Enter exactly 2.0: it stays off.
- Tick RCRI ischemic heart disease and heart failure: the band reads "2 factors" with the 6.6% line.
- STOP-Bang with that man (age 70, male): 2 points from the derived items. Tick Snoring: 3, "Intermediate risk".
- Set age 17: CrCl reads "Incomplete: needs age 18 or over".
- **New case** clears creatinine and every tick. Reload the page: the unit you chose is kept, nothing else is.
- Dosing, Airway and Vent still work. The biometric header is hidden on Lists and Post-op.

- [ ] **Step 10: Commit**

```bash
git add src/store/useAppStore.ts src/lib/phases.ts src/App.tsx src/components/ScorePanel.tsx src/views/AssessView.tsx src/lib/__tests__/phases.test.ts src/store/__tests__/migrate.test.ts src/store/__tests__/assess.test.ts
git commit -m "feat(assess): add the Pre-op Assess section with creatinine, CrCl, RCRI and STOP-Bang"
```

---

### Task 4: Docs

**Files:**
- Modify: `README.md`
- Modify: `docs/superpowers/specs/2026-11-17-perioperative-guide-design.md`

- [ ] **Step 1: README**

In `README.md`:

1. In the "App structure" paragraph, replace `**Pre-op** holds the Fasting / NPO checklist.` with `**Pre-op** holds an Assess section (serum creatinine, Cockcroft-Gault creatinine clearance, the RCRI and STOP-Bang) above the Fasting / NPO checklist.`
2. In "What is and is not stored", replace `timer-sound setting, and anonymous checklist tick marks.` with `timer-sound setting, the creatinine unit (mg/dL or µmol/L), and anonymous checklist tick marks.`
3. In the same section, replace `**Never stored:** patient weight, height, sex, age,` with `**Never stored:** patient weight, height, sex, age, serum creatinine, risk-score answers,`.

- [ ] **Step 2: Spec**

In the spec's §10 rollout list, replace the line `2. **Assess:** scores and CrCl.` with:

```
2. **Assess** (plan: `docs/superpowers/plans/2026-11-17-assess-scores-crcl.md`): serum creatinine with a mg/dL / µmol/L toggle, Cockcroft-Gault CrCl (actual body weight, adults only), RCRI and STOP-Bang, and the biometric header on Pre-op. RCRI was verified against the paper's full text. Deferred to step 2b: DASI, ARISCAT and the Clinical Frailty Scale (their weight tables and scale text have not been read), the ASA picker and surgical-risk grade (no ASA source registered, and nothing reads them before the pre-op note), glucose and Hb units, and CrCl bands (step 3 defines them from ASRA and the drug labels).
```

- [ ] **Step 3: Verify and commit**

Run: `npm run verify`
Expected: PASS.

```bash
git add README.md docs/superpowers/specs/2026-11-17-perioperative-guide-design.md
git commit -m "docs: record the Assess section in the README and spec step 2"
```
