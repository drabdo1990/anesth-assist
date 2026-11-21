# Perioperative Medications, Guideline Slice (Step 3b) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add twelve cards to the Pre-op Medications list: the ASRA fifth-edition intervals for placing or removing a spinal, epidural or deep block in patients on antithrombotic drugs (seven cards), and the AHA/ACC 2024 and ESC 2022 statements on chronic cardiac drugs (five cards). Every instruction is the guideline's own sentence.

**Architecture:** The cards are data, using the existing `PeriopMedRule` shape, so the existing `MedsPanel`, `matchTimings`, store (`medsTaken`) and pre-op note carry them with only small changes: an optional `restart`, a `section` heading, and neutral wording. The ASRA rules live in `src/data/periopAsra.ts` and the cardiac rules in `src/data/periopCardiac.ts`; both only `import type` from `periopMeds.ts`, which assembles `PERIOP_RULES`.

**Tech Stack:** React 19, Zustand 5, Tailwind 3, Vitest 4. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-11-17-perioperative-guide-design.md` (rollout step 3, second slice; Task 3 records it as step 3b).

## Scope decisions (read first)

**This plan encodes only what was read from the guidelines' own full text on 2026-11-17** (the copies in the project notebook "Anesthesia nootbooks", read with `notebooklm source fulltext`). The two data files below were generated from that text by script, not retyped, and every statement was checked to end the way its source ends (a grade or a full stop), so none was cut short.

**In:**
- **ASRA Pain Medicine, fifth edition (Kopp et al., Reg Anesth Pain Med 2025, doi 10.1136/rapm-2024-105766):** warfarin; unfractionated heparin (intravenous and subcutaneous); LMWH; fondaparinux; DOACs (apixaban, edoxaban, rivaroxaban, dabigatran, with the high and low dose lines and dabigatran's creatinine clearance lines); antiplatelet drugs (aspirin and NSAIDs, clopidogrel and prasugrel, ticagrelor, cilostazol, cangrelor, GP IIb/IIIa inhibitors); thrombolytics. For each: the interval before needle placement or catheter removal, the catheter and monitoring statements, and the first post-block dose where ASRA gives one. Each sentence is copied with its grade, for example "(grade IIC)".
- **AHA/ACC 2024 and ESC 2022:** beta-blockers; statins; ACE inhibitors, ARBs and other RAAS inhibitors; antiplatelet drugs after a coronary stent (aspirin, clopidogrel, prasugrel, ticagrelor); oral anticoagulants and bridging. The two guidelines are shown side by side, one block per guideline. ESC lines carry the class and level printed in its recommendation tables. AHA/ACC lines carry none, because the copy's layout separates the class from the statement.

**Left out, and why:**
- **Steroid stress dosing, insulin and oral hypoglycaemics, MAOIs, lithium, antiepileptics, antiparkinsonian drugs:** no guideline text for them is in the notebook. They stay out; nothing is written from memory.
- **The ESAIC/ESRA 2022 joint guideline** (also in the notebook): it differs from ASRA on some intervals (for example high-dose aspirin and fondaparinux). A side-by-side comparison is its own later step.
- **Herbal medications, obstetric neuraxial timing, "superficial" (compressible) blocks:** not encoded in this step.
- **The doses behind ASRA's "high" and "low" DOAC doses:** ASRA's tables were not in the extracted text. The DOAC card shows both lines and says so, and the app does not invent the doses.
- **SGLT2 inhibitors:** AHA/ACC says 3 to 4 days and ESC says at least 3 days; the existing card keeps the manufacturers' label wording. No change here.

**Why it matters for safety:** ASRA's intervals are deliberately more conservative than the labels and than guidelines written to prevent thrombosis (its text says so), and they differ by dose and renal function. The existing DOAC label card's caution says its timings are not the ASRA intervals; Task 1 points that caution at the new card. Showing only the shorter of two intervals would be the dangerous failure, so every dose level stays visible.

**Verified from the text (2026-11-17):**
- ASRA: warfarin stopped 5 days before and the INR normal; subcutaneous heparin 12 hours (7500 to 10 000 U twice daily or at most 20 000 U a day) or 24 hours (more than that), with coagulation status confirmed; LMWH at least 12 hours (low dose) or 24 hours (high dose); fondaparinux 36 to 42 hours (low dose), at least 58 hours with CrCl 30 to 50, no block with CrCl below 30, 70 or 105 hours (high dose); apixaban high dose 72 hours, low dose 36 hours; edoxaban high dose 72 hours; rivaroxaban high dose 72 hours, low dose 24 hours (30 hours if CrCl below 30); dabigatran high dose 72 hours (CrCl 50 or more) or 120 hours (CrCl 30 to 49), low dose 48 hours, no block with CrCl below 30 unless a level is below 30 ng/mL; clopidogrel 5 to 7 days, prasugrel 7 to 10, ticagrelor 5; cilostazol 2 days; cangrelor 3 hours; thrombolytics 48 hours; NSAIDs including aspirin add no risk that interferes with a block.
- ESC: continue beta-blockers (Class I, level B) and statins (Class I, level B); do not routinely start a beta-blocker (Class III, level A); withhold ticagrelor 3 to 5 days, clopidogrel 5 days, prasugrel 7 days if interruption is indicated (Class I, level B); bridging not recommended at low or moderate thrombotic risk (Class III, level B). AHA/ACC: continue statins and stable-dose beta-blockers; do not start a beta-blocker on the day of surgery; continue RAAS inhibitors for HFrEF; routine bridging not recommended.

**Not verified:** the evidence level of the two ESC RAAS inhibitor rows (only the class, IIa, was captured; the app shows the class alone rather than guess the level); the guidelines' printed tables (ASRA tables 1 to 6) and any figure that exists only in a table or image. A newer AHA/ACC or ESC edition may exist (the AHA/ACC source note already says to check). Also check before merging: (a) whether AHA/ACC 2024 has a separate statement on RAAS inhibitors taken for hypertension (only the HFrEF line was found; if one exists, add it to `raas-aha` verbatim); (b) the ASRA subcutaneous heparin catheter sentence "…enhanced neurological monitoring occur and neuraxial solutions to minimize…" against the PDF, since it reads like an extraction slip (copy whatever the PDF prints).

## Global Constraints

- Offline-first PWA. No clinical network calls. No new dependencies. The guideline sentences are copied into data files at build time; nothing is fetched at runtime.
- The ticked medications stay in memory only and are cleared by **New case** (existing behaviour; do not change `medsTaken`).
- Every clinical record cites `sourceIds` that exist in `src/data/sources.ts`. Statements are quoted as the guideline words them; no number is invented, rounded or merged.
- Touch targets at least 48 px. Tailwind 3. Literal class strings only. The theme test rejects `text-slate-950`, raw hex values, `text-<accent>-400` and `hover:text-white`.
- Bump `DATA_VERSION` in `sources.ts` in each task that changes clinical data: Task 1 to `2026.11.17-draft23`, Task 2 to `2026.11.17-draft24`. Each commit can ship on its own, so each needs its own version.
- Run only the affected test file first, then the full suite before finishing. This machine can run out of memory: if `npm run verify` crashes with "out of memory", run `npx.cmd vitest run --maxWorkers=1 --pool=threads`, then `npx.cmd tsc -b`, then `npx.cmd vite build`, and say which ran.
- **Tasks must run in order (1, 2, 3).**

## Review Focus

1. **A dose-dependent card must never show only the shorter interval.** LMWH, fondaparinux, subcutaneous heparin and the DOACs show both dose levels at once. Pinned by the interval table test in Task 1.
2. **Dabigatran with an unknown creatinine clearance:** every CrCl line stays visible (marked "enter age, weight, sex and creatinine"). At CrCl 20 the "avoid unless the level is below 30 ng/mL" line is the one that fits. Pinned in Task 1.
3. **A drug with no restart statement (warfarin, aspirin) must not print "Restart: undefined" or an empty line,** on screen or in the pre-op note. Pinned in Task 1.
4. **A truncated sentence is a clinical error.** The real guard is that the strings were generated by script from the full text; the reviewer should spot-check a sample against the notebook copies. The test only catches the crude case: it fails if a statement does not end in a grade, a class or a full stop, so a sentence cut at an inner full stop still passes. Pinned (crudely) in Tasks 1 and 2.
5. **Guidelines that speak to different patients (RAAS inhibitors: AHA/ACC on HFrEF, ESC on hypertension or no heart failure) are shown side by side and the card says "individualise";** the app does not merge them or pick one. Pinned in Task 2.
6. **The label DOAC card and the ASRA DOAC card must not be mistaken for each other.** The label card's caution names the ASRA card; the ASRA card's cautions say the app cannot tell the patient's dose. Pinned in Task 1.
7. **Ticking every card at once must not break the pre-op note.** Pinned in Task 1.

---

### Task 1: ASRA cards, the shape changes, and the source

**Files:**
- Create: `src/data/periopAsra.ts`
- Modify: `src/data/periopMeds.ts`, `src/components/MedsPanel.tsx`, `src/lib/preopNote.ts`, `src/data/sources.ts`, `src/data/derived.ts`
- Test: `src/data/__tests__/periopMeds.test.ts`, `src/lib/__tests__/preopNote.test.ts`, `src/lib/calc/__tests__/periopMeds.test.ts`

**Interfaces:**
- Consumes: `PeriopMedRule`, `PeriopDrug`, `PeriopTiming` from `src/data/periopMeds.ts`; `matchTimings` from `src/lib/calc/periopMeds.ts`.
- Produces: `ASRA_RULES: PeriopMedRule[]` (seven rules, ids `asra-warfarin`, `asra-ufh`, `asra-lmwh`, `asra-fondaparinux`, `asra-doac`, `asra-antiplatelet`, `asra-thrombolytic`); `PeriopMedRule.section: string`; `PeriopDrug.restart?: string`. Task 2 adds `CARDIAC_RULES` the same way.

Read first: `src/data/periopMeds.ts`, `src/components/MedsPanel.tsx`, `src/lib/preopNote.ts`, `src/lib/calc/periopMeds.ts`, the three test files above, and `src/data/derived.ts` lines 100 to 145.

- [ ] **Step 1: Write the failing tests**

In `src/data/__tests__/periopMeds.test.ts`:

1. Change the import line to:

```ts
import { DOAC_RULE, GLP1_RULE, PERIOP_RULES, SGLT2_RULE, type PeriopDrug } from '../periopMeds';
import { ASRA_RULES } from '../periopAsra';
import { SOURCE_BY_ID } from '../sources';
```

2. Replace the test `cite sources that exist, and every drug is cited by its rule and backed by a product label` with:

```ts
  it('cite sources that exist, and every drug is cited by its rule and backed by a label (label cards) or a primary text (guideline cards)', () => {
    for (const r of PERIOP_RULES) {
      expect(r.sourceIds.length, r.id).toBeGreaterThan(0);
      for (const id of r.sourceIds) expect(SOURCE_BY_ID[id], `${r.id} -> ${id}`).toBeDefined();
      for (const d of r.drugs) {
        expect(r.sourceIds, `${r.id} lists ${d.id}'s source`).toContain(d.sourceId);
        const expected = r.section === "Manufacturers' labels" ? 'label' : 'primary';
        expect(SOURCE_BY_ID[d.sourceId].verification, d.id).toBe(expected);
      }
    }
  });

  it('put every rule under a section heading', () => {
    for (const r of PERIOP_RULES) expect(r.section.length, r.id).toBeGreaterThan(0);
  });
