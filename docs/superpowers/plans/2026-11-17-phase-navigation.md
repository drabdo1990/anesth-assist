# Phase Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the four tool tabs (Dosing, Airway, Vent, Lists) with three case-phase tabs (Pre-op, Intra-op, Post-op), move the existing tools under Intra-op, and apply the modern-web-guidance UI fixes. No new clinical content.

**Architecture:** A pure `lib/phases.ts` decides which checklists belong to which phase and when the biometric header shows. The store gains `intraopView` (in memory only). `ChecklistsView` takes the lists it should show as a prop, so one component serves all three phases. CSS fixes follow the retrieved modern-web-guidance guides.

**Tech Stack:** React 19, Zustand 5, Tailwind 3, Vitest 4, lucide-react 0.475. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-11-17-perioperative-guide-design.md` (rollout step 1, trimmed; see Task 4 for the spec edits and the reasons).

## Global Constraints

- Offline-first PWA. No clinical network calls. No new dependencies.
- Patient inputs stay in memory only. `activeTab` and `intraopView` are not persisted (`partialize` in `useAppStore.ts` is unchanged).
- Touch targets stay at least 48 px (`min-h-[48px]`), as in the existing components.
- Page navigation stays buttons with `aria-current` (modern-web-guidance `tabs`: "DO NOT use this or the WAI-ARIA tabs pattern for page navigation").
- No new clinical values in this plan, so `sources.ts` and `DATA_VERSION` are untouched.
- Run only the affected test file first, then the full suite before finishing.

## Review Focus

- **A checklist id is renamed** (`fasting-npo`, `emergence`): a phase would silently lose its list. Task 1's tests pin both ids and prove every list lands in exactly one phase.
- **The handoff form must survive a tab switch.** Its state is local to `ChecklistsView`, so each phase's `ChecklistsView` stays mounted and is only hidden. Checked by hand in Task 2.
- **Weight entered on Dosing must still be there after visiting Lists or another phase.** It lives in the store, so it should be. Checked by hand in Task 2.
- **Only one chip group** (Pre-op has only Fasting): the chip row would show one pointless chip. Task 2 hides it when there is one tab.
- **Focus behind the fixed bottom bar:** a focused field must scroll clear of the disclaimer and nav. Task 3 sets `scroll-padding-bottom`.

---

### Task 1: Phase model (pure logic)

**Files:**
- Create: `src/lib/phases.ts`
- Test: `src/lib/__tests__/phases.test.ts`

**Interfaces:**
- Consumes: `CHECKLISTS` from `src/data/checklists.ts`, `ChecklistRecord` from `src/data/types.ts`.
- Produces:
  - `type AppTab = 'preop' | 'intraop' | 'postop'`
  - `type IntraopView = 'dosing' | 'airway' | 'vent' | 'lists'`
  - `listsFor(tab: AppTab): ChecklistRecord[]`
  - `needsBiometrics(tab: AppTab, view: IntraopView): boolean`

- [ ] **Step 0: Branch**

```bash
git switch -c feat/phase-navigation
```

- [ ] **Step 1: Write the failing test**

Create `src/lib/__tests__/phases.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { CHECKLISTS } from '../../data/checklists';
import { listsFor, needsBiometrics } from '../phases';

describe('listsFor', () => {
  it('gives pre-op the fasting list and post-op the emergence list', () => {
    expect(listsFor('preop').map((c) => c.id)).toEqual(['fasting-npo']);
    expect(listsFor('postop').map((c) => c.id)).toEqual(['emergence']);
  });

  it('puts every other checklist in intra-op, so no list is orphaned or shown twice', () => {
    const all = (['preop', 'intraop', 'postop'] as const).flatMap((t) => listsFor(t).map((c) => c.id));
    expect(all.sort()).toEqual(CHECKLISTS.map((c) => c.id).sort());
  });

  it('keeps pre-induction and the crisis lists reachable under intra-op', () => {
    const intraop = listsFor('intraop');
    expect(intraop.some((c) => c.id === 'pre-induction')).toBe(true);
    expect(intraop.some((c) => c.group === 'Crises')).toBe(true);
  });
});

