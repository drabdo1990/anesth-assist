# PACU Discharge Scores (Step 5b) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the modified Aldrete score and the Postanesthesia Discharge Scoring System (PADSS) to the Post-op tab as tap-to-score calculators with the 9-of-10 discharge mark, each disputed item carrying a visible note.

**Architecture:** Both are `ChoiceScore` records in `src/data/choiceScores.ts`, so the existing `choiceScoreResult` and `ChoiceScorePanel` do all the work; answers go in the existing memory-only `choiceAnswers` (cleared by New case). No new component, store field or calculation.

**Tech Stack:** React 19, TypeScript, Zustand 5, Tailwind 3.4, Vitest 4.

**Spec:** `docs/superpowers/specs/2026-11-17-perioperative-guide-design.md` (§2 Post-op row, §6 Post-op tab, §10 step 5 deferrals).

## Scope decisions

- **Source text:** the item tables were read on 2026-11-17 from the project notebook: Miller's Anesthesia 6th edition, Table 71-4 ("Two examples of discharge criteria systems") with its text ("a score of at least 9 out of 10"), and Table 68-18 with its text ("a score of 9 or greater and have an adult escort"); and *Clinical Cases in Anesthesia*, Tables 78.1 and 78.2 ("A score of 9 in the Aldrete system indicates that the patient is ready for phase II recovery"; PADSS "When the score is 9 or greater the patient is ready for discharge"). The primary papers (Aldrete 1995 letter; Chung 1995; Marshall and Chung 1999) were not readable.
- **Where the two books disagree, the user chose (2026-11-17) the internally consistent wording plus a note on the item:**
  - Aldrete circulation: bands in **percent** (Clinical Cases); Miller 6e prints "± 20 / 20–50 / 50 mm".
  - Aldrete oxygen saturation, 0 points: **below 90% even with oxygen** (Clinical Cases); Miller 6e prints "below 92% with oxygen", which overlaps its own 1-point level.
  - PADSS pain "not acceptable": **0 points** (Clinical Cases); Miller 6e prints 1.
- **Version:** the PADSS encoded is the revised version with pain as acceptable yes/no (Marshall and Chung 1999, as both books print it), not the 1995 original with pain minimal/moderate/severe.
- **Out:** PONV antiemetic doses (only pre-2025 textbook figures are available; the app keeps showing no PONV dose), the analgesia plan (its own step, from the 2026 ASA regional-analgesia guideline in the notebook), pediatric PONV risk.

## Global Constraints

- Every record cites `sourceIds` that resolve in `src/data/sources.ts`.
- Nothing is pre-selected; an unanswered item reads "Incomplete" (existing `choiceScoreResult` behaviour).
- Answers stay in memory only (existing `choiceAnswers`); nothing new is persisted.
- Bump `DATA_VERSION` from `2026.11.17-draft21` to `2026.11.17-draft22` (Task 1 only).
- `SOURCES_WITHOUT_DERIVED_VALUES` is compared by exact equality: remove an id from it exactly when a record starts citing it.
- Copy every clinical string from this plan verbatim.

## Review Focus

1. **The pass mark sits at 9:** totals of 10 and 9 meet it, 8 does not (Task 1 calc test).
2. **The disputed pain item:** "not acceptable" with every other item perfect gives 8, below the mark (Task 1 calc test).
3. **Disputed items are flagged on screen:** the three item prompts name the other textbook (Task 1 data test).
4. **No silent defaults:** an unanswered item keeps the result "Incomplete" (Task 1 calc test; Task 2 manual check).
5. **New case clears the answers** (existing `choiceAnswers` reset; Task 2 manual check).

---

### Task 1: The two scores and their sources

**Files:**
- Modify: `src/data/choiceScores.ts`
- Modify: `src/data/sources.ts`
- Modify: `src/data/derived.ts` (`SOURCES_WITHOUT_DERIVED_VALUES`)
- Test: `src/data/__tests__/choiceScores.test.ts`, `src/lib/calc/__tests__/choiceScores.test.ts`

**Interfaces:**
- Produces: `MODIFIED_ALDRETE: ChoiceScore`, `PADSS: ChoiceScore`, and `CHOICE_SCORES = [MODIFIED_ALDRETE, PADSS, FOUR_AT]` from `src/data/choiceScores.ts`.

- [ ] **Step 1: Write the failing tests**

In `src/data/__tests__/choiceScores.test.ts`, change the import line to:

