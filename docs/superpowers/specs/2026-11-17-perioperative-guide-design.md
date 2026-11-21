# Perioperative Guide: Design Spec

- **Date:** 2026-11-17
- **Status:** approved in brainstorming, awaiting review of this written spec
- **Replaces:** `pre_anesthesia_assessment_clinic_pwa_blueprint.md` (an untracked draft). Its useful parts are folded in here and its unsafe parts are dropped (see §9).

## 1. Intent

**Audience:** anesthesia doctors and trainees anywhere in the world.

**Goal:** grow AnesthAssist from an intraoperative cognitive aid into a full perioperative assessment and management guide covering pre-op, intra-op, post-op and rapid plan cards for common case types.

**Success criteria:**
- A clinician can go from pre-op assessment to post-op plan in one app, offline.
- Every value is traceable to a named source.
- `npm test` fails on any clinical record without a resolving source.

**Constraints carried over unchanged from the current app:**
- Offline-first PWA. No clinical network calls. No accounts or analytics.
- Patient inputs live in memory only and are cleared by **New case**. Nothing about the patient goes to localStorage.
- No value without a source. A missing value shows `NO_SOURCE_VALUE`.
- Educational and cognitive aid only. Clinical judgment comes first.

## 2. Information architecture

The bottom bar changes from `Dosing · Airway · Vent · Lists` to **`Pre-op · Intra-op · Post-op`** (a **Plans** tab joins in rollout step 4, once it has content), with the red **SOS** button unchanged.

| Place | Contents | Origin |
|---|---|---|
| **Pre-op** tab | Assess · Meds · Fasting · Pre-op note | New. Fasting is the existing NPO checklist. |
| **Diseases** tab (Conditions) | Comorbidity search and plans, rare diseases first | New, rollout step 7 (user request 2026-11-17: its own tab) |
| **Intra-op** tab | Sub-views: Dosing · Airway · Vent · Lists | Existing views moved in unchanged |
| **Post-op** tab | PONV (Apfel) · Analgesia plan · PACU discharge (Aldrete, PADSS) · Delirium (4AT) · Emergence list · Handoff | New, plus the existing emergence checklist and handoff |
| **Plans** tab | Rapid plan cards (§5) | New, rollout step 4 |
| **Library** (header book icon, which already opens References) | Comorbidity reference · Drug reference · Sources and verification · Guideline comparisons | Existing ReferencesView and ReferenceDrugsPanel, plus comorbidity browsing |
| **SOS** | LAST, MH, CICO, plus the QRH crises (anaphylaxis, massive bleeding, bronchospasm, laryngospasm) | Target state. For now the crisis lists stay under Intra-op › Lists (see below) |

**Where each checklist group goes.** `ChecklistsView` gets a `phaseLists` prop (from `listsFor(tab)` in `lib/phases.ts`), and each phase renders only its own lists:
- Fasting / NPO → Pre-op tab
- Emergence and extubation → Post-op tab
- Everything else → Intra-op › Lists. Pre-induction is run in the OR, so it stays here rather than moving to the clinic-style Pre-op tab. The crisis lists stay here too.
- Handoff → Post-op
- Moving the crisis lists into SOS is its own task. SOS has three weight-based panels behind a three-way switch, and adding four more would need that switch redesigned.

The biometric header (age, sex, weight, height) is the single input for every score and dose. In the navigation step it shows on Intra-op › Dosing, Airway and Vent only (`needsBiometrics` in `lib/phases.ts`), because the checklists and handoff do not use it. Pre-op shows it from rollout step 2, when the first score needs age, sex and BMI.

**Settings additions:**
- **Units:** added in rollout step 2 as an inline mg/dL / µmol/L toggle beside the creatinine field in Assess (not in the Settings sheet), with the first score that reads a creatinine. Only the choice is persisted. Glucose and Hb units wait until something reads them.
- **Appearance:** System / Light / Dark in the Settings sheet (plan: `docs/superpowers/plans/2026-11-17-theme.md`). Stored under its own key `anesthassist-theme` (no key means System), not in the persisted store. The palette is CSS variables selected by `data-theme`; light is the mirrored shade of the dark palette. The SOS overlay stays dark in both themes.

## 3. Data model (`src/data/`)

All records follow the existing rules. `sourceIds` must resolve in `sources.ts`, and `integrity.test.ts` enforces it. Two optional fields are added to the new record types:

```ts
why?: string;                                  // one-sentence rationale for trainees, shown on tap
variants?: { sourceId: string; text: string }[]; // conflicting guideline positions, shown side by side
```

