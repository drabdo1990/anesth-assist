# Plan Cards (First Batch) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a **Plans** tab with four rapid case-type cards: Pediatric, Obstetric cesarean under neuraxial, Obesity, and RSI / full stomach. Each card lays out Pre-op, Induction and airway, Maintenance, Emergence and Red flags, and links to the existing Airway, Dosing, Vent, Lists and Drug reference screens.

**Architecture:** A card is a curated view over content the app already holds. Each phase lists the ids of existing checklist items (`fasting-peds-clear`, `awp-capno`, ...), so every line keeps the source it already has and no new clinical sentence is written. Ids that do not exist, or sources that do not resolve, fail a test. A phase with no existing sourced item shows `NO_SOURCE_VALUE`. The tab is a fourth entry in the bottom bar. Ticks reuse the existing `checks` store, so a tick on a card is the same tick as on the matching list.

**Tech Stack:** React 19, Zustand 5, Tailwind 3, Vitest 4. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-11-17-perioperative-guide-design.md` (§5 Rapid plan cards, rollout step 4; Task 3 records the trim).

## Scope decisions (read first)

**This plan writes no new clinical statements.** The spec's cards were to hold new `ChecklistItemRecord`s. The guideline texts needed to write sourced obstetric, frailty or RSI-technique content could not be read (see the step 3 plan), so this batch only groups what the app already has.

**In (4 cards):**
- **Pediatric** (`peds`): fasting for children, infants and neonates; the existing airway-plan and sizing; the Pediatric ventilation scenario (PALICC-2); a link to the printed pediatric lines in the Drug reference. It **does not link to Dosing**: calculated dosing stays withheld under 18.
- **Obstetric: cesarean under neuraxial** (`ob-cs-neuraxial`): the ASA 2016 elective-obstetric fasting line, the existing spinal/epidural preparation and local anesthetic dose-check lists, the Obstetric ventilation scenario (for conversion to general anesthesia).
- **Obesity** (`obesity`): bariatric fasting, the airway-plan items, the Obesity ventilation scenario (PROBESE).
- **RSI / full stomach** (`rsi`): emergency fasting, aspiration-risk and gastric-ultrasound lines, pre-induction and airway-plan items, links to Dosing (the paralysis drugs already cite `cochrane-rsi`) and to the Drug reference (aspiration prophylaxis drugs).

**Out, and why:**
- **Obstetric: general anesthesia and failed intubation** and **Elderly / frail.** The app holds no sourced content for either (OAA/DAS guidance and a frailty guideline are not registered or readable). A card of five `NO_SOURCE_VALUE` boxes helps nobody. They return when the sources are readable.
- **No BMI cut-off.** The spec says "BMI >= 40". No registered source in the app states that threshold, so the Obesity card names no number.
- **Dosing deep-link to a filtered situation.** `DosingView` keeps its filter in local state. Lifting it into the store is its own change; the link opens Dosing unfiltered.
- **Later batches** (day-case, trauma, neuro, thoracic, cardiac, ENT shared airway).

**Honest limits the screen states:** every card says it groups existing items and adds no new clinical statements. Many underlying items are generic prompts (source tag "App prompt"), exactly as they appear in the Lists.

**Order:** run `2026-11-17-theme.md` first. This plan uses only classes the theme already maps, and uses `text-black` (not `text-slate-950`) on solid buttons.

## Global Constraints

- Offline-first PWA. No clinical network calls. No new dependencies.
- Every item shown resolves to an existing checklist item and its `sourceIds` resolve in `src/data/sources.ts`.
- Pediatric: no calculated dosing is reachable from the Pediatric card.
- Patient data stays in memory only. Card ticks use the existing persisted `checks` (anonymous, as for every checklist). **New case** clears them.
- Touch targets at least 48 px. Tailwind 3. Literal class strings only.
- Bump `DATA_VERSION` in `src/data/sources.ts` to `'2026.11.17-draft19'` in Task 1.
- Do not bump the Zustand persist `version`.
- Run only the affected test file first, then `npm run verify` before finishing.
- **Tasks must run in order (1, 2, 3).**
- Work in your own worktree on your own branch. Skip any `git switch`/`git checkout` step, and never touch the main checkout.

## Review Focus

- **Pediatric card never links to Dosing.** Task 1 pins it.
- **Every item id resolves, and item ids are unique across all checklists**, so a card can never show the wrong line. Task 1 pins both.
- **Every card has all five phases.** Empty ones show `NO_SOURCE_VALUE`, never a missing section. Task 1 pins the keys; Task 2 checks the screen.
- **Cards carry no free text of their own.** The type has no item-text field, and Task 1 pins the card's keys.
- **The obstetric neuraxial card includes the coagulation check** (`nxp-coag`). Task 1 pins it.
- **A card tick is the same tick as the list's, and New case clears it.** Task 2 checks it by hand.
- **The Plans tab needs no biometric header and owns no checklist.** Task 2 pins `needsBiometrics` and `listsFor`.

---

### Task 1: Card data and integrity tests

**Files:**
- Create: `src/data/planCards.ts`, `src/data/__tests__/planCards.test.ts`
- Modify: `src/data/sources.ts` (`DATA_VERSION` only)

**Interfaces:**
- Produces:
  - `PLAN_PHASES` (tuple `'preop' | 'induction' | 'maintenance' | 'emergence' | 'redFlags'`), `type PlanPhase`, `PLAN_PHASE_LABEL: Record<PlanPhase, string>`
  - `interface PlanCardLinks { ventScenarioId?: string; airway?: boolean; dosing?: boolean; lists?: boolean; references?: boolean }`
  - `interface PlanCard { id: string; title: string; population: string; why: string; phases: Record<PlanPhase, string[]>; links: PlanCardLinks }`
  - `PLAN_CARDS: PlanCard[]`
  - `planItems(card, phase): ChecklistItemRecord[]` (throws on an unknown id), `cardSourceIds(card): string[]`

- [ ] **Step 1: Write the failing test**

Create `src/data/__tests__/planCards.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { CHECKLISTS } from '../checklists';
import { PLAN_CARDS, PLAN_PHASES, cardSourceIds, planItems } from '../planCards';
import { SOURCE_BY_ID } from '../sources';
import { VENTILATION_SCENARIOS } from '../ventilation';