```ts
import { CHOICE_SCORES, FOUR_AT, MODIFIED_ALDRETE, PADSS } from '../choiceScores';
```

and add these tests inside the `describe('choice score records', …)` block, after the last existing `it`:

```ts
  it('Aldrete and PADSS: five items scored out of 10, with the discharge mark at 9', () => {
    expect(MODIFIED_ALDRETE.items.map((i) => i.options.map((o) => o.points))).toEqual([[2, 1, 0], [2, 1, 0], [2, 1, 0], [2, 1, 0], [2, 1, 0]]);
    expect(PADSS.items.map((i) => i.options.map((o) => o.points))).toEqual([[2, 1, 0], [2, 1, 0], [2, 1, 0], [2, 0], [2, 1, 0]]);
    for (const s of [MODIFIED_ALDRETE, PADSS]) expect(s.bands.map((b) => b.min), s.id).toEqual([0, 9]);
  });

  it('Aldrete and PADSS: flag the three items the two textbooks word differently', () => {
    const prompt = (s: typeof PADSS, id: string) => s.items.find((i) => i.id === id)?.prompt ?? '';
    expect(prompt(MODIFIED_ALDRETE, 'aldrete-circulation')).toContain('Miller 6e');
    expect(prompt(MODIFIED_ALDRETE, 'aldrete-spo2')).toContain('Miller 6e');
    expect(prompt(PADSS, 'padss-pain')).toContain('Miller 6e');
  });

  it('lists the scores in the order the Post-op tab shows them', () => {
    expect(CHOICE_SCORES.map((s) => s.id)).toEqual(['modified-aldrete', 'padss', '4at']);
  });
```

In `src/lib/calc/__tests__/choiceScores.test.ts`, change the import of the data file to:

```ts
import { FOUR_AT, MODIFIED_ALDRETE, PADSS } from '../../../data/choiceScores';
```

and add at the end of the file:

```ts
describe('PACU discharge scores', () => {
  const pick = (s: typeof PADSS, ...idx: number[]): Record<string, number> => Object.fromEntries(s.items.slice(0, idx.length).map((it, i) => [it.id, idx[i]]));

  it('Aldrete: 10 and 9 meet the discharge mark, 8 does not', () => {
    const r10 = choiceScoreResult(MODIFIED_ALDRETE, pick(MODIFIED_ALDRETE, 0, 0, 0, 0, 0));
    const r9 = choiceScoreResult(MODIFIED_ALDRETE, pick(MODIFIED_ALDRETE, 0, 0, 0, 0, 1));
    const r8 = choiceScoreResult(MODIFIED_ALDRETE, pick(MODIFIED_ALDRETE, 1, 0, 0, 0, 1));
    expect(r10.kind === 'ok' && [r10.points, r10.max, r10.band.min]).toEqual([10, 10, 9]);
    expect(r9.kind === 'ok' && [r9.points, r9.band.min]).toEqual([9, 9]);
    expect(r8.kind === 'ok' && [r8.points, r8.band.min]).toEqual([8, 0]);
  });

  it('PADSS: pain not acceptable takes an otherwise perfect score to 8, below the mark', () => {
    const r = choiceScoreResult(PADSS, pick(PADSS, 0, 0, 0, 1, 0));
    expect(r.kind === 'ok' && [r.points, r.max, r.band.min]).toEqual([8, 10, 0]);
  });

  it('PADSS: stays incomplete until every item is answered', () => {
    expect(choiceScoreResult(PADSS, pick(PADSS, 0, 0, 0, 0)).kind).toBe('incomplete');
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx.cmd vitest run src/data/__tests__/choiceScores.test.ts src/lib/calc/__tests__/choiceScores.test.ts`
Expected: FAIL (`MODIFIED_ALDRETE` / `PADSS` are not exported).

- [ ] **Step 3: Add the two scores**

In `src/data/choiceScores.ts`, directly under the existing header line `// The 4AT wording and points are copied from the 4AT form, version 1 (supplementary appendix of Bellelli 2014).`, add:

```ts
// The modified Aldrete score and PADSS wording comes from Miller 6e (Table 71-4) and Clinical Cases in Anesthesia (Tables 78.1 and 78.2).
```

Then add, directly before `export const CHOICE_SCORES`:

```ts
export const MODIFIED_ALDRETE: ChoiceScore = {
  id: 'modified-aldrete',
  name: 'Modified Aldrete score (PACU discharge)',
  items: [
    {
      id: 'aldrete-activity',
      label: 'Activity',
      options: [
        { label: 'Moves all extremities voluntarily or on command', points: 2 },
        { label: 'Moves two extremities', points: 1 },
        { label: 'Unable to move extremities', points: 0 },
      ],
    },
    {
      id: 'aldrete-respiration',
      label: 'Respiration',
      options: [
        { label: 'Breathes deeply and coughs freely', points: 2 },
        { label: 'Dyspneic, shallow or limited breathing', points: 1 },
        { label: 'Apneic', points: 0 },
      ],
    },
    {
      id: 'aldrete-circulation',
      label: 'Circulation',
      prompt: "Textbooks differ: Clinical Cases in Anesthesia gives these bands in percent; Miller 6e prints them as ± 20, 20 to 50 and 50 mm of the pre-anesthetic level. Use your unit's form if it differs.",
      options: [
        { label: 'Blood pressure within ± 20% of the pre-anesthetic level', points: 2 },
        { label: 'Blood pressure ± 20% to 50% of the pre-anesthetic level', points: 1 },
        { label: 'Blood pressure more than ± 50% from the pre-anesthetic level', points: 0 },
      ],
    },
    {
      id: 'aldrete-consciousness',
      label: 'Consciousness',
      options: [
        { label: 'Fully awake', points: 2 },
        { label: 'Arousable on calling', points: 1 },
        { label: 'Not responding', points: 0 },
      ],
    },
    {
      id: 'aldrete-spo2',
      label: 'Oxygen saturation',
      prompt: 'Textbooks differ on 0 points: this is the Clinical Cases in Anesthesia wording; Miller 6e prints "SpO2 below 92% with oxygen", which overlaps its own 1-point level.',
      options: [
        { label: 'SpO2 above 92% on room air', points: 2 },
        { label: 'Needs supplemental oxygen to keep SpO2 above 90%', points: 1 },
        { label: 'SpO2 below 90% even with oxygen', points: 0 },
      ],
    },
  ],
  bands: [
    { min: 0, label: 'Below the discharge mark', detail: 'Fewer than 9 of 10.' },
    { min: 9, label: 'Meets the discharge mark', detail: '9 or more of 10 ("at least 9 out of 10", Miller 6e). The score supports the discharge decision; it does not make it.' },
  ],
  note: 'The 1995 modification of the Aldrete score replaced skin colour with pulse oximetry. The 1995 letter could not be read, so the wording comes from two textbooks, which differ on the two items marked above. Check your local PACU discharge form.',
  why: 'Five signs (activity, breathing, blood pressure, consciousness and oxygen saturation) are each scored 0 to 2; 9 or more of 10 suggests the patient can leave the PACU.',
  sourceIds: ['aldrete-1995', 'miller-6e', 'clinical-cases-anesth'],
};

export const PADSS: ChoiceScore = {
  id: 'padss',
  name: 'PADSS (home readiness after day surgery)',
  items: [
    {
      id: 'padss-vitals',
      label: 'Vital signs (blood pressure and pulse)',
      options: [
        { label: 'Within 20% of the preoperative baseline', points: 2 },
        { label: '20% to 40% of the preoperative baseline', points: 1 },
        { label: 'More than 40% from the preoperative baseline', points: 0 },
      ],
    },
    {
      id: 'padss-activity',
      label: 'Activity',
      options: [
        { label: 'Steady gait, no dizziness (or meets the preoperative level)', points: 2 },
        { label: 'Requires assistance', points: 1 },
        { label: 'Unable to ambulate', points: 0 },
      ],
    },
    {
      id: 'padss-ponv',
      label: 'Nausea and vomiting',
      options: [
        { label: 'Minimal: treated with oral medication', points: 2 },
        { label: 'Moderate: treated with intramuscular medication', points: 1 },
        { label: 'Severe: continues after repeated treatment', points: 0 },
      ],
    },
    {
      id: 'padss-pain',
      label: 'Pain',
      prompt:
        'Pain should be acceptable to the patient and controllable with oral analgesics, and its location, type and intensity consistent with the expected discomfort. Textbooks differ on "not acceptable": Clinical Cases in Anesthesia gives 0 points, Miller 6e gives 1.',
      options: [
        { label: 'Acceptable to the patient: yes', points: 2 },
        { label: 'Acceptable to the patient: no', points: 0 },
      ],
    },
    {
      id: 'padss-bleeding',
      label: 'Surgical bleeding',
      options: [
        { label: 'Minimal: no dressing change needed', points: 2 },
        { label: 'Moderate: up to two dressing changes', points: 1 },
        { label: 'Severe: more than three dressing changes', points: 0 },
      ],
    },
  ],
  bands: [
    { min: 0, label: 'Not yet home-ready by score', detail: 'Fewer than 9 of 10.' },
    { min: 9, label: 'Home-ready by score', detail: '9 or more of 10, with an adult escort (Miller 6e). The score supports the discharge decision; it does not make it.' },
  ],
  note: 'This is the revised PADSS (Marshall and Chung 1999), as both textbooks print it, with pain scored as acceptable or not. Voiding before discharge is no longer required, except after genitourinary, gynecologic, or inguinal or perineal surgery. The two textbooks differ on the item marked above. Check your local discharge policy.',
  why: 'Five criteria (vital signs, walking, nausea and vomiting, pain and bleeding) are each scored 0 to 2; 9 or more of 10 suggests readiness to go home after day surgery.',
  sourceIds: ['padss-marshall-chung-1999', 'miller-6e', 'clinical-cases-anesth'],
};
```