```

3. Replace the test `give every drug at least one timing and a restart statement` with:

```ts
  it('give every drug at least one timing, and a non-empty restart statement where it has one', () => {
    for (const d of PERIOP_RULES.flatMap((r) => r.drugs)) {
      expect(d.timings.length, d.id).toBeGreaterThan(0);
      if (d.restart !== undefined) expect(d.restart.length, d.id).toBeGreaterThan(0);
    }
    for (const d of [...SGLT2_RULE.drugs, ...DOAC_RULE.drugs]) expect(d.restart, `${d.id} is a label card and always has a restart`).toBeDefined();
  });
```

4. Replace the test `DOAC: always carries the caution that label timings are not ASRA neuraxial intervals` with:

```ts
  it('DOAC label card: always carries the caution that its timings are not ASRA neuraxial intervals, and names the ASRA card', () => {
    expect(DOAC_RULE.cautions?.some((c) => c.includes('ASRA') && /spinal|epidural|neuraxial/i.test(c))).toBe(true);
    expect(DOAC_RULE.cautions?.some((c) => c.includes('DOACs: spinal, epidural or deep block (ASRA)'))).toBe(true);
  });
```

5. Append, inside the same `describe`:

```ts
  const asraDrug = (ruleId: string, drugId: string): PeriopDrug => {
    const d = ASRA_RULES.find((r) => r.id === ruleId)?.drugs.find((x) => x.id === drugId);
    if (!d) throw new Error(`missing ${ruleId} / ${drugId}`);
    return d;
  };
  const everything = (d: PeriopDrug) => [...d.timings.map((t) => t.text), ...(d.catheter ?? []), d.restart ?? ''].join(' | ');

  it('ASRA: has the seven cards, all in the ASRA section and citing the ASRA source', () => {
    expect(ASRA_RULES.map((r) => r.id)).toEqual(['asra-warfarin', 'asra-ufh', 'asra-lmwh', 'asra-fondaparinux', 'asra-doac', 'asra-antiplatelet', 'asra-thrombolytic']);
    for (const r of ASRA_RULES) {
      expect(r.section, r.id).toBe('ASRA: spinal, epidural and deep blocks');
      expect(r.sourceIds, r.id).toEqual(['asra-anticoag-2025']);
      expect(r.cautions?.some((c) => c.includes('spinal, epidural or deep plexus/peripheral block')), r.id).toBe(true);
    }
  });

  const ASRA_PINS: Array<[string, string, string]> = [
    ['asra-warfarin', 'warfarin', 'stopped 5 days prior to the planned procedure'],
    ['asra-warfarin', 'warfarin', 'removed when the INR is <1.5'],
    ['asra-ufh', 'ufh-iv', 'minimum of 4–6 hours'],
    ['asra-ufh', 'ufh-iv', 'minimum of 1 hour after needle placement'],
    ['asra-ufh', 'ufh-sc', 'minimum of 12 hours after subcutaneous heparin'],
    ['asra-ufh', 'ufh-sc', 'minimum of 24 hours after subcutaneous heparin'],
    ['asra-lmwh', 'lmwh', 'at least 12 hours after low-dose LMWH'],
    ['asra-lmwh', 'lmwh', 'at least 24 hours prior to needle/catheter placement'],
    ['asra-fondaparinux', 'fondaparinux', '36 hours (young patients) to 42 hours (elderly patients)'],
    ['asra-fondaparinux', 'fondaparinux', 'minimum of 58 hours'],
    ['asra-fondaparinux', 'fondaparinux', 'minimum of 70 hours'],
    ['asra-fondaparinux', 'fondaparinux', 'minimum of 105 hours'],
    ['asra-doac', 'apixaban-asra', 'high dose of apixaban be discontinued at least 72 hours'],
    ['asra-doac', 'apixaban-asra', 'low dose of apixaban be discontinued for at least 36 hours'],
    ['asra-doac', 'edoxaban-asra', 'high dose of edoxaban be discontinued for at least 72 hours'],
    ['asra-doac', 'rivaroxaban-asra', 'high dose of rivaroxaban be discontinued for at least 72 hours'],
    ['asra-doac', 'rivaroxaban-asra', 'low dose of rivaroxaban be discontinued for at least 24 hours (30 hours if CrCl <30 mL/min)'],
    ['asra-doac', 'dabigatran-asra', 'discontinued for at least 72 hours in patients with a CrCl ≥50 mL/min'],
    ['asra-doac', 'dabigatran-asra', 'discontinued for 120 hours in patients with a CrCl 30–49 mL/min'],
    ['asra-doac', 'dabigatran-asra', 'low dose of dabigatran be discontinued for at least 48 hours'],
    ['asra-antiplatelet', 'thienopyridines', '5–7 days for clopidogrel, and 7–10 days for prasugrel'],
    ['asra-antiplatelet', 'ticagrelor', 'is 5 days'],
    ['asra-antiplatelet', 'cilostazol', 'avoided for 2 days'],
    ['asra-antiplatelet', 'cangrelor', 'avoided for 3 hours'],
    ['asra-thrombolytic', 'thrombolytics', 'against needle placement for at least 48 hours'],
  ];

  it.each(ASRA_PINS)('ASRA %s / %s says "%s"', (ruleId, drugId, text) => {
    expect(everything(asraDrug(ruleId, drugId))).toContain(text);
  });

  it('ASRA: every statement ends the way ASRA ends it (a grade or a full stop), so none was cut short', () => {
    for (const r of ASRA_RULES) {
      const texts = [...(r.cautions ?? []), ...r.drugs.flatMap((d) => [...d.timings.map((t) => t.text), ...(d.catheter ?? []), ...(d.restart ? [d.restart] : [])])];
      for (const t of texts) expect(t, `${r.id}: ...${t.slice(-60)}`).toMatch(/(\(grade [A-Z0-9]+\)|\.)$/);
    }
  });

  it('ASRA DOAC card: says the app cannot tell the dose, and warfarin and aspirin have no restart line', () => {
    expect(ASRA_RULES.find((r) => r.id === 'asra-doac')?.cautions?.some((c) => c.includes('cannot tell which dose'))).toBe(true);
    expect(asraDrug('asra-warfarin', 'warfarin').restart).toBeUndefined();
    expect(asraDrug('asra-antiplatelet', 'aspirin-nsaids').restart).toBeUndefined();
  });
```

In `src/lib/calc/__tests__/periopMeds.test.ts`: add `import { ASRA_RULES } from '../../../data/periopAsra';` and append (inside the existing `describe`, or in a new `describe` at the end, matching the file's style):

```ts
describe('ASRA dabigatran lines follow creatinine clearance and never disappear', () => {
  const dabi = ASRA_RULES.find((r) => r.id === 'asra-doac')!.drugs.find((d) => d.id === 'dabigatran-asra')!;
  const states = (crcl: number | null) => matchTimings(dabi, crcl).map((m) => m.match);

  it('CrCl 68: the 72-hour line fits', () => expect(states(68)).toEqual(['yes', 'no', 'no', 'always', 'always']));
  it('CrCl 45: the 120-hour line fits', () => expect(states(45)).toEqual(['no', 'yes', 'no', 'always', 'always']));
  it('CrCl 20: the "no block unless the level is below 30 ng/mL" line fits', () => expect(states(20)).toEqual(['no', 'no', 'yes', 'always', 'always']));
  it('no CrCl: every CrCl line stays visible', () => expect(states(null)).toEqual(['unknown', 'unknown', 'unknown', 'always', 'always']));
});