const card = (id: string) => {
  const c = PLAN_CARDS.find((x) => x.id === id);
  if (!c) throw new Error(`missing card ${id}`);
  return c;
};
const idsOf = (c: ReturnType<typeof card>) => PLAN_PHASES.flatMap((p) => c.phases[p]);

describe('plan cards', () => {
  it('are the four first-batch cards with unique ids and titles', () => {
    expect(PLAN_CARDS.map((c) => c.id)).toEqual(['peds', 'ob-cs-neuraxial', 'obesity', 'rsi']);
    expect(new Set(PLAN_CARDS.map((c) => c.title)).size).toBe(PLAN_CARDS.length);
  });

  it('have exactly the five phases, so no section is ever missing from the screen', () => {
    for (const c of PLAN_CARDS) expect(Object.keys(c.phases).sort(), c.id).toEqual([...PLAN_PHASES].sort());
  });

  it('carry no clinical text of their own: only ids, links and a short scope note', () => {
    for (const c of PLAN_CARDS) expect(Object.keys(c).sort(), c.id).toEqual(['id', 'links', 'phases', 'population', 'title', 'why']);
  });

  it('use checklist item ids that exist, and item ids are unique across every checklist', () => {
    const all = CHECKLISTS.flatMap((l) => l.items.map((i) => i.id));
    expect(new Set(all).size).toBe(all.length);
    for (const c of PLAN_CARDS) {
      for (const p of PLAN_PHASES) {
        expect(new Set(c.phases[p]).size, `${c.id}/${p} repeats an item`).toBe(c.phases[p].length);
        expect(() => planItems(c, p), `${c.id}/${p}`).not.toThrow();
      }
    }
  });

  it('cite only sources that exist, and every card shows at least one source', () => {
    for (const c of PLAN_CARDS) {
      const ids = cardSourceIds(c);
      expect(ids.length, c.id).toBeGreaterThan(0);
      for (const s of ids) expect(SOURCE_BY_ID[s], `${c.id} -> ${s}`).toBeDefined();
    }
  });

  it('link only to ventilation scenarios that exist', () => {
    for (const c of PLAN_CARDS) {
      if (c.links.ventScenarioId) expect(VENTILATION_SCENARIOS.map((s) => s.id), c.id).toContain(c.links.ventScenarioId);
    }
  });

  it('pediatric: has the child, infant and neonate fasting lines and never links to Dosing', () => {
    const ids = idsOf(card('peds'));
    for (const id of ['fasting-peds-clear', 'fasting-breast-milk', 'fasting-formula']) expect(ids).toContain(id);
    expect(card('peds').links.dosing).toBeUndefined();
    expect(card('peds').links.ventScenarioId).toBe('pediatric');
  });

  it('obstetric neuraxial: includes the elective-obstetric fasting line and the coagulation check', () => {
    const ids = idsOf(card('ob-cs-neuraxial'));
    expect(ids).toContain('fasting-elective-obstetric');
    expect(ids).toContain('nxp-coag');
  });

  it('obesity and RSI keep their own fasting lines', () => {
    expect(idsOf(card('obesity'))).toContain('fasting-bariatric');
    expect(idsOf(card('rsi'))).toContain('fasting-emergency');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx.cmd vitest run src/data/__tests__/planCards.test.ts` (PowerShell).
Expected: FAIL, cannot resolve `../planCards`.

- [ ] **Step 3: Write the data**

Create `src/data/planCards.ts`:

```ts
// Rapid plan cards. A card groups items the app already holds: every phase lists existing checklist item ids,
// so each line keeps its own source and no new clinical statement is written here.

import { CHECKLISTS } from './checklists';
import type { ChecklistItemRecord } from './types';

export const PLAN_PHASES = ['preop', 'induction', 'maintenance', 'emergence', 'redFlags'] as const;
export type PlanPhase = (typeof PLAN_PHASES)[number];

export const PLAN_PHASE_LABEL: Record<PlanPhase, string> = {
  preop: 'Pre-op',
  induction: 'Induction and airway',
  maintenance: 'Maintenance',
  emergence: 'Emergence',
  redFlags: 'Red flags',
};

export interface PlanCardLinks {
  /** Opens Intra-op > Vent on this scenario. */
  ventScenarioId?: string;
  /** Opens Intra-op > Airway. */
  airway?: boolean;
  /** Opens Intra-op > Dosing, unfiltered. Never set on the pediatric card: calculated dosing is withheld under 18. */
  dosing?: boolean;
  /** Opens Intra-op > Lists (checklists and the crisis lists). */
  lists?: boolean;
  /** Opens the Drug reference sheet (reference only, never calculated). */
  references?: boolean;
}

export interface PlanCard {
  id: string;
  title: string;
  population: string;
  /** What the card is, in one sentence. Not a clinical claim. */
  why: string;
  /** Existing checklist item ids. An empty phase shows NO_SOURCE_VALUE. */
  phases: Record<PlanPhase, string[]>;
  links: PlanCardLinks;
}

const WHY = 'Groups items already in this app, with the sources they already have. It adds no new clinical statements.';

export const PLAN_CARDS: PlanCard[] = [
  {
    id: 'peds',
    title: 'Pediatric',
    population: 'Children and infants. The app treats under 18 as pediatric.',
    why: WHY,
    phases: {
      preop: ['fasting-peds-clear', 'fasting-breast-milk', 'fasting-formula', 'fasting-risk-conditions'],
      induction: ['pre-airway-assess', 'pre-suction', 'pre-dif-airway', 'awp-sizes', 'awp-preox', 'awp-capno', 'awp-attempts', 'awp-escalate'],
      maintenance: ['intra-temp', 'intra-fluids', 'intra-vent'],
      emergence: ['em-reversal', 'em-ventilation', 'em-oxygenation', 'em-reflexes', 'em-suction', 'em-risk'],
      redFlags: [],
    },
    links: { ventScenarioId: 'pediatric', airway: true, references: true, lists: true },
  },
  {
    id: 'ob-cs-neuraxial',
    title: 'Obstetric: cesarean under neuraxial',
    population: 'Cesarean delivery planned under spinal or epidural anesthesia.',
    why: WHY,
    phases: {
      preop: ['fasting-elective-obstetric', 'fasting-risk-conditions'],
      induction: ['nxp-consent', 'nxp-coag', 'nxp-ready', 'nxp-regimen', 'nxp-asepsis', 'lad-max', 'lad-lipid'],
      maintenance: ['intra-temp', 'intra-fluids', 'intra-blood', 'intra-infusions'],
      emergence: [],
      redFlags: [],
    },
    links: { dosing: true, ventScenarioId: 'obstetric', lists: true },
  },
  {
    id: 'obesity',
    title: 'Obesity',
    population: 'Obesity or previous bariatric surgery.',
    why: WHY,
    phases: {
      preop: ['fasting-bariatric', 'fasting-risk-conditions'],
      induction: ['pre-airway-assess', 'pre-suction', 'pre-dif-airway', 'awp-sizes', 'awp-preox', 'awp-capno', 'awp-attempts', 'awp-escalate'],
      maintenance: ['intra-vent', 'intra-position', 'intra-nmb'],
      emergence: ['em-reversal', 'em-ventilation', 'em-oxygenation', 'em-reflexes', 'em-risk'],
      redFlags: [],
    },
    links: { ventScenarioId: 'obesity', airway: true, dosing: true },
  },
  {
    id: 'rsi',
    title: 'RSI / full stomach',
    population: 'Emergency or urgent anesthesia, or a patient at risk of aspiration.',
    why: WHY,
    phases: {
      preop: ['fasting-emergency', 'fasting-risk-conditions', 'fasting-pocus'],
      induction: ['pre-fasting', 'pre-airway-assess', 'pre-suction', 'pre-dif-airway', 'awp-preox', 'awp-capno', 'awp-attempts', 'awp-escalate'],
      maintenance: [],
      emergence: ['em-reflexes', 'em-ventilation', 'em-risk'],
      redFlags: [],
    },
    links: { airway: true, dosing: true, references: true, lists: true },
  },
];

const ITEM_BY_ID = new Map<string, ChecklistItemRecord>(CHECKLISTS.flatMap((l) => l.items).map((i) => [i.id, i]));

export const planItems = (card: PlanCard, phase: PlanPhase): ChecklistItemRecord[] =>
  card.phases[phase].map((id) => {
    const item = ITEM_BY_ID.get(id);
    if (!item) throw new Error(`Plan card ${card.id} lists unknown checklist item "${id}"`);
    return item;
  });

export const cardSourceIds = (card: PlanCard): string[] => [
  ...new Set(PLAN_PHASES.flatMap((p) => planItems(card, p).flatMap((i) => i.sourceIds))),
];
```

- [ ] **Step 4: Bump the data version**

In `src/data/sources.ts`, change `export const DATA_VERSION = '2026.11.17-draft18';` to `export const DATA_VERSION = '2026.11.17-draft19';`.

- [ ] **Step 5: Run the tests**

Run: `npx.cmd vitest run src/data/__tests__/planCards.test.ts src/data/__tests__/integrity.test.ts`
Expected: PASS (9 tests in the new file). If an item id is reported unknown, **stop and report it**. Do not add a checklist item or invent a replacement.

Run: `npm run verify`
Expected: all tests pass, type-check clean, build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/data/planCards.ts src/data/__tests__/planCards.test.ts src/data/sources.ts
git commit -m "feat(plans): add the first four rapid plan cards over existing sourced items"
```

---

### Task 2: Plans tab and screen

**Files:**
- Modify: `src/lib/phases.ts`, `src/lib/__tests__/phases.test.ts`, `src/components/Navigation.tsx`, `src/App.tsx`
- Create: `src/views/PlansView.tsx`

**Interfaces:**
- Consumes: `PLAN_CARDS`, `PLAN_PHASES`, `PLAN_PHASE_LABEL`, `planItems`, `cardSourceIds` (Task 1); `VENTILATION_SCENARIOS` from `src/data/ventilation.ts`; store actions `toggleCheck`, `setActiveTab`, `setIntraopView`, `setVent`, `setReferencesOpen`; `Panel`, `ChecklistItem`, `NoSourceValue`.
- Produces: `AppTab` gains `'plans'`; `PlansView`.

- [ ] **Step 1: Write the failing tests**

In `src/lib/__tests__/phases.test.ts`:

1. In the first `describe('listsFor', ...)` block, add this test:

```ts
  it('gives the Plans tab no checklists of its own', () => {
    expect(listsFor('plans')).toEqual([]);
  });
```

2. In the `it.each([...])` table of `needsBiometrics`, add the row `['plans', 'dosing', false],`.

- [ ] **Step 2: Run them to verify they fail**

Run: `npx.cmd vitest run src/lib/__tests__/phases.test.ts`
Expected: FAIL (type error or wrong result: `'plans'` is not an `AppTab` yet).

- [ ] **Step 3: Add the tab type**

In `src/lib/phases.ts`, change `export type AppTab = 'preop' | 'intraop' | 'postop';` to `export type AppTab = 'preop' | 'plans' | 'intraop' | 'postop';`. Change nothing else in the file: `needsBiometrics` already returns `false` for `plans`, and `listsFor('plans')` already returns `[]`.

- [ ] **Step 4: Write the screen**

Create `src/views/PlansView.tsx`:

```tsx
import React, { useState } from 'react';
import { PLAN_CARDS, PLAN_PHASES, PLAN_PHASE_LABEL, cardSourceIds, planItems } from '../data/planCards';
import { VENTILATION_SCENARIOS } from '../data/ventilation';
import type { IntraopView } from '../lib/phases';
import { useAppStore } from '../store/useAppStore';
import { Panel } from '../components/hud/Panel';
import { ChecklistItem } from '../components/ui/ChecklistItem';
import { NoSourceValue } from '../components/ui/NoSourceValue';

const linkBtn =
  'min-h-[48px] rounded-xl border border-clinical-border-light bg-clinical-card px-3 text-sm font-bold text-slate-200 touch-manipulation';

/** Rapid case-type cards: a curated view over checklist items the app already has. */
export const PlansView: React.FC = () => {
  const [cardId, setCardId] = useState(PLAN_CARDS[0].id);
  const checks = useAppStore((s) => s.checks);
  const toggle = useAppStore((s) => s.toggleCheck);
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const setIntraopView = useAppStore((s) => s.setIntraopView);
  const setVent = useAppStore((s) => s.setVent);
  const setReferencesOpen = useAppStore((s) => s.setReferencesOpen);

  const card = PLAN_CARDS.find((c) => c.id === cardId) ?? PLAN_CARDS[0];
  const go = (view: IntraopView) => {
    setActiveTab('intraop');
    setIntraopView(view);
  };

  const actions: { key: string; label: string; run: () => void }[] = [];
  if (card.links.airway) actions.push({ key: 'airway', label: 'Airway devices and sizing', run: () => go('airway') });
  if (card.links.dosing) actions.push({ key: 'dosing', label: 'Dosing', run: () => go('dosing') });
  if (card.links.ventScenarioId) {
    const scenarioId = card.links.ventScenarioId;
    const name = VENTILATION_SCENARIOS.find((s) => s.id === scenarioId)?.name ?? scenarioId;
    actions.push({
      key: 'vent',
      label: `Ventilation: ${name}`,
      run: () => {
        setVent({ scenarioId });
        go('vent');
      },
    });
  }
  if (card.links.lists) actions.push({ key: 'lists', label: 'Checklists and crisis lists', run: () => go('lists') });
  if (card.links.references) actions.push({ key: 'references', label: 'Drug reference', run: () => setReferencesOpen(true) });

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-slate-400">
        Rapid case-type cards. Each one groups items already in this app, with the same sources. Ticks are shared with the Lists.
      </p>

      <div className="grid grid-cols-2 gap-1.5" role="group" aria-label="Plan cards">
        {PLAN_CARDS.map((c) => (
          <button
            key={c.id}
            type="button"
            aria-pressed={c.id === card.id}
            onClick={() => setCardId(c.id)}
            className={`min-h-[56px] rounded-xl border px-3 text-sm font-bold touch-manipulation ${
              c.id === card.id ? 'border-cyan-400 bg-cyan-500 text-black' : 'border-slate-700 bg-slate-900 text-slate-300'
            }`}
          >
            {c.title}
          </button>
        ))}
      </div>

      <Panel title={card.title} sourceIds={cardSourceIds(card)}>
        <p className="text-sm text-slate-200">{card.population}</p>
        <p className="text-xs text-slate-400">{card.why}</p>
        <div className="flex flex-wrap gap-1.5">
          {actions.map((a) => (
            <button key={a.key} type="button" onClick={a.run} className={linkBtn}>
              {a.label}
            </button>
          ))}
        </div>
      </Panel>

      {PLAN_PHASES.map((phase) => {
        const items = planItems(card, phase);
        const sourceIds = [...new Set(items.flatMap((i) => i.sourceIds))];
        return (
          <Panel key={phase} title={PLAN_PHASE_LABEL[phase]} sourceIds={items.length > 0 ? sourceIds : undefined}>
            {items.length === 0 ? (
              <NoSourceValue topic={PLAN_PHASE_LABEL[phase]} compact />
            ) : (
              <div className="flex flex-col gap-1.5">
                {items.map((i) => (
                  <ChecklistItem key={i.id} checked={!!checks[i.id]} onToggle={() => toggle(i.id)} label={i.text} />
                ))}
              </div>
            )}
          </Panel>
        );
      })}
    </div>
  );
};
```

- [ ] **Step 5: Add the tab to the bar and the app**

In `src/components/Navigation.tsx`:
1. Change the lucide import to `import { BedDouble, ClipboardList, LayoutGrid, ShieldAlert, Syringe } from 'lucide-react';`
2. In `TABS`, add `{ id: 'plans', label: 'Plans', icon: LayoutGrid },` between the `preop` and `intraop` entries.

In `src/App.tsx`:
1. Add `import { PlansView } from './views/PlansView';` after the `import { MedsPanel } ...` line.
2. Directly after the line `{activeTab === 'intraop' && intraopView === 'vent' && <VentilationView />}` add `{activeTab === 'plans' && <PlansView />}`.

- [ ] **Step 6: Run the tests**

Run: `npx.cmd vitest run src/lib/__tests__/phases.test.ts`
Expected: PASS.

Run: `npm run verify`
Expected: all tests pass, type-check clean, build succeeds.

- [ ] **Step 7: Check by hand**

Run `npm run dev`, open the URL it prints (use a free port if the default is taken; stop the server when done).
- The bottom bar shows **Pre-op · Plans · Intra-op · Post-op** and the red SOS button, all reachable at a 360 px wide viewport with no overlap, each at least 48 px.
- **Plans** shows four card buttons. Pediatric is selected first. Nothing above or below shows a biometric header.
- Each card shows five panels: Pre-op, Induction and airway, Maintenance, Emergence, Red flags. **Red flags always shows the dashed "No source value" box** in this batch. Pediatric's Pre-op shows the child, infant and neonate fasting lines. Obstetric's Emergence is also "No source value". RSI's Maintenance is too.
- Each panel's source badge opens the existing source detail, as on the Lists.
- Tick a line on a card, then open Intra-op > Lists (or Pre-op for a fasting line): **the same line is ticked there**. **New case** unticks it.
- Pediatric shows **no Dosing button**. It shows Airway devices and sizing, Ventilation: Pediatric, Checklists and crisis lists, and Drug reference.
- Tap **Ventilation: Obstetric** on the Obstetric card: the app goes to Intra-op > Vent with the Obstetric scenario selected.
- Tap **Drug reference**: the References sheet opens.
- Report what you saw per bullet. Do not fix visual issues silently; list them.

- [ ] **Step 8: Commit**

```bash
git add src/lib/phases.ts src/lib/__tests__/phases.test.ts src/components/Navigation.tsx src/App.tsx src/views/PlansView.tsx
git commit -m "feat(plans): add the Plans tab with the four first-batch cards"
```

---

### Task 3: Docs

**Files:**
- Modify: `README.md`, `docs/superpowers/specs/2026-11-17-perioperative-guide-design.md`

- [ ] **Step 1: README**

In `README.md`, replace `The bottom bar has three case phases.` with `The bottom bar has three case phases plus a **Plans** tab of rapid case-type cards (pediatric, obstetric cesarean under neuraxial, obesity, RSI / full stomach) that group items already in the app and add no new clinical statements.`

If the anchor is not found exactly once, stop and report.

- [ ] **Step 2: Spec**

In the spec's §10 rollout list, replace the line `4. **Plan cards**, first batch.` with:

```
4. **Plan cards**, first batch (plan: `docs/superpowers/plans/2026-11-17-plan-cards.md`): a Plans tab with four cards (Pediatric, Obstetric cesarean under neuraxial, Obesity, RSI / full stomach). Deviation from §5: a phase lists the ids of existing checklist items instead of new `ChecklistItemRecord`s, so no new clinical statement is written and every line keeps its own source; `links` is reduced to `ventScenarioId`, `airway`, `dosing`, `lists`, `references`. The Pediatric card never links to Dosing. Obesity names no BMI cut-off (no registered source states one). **Deferred:** Obstetric general anesthesia / failed intubation and Elderly / frail (no sourced content readable yet), a filtered Dosing deep-link (the filter is local state), and the later batches.
```

- [ ] **Step 3: Verify and commit**

Run: `npm run verify`
Expected: PASS.

```bash
git add README.md docs/superpowers/specs/2026-11-17-perioperative-guide-design.md
git commit -m "docs: record the Plans tab in the README and spec step 4"
```