Change `export const CHOICE_SCORES: ChoiceScore[] = [FOUR_AT];` to:

```ts
export const CHOICE_SCORES: ChoiceScore[] = [MODIFIED_ALDRETE, PADSS, FOUR_AT];
```

- [ ] **Step 4: Update the sources**

In `src/data/sources.ts`:

1. Change `export const DATA_VERSION = '2026.11.17-draft21';` to `export const DATA_VERSION = '2026.11.17-draft22';`.
2. In the `aldrete-1995` entry, replace the whole `accessNote` value with:
   `'Letter; PubMed record read, text not opened. Item wording and the 9-of-10 discharge mark were read on 2026-11-17 from Miller 6e (Table 71-4, "at least 9 out of 10") and Clinical Cases in Anesthesia (Table 78.1); the two differ on the circulation bands (percent or mm) and on the 0-point oxygen level.'`
3. Add this entry directly after the `padss-chung-1995` entry (after its closing `},`):

```ts
  {
    id: 'padss-marshall-chung-1999',
    tag: 'PADSS 1999',
    name: 'Discharge criteria and complications after ambulatory surgery (revised PADSS)',
    publisher: 'Marshall SI, Chung F',
    year: '1999',
    version: 'Anesth Analg 1999;88:508-17, doi 10.1097/00000539-199903000-00008',
    url: 'https://pubmed.ncbi.nlm.nih.gov/10071996/',
    tier: 3,
    scope: ['revised PADSS home-readiness score (pain scored as acceptable or not)', 'discharge at 9 or more of 10 with an adult escort'],
    verification: 'secondary',
    accessNote:
      'Review; full text not readable. Item wording and the 9-of-10 mark were read on 2026-11-17 from Miller 6e (Tables 68-18 and 71-4) and Clinical Cases in Anesthesia (Table 78.2), which attributes the table to Marshall and Chung 1999. The two books differ on the pain item: "not acceptable" scores 1 in Miller 6e and 0 in Clinical Cases.',
  },
```

4. In the `miller-6e` entry, add `'PACU discharge criteria: modified Aldrete and PADSS (Tables 68-18, 71-4)'` as the last element of its `scope` array, and append to the end of its `accessNote` string (inside the closing quote): ` Tables 68-18 and 71-4 (PACU discharge) were read from the notebook text on 2026-11-17.`
5. In the `clinical-cases-anesth` entry, add `'modified Aldrete and PADSS tables (Tables 78.1, 78.2)'` as the last element of its `scope` array, and append to the end of its `accessNote` string (inside the closing quote): ` Tables 78.1 and 78.2 (Aldrete, PADSS) were read from the notebook text on 2026-11-17; the copy has OCR damage in the Aldrete blood-pressure row.`

- [ ] **Step 5: Update the no-derived-value list**

In `src/data/derived.ts`, delete the line `  'aldrete-1995',` from `SOURCES_WITHOUT_DERIVED_VALUES` (it is now cited). Leave `'padss-chung-1995'` in the list: the 1995 original is not encoded.

- [ ] **Step 6: Run the tests**

Run: `npx.cmd vitest run src/data/__tests__/choiceScores.test.ts src/lib/calc/__tests__/choiceScores.test.ts`
Expected: PASS.

