# Post-op Tools (PONV Risk and 4AT Delirium Screen) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two tools to the Post-op tab: the **Apfel PONV risk score** with what the 2025 consensus says to do about it, and the **4AT delirium screen**. Both are built only from text that was read in full on 2026-11-17.

**Architecture:** Apfel is one more yes/no `RiskScore` (reusing `ScorePanel`, `scoreResult` and the in-memory `scoreAnswers`), with a new derived item (`female`, from the biometric header) and an adults-only gate. The 4AT has multi-option items worth 0, 1, 2 or 4 points, which the one-point yes/no model cannot express, so it gets its own small `ChoiceScore` model, pure calculation and panel. A short `PONV_PLAN` data record carries the consensus statements. A `PostopView` renders them above the existing emergence checklist and handoff.

**Tech Stack:** React 19, Zustand 5, Tailwind 3, Vitest 4. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-11-17-perioperative-guide-design.md` (§2 Post-op tab, §3 scores, rollout step 5; Task 3 records the trim).

## Scope decisions (read first)

**This plan encodes only what was read in full from a primary text on 2026-11-17.**

**In (first slice):**
- **Apfel simplified PONV risk score, adults only.** The four predictors, the incidence by number of factors and the low/medium/high classification come from the **ASER Fifth Consensus PONV Guidelines (2025), open appendix, read in full** (`aser-ponv-5th-2025`, already registered as `primary`): predictors are *female gender, history of PONV and/or motion sickness, nonsmoking status, use of postoperative opioids*; incidence with 0, 1, 2, 3, 4 factors is "approximately 10%, 20%, 40%, 60%, and 80%"; the panel classifies 0, 1-2 and 3-plus as low, medium and high. The same text says adult models such as Apfel "are poorly suited to pediatric POV", so the score is **gated to age 18 or over**.
- **What the consensus advises** (from the same appendix): *Guideline 3: "Administer PONV prophylaxis using 2 interventions in adults at any risk for PONV"*, and *Guideline 2: strategies to reduce baseline risk are (1) minimization of perioperative opioids with the use of multimodal analgesic regimens; (2) preferential use of regional anesthesia; (3) preferential use of propofol infusions as the primary anesthetic; (4) avoidance of volatile anesthetics; and (5) adequate hydration in patients undergoing surgery.* **No doses**, because the guideline's dose table was not available (see below).
- **4AT delirium screen.** The instrument itself (the 4AT form, version 1, from the supplementary appendix of Bellelli 2014, `4at-bellelli-2014`) was **read in full**: four items worth 0-4 / 0-2 / 0-2 / 0-4 points, total 0 to 12, bands 0, 1-3 and 4 or more. This upgrades that source from `secondary` to `primary`.

**Out, and why:**
- **Modified Aldrete score and PADSS** (PACU discharge). Their item tables were not readable (the primary papers are paywalled). Two open 2026 papers use different PADSS thresholds ("score below 10" in one, "9 or more" in the other), which is exactly the ambiguity this app refuses to guess at. Only the Aldrete threshold "9 or greater" is corroborated, and a threshold without its items is not a score.
- **Analgesia plan.** The ERAS multimodal analgesia guideline is registered but was not read for this slice.
- **PONV antiemetic doses and the number of agents by risk level.** The appendix points to a main-text dose table that is paywalled. The consensus's adult statement is "2 interventions at any risk", which is what the card shows.
- **Pediatric PONV risk** (POVOC/VPOP) and its algorithm. For children the card shows a pointer only.
- Unlock list for step 5b: readable Aldrete and PADSS item tables (or the primary papers), the ERAS analgesia text, the ASER dose table.

**Placement:** the spec puts PONV (Apfel) on Post-op, so it goes there. Apfel needs sex and age, so the **biometric header now also shows on Post-op**. The handoff summary is unchanged and still contains no biometrics.

**Honest limits the screen states:** the 4AT is a screening instrument, not a diagnosis, and was validated in hospitalised patients aged 70 or over, not specifically after surgery; the incidences are approximate and come from one consensus citing the 1999 paper; the 4AT form may have been updated since version 1.

## Global Constraints

- Offline-first PWA. No clinical network calls. No new dependencies.
- Every record cites `sourceIds` that exist in `src/data/sources.ts`. A missing answer shows "incomplete"; **nothing is ever defaulted**.
- Score answers stay in memory only and are cleared by **New case**. Do not add them to `partialize`; do not bump the Zustand persist `version`.
- Touch targets at least 48 px. Tailwind 3. Literal class strings only. Use `text-black` (not `text-slate-950`) on solid accent fills; the theme's class guard test rejects the latter.
- Bump `DATA_VERSION` in `src/data/sources.ts` to `'2026.11.17-draft20'` in Task 1.
- Run only the affected test file first, then `npm run verify` before finishing.
- **Tasks must run in order (1, 2, 3).**
- Work in your own worktree on your own branch. Skip any `git switch`/`git checkout` step, and never touch the main checkout.

## Review Focus

- **4AT option points are exactly** alertness 0/0/4, AMT4 0/1/2, attention 0/1/2, acute change 0/4, maximum 12, and the bands change at 1 and at 4 (3 vs 4 is the delirium cut-off). Task 1 pins all of it.
- **An unanswered 4AT item is never defaulted.** The result is "incomplete" and names the missing items. Task 1 pins it.
- **Apfel is adults only.** Age 17 is not applicable, 18 is applicable, unknown age is incomplete. Task 1 pins it.
- **Apfel's `female` item follows the sex input and is locked;** with sex unset the score is incomplete. Task 1 pins it.
- **Apfel band edges:** 0 is low, 1 and 2 are medium, 3 and 4 are high. Task 1 pins it.
- **The PONV card states no dose and cites the ASER appendix.** For a child it shows only the pointer. Task 1 pins the data; Task 2 checks the screen.
- **New case clears the 4AT answers and nothing about them reaches localStorage.** Task 2 pins it.
- **Post-op shows the biometric header; the handoff stays biometrics-free.** Task 2 updates the phases test; the existing handoff tests must still pass.

---

### Task 1: Data, calculation and integrity tests

**Files:**
- Modify: `src/data/riskScores.ts`, `src/lib/calc/scores.ts`, `src/components/ScorePanel.tsx`, `src/data/sources.ts`, `src/data/derived.ts`, `src/data/__tests__/riskScores.test.ts`, `src/lib/calc/__tests__/scores.test.ts`
- Create: `src/data/choiceScores.ts`, `src/data/ponvPlan.ts`, `src/lib/calc/choiceScores.ts`, `src/data/__tests__/choiceScores.test.ts`, `src/data/__tests__/ponvPlan.test.ts`, `src/lib/calc/__tests__/choiceScores.test.ts`

**Interfaces:**
- Produces:
  - `DerivedKey` gains `'female'`; `RiskScore` gains `adultOnly?: boolean`; `APFEL: RiskScore`; `POSTOP_SCORES: RiskScore[]`
  - `ScoreResult` gains `{ kind: 'not-applicable'; reason: string }`
  - `interface ChoiceOption { label: string; points: number }`, `interface ChoiceItem { id: string; label: string; prompt?: string; options: ChoiceOption[] }`, `interface ChoiceScore { id: string; name: string; items: ChoiceItem[]; bands: RiskBand[]; note?: string; why?: string; sourceIds: string[] }`, `FOUR_AT: ChoiceScore`, `CHOICE_SCORES: ChoiceScore[]`
  - `type ChoiceResult = { kind: 'ok'; points: number; max: number; band: RiskBand } | { kind: 'incomplete'; missing: string[] }`; `choiceScoreResult(score: ChoiceScore, answers: Record<string, number | undefined>): ChoiceResult`
  - `PONV_PLAN` (`sourceIds`, `adults.headline`, `adults.riskReduction`, `adults.doseNote`, `children`)

- [ ] **Step 1: Write the failing tests**

Create `src/data/__tests__/choiceScores.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { CHOICE_SCORES, FOUR_AT } from '../choiceScores';
import { SOURCE_BY_ID } from '../sources';

