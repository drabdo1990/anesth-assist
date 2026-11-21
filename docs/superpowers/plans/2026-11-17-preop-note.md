# Pre-op Note Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a **Pre-op note** to the Pre-op tab: a short, anonymous, plain-text summary of what the clinician entered and what the app computed (patient numbers, creatinine and clearance, ASA class, fasting status, the Assess scores, and the ticked medications with their label instructions), with a **Copy** button.

**Architecture:** A pure `buildPreopNote(input)` in `src/lib/preopNote.ts`, shaped like `buildHandoffSummary()`. Its input holds only numbers and fixed choices, so free text cannot get in. It reuses the existing calculations (`creatinineClearance`, `scoreResult`, `matchTimings`) so the note can never disagree with the screens. Three new in-memory picks (ASA class, an Emergency flag, a fasting status) live in the Zustand store and are cleared by **New case**. A `PreopNotePanel` shows the preview and the Copy button. `copyText` moves out of `ChecklistsView.tsx` into `src/lib/copyText.ts` because the note is its second user.

**Tech Stack:** React 19, Zustand 5, Tailwind 3, Vitest 4. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-11-17-perioperative-guide-design.md` (§4 `preopNote.ts` and `copyText.ts`, §6 Note, rollout step 6; Task 3 records the trim).

## Scope decisions (read first)

**In:**
- **The note's lines:** age, sex, weight, height and BMI; serum creatinine in both mg/dL and µmol/L; creatinine clearance (Cockcroft-Gault, actual body weight); ASA class with an Emergency (E) flag; a fasting status; RCRI and STOP-Bang with their points and band; and, for each medication class ticked in the Medications panel, the class instruction, its caution if it has one, and each drug's label timing and restart line. Dabigatran shows only the line that fits the patient's CrCl, or both lines when no CrCl is available. Sourced lines end with their source tags (for example `[Product label]`).
- **ASA class and fasting status are fixed pick-lists**, the same pattern as the handoff form: categories the clinician chooses, with no logic and no descriptions behind them. ASA classes are I to VI with a separate E flag (the handoff's combined `III-E` list stays as it is). Fasting status has two choices: *Meets local fasting protocol* and *Does not meet local fasting protocol*. This resolves the "ASA picker" deferral from step 2.
- **`copyText` moves** to `src/lib/copyText.ts`, unchanged in behavior.
- **A privacy update in the README**, because this note, unlike the handoff, carries biometrics.

**Out, and why:**
- **Comorbidity plans.** They arrive with step 7.
- **Surgical-risk grade.** No source is registered for it, and nothing in the app reads it.
- **Apfel and 4AT.** They are Post-op tools, not part of the pre-op picture.
- **A free-text field of any kind.** Names cannot be detected reliably; there is none, and the input type makes one impossible.
- **Medications the app does not cover.** The note says so: it lists only what was ticked, and states that the app covers only SGLT2 inhibitors, DOACs and GLP-1 receptor agonists, so an empty list is never read as "no medications".
- **The fasting checklist's ticks.** Those are guidance acknowledgements, not a fasting status, so they are not copied.
- **Catheter statements and the "why" lines** for the medication classes. The note is a summary; the screen has the rest.

**Privacy (this is the point of the step):** the note includes **age, sex, weight, height, BMI and creatinine**, which the clinician typed in. It has no name or identifier and no free text. It is built only while the Pre-op tab is shown, is **never stored**, and reaches the clipboard **only when the user taps Copy**. The panel says so, and the README is updated. The handoff keeps its no-biometrics rule, unchanged.

**Honest limits the note states:** the medication wording is the manufacturers' label text as of 2026-11-17, so the note ends with the app's data version; the label timings are not ASRA neuraxial intervals (the DOAC caution is copied into the note).

## Global Constraints

- Offline-first PWA. No clinical network calls. No new dependencies.
- The note's input type has **no free-text field**: only numbers and fixed unions.
- A missing value reads `not entered` or `incomplete (needs ...)`. Nothing is defaulted, and the note never contains `NaN`, `undefined` or `null`.
- ASA class, the E flag and the fasting status are in memory only and are cleared by **New case**. Do not add them to `partialize`; do not bump the Zustand persist `version`.
- Touch targets at least 48 px. Tailwind 3. Literal class strings only. Use `text-black` (not `text-slate-950`) on solid accent fills; the theme's class guard test rejects the latter.
- No clinical data changes, so **do not bump `DATA_VERSION`**.
- Run only the affected test file first, then `npm run verify` before finishing.
- **Tasks must run in order (1, 2, 3).**
- Work in your own worktree on your own branch. Skip any `git switch`/`git checkout` step, and never touch the main checkout.

## Review Focus

- **No free text can reach the note.** The input type allows only numbers and the two unions, and Task 1 pins it with `@ts-expect-error` lines that fail the type-check if it ever loosens.
- **A missing value is never invented.** An empty input gives `not entered` / `incomplete` / `not recorded` lines and no `NaN`, `undefined` or `null`. A `NaN` weight reads `not entered`. Task 1 pins it.
- **Dabigatran shows the line that fits the CrCl** (68 mL/min shows 1 to 2 days and not 3 to 5; 34 shows the reverse), and **both lines with `(CrCl not available)` when there is no CrCl.** Task 1 pins it.
- **The DOAC caution is always in the note when DOACs are ticked,** and the GLP-1 line states no timing. Task 1 pins both.
- **Every source tag in the note resolves to a real source tag.** Task 1 pins it.
- **An empty medication list says the app covers only three classes.** Task 1 pins it.
- **New case clears ASA, E and fasting, and none of them is persisted.** Task 2 pins it.
- **The note is not stored and is copied only on a tap.** Task 2 checks by hand that nothing about it appears in localStorage.
- **The handoff is unchanged** after `copyText` moves: its tests pass untouched, and Task 2 checks its Copy button by hand.

---

### Task 1: The pure note builder

**Files:**
- Create: `src/lib/preopNote.ts`, `src/lib/__tests__/preopNote.test.ts`

**Interfaces:**
- Consumes: `PERIOP_RULES`, `PeriopAction` (`src/data/periopMeds.ts`); `RISK_SCORES` (`src/data/riskScores.ts`); `DATA_VERSION`, `SOURCE_BY_ID` (`src/data/sources.ts`); `calculateBmi`, `Sex` (`src/lib/calc/biometrics.ts`); `creatinineClearance` (`src/lib/calc/crcl.ts`); `matchTimings` (`src/lib/calc/periopMeds.ts`); `scoreResult` (`src/lib/calc/scores.ts`); `creatinineFromUmol` (`src/lib/calc/units.ts`).
- Produces: `ASA_CLASSES`, `type AsaClass`, `FASTING_STATUSES`, `type FastingStatus`, `interface PreopNoteInput`, `buildPreopNote(input: PreopNoteInput): string`.

- [ ] **Step 1: Write the failing test**

Create `src/lib/__tests__/preopNote.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { DOAC_RULE, SGLT2_RULE } from '../../data/periopMeds';
import { DATA_VERSION, SOURCE_BY_ID } from '../../data/sources';
import { buildPreopNote, type PreopNoteInput } from '../preopNote';

