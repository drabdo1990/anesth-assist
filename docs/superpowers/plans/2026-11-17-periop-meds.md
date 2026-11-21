# Perioperative Medications (Label-Verified First Slice) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Medications section to the Pre-op tab. The clinician ticks the drug classes a patient takes and sees the manufacturers' perioperative instructions for SGLT2 inhibitors and direct oral anticoagulants (DOACs), plus a pointer to the existing GLP-1 protocol comparison. Every instruction is the label's own wording, with a source badge.

**Architecture:** Rules are data in `src/data/periopMeds.ts`, each drug citing an FDA label registered in `sources.ts`. A pure `matchTimings` picks the dabigatran line that fits the patient's creatinine clearance (from step 2). The store keeps the ticked classes in memory only. One `MedsPanel` renders the section.

**Tech Stack:** React 19, Zustand 5, Tailwind 3, Vitest 4. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-11-17-perioperative-guide-design.md` (rollout step 3, first slice; Task 4 records the trim).

## Scope decisions (read first)

**This plan encodes only what was read in full from a primary text on 2026-11-17: the manufacturers' DailyMed labels.**

**In:**
- **SGLT2 inhibitors:** empagliflozin, dapagliflozin, canagliflozin (at least 3 days), ertugliflozin (at least 4 days), and the label's resumption wording.
- **DOACs:** apixaban, rivaroxaban, edoxaban, dabigatran (adult capsules). The label's surgery interruption wording, restart wording, and the epidural/intrathecal catheter statements where the label gives them. Dabigatran's two timings depend on CrCl and use the step 2 calculation.
- **GLP-1 receptor agonists:** a pointer card only, linking to the existing "GLP-1 perioperative protocols" comparison. No new GLP-1 numbers.

**Left out, and why:** ASRA neuraxial and deep-block intervals; warfarin, heparins and antiplatelets; ACEi/ARB, beta-blockers, statins; steroid stress dosing; insulin and oral hypoglycaemics; MAOIs, lithium, antiepileptics, antiparkinsonian drugs. These come from guidelines (ASRA 5th edition, AHA/ACC 2024, ESC 2022) whose full texts could not be read this session: the registered sources are `secondary`, and the NotebookLM sign-in expired. **To unlock them (step 3b), re-run `notebooklm login` or supply the guideline PDFs.** Encoding intervals from summaries or memory is exactly what this app avoids.

**Why that matters for safety:** the labels' timings are for surgery in general. They are **not** the ASRA intervals for placing a spinal, epidural or deep block. The DOAC card therefore carries a standing amber caution saying so (Task 1 data, Task 3 display, pinned by a test).

**Verified from the label text (2026-11-17):**
- Jardiance, Farxiga, Invokana: "Withhold ... for at least 3 days, if possible, prior to surgery or procedures associated with prolonged fasting." Steglatro: "at least 4 days". All four: "Resume ... when the patient is clinically stable and has resumed oral intake." The labels list surgery and reduced caloric intake among ketoacidosis precipitants.
- Eliquis: "at least 48 hours prior to elective surgery or invasive procedures with a moderate or high risk of unacceptable or clinically significant bleeding"; "at least 24 hours" for "a low risk of bleeding or where the bleeding would be non-critical in location and easily controlled". Catheters: not removed earlier than 24 hours after the last dose; next dose not earlier than 5 hours after removal. Restart "as soon as adequate hemostasis has been established".
- Xarelto: "stopped at least 24 hours before the procedure". Catheters: placement or removal "best performed when the anticoagulant effect ... is low; however, the exact timing ... is not known"; removal "not ... before at least 2 half-lives have elapsed (i.e., 18 hours in young patients aged 20 to 45 years and 26 hours in elderly patients aged 60 to 76 years)"; next dose not earlier than 6 hours after removal. Restart as for apixaban, "noting that the time to onset of therapeutic effect is short".
- Savaysa: "at least 24 hours before invasive or surgical procedures because of the risk of bleeding". Catheters: not removed earlier than 12 hours after the last dose; next dose not earlier than 2 hours after removal. Restart "as soon as adequate hemostasis has been established noting that the time to onset of pharmacodynamic effect is 1-2 hours".
- Pradaxa capsules (adults): "If possible, discontinue ... 1 to 2 days (CrCl ≥ 50 mL/min) or 3 to 5 days (CrCl < 50 mL/min) before invasive or surgical procedures because of the increased risk of bleeding. Consider longer times for patients undergoing major surgery, spinal puncture, or placement of a spinal or epidural catheter or port". "Temporarily discontinue ... when possible, then restart promptly".

**Not verified:** which labeler each setid belongs to is confirmed in Task 1 Step 1 (two of the eight, Eliquis and Xarelto, were found by title search and must be checked). Labels are updated often: the app shows the wording as of this date and says so in each source note.

## Global Constraints

- Offline-first PWA. No clinical network calls. No new dependencies. The label text is copied into data files at build time; nothing is fetched at runtime.
- The ticked medications stay in memory only and are cleared by **New case**.
- Every clinical record cites `sourceIds` that exist in `src/data/sources.ts`. Label instructions are quoted as the label words them; no number is invented, rounded or merged.
- Touch targets at least 48 px. Tailwind 3. Literal class strings only.
- Bump `DATA_VERSION` in `sources.ts` in Task 1.
- Run only the affected test file first, then the full suite before finishing.
- **Tasks must run in order (1, 2, 3, 4).**

## Review Focus

- **Dabigatran at CrCl exactly 50 must take "1 to 2 days", and 49.9 must take "3 to 5 days".** Task 2 pins both, plus a no-gap, no-overlap check over many CrCl values.
- **Ertugliflozin must say 4 days, the other three 3 days.** Task 1 pins it.
- **Apixaban must show both the 48-hour and the 24-hour line.** It must never silently pick one. Task 1 pins it.
- **Without a CrCl, both dabigatran lines stay visible** with a note to enter the inputs. The longer interval must never be hidden. Task 2 pins it.
- **The DOAC card must always carry the "not ASRA neuraxial intervals" caution.** Task 1 pins that the data carries it, and Task 3 checks it by hand.
- **The GLP-1 card must state no timing.** Task 1 pins it.
- **New case clears the ticks, and nothing about medications reaches localStorage.** Task 3 pins it.

---

### Task 1: Label sources and rule data

**Files:**
- Modify: `src/data/sources.ts` (append eight `label(...)` sources before the closing `];` of `SOURCES`; bump `DATA_VERSION`)
- Create: `src/data/periopMeds.ts`, `src/data/__tests__/periopMeds.test.ts`
- Modify: `src/data/derived.ts` (import and one loop)

**Interfaces:**
- Produces:
  - `interface PeriopTiming { when?: string; text: string; crclMin?: number; crclBelow?: number }` (CrCl bounds in mL/min; `crclMin` inclusive, `crclBelow` exclusive)
  - `interface PeriopDrug { id: string; name: string; timings: PeriopTiming[]; catheter?: string[]; restart: string; sourceId: string }`
  - `type PeriopAction = 'continue' | 'hold' | 'modify' | 'individualise'`
  - `interface PeriopMedRule { id: string; drugClass: string; action: PeriopAction; summary: string; why?: string; cautions?: string[]; drugs: PeriopDrug[]; sourceIds: string[] }`
  - `SGLT2_RULE`, `DOAC_RULE`, `GLP1_RULE`, `PERIOP_RULES: PeriopMedRule[]`
- Source ids: `label-empagliflozin`, `label-dapagliflozin`, `label-canagliflozin`, `label-ertugliflozin`, `label-apixaban`, `label-rivaroxaban`, `label-edoxaban`, `label-dabigatran`.

- [ ] **Step 0: Branch**

Work in your own worktree on a branch created from `feat/assess-scores`. Do not touch the main checkout.

- [ ] **Step 1: Confirm each setid is the manufacturer's label**

Run this once and check that each line names the expected company. If any line does not, **stop and report it instead of committing**:

```bash
python -I - <<'EOF'
import re, urllib.request
ids = {
 'empagliflozin (Boehringer)': 'faf3dd6a-9cd0-39c2-0d2e-232cb3f67565',
 'dapagliflozin (AstraZeneca)': '72ad22ae-efe6-4cd6-a302-98aaee423d69',
 'canagliflozin (Janssen)': 'b9057d3b-b104-4f09-8a61-c61ef9d4a3f3',
 'ertugliflozin (Merck)': 'e6f3e718-bb99-48f1-ab94-b9f0af05fed6',
 'apixaban (Bristol-Myers Squibb)': 'e9481622-7cc6-418a-acb6-c5450daae9b0',
 'rivaroxaban (Janssen)': '10db92f9-2300-4a80-836b-673e1ae91610',
 'dabigatran capsules (Boehringer)': 'ba74e3cd-b06f-4145-b284-5fd6b84ff3c9',
 'edoxaban (Daiichi Sankyo)': 'e77d3400-56ad-11e3-949a-0800200c9a66',
}
for name, setid in ids.items():
    x = urllib.request.urlopen(f"https://dailymed.nlm.nih.gov/dailymed/services/v2/spls/{setid}.xml", timeout=60).read().decode('utf-8', 'ignore')
    m = re.search(r'representedOrganization>.*?<name>([^<]+)</name>', x, re.S)
    print(f"{name:36} -> {m.group(1).strip() if m else 'NO ORGANIZATION FOUND'}")