Run: `npm run verify` (if it crashes with "out of memory", run `npx.cmd vitest run --maxWorkers=1`, then `npx.cmd tsc -b`, then `npx.cmd vite build`, and say so).
Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add src/data/choiceScores.ts src/data/sources.ts src/data/derived.ts src/data/__tests__/choiceScores.test.ts src/lib/calc/__tests__/choiceScores.test.ts
git commit -m "feat(postop): add the modified Aldrete score and PADSS with the 9-of-10 discharge mark"
```

---

### Task 2: Show them on Post-op, and the docs

**Files:**
- Modify: `src/views/PostopView.tsx`
- Modify: `README.md`
- Modify: `docs/superpowers/specs/2026-11-17-perioperative-guide-design.md`

**Interfaces:**
- Consumes: `MODIFIED_ALDRETE`, `PADSS` from Task 1; the existing `ChoiceScorePanel` (`score`, `answers`, `onAnswer`).

- [ ] **Step 1: Render the scores**

In `src/views/PostopView.tsx`:
- Change `import { FOUR_AT } from '../data/choiceScores';` to `import { FOUR_AT, MODIFIED_ALDRETE, PADSS } from '../data/choiceScores';`
- Change the component comment to `/** Post-op tools: PONV risk and what the 2025 consensus advises, the PACU discharge scores and the 4AT delirium screen. All inputs live in memory only. */`
- Directly before the line `<ChoiceScorePanel score={FOUR_AT} answers={choiceAnswers} onAnswer={setChoice} />`, add:

```tsx
      <ChoiceScorePanel score={MODIFIED_ALDRETE} answers={choiceAnswers} onAnswer={setChoice} />
      <ChoiceScorePanel score={PADSS} answers={choiceAnswers} onAnswer={setChoice} />
```

- [ ] **Step 2: README**

In `README.md`, replace `**Post-op** holds the Apfel PONV risk score (adults) with what the 2025 consensus advises, the 4AT delirium screen,` with `**Post-op** holds the Apfel PONV risk score (adults) with what the 2025 consensus advises, the modified Aldrete score and PADSS with their 9-of-10 discharge mark, the 4AT delirium screen,` (the original text appears once).

- [ ] **Step 3: Spec**

In `docs/superpowers/specs/2026-11-17-perioperative-guide-design.md`, insert this line directly above the line that begins `6. **Pre-op note** (plan:`:

```markdown
5b. **PACU discharge scores** (plan: `docs/superpowers/plans/2026-11-17-pacu-discharge.md`): the modified Aldrete score and the revised PADSS (Marshall and Chung 1999) as 0–2 point calculators on Post-op with the discharge mark at 9 of 10, read from Miller 6e (Tables 68-18, 71-4) and Clinical Cases in Anesthesia (Tables 78.1, 78.2) in the project notebook, which settles the earlier "below 10" vs "9 or more" question. The primary papers were not readable. Where the books differ (Aldrete blood-pressure bands in percent or mm; Aldrete 0-point oxygen level; PADSS pain "not acceptable" = 0 or 1), the internally consistent Clinical Cases wording is encoded and each item names the other book (user decision 2026-11-17). New source `padss-marshall-chung-1999`. **Still deferred:** PONV antiemetic doses (only pre-2025 textbook figures available), the analgesia plan (its own step, from the 2026 ASA regional-analgesia guideline), pediatric PONV risk.
```

- [ ] **Step 4: Run the tests**

Run: `npm run verify` (or the low-memory fallback from Task 1).
Expected: all pass.

- [ ] **Step 5: Check by hand** (`npm run dev` on a free port; stop it afterwards)

1. Post-op shows, in order: Apfel, the PONV consensus panel, Modified Aldrete score, PADSS, 4AT, then the emergence checklist and handoff.
2. Both new scores start with nothing selected and read "Incomplete".
3. Aldrete all top answers: "10 / 10 · Meets the discharge mark"; change one item to its middle answer: 9, still meets; a second middle answer: 8, "Below the discharge mark".
4. PADSS all top answers except pain "no": "8 / 10 · Not yet home-ready by score".
5. The circulation, oxygen saturation and pain items show their "Textbooks differ" note.
6. New case clears both scores; localStorage `anesthassist-storage` holds no score answers.
7. Light and dark themes read correctly.

- [ ] **Step 6: Commit**

```bash
git add src/views/PostopView.tsx README.md docs/superpowers/specs/2026-11-17-perioperative-guide-design.md
git commit -m "feat(postop): show the PACU discharge scores and record step 5b"
```