There is no global guideline switch. Wherever AHA/ACC, ESC or other guidelines conflict, `variants` shows them side by side, following the existing GLP-1 comparison pattern.

| File | Type | Key fields |
|---|---|---|
| `riskScores.ts` | `RiskScore` | `id, name, items: {id, label, points, derive?}[], bands: {min, label, implication}[], why?, sourceIds` |
| `periopMeds.ts` | `PeriopMedRule` | `id, drugClass, examples[], action: 'continue'\|'hold'\|'modify'\|'individualise', holdBefore?, resume?, conditions?: {neuraxial?, crclBand?, bleedingRisk?}[], why?, variants?, sourceIds` |
| `comorbidities.ts` | `Comorbidity` | `id, name, aliases[], system, workup[], delayTriggers[], goals[], technique[], avoid[], postop[], medRuleIds[], why?, variants?, sourceIds` |
| `postop.ts` | Analgesia and PONV prophylaxis plans | Uses `ChecklistItemRecord` |
| `planCards.ts` | `PlanCard` | See §5 |

**Content of the first scores and rules:**
- **Scores:** RCRI, DASI (or ≥4 METs yes/no), STOP-Bang, ARISCAT, Clinical Frailty Scale, Apfel, Aldrete, PADSS, 4AT.
- **Med rules:** DOACs, warfarin, heparins, antiplatelets (P2Y12, aspirin), GLP-1 RAs, SGLT2 inhibitors (drugs listed separately, because ertugliflozin's hold period differs), ACEi/ARB, insulin and oral hypoglycaemics, corticosteroids (graded by surgical stress), MAOIs, lithium, antiepileptics, antiparkinsonian drugs.

`Comorbidity.medRuleIds` replaces the blueprint's free-text `medsContinue` and `medsHold`. Picking a comorbidity highlights the matching rules in the Meds step.

## 4. Logic (`src/lib/`)

- **`calc/scores.ts`:** a pure `scoreResult(score, answers, biometrics)` returning `{ points, band } | { incomplete: string[] }`.
  - Items with `derive` (age > 50, male, BMI > 35, age ≥ 65 for CFS) take their value from the biometric header and render locked.
  - Missing input gives *incomplete*. Nothing is ever defaulted.
- **`calc/crcl.ts`:** Cockcroft-Gault from the existing weight, age and sex plus one creatinine input.
  - Which weight it uses is documented and sourced.
  - It outputs a band, which feeds `PeriopMedRule.conditions.crclBand`.
- **`calc/units.ts`:** the single conversion point. Creatinine is converted at µmol/L = mg/dL × 88.4, glucose at mmol/L = mg/dL ÷ 18, and Hb at g/L = g/dL × 10. All calculations use SI.
- **`preopNote.ts`:** a pure `buildPreopNote(input)`, shaped like `buildHandoffSummary()`.
  - It includes **age, sex, weight, height, BMI and creatinine** (approved), the ASA class (with E as a separate flag), every score's result and band, the med instructions, the comorbidity plans and the fasting status.
  - Each line ends with its source tag.
  - It has **no free-text fields**.
  - The note is never stored. It reaches the clipboard only on a user tap.
- **`copyText.ts`:** the existing `copyText` moves out of `ChecklistsView.tsx` in rollout step 6, when the pre-op note becomes its second user. It awaits the clipboard and falls back if that fails.
- The intra-op **handoff keeps its current no-biometrics rule**, unchanged.

## 5. Rapid plan cards (`planCards.ts`)

```ts
interface PlanCard {
  id: string; title: string; population: string; why?: string;
  phases: Record<'preop' | 'induction' | 'maintenance' | 'emergence' | 'redFlags', ChecklistItemRecord[]>;
  links: { drugIds?: string[]; ventScenarioId?: string; checklistIds?: string[];
           comorbidityIds?: string[]; airway?: 'adult' | 'pediatric' };
}
```

- **Links, not copies:** cards link to existing content and never retype doses. Tapping a link opens the matching Intra-op view (Dosing filtered to `drugIds`, Vent on `ventScenarioId`, and so on).
- **Empty phases:** a phase with no sourced item shows `NO_SOURCE_VALUE`.
- **First batch:**
  1. Paediatric
  2. Obstetric: CS under neuraxial
  3. Obstetric: GA for CS and failed obstetric intubation
  4. Elderly/frail
  5. Obesity (BMI ≥ 40)
  6. RSI/full stomach
- **Later batches:** day-case, trauma, neuro, thoracic, cardiac, ENT shared airway.
- **Paediatric constraint:** calculated dosing stays withheld under 18. The paediatric card shows the printed paediatric lines from `referenceDrugs.ts` (reference only, never calculated) and the existing paediatric ETT and LMA sizing.

## 6. UI

- **Pre-op tab:** a vertical flow of collapsible steps. Each step header shows its current result (for example "RCRI 2 · elevated"), so the user can jump straight to any step.
  - **Assess:** ASA picker with an E toggle, surgical risk grade, RCRI, functional capacity, STOP-Bang, CFS (shown when age ≥ 65), ARISCAT.
  - **Meds:** class toggles. Each shows its action, timing, resumption and conditions, with `variants` side by side where guidelines conflict.
  - **Fasting:** the existing NPO checklist.
  - **Note:** a preview plus a Copy button.
- **Conditions tab:** a search box (a simple filter over name and aliases, with no search library) above the condition list. Picking a condition shows its plan and highlights its `medRuleIds` in Pre-op › Meds. A search with no match says the condition is not in the app yet; it never falls back to an online or AI lookup (§9).
- **Post-op tab:** Apfel with its prophylaxis plan, the analgesia plan, Aldrete or PADSS with the discharge threshold, 4AT, the emergence checklist and the handoff.
- **Reuse:** the HUD `Panel`, `ChecklistItem`, `SegmentedControl`, `SourceBadge`, `NoSourceValue` and `useDialogFocus` components, plus the existing touch-target and contrast conventions (48 px minimum, `aria-pressed` on toggles).

## 7. Content pipeline

1. **Draft:** NotebookLM ("Anesthesia nootbooks") drafts records in the TypeScript shape from §3 or §5, using **source IDs from `sources.ts`**, never free-text citations. A missing source is added to `sources.ts` first, with honest `verification` and `accessNote` values.
2. **Review:** drafts land on a branch as a PR. A clinician's review in the PR is the sign-off, and merging is the approval. No draft flag ships, so unreviewed content never reaches users.
3. **Test:** `npm test` rejects any record with an unresolved or missing source, or a dangling `medRuleId` or link id.
4. **Version:** every content PR bumps `DATA_VERSION`.

**Facts to re-check in review.** These blueprint claims were flagged in the audit:
- **MG and sugammadex:** the blueprint's "10–20% standard dose" looks wrong. Reduced dosing usually applies to rocuronium, not sugammadex.
- **GLP-1 weekly agents:** the blueprint's "hold 1 week" predates the 2024 multisociety guidance.
- **SGLT2 hold durations:** AHA/ACC 2024 says to stop 3–4 days before surgery, while the FDA labels give 3 days, or 4 for ertugliflozin. Encode both as `variants`.
- **ACEi/ARB:** the exact wording of the 2024 AHA/ACC recommendation.
- **Steroid stress dosing:** this is graded by surgical stress, not a single dose.

## 8. Testing

- **Scores:** each score is tested at every band edge (RCRI 0/1/2/≥3, STOP-Bang 2/3/5, Apfel 0–4, ARISCAT 26/45, CFS ≥5, Aldrete ≥9, and so on), plus locking of derived items and *incomplete* on missing input.
- **CrCl and units:** Cockcroft-Gault is checked against published worked examples, and unit conversions round-trip.
- **Integrity:** `integrity.test.ts` is extended to the new files.
  - Every `sourceId` resolves and every `medRuleIds` or `links` id exists.
  - Band thresholds are ascending.
  - Every plan card has all five phases.
- **Pre-op note:** `buildPreopNote` is tested on a fixed input against the expected lines, and the input type has no free-text string field.
- **No migration needed:** `activeTab` is not persisted (see `partialize` in `useAppStore.ts`), so renaming the tabs cannot break an installed app. The existing `migrate.test.ts` still guards the persisted shape.
- **Every PR:** `npm run verify` must pass.

## 9. Dropped from the blueprint

| Dropped | Why |
|---|---|
| Separate `preop-pwa` app | It duplicates the PWA, store, sources and tests that already exist |
| Gemini `/api/disease-lookup` and localStorage disease cache | It makes a clinical network call, sends query text off the device, and caches unsourced AI output as if it were vetted |
| MiniSearch | A plain filter is enough for about 100 records |
| Tailwind v4 | The app uses Tailwind 3, and one stack is enough |
| Default patient values (age 55, BMI 28, ASA II) | Unedited defaults would print into the note. Fields start blank and missing input reads *incomplete*. |
| Free-text `sources` and med strings | Replaced by `sourceIds` and `medRuleIds` |
| Hand-ticked STOP-Bang items for age, sex and BMI | These are derived from the biometric header |
| `ASA 'E'` as a class | E is a modifier flag |

**Out of scope:** calculated paediatric dosing (its own sub-project), UI translation, accounts and sync, and any runtime AI or network content.

## 10. Rollout

Each step is one PR and ships on its own.

**Already done (2026-11-17):**
- The 12 core sources are registered in `sources.ts`: RCRI, DASI, STOP, ARISCAT, CFS, Apfel, Aldrete, PADSS, 4AT, AHA/ACC 2024, ESC 2022 and ASRA 2025.
- Each was confirmed by web search, with `verification: 'secondary'` and the working thresholds written in `scope` and `accessNote`.
- They are on `SOURCES_WITHOUT_DERIVED_VALUES` until records cite them. Each PR that encodes a record removes its id from that list.
- Not yet registered: the SGLT2 FDA labels, OAA/DAS obstetric, and the CFS 2.0 and STOP-Bang cut-off papers. Each content PR adds these before its records.

1. **Navigation redesign** (plan: `docs/superpowers/plans/2026-11-17-phase-navigation.md`): the Pre-op, Intra-op and Post-op tabs, existing views moved, an intra-op sub-navigation. No new clinical content. Deferred from this step: Plans tab (step 4), units setting (step 2), `copyText` move (step 6), crisis lists into SOS (own task).
2. **Assess** (plan: `docs/superpowers/plans/2026-11-17-assess-scores-crcl.md`): serum creatinine with a mg/dL / µmol/L toggle, Cockcroft-Gault CrCl (actual body weight, adults only), RCRI and STOP-Bang, and the biometric header on Pre-op. RCRI was verified against the paper's full text. Deferred to step 2b: DASI, ARISCAT and the Clinical Frailty Scale (their weight tables and scale text have not been read), the ASA picker and surgical-risk grade (no ASA source registered, and nothing reads them before the pre-op note), glucose and Hb units, and CrCl bands (step 3 defines them from ASRA and the drug labels).
3. **Peri-op meds** (plan: `docs/superpowers/plans/2026-11-17-periop-meds.md`): first slice, label-verified only. SGLT2 inhibitors (3 days; ertugliflozin 4 days) and DOACs (apixaban, rivaroxaban, edoxaban, dabigatran by CrCl, with the labels' epidural catheter statements) from the manufacturers' DailyMed labels read in full, plus a GLP-1 pointer to the existing protocol comparison. The DOAC card states that label timings are not ASRA neuraxial intervals. **Step 3b:** done; see the `3b.` entry below (the drugs still deferred are listed there). The CrCl bands the spec mentioned are not needed yet: dabigatran uses the label's own 50 mL/min split.
3b. **Peri-op meds, guideline slice** (plan: `docs/superpowers/plans/2026-11-17-periop-meds-guidelines.md`): twelve more cards in the Medications list, from three guidelines read in full from the project notebook. ASRA fifth edition (Kopp et al. 2025): spinal, epidural and deep-block intervals for warfarin, unfractionated heparin, LMWH, fondaparinux, DOACs (low and high dose; dabigatran by creatinine clearance), antiplatelet drugs and thrombolytics, each ASRA sentence copied with its grade. AHA/ACC 2024 and ESC 2022: beta-blockers, statins, RAAS inhibitors, antiplatelet drugs after a stent, and anticoagulant bridging, shown side by side with the ESC class and level (class only for the two RAAS rows). Where the guidelines differ (RAAS inhibitors) both are shown and the card says individualise. Cards are grouped under four headings. **Still deferred:** steroid stress dosing, insulin and oral hypoglycaemics, MAOIs, lithium, antiepileptics and antiparkinsonian drugs (no guideline text in the notebook); the ESAIC/ESRA 2022 comparison (it differs from ASRA on some intervals); herbal medications; obstetric neuraxial timing; the ASRA tables (the DOAC doses).
4. **Plan cards**, first batch (plan: `docs/superpowers/plans/2026-11-17-plan-cards.md`): a Plans tab with four cards (Pediatric, Obstetric cesarean under neuraxial, Obesity, RSI / full stomach). Deviation from §5: a phase lists the ids of existing checklist items instead of new `ChecklistItemRecord`s, so no new clinical statement is written and every line keeps its own source; `links` is reduced to `ventScenarioId`, `airway`, `dosing`, `lists`, `references`. The Pediatric card never links to Dosing. Obesity names no BMI cut-off (no registered source states one). **Deferred:** Obstetric general anesthesia / failed intubation and Elderly / frail (no sourced content readable yet), a filtered Dosing deep-link (the filter is local state), and the later batches.
5. **Post-op tools** (plan: `docs/superpowers/plans/2026-11-17-postop-tools.md`): first slice, primary-verified only. The Apfel PONV score (adults only; items, incidence and low/medium/high classification from the open ASER 2025 consensus appendix) with the consensus's statements (2 interventions at any risk in adults; five baseline-risk strategies; no doses), and the 4AT delirium screen (item wording, points and bands read from the 4AT form, version 1, in the supplementary appendix of Bellelli 2014, now a `primary` source; validated in hospitalised patients aged 70 or over, not specifically after surgery) using a new multi-option `ChoiceScore` model. The biometric header now also shows on Post-op (Apfel needs sex and age); the handoff stays biometrics-free. **Deferred to step 5b:** the modified Aldrete score and PADSS (item tables not readable; two open papers disagree on the PADSS threshold, "below 10" vs "9 or more"), the analgesia plan (ERAS guideline not read for this slice), PONV antiemetic doses (main-text table paywalled), and pediatric PONV risk (POVOC/VPOP).
5b. **PACU discharge scores** (plan: `docs/superpowers/plans/2026-11-17-pacu-discharge.md`): the modified Aldrete score and the revised PADSS (Marshall and Chung 1999) as 0–2 point calculators on Post-op with the discharge mark at 9 of 10, read from Miller 6e (Tables 68-18, 71-4) and Clinical Cases in Anesthesia (Tables 78.1, 78.2) in the project notebook, which settles the earlier "below 10" vs "9 or more" question. The primary papers were not readable. Where the books differ (Aldrete blood-pressure bands in percent or mm; Aldrete 0-point oxygen level; PADSS pain "not acceptable" = 0 or 1), the internally consistent Clinical Cases wording is encoded and each item names the other book (user decision 2026-11-17). New source `padss-marshall-chung-1999`. **Still deferred:** PONV antiemetic doses (only pre-2025 textbook figures available), the analgesia plan (its own step, from the 2026 ASA regional-analgesia guideline), pediatric PONV risk.
6. **Pre-op note** (plan: `docs/superpowers/plans/2026-11-17-preop-note.md`): a pure `buildPreopNote` over numbers and fixed pick-lists only (no free-text field), reusing the CrCl, score and medication-timing code so the note cannot disagree with the screens. It lists age, sex, weight, height, BMI, creatinine (both units), CrCl, ASA class with a separate E flag, a two-choice fasting status, the Assess scores, and the ticked medications with their label wording (dabigatran by CrCl), each sourced line ending with its tag and the note ending with the app data version. It resolves the step 2 ASA-picker deferral (class and E flag only; no surgical-risk grade, no source registered). The ASA, E and fasting picks are in memory only and cleared by New case; the note is never stored and reaches the clipboard only on a Copy tap. `copyText` moved to `src/lib/copyText.ts`. The README privacy section now states that the note carries biometrics while the handoff does not. **Deferred:** comorbidity plans in the note (step 7), and Apfel and 4AT (Post-op tools).
7. **Conditions** (plan: `docs/superpowers/plans/2026-11-17-conditions.md`): a **Diseases** bottom tab (label "Diseases": "Conditions" does not fit a tab at 320 px; tabs now share the bar width with `min-w-0` and SOS is 64 px). An offline, accent- and punctuation-insensitive search over 110 uncommon conditions with their own section in Stoelting's *Anesthesia and Co-Existing Disease*, 8th edition (2022), read in full from the project notebook (new source `stoelting-8e`). The first plans, rare diseases first, are malignant hyperthermia susceptibility (linking to SOS › MH, no dantrolene doses retyped), acute porphyrias, myasthenia gravis, myotonic dystrophy, pheochromocytoma and carcinoid syndrome, as Pre-op / Intra-op / Avoid / Post-op lines. Every other entry shows its chapter, "Plan not written yet" and an "Open my NotebookLM notebook" link (no live notebook search: the app stays offline). Deviation from §3: the record is `{ id, name, aliases, chapter, plan?, crisis?, sourceIds }`; `medRuleIds`, `variants` and the Library browsing row are deferred. Later batches add plans to the listed entries and common comorbidities.