const EMPTY: PreopNoteInput = {
  ageYears: null,
  sex: null,
  tbwKg: null,
  heightCm: null,
  creatinineUmolL: null,
  asaClass: null,
  asaEmergency: false,
  fasting: null,
  scoreAnswers: {},
  medsTaken: {},
};
// A man, 70 y, 70 kg, 170 cm, creatinine 1.0 mg/dL: CrCl 68 mL/min.
const MAN: PreopNoteInput = { ...EMPTY, ageYears: 70, sex: 'male', tbwKg: 70, heightCm: 170, creatinineUmolL: 88.4 };

const lines = (note: string) => note.split('\n');

describe('buildPreopNote: the fixed lines', () => {
  it('gives the expected lines for a fixed input', () => {
    const note = buildPreopNote({ ...MAN, asaClass: 'III', asaEmergency: true, fasting: 'Meets local fasting protocol' });
    const l = lines(note);
    expect(l[0]).toBe('--- PRE-OP ASSESSMENT NOTE (anonymous) ---');
    expect(l).toContain('Age: 70 y; Sex: male; Weight: 70.0 kg; Height: 170 cm; BMI: 24.2 kg/m²');
    expect(l).toContain('Creatinine: 1.0 mg/dL (88 µmol/L)');
    expect(l).toContain('Creatinine clearance: 68 mL/min (Cockcroft-Gault, actual body weight) [Cockcroft-Gault, App generic]');
    expect(l).toContain('ASA: III-E');
    expect(l).toContain('Fasting: Meets local fasting protocol');
    expect(l).toContain(`App data version: ${DATA_VERSION}`);
    expect(l[l.length - 1]).toBe('No patient identifiers included.');
  });

  it('writes the ASA class without E unless the flag is set, and ignores the flag with no class', () => {
    expect(lines(buildPreopNote({ ...MAN, asaClass: 'II' }))).toContain('ASA: II');
    expect(lines(buildPreopNote({ ...MAN, asaClass: null, asaEmergency: true }))).toContain('ASA: not recorded');
  });
});