EOF
```

- [ ] **Step 2: Write the failing test**

Create `src/data/__tests__/periopMeds.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { DOAC_RULE, GLP1_RULE, PERIOP_RULES, SGLT2_RULE } from '../periopMeds';
import { SOURCE_BY_ID } from '../sources';

const drug = (rule: typeof DOAC_RULE, id: string) => {
  const d = rule.drugs.find((x) => x.id === id);
  if (!d) throw new Error(`missing drug ${id}`);
  return d;
};

describe('perioperative medication rules', () => {
  it('have unique rule ids and unique drug ids', () => {
    const ruleIds = PERIOP_RULES.map((r) => r.id);
    expect(new Set(ruleIds).size).toBe(ruleIds.length);
    const drugIds = PERIOP_RULES.flatMap((r) => r.drugs.map((d) => d.id));
    expect(new Set(drugIds).size).toBe(drugIds.length);
  });

  it('cite sources that exist, and every drug is cited by its rule and backed by a product label', () => {
    for (const r of PERIOP_RULES) {
      expect(r.sourceIds.length, r.id).toBeGreaterThan(0);
      for (const id of r.sourceIds) expect(SOURCE_BY_ID[id], `${r.id} -> ${id}`).toBeDefined();
      for (const d of r.drugs) {
        expect(r.sourceIds, `${r.id} lists ${d.id}'s source`).toContain(d.sourceId);
        expect(SOURCE_BY_ID[d.sourceId].verification, d.id).toBe('label');
      }
    }
  });

  it('give every drug at least one timing and a restart statement', () => {
    for (const d of PERIOP_RULES.flatMap((r) => r.drugs)) {
      expect(d.timings.length, d.id).toBeGreaterThan(0);
      expect(d.restart.length, d.id).toBeGreaterThan(0);
    }
  });

  it('SGLT2: ertugliflozin says 4 days, the other three say 3 days', () => {
    expect(drug(SGLT2_RULE, 'ertugliflozin').timings[0].text).toContain('at least 4 days');
    for (const id of ['empagliflozin', 'dapagliflozin', 'canagliflozin']) {
      expect(drug(SGLT2_RULE, id).timings[0].text, id).toContain('at least 3 days');
    }
  });

  it('DOAC: apixaban shows both the 48-hour and the 24-hour line', () => {
    const texts = drug(DOAC_RULE, 'apixaban').timings.map((t) => t.text).join(' | ');
    expect(texts).toContain('at least 48 hours');
    expect(texts).toContain('at least 24 hours');
  });

  it('DOAC: dabigatran has a 1 to 2 day line at CrCl 50 or more and a 3 to 5 day line below 50', () => {
    const t = drug(DOAC_RULE, 'dabigatran').timings;
    expect(t.find((x) => x.crclMin === 50)?.text).toContain('1 to 2 days');
    expect(t.find((x) => x.crclBelow === 50)?.text).toContain('3 to 5 days');
  });

  it('DOAC: always carries the caution that label timings are not ASRA neuraxial intervals', () => {
    expect(DOAC_RULE.cautions?.some((c) => c.includes('ASRA') && /spinal|epidural|neuraxial/i.test(c))).toBe(true);
  });

  it('GLP-1: points to the comparison and states no timing of its own', () => {
    expect(GLP1_RULE.drugs).toEqual([]);
    expect(GLP1_RULE.action).toBe('individualise');
    expect(GLP1_RULE.summary).not.toMatch(/\b\d+\s*(h|hours?|days?|weeks?)\b/i);
  });
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `npx vitest run src/data/__tests__/periopMeds.test.ts`
Expected: FAIL, cannot resolve `../periopMeds`.

- [ ] **Step 4: Register the label sources**

In `src/data/sources.ts`, change `DATA_VERSION` to `'2026.11.17-draft18'`. Append these eight entries as the last items of `SOURCES` (just before the closing `];`). `label()` is the existing helper at the top of the file:

```ts
  label('label-empagliflozin', 'JARDIANCE (empagliflozin) tablets', 'DailyMed / Boehringer Ingelheim', 'faf3dd6a-9cd0-39c2-0d2e-232cb3f67565', ['empagliflozin: withhold at least 3 days before surgery or prolonged fasting; resume when stable and eating'], 'Dosage and Administration (temporary interruption for surgery) and Warnings (ketoacidosis) read in full from the DailyMed label on 2026-11-17. Labels change and vary by manufacturer; confirm against the product in use.'),
  label('label-dapagliflozin', 'FARXIGA (dapagliflozin) tablets', 'DailyMed / AstraZeneca', '72ad22ae-efe6-4cd6-a302-98aaee423d69', ['dapagliflozin: withhold at least 3 days before surgery or prolonged fasting; resume when stable and eating'], 'Dosage and Administration (temporary interruption for surgery) and Warnings (ketoacidosis) read in full from the DailyMed label on 2026-11-17. Labels change and vary by manufacturer; confirm against the product in use.'),
  label('label-canagliflozin', 'INVOKANA (canagliflozin) tablets', 'DailyMed / Janssen', 'b9057d3b-b104-4f09-8a61-c61ef9d4a3f3', ['canagliflozin: withhold at least 3 days before surgery or prolonged fasting; resume when stable and eating'], 'Dosage and Administration (temporary interruption for surgery) and Warnings (ketoacidosis) read in full from the DailyMed label on 2026-11-17. Labels change and vary by manufacturer; confirm against the product in use.'),
  label('label-ertugliflozin', 'STEGLATRO (ertugliflozin) tablets', 'DailyMed / Merck', 'e6f3e718-bb99-48f1-ab94-b9f0af05fed6', ['ertugliflozin: withhold at least 4 days before surgery or prolonged fasting; resume when stable and eating'], 'Dosage and Administration (temporary interruption for surgery) and Warnings (ketoacidosis) read in full from the DailyMed label on 2026-11-17. This is the one SGLT2 inhibitor whose label says 4 days, not 3. Labels change and vary by manufacturer; confirm against the product in use.'),
  label('label-apixaban', 'ELIQUIS (apixaban) tablets', 'DailyMed / Bristol-Myers Squibb', 'e9481622-7cc6-418a-acb6-c5450daae9b0', ['apixaban: interruption before surgery by bleeding risk; epidural catheter timing; restart'], 'Dosage and Administration (temporary interruption for surgery) and the spinal/epidural hematoma section read in full from the DailyMed label on 2026-11-17. These are label timings for surgery, not ASRA neuraxial intervals. Labels change and vary by manufacturer; confirm against the product in use.'),
  label('label-rivaroxaban', 'XARELTO (rivaroxaban) tablets', 'DailyMed / Janssen', '10db92f9-2300-4a80-836b-673e1ae91610', ['rivaroxaban: interruption before surgery; epidural catheter timing; restart'], 'Dosage and Administration (discontinuation for surgery) and the spinal/epidural hematoma section read in full from the DailyMed label on 2026-11-17. These are label timings for surgery, not ASRA neuraxial intervals. Labels change and vary by manufacturer; confirm against the product in use.'),
  label('label-edoxaban', 'SAVAYSA (edoxaban) tablets', 'DailyMed / Daiichi Sankyo', 'e77d3400-56ad-11e3-949a-0800200c9a66', ['edoxaban: interruption before surgery; epidural catheter timing; restart'], 'Dosage and Administration (discontinuation for surgery) and the spinal/epidural hematoma section read in full from the DailyMed label on 2026-11-17. These are label timings for surgery, not ASRA neuraxial intervals. Labels change and vary by manufacturer; confirm against the product in use.'),
  label('label-dabigatran', 'PRADAXA (dabigatran etexilate) capsules', 'DailyMed / Boehringer Ingelheim', 'ba74e3cd-b06f-4145-b284-5fd6b84ff3c9', ['dabigatran (adult capsules): interruption before surgery by creatinine clearance; restart'], 'Dosage and Administration 2.8 (discontinuation for surgery) read in full from the DailyMed label on 2026-11-17. The pediatric pellet label is a different document and is not used. These are label timings for surgery, not ASRA neuraxial intervals. Labels change and vary by manufacturer; confirm against the product in use.'),
```

- [ ] **Step 5: Write the rule data**

Create `src/data/periopMeds.ts`:

```ts
// Perioperative medication instructions. Every drug cites a manufacturer label registered in sources.ts and
// quotes the label's own wording; nothing is rounded, merged or inferred. Guideline-based classes (ASRA, AHA/ACC,
// ESC) are not here until their full texts are read.

export type PeriopAction = 'continue' | 'hold' | 'modify' | 'individualise';

export interface PeriopTiming {
  /** The condition the label attaches, when it has one. */
  when?: string;
  /** The instruction as the label words it. */
  text: string;
  /** Applies when creatinine clearance (mL/min) is at least this. */
  crclMin?: number;
  /** Applies when creatinine clearance (mL/min) is below this. */
  crclBelow?: number;
}

export interface PeriopDrug {
  id: string;
  name: string;
  timings: PeriopTiming[];
  /** Label statements about epidural or intrathecal catheters and punctures. */
  catheter?: string[];
  restart: string;
  sourceId: string;
}

export interface PeriopMedRule {
  id: string;
  drugClass: string;
  action: PeriopAction;
  summary: string;
  /** One-sentence rationale for trainees. */
  why?: string;
  cautions?: string[];
  drugs: PeriopDrug[];
  sourceIds: string[];
}

const SGLT2_RESTART = 'Resume when the patient is clinically stable and has resumed oral intake.';

const sglt2 = (id: string, name: string, days: 3 | 4): PeriopDrug => ({
  id,
  name,
  timings: [{ text: `Withhold for at least ${days} days, if possible, prior to surgery or procedures associated with prolonged fasting.` }],
  restart: SGLT2_RESTART,
  sourceId: `label-${id}`,
});

export const SGLT2_RULE: PeriopMedRule = {
  id: 'sglt2i',
  drugClass: 'SGLT2 inhibitors',
  action: 'hold',
  summary: 'Withhold before surgery or procedures with prolonged fasting, if possible.',
  why: 'The labels list surgery and reduced caloric intake among the conditions that precipitate ketoacidosis.',
  drugs: [
    sglt2('empagliflozin', 'Empagliflozin (Jardiance)', 3),
    sglt2('dapagliflozin', 'Dapagliflozin (Farxiga)', 3),
    sglt2('canagliflozin', 'Canagliflozin (Invokana)', 3),
    sglt2('ertugliflozin', 'Ertugliflozin (Steglatro)', 4),
  ],
  sourceIds: ['label-empagliflozin', 'label-dapagliflozin', 'label-canagliflozin', 'label-ertugliflozin'],
};

export const DOAC_RULE: PeriopMedRule = {
  id: 'doac',
  drugClass: 'Direct oral anticoagulants (DOACs)',
  action: 'hold',
  summary: 'Stop before surgery or invasive procedures. The interval depends on the drug, and for dabigatran on creatinine clearance.',
  why: 'The labels ask for interruption before procedures because of the risk of bleeding.',
  cautions: [
    "These are the manufacturers' timings for surgery and procedures. They are not the ASRA intervals for placing a spinal, epidural or deep block, which this app does not contain yet. Check the current ASRA guideline before any neuraxial or deep block.",
  ],
  drugs: [
    {
      id: 'apixaban',
      name: 'Apixaban (Eliquis)',
      timings: [
        {
          when: 'Moderate or high risk of unacceptable or clinically significant bleeding',
          text: 'Discontinue at least 48 hours prior to elective surgery or invasive procedures.',
        },
        {
          when: 'Low risk of bleeding, or bleeding that would be non-critical in location and easily controlled',
          text: 'Discontinue at least 24 hours prior to elective surgery or invasive procedures.',
        },
      ],
      catheter: [
        'Indwelling epidural or intrathecal catheters should not be removed earlier than 24 hours after the last administration.',
        'The next dose should not be administered earlier than 5 hours after the removal of the catheter.',
      ],
      restart: 'Restart after the surgical or other procedures as soon as adequate hemostasis has been established.',
      sourceId: 'label-apixaban',
    },
    {
      id: 'rivaroxaban',
      name: 'Rivaroxaban (Xarelto)',
      timings: [
        { text: 'If anticoagulation must be discontinued to reduce the risk of bleeding with surgical or other procedures, stop at least 24 hours before the procedure.' },
      ],
      catheter: [
        'Placement or removal of an epidural catheter or lumbar puncture is best performed when the anticoagulant effect is low; however, the exact timing to reach a sufficiently low anticoagulant effect in each patient is not known.',
        'An indwelling epidural or intrathecal catheter should not be removed before at least 2 half-lives have elapsed (i.e., 18 hours in young patients aged 20 to 45 years and 26 hours in elderly patients aged 60 to 76 years), after the last administration.',
        'The next dose should not be administered earlier than 6 hours after the removal of the catheter.',
      ],
      restart:
        'Restart after the surgical or other procedures as soon as adequate hemostasis has been established, noting that the time to onset of therapeutic effect is short.',
      sourceId: 'label-rivaroxaban',
    },
    {
      id: 'edoxaban',
      name: 'Edoxaban (Savaysa)',
      timings: [{ text: 'Discontinue at least 24 hours before invasive or surgical procedures because of the risk of bleeding.' }],
      catheter: [
        'Indwelling epidural or intrathecal catheters should not be removed earlier than 12 hours after the last administration.',
        'The next dose should not be administered earlier than 2 hours after the removal of the catheter.',
      ],
      restart:
        'Can be restarted after the surgical or other procedure as soon as adequate hemostasis has been established, noting that the time to onset of pharmacodynamic effect is 1-2 hours.',
      sourceId: 'label-edoxaban',
    },
    {
      id: 'dabigatran',
      name: 'Dabigatran (Pradaxa capsules, adults)',
      timings: [
        {
          when: 'CrCl 50 mL/min or more',
          crclMin: 50,
          text: 'If possible, discontinue 1 to 2 days before invasive or surgical procedures because of the increased risk of bleeding.',
        },
        {
          when: 'CrCl below 50 mL/min',
          crclBelow: 50,
          text: 'If possible, discontinue 3 to 5 days before invasive or surgical procedures because of the increased risk of bleeding.',
        },
        { text: 'Consider longer times for patients undergoing major surgery, spinal puncture, or placement of a spinal or epidural catheter or port.' },
      ],
      restart: 'Temporarily discontinue before invasive or surgical procedures when possible, then restart promptly.',
      sourceId: 'label-dabigatran',
    },
  ],
  sourceIds: ['label-apixaban', 'label-rivaroxaban', 'label-edoxaban', 'label-dabigatran'],
};

export const GLP1_RULE: PeriopMedRule = {
  id: 'glp1ra',
  drugClass: 'GLP-1 receptor agonists',
  action: 'individualise',
  summary:
    'Published perioperative protocols conflict on both the drug instruction and the fasting instruction, so this app does not pick one. See "GLP-1 perioperative protocols" in References (the book icon) for the side-by-side comparison.',
  drugs: [],
  sourceIds: ['asa-glp1-2023', 'glp1-multisociety-2024', 'glp1-spaqi-2025', 'glp1-uk-2025', 'glp1-anzca-2025'],
};

export const PERIOP_RULES: PeriopMedRule[] = [SGLT2_RULE, DOAC_RULE, GLP1_RULE];
```

In `src/data/derived.ts`, add the import `import { PERIOP_RULES } from './periopMeds';` (next to the other data imports) and this loop before `for (const [id, lines] of Object.entries(PRINCIPLE_SOURCES))`:

```ts
  for (const r of PERIOP_RULES) {
    for (const d of r.drugs) add([d.sourceId], `Perioperative ${r.drugClass}: ${d.name}: ${d.timings.map((t) => t.text).join(' | ')}`);
    if (r.drugs.length === 0) add(r.sourceIds, `Perioperative ${r.drugClass}: ${r.summary}`);
  }
```

- [ ] **Step 6: Run the data tests and the full suite**

Run: `npx vitest run src/data/__tests__/periopMeds.test.ts src/data/__tests__/integrity.test.ts src/data/__tests__/sourceRefs.test.ts`
Expected: PASS (8 tests in the new file). If `integrity.test.ts` fails on the exact-equality no-URL list, the new labels all carry a DailyMed URL, so a failure means a setid was mistyped.

Run: `npm run verify`
Expected: all tests pass, type-check clean, build succeeds.

- [ ] **Step 7: Commit**

```bash
git add src/data/sources.ts src/data/periopMeds.ts src/data/__tests__/periopMeds.test.ts src/data/derived.ts
git commit -m "feat(meds): add label-verified SGLT2 inhibitor and DOAC perioperative rules"
```

---

### Task 2: Timing matcher

**Files:**
- Create: `src/lib/calc/periopMeds.ts`
- Test: `src/lib/calc/__tests__/periopMeds.test.ts`

**Interfaces:**
- Consumes: `PeriopDrug`, `PeriopTiming`, `PERIOP_RULES` from `src/data/periopMeds.ts` (Task 1).
- Produces:
  - `type TimingMatch = 'yes' | 'no' | 'unknown' | 'always'`
  - `interface MatchedTiming { timing: PeriopTiming; match: TimingMatch }`
  - `matchTimings(drug: PeriopDrug, crclMlPerMin: number | null): MatchedTiming[]`

- [ ] **Step 1: Write the failing test**

Create `src/lib/calc/__tests__/periopMeds.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { DOAC_RULE, PERIOP_RULES } from '../../../data/periopMeds';
import { matchTimings } from '../periopMeds';

const dabigatran = DOAC_RULE.drugs.find((d) => d.id === 'dabigatran')!;
const apixaban = DOAC_RULE.drugs.find((d) => d.id === 'apixaban')!;

const byWhen = (m: ReturnType<typeof matchTimings>, text: string) => m.find((x) => x.timing.when?.includes(text))!;

describe('matchTimings (dabigatran by creatinine clearance)', () => {
  it('CrCl exactly 50 takes the 1 to 2 day line', () => {
    const m = matchTimings(dabigatran, 50);
    expect(byWhen(m, '50 mL/min or more').match).toBe('yes');
    expect(byWhen(m, 'below 50').match).toBe('no');
  });

  it('CrCl 49.9 takes the 3 to 5 day line', () => {
    const m = matchTimings(dabigatran, 49.9);
    expect(byWhen(m, '50 mL/min or more').match).toBe('no');
    expect(byWhen(m, 'below 50').match).toBe('yes');
  });

  it('without a CrCl both lines stay visible and are marked unknown', () => {
    const m = matchTimings(dabigatran, null);
    expect(byWhen(m, '50 mL/min or more').match).toBe('unknown');
    expect(byWhen(m, 'below 50').match).toBe('unknown');
  });

  it('the unconditional line is always shown', () => {
    expect(matchTimings(dabigatran, 80).filter((x) => x.match === 'always')).toHaveLength(1);
  });
});

describe('matchTimings (unconditional drugs)', () => {
  it('apixaban keeps both lines, marked always, whatever the CrCl', () => {
    for (const crcl of [null, 20, 90]) {
      const m = matchTimings(apixaban, crcl);
      expect(m).toHaveLength(2);
      expect(m.every((x) => x.match === 'always')).toBe(true);
    }
  });
});

describe('CrCl-conditional timings never leave a gap or an overlap', () => {
  it.each([0, 10, 29.9, 49.99, 50, 50.01, 89, 150])('CrCl %s matches exactly one conditional line per drug', (crcl) => {
    for (const drug of PERIOP_RULES.flatMap((r) => r.drugs)) {
      const conditional = matchTimings(drug, crcl).filter((x) => x.match !== 'always');
      if (conditional.length === 0) continue;
      expect(conditional.filter((x) => x.match === 'yes'), `${drug.id} at ${crcl}`).toHaveLength(1);
    }
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/lib/calc/__tests__/periopMeds.test.ts`
Expected: FAIL, cannot resolve `../periopMeds`.

- [ ] **Step 3: Write the implementation**

Create `src/lib/calc/periopMeds.ts`:

```ts
import type { PeriopDrug, PeriopTiming } from '../../data/periopMeds';

/** 'always': no CrCl condition, shown to everyone. 'unknown': conditional, but no CrCl yet, so the line stays visible. */
export type TimingMatch = 'yes' | 'no' | 'unknown' | 'always';

export interface MatchedTiming {
  timing: PeriopTiming;
  match: TimingMatch;
}

/**
 * Marks which label timing fits the patient's creatinine clearance (mL/min, unrounded).
 * Nothing is ever removed: without a CrCl every conditional line stays visible, so the longer interval is never hidden.
 */
export const matchTimings = (drug: PeriopDrug, crclMlPerMin: number | null): MatchedTiming[] =>
  drug.timings.map((timing) => {
    if (timing.crclMin === undefined && timing.crclBelow === undefined) return { timing, match: 'always' };
    if (crclMlPerMin === null) return { timing, match: 'unknown' };
    const fits =
      (timing.crclMin === undefined || crclMlPerMin >= timing.crclMin) &&
      (timing.crclBelow === undefined || crclMlPerMin < timing.crclBelow);
    return { timing, match: fits ? 'yes' : 'no' };
  });
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/lib/calc/__tests__/periopMeds.test.ts`
Expected: PASS, 13 tests.

Run: `npm run verify`
Expected: all tests pass, type-check clean, build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/lib/calc/periopMeds.ts src/lib/calc/__tests__/periopMeds.test.ts
git commit -m "feat(meds): match dabigatran timings to creatinine clearance"
```

---

### Task 3: Store and the Medications panel

**Files:**
- Modify: `src/store/useAppStore.ts`, `src/components/ScorePanel.tsx`, `src/App.tsx`
- Create: `src/components/MedsPanel.tsx`
- Test: modify `src/store/__tests__/assess.test.ts`

**Interfaces:**
- Consumes: `PERIOP_RULES`, `PeriopDrug`, `PeriopMedRule` (Task 1); `matchTimings` (Task 2); `creatinineClearance` from `src/lib/calc/crcl.ts` (step 2); `ScoreItem`, `Panel`, `SourceBadge`, `WarningBanner`.
- Produces: store field `medsTaken: Record<string, boolean>` (memory only) and action `toggleMedTaken(id)`. `ScoreItem` is exported from `ScorePanel.tsx`.

- [ ] **Step 1: Write the failing tests**

In `src/store/__tests__/assess.test.ts`:

- Change the forbidden list in the first test to `['patient', 'creatinineUmolL', 'scoreAnswers', 'medsTaken']`.
- Add these tests inside the `describe`:

```ts
  it('toggles a medication class on and off', () => {
    useAppStore.getState().toggleMedTaken('doac');
    expect(useAppStore.getState().medsTaken.doac).toBe(true);
    useAppStore.getState().toggleMedTaken('doac');
    expect(useAppStore.getState().medsTaken.doac).toBe(false);
  });

  it('New case clears the ticked medications', () => {
    useAppStore.getState().toggleMedTaken('sglt2i');
    useAppStore.getState().newCase();
    expect(useAppStore.getState().medsTaken).toEqual({});
  });
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run src/store/__tests__/assess.test.ts`
Expected: FAIL (`toggleMedTaken` is not a function).

- [ ] **Step 3: Store changes**

In `src/store/useAppStore.ts`:

1. In `AppState`, after `  scoreAnswers: Record<string, boolean>;` add `  medsTaken: Record<string, boolean>;`
2. In `AppState`, after `  toggleScoreItem: (id: string) => void;` add `  toggleMedTaken: (id: string) => void;`
3. In the **initial state**, replace the two lines `      scoreAnswers: {},` / `      emergencyOpen: false,` with:

```ts
      scoreAnswers: {},
      medsTaken: {},
      emergencyOpen: false,
```

4. In `newCase`, replace the two lines `          scoreAnswers: {},` / `          checks: {},` with:

```ts
          scoreAnswers: {},
          medsTaken: {},
          checks: {},
```

5. After the `toggleScoreItem: (id) => set(...)` line, add:

```ts
      toggleMedTaken: (id) => set((s) => ({ medsTaken: { ...s.medsTaken, [id]: !s.medsTaken[id] } })),
```

Do **not** add `medsTaken` to `partialize` and do **not** change the persist `version`.

- [ ] **Step 4: Run the store tests**

Run: `npx vitest run src/store/__tests__/assess.test.ts src/store/__tests__/migrate.test.ts`
Expected: PASS.

- [ ] **Step 5: Export the tick button and write the panel**

In `src/components/ScorePanel.tsx`, change `const ScoreItem: React.FC<ScoreItemProps> = (` to `export const ScoreItem: React.FC<ScoreItemProps> = (`.

Create `src/components/MedsPanel.tsx`:

```tsx
import React from 'react';
import { PERIOP_RULES, type PeriopAction, type PeriopDrug, type PeriopMedRule } from '../data/periopMeds';
import { creatinineClearance } from '../lib/calc/crcl';
import { matchTimings } from '../lib/calc/periopMeds';
import { useAppStore } from '../store/useAppStore';
import { Panel } from './hud/Panel';
import { ScoreItem } from './ScorePanel';
import { SourceBadge } from './ui/SourceBadge';
import { WarningBanner } from './ui/WarningBanner';

const ACTION_LABEL: Record<PeriopAction, string> = {
  continue: 'Continue',
  hold: 'Hold',
  modify: 'Modify',
  individualise: 'Individualise',
};

const DrugBlock: React.FC<{ drug: PeriopDrug; crcl: number | null }> = ({ drug, crcl }) => (
  <div className="flex flex-col gap-1.5 rounded-xl border border-clinical-border bg-clinical-bg/60 p-2.5">
    <h4 className="text-sm font-bold text-slate-100">{drug.name}</h4>
    {matchTimings(drug, crcl).map(({ timing, match }) => (
      <p key={timing.text} className={`text-sm ${match === 'no' ? 'text-slate-500' : 'text-slate-100'}`}>
        {timing.when && <span className="font-semibold text-cyan-300">{timing.when}: </span>}
        {timing.text}
        {match === 'yes' && crcl !== null && (
          <span className="ml-1 font-mono text-xs text-emerald-300">(this patient: CrCl {crcl.toFixed(1)} mL/min)</span>
        )}
        {match === 'unknown' && <span className="ml-1 text-xs text-amber-300">(enter age, weight, sex and creatinine in Assess to match)</span>}
      </p>
    ))}
    {drug.catheter && (
      <div className="flex flex-col gap-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Epidural / intrathecal catheters (label)</p>
        {drug.catheter.map((c) => (
          <p key={c} className="text-xs text-slate-300">
            {c}
          </p>
        ))}
      </div>
    )}
    <p className="text-xs text-slate-300">Restart: {drug.restart}</p>
    <SourceBadge sourceIds={[drug.sourceId]} />
  </div>
);

const RuleCard: React.FC<{ rule: PeriopMedRule; crcl: number | null }> = ({ rule, crcl }) => (
  <Panel title={rule.drugClass} sourceIds={rule.sourceIds}>
    <p className="text-sm text-slate-200">
      <span className="font-bold text-amber-300">{ACTION_LABEL[rule.action]}.</span> {rule.summary}
    </p>
    {rule.cautions?.map((c) => (
      <WarningBanner key={c} level="amber">
        {c}
      </WarningBanner>
    ))}
    {rule.drugs.map((d) => (
      <DrugBlock key={d.id} drug={d} crcl={crcl} />
    ))}
    {rule.why && <p className="text-xs text-slate-400">Why: {rule.why}</p>}
  </Panel>
);

/** Pre-op medications: tick what the patient takes to see the manufacturers' perioperative instructions. */
export const MedsPanel: React.FC = () => {
  const taken = useAppStore((s) => s.medsTaken);
  const toggle = useAppStore((s) => s.toggleMedTaken);
  const patient = useAppStore((s) => s.patient);
  const clearance = creatinineClearance({
    ageYears: patient.ageYears,
    tbwKg: patient.tbwKg,
    sex: patient.sex,
    creatinineUmolL: patient.creatinineUmolL,
  });
  const crcl = clearance.kind === 'ok' ? clearance.mlPerMin : null;

  return (
    <div className="mb-3 flex flex-col gap-3">
      <Panel title="Perioperative medications">
        <p className="text-xs text-slate-400">
          Tick what the patient takes. Instructions are the manufacturers' label wording, not ASRA neuraxial intervals.
        </p>
        <div className="flex flex-col gap-1.5">
          {PERIOP_RULES.map((r) => (
            <ScoreItem key={r.id} label={r.drugClass} checked={taken[r.id] === true} locked={false} onToggle={() => toggle(r.id)} />
          ))}
        </div>
      </Panel>
      {PERIOP_RULES.filter((r) => taken[r.id]).map((r) => (
        <RuleCard key={r.id} rule={r} crcl={crcl} />
      ))}
    </div>
  );
};
```

- [ ] **Step 6: Wire it into the Pre-op tab**

In `src/App.tsx`, add the import `import { MedsPanel } from './components/MedsPanel';` and put it between the Assess view and the checklist:

```tsx
          <AssessView />
          <MedsPanel />
          <ChecklistsView phaseLists={listsFor('preop')} />
```

- [ ] **Step 7: Run the tests**

Run: `npx vitest run src/store/__tests__/assess.test.ts`
Expected: PASS.

Run: `npm run verify`
Expected: all tests pass, type-check clean, build succeeds.

- [ ] **Step 8: Check by hand**

Run `npm run dev` and open http://localhost:5173, Pre-op tab.
- Below Assess there is a "Perioperative medications" panel with three tick rows: SGLT2 inhibitors, DOACs, GLP-1 receptor agonists. Nothing is expanded until ticked.
- Tick **SGLT2 inhibitors**: four drugs appear. Empagliflozin, dapagliflozin and canagliflozin say "at least 3 days"; ertugliflozin says "at least 4 days". Each shows the restart sentence and a source badge.
- Tick **DOACs**: an amber caution about ASRA neuraxial intervals is visible at the top. Apixaban shows both the 48-hour and the 24-hour line. Rivaroxaban and edoxaban show their catheter statements. Dabigatran shows both CrCl lines, each with "(enter age, weight, sex and creatinine in Assess to match)".
- Enter a man, 70 y, 70 kg, 170 cm, creatinine 1.0 mg/dL (CrCl 68): the dabigatran "CrCl 50 mL/min or more" line shows "(this patient: CrCl 68.1 mL/min)" and the "below 50" line is dimmed. Change creatinine to 2.0 mg/dL (CrCl 34): the "below 50" line is matched instead.
- Tick **GLP-1 receptor agonists**: a pointer card with no numbers. The References book icon opens the GLP-1 comparison.
- **New case** unticks everything. After a reload nothing is ticked.
- The Assess panels and the fasting checklist still work.

- [ ] **Step 9: Commit**

```bash
git add src/store/useAppStore.ts src/components/ScorePanel.tsx src/components/MedsPanel.tsx src/App.tsx src/store/__tests__/assess.test.ts
git commit -m "feat(meds): add the Pre-op Medications section"
```

---

### Task 4: Docs

**Files:**
- Modify: `README.md`
- Modify: `docs/superpowers/specs/2026-11-17-perioperative-guide-design.md`

- [ ] **Step 1: README**

In `README.md`:

1. Replace `the RCRI and STOP-Bang) above the Fasting / NPO checklist.` with `the RCRI and STOP-Bang) and a Medications section (SGLT2 inhibitors and DOACs, with the manufacturers' label wording, and a pointer for GLP-1 agonists) above the Fasting / NPO checklist.`
2. In "What is and is not stored", replace `serum creatinine, risk-score answers,` with `serum creatinine, risk-score answers, ticked medications,`.

- [ ] **Step 2: Spec**

In the spec's §10 rollout list, replace the line `3. **Peri-op meds.**` with:

```
3. **Peri-op meds** (plan: `docs/superpowers/plans/2026-11-17-periop-meds.md`): first slice, label-verified only. SGLT2 inhibitors (3 days; ertugliflozin 4 days) and DOACs (apixaban, rivaroxaban, edoxaban, dabigatran by CrCl, with the labels' epidural catheter statements) from the manufacturers' DailyMed labels read in full, plus a GLP-1 pointer to the existing protocol comparison. The DOAC card states that label timings are not ASRA neuraxial intervals. **Step 3b** (needs the guideline full texts, which were not readable; re-run `notebooklm login` or supply PDFs): ASRA neuraxial and deep-block intervals, warfarin, heparins and antiplatelets, ACEi/ARB, beta-blockers and statins, steroid stress dosing, insulin and oral hypoglycaemics, MAOIs, lithium, antiepileptics and antiparkinsonian drugs. The CrCl bands the spec mentioned are not needed yet: dabigatran uses the label's own 50 mL/min split.
```

- [ ] **Step 3: Verify and commit**

Run: `npm run verify`
Expected: PASS.

```bash
git add README.md docs/superpowers/specs/2026-11-17-perioperative-guide-design.md
git commit -m "docs: record the Medications section in the README and spec step 3"
```