describe('needsBiometrics', () => {
  it.each([
    ['intraop', 'dosing', true],
    ['intraop', 'airway', true],
    ['intraop', 'vent', true],
    ['intraop', 'lists', false],
    ['preop', 'dosing', false],
    ['postop', 'vent', false],
  ] as const)('%s / %s -> %s', (tab, view, want) => {
    expect(needsBiometrics(tab, view)).toBe(want);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/lib/__tests__/phases.test.ts`
Expected: FAIL, cannot resolve `../phases`.

- [ ] **Step 3: Write the minimal implementation**

Create `src/lib/phases.ts`:

```ts
import { CHECKLISTS } from '../data/checklists';
import type { ChecklistRecord } from '../data/types';

export type AppTab = 'preop' | 'intraop' | 'postop';
export type IntraopView = 'dosing' | 'airway' | 'vent' | 'lists';

const PREOP_IDS = ['fasting-npo'];
const POSTOP_IDS = ['emergence'];

const phaseOf = (c: ChecklistRecord): AppTab =>
  PREOP_IDS.includes(c.id) ? 'preop' : POSTOP_IDS.includes(c.id) ? 'postop' : 'intraop';

/** Intra-op takes every list not claimed by pre-op or post-op, so a new list is never left out. */
export const listsFor = (tab: AppTab): ChecklistRecord[] => CHECKLISTS.filter((c) => phaseOf(c) === tab);

/** Dose and airway math need the biometric header; checklists and the handoff do not. */
export const needsBiometrics = (tab: AppTab, view: IntraopView): boolean => tab === 'intraop' && view !== 'lists';
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/lib/__tests__/phases.test.ts`
Expected: PASS, 9 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/phases.ts src/lib/__tests__/phases.test.ts
git commit -m "feat(nav): add phase model for pre-op, intra-op and post-op"
```

---

### Task 2: Wire the phase tabs (store, nav, app, checklists)

One commit, because changing the tab type breaks the type-check in every file that uses it until all four are updated.

**Files:**
- Modify: `src/store/useAppStore.ts` (lines 11, 72, 100, 181, 225)
- Modify: `src/components/Navigation.tsx`
- Modify: `src/App.tsx` (imports, selectors, lines 82-95)
- Modify: `src/views/ChecklistsView.tsx` (lines 4, 65-70, 202-221, and the `lists` line below)

**Interfaces:**
- Consumes: `AppTab`, `IntraopView`, `listsFor`, `needsBiometrics` from `src/lib/phases.ts` (Task 1).
- Produces: store fields `intraopView: IntraopView` and `setIntraopView(view)`. `ChecklistsView` props `{ phaseLists: ChecklistRecord[]; extras?: ('handoff' | 'overview')[] }`.

- [ ] **Step 1: Store**

In `src/store/useAppStore.ts`, replace

```ts
export type AppTab = 'dosing' | 'airway' | 'ventilation' | 'checklists';
```

with

```ts
export type { AppTab, IntraopView };
```

and add this line with the other imports at the top of the file:

```ts
import type { AppTab, IntraopView } from '../lib/phases';
```

Replace `  activeTab: AppTab;` with

```ts
  activeTab: AppTab;
  intraopView: IntraopView;
```

Replace `  setActiveTab: (tab: AppTab) => void;` with

```ts
  setActiveTab: (tab: AppTab) => void;
  setIntraopView: (view: IntraopView) => void;
```

Replace `      activeTab: 'dosing',` with

```ts
      activeTab: 'intraop',
      intraopView: 'dosing',
```

Replace `      setActiveTab: (activeTab) => set({ activeTab }),` with

```ts
      setActiveTab: (activeTab) => set({ activeTab }),
      setIntraopView: (intraopView) => set({ intraopView }),
```

- [ ] **Step 2: Navigation**

In `src/components/Navigation.tsx`, replace the icon import and `TABS`:

```tsx
import { BedDouble, ClipboardList, ShieldAlert, Syringe } from 'lucide-react';
```

```tsx
const TABS: { id: AppTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'preop', label: 'Pre-op', icon: ClipboardList },
  { id: 'intraop', label: 'Intra-op', icon: Syringe },
  { id: 'postop', label: 'Post-op', icon: BedDouble },
];
```

Also change the comment above `Navigation` from "four views" to "three case phases".

- [ ] **Step 3: ChecklistsView takes its lists as a prop**

In `src/views/ChecklistsView.tsx`:

Replace line 4 with

```ts
import type { ChecklistGroup, ChecklistRecord } from '../data/types';
```

Replace the `GROUP_TABS` block (lines 65-70) with

```ts
type Extra = 'handoff' | 'overview';
const EXTRA_LABEL: Record<Extra, string> = { handoff: 'Handoff summary', overview: 'Overview' };

interface ChecklistsViewProps {
  /** The lists this phase shows (see `listsFor` in lib/phases.ts). */
  phaseLists: ChecklistRecord[];
  extras?: Extra[];
}
```

Replace the first three lines of the component

```tsx
export const ChecklistsView: React.FC = () => {
  const [group, setGroup] = useState<GroupTab>(GROUP_TABS[0].id);
  const [sub, setSub] = useState<string>(CHECKLISTS[0].id);
```

with

```tsx
export const ChecklistsView: React.FC<ChecklistsViewProps> = ({ phaseLists, extras = [] }) => {
  // Groups with no lists in this phase are hidden.
  const tabs: { id: GroupTab; label: string }[] = [
    ...CHECKLIST_GROUPS.filter((g) => phaseLists.some((c) => c.group === g)).map((g) => ({ id: g as GroupTab, label: g })),
    ...extras.map((e) => ({ id: e as GroupTab, label: EXTRA_LABEL[e] })),
  ];
  const [group, setGroup] = useState<GroupTab>(tabs[0].id);
  const [sub, setSub] = useState<string>(phaseLists[0].id);
```

Replace `  const lists = CHECKLISTS.filter((c) => c.group === group);` with

```tsx
  const lists = phaseLists.filter((c) => c.group === group);
```

Replace the group chip row

```tsx
      <div className="flex gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label="Checklist groups">
        {GROUP_TABS.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={group === t.id} onClick={() => setGroup(t.id)} className={chipClass(group === t.id)}>
            {t.label}
          </button>
        ))}
      </div>
```

with

```tsx
      {tabs.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label="Checklist groups">
          {tabs.map((t) => (
            <button key={t.id} type="button" role="tab" aria-selected={group === t.id} onClick={() => setGroup(t.id)} className={chipClass(group === t.id)}>
              {t.label}
            </button>
          ))}
        </div>
      )}
```

- [ ] **Step 4: App**

In `src/App.tsx`:

Add to the imports:

```tsx
import { SegmentedControl } from './components/ui/SegmentedControl';
import { listsFor, needsBiometrics, type IntraopView } from './lib/phases';
```

Above `export const App`, add:

```tsx
const INTRAOP_VIEWS: { value: IntraopView; label: string }[] = [
  { value: 'dosing', label: 'Dosing' },
  { value: 'airway', label: 'Airway' },
  { value: 'vent', label: 'Vent' },
  { value: 'lists', label: 'Lists' },
];
```

Next to `const activeTab = useAppStore((s) => s.activeTab);` add:

```tsx
  const intraopView = useAppStore((s) => s.intraopView);
  const setIntraopView = useAppStore((s) => s.setIntraopView);
```

Replace lines 82-95 (from `{activeTab !== 'checklists' && <BiometricHeader />}` through the closing `</main>`) with:

```tsx
      {needsBiometrics(activeTab, intraopView) && <BiometricHeader />}

      <main className="mx-auto w-full max-w-4xl flex-1 p-3 sm:p-4">
        {activeTab === 'intraop' && (
          <div className="mb-3">
            <SegmentedControl<IntraopView> ariaLabel="Intra-op tools" value={intraopView} options={INTRAOP_VIEWS} onChange={setIntraopView} />
          </div>
        )}
        {activeTab === 'intraop' && intraopView === 'dosing' && <DosingView />}
        {activeTab === 'intraop' && intraopView === 'airway' && <AirwayView />}
        {activeTab === 'intraop' && intraopView === 'vent' && <VentilationView />}
        {/* Checklist views stay mounted and are only hidden, so the handoff form keeps what was typed. */}
        <div className={activeTab === 'preop' ? '' : 'hidden'} aria-hidden={activeTab !== 'preop'}>
          <ChecklistsView phaseLists={listsFor('preop')} />
        </div>
        <div className={activeTab === 'intraop' && intraopView === 'lists' ? '' : 'hidden'} aria-hidden={!(activeTab === 'intraop' && intraopView === 'lists')}>
          <ChecklistsView phaseLists={listsFor('intraop')} extras={['overview']} />
        </div>
        <div className={activeTab === 'postop' ? '' : 'hidden'} aria-hidden={activeTab !== 'postop'}>
          <ChecklistsView phaseLists={listsFor('postop')} extras={['handoff']} />
        </div>
      </main>
```

- [ ] **Step 5: Type-check and test**

Run: `npm run verify`
Expected: all tests pass, `tsc -b` has no errors, build succeeds. Existing `migrate.test.ts` still passes (the persisted shape is unchanged).

- [ ] **Step 6: Check by hand**

Run `npm run dev` and open http://localhost:5173.
- Intra-op opens on Dosing with the biometric header. Dosing, Airway, Vent and Lists each open.
- Lists shows Pre-induction, Machine, Airway, Ventilation, Regional, Intra/post-op, Crises and Overview.
- Pre-op shows only the Fasting / NPO list, with no chip row.
- Post-op shows Emergence and extubation, plus the Handoff summary chip.
- Type a weight on Dosing, switch to Post-op and back: the weight is still there.
- Tick a handoff option on Post-op, switch tabs and come back: it is still ticked.
- The SOS button opens the overlay on every tab.

- [ ] **Step 7: Commit**

```bash
git add src/store/useAppStore.ts src/components/Navigation.tsx src/views/ChecklistsView.tsx src/App.tsx
git commit -m "feat(nav): split the app into pre-op, intra-op and post-op phases"
```

---

### Task 3: UI fixes from modern-web-guidance

**Files:**
- Modify: `src/index.css` (the `:root` block and the scrollbar block at lines 5-7 and 35-49)
- Modify: `src/components/Navigation.tsx` (the fixed bar's class)

- [ ] **Step 1: Scrollbar, focus clearance and heading wrap**

In `src/index.css`, replace the `:root` block

```css
:root {
  color-scheme: dark;
}
```

with

```css
:root {
  color-scheme: dark;
  /* Thumb is about 4.1:1 against the track; WCAG 1.4.11 needs 3:1. The old #1e293b thumb was about 1.3:1. */
  --scrollbar-thumb: #64748b;
  --scrollbar-track: #090d16;
  scrollbar-color: var(--scrollbar-thumb) var(--scrollbar-track);
}

* {
  scrollbar-width: thin;
}

/* Keep a focused field clear of the fixed disclaimer + nav (WCAG 2.4.11). 128px matches the spacer in App.tsx. */
html {
  scroll-padding-bottom: calc(128px + env(safe-area-inset-bottom, 0px));
}

:where(h1, h2, h3) {
  text-wrap: balance;
}
```

Replace the old scrollbar block (from `/* Custom scrollbar for clinical dark theme */` to the end of the file) with

```css
/* Legacy fallback for browsers without scrollbar-color. */
@supports not (scrollbar-color: auto) {
  * {
    scrollbar-width: auto;
  }
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  ::-webkit-scrollbar-thumb {
    background: var(--scrollbar-thumb);
    border-radius: 4px;
  }
  ::-webkit-scrollbar-track {
    background: var(--scrollbar-track);
  }
}
```

- [ ] **Step 2: Keep the nav clear of side notches in landscape**

In `src/components/Navigation.tsx`, change the fixed bar's class from `... pb-[env(safe-area-inset-bottom)] backdrop-blur-md` to

```
... pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] backdrop-blur-md
```

- [ ] **Step 3: Run the guidance scan and the full verify**

Run: `npx -y modern-web-guidance@latest legacy-scan src --json`
Expected: `"totalFindings": 0`.

Run: `npm run verify`
Expected: PASS.

- [ ] **Step 4: Check by hand**

In `npm run dev`: the scrollbar thumb is visible on the dark track in Chrome and Firefox. Tap a field near the bottom of Dosing: the page scrolls it clear of the nav bar.

- [ ] **Step 5: Commit**

```bash
git add src/index.css src/components/Navigation.tsx
git commit -m "style(ui): standard scrollbar colors, focus clearance and safe-area padding"
```

---

### Task 4: Docs and spec trim

**Files:**
- Modify: `docs/superpowers/specs/2026-11-17-perioperative-guide-design.md`
- Modify: `README.md`

- [ ] **Step 1: Trim the spec to what this plan does and say why**

In the spec, make these replacements:

1. In §2, replace "to **`Pre-op · Intra-op · Post-op · Plans`**, with the red **SOS** button unchanged." with "to **`Pre-op · Intra-op · Post-op`** (a **Plans** tab joins in rollout step 4, once it has content), with the red **SOS** button unchanged."

2. In §2, replace "`ChecklistsView` gets a `groups` prop, and each phase renders only its own groups:" with "`ChecklistsView` gets a `phaseLists` prop (from `listsFor(tab)` in `lib/phases.ts`), and each phase renders only its own lists:".

3. In §2, replace the five bullets from "- `Pre-op` → Pre-op tab (Fasting step)" through "- Handoff → Post-op" with:

```
- Fasting / NPO → Pre-op tab
- Emergence and extubation → Post-op tab
- Everything else → Intra-op › Lists. Pre-induction is run in the OR, so it stays here rather than moving to the clinic-style Pre-op tab. The crisis lists stay here too.
- Handoff → Post-op
- Moving the crisis lists into SOS is its own task. SOS has three weight-based panels behind a three-way switch, and adding four more would need that switch redesigned.
```

4. In §2, replace the Units bullet with "- **Units** setting: added in rollout step 2, together with the first score that reads a creatinine, so it is never a setting nobody uses."

5. In §4, replace "moves out of `ChecklistsView.tsx` so the handoff and the pre-op note can share it." with "moves out of `ChecklistsView.tsx` in rollout step 6, when the pre-op note becomes its second user."

6. In §8, replace the **Migration** bullet with "- **No migration needed:** `activeTab` is not persisted (see `partialize` in `useAppStore.ts`), so renaming the tabs cannot break an installed app. The existing `migrate.test.ts` still guards the persisted shape."

7. In §10, replace step 1 with "1. **Navigation redesign** (plan: `docs/superpowers/plans/2026-11-17-phase-navigation.md`): the Pre-op, Intra-op and Post-op tabs, existing views moved, an intra-op sub-navigation. No new clinical content. Deferred from this step: Plans tab (step 4), units setting (step 2), `copyText` move (step 6), crisis lists into SOS (own task)."

- [ ] **Step 2: README**

In `README.md`, replace

```
## App structure

| Tab / control | What it does |
```

with

```
## App structure

The bottom bar has three case phases. **Pre-op** holds the Fasting / NPO checklist. **Intra-op** holds Dosing, Airway, Vent and Lists, with a switch at the top. **Post-op** holds the emergence checklist and the handoff summary. The rows below describe each tool.

| Tab / control | What it does |
```

- [ ] **Step 3: Verify and commit**

Run: `npm run verify`
Expected: PASS.

```bash
git add docs/superpowers/specs/2026-11-17-perioperative-guide-design.md README.md
git commit -m "docs: trim spec step 1 to the phase navigation and update the README"
```