describe('buildPreopNote: missing values', () => {
  it('never invents a value: an empty input reads not entered / incomplete / not recorded', () => {
    const note = buildPreopNote(EMPTY);
    const l = lines(note);
    expect(l).toContain('Age: not entered; Sex: not entered; Weight: not entered; Height: not entered; BMI: not entered');
    expect(l).toContain('Creatinine: not entered');
    expect(l).toContain('Creatinine clearance: incomplete (needs age, actual weight, biological sex, serum creatinine)');
    expect(l).toContain('ASA: not recorded');
    expect(l).toContain('Fasting: not recorded');
    expect(l.find((x) => x.startsWith('Revised Cardiac Risk Index'))).toContain('incomplete (needs serum creatinine)');
    expect(l.find((x) => x.startsWith('STOP-Bang'))).toContain('incomplete (needs');
    expect(note).not.toMatch(/NaN|undefined|null/);
  });

  it('treats a NaN number as not entered', () => {
    const note = buildPreopNote({ ...MAN, tbwKg: Number.NaN });
    expect(lines(note)).toContain('Age: 70 y; Sex: male; Weight: not entered; Height: 170 cm; BMI: not entered');
    expect(note).not.toMatch(/NaN/);
  });
});

describe('buildPreopNote: scores', () => {
  it('reports each Assess score with its points, band and source tags', () => {
    const l = lines(
      buildPreopNote({ ...MAN, scoreAnswers: { 'rcri-high-risk-surgery': true, 'rcri-ihd': true, 'sb-snoring': true } }),
    );
    expect(l).toContain('Revised Cardiac Risk Index (RCRI): 2 / 6 (2 factors) [RCRI 1999]');
    expect(l).toContain('STOP-Bang (obstructive sleep apnea screen): 3 / 8 (Intermediate risk) [STOP-Bang 2016, STOP 2008]');
  });
});

describe('buildPreopNote: medications', () => {
  it('with nothing ticked, says the app covers only three classes (an empty list is not "no medications")', () => {
    const note = buildPreopNote(MAN);
    expect(note).toContain('Medications ticked in the app: none (the app covers only SGLT2 inhibitors, DOACs and GLP-1 receptor agonists)');
  });

  it('SGLT2: each drug carries its own label timing, ertugliflozin 4 days, and the restart line', () => {
    const note = buildPreopNote({ ...MAN, medsTaken: { sglt2i: true } });
    expect(note).toContain('- SGLT2 inhibitors: Hold.');
    for (const d of SGLT2_RULE.drugs) {
      expect(note).toContain(d.timings[0].text);
      expect(note).toContain(`Restart: ${d.restart}`);
    }
    expect(lines(note).find((x) => x.includes('Ertugliflozin'))).toContain('at least 4 days');
  });

  it('DOAC: always carries the not-ASRA caution, and apixaban keeps both its lines', () => {
    const note = buildPreopNote({ ...MAN, medsTaken: { doac: true } });
    expect(note).toContain(`Caution: ${DOAC_RULE.cautions![0]}`);
    const apixaban = lines(note).find((x) => x.includes('Apixaban'))!;
    expect(apixaban).toContain('at least 48 hours');
    expect(apixaban).toContain('at least 24 hours');
  });

  it('dabigatran shows the line that fits the CrCl: 68 mL/min is 1 to 2 days, 34 mL/min is 3 to 5 days', () => {
    const at68 = lines(buildPreopNote({ ...MAN, medsTaken: { doac: true } })).find((x) => x.includes('Dabigatran'))!;
    expect(at68).toContain('1 to 2 days');
    expect(at68).not.toContain('3 to 5 days');
    expect(at68).toContain('this patient: CrCl 68 mL/min');
    const at34 = lines(buildPreopNote({ ...MAN, creatinineUmolL: 176.8, medsTaken: { doac: true } })).find((x) => x.includes('Dabigatran'))!;
    expect(at34).toContain('3 to 5 days');
    expect(at34).not.toContain('1 to 2 days');
  });

  it('dabigatran shows both lines, marked, when there is no CrCl', () => {
    const line = lines(buildPreopNote({ ...EMPTY, medsTaken: { doac: true } })).find((x) => x.includes('Dabigatran'))!;
    expect(line).toContain('1 to 2 days');
    expect(line).toContain('3 to 5 days');
    expect(line).toContain('(CrCl not available)');
  });

  it('GLP-1: states no timing of its own', () => {
    const note = buildPreopNote({ ...EMPTY, medsTaken: { glp1ra: true } });
    expect(note).toContain('- GLP-1 receptor agonists: Individualise.');
    expect(note).not.toMatch(/\b\d+\s*(h|hours?|days?|weeks?)\b/i);
  });
});