describe('choice score records', () => {
  it('cite sources that exist and have unique item ids', () => {
    for (const s of CHOICE_SCORES) {
      expect(s.sourceIds.length, s.id).toBeGreaterThan(0);
      for (const id of s.sourceIds) expect(SOURCE_BY_ID[id], `${s.id} -> ${id}`).toBeDefined();
    }
    const ids = CHOICE_SCORES.flatMap((s) => s.items.map((i) => i.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('have bands that start at 0 and ascend', () => {
    for (const s of CHOICE_SCORES) {
      expect(s.bands[0].min, s.id).toBe(0);
      for (let k = 1; k < s.bands.length; k++) expect(s.bands[k].min, s.id).toBeGreaterThan(s.bands[k - 1].min);
    }
  });

  it('4AT: the option points are exactly those on the form', () => {
    const points = FOUR_AT.items.map((i) => i.options.map((o) => o.points));
    expect(points).toEqual([[0, 0, 4], [0, 1, 2], [0, 1, 2], [0, 4]]);
    expect(FOUR_AT.items.map((i) => i.label)).toEqual(['Alertness', 'AMT4', 'Attention', 'Acute change or fluctuating course']);
  });

  it('4AT: is read from the primary form and its bands change at 1 and at 4', () => {
    expect(SOURCE_BY_ID['4at-bellelli-2014'].verification).toBe('primary');
    expect(FOUR_AT.bands.map((b) => b.min)).toEqual([0, 1, 4]);
  });

  it('4AT: says it was validated in hospitalised patients aged 70 or over, not specifically after surgery', () => {
    expect(FOUR_AT.note).toContain('aged 70 or over');
    expect(FOUR_AT.note).toContain('not specifically after surgery');
    expect(SOURCE_BY_ID['4at-bellelli-2014'].accessNote).toContain('not specifically after surgery');
  });
});
```

Create `src/data/__tests__/ponvPlan.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { PONV_PLAN } from '../ponvPlan';
import { SOURCE_BY_ID } from '../sources';

describe('PONV plan', () => {
  it('cites the ASER 2025 appendix, which is a primary source', () => {
    expect(PONV_PLAN.sourceIds).toEqual(['aser-ponv-5th-2025']);
    expect(SOURCE_BY_ID['aser-ponv-5th-2025'].verification).toBe('primary');
  });

  it('lists the five baseline-risk strategies and says 2 interventions for adults', () => {
    expect(PONV_PLAN.adults.riskReduction).toHaveLength(5);
    expect(PONV_PLAN.adults.headline).toContain('2 interventions');
  });

  it('states no dose anywhere', () => {
    const all = [PONV_PLAN.adults.headline, ...PONV_PLAN.adults.riskReduction, PONV_PLAN.adults.doseNote, PONV_PLAN.children].join(' ');
    expect(all).not.toMatch(/\b\d+(\.\d+)?\s*(mg|mcg|ml|mg\/kg|g)\b/i);
  });

  it('gives children a pointer only', () => {
    expect(PONV_PLAN.children).toContain('Pediatric');
    expect(PONV_PLAN.children).toContain('not encoded');
  });
});
```

Create `src/lib/calc/__tests__/choiceScores.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { FOUR_AT } from '../../../data/choiceScores';
import { choiceScoreResult } from '../choiceScores';

const answers = (...picks: number[]): Record<string, number> => Object.fromEntries(FOUR_AT.items.map((it, i) => [it.id, picks[i]]));
const ok = (r: ReturnType<typeof choiceScoreResult>) => {
  if (r.kind !== 'ok') throw new Error(`expected ok, got incomplete: ${r.missing.join(', ')}`);
  return r;
};

describe('4AT', () => {
  it.each([
    [[0, 0, 0, 0], 0, 'Delirium or cognitive impairment unlikely'],
    [[0, 1, 0, 0], 1, 'Possible cognitive impairment'],
    [[0, 2, 1, 0], 3, 'Possible cognitive impairment'],
    [[2, 0, 0, 0], 4, 'Possible delirium +/- cognitive impairment'],
    [[0, 0, 0, 1], 4, 'Possible delirium +/- cognitive impairment'],
    [[0, 2, 2, 0], 4, 'Possible delirium +/- cognitive impairment'],
    [[2, 2, 2, 1], 12, 'Possible delirium +/- cognitive impairment'],
  ])('choices %j -> %s points, %s', (picks, points, band) => {
    const r = ok(choiceScoreResult(FOUR_AT, answers(...picks)));
    expect(r.points).toBe(points);
    expect(r.band.label).toBe(band);
    expect(r.max).toBe(12);
  });

  it('mild sleepiness on waking scores 0, the same as normal alertness', () => {
    expect(ok(choiceScoreResult(FOUR_AT, answers(1, 0, 0, 0))).points).toBe(0);
  });

  it('is incomplete, and names the missing items, until every item is answered; nothing is defaulted', () => {
    const r = choiceScoreResult(FOUR_AT, { [FOUR_AT.items[0].id]: 0, [FOUR_AT.items[1].id]: 0 });
    expect(r.kind).toBe('incomplete');
    if (r.kind === 'incomplete') expect(r.missing).toEqual(['Attention', 'Acute change or fluctuating course']);
    expect(choiceScoreResult(FOUR_AT, {}).kind).toBe('incomplete');
  });

  it('treats an out-of-range option index as unanswered', () => {
    expect(choiceScoreResult(FOUR_AT, answers(0, 0, 0, 5)).kind).toBe('incomplete');
    expect(choiceScoreResult(FOUR_AT, answers(0, 0, 0, -1)).kind).toBe('incomplete');
  });
});
```

In `src/data/__tests__/riskScores.test.ts`: change the import line to `import { POSTOP_SCORES, RISK_SCORES } from '../riskScores';`, and add above the first `describe`: `const ALL = [...RISK_SCORES, ...POSTOP_SCORES];`. Then replace every `RISK_SCORES` inside the three existing `it` bodies with `ALL`. Add this test inside the `describe`:

```ts
  it('Apfel: four one-point items, adults only, bands low 0 / medium 1 / high 3', () => {
    const apfel = POSTOP_SCORES.find((s) => s.id === 'apfel')!;
    expect(apfel.items).toHaveLength(4);
    expect(apfel.adultOnly).toBe(true);
    expect(apfel.bands.map((b) => [b.min, b.label])).toEqual([[0, 'Low risk'], [1, 'Medium risk'], [3, 'High risk']]);
  });
```

In `src/lib/calc/__tests__/scores.test.ts`:
1. Change the import to `import { APFEL, RCRI, STOP_BANG } from '../../../data/riskScores';`.
2. Replace the `ok` helper's throw with: ``if (r.kind !== 'ok') throw new Error(`expected ok, got ${r.kind}`);``
3. Append these tests at the end of the file:

```ts
describe('Apfel', () => {
  const manual = APFEL.items.filter((i) => !i.derive);
  const tick = (n: number) => Object.fromEntries(manual.slice(0, n).map((i) => [i.id, true]));
  const female = { ...ctx, ageYears: 40, sex: 'female' as const };

  it.each([
    [0, 1, 'Medium risk'],
    [1, 2, 'Medium risk'],
    [2, 3, 'High risk'],
    [3, 4, 'High risk'],
  ])('a woman with %s ticked items scores %s -> %s', (n, points, band) => {
    const r = ok(scoreResult(APFEL, tick(n), female));
    expect(r.points).toBe(points);
    expect(r.band.label).toBe(band);
    expect(r.max).toBe(4);
  });

  it('a man with 0 ticked items is low risk, with 1 or 2 medium, with 3 high', () => {
    const male = { ...ctx, ageYears: 40, sex: 'male' as const };
    expect(ok(scoreResult(APFEL, tick(0), male)).band.label).toBe('Low risk');
    expect(ok(scoreResult(APFEL, tick(1), male)).band.label).toBe('Medium risk');
    expect(ok(scoreResult(APFEL, tick(2), male)).band.label).toBe('Medium risk');
    expect(ok(scoreResult(APFEL, tick(3), male)).band.label).toBe('High risk');
  });

  it('is incomplete without sex, and without age', () => {
    expect(scoreResult(APFEL, {}, { ...ctx, sex: null }).kind).toBe('incomplete');
    const r = scoreResult(APFEL, {}, { ...ctx, ageYears: null });
    expect(r.kind).toBe('incomplete');
    if (r.kind === 'incomplete') expect(r.missing).toContain('age');
  });

  it('is for adults only: 17 is not applicable, 18 is', () => {
    expect(scoreResult(APFEL, {}, { ...ctx, ageYears: 17 }).kind).toBe('not-applicable');
    expect(scoreResult(APFEL, {}, { ...ctx, ageYears: 18 }).kind).toBe('ok');
  });

  it('does not change how the other scores treat children', () => {
    expect(scoreResult(RCRI, {}, { ...ctx, ageYears: 10 }).kind).toBe('ok');
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx.cmd vitest run src/data/__tests__/choiceScores.test.ts src/data/__tests__/ponvPlan.test.ts src/lib/calc/__tests__/choiceScores.test.ts src/lib/calc/__tests__/scores.test.ts src/data/__tests__/riskScores.test.ts` (PowerShell).
Expected: FAIL (missing modules and exports).

- [ ] **Step 3: Apfel and the adults-only gate**

In `src/data/riskScores.ts`:
1. Change `export type DerivedKey = 'age>50' | 'male' | 'bmi>35' | 'creatinine>2.0mgdl';` to `export type DerivedKey = 'age>50' | 'male' | 'female' | 'bmi>35' | 'creatinine>2.0mgdl';`
2. In `interface RiskScore`, add after `note?: string;`: `/** Only validated in adults (age 18 or over); children get "not applicable". */` and `adultOnly?: boolean;`
3. Append at the end of the file:

```ts
export const APFEL: RiskScore = {
  id: 'apfel',
  name: 'Apfel PONV risk score (adults)',
  adultOnly: true,
  items: [
    { id: 'apfel-female', label: 'Female gender', derive: 'female' },
    { id: 'apfel-history', label: 'History of PONV and/or motion sickness' },
    { id: 'apfel-nonsmoker', label: 'Nonsmoking status' },
    { id: 'apfel-opioids', label: 'Use of postoperative opioids' },
  ],
  bands: [
    { min: 0, label: 'Low risk', detail: 'Postoperative nausea and vomiting occurs in approximately 10% of patients with no risk factor.' },
    { min: 1, label: 'Medium risk', detail: 'Approximately 20% with one risk factor and 40% with two.' },
    { min: 3, label: 'High risk', detail: 'Approximately 60% with three risk factors and 80% with four.' },
  ],
  note: 'The incidences are approximate. They and the low, medium and high classification (0, 1-2, 3 or more factors) come from the 2025 ASER consensus, which cites the 1999 Apfel paper. The consensus says adult models such as the Apfel score are poorly suited to pediatric postoperative vomiting.',
  why: 'Four yes/no risk factors; each yes scores one point. More factors mean a higher chance of nausea and vomiting after surgery.',
  sourceIds: ['aser-ponv-5th-2025', 'apfel-1999'],
};

/** Scores shown on the Post-op tab. RISK_SCORES stays the Pre-op Assess set. */
export const POSTOP_SCORES: RiskScore[] = [APFEL];
```

In `src/lib/calc/scores.ts`:
1. In `ScoreResult`, add a member: `| { kind: 'not-applicable'; reason: string }`.
2. In `DERIVE`, add after the `male` entry: `female: { needs: 'biological sex', value: (c) => (c.sex === null ? null : c.sex === 'female') },`
3. At the top of `scoreResult` (before `const missing`), add:

```ts
  if (score.adultOnly) {
    if (ctx.ageYears === null) return { kind: 'incomplete', missing: ['age'] };
    if (ctx.ageYears < 18) return { kind: 'not-applicable', reason: 'This score is for adults (age 18 or over).' };
  }
```

- [ ] **Step 3b: Handle "not applicable" in the score panel**

Task 1 adds the `not-applicable` result kind, so the one place that renders a `ScoreResult` must handle it now or the type-check fails. In `src/components/ScorePanel.tsx`, replace the result block's ternary so it reads:

```tsx
        {result.kind === 'incomplete' ? (
          <WarningBanner level="info">Incomplete: needs {result.missing.join(', ')}.</WarningBanner>
        ) : result.kind === 'not-applicable' ? (
          <WarningBanner level="info">{result.reason}</WarningBanner>
        ) : (
```

(keep the existing `<> ... </>` third branch exactly as it is).

- [ ] **Step 4: The 4AT data and calculation**

Create `src/data/choiceScores.ts`:

```ts
// Scores whose items have several answers worth different points (the yes/no RiskScore cannot express them).
// The 4AT wording and points are copied from the 4AT form, version 1 (supplementary appendix of Bellelli 2014).

import type { RiskBand } from './riskScores';

export interface ChoiceOption {
  label: string;
  points: number;
}

export interface ChoiceItem {
  id: string;
  label: string;
  /** How to ask or observe, as the form words it. */
  prompt?: string;
  options: ChoiceOption[];
}

export interface ChoiceScore {
  id: string;
  name: string;
  items: ChoiceItem[];
  bands: RiskBand[];
  note?: string;
  /** One-sentence rationale for trainees. */
  why?: string;
  sourceIds: string[];
}

export const FOUR_AT: ChoiceScore = {
  id: '4at',
  name: '4AT delirium screen',
  items: [
    {
      id: '4at-alertness',
      label: 'Alertness',
      prompt:
        'This includes patients who may be markedly drowsy (eg. difficult to rouse and/or obviously sleepy during assessment) or agitated/hyperactive. Observe the patient. If asleep, attempt to wake with speech or gentle touch on shoulder. Ask the patient to state their name and address to assist rating.',
      options: [
        { label: 'Normal (fully alert, but not agitated, throughout assessment)', points: 0 },
        { label: 'Mild sleepiness for <10 seconds after waking, then normal', points: 0 },
        { label: 'Clearly abnormal', points: 4 },
      ],
    },
    {
      id: '4at-amt4',
      label: 'AMT4',
      prompt: 'Age, date of birth, place (name of the hospital or building), current year.',
      options: [
        { label: 'No mistakes', points: 0 },
        { label: '1 mistake', points: 1 },
        { label: '2 or more mistakes/untestable', points: 2 },
      ],
    },
    {
      id: '4at-attention',
      label: 'Attention',
      prompt:
        'Ask the patient: "Please tell me the months of the year in backwards order, starting at December." To assist initial understanding one prompt of "what is the month before December?" is permitted.',
      options: [
        { label: 'Achieves 7 months or more correctly', points: 0 },
        { label: 'Starts but scores < 7 months / refuses to start', points: 1 },
        { label: 'Untestable (cannot start because unwell, drowsy, inattentive)', points: 2 },
      ],
    },
    {
      id: '4at-change',
      label: 'Acute change or fluctuating course',
      prompt:
        'Evidence of significant change or fluctuation in: alertness, cognition, other mental function (eg. paranoia, hallucinations) arising over the last 2 weeks and still evident in last 24hrs.',
      options: [
        { label: 'No', points: 0 },
        { label: 'Yes', points: 4 },
      ],
    },
  ],
  bands: [
    { min: 0, label: 'Delirium or cognitive impairment unlikely', detail: 'But delirium is still possible if the acute change item (4) information is incomplete.' },
    { min: 1, label: 'Possible cognitive impairment', detail: 'A score of 1 to 3.' },
    { min: 4, label: 'Possible delirium +/- cognitive impairment', detail: 'A score of 4 or above.' },
  ],
  note: 'A screening instrument, not a diagnosis: a score of 4 or more suggests delirium, and more detailed assessment of mental status may be required. Items 1 to 3 are rated on observation of the patient at the time of assessment. Item 4 needs information from one or more sources (for example your own knowledge of the patient, other staff, case notes, carers). Take account of hearing impairment, dysphasia and lack of a common language. It was validated in hospitalised patients aged 70 or over, not specifically after surgery. This is version 1 of the form; check www.the4AT.com for the current one.',
  why: 'Four quick items (alertness, a short memory test, attention, and any recent change) add up to 0 to 12. A score of 4 or more flags possible delirium.',
  sourceIds: ['4at-bellelli-2014'],
};

export const CHOICE_SCORES: ChoiceScore[] = [FOUR_AT];
```

Create `src/lib/calc/choiceScores.ts`:

```ts
import type { ChoiceScore } from '../../data/choiceScores';
import type { RiskBand } from '../../data/riskScores';

export type ChoiceResult =
  | { kind: 'ok'; points: number; max: number; band: RiskBand }
  | { kind: 'incomplete'; missing: string[] };

/** answers maps an item id to the index of the chosen option. A missing or out-of-range answer is never defaulted. */
export const choiceScoreResult = (score: ChoiceScore, answers: Record<string, number | undefined>): ChoiceResult => {
  const unanswered = score.items.filter((i) => {
    const a = answers[i.id];
    return a === undefined || !Number.isInteger(a) || a < 0 || a >= i.options.length;
  });
  if (unanswered.length > 0) return { kind: 'incomplete', missing: unanswered.map((i) => i.label) };
  const points = score.items.reduce((sum, i) => sum + i.options[answers[i.id] as number].points, 0);
  const max = score.items.reduce((sum, i) => sum + Math.max(...i.options.map((o) => o.points)), 0);
  const band = [...score.bands].reverse().find((b) => points >= b.min) ?? score.bands[0];
  return { kind: 'ok', points, max, band };
};
```

- [ ] **Step 5: The PONV plan data**

Create `src/data/ponvPlan.ts`:

```ts
// What the ASER 2025 consensus advises for PONV. Wording follows the appendix (read in full 2026-11-17).
// No doses: the guideline's dose table was not available to this build.

export const PONV_PLAN = {
  sourceIds: ['aser-ponv-5th-2025'],
  adults: {
    headline: 'Give PONV prophylaxis using 2 interventions in adults at any risk for PONV (ASER 2025, Guideline 3).',
    /** Guideline 2: strategies recommended to reduce baseline risk. */
    riskReduction: [
      'Minimization of perioperative opioids with the use of multimodal analgesic regimens',
      'Preferential use of regional anesthesia',
      'Preferential use of propofol infusions as the primary anesthetic',
      'Avoidance of volatile anesthetics',
      'Adequate hydration in patients undergoing surgery',
    ],
    doseNote: 'Doses are not shown here: the guideline dose table was not available to this build. Check the Drug reference and your local protocol.',
  },
  children:
    'Pediatric postoperative vomiting (POV/PONV) is assessed with different models and a different prophylaxis approach (ASER 2025, Guideline 5). It is not encoded in this app.',
};
```

- [ ] **Step 6: Sources and derived values**

In `src/data/sources.ts`:
1. Change `DATA_VERSION` to `'2026.11.17-draft20'`.
2. In the `4at-bellelli-2014` record: set `verification: 'primary'` and replace its `accessNote` with: `'Main text (open, PMC) and the supplementary 4AT form (version 1: item wording, points and bands) read in full on 2026-11-17. Validated in hospitalised patients aged 70 or over on an acute geriatrics ward and a rehabilitation department, not specifically after surgery; a 2015 corrigendum to the paper exists. The form on www.the4AT.com may be a newer version.'`
3. In the `apfel-1999` record: keep `verification: 'secondary'` and replace its `accessNote` with: `'The 1999 paper was not opened. The four items, the incidence by number of factors (approximately 10%, 20%, 40%, 60%, 80%) and the low/medium/high classification were read in the ASER 2025 consensus appendix (aser-ponv-5th-2025), which cites it.'`

In `src/data/derived.ts`:
1. Add the imports `import { CHOICE_SCORES } from './choiceScores';`, `import { PONV_PLAN } from './ponvPlan';` (next to the other data imports) and change `import { RISK_SCORES } from './riskScores';` to `import { POSTOP_SCORES, RISK_SCORES } from './riskScores';`.
2. After the existing `for (const s of RISK_SCORES) { ... }` block, add:

```ts
  for (const s of POSTOP_SCORES) {
    add(s.sourceIds, `Risk score ${s.name}: ${s.items.length} items; bands ${s.bands.map((b) => `${b.min}+ ${b.label}`).join(', ')}`);
  }
  for (const s of CHOICE_SCORES) {
    const pts = s.items.map((i) => i.options.map((o) => o.points).join('/')).join('; ');
    add(s.sourceIds, `Choice score ${s.name}: ${s.items.length} items (${pts}); bands ${s.bands.map((b) => `${b.min}+ ${b.label}`).join(', ')}`);
  }
  add(PONV_PLAN.sourceIds, `PONV plan: ${PONV_PLAN.adults.headline}`);
```

3. In `SOURCES_WITHOUT_DERIVED_VALUES`, delete the two lines `'apfel-1999',` and `'4at-bellelli-2014',` (they now have derived values). Keep the others.

- [ ] **Step 7: Run the tests**

Run: `npx.cmd vitest run src/data/__tests__/choiceScores.test.ts src/data/__tests__/ponvPlan.test.ts src/lib/calc/__tests__/choiceScores.test.ts src/lib/calc/__tests__/scores.test.ts src/data/__tests__/riskScores.test.ts src/data/__tests__/integrity.test.ts src/data/__tests__/sourceRefs.test.ts`
Expected: PASS (5 + 4 + 10 new tests in the three new files, plus the new Apfel tests). If `integrity.test.ts` fails on the exact-equality exemption list, you removed or kept a wrong id: re-check Step 6.3. If a sources test fails, stop and report; do not edit a test.

Run: `npm run verify`
Expected: all tests pass, type-check clean, build succeeds.

- [ ] **Step 8: Commit**

```bash
git add src/data src/lib/calc src/components/ScorePanel.tsx
git commit -m "feat(postop): add the Apfel PONV score, the 4AT delirium screen and the PONV consensus record"
```

---

### Task 2: Store, panels and the Post-op screen

**Files:**
- Modify: `src/store/useAppStore.ts`, `src/store/__tests__/assess.test.ts`, `src/lib/phases.ts`, `src/lib/__tests__/phases.test.ts`, `src/App.tsx`
- Create: `src/components/ChoiceScorePanel.tsx`, `src/views/PostopView.tsx`

**Interfaces:**
- Consumes: `APFEL`/`POSTOP_SCORES`, `FOUR_AT`, `PONV_PLAN` (Task 1); `choiceScoreResult`; `scoreResult` with the new `not-applicable` kind; `ScorePanel`, `Panel`, `WarningBanner`.
- Produces: store field `choiceAnswers: Record<string, number>` (memory only) and action `setChoiceAnswer(itemId, optionIndex)`; `ChoiceScorePanel`; `PostopView`.

- [ ] **Step 1: Write the failing tests**

In `src/store/__tests__/assess.test.ts`:
- Change the forbidden list in the first test to `['patient', 'creatinineUmolL', 'scoreAnswers', 'medsTaken', 'choiceAnswers']`.
- Add inside the `describe`:

```ts
  it('records a 4AT answer, overwrites it, and New case clears them', () => {
    useAppStore.getState().setChoiceAnswer('4at-alertness', 2);
    expect(useAppStore.getState().choiceAnswers['4at-alertness']).toBe(2);
    useAppStore.getState().setChoiceAnswer('4at-alertness', 0);
    expect(useAppStore.getState().choiceAnswers['4at-alertness']).toBe(0);
    useAppStore.getState().newCase();
    expect(useAppStore.getState().choiceAnswers).toEqual({});
  });
```

In `src/lib/__tests__/phases.test.ts`: in the `needsBiometrics` table replace the row `['postop', 'vent', false],` with `['postop', 'vent', true],` (Post-op now shows the header, because Apfel needs sex and age).

- [ ] **Step 2: Run them to verify they fail**

Run: `npx.cmd vitest run src/store/__tests__/assess.test.ts src/lib/__tests__/phases.test.ts`
Expected: FAIL (`setChoiceAnswer` is not a function; `needsBiometrics('postop', ...)` is false).

- [ ] **Step 3: Store and phases**

In `src/store/useAppStore.ts` (anchors as for `medsTaken`):
1. In `AppState`, after `  medsTaken: Record<string, boolean>;` add `  choiceAnswers: Record<string, number>;`
2. In `AppState`, after `  toggleMedTaken: (id: string) => void;` add `  setChoiceAnswer: (itemId: string, optionIndex: number) => void;`
3. In the initial state, after `      medsTaken: {},` add `      choiceAnswers: {},`
4. In `newCase`, after `          medsTaken: {},` add `          choiceAnswers: {},`
5. After the `toggleMedTaken: (id) => set(...)` line add:

```ts
      setChoiceAnswer: (itemId, optionIndex) => set((s) => ({ choiceAnswers: { ...s.choiceAnswers, [itemId]: optionIndex } })),
```

Do **not** add `choiceAnswers` to `partialize` and do **not** change the persist `version`.

In `src/lib/phases.ts`, replace the `needsBiometrics` function (and its comment line) with:

```ts
/** Scores and dose math need the biometric header; the checklists and the handoff do not. Post-op shows it for the Apfel score (sex and age). */
export const needsBiometrics = (tab: AppTab, view: IntraopView): boolean =>
  tab === 'preop' || tab === 'postop' || (tab === 'intraop' && view !== 'lists');
```

- [ ] **Step 4: The 4AT panel**

Create `src/components/ChoiceScorePanel.tsx`:

```tsx
import React from 'react';
import type { ChoiceScore } from '../data/choiceScores';
import { choiceScoreResult } from '../lib/calc/choiceScores';
import { Panel } from './hud/Panel';
import { WarningBanner } from './ui/WarningBanner';

interface ChoiceScorePanelProps {
  score: ChoiceScore;
  answers: Record<string, number>;
  onAnswer: (itemId: string, optionIndex: number) => void;
}

/** A score whose items each have several answers worth different points. Nothing is pre-selected. */
export const ChoiceScorePanel: React.FC<ChoiceScorePanelProps> = ({ score, answers, onAnswer }) => {
  const result = choiceScoreResult(score, answers);
  return (
    <Panel title={score.name} sourceIds={score.sourceIds}>
      {score.items.map((item) => (
        <div key={item.id} className="flex flex-col gap-1.5">
          <h4 className="text-sm font-bold text-slate-100">{item.label}</h4>
          {item.prompt && <p className="text-xs text-slate-400">{item.prompt}</p>}
          <div role="radiogroup" aria-label={item.label} className="flex flex-col gap-1.5">
            {item.options.map((o, idx) => {
              const on = answers[item.id] === idx;
              return (
                <button
                  key={o.label}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => onAnswer(item.id, idx)}
                  className={`flex min-h-[48px] w-full items-center justify-between gap-3 rounded-xl border p-3 text-left text-sm font-semibold touch-manipulation ${
                    on ? 'border-cyan-400 bg-cyan-500 text-black' : 'border-clinical-border bg-clinical-card/50 text-slate-200'
                  }`}
                >
                  <span className="min-w-0 flex-1">{o.label}</span>
                  <span className="shrink-0 font-mono text-xs">{o.points} pt</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <div aria-live="polite">
        {result.kind === 'incomplete' ? (
          <WarningBanner level="info">Incomplete: answer {result.missing.join(', ')}.</WarningBanner>
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

- [ ] **Step 5: The Post-op screen**

Create `src/views/PostopView.tsx`:

```tsx
import React from 'react';
import { FOUR_AT } from '../data/choiceScores';
import { PONV_PLAN } from '../data/ponvPlan';
import { POSTOP_SCORES } from '../data/riskScores';
import { calculateBmi } from '../lib/calc/biometrics';
import { useAppStore } from '../store/useAppStore';
import { Panel } from '../components/hud/Panel';
import { ChoiceScorePanel } from '../components/ChoiceScorePanel';
import { ScorePanel } from '../components/ScorePanel';

const linkBtn =
  'min-h-[48px] rounded-xl border border-clinical-border-light bg-clinical-card px-3 text-sm font-bold text-slate-200 touch-manipulation';

/** Post-op tools: PONV risk and what the 2025 consensus advises, and the 4AT delirium screen. All inputs live in memory only. */
export const PostopView: React.FC = () => {
  const patient = useAppStore((s) => s.patient);
  const answers = useAppStore((s) => s.scoreAnswers);
  const toggle = useAppStore((s) => s.toggleScoreItem);
  const choiceAnswers = useAppStore((s) => s.choiceAnswers);
  const setChoice = useAppStore((s) => s.setChoiceAnswer);
  const setReferencesOpen = useAppStore((s) => s.setReferencesOpen);

  const bmi = patient.tbwKg !== null && patient.heightCm !== null ? calculateBmi(patient.tbwKg, patient.heightCm) : null;
  const ctx = { ageYears: patient.ageYears, sex: patient.sex, bmi, creatinineUmolL: patient.creatinineUmolL };
  const child = patient.ageYears !== null && patient.ageYears < 18;

  return (
    <div className="mb-3 flex flex-col gap-3">
      {POSTOP_SCORES.map((score) => (
        <ScorePanel key={score.id} score={score} answers={answers} ctx={ctx} onToggle={toggle} />
      ))}

      <Panel title="PONV: what the 2025 consensus advises" sourceIds={PONV_PLAN.sourceIds}>
        {child ? (
          <p className="text-sm text-slate-200">{PONV_PLAN.children}</p>
        ) : (
          <>
            <p className="text-sm font-semibold text-slate-100">{PONV_PLAN.adults.headline}</p>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Reduce baseline risk</p>
            <ul className="list-disc pl-5 text-sm text-slate-200">
              {PONV_PLAN.adults.riskReduction.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
            <p className="text-xs text-slate-400">{PONV_PLAN.adults.doseNote}</p>
            <div>
              <button type="button" onClick={() => setReferencesOpen(true)} className={linkBtn}>
                Drug reference
              </button>
            </div>
          </>
        )}
      </Panel>

      <ChoiceScorePanel score={FOUR_AT} answers={choiceAnswers} onAnswer={setChoice} />
    </div>
  );
};
```

In `src/App.tsx`: add `import { PostopView } from './views/PostopView';` after the `import { PlansView } ...` line, and in the post-op block put the view above the checklist:

```tsx
        <div className={activeTab === 'postop' ? '' : 'hidden'} aria-hidden={activeTab !== 'postop'}>
          <PostopView />
          <ChecklistsView phaseLists={listsFor('postop')} extras={['handoff']} />
        </div>
```

- [ ] **Step 6: Run the tests**

Run: `npx.cmd vitest run src/store/__tests__/assess.test.ts src/lib/__tests__/phases.test.ts src/lib/__tests__/handoff.test.ts`
Expected: PASS (the handoff tests must still pass untouched).

Run: `npm run verify`
Expected: all tests pass, type-check clean, build succeeds.

- [ ] **Step 7: Check by hand**

Run `npm run dev`, open the URL it prints (use a free port; stop the server when done). Check in **both Light and Dark** (Settings > Appearance).
- **Post-op tab** shows the biometric header on top, then the **Apfel PONV risk score (adults)** panel, the **PONV: what the 2025 consensus advises** panel, the **4AT delirium screen** panel, then the emergence checklist and the handoff.
- With no age entered: Apfel says "Incomplete: needs age". Enter a woman, 40 y: the "Female gender" row is ticked and locked ("Set from the patient inputs") and the result reads `1 / 4 · Medium risk`. Tick "Nonsmoking status" and "Use of postoperative opioids": `3 / 4 · High risk`. Change sex to male with those two ticked: `2 / 4 · Medium risk`. Untick everything as a man: `0 / 4 · Low risk`.
- Enter an age under 18: Apfel shows "This score is for adults (age 18 or over)." and the consensus panel shows only the pediatric pointer, no list and no Drug reference button.
- The consensus panel (adult) shows the "2 interventions" headline, the five baseline-risk strategies, the dose note and a **Drug reference** button that opens the References sheet. **No dose appears anywhere in it.**
- **4AT:** nothing is pre-selected and it shows "Incomplete: answer Alertness, AMT4, Attention, Acute change or fluctuating course". Answer all four as the first option each: `0 / 12 · Delirium or cognitive impairment unlikely`. Set AMT4 to "1 mistake": `1 / 12 · Possible cognitive impairment`. Set Alertness to "Clearly abnormal": `5 / 12 · Possible delirium +/- cognitive impairment`. Set "Acute change" to Yes with everything else first-option: `4 / 12 · Possible delirium ...`. "Mild sleepiness for <10 seconds after waking, then normal" gives 0 points. Each option shows its points.
- **New case** clears the 4AT choices and the Apfel ticks. A reload shows nothing selected (nothing is persisted).
- The emergence checklist and the **handoff summary still work**, and the handoff text still contains no weight, height or biometrics.
- Each panel's source badge opens the source detail; the 4AT badge says its source is a primary source.
- Report what you saw per bullet. Do not fix visual issues silently; list them.

- [ ] **Step 8: Commit**

```bash
git add src/store src/components/ChoiceScorePanel.tsx src/views/PostopView.tsx src/lib/phases.ts src/lib/__tests__/phases.test.ts src/App.tsx
git commit -m "feat(postop): add the Post-op tools: Apfel, PONV consensus and the 4AT"
```

---

### Task 3: Docs

**Files:**
- Modify: `README.md`, `docs/superpowers/specs/2026-11-17-perioperative-guide-design.md`

- [ ] **Step 1: README**

In `README.md`:
1. Replace `**Post-op** holds the emergence checklist and the handoff summary.` with `**Post-op** holds the Apfel PONV risk score (adults) with what the 2025 consensus advises, the 4AT delirium screen, the emergence checklist and the handoff summary.`
2. In "What is and is not stored", replace `risk-score answers, ticked medications,` with `risk-score and 4AT answers, ticked medications,`.

If an anchor is not found exactly once, stop and report.

- [ ] **Step 2: Spec**

In the spec's §10 rollout list, replace the line `5. **Post-op tools.**` with:

```
5. **Post-op tools** (plan: `docs/superpowers/plans/2026-11-17-postop-tools.md`): first slice, primary-verified only. The Apfel PONV score (adults only; items, incidence and low/medium/high classification from the open ASER 2025 consensus appendix) with the consensus's statements (2 interventions at any risk in adults; five baseline-risk strategies; no doses), and the 4AT delirium screen (item wording, points and bands read from the 4AT form, version 1, in the supplementary appendix of Bellelli 2014, now a `primary` source; validated in hospitalised patients aged 70 or over, not specifically after surgery) using a new multi-option `ChoiceScore` model. The biometric header now also shows on Post-op (Apfel needs sex and age); the handoff stays biometrics-free. **Deferred to step 5b:** the modified Aldrete score and PADSS (item tables not readable; two open papers disagree on the PADSS threshold, "below 10" vs "9 or more"), the analgesia plan (ERAS guideline not read for this slice), PONV antiemetic doses (main-text table paywalled), and pediatric PONV risk (POVOC/VPOP).
```

- [ ] **Step 3: Verify and commit**

Run: `npm run verify`
Expected: PASS.

```bash
git add README.md docs/superpowers/specs/2026-11-17-perioperative-guide-design.md
git commit -m "docs: record the Post-op tools in the README and spec step 5"
```