describe('ASRA fondaparinux: the "no block below CrCl 30" line follows creatinine clearance', () => {
  const fonda = ASRA_RULES.find((r) => r.id === 'asra-fondaparinux')!.drugs[0];
  const severe = (crcl: number | null) => matchTimings(fonda, crcl)[2].match;

  it('CrCl 20: fits', () => expect(severe(20)).toBe('yes'));
  it('CrCl 40: does not fit, but stays listed', () => expect(severe(40)).toBe('no'));
  it('no CrCl: stays visible', () => expect(severe(null)).toBe('unknown'));
  // The 58-hour line (CrCl 30–50, 50 included) is left untagged: crclBelow is exclusive, so tagging it would grey it out for CrCl 50.0–50.9.
});
```

In `src/lib/__tests__/preopNote.test.ts`: add `PERIOP_RULES` to the existing import from `'../../data/periopMeds'` (keep what is already imported). Replace the title and the expectation of the test that currently says `with nothing ticked, says the app covers only three classes ...` (around lines 75 to 77) with:

```ts
  it('with nothing ticked, says so without implying the patient takes no medications', () => {
```

and its expectation line with:

```ts
    expect(note).toContain('Medications ticked in the app: none (this is not a medication history; the app covers only the classes in its Medications section)');
```

(keep whatever line builds `note` in that test unchanged). Append, inside the same `describe`:

```ts
  it('ASRA warfarin: the 5-day line is in the note, and a drug with no restart statement prints no "Restart"', () => {
    const note = buildPreopNote({ ...MAN, medsTaken: { 'asra-warfarin': true } });
    const warfarin = lines(note).find((x) => x.startsWith('  Warfarin:'))!;
    expect(warfarin).toContain('stopped 5 days prior to the planned procedure');
    expect(warfarin).not.toContain('Restart');
    expect(note).not.toContain('undefined');
  });

  it('ticking every card at once builds a note without errors', () => {
    const all = Object.fromEntries(PERIOP_RULES.map((r) => [r.id, true]));
    expect(() => buildPreopNote({ ...MAN, medsTaken: all })).not.toThrow();
  });
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx.cmd vitest run src/data/__tests__/periopMeds.test.ts src/lib/calc/__tests__/periopMeds.test.ts src/lib/__tests__/preopNote.test.ts`
Expected: FAIL (cannot resolve `../periopAsra`, no `section`).

- [ ] **Step 3: Create the ASRA data file**

Create `src/data/periopAsra.ts` with exactly this content. **Copy every string character for character.** Do not reword, reorder, shorten, "correct" or add anything. The sentences were generated from the guideline's full text; if you believe one is clinically wrong, do not change it, report it.

```ts
// ASRA Pain Medicine fifth edition (2025): what to do before placing a neuraxial or deep plexus/peripheral block, and around
// catheters, for patients on antithrombotic drugs. Every instruction is the guideline's own sentence (grade included), copied
// from its full text on 2026-11-17. Nothing is rounded, merged or inferred. ASRA's aim is to prevent bleeding, so it is more
// conservative than guidelines written to prevent thrombosis.

import type { PeriopMedRule } from './periopMeds';

export const ASRA_WARFARIN: PeriopMedRule = {
  id: 'asra-warfarin',
  drugClass: 'Warfarin: spinal, epidural or deep block (ASRA)',
  section: 'ASRA: spinal, epidural and deep blocks',
  action: 'hold',
  summary:
    'Stop 5 days before the block, and check that the INR is normal before needle placement.',
  why:
    'ASRA bases this on warfarin pharmacology, the clinical relevance of vitamin K coagulation factor levels, case series and case reports of spinal hematoma.',
  cautions: [
    "These are ASRA's recommendations for placing a spinal, epidural or deep plexus/peripheral block and for removing catheters. Deviation may be acceptable in the judgment of the responsible anesthesiologist, and a bloody or difficult needle placement needs a case-by-case decision.",
  ],
  drugs: [
    {
      id: 'warfarin',
      name: 'Warfarin',
      timings: [
        { when: 'Before the block', text: 'We recommend that the anticoagulant therapy be stopped 5 days prior to the planned procedure, and the INR be measured and normalized (normal range of the local laboratory) prior to needle placement (grade IB)' },
        { text: 'In patients receiving an initial dose of warfarin prior to surgery, we suggest the INR should be checked prior to needle placement if the first dose was given >24 hours earlier, or if a second dose of oral anticoagulant has been administered (grade IIC)' },
      ],
      catheter: [
        'In patients receiving low-dose warfarin therapy during epidural analgesia, we suggest that their INR be monitored daily (grade IIC)',
        'We suggest that neuraxial catheters be removed when the INR is <1.5 (grade IIC)',
        'In patients with INR >1.5 but <3, the increased risk of maintaining a neuraxial catheter remains unknown. We suggest indwelling catheters may be maintained or removed with caution, closely following the INR and duration of warfarin therapy (grade IIC)',
        'In patients with an INR >3, we recommend that the warfarin dose be held or reduced in patients with indwelling neuraxial catheters (grade IA)',
        'We suggest that neurological assessment be continued for at least 48 hours following catheter removal (grade IIC)',
        'Neurological testing of sensory and motor function should be performed routinely during epidural analgesia for patients on warfarin therapy. To facilitate neurological evaluation, we recommend that the type of analgesic solution be tailored to minimize the degree of sensory and motor blockade (grade IC)',
      ],
      sourceId: 'asra-anticoag-2025',
    },
  ],
  sourceIds: ['asra-anticoag-2025'],
};

export const ASRA_UFH: PeriopMedRule = {
  id: 'asra-ufh',
  drugClass: 'Unfractionated heparin: spinal, epidural or deep block (ASRA)',
  section: 'ASRA: spinal, epidural and deep blocks',
  action: 'hold',
  summary:
    'Intravenous: stop the infusion 4 to 6 hours before, with coagulation assessed. Subcutaneous: the interval depends on the dose.',
  why:
    'ASRA bases the subcutaneous intervals on the pharmacology of a 5000-unit dose, which starts to act 1 hour after administration and persists for 4 to 6 hours.',
  cautions: [
    "These are ASRA's recommendations for placing a spinal, epidural or deep plexus/peripheral block and for removing catheters. Deviation may be acceptable in the judgment of the responsible anesthesiologist, and a bloody or difficult needle placement needs a case-by-case decision.",
  ],
  drugs: [
    {
      id: 'ufh-iv',
      name: 'Unfractionated heparin, intravenous',
      timings: [
        { when: 'Before the block', text: 'Discontinue heparin infusion for a minimum of 4–6 hours and coagulation status be assessed and normal prior to neuraxial block or deep plexus/peripheral block (grade IA)' },
        { when: 'After needle placement', text: 'Delay intravenous heparin administration for a minimum of 1 hour after needle placement (grade IA)' },
        { when: 'Heparin for more than 4 days', text: 'Since heparin-induced thrombocytopenia may occur during heparin administration, we recommend that patients receiving intravenous or subcutaneous UFH for >4 days have a platelet count assessed (grade IC)' },
      ],
      catheter: [
        "Remove indwelling neuraxial catheters 4 to 6 hours after the last heparin dose (and after assessment of the patient's coagulation status); reheparinize 1 hour after catheter removal (grade 1A).",
        'Monitor the patient postoperatively to provide early detection of motor blockade and consider use of minimal concentration of local anesthetics to enhance the early detection of a spinal hematoma (grade 1A).',
        'Although the occurrence of a bloody or difficult neuraxial needle placement may increase the risk of hematoma, there are no data to support mandatory cancellation of a case. Direct communication with the surgeon and a specific risk-benefit decision about proceeding in each case is recommended (grade IA)',
        'It is not suggested to maintain neuraxial or deep plexus/peripheral catheters in the setting of full anticoagulation during cardiac surgery. If unanticipated heparinization occurs, we suggest postoperative monitoring of neurological status and consider use of minimal concentration of local anesthetics to enhance early detection of neuraxial hematoma (grade IIC)',
      ],
      sourceId: 'asra-anticoag-2025',
    },
    {
      id: 'ufh-sc',
      name: 'Unfractionated heparin, subcutaneous',
      timings: [
        { when: 'Low dose', text: 'Preoperative low-dose UFH for thromboprophylaxis (5000 U two times per day or three times per day). We suggest needle placement occur a minimum of 4–6 hours after heparin administration or coagulation status be assessed and normal (grade IIC)' },
        { when: '7500–10 000 U two times per day or a daily dose of ≤20 000 U', text: 'We suggest neuraxial block occur a minimum of 12 hours after subcutaneous heparin administration and confirmation of normal coagulation status (grade IIC)' },
        { when: '>10 000 U subcutaneously per dose, or >20 000 U total daily dose', text: 'We suggest neuraxial block occur a minimum of 24 hours after subcutaneous heparin administration and confirmation of normal coagulation status (grade IIC)' },
      ],
      catheter: [
        'There is no contraindication to maintaining neuraxial catheters in the presence of low-dose UFH. We suggest catheter removal occurs a minimum of 4–6 hours after heparin administration. Subsequent heparin administration may occur immediately after catheter removal (grade IIC)',
        'The safety of indwelling neuraxial catheters in patients receiving doses >5000 U at a time or >15 000 U of UFH daily has not been established. We suggest that the risk and benefits be assessed on an individual basis and that techniques to facilitate detection of new/progressive neurological deficits (eg, enhanced neurological monitoring occur and neuraxial solutions to minimize sensory and motor block) be applied (grade IIC)',
      ],
      sourceId: 'asra-anticoag-2025',
    },
  ],
  sourceIds: ['asra-anticoag-2025'],
};

export const ASRA_LMWH: PeriopMedRule = {
  id: 'asra-lmwh',
  drugClass: 'Low molecular weight heparin: spinal, epidural or deep block (ASRA)',
  section: 'ASRA: spinal, epidural and deep blocks',
  action: 'hold',
  summary:
    'Low dose: at least 12 hours before needle placement. High (therapeutic) dose: at least 24 hours.',
  why:
    'In a small study cited by ASRA, almost 60% of patients on high-dose enoxaparin still had higher than expected anti-Xa levels at least 24 hours after the last dose.',
  cautions: [
    "These are ASRA's recommendations for placing a spinal, epidural or deep plexus/peripheral block and for removing catheters. Deviation may be acceptable in the judgment of the responsible anesthesiologist, and a bloody or difficult needle placement needs a case-by-case decision.",
  ],
  drugs: [
    {
      id: 'lmwh',
      name: 'Low molecular weight heparin (enoxaparin, dalteparin, tinzaparin)',
      timings: [
        { when: 'What ASRA calls low dose', text: 'Low-dose LMWH regimens administered for prophylaxis include enoxaparin 40 mg/day, enoxaparin 30 mg every 12 hours, dalteparin 5000 IU daily. The target aXa level for prophylaxis (measured 4 hours after a dose) is regarded to be 0.2–0.5 IU/mL.' },
        { when: 'What ASRA calls high dose', text: 'High-dose LMWH regimens for treatment of VTE or bridging therapy involves administering a much higher dose that is typically weight based, such as enoxaparin 1 mg/kg every 12 hours, enoxaparin 1.5 mg/kg daily, dalteparin 120 IU/kg every 12 hours, dalteparin 200 IU/kg daily, or tinzaparin 175 IU/kg daily. It is advisable to maintain peak aXa levels between 0.5 U/mL and 1 U/mL (measured 3–4 hours after the LMWH dose). With high-dose LMWH, it is recommended that the last dose should occur at least 24 hours preoperatively and the last dose should be halved in patients with moderate (CrCl 30–49 mL/min) to severe (CrCl <30 mL/min) renal insufficiency to avoid an exaggerated or prolonged response.' },
        { when: 'Low dose', text: 'We recommend that needle placement should occur at least 12 hours after low-dose LMWH (grade IC)' },
        { text: 'Consider checking aXa activity level if <12 hours (grade 2C). An acceptable level of residual aXa activity remains undetermined, therefore we suggest aXa value of ≤0.1 IU/mL (grade IIC)' },
        { when: 'High (therapeutic) dose', text: 'In patients receiving high (therapeutic) doses of LMWH, we recommend delay of at least 24 hours prior to needle/catheter placement (grade IC)' },
        { text: 'Consider checking aXa activity level if <24 hours particularly in elderly patients (age >75 years) and patients with renal insufficiency (CrCl ≤30 mL/min). An acceptable level of residual aXa activity remains undetermined, therefore we suggest aXa value of ≤0.1 IU/mL (grade IIC)' },
        { when: 'LMWH for more than 4 days', text: 'Heparin-induced thrombocytopenia may occur during LMWH administration; therefore, we recommend that patients receiving LMWH for >4 days have a platelet count assessed prior to needle placement (grade IC)' },
        { when: 'Blood during needle or catheter placement', text: 'The presence of blood during needle and catheter placement does not necessitate postponement of surgery. We suggest that initiation of LMWH therapy in this setting should be delayed for 24 hours postoperatively and that this consideration be discussed with the surgeon (grade IIC)' },
      ],
      catheter: [
        'Antiplatelet or oral anticoagulant medications administered in combination with LMWH increases the risk of neuraxial hematoma. We recommend against concomitant administration of medications affecting hemostasis, such as antiplatelet drugs, standard heparin, or dextran, regardless of LMWH dosing regimen when there is an indwelling neuraxial catheter (grade IA)',
        'Twice-daily low dose. We recommend the first dose of LMWH be administered the following day and at least 12 hours after needle/catheter placement. Indwelling catheters should be removed prior to initiation of LMWH. Administration of LMWH should be delayed for 4 hours after catheter removal (grade IC)',
        'Single daily low dose. We recommend the first postoperative LMWH dose should be administered at least 12 hours after needle/catheter placement. The second postoperative dose should occur no sooner than 24 hours after the first dose. Indwelling neuraxial catheters do not appear to represent increased risk and may be maintained. However, no additional hemostasis altering medications should be administered due to the additive effects. The catheter should be removed 12 hours after the last dose of LMWH. Subsequent LMWH dosing should occur at least 4 hours after catheter removal (grade IC)',
        'Single or twice-daily high (therapeutic) dosing. High-dose LMWH may be resumed 24 hours after non-high-bleeding-risk surgery and 48–72 hours after high-bleeding-risk surgery. We recommend that indwelling neuraxial catheters be removed 4 hours prior to the first postoperative dose and the first postoperative dose should be at least 24 hours after needle/catheter placement, whichever is greater (grade IC)',
      ],
      sourceId: 'asra-anticoag-2025',
    },
  ],
  sourceIds: ['asra-anticoag-2025'],
};

export const ASRA_FONDAPARINUX: PeriopMedRule = {
  id: 'asra-fondaparinux',
  drugClass: 'Fondaparinux: spinal, epidural or deep block (ASRA)',
  section: 'ASRA: spinal, epidural and deep blocks',
  action: 'hold',
  summary:
    'Long intervals that depend on the dose and on renal function.',
  why:
    'ASRA notes that fondaparinux has a long half-life and direct renal excretion, and that protamine would not be an effective reversal strategy.',
  cautions: [
    "These are ASRA's recommendations for placing a spinal, epidural or deep plexus/peripheral block and for removing catheters. Deviation may be acceptable in the judgment of the responsible anesthesiologist, and a bloody or difficult needle placement needs a case-by-case decision.",
  ],
  drugs: [
    {
      id: 'fondaparinux',
      name: 'Fondaparinux (Arixtra)',
      timings: [
        { when: 'Low dose (2.5 mg once per day)', text: 'We suggest holding low-dose fondaparinux (2.5 mg once per day) for 36 hours (young patients) to 42 hours (elderly patients) in healthy patients with normal renal function (grade IIC)' },
        { text: 'We suggest holding fondaparinux for a minimum of 58 hours in patients with moderate renal insufficiency (CrCl 30–50 mL/min) (grade 2C)' },
        { when: 'CrCl below 30 mL/min', crclBelow: 30, text: 'We suggest not performing neuraxial or deep plexus/peripheral blocks in patients with severe renal impairment (CrCl <30 mL/min) due to the 72 hours half-life (grade IIC)' },
        { text: 'We suggest testing aXa activity calibrated to fondaparinux if placing the needle prior to these recommended times is considered (aXa ≤0.1 IU/mL) (grade IIC)' },
        { when: 'High-dose fondaparinux (5–10 mg once per day)', text: 'We suggest holding fondaparinux for a minimum of 70 hours in young patients with normal renal function (grade IIC)' },
        { text: 'We suggest holding fondaparinux for a minimum of 105 hours in elderly patients with normal renal function (grade IIC)' },
        { text: 'We suggest testing aXa activity calibrated to fondaparinux if placing needle prior to the recommended times is considered (aXa ≤0.1 IU/mL) (grade IIC)' },
      ],
      catheter: [
        'We suggest that neuraxial catheters be removed at least 6 hours prior to the first postoperative dose (grade IIC)',
      ],
      sourceId: 'asra-anticoag-2025',
    },
  ],
  sourceIds: ['asra-anticoag-2025'],
};

export const ASRA_DOAC: PeriopMedRule = {
  id: 'asra-doac',
  drugClass: 'DOACs: spinal, epidural or deep block (ASRA)',
  section: 'ASRA: spinal, epidural and deep blocks',
  action: 'hold',
  summary:
    'High dose of apixaban, edoxaban or rivaroxaban: at least 72 hours. Low-dose intervals are shorter. Dabigatran depends on creatinine clearance.',
  why:
    'ASRA bases its intervals on pharmacology, with the intent of near-complete resolution of the antithrombotic effect at the time of the block.',
  cautions: [
    "These are ASRA's recommendations for placing a spinal, epidural or deep plexus/peripheral block and for removing catheters. Deviation may be acceptable in the judgment of the responsible anesthesiologist, and a bloody or difficult needle placement needs a case-by-case decision.",
    "ASRA's high and low doses decide which line applies, and this app cannot tell which dose the patient takes. The part of the guideline that this app could read does not state the doses behind 'high' and 'low'; check the guideline's tables.",
    'The manufacturers recommend that in case of a traumatic neuraxial puncture the administration of the next dose of apixaban and rivaroxaban should be delayed for 48 hours and 24 hours, respectively. There is no such recommendation for dabigatran and edoxaban.',
    'If a DOAC were to be inadvertently administered in the presence of an indwelling neuraxial catheter, a therapy-free interval identical to the ones recommended prior to a neuraxial intervention should be observed, or the absence of any residual anticoagulant activity should be documented using an appropriate hemostatic assay.',
  ],
  drugs: [
    {
      id: 'apixaban-asra',
      name: 'Apixaban',
      timings: [
        { when: 'High dose', text: 'We suggest that a high dose of apixaban be discontinued at least 72 hours prior to neuraxial block or deep plexus/peripheral block. Consider checking apixaban or aXa plasma level if <72 hours (grade IIC)' },
        { when: 'Low dose', text: 'We suggest that a low dose of apixaban be discontinued for at least 36 hours prior to neuraxial block or deep plexus/peripheral block. Consider checking apixaban or aXa plasma level if <36 hours (grade IIC)' },
        { when: 'Residual level, either dose', text: 'We suggest that a residual apixaban plasma level <30 ng/mL or a residual aXa activity plasma level ≤0.1 IU/mL is acceptable prior to neuraxial block or deep plexus/peripheral block (grade IIC)' },
      ],
      catheter: [
        'With the unanticipated administration of high dose of apixaban with a neuraxial catheter in situ, we suggest that apixaban dosing be withheld for at least 72 hours, or a residual apixaban plasma level <30 ng/mL or a residual aXa activity plasma level ≤0.1 IU/mL before the catheter is removed (grade IIC)',
        'With the unanticipated administration of low dose of apixaban with a neuraxial catheter in situ, we suggest that apixaban dosing be withheld for at least 36 hours, or a residual apixaban plasma level <30 ng/mL or a residual aXa activity plasma level ≤0.1 IU/mL before the catheter is removed (grade IIC)',
      ],
      restart:
        'High dose: We suggest that needle placement/catheter removal occurs at least 24 hours prior to the first postoperative dose (grade IIC) Low dose: We suggest that needle placement/catheter removal occurs at least 6 hours prior to the first postoperative dose (grade IIC)',
      sourceId: 'asra-anticoag-2025',
    },
    {
      id: 'edoxaban-asra',
      name: 'Edoxaban',
      timings: [
        { when: 'High dose', text: 'We suggest that a high dose of edoxaban be discontinued for at least 72 hours prior to neuraxial block or deep plexus/peripheral block. Consider checking edoxaban or aXa activity plasma level if <72 hours (grade IIC)' },
        { when: 'Low dose', text: 'There is no FDA-approved medical indication for low-dose edoxaban.' },
        { when: 'Residual level', text: 'We suggest that a residual edoxaban plasma level <30 ng/mL or a residual aXa activity plasma level ≤0.1 IU/mL is acceptable prior to neuraxial block or deep plexus/peripheral block (grade IIC)' },
      ],
      catheter: [
        'With the unanticipated administration of high dose of edoxaban with a neuraxial catheter in situ, we suggest that edoxaban dosing be withheld for at least 72 hours, or a residual edoxaban plasma level <30 ng/mL or a residual aXa activity plasma level ≤0.1 IU/mL before the catheter is removed (grade IIC)',
      ],
      restart:
        'High dose: We suggest that needle placement/catheter removal occurs at least 24 hours prior to the first (postoperative) dose (grade IIC)',
      sourceId: 'asra-anticoag-2025',
    },
    {
      id: 'rivaroxaban-asra',
      name: 'Rivaroxaban',
      timings: [
        { when: 'High dose', text: 'We suggest that a high dose of rivaroxaban be discontinued for at least 72 hours prior to neuraxial block or deep plexus/peripheral block. Consider checking rivaroxaban or aXa activity plasma level if <72 hours (grade IIC)' },
        { when: 'Low dose', text: 'We suggest that a low dose of rivaroxaban be discontinued for at least 24 hours (30 hours if CrCl <30 mL/min) prior to neuraxial block or deep plexus/peripheral block. Consider checking rivaroxaban or aXa activity plasma level if <24 hours (grade IIC)' },
        { when: 'Residual level, either dose', text: 'We suggest that a residual rivaroxaban plasma level <30 ng/mL or a residual aXa activity plasma level ≤0.1 IU/mL is acceptable prior to neuraxial block or deep plexus/peripheral block (grade IIC)' },
      ],
      catheter: [
        'With the unanticipated administration of high dose of rivaroxaban with a neuraxial catheter in situ, we suggest that rivaroxaban dosing be withheld for at least 72 hours, or a residual rivaroxaban plasma level <30 ng/mL or a residual aXa activity plasma level ≤0.1 IU/mL before the catheter is removed (grade IIC)',
        'With the unanticipated administration of low dose of rivaroxaban with a neuraxial catheter in situ, we suggest that rivaroxaban dosing be withheld for at least 24 hours (30 hours if CrCl <30 mL/min), or a residual rivaroxaban plasma level <30 ng/mL or a residual aXa activity plasma level ≤0.1 IU/mL before the catheter is removed (grade IIC)',
      ],
      restart:
        'High dose: We suggest that needle placement/catheter removal occurs at least 24 hours prior to the first postoperative dose (grade IIC) Low dose: We suggest that needle placement/catheter removal occurs at least 6 hours prior to the first postoperative dose (grade IIC)',
      sourceId: 'asra-anticoag-2025',
    },
    {
      id: 'dabigatran-asra',
      name: 'Dabigatran',
      timings: [
        { when: 'High dose, CrCl 50 mL/min or more', crclMin: 50, text: 'We suggest that a high dose of dabigatran be discontinued for at least 72 hours in patients with a CrCl ≥50 mL/min prior to neuraxial block or deep plexus/peripheral block. Consider checking dabigatran plasma level if <72 hours (grade IIC)' },
        { when: 'High dose, CrCl 30 to 49 mL/min', crclMin: 30, crclBelow: 50, text: 'We suggest that a high dose of dabigatran be discontinued for 120 hours in patients with a CrCl 30–49 mL/min prior to neuraxial block or deep plexus/peripheral block. Consider checking dabigatran plasma level if <120 hours (grade IIC)' },
        { when: 'Either dose, CrCl below 30 mL/min', crclBelow: 30, text: 'We suggest against the performance of neuraxial or deep plexus/peripheral blocks in patients with a CrCl <30 mL/min unless a dabigatran plasma level is obtained and <30 ng/mL (grade IIC)' },
        { when: 'Low dose', text: 'We suggest that a low dose of dabigatran be discontinued for at least 48 hours prior to neuraxial block or deep plexus/peripheral block. Consider checking dabigatran plasma level if <48 hours (grade IIC)' },
        { when: 'Residual level, either dose', text: 'Prior to neuraxial block or deep plexus/peripheral block we suggest that a residual dabigatran plasma level <30 ng/mL is acceptable (grade IIC)' },
      ],
      catheter: [
        'With the unanticipated administration of high-dose dabigatran with a neuraxial catheter in situ, we suggest that dabigatran dosing be withheld for at least 72 hours (120 hours if CrCl 30–49 mL/min) or a residual dabigatran plasma level <30 ng/mL before the catheter is removed (grade IIC)',
        'With the unanticipated administration of low dose of dabigatran with a neuraxial catheter in situ, we suggest that dabigatran dosing be withheld for at least 48 hours, or a residual dabigatran plasma level <30 ng/mL before the catheter is removed (grade IIC)',
      ],
      restart:
        'High dose: We suggest that needle placement/catheter removal occurs at least 24 hours prior to the first postoperative dose (grade IIC) Low dose: We suggest that needle placement/catheter removal occurs at least 6 hours prior to the first postoperative dose (grade IIC)',
      sourceId: 'asra-anticoag-2025',
    },
  ],
  sourceIds: ['asra-anticoag-2025'],
};

export const ASRA_ANTIPLATELET: PeriopMedRule = {
  id: 'asra-antiplatelet',
  drugClass: 'Antiplatelet drugs: spinal, epidural or deep block (ASRA)',
  section: 'ASRA: spinal, epidural and deep blocks',
  action: 'individualise',
  summary:
    'Aspirin and NSAIDs: no added risk. Clopidogrel 5 to 7 days, prasugrel 7 to 10 days, ticagrelor 5 days.',
  why:
    'ASRA notes that aspirin affects platelet function for the life of the platelet, while other NSAIDs produce a short-term defect that normalizes within 3 days.',
  cautions: [
    "These are ASRA's recommendations for placing a spinal, epidural or deep plexus/peripheral block and for removing catheters. Deviation may be acceptable in the judgment of the responsible anesthesiologist, and a bloody or difficult needle placement needs a case-by-case decision.",
    'NSAIDs alone do not significantly increase the risk of spinal hematoma. However, combination therapy with UFH, LMWH, oral anticoagulants, and thrombolytics have been demonstrated to increase the frequency of spontaneous hemorrhagic complications, bleeding at puncture sites, and spinal hematoma.',
  ],
  drugs: [
    {
      id: 'aspirin-nsaids',
      name: 'Aspirin and other NSAIDs',
      timings: [
        { text: 'NSAIDs appear to represent no added risk for the development of major bleeding after regional anesthetic techniques. NSAIDs (including aspirin) do not create a level of risk that will interfere with the performance of neuraxial or deep plexus/peripheral blocks. In patients receiving these medications, we do not identify specific concerns as to the timing of single-injection or catheter techniques, postoperative monitoring, or the timing of neuraxial catheter removal (grade IC)' },
      ],
      sourceId: 'asra-anticoag-2025',
    },
    {
      id: 'thienopyridines',
      name: 'Clopidogrel and prasugrel',
      timings: [
        { text: 'Based on labeling and surgical/procedural experience, the suggested time interval between discontinuation of thienopyridine therapy and needle placement is 5–7 days for clopidogrel, and 7–10 days for prasugrel (grade IIC)' },
      ],
      catheter: [
        'Neuraxial and deep plexus/peripheral catheters should not be maintained with prasugrel due to the rapid onset. However, since the antiplatelet effect is not immediate with clopidogrel, they may be maintained for 1–2 days, provided a loading dose of the antiplatelet agent is not administered (grade IIC)',
      ],
      restart:
        'Thienopyridine therapy may be resumed immediately after needle placement/catheter removal, provided a loading dose of the drugs is not administered. If a loading dose is administered, we suggest a time interval of 6 hours between catheter removal and administration (grade IIC)',
      sourceId: 'asra-anticoag-2025',
    },
    {
      id: 'ticagrelor',
      name: 'Ticagrelor',
      timings: [
        { text: 'Based on labeling and surgical/procedural experience, the recommended time interval between discontinuation of ticagrelor therapy and needle placement is 5 days (grade 2C)' },
      ],
      catheter: [
        'Neuraxial catheters should not be maintained with ticagrelor due to the rapid onset (grade IIC)',
      ],
      restart:
        'Ticagrelor therapy may be resumed immediately after needle placement/catheter removal, provided a loading dose of the drug is not administered. If a loading dose is administered, we suggest a time interval of 6 hours between catheter removal and administration (grade IIC)',
      sourceId: 'asra-anticoag-2025',
    },
    {
      id: 'cilostazol',
      name: 'Cilostazol',
      timings: [
        { text: 'The risk of serious bleeding in the presence of residual cilostazol effect is unknown. Based on the elimination half-life, we suggest that needle placement be avoided for 2 days after discontinuation of cilostazol (grade IIC)' },
      ],
      catheter: [
        'We suggest that neuraxial and deep plexus/peripheral catheters be removed prior to reinstitution of cilostazol therapy postoperatively (grade IIC)',
      ],
      restart:
        'We suggest that the first postoperative dose of cilostazol be administered 6 hours after neuraxial or deep plexus/peripheral catheter removal (grade IIC)',
      sourceId: 'asra-anticoag-2025',
    },
    {
      id: 'cangrelor',
      name: 'Cangrelor',
      timings: [
        { text: 'The risk of serious bleeding in the presence of residual cangrelor effect is unknown. Based on the elimination half-life, we suggest that needle placement be avoided for 3 hours after discontinuation of cangrelor (grade IIC)' },
      ],
      catheter: [
        'We suggest that neuraxial and deep plexus/peripheral catheters be removed prior to reinstitution of cangrelor therapy postoperatively (grade IIC)',
      ],
      restart:
        'We suggest that the first postoperative dose of cangrelor be administered 8 hours after neuraxial or deep plexus/peripheral catheter removal (grade IIC)',
      sourceId: 'asra-anticoag-2025',
    },
    {
      id: 'gp2b3a',
      name: 'Platelet GP IIb/IIIa inhibitors (abciximab, eptifibatide, tirofiban)',
      timings: [
        { text: 'The platelet GP IIb/IIIa inhibitors exert a profound effect on platelet aggregation. Following administration, the time to normal platelet aggregation is 24–48 hours for abciximab and 4–8 hours for eptifibatide and tirofiban. We recommend that needle placement should be avoided until platelet function—as impacted by the GP IIb/IIIa inhibitor—has recovered. Caution in patients on dual therapy who may still have residual NSAID effect (grade IC)' },
      ],
      catheter: [
        'Postoperative. Although GP IIb/IIIa antagonists are contraindicated within 4 weeks of surgery, should one be emergently administered in the postoperative period following a neuraxial or deep plexus/peripheral technique, we recommend the neuraxial infusion should be limited to drugs minimizing sensory and motor block to facilitate assessment of neurological function and that the patient be carefully monitored neurologically (grade IC)',
        'Timing of catheter removal is based on ongoing risk of thromboembolism and need for continued antithrombotic therapy and the potential for spinal bleeding during catheter maintenance and removal (grade IIC)',
      ],
      sourceId: 'asra-anticoag-2025',
    },
  ],
  sourceIds: ['asra-anticoag-2025'],
};

export const ASRA_THROMBOLYTIC: PeriopMedRule = {
  id: 'asra-thrombolytic',
  drugClass: 'Thrombolytic drugs: spinal, epidural or deep block (ASRA)',
  section: 'ASRA: spinal, epidural and deep blocks',
  action: 'hold',
  summary:
    'No needle placement for at least 48 hours after thrombolytic therapy.',
  why:
    'ASRA bases these on the profound effect on hemostasis, the use of concomitant heparin and/or antiplatelet agents, and the potential for neuraxial bleeding.',
  cautions: [
    "These are ASRA's recommendations for placing a spinal, epidural or deep plexus/peripheral block and for removing catheters. Deviation may be acceptable in the judgment of the responsible anesthesiologist, and a bloody or difficult needle placement needs a case-by-case decision.",
  ],
  drugs: [
    {
      id: 'thrombolytics',
      name: 'Fibrinolytic and thrombolytic drugs',
      timings: [
        { when: 'Before thrombolytic therapy', text: 'In patients scheduled to receive thrombolytic therapy, we recommend that the patient be queried, and the medical record reviewed for a recent history of lumbar puncture, spinal or epidural anesthesia, or epidural steroid injection to allow appropriate monitoring. Guidelines detailing original contraindications for thrombolytic drugs suggest avoidance of these drugs for 10 days following puncture of non-compressible vessels (grade IA)' },
        { when: 'After thrombolytic therapy', text: 'In patients who have received fibrinolytic and thrombolytic drugs, we recommend against needle placement for at least 48 hours. Documentation of normalization of clotting studies (including fibrinogen) is suggested (grade IA)' },
      ],
      catheter: [
        'In those patients who have received neuraxial blocks at or near the time of fibrinolytic and thrombolytic therapy, we recommend that frequent neurological monitoring (eg, every 2 hours) should be continued for at least 48 hours after the last dose. If neuraxial blocks have been combined with fibrinolytic and thrombolytic therapy and ongoing epidural catheter infusion, we recommend the infusion should be limited to drugs minimizing sensory and motor block to facilitate assessment of neurological function (grade IC)',
        'There is no definitive recommendation for removal of neuraxial catheters in patients who unexpectedly receive fibrinolytic and thrombolytic therapy during a neuraxial catheter infusion. We suggest the measurement of fibrinogen level (one of the last clotting factors to recover) to evaluate the presence of residual thrombolytic effect and appropriate timing of catheter removal. Patients should have frequent neurological monitoring for at least 48 hours following catheter removal (grade IIC)',
      ],
      sourceId: 'asra-anticoag-2025',
    },
  ],
  sourceIds: ['asra-anticoag-2025'],
};

export const ASRA_RULES: PeriopMedRule[] = [ASRA_WARFARIN, ASRA_UFH, ASRA_LMWH, ASRA_FONDAPARINUX, ASRA_DOAC, ASRA_ANTIPLATELET, ASRA_THROMBOLYTIC];
```

- [ ] **Step 4: Change the shape in `src/data/periopMeds.ts`**

1. In `PeriopDrug`, change `restart: string;` to:

```ts
  /** What the source says about restarting, or the first dose after the block. Absent when the source gives none. */
  restart?: string;
```

2. In `PeriopMedRule`, add this line directly after `drugClass: string;`:

```ts
  /** Heading that the card's tick box sits under in the Medications list. */
  section: string;
```

3. Replace the three header comment lines at the top of the file with:

```ts
// Perioperative medication instructions. The label cards below (SGLT2 inhibitors, DOACs) cite a manufacturer label and quote its
// wording. The ASRA and cardiac cards live in periopAsra.ts and periopCardiac.ts and quote their guidelines. Nothing is rounded,
// merged or inferred.
```

4. Add `section: "Manufacturers' labels",` directly after the `drugClass:` line of `SGLT2_RULE` and of `DOAC_RULE`, and `section: 'Published protocols',` directly after the `drugClass:` line of `GLP1_RULE`.

5. In `DOAC_RULE.cautions`, replace the single string with:

```ts
    "These are the manufacturers' timings for surgery and procedures. They are not the ASRA intervals for placing a spinal, epidural or deep block: tick 'DOACs: spinal, epidural or deep block (ASRA)' for those.",
```

6. Add `import { ASRA_RULES } from './periopAsra';` under the existing imports (add an import section at the top if there is none, after the header comment), and replace the last line with:

```ts
export const PERIOP_RULES: PeriopMedRule[] = [SGLT2_RULE, DOAC_RULE, GLP1_RULE, ...ASRA_RULES];
```

- [ ] **Step 5: Update `src/components/MedsPanel.tsx`**

1. In `DrugBlock`, change the catheter heading text from `Epidural / intrathecal catheters (label)` to `Catheters, monitoring and post-block dosing` (the ASRA lists also hold deep-block catheters, neurological monitoring and the first dose after the block), and replace the line `<p className="text-xs text-slate-300">Restart: {drug.restart}</p>` with:

```tsx
    {drug.restart && <p className="text-xs text-slate-300">Restart: {drug.restart}</p>}
```

2. In `MedsPanel`, replace the intro paragraph's text with: `Tick what the patient takes. Each card names its source: the manufacturers' labels, ASRA (for spinal, epidural and deep blocks) or the AHA/ACC and ESC cardiac guidelines.`

3. Replace the `PERIOP_RULES.map(...)` that renders the tick items with a version that prints a small heading whenever the section changes:

```tsx
          {PERIOP_RULES.map((r, i) => (
            <React.Fragment key={r.id}>
              {r.section !== PERIOP_RULES[i - 1]?.section && (
                <h4 className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{r.section}</h4>
              )}
              <ScoreItem label={r.drugClass} checked={taken[r.id] === true} locked={false} onToggle={() => toggle(r.id)} />
            </React.Fragment>
          ))}
```

- [ ] **Step 6: Update `src/lib/preopNote.ts`**

1. Replace the string `'Medications ticked in the app: none (the app covers only SGLT2 inhibitors, DOACs and GLP-1 receptor agonists)'` with `'Medications ticked in the app: none (this is not a medication history; the app covers only the classes in its Medications section)'`.
2. Replace the line that pushes each drug (`lines.push(\`  ${d.name}: ${timing} Restart: ${d.restart} ${tags([d.sourceId])}\`);`) with:

```ts
        lines.push(`  ${d.name}: ${timing}${d.restart ? ` Restart: ${d.restart}` : ''} ${tags([d.sourceId])}`);
```

- [ ] **Step 7: Update the sources**

In `src/data/sources.ts`:

1. Change `DATA_VERSION` to `'2026.11.17-draft23'`.
2. In the entry with `id: 'asra-anticoag-2025'`, replace its `version`, `scope`, `verification` and `accessNote` properties with:

```ts
    version: 'Reg Anesth Pain Med 2025 (fifth edition), doi 10.1136/rapm-2024-105766',
    tier: 1,
    scope: [
      'neuraxial and deep block timing with warfarin, heparins, fondaparinux, antiplatelet drugs and thrombolytics',
      'DOAC interruption intervals at low and high dose',
    ],
    verification: 'primary',
    accessNote:
      'Full text (the journal page copy in the project notebook) read on 2026-11-17: every recommendation statement is copied as printed, with its grade. The page tables (1 to 6, including the DOAC table) were not in the extracted text, so the app does not restate the doses behind "high" and "low" dose. Updates the 2018 fourth edition and uses "low/high dose" terms. ASRA says its intervals are deliberately more conservative than guidelines written to prevent thrombosis.',
```

(keep the entry's `id`, `tag`, `name`, `publisher`, `year` and `url` as they are; if `tier` is already on the entry do not duplicate it.)

In `src/data/derived.ts`, remove `'asra-anticoag-2025',` from `SOURCES_WITHOUT_DERIVED_VALUES`. Keep the other ids in that list.

- [ ] **Step 8: Run the tests**

Run: `npx.cmd vitest run src/data/__tests__/periopMeds.test.ts src/lib/calc/__tests__/periopMeds.test.ts src/lib/__tests__/preopNote.test.ts` then `npm run verify` (or the low-memory fallback).
Expected: all pass. If `integrity.test.ts` or another test pins `DATA_VERSION` or a derived-values list, update only that pin, and say so.

- [ ] **Step 9: Commit**

```bash
git add src/data/periopAsra.ts src/data/periopMeds.ts src/components/MedsPanel.tsx src/lib/preopNote.ts src/data/sources.ts src/data/derived.ts src/data/__tests__/periopMeds.test.ts src/lib/calc/__tests__/periopMeds.test.ts src/lib/__tests__/preopNote.test.ts
git commit -m "feat(meds): add the ASRA intervals for spinal, epidural and deep blocks, and a section heading per card group"
```

---

### Task 2: The cardiac drug cards

**Files:**
- Create: `src/data/periopCardiac.ts`
- Modify: `src/data/periopMeds.ts`, `src/data/sources.ts`, `src/data/derived.ts`
- Test: `src/data/__tests__/periopMeds.test.ts`

**Interfaces:**
- Consumes: Task 1's `PeriopMedRule.section` and optional `restart`.
- Produces: `CARDIAC_RULES: PeriopMedRule[]` (ids `beta-blocker`, `statin`, `raas-inhibitor`, `antiplatelet-pci`, `oac-bridging`).

- [ ] **Step 1: Write the failing tests**

In `src/data/__tests__/periopMeds.test.ts`, add `import { CARDIAC_RULES } from '../periopCardiac';` and append, inside the `describe`:

```ts
  const cardiac = (id: string) => {
    const r = CARDIAC_RULES.find((x) => x.id === id);
    if (!r) throw new Error(`missing ${id}`);
    return r;
  };
  const cardiacText = (id: string) =>
    cardiac(id)
      .drugs.flatMap((d) => [...d.timings.map((t) => t.text), d.restart ?? ''])
      .join(' | ');

  it('cardiac: has the five cards, in the cardiac section, each showing both guidelines side by side', () => {
    expect(CARDIAC_RULES.map((r) => r.id)).toEqual(['beta-blocker', 'statin', 'raas-inhibitor', 'antiplatelet-pci', 'oac-bridging']);
    for (const r of CARDIAC_RULES) {
      expect(r.section, r.id).toBe('Cardiac drugs: AHA/ACC and ESC');
      expect(r.sourceIds, r.id).toEqual(['aha-acc-periop-2024', 'esc-ncs-2022']);
      expect(r.drugs.map((d) => d.sourceId), r.id).toEqual(['aha-acc-periop-2024', 'esc-ncs-2022']);
    }
  });

  // The two ESC RAAS rows were captured with their class but not their level (see the esc-ncs-2022 accessNote). Only these may omit it.
  const ESC_LEVEL_NOT_CAPTURED = [
    'Transient discontinuation of ACEIs or ARBs before NCS in hypertensive patients should be considered. (Class IIa)',
    'In patients without HF, withholding RAAS inhibitors on the day of NCS should be considered to prevent peri-operative hypotension. (Class IIa)',
  ];

  it('cardiac: ESC lines carry the class and level printed in the guideline, AHA/ACC lines do not invent one', () => {
    for (const r of CARDIAC_RULES) {
      const esc = r.drugs.find((d) => d.sourceId === 'esc-ncs-2022')!;
      for (const t of [...esc.timings.map((x) => x.text), ...(esc.restart ? [esc.restart] : [])]) {
        if (ESC_LEVEL_NOT_CAPTURED.includes(t)) expect(t, r.id).toMatch(/\(Class (I|II|III)[ab]?\)$/);
        else expect(t, r.id).toMatch(/\(Class (I|II|III)[ab]?, level [ABC]\)$/);
      }
      const aha = r.drugs.find((d) => d.sourceId === 'aha-acc-periop-2024')!;
      for (const t of aha.timings) expect(t.text, r.id).not.toMatch(/\(Class /);
    }
  });

  it('cardiac: every statement ends the way its guideline ends it, so none was cut short', () => {
    for (const r of CARDIAC_RULES) {
      const texts = [...(r.cautions ?? []), ...r.drugs.flatMap((d) => [...d.timings.map((t) => t.text), ...(d.restart ? [d.restart] : [])])];
      for (const t of texts) expect(t, `${r.id}: ...${t.slice(-60)}`).toMatch(/[.)]$/);
    }
  });

  it('beta-blockers: continue chronic therapy, and do not start routinely or on the day of surgery', () => {
    expect(cardiac('beta-blocker').action).toBe('continue');
    const t = cardiacText('beta-blocker');
    expect(t).toContain('beta blockers should be continued through the perioperative period');
    expect(t).toContain('beta blockers should not be initiated on the day of surgery');
    expect(t).toContain('Routine initiation of beta-blocker peri-operatively is not recommended. (Class III, level A)');
  });

  it('statins: continue', () => {
    expect(cardiac('statin').action).toBe('continue');
    expect(cardiacText('statin')).toContain('it is recommended to continue statins during the peri-operative period. (Class I, level B)');
  });

  it('RAAS inhibitors: the two guidelines differ, both are shown, and the card does not pick one', () => {
    expect(cardiac('raas-inhibitor').action).toBe('individualise');
    const t = cardiacText('raas-inhibitor');
    expect(t).toContain('perioperative continuation is reasonable');
    expect(t).toContain('withholding RAAS inhibitors on the day of NCS should be considered');
  });

  it('antiplatelet drugs after a stent: ESC withholding days and the aspirin statement are present', () => {
    const t = cardiacText('antiplatelet-pci');
    expect(t).toContain('withhold ticagrelor for 3–5 days, clopidogrel for 5 days, and prasugrel for 7 days prior to NCS');
    expect(t).toContain('continue aspirin peri-operatively if the bleeding risk allows');
    expect(t).toContain('continue aspirin∗ (75-100 mg)');
  });

  it('bridging: not recommended routinely, and the card points to ASRA for spinal and epidural timing', () => {
    const t = cardiacText('oac-bridging');
    expect(t).toContain('routine periprocedural bridging is not recommended');
    expect(t).toContain('Bridging of OAC therapy is not recommended in patients with low/moderate thrombotic risk undergoing NCS. (Class III, level B)');
    expect(cardiac('oac-bridging').cautions?.some((c) => c.includes('ASRA'))).toBe(true);
  });
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx.cmd vitest run src/data/__tests__/periopMeds.test.ts`
Expected: FAIL (cannot resolve `../periopCardiac`).

- [ ] **Step 3: Create the cardiac data file**

Create `src/data/periopCardiac.ts` with exactly this content. **Copy every string character for character** (including the footnote mark `∗` in the aspirin statements and the en dashes). Do not reword or "correct" anything; if you think a line is clinically wrong, report it.

```ts
// Chronic cardiac and antithrombotic drug statements from the 2024 AHA/ACC and 2022 ESC non-cardiac surgery guidelines. Each line
// is the guideline's own sentence, copied from its full text on 2026-11-17; ESC lines carry the class and level printed in its
// recommendation tables. Nothing is rounded, merged or inferred. These are for cardiac risk and thrombosis, not for the timing
// of a spinal or epidural (see the ASRA rules).

import type { PeriopMedRule } from './periopMeds';

export const BETA_BLOCKER_RULE: PeriopMedRule = {
  id: 'beta-blocker',
  drugClass: 'Beta-blockers',
  section: 'Cardiac drugs: AHA/ACC and ESC',
  action: 'continue',
  summary:
    'Continue chronic therapy through surgery; do not start routinely on the day of surgery.',
  why:
    'AHA/ACC: acutely discontinuing beta blockers for long-term indications is harmful, and initiating them on the day of surgery is harmful, particularly at higher doses.',
  drugs: [
    {
      id: 'beta-blocker-aha',
      name: 'AHA/ACC 2024',
      timings: [
        { text: 'In patients on stable doses of beta blockers undergoing NCS, beta blockers should be continued through the perioperative period as appropriate based on the clinical circumstances.' },
        { text: 'In patients scheduled for elective NCS who have a new indication for beta blockade, beta blockers may be initiated far enough before surgery (optimally >7 days) to permit assessments of tolerability and drug titration if needed.' },
        { text: 'In patients undergoing NCS and with no immediate need for beta blockers, beta blockers should not be initiated on the day of surgery due to increased risk for postoperative mortality.' },
      ],
      sourceId: 'aha-acc-periop-2024',
    },
    {
      id: 'beta-blocker-esc',
      name: 'ESC 2022',
      timings: [
        { text: 'Peri-operative continuation of beta-blockers is recommended in patients currently receiving this medication. (Class I, level B)' },
        { text: 'Routine initiation of beta-blocker peri-operatively is not recommended. (Class III, level A)' },
      ],
      sourceId: 'esc-ncs-2022',
    },
  ],
  sourceIds: ['aha-acc-periop-2024', 'esc-ncs-2022'],
};

export const STATIN_RULE: PeriopMedRule = {
  id: 'statin',
  drugClass: 'Statins',
  section: 'Cardiac drugs: AHA/ACC and ESC',
  action: 'continue',
  summary:
    'Continue statins through surgery.',
  why:
    'ESC: the long-term use of statins in patients with cardiovascular disease or high risk of it is well established, while trials of starting a statin in the perioperative period are scarce.',
  drugs: [
    {
      id: 'statin-aha',
      name: 'AHA/ACC 2024',
      timings: [
        { text: 'In patients currently on statins and scheduled for NCS, continuation of statin therapy is recommended to reduce the risk of MACE.' },
        { text: 'In statin-naïve adult patients who meet criteria for statin use based on ASCVD history or 10-year risk assessment and are scheduled for NCS, perioperative initiation of statin is recommended with intention of long-term use.' },
      ],
      sourceId: 'aha-acc-periop-2024',
    },
    {
      id: 'statin-esc',
      name: 'ESC 2022',
      timings: [
        { text: 'In patients already on statins, it is recommended to continue statins during the peri-operative period. (Class I, level B)' },
      ],
      sourceId: 'esc-ncs-2022',
    },
  ],
  sourceIds: ['aha-acc-periop-2024', 'esc-ncs-2022'],
};

export const RAAS_RULE: PeriopMedRule = {
  id: 'raas-inhibitor',
  drugClass: 'ACE inhibitors, ARBs and other RAAS inhibitors',
  section: 'Cardiac drugs: AHA/ACC and ESC',
  action: 'individualise',
  summary:
    'The two guidelines differ by indication: continue for heart failure with reduced ejection fraction; consider withholding in hypertension or without heart failure.',
  drugs: [
    {
      id: 'raas-aha',
      name: 'AHA/ACC 2024',
      timings: [
        { text: 'In patients on chronic RAASi for HFrEF, perioperative continuation is reasonable.' },
      ],
      sourceId: 'aha-acc-periop-2024',
    },
    {
      id: 'raas-esc',
      name: 'ESC 2022',
      timings: [
        { text: 'Transient discontinuation of ACEIs or ARBs before NCS in hypertensive patients should be considered. (Class IIa)' },
        { text: 'In patients without HF, withholding RAAS inhibitors on the day of NCS should be considered to prevent peri-operative hypotension. (Class IIa)' },
      ],
      sourceId: 'esc-ncs-2022',
    },
  ],
  sourceIds: ['aha-acc-periop-2024', 'esc-ncs-2022'],
};

export const PCI_ANTIPLATELET_RULE: PeriopMedRule = {
  id: 'antiplatelet-pci',
  drugClass: 'Antiplatelet drugs after a coronary stent (aspirin, clopidogrel, prasugrel, ticagrelor)',
  section: 'Cardiac drugs: AHA/ACC and ESC',
  action: 'individualise',
  summary:
    'Keep aspirin if the bleeding risk allows; the timing of surgery and any P2Y12 interruption depend on the stent and are decided by the surgeon, anaesthesiologist and cardiologist together.',
  why:
    'AHA/ACC: the risk of perioperative stent thrombosis is greatest in the first 4 to 6 weeks after PCI, with excess risks that decline over time but persist to 6 months.',
  drugs: [
    {
      id: 'antiplatelet-aha',
      name: 'AHA/ACC 2024',
      timings: [
        { text: 'In patients with prior PCI undergoing NCS, it is recommended to continue aspirin∗ (75-100 mg), if possible, to reduce the risk of cardiac events.' },
        { text: '∗ Platelet adenosine diphosphate receptor (P2Y12) monotherapy may be considered if surgical bleeding risks are acceptable or if aspirin is not tolerated.' },
        { text: 'In patients with recent coronary artery balloon angioplasty without stent placement, elective NCS should be delayed for a minimum of 14 days to minimize perioperative MACE.' },
        { text: 'In patients with DES-PCI placed for CCD who require elective NCS with interruption of ≥1 antiplatelet agents, it is reasonable to delay surgery for ≥6 months after PCI to minimize perioperative MACE.' },
        { text: 'In patients with DES-PCI who require time-sensitive NCS with interruption of ≥1 antiplatelet agents, NCS may be considered ≥3 months after PCI if the risk of delaying surgery outweighs the risk of MACE.' },
        { text: 'In patients with CAD who require time-sensitive NCS within 30 days of PCI with BMS or <3 months of PCI with DES, DAPT should be continued unless the risk of bleeding outweighs the benefit of the prevention of stent thrombosis.' },
        { text: 'In patients with prior PCI in whom OAC monotherapy must be discontinued before NCS, aspirin should be substituted when feasible in the perioperative period until OAC can be safely reinitiated.' },
        { text: 'In select patients after PCI who have a high thrombotic risk, perioperative bridging with intravenous antiplatelet therapy may be considered <6 months after DES or <30 days after BMS if NCS cannot be deferred.' },
      ],
      sourceId: 'aha-acc-periop-2024',
    },
    {
      id: 'antiplatelet-esc',
      name: 'ESC 2022',
      timings: [
        { text: 'It is recommended to delay elective NCS until 6 months after elective PCI and 12 months after an ACS. (Class I, level A)' },
        { text: 'After elective PCI, it is recommended to delay time-sensitive NCS until a minimum of 1 month of DAPT treatment has been given. (Class I, level B)' },
        { text: 'In patients with a recent PCI scheduled for NCS, it is recommended that management of antiplatelet therapy is discussed between the surgeon, anaesthesiologist, and cardiologist. (Class I, level C)' },
        { text: 'In patients with a previous PCI, it is recommended to continue aspirin peri-operatively if the bleeding risk allows. (Class I, level B)' },
        { text: 'If interruption of P2Y12 inhibitor is indicated, it is recommended to withhold ticagrelor for 3–5 days, clopidogrel for 5 days, and prasugrel for 7 days prior to NCS. (Class I, level B)' },
        { text: 'For patients undergoing high bleeding risk surgery (e.g. intracranial, spinal neurosurgery, or vitroretinal eye surgery), it is recommended to interrupt aspirin for at least 7 days pre-operatively. (Class I, level C)' },
      ],
      restart:
        'If antiplatelet therapy has been interrupted before a surgical procedure, it is recommended to restart therapy as soon as possible (within 48 h) post-surgery, according to interdisciplinary risk assessment. (Class I, level C)',
      sourceId: 'esc-ncs-2022',
    },
  ],
  sourceIds: ['aha-acc-periop-2024', 'esc-ncs-2022'],
};

export const OAC_BRIDGING_RULE: PeriopMedRule = {
  id: 'oac-bridging',
  drugClass: 'Oral anticoagulants and bridging (cardiac guidelines)',
  section: 'Cardiac drugs: AHA/ACC and ESC',
  action: 'individualise',
  summary:
    'Routine bridging is not recommended. ESC: for minor-bleeding-risk procedures, do not interrupt the anticoagulant.',
  cautions: [
    'These statements are about cardiac and thrombotic risk. For the timing of a spinal, epidural or deep block, use the ASRA cards.',
  ],
  drugs: [
    {
      id: 'oac-aha',
      name: 'AHA/ACC 2024',
      timings: [
        { text: 'In most patients with CVD who are undergoing elective NCS where OAC interruption is warranted, routine periprocedural bridging is not recommended due to increased bleeding risk.' },
      ],
      sourceId: 'aha-acc-periop-2024',
    },
    {
      id: 'oac-esc',
      name: 'ESC 2022',
      timings: [
        { text: 'When an urgent surgical intervention is required, it is recommended that NOAC therapy is immediately interrupted. (Class I, level C)' },
        { text: 'In minor bleeding risk surgery and other procedures where bleeding can easily be controlled, it is recommended to perform surgery without interruption of OAC therapy. (Class I, level B)' },
        { text: 'In non-minor bleeding risk procedures in patients using a NOAC, it is recommended to use an interruption regimen based on the NOAC compound, renal function, and bleeding risk. (Class I, level B)' },
        { text: 'In patients using NOACs, it is recommended that minor bleeding risk procedures are performed at trough levels (typically 12–24 h after last intake). (Class I, level C)' },
        { text: 'LMWH is recommended, as an alternative to UFH, for bridging in patients with MHVs and high surgical risk. (Class I, level B)' },
        { text: 'Bridging of OAC therapy is not recommended in patients with low/moderate thrombotic risk undergoing NCS. (Class III, level B)' },
        { text: 'Use of reduced-dose NOAC to attenuate the risk of post-operative bleeding is not recommended. (Class III, level C)' },
      ],
      sourceId: 'esc-ncs-2022',
    },
  ],
  sourceIds: ['aha-acc-periop-2024', 'esc-ncs-2022'],
};

export const CARDIAC_RULES: PeriopMedRule[] = [BETA_BLOCKER_RULE, STATIN_RULE, RAAS_RULE, PCI_ANTIPLATELET_RULE, OAC_BRIDGING_RULE];
```

- [ ] **Step 4: Add the cards to the list**

In `src/data/periopMeds.ts`, add `import { CARDIAC_RULES } from './periopCardiac';` beside the ASRA import and change the last line to:

```ts
export const PERIOP_RULES: PeriopMedRule[] = [SGLT2_RULE, DOAC_RULE, GLP1_RULE, ...ASRA_RULES, ...CARDIAC_RULES];
```

- [ ] **Step 5: Update the two sources**

In `src/data/sources.ts`:

1. In the entry with `id: 'aha-acc-periop-2024'`, replace its `scope`, `verification` and `accessNote` with:

```ts
    scope: ['perioperative cardiovascular risk assessment', 'perioperative cardiac medications', 'SGLT2 inhibitor hold before surgery', 'beta-blocker, statin, RAAS inhibitor, antiplatelet and bridging statements'],
    verification: 'primary',
    accessNote:
      'Recommendation statements read on 2026-11-17 from the full-text copy in the project notebook and copied as printed. The class and level of each recommendation were not carried over because the copy separates them from the statements. Supersedes the 2014 ACC/AHA guideline. An AHA web page with a 2026 date was seen in search; check whether a newer edition exists.',
```

2. In the entry with `id: 'esc-ncs-2022'`, replace its `scope`, `verification` and `accessNote` with:

```ts
    scope: ['pre-operative cardiac assessment by surgical risk', 'functional capacity assessment', 'perioperative cardiac medications', 'beta-blocker, statin, RAAS inhibitor, antiplatelet and anticoagulant statements'],
    verification: 'primary',
    accessNote:
      'Recommendation tables read on 2026-11-17 from the full-text copy in the project notebook; each statement is copied as printed with the class and level of its table, except the two RAAS inhibitor rows (transient discontinuation in hypertension; withholding on the day of surgery without HF), whose level was not captured: they show the class (IIa) only. Some summary lines elsewhere in the guideline give different wording for the same drug; the table wording is used.',
```

(Keep `id`, `tag`, `name`, `publisher`, `year`, `version`, `url` and `tier` as they are.)

3. Change `DATA_VERSION` to `'2026.11.17-draft24'`.

4. In `src/data/derived.ts`, remove `'aha-acc-periop-2024',` and `'esc-ncs-2022',` from `SOURCES_WITHOUT_DERIVED_VALUES`.

- [ ] **Step 6: Run the tests**

Run: `npx.cmd vitest run src/data/__tests__/periopMeds.test.ts`, then `npm run verify` (or the low-memory fallback).
Expected: all pass. If `integrity.test.ts` pins the list of sources without derived values or a source verification count, update only that pin, and say so.

- [ ] **Step 7: Commit**

```bash
git add src/data/periopCardiac.ts src/data/periopMeds.ts src/data/sources.ts src/data/derived.ts src/data/__tests__/periopMeds.test.ts
git commit -m "feat(meds): add the AHA/ACC and ESC statements on beta-blockers, statins, RAAS inhibitors, antiplatelet drugs and bridging"
```

---

### Task 3: Docs and a check by hand

**Files:**
- Modify: `README.md`, `docs/superpowers/specs/2026-11-17-perioperative-guide-design.md`

- [ ] **Step 1: README**

In `README.md`, replace `a Medications section (SGLT2 inhibitors and DOACs, with the manufacturers' label wording, and a pointer for GLP-1 agonists)` with `a Medications section (SGLT2 inhibitors and DOACs with the manufacturers' label wording; the ASRA intervals for spinal, epidural and deep blocks with warfarin, heparins, fondaparinux, DOACs, antiplatelet drugs and thrombolytics; the AHA/ACC and ESC statements on beta-blockers, statins, RAAS inhibitors, antiplatelet drugs after a stent and bridging; and a pointer for GLP-1 agonists)` (the original text appears once).

- [ ] **Step 2: Spec**

In `docs/superpowers/specs/2026-11-17-perioperative-guide-design.md`, insert this line directly above the line that begins `4. **Plan cards**`:

```markdown
3b. **Peri-op meds, guideline slice** (plan: `docs/superpowers/plans/2026-11-17-periop-meds-guidelines.md`): twelve more cards in the Medications list, from three guidelines read in full from the project notebook. ASRA fifth edition (Kopp et al. 2025): spinal, epidural and deep-block intervals for warfarin, unfractionated heparin, LMWH, fondaparinux, DOACs (low and high dose; dabigatran by creatinine clearance), antiplatelet drugs and thrombolytics, each ASRA sentence copied with its grade. AHA/ACC 2024 and ESC 2022: beta-blockers, statins, RAAS inhibitors, antiplatelet drugs after a stent, and anticoagulant bridging, shown side by side with the ESC class and level. Where the guidelines differ (RAAS inhibitors) both are shown and the card says individualise. Cards are grouped under three headings. **Still deferred:** steroid stress dosing, insulin and oral hypoglycaemics, MAOIs, lithium, antiepileptics and antiparkinsonian drugs (no guideline text in the notebook); the ESAIC/ESRA 2022 comparison (it differs from ASRA on some intervals); herbal medications; obstetric neuraxial timing; the ASRA tables (the DOAC doses).
```

- [ ] **Step 3: Run the tests**

Run: `npm run verify` (or the low-memory fallback from Task 1).
Expected: all pass.

- [ ] **Step 4: Check by hand** (`npm run dev` on a free port; stop it afterwards)

1. Pre-op, Medications: small headings (Manufacturers' labels, Published protocols, ASRA, Cardiac drugs) group the tick boxes; nothing overflows at 320 px width.
2. Tick "Low molecular weight heparin": the card shows the low-dose and the high-dose lines together, with the 12-hour and 24-hour sentences, and a source badge.
3. Tick "Warfarin": no "Restart" line appears.
4. Tick "DOACs: spinal, epidural or deep block (ASRA)" with no creatinine entered: the dabigatran CrCl lines show "enter age, weight, sex and creatinine". Enter values giving CrCl about 45: the 120-hour line is marked as this patient's.
5. Tick the label DOAC card too: its amber caution names the ASRA card.
6. Tick "ACE inhibitors, ARBs and other RAAS inhibitors": AHA/ACC and ESC blocks appear side by side, headed "Individualise".
7. Pre-op note: Copy output lists the ticked cards, shows no "undefined", and with nothing ticked reads "none (this is not a medication history; ...)".
8. New case clears every tick.
9. Light and dark themes read correctly.

- [ ] **Step 5: Commit**

```bash
git add README.md docs/superpowers/specs/2026-11-17-perioperative-guide-design.md
git commit -m "docs: record the guideline medication cards in the README and spec step 3b"
```