describe('buildPreopNote: sources and privacy', () => {
  it('every source tag in the note is a real source tag', () => {
    const real = new Set(Object.values(SOURCE_BY_ID).map((s) => s.tag));
    const note = buildPreopNote({
      ...MAN,
      scoreAnswers: { 'rcri-ihd': true },
      medsTaken: { sglt2i: true, doac: true, glp1ra: true },
    });
    let seen = 0;
    for (const l of lines(note)) {
      const m = l.match(/\[([^\]]+)\]$/);
      if (!m) continue;
      for (const tag of m[1].split(', ')) {
        seen += 1;
        expect(real.has(tag), `unknown tag "${tag}" in: ${l}`).toBe(true);
      }
    }
    expect(seen).toBeGreaterThan(8);
  });

  it('accepts only fixed choices for ASA class and fasting status (no free text)', () => {
    // @ts-expect-error a name is not an ASA class
    const a: PreopNoteInput = { ...EMPTY, asaClass: 'Mrs Smith' };
    // @ts-expect-error free text is not a fasting status
    const f: PreopNoteInput = { ...EMPTY, fasting: 'ate at 3pm' };
    expect([a, f]).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx.cmd vitest run src/lib/__tests__/preopNote.test.ts` (PowerShell).
Expected: FAIL, cannot resolve `../preopNote`.

- [ ] **Step 3: Write the builder**

Create `src/lib/preopNote.ts`:

```ts
// Anonymous pre-op note. The input holds only numbers and fixed pick-lists, so free text cannot get in.
// It reuses the app's own calculations, so the note cannot disagree with the screens.

import { PERIOP_RULES, type PeriopAction } from '../data/periopMeds';
import { RISK_SCORES } from '../data/riskScores';
import { DATA_VERSION, SOURCE_BY_ID } from '../data/sources';
import { calculateBmi, type Sex } from './calc/biometrics';
import { creatinineClearance } from './calc/crcl';
import { matchTimings } from './calc/periopMeds';
import { scoreResult } from './calc/scores';
import { creatinineFromUmol } from './calc/units';

export const ASA_CLASSES = ['I', 'II', 'III', 'IV', 'V', 'VI'] as const;
export type AsaClass = (typeof ASA_CLASSES)[number];

/** Categories the clinician picks; the app attaches no logic to them. */
export const FASTING_STATUSES = ['Meets local fasting protocol', 'Does not meet local fasting protocol'] as const;
export type FastingStatus = (typeof FASTING_STATUSES)[number];

export interface PreopNoteInput {
  ageYears: number | null;
  sex: Sex | null;
  tbwKg: number | null;
  heightCm: number | null;
  creatinineUmolL: number | null;
  asaClass: AsaClass | null;
  asaEmergency: boolean;
  fasting: FastingStatus | null;
  scoreAnswers: Record<string, boolean>;
  medsTaken: Record<string, boolean>;
}

const ACTION_LABEL: Record<PeriopAction, string> = {
  continue: 'Continue',
  hold: 'Hold',
  modify: 'Modify',
  individualise: 'Individualise',
};

const finite = (v: number | null): v is number => v !== null && Number.isFinite(v);

const tags = (ids: string[]): string => `[${[...new Set(ids.map((id) => SOURCE_BY_ID[id]?.tag ?? id))].join(', ')}]`;

export const buildPreopNote = (input: PreopNoteInput): string => {
  const age = finite(input.ageYears) ? input.ageYears : null;
  const weight = finite(input.tbwKg) ? input.tbwKg : null;
  const height = finite(input.heightCm) && input.heightCm > 0 ? input.heightCm : null;
  const creatinine = finite(input.creatinineUmolL) && input.creatinineUmolL > 0 ? input.creatinineUmolL : null;
  const bmi = weight !== null && height !== null ? calculateBmi(weight, height) : null;

  const crcl = creatinineClearance({ ageYears: age, tbwKg: weight, sex: input.sex, creatinineUmolL: creatinine });
  const crclMl = crcl.kind === 'ok' ? crcl.mlPerMin : null;
  const ctx = { ageYears: age, sex: input.sex, bmi, creatinineUmolL: creatinine };

  const lines: string[] = ['--- PRE-OP ASSESSMENT NOTE (anonymous) ---'];

  lines.push(
    [
      `Age: ${age === null ? 'not entered' : `${age} y`}`,
      `Sex: ${input.sex ?? 'not entered'}`,
      `Weight: ${weight === null ? 'not entered' : `${weight.toFixed(1)} kg`}`,
      `Height: ${height === null ? 'not entered' : `${Math.round(height)} cm`}`,
      `BMI: ${bmi === null ? 'not entered' : `${bmi.toFixed(1)} kg/m²`}`,
    ].join('; '),
  );
  lines.push(
    creatinine === null
      ? 'Creatinine: not entered'
      : `Creatinine: ${creatinineFromUmol(creatinine, 'mgdl').toFixed(1)} mg/dL (${Math.round(creatinine)} µmol/L)`,
  );
  lines.push(
    crcl.kind === 'ok'
      ? `Creatinine clearance: ${Math.round(crcl.mlPerMin)} mL/min (Cockcroft-Gault, actual body weight) ${tags(['cockcroft-gault-1976', 'app-generic'])}`
      : `Creatinine clearance: incomplete (needs ${crcl.missing.join(', ')})`,
  );
  lines.push(input.asaClass === null ? 'ASA: not recorded' : `ASA: ${input.asaClass}${input.asaEmergency ? '-E' : ''}`);
  lines.push(`Fasting: ${input.fasting ?? 'not recorded'}`);

  for (const score of RISK_SCORES) {
    const r = scoreResult(score, input.scoreAnswers, ctx);
    if (r.kind === 'ok') lines.push(`${score.name}: ${r.points} / ${r.max} (${r.band.label}) ${tags(score.sourceIds)}`);
    else if (r.kind === 'incomplete') lines.push(`${score.name}: incomplete (needs ${r.missing.join(', ')})`);
    else lines.push(`${score.name}: not applicable`);
  }

  const taken = PERIOP_RULES.filter((r) => input.medsTaken[r.id]);
  if (taken.length === 0) {
    lines.push('Medications ticked in the app: none (the app covers only SGLT2 inhibitors, DOACs and GLP-1 receptor agonists)');
  } else {
    lines.push('Medications ticked in the app:');
    for (const rule of taken) {
      lines.push(`- ${rule.drugClass}: ${ACTION_LABEL[rule.action]}. ${rule.summary} ${tags(rule.sourceIds)}`);
      for (const c of rule.cautions ?? []) lines.push(`  Caution: ${c}`);
      for (const d of rule.drugs) {
        const timing = matchTimings(d, crclMl)
          .filter((m) => m.match !== 'no')
          .map(({ timing: t, match }) => {
            const note = match === 'unknown' ? ' (CrCl not available)' : match === 'yes' && crclMl !== null ? ` (this patient: CrCl ${Math.round(crclMl)} mL/min)` : '';
            return `${t.when ? `${t.when}: ` : ''}${t.text}${note}`;
          })
          .join(' ');
        lines.push(`  ${d.name}: ${timing} Restart: ${d.restart} ${tags([d.sourceId])}`);
      }
    }
  }

  lines.push(`App data version: ${DATA_VERSION}`);
  lines.push('No patient identifiers included.');
  return lines.join('\n');
};
```

- [ ] **Step 4: Run the tests**

Run: `npx.cmd vitest run src/lib/__tests__/preopNote.test.ts`
Expected: PASS (13 tests: 2 + 2 + 1 + 6 + 2). If an expected line differs in wording only (for example the STOP-Bang band label), **stop and report the exact difference**; do not edit the data to match.

Run: `npm run verify`
Expected: all tests pass, type-check clean, build succeeds (the two `@ts-expect-error` lines must each suppress a real error).

- [ ] **Step 5: Commit**

```bash
git add src/lib/preopNote.ts src/lib/__tests__/preopNote.test.ts
git commit -m "feat(preop-note): add the pure anonymous pre-op note builder"
```

---

### Task 2: Store, copyText move and the panel

**Files:**
- Modify: `src/store/useAppStore.ts`, `src/store/__tests__/assess.test.ts`, `src/views/ChecklistsView.tsx`, `src/App.tsx`
- Create: `src/lib/copyText.ts`, `src/components/PreopNotePanel.tsx`

**Interfaces:**
- Consumes: `ASA_CLASSES`, `FASTING_STATUSES`, `AsaClass`, `FastingStatus`, `buildPreopNote` (Task 1); `ScoreItem` (exported from `ScorePanel.tsx`); `SegmentedControl`, `Panel`, `WarningBanner`.
- Produces: store fields `asaClass: AsaClass | null`, `asaEmergency: boolean`, `fastingStatus: FastingStatus | null` and actions `setAsaClass`, `setAsaEmergency`, `setFastingStatus` (all memory only); `copyText(text): Promise<boolean>`; `PreopNotePanel`.

- [ ] **Step 1: Write the failing tests**

In `src/store/__tests__/assess.test.ts`:
- Change the forbidden list in the first test to `['patient', 'creatinineUmolL', 'scoreAnswers', 'medsTaken', 'choiceAnswers', 'asaClass', 'asaEmergency', 'fastingStatus']`.
- Add inside the `describe`:

```ts
  it('records the ASA class, the E flag and the fasting status, and New case clears them', () => {
    useAppStore.getState().setAsaClass('III');
    useAppStore.getState().setAsaEmergency(true);
    useAppStore.getState().setFastingStatus('Meets local fasting protocol');
    expect(useAppStore.getState().asaClass).toBe('III');
    expect(useAppStore.getState().asaEmergency).toBe(true);
    expect(useAppStore.getState().fastingStatus).toBe('Meets local fasting protocol');
    useAppStore.getState().newCase();
    expect(useAppStore.getState().asaClass).toBeNull();
    expect(useAppStore.getState().asaEmergency).toBe(false);
    expect(useAppStore.getState().fastingStatus).toBeNull();
  });
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx.cmd vitest run src/store/__tests__/assess.test.ts`
Expected: FAIL (`setAsaClass` is not a function).

- [ ] **Step 3: Store changes**

In `src/store/useAppStore.ts`:
1. Add the import `import type { AsaClass, FastingStatus } from '../lib/preopNote';` next to the other `../lib/...` type imports.
2. In `AppState`, after `  choiceAnswers: Record<string, number>;` add:

```ts
  asaClass: AsaClass | null;
  asaEmergency: boolean;
  fastingStatus: FastingStatus | null;
```

3. In `AppState`, after `  setChoiceAnswer: (itemId: string, optionIndex: number) => void;` add:

```ts
  setAsaClass: (value: AsaClass | null) => void;
  setAsaEmergency: (value: boolean) => void;
  setFastingStatus: (value: FastingStatus | null) => void;
```

4. In the initial state, after `      choiceAnswers: {},` add:

```ts
      asaClass: null,
      asaEmergency: false,
      fastingStatus: null,
```

5. In `newCase`, after `          choiceAnswers: {},` add:

```ts
          asaClass: null,
          asaEmergency: false,
          fastingStatus: null,
```

6. After the `setChoiceAnswer: ...` action add:

```ts
      setAsaClass: (asaClass) => set({ asaClass }),
      setAsaEmergency: (asaEmergency) => set({ asaEmergency }),
      setFastingStatus: (fastingStatus) => set({ fastingStatus }),
```

Do **not** add these to `partialize` and do **not** change the persist `version`.

- [ ] **Step 4: Move `copyText`**

Create `src/lib/copyText.ts` with exactly the function now in `ChecklistsView.tsx`, exported:

```ts
/** Copies text to the clipboard. Awaits the async clipboard API and falls back to a hidden textarea if it is blocked. */
export const copyText = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
};
```

In `src/views/ChecklistsView.tsx`: delete the local `const copyText = async (text: string): Promise<boolean> => { ... };` block (about 21 lines, just above `const HandoffForm`) and add `import { copyText } from '../lib/copyText';` with the other `../lib/...` imports. Change nothing else in that file.

- [ ] **Step 5: The panel**

Create `src/components/PreopNotePanel.tsx`:

```tsx
import React, { useEffect, useMemo, useState } from 'react';
import { Check, ClipboardCopy } from 'lucide-react';
import { copyText } from '../lib/copyText';
import { ASA_CLASSES, FASTING_STATUSES, buildPreopNote, type AsaClass } from '../lib/preopNote';
import { useAppStore } from '../store/useAppStore';
import { Panel } from './hud/Panel';
import { ScoreItem } from './ScorePanel';
import { SegmentedControl } from './ui/SegmentedControl';
import { WarningBanner } from './ui/WarningBanner';

const ASA_OPTIONS = ASA_CLASSES.map((c) => ({ value: c, label: c }));

/** Pre-op note: ASA class and fasting status picks, a live preview, and a Copy button. Nothing here is stored. */
export const PreopNotePanel: React.FC = () => {
  const patient = useAppStore((s) => s.patient);
  const scoreAnswers = useAppStore((s) => s.scoreAnswers);
  const medsTaken = useAppStore((s) => s.medsTaken);
  const asaClass = useAppStore((s) => s.asaClass);
  const asaEmergency = useAppStore((s) => s.asaEmergency);
  const fastingStatus = useAppStore((s) => s.fastingStatus);
  const setAsaClass = useAppStore((s) => s.setAsaClass);
  const setAsaEmergency = useAppStore((s) => s.setAsaEmergency);
  const setFastingStatus = useAppStore((s) => s.setFastingStatus);
  const [copied, setCopied] = useState<'idle' | 'ok' | 'fail'>('idle');

  const text = useMemo(
    () =>
      buildPreopNote({
        ageYears: patient.ageYears,
        sex: patient.sex,
        tbwKg: patient.tbwKg,
        heightCm: patient.heightCm,
        creatinineUmolL: patient.creatinineUmolL,
        asaClass,
        asaEmergency,
        fasting: fastingStatus,
        scoreAnswers,
        medsTaken,
      }),
    [patient, scoreAnswers, medsTaken, asaClass, asaEmergency, fastingStatus],
  );

  // A note that changed after it was copied is no longer the copied note.
  useEffect(() => setCopied('idle'), [text]);

  return (
    <div className="mb-3 flex flex-col gap-3">
      <Panel title="Pre-op note">
        <div className="flex flex-col gap-1.5">
          <h4 className="text-sm font-bold text-slate-100">ASA physical status class</h4>
          <SegmentedControl<AsaClass> ariaLabel="ASA physical status class" value={asaClass} options={ASA_OPTIONS} onChange={setAsaClass} />
          <ScoreItem label="Emergency (E)" checked={asaEmergency} locked={false} onToggle={() => setAsaEmergency(!asaEmergency)} />
        </div>

        <div className="flex flex-col gap-1.5">
          <h4 className="text-sm font-bold text-slate-100">Fasting status</h4>
          <div role="radiogroup" aria-label="Fasting status" className="flex flex-col gap-1.5">
            {FASTING_STATUSES.map((f) => (
              <button
                key={f}
                type="button"
                role="radio"
                aria-checked={fastingStatus === f}
                onClick={() => setFastingStatus(f)}
                className={`min-h-[48px] w-full rounded-xl border p-3 text-left text-sm font-semibold touch-manipulation ${
                  fastingStatus === f ? 'border-cyan-400 bg-cyan-500 text-black' : 'border-clinical-border bg-clinical-card/50 text-slate-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <WarningBanner level="info" title="What this note contains">
          It contains the age, sex, weight, height, BMI and creatinine entered above, with no name, no identifier and no free text. It is built here, never stored, and copied only when you tap Copy. Paste it only where patient data is allowed.
        </WarningBanner>

        <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-clinical-border bg-clinical-bg/60 p-3 font-mono text-xs text-slate-200">{text}</pre>

        <button
          type="button"
          onClick={async () => setCopied((await copyText(text)) ? 'ok' : 'fail')}
          className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-cyan-500 font-black uppercase text-black"
        >
          {copied === 'ok' ? <Check className="h-5 w-5" /> : <ClipboardCopy className="h-5 w-5" />}
          {copied === 'ok' ? 'Copied' : 'Copy note to clipboard'}
        </button>
        {copied === 'fail' && <WarningBanner level="red">Copy was blocked by the browser. Select the preview text and copy it manually.</WarningBanner>}
      </Panel>
    </div>
  );
};
```

In `src/App.tsx`: add `import { PreopNotePanel } from './components/PreopNotePanel';` after the `import { MedsPanel } ...` line, and put the panel **after** the Pre-op checklist:

```tsx
          <AssessView />
          <MedsPanel />
          <ChecklistsView phaseLists={listsFor('preop')} />
          <PreopNotePanel />
```

- [ ] **Step 6: Run the tests**

Run: `npx.cmd vitest run src/store/__tests__/assess.test.ts src/lib/__tests__/handoff.test.ts src/lib/__tests__/preopNote.test.ts`
Expected: PASS (the handoff tests must pass untouched).

Run: `npm run verify`
Expected: all tests pass, type-check clean, build succeeds.

- [ ] **Step 7: Check by hand**

Run `npm run dev`, open the URL it prints (use a free port; stop the server when done). Check in **both Light and Dark**.
- **Pre-op tab:** below the Fasting / NPO checklist there is a **Pre-op note** panel: an ASA class row (I to VI) with an Emergency (E) checkbox, a Fasting status choice of two, an info banner, a monospace preview and a **Copy note to clipboard** button. Nothing is pre-selected.
- With nothing entered the preview reads `Age: not entered; ...`, `Creatinine: not entered`, `Creatinine clearance: incomplete (needs ...)`, `ASA: not recorded`, `Fasting: not recorded`, both scores `incomplete`, `Medications ticked in the app: none (the app covers only ...)`, then the data version and `No patient identifiers included.` No `NaN`, `undefined` or `null` anywhere.
- Enter a man, 70 y, 70 kg, 170 cm, creatinine 1.0 mg/dL: the preview shows `Age: 70 y; Sex: male; Weight: 70.0 kg; Height: 170 cm; BMI: 24.2 kg/m²`, `Creatinine: 1.0 mg/dL (88 µmol/L)` and `Creatinine clearance: 68 mL/min ...`. Pick ASA **III** and tick Emergency: `ASA: III-E`. Pick a fasting status: the line follows.
- Tick **SGLT2 inhibitors**: each drug appears with its label timing and restart line (ertugliflozin 4 days). Tick **DOACs**: the Caution line is there, apixaban shows both its lines, and dabigatran shows only the `1 to 2 days` line with `(this patient: CrCl 68 mL/min)`. Change creatinine to 2.0 mg/dL: dabigatran flips to `3 to 5 days`. Clear the age: dabigatran shows both lines with `(CrCl not available)`. Tick **GLP-1 receptor agonists**: one line with no timing.
- Tick two RCRI items and one STOP-Bang item: the score lines show the points and band with their source tags.
- Tap **Copy note to clipboard**: the button shows **Copied**; paste into a text editor and confirm it matches the preview exactly. Changing any input resets the button to Copy.
- **New case** clears the ASA class, the E flag and the fasting status (and the preview goes back to the empty form). Reload: nothing is selected, and `localStorage` (DevTools > Application) has no ASA, fasting or note data under `anesthassist-storage`.
- **The handoff still works:** Post-op > Handoff summary, **Copy summary to clipboard** still copies, and its text still contains no weight, height or biometrics.
- Report what you saw per bullet. Do not fix visual issues silently; list them.

- [ ] **Step 8: Commit**

```bash
git add src/store src/lib/copyText.ts src/views/ChecklistsView.tsx src/components/PreopNotePanel.tsx src/App.tsx
git commit -m "feat(preop-note): add the Pre-op note panel and move copyText to a shared module"
```

---

### Task 3: Docs

**Files:**
- Modify: `README.md`, `docs/superpowers/specs/2026-11-17-perioperative-guide-design.md`

- [ ] **Step 1: README**

In `README.md`:
1. Replace `**Intra-op** holds Dosing, Airway, Vent and Lists, with a switch at the top.` with `A **Pre-op note** below the Fasting / NPO checklist builds an anonymous plain-text summary (with a Copy button) of the numbers, ASA class, fasting status, scores and ticked medications. **Intra-op** holds Dosing, Airway, Vent and Lists, with a switch at the top.`
2. In "What is and is not stored", replace `risk-score and 4AT answers, ticked medications,` with `risk-score and 4AT answers, ASA class, emergency flag and fasting-status picks, ticked medications,`.
3. In the "Never done" paragraph, replace `adds no weight, height or biometrics.` with `adds no weight, height or biometrics. The pre-op note does include the age, sex, weight, height, BMI and creatinine you enter, but it is built only on screen, never stored, and copied to the clipboard only when you tap Copy; it has no free-text field and no identifier, so paste it only where patient data is allowed.`

If an anchor is not found exactly once, stop and report.

- [ ] **Step 2: Spec**

In the spec's §10 rollout list, replace the line `6. **Pre-op note**, plus the README privacy section updated for the note's biometrics.` with:

```
6. **Pre-op note** (plan: `docs/superpowers/plans/2026-11-17-preop-note.md`): a pure `buildPreopNote` over numbers and fixed pick-lists only (no free-text field), reusing the CrCl, score and medication-timing code so the note cannot disagree with the screens. It lists age, sex, weight, height, BMI, creatinine (both units), CrCl, ASA class with a separate E flag, a two-choice fasting status, the Assess scores, and the ticked medications with their label wording (dabigatran by CrCl), each sourced line ending with its tag and the note ending with the app data version. It resolves the step 2 ASA-picker deferral (class and E flag only; no surgical-risk grade, no source registered). The ASA, E and fasting picks are in memory only and cleared by New case; the note is never stored and reaches the clipboard only on a Copy tap. `copyText` moved to `src/lib/copyText.ts`. The README privacy section now states that the note carries biometrics while the handoff does not. **Deferred:** comorbidity plans in the note (step 7), and Apfel and 4AT (Post-op tools).
```

- [ ] **Step 3: Verify and commit**

Run: `npm run verify`
Expected: PASS.

```bash
git add README.md docs/superpowers/specs/2026-11-17-perioperative-guide-design.md
git commit -m "docs: record the Pre-op note and its privacy in the README and spec step 6"
```
