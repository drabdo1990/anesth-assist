# AnesthAssist Implementation Plan, Part 2 (store, UI, verification)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the persisted store, the four tab views and the shell on top of the tested pure logic from part 1, then verify offline and privacy behaviour.

**Architecture, Tech Stack, Global Constraints, Review Focus:** identical to part 1 (`docs/superpowers/plans/2026-10-09-anesthassist.md`). Read its header first. Part 1 (Tasks 1–6) must be complete: `src/lib/` exists with `biometrics`, `drugs`, `dosing`, `format`, `localAnesthetics`, `crisis`, `checklists` and `clipboard`.

**Spec:** `docs/superpowers/specs/2026-10-09-anesthassist-design.md`

Project root: `E:\CLAUDE-cowork\projects\anesthesia helper`. If a Lucide icon name below does not exist in the installed version (lucide-react 1.x), pick the closest existing icon; do not change the layout.

---

### Task 7: Store, hooks and app shell

**Files:**
- Create: `src/store.ts`, `src/hooks.ts`, `src/components/Stepper.tsx`, `src/components/ScalarBadge.tsx`, `src/components/BiometricBar.tsx`, `src/components/BottomNav.tsx`, `src/components/Disclaimer.tsx`
- Modify: `src/App.tsx`
- Test: `src/store.test.ts`

**Interfaces:**
- Consumes: `Sex`, `ScalarKey`, `Scalars`, `computeScalars`, `inputAdvisories` from `./lib/biometrics`.
- Produces:
  - `useStore` (Zustand) with state `{ weightKg: number | null; heightCm: number | null; sex: Sex; concOverrides: Record<string, number> }` and actions `setWeight(n: number | null)`, `setHeight(n: number | null)`, `setSex(s: Sex)`, `setConc(drugId: string, conc: number)`, `clearBiometrics()`
  - `sanitizePersisted(raw: unknown)` returning the four persisted fields (exported from `store.ts`)
  - `useScalars(): Scalars | null`
  - `type TabId = 'calc' | 'crisis' | 'local' | 'lists'` (exported from `BottomNav.tsx`)
  - Components: `<NumField label unit value onChange stepper? start? max? />`, `<ScalarBadge kind kg />` (`kind: ScalarKey | 'abw40'`), `<BiometricBar compact? />`, `<BottomNav tab onChange />`, `<Disclaimer />`

- [ ] **Step 1: Write the failing test** (`src/store.test.ts`)

```ts
import { describe, expect, it } from 'vitest'
import { sanitizePersisted } from './store'

describe('sanitizePersisted', () => {
  it('accepts a well-formed state', () => {
    expect(
      sanitizePersisted({ weightKg: 80, heightCm: 175, sex: 'female', concOverrides: { ketamine: 50 } }),
    ).toEqual({ weightKg: 80, heightCm: 175, sex: 'female', concOverrides: { ketamine: 50 } })
  })
  it('falls back to defaults on corrupt data', () => {
    const d = { weightKg: null, heightCm: null, sex: 'male', concOverrides: {} }
    expect(sanitizePersisted(null)).toEqual(d)
    expect(sanitizePersisted('garbage')).toEqual(d)
    expect(
      sanitizePersisted({ weightKg: 'x', heightCm: NaN, sex: 'alien', concOverrides: [1, 2] }),
    ).toEqual(d)
  })
  it('drops non-numeric or non-positive concentration overrides', () => {
    expect(sanitizePersisted({ concOverrides: { a: 5, b: 'x', c: -1 } }).concOverrides).toEqual({ a: 5 })
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/store.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `src/store.ts` and `src/hooks.ts`**

`src/store.ts`:

```ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Sex } from './lib/biometrics'

interface Persisted {
  weightKg: number | null
  heightCm: number | null
  sex: Sex
  concOverrides: Record<string, number>
}

interface State extends Persisted {
  setWeight: (n: number | null) => void
  setHeight: (n: number | null) => void
  setSex: (s: Sex) => void
  setConc: (drugId: string, conc: number) => void
  clearBiometrics: () => void
}

const num = (v: unknown): number | null =>
  typeof v === 'number' && Number.isFinite(v) ? v : null

export function sanitizePersisted(raw: unknown): Persisted {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const conc: Record<string, number> = {}
  if (r.concOverrides && typeof r.concOverrides === 'object' && !Array.isArray(r.concOverrides)) {
    for (const [k, v] of Object.entries(r.concOverrides as Record<string, unknown>)) {
      if (typeof v === 'number' && Number.isFinite(v) && v > 0) conc[k] = v
    }
  }
  return {
    weightKg: num(r.weightKg),
    heightCm: num(r.heightCm),
    sex: r.sex === 'female' ? 'female' : 'male',
    concOverrides: conc,
  }
}

const memoryStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
} as unknown as Storage

export const useStore = create<State>()(
  persist(
    (set) => ({
      weightKg: null,
      heightCm: null,
      sex: 'male',
      concOverrides: {},
      setWeight: (weightKg) => set({ weightKg }),
      setHeight: (heightCm) => set({ heightCm }),
      setSex: (sex) => set({ sex }),
      setConc: (drugId, conc) =>
        set((s) => ({ concOverrides: { ...s.concOverrides, [drugId]: conc } })),
      clearBiometrics: () => set({ weightKg: null, heightCm: null }),
    }),
    {
      name: 'anesthassist-v1',
      version: 1,
      storage: createJSONStorage(() => (typeof localStorage === 'undefined' ? memoryStorage : localStorage)),
      partialize: (s): Persisted => ({
        weightKg: s.weightKg,
        heightCm: s.heightCm,
        sex: s.sex,
        concOverrides: s.concOverrides,
      }),
      merge: (persisted, current) => ({ ...current, ...sanitizePersisted(persisted) }),
    },
  ),
)
```

`src/hooks.ts`:

```ts
import { useMemo } from 'react'
import { computeScalars, type Scalars } from './lib/biometrics'
import { useStore } from './store'

export function useScalars(): Scalars | null {
  const weightKg = useStore((s) => s.weightKg)
  const heightCm = useStore((s) => s.heightCm)
  const sex = useStore((s) => s.sex)
  return useMemo(() => computeScalars(weightKg, heightCm, sex), [weightKg, heightCm, sex])
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/store.test.ts`
Expected: PASS.

- [ ] **Step 5: Implement components**

`src/components/Stepper.tsx` (the numeric field keeps its own text so half-typed values like `"7."` survive):

```tsx
import { useEffect, useState } from 'react'
import { Minus, Plus } from 'lucide-react'

const parse = (t: string): number | null => {
  if (t.trim() === '') return null
  const n = Number(t)
  return Number.isFinite(n) ? n : null
}

interface Props {
  label: string
  unit: string
  value: number | null
  onChange: (n: number | null) => void
  stepper?: boolean
  start?: number
  max?: number
}

export function NumField({ label, unit, value, onChange, stepper, start = 70, max = 999 }: Props) {
  const [text, setText] = useState(value === null ? '' : String(value))

  useEffect(() => {
    if (parse(text) !== value) setText(value === null ? '' : String(value))
    // only resync when the store value changes from outside
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const bump = (d: number) => {
    const next = value === null ? start : Math.min(max, Math.max(1, Math.round((value + d) * 10) / 10))
    onChange(next)
  }

  return (
    <label className="flex min-w-0 flex-1 flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</span>
      <span className="flex items-stretch gap-1">
        {stepper && (
          <button type="button" aria-label={`Decrease ${label}`} onClick={() => bump(-1)}
            className="flex min-h-12 min-w-12 items-center justify-center rounded-lg border border-line bg-card active:bg-line">
            <Minus size={20} />
          </button>
        )}
        <span className="relative min-w-0 flex-1">
          <input
            inputMode="decimal"
            value={text}
            onChange={(e) => {
              setText(e.target.value)
              onChange(parse(e.target.value))
            }}
            className="min-h-12 w-full rounded-lg border border-line bg-card px-3 pr-10 font-mono text-xl font-bold tabular-nums text-accent outline-none focus:border-accent"
            aria-label={label}
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">{unit}</span>
        </span>
        {stepper && (
          <button type="button" aria-label={`Increase ${label}`} onClick={() => bump(1)}
            className="flex min-h-12 min-w-12 items-center justify-center rounded-lg border border-line bg-card active:bg-line">
            <Plus size={20} />
          </button>
        )}
      </span>
    </label>
  )
}
```

`src/components/ScalarBadge.tsx`:

```tsx
import type { ScalarKey } from '../lib/biometrics'

export function ScalarBadge({ kind, kg }: { kind: ScalarKey | 'abw40'; kg: number }) {
  return (
    <span className="inline-flex items-center rounded-md border border-accent/50 bg-accent/10 px-2 py-1 font-mono text-xs font-bold tabular-nums text-accent">
      [{kind.toUpperCase()}: {kg.toFixed(1)} kg]
    </span>
  )
}
```

`src/components/BiometricBar.tsx`:

```tsx
import * as ToggleGroup from '@radix-ui/react-toggle-group'
import { TriangleAlert } from 'lucide-react'
import { inputAdvisories, type Sex } from '../lib/biometrics'
import { useScalars } from '../hooks'
import { useStore } from '../store'
import { NumField } from './Stepper'
import { ScalarBadge } from './ScalarBadge'

export function BiometricBar({ compact = false }: { compact?: boolean }) {
  const { weightKg, heightCm, sex, setWeight, setHeight, setSex, clearBiometrics } = useStore()
  const scalars = useScalars()
  const { softWarnings, adultOnly } = inputAdvisories(weightKg, heightCm)

  return (
    <section className="sticky top-0 z-10 border-b border-line bg-base/95 p-3 backdrop-blur">
      <div className="flex gap-2">
        <NumField label="Weight (TBW)" unit="kg" value={weightKg} onChange={setWeight} stepper max={400} />
        {!compact && <NumField label="Height" unit="cm" value={heightCm} onChange={setHeight} start={170} max={250} />}
      </div>

      {!compact && (
        <div className="mt-2 flex items-center gap-2">
          <ToggleGroup.Root type="single" value={sex} onValueChange={(v) => v && setSex(v as Sex)}
            className="flex overflow-hidden rounded-lg border border-line" aria-label="Biological sex">
            {(['male', 'female'] as const).map((s) => (
              <ToggleGroup.Item key={s} value={s}
                className="min-h-12 min-w-24 bg-card px-4 text-sm font-semibold capitalize data-[state=on]:bg-accent data-[state=on]:text-base">
                {s}
              </ToggleGroup.Item>
            ))}
          </ToggleGroup.Root>
          <button type="button" onClick={clearBiometrics}
            className="ml-auto min-h-12 rounded-lg border border-line px-3 text-sm text-muted active:bg-line">
            Clear
          </button>
        </div>
      )}

      {!compact && (
        <div className="mt-2 flex flex-wrap gap-1.5" aria-live="polite">
          {scalars ? (
            <>
              <span className="inline-flex items-center rounded-md border border-line bg-card px-2 py-1 font-mono text-xs font-bold tabular-nums">
                BMI: {scalars.bmi.toFixed(1)}
              </span>
              <ScalarBadge kind="ibw" kg={scalars.ibw} />
              <ScalarBadge kind="lbw" kg={scalars.lbw} />
              <ScalarBadge kind="abw40" kg={scalars.abw40} />
            </>
          ) : (
            <span className="text-sm text-muted">Enter weight (1–400 kg) and height (30–250 cm)</span>
          )}
        </div>
      )}

      {[...softWarnings, ...(adultOnly ? ['Formulas are adult-oriented. Verify independently.'] : [])].map((w) => (
        <p key={w} className="mt-2 flex items-center gap-2 rounded-md border border-amber/60 bg-amber/10 px-2 py-1 text-sm font-semibold text-amber">
          <TriangleAlert size={16} aria-hidden /> {w}
        </p>
      ))}
    </section>
  )
}
```

`src/components/Disclaimer.tsx`:

```tsx
export function Disclaimer() {
  return (
    <p className="border-t border-line bg-card px-3 py-1.5 text-center text-[11px] leading-tight text-muted">
      Educational and cognitive aid. Clinical judgment supersedes all calculated suggestions.
    </p>
  )
}
```

`src/components/BottomNav.tsx`:

```tsx
import { Calculator, ClipboardCheck, Siren, Syringe } from 'lucide-react'

export type TabId = 'calc' | 'crisis' | 'local' | 'lists'

const TABS = [
  { id: 'calc', label: 'Calculator', Icon: Calculator },
  { id: 'crisis', label: 'Crisis', Icon: Siren },
  { id: 'local', label: 'Local Max', Icon: Syringe },
  { id: 'lists', label: 'Checklists', Icon: ClipboardCheck },
] as const

export function BottomNav({ tab, onChange }: { tab: TabId; onChange: (t: TabId) => void }) {
  return (
    <nav className="grid grid-cols-4 border-t border-line bg-card pb-[env(safe-area-inset-bottom)]" aria-label="Main">
      {TABS.map(({ id, label, Icon }) => {
        const active = tab === id
        const color = active ? (id === 'crisis' ? 'text-crimson' : 'text-accent') : 'text-muted'
        return (
          <button key={id} type="button" onClick={() => onChange(id)} aria-current={active ? 'page' : undefined}
            className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold ${color} ${active ? 'bg-base' : ''}`}>
            <Icon size={22} aria-hidden />
            {label}
          </button>
        )
      })}
    </nav>
  )
}
```

- [ ] **Step 6: Wire `src/App.tsx` (views are stubbed until later tasks)**

```tsx
import { useState } from 'react'
import { BiometricBar } from './components/BiometricBar'
import { BottomNav, type TabId } from './components/BottomNav'
import { Disclaimer } from './components/Disclaimer'

export default function App() {
  const [tab, setTab] = useState<TabId>('calc')
  return (
    <div className="mx-auto flex h-dvh max-w-xl flex-col bg-base">
      {(tab === 'calc' || tab === 'local') && <BiometricBar />}
      {tab === 'crisis' && <BiometricBar compact />}
      <main className="min-h-0 flex-1 overflow-y-auto p-3">
        <p className="text-muted">View: {tab}</p>
      </main>
      <Disclaimer />
      <BottomNav tab={tab} onChange={setTab} />
    </div>
  )
}
```

- [ ] **Step 7: Verify type-check and visual**

Run: `npx tsc --noEmit`
Expected: no errors (rename any lucide icon that does not exist in the installed version).

Run: `npm run dev`, open the printed URL in the built-in browser at 375×812. Type `80` and `175`: the strip shows `BMI: 26.1`, `[IBW: 70.5 kg]`, `[LBW: 60.2 kg]`, `[ABW40: 74.3 kg]`. Type `7.` in weight: it stays `7.` while typing. Clear weight: the strip is replaced by the prompt. Reload: values persist.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: persisted store, biometric bar, bottom nav and app shell"
```

---

### Task 8: Calculator tab and drug cards

**Files:**
- Create: `src/components/DrugCard.tsx`, `src/views/CalculatorView.tsx`
- Modify: `src/App.tsx` (render `CalculatorView` for `calc`)

**Interfaces:**
- Consumes: `DRUGS`, `CATEGORIES`, `Drug` from `../lib/drugs`; `calcOption` from `../lib/dosing`; `fmtNum`, `fmtVol`, `fmtRange` from `../lib/format`; `useScalars`; `useStore`; `ScalarBadge`.
- Produces: `<DrugCard drug />`, `<CalculatorView />`.

- [ ] **Step 1: Implement `src/components/DrugCard.tsx`**

```tsx
import { TriangleAlert } from 'lucide-react'
import { useScalars } from '../hooks'
import { calcOption } from '../lib/dosing'
import type { Drug } from '../lib/drugs'
import { fmtNum, fmtRange, fmtVol } from '../lib/format'
import { useStore } from '../store'
import { ScalarBadge } from './ScalarBadge'

function DrugBody({ drug }: { drug: Drug }) {
  const scalars = useScalars()
  const override = useStore((s) => s.concOverrides[drug.id])
  const setConc = useStore((s) => s.setConc)
  const conc = drug.concentrations.includes(override) ? override : drug.defaultConc

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-bold">{drug.name}</h3>
        {scalars && <ScalarBadge kind={drug.scalar} kg={scalars[drug.scalar]} />}
      </div>

      {!scalars ? (
        <p className="rounded-md border border-line bg-base p-3 text-sm text-muted">Enter valid weight &amp; height</p>
      ) : (
        drug.options.map((opt) => {
          const r = calcOption(drug, opt, scalars, conc)
          return (
            <div key={opt.label} className="rounded-lg border border-line bg-base p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">{opt.label}</p>
              <p className="font-mono text-3xl font-bold tabular-nums text-accent">
                {fmtRange(r.massLow, r.massHigh)} <span className="text-lg">{r.unit}</span>
              </p>
              <p className="font-mono text-xl font-semibold tabular-nums">
                {fmtRange(r.volLow, r.volHigh, fmtVol)} <span className="text-base text-muted">mL</span>
                <span className="ml-2 text-xs text-muted">@ {fmtNum(conc)} {r.unit}/mL</span>
              </p>
              {r.ceilingHit && (
                <p className="mt-2 flex items-center gap-2 rounded-md border border-crimson bg-crimson/10 px-2 py-1 text-sm font-bold text-crimson">
                  <TriangleAlert size={16} aria-hidden />
                  CAPPED at {fmtNum(drug.maxMass!)} {r.unit}
                  <span className="font-normal text-muted">(uncapped {fmtNum(r.uncappedHigh)} {r.unit})</span>
                </p>
              )}
            </div>
          )
        })
      )}

      {drug.concentrations.length > 1 && (
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={`${drug.name} concentration`}>
          <span className="text-xs text-muted">Vial:</span>
          {drug.concentrations.map((c) => (
            <button key={c} type="button" onClick={() => setConc(drug.id, c)}
              className={`min-h-12 min-w-12 rounded-lg border px-3 font-mono text-sm font-bold ${c === conc ? 'border-accent bg-accent text-base' : 'border-line bg-card'}`}>
              {fmtNum(c)}
            </button>
          ))}
          <span className="text-xs text-muted">{drug.unit}/mL</span>
        </div>
      )}
      {drug.note && <p className="text-xs text-muted">{drug.note}</p>}
    </div>
  )
}

export function DrugCard({ drug }: { drug: Drug }) {
  return (
    <article className="space-y-4 rounded-xl border border-line bg-card p-3">
      <DrugBody drug={drug} />
      {drug.companion && (
        <div className="border-t border-line pt-3">
          <DrugBody drug={drug.companion} />
        </div>
      )}
    </article>
  )
}
```

- [ ] **Step 2: Implement `src/views/CalculatorView.tsx`**

```tsx
import { DrugCard } from '../components/DrugCard'
import { CATEGORIES, DRUGS } from '../lib/drugs'

export function CalculatorView() {
  return (
    <div className="space-y-5">
      {CATEGORIES.map((cat) => (
        <section key={cat} className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted">{cat}</h2>
          {DRUGS.filter((d) => d.category === cat).map((d) => (
            <DrugCard key={d.id} drug={d} />
          ))}
        </section>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Render it in `src/App.tsx`**

Add `import { CalculatorView } from './views/CalculatorView'` and replace the placeholder `<p>` in `<main>` with:

```tsx
{tab === 'calc' && <CalculatorView />}
{tab !== 'calc' && <p className="text-muted">View: {tab}</p>}
```

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit` → no errors.
In the browser (375×812) with male, 175 cm, 80 kg:
- Propofol shows `[LBW: 60.2 kg]` and `90.3–150 mg`.
- Rocuronium `[IBW: 70.5 kg]`: standard `42.3 mg`, `4.2 mL`; RSI `84.5 mg`, `8.5 mL`.
- Sugammadex 16 mg/kg: `1280 mg`, `12.8 mL`.
- Succinylcholine `80–120 mg`, no crimson flag. Set weight to 150: `150–200 mg` with `CAPPED at 200 mg (uncapped 225 mg)`.
- Neostigmine at 200 kg: `5 mg` capped; glycopyrrolate `1 mg` capped, `5 mL`.
- Phenylephrine `50–100 mcg`, `0.5–1 mL`.
- Clear height: every card shows "Enter valid weight & height".
Check there is no horizontal scroll and that all buttons are at least 48px.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: calculator tab with categorised drug cards, caps and vial selector"
```

---

### Task 9: Local Max tab

**Files:**
- Create: `src/views/LocalMaxView.tsx`
- Modify: `src/App.tsx` (render for `local`)

**Interfaces:**
- Consumes: `LA_AGENTS`, `evaluateLA`, `LAEntry` from `../lib/localAnesthetics`; `useStore` weight; `fmtNum`.
- Produces: `<LocalMaxView />`. Entry state is in memory (`useState`), never persisted. `evaluateLA` skips unknown agents, but this UI only offers known agents, so `result.rows[i]` lines up with `rows[i]`.

- [ ] **Step 1: Implement `src/views/LocalMaxView.tsx`**

```tsx
import { useState } from 'react'
import { Plus, ShieldAlert, Trash2 } from 'lucide-react'
import { fmtNum } from '../lib/format'
import { LA_AGENTS, evaluateLA, type LAEntry } from '../lib/localAnesthetics'
import { useStore } from '../store'

interface Row extends Omit<LAEntry, 'volumeMl'> {
  key: number
  volume: string
}

let nextKey = 1
const newRow = (agentId = 'lidocaine'): Row => {
  const agent = LA_AGENTS.find((a) => a.id === agentId)!
  return { key: nextKey++, agentId, epi: false, conc: agent.concentrations[1] ?? agent.concentrations[0], volume: '' }
}

export function LocalMaxView() {
  const weightKg = useStore((s) => s.weightKg)
  const [rows, setRows] = useState<Row[]>(() => [newRow('lidocaine'), newRow('bupivacaine')])

  const update = (key: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)))

  const entries: LAEntry[] = rows.map((r) => {
    const v = r.volume.trim() === '' ? null : Number(r.volume)
    return { agentId: r.agentId, epi: r.epi, conc: r.conc, volumeMl: v !== null && Number.isFinite(v) ? v : null }
  })
  const result = evaluateLA(entries, weightKg)

  if (!result) {
    return <p className="rounded-xl border border-line bg-card p-4 text-muted">Enter a valid patient weight (1–400 kg) to calculate maximum doses.</p>
  }

  const pct = Math.min(result.total * 100, 100)
  const tone = result.level === 'toxic' ? 'bg-crimson' : result.level === 'caution' ? 'bg-amber' : 'bg-ok'
  const text = result.level === 'toxic' ? 'text-crimson' : result.level === 'caution' ? 'text-amber' : 'text-ok'

  return (
    <div className="space-y-3">
      <section className="rounded-xl border border-line bg-card p-3" aria-live="polite">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Total fraction of maximum (Σ dose ÷ max)</p>
        <p className={`font-mono text-4xl font-bold tabular-nums ${text}`}>{result.total.toFixed(2)}</p>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-base" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
          <div className={`h-full ${tone}`} style={{ width: `${pct}%` }} />
        </div>
        {result.level === 'toxic' && (
          <p className="mt-2 flex items-center gap-2 rounded-md border border-crimson bg-crimson/10 px-2 py-1 font-bold text-crimson">
            <ShieldAlert size={18} aria-hidden /> TOXIC RISK: total ≥ 1.0{result.worst ? ` (largest: ${result.worst.name})` : ''}
          </p>
        )}
        {result.level === 'caution' && (
          <p className="mt-2 font-semibold text-amber">CAUTION: approaching the combined maximum (≥ 0.8)</p>
        )}
        {result.level === 'ok' && <p className="mt-2 text-sm text-muted">Safe if total stays below 1.0.</p>}
      </section>

      {rows.map((r, i) => {
        const agent = LA_AGENTS.find((a) => a.id === r.agentId)!
        const row = result.rows[i]
        return (
          <article key={r.key} className="space-y-2 rounded-xl border border-line bg-card p-3">
            <div className="flex items-center gap-2">
              <select value={r.agentId} aria-label="Local anesthetic"
                onChange={(e) => {
                  const a = LA_AGENTS.find((x) => x.id === e.target.value)!
                  update(r.key, { agentId: a.id, conc: a.concentrations[1] ?? a.concentrations[0] })
                }}
                className="min-h-12 flex-1 rounded-lg border border-line bg-base px-3 text-lg font-bold">
                {LA_AGENTS.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              <button type="button" aria-label="Remove drug" onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))}
                className="flex min-h-12 min-w-12 items-center justify-center rounded-lg border border-line text-muted active:bg-line">
                <Trash2 size={20} />
              </button>
            </div>

            <div className="flex gap-2">
              <div className="flex overflow-hidden rounded-lg border border-line" role="group" aria-label="Epinephrine">
                {[false, true].map((e) => (
                  <button key={String(e)} type="button" onClick={() => update(r.key, { epi: e })}
                    className={`min-h-12 px-3 text-sm font-semibold ${r.epi === e ? 'bg-accent text-base' : 'bg-base'}`}>
                    {e ? 'With epi' : 'Plain'}
                  </button>
                ))}
              </div>
              <select value={r.conc} aria-label="Concentration" onChange={(e) => update(r.key, { conc: Number(e.target.value) })}
                className="min-h-12 flex-1 rounded-lg border border-line bg-base px-2 font-mono font-bold">
                {agent.concentrations.map((c) => <option key={c} value={c}>{c}%</option>)}
              </select>
              <input inputMode="decimal" placeholder="mL" aria-label="Volume in mL" value={r.volume}
                onChange={(e) => update(r.key, { volume: e.target.value })}
                className="min-h-12 w-24 rounded-lg border border-line bg-base px-2 font-mono text-lg font-bold tabular-nums text-accent outline-none focus:border-accent" />
            </div>

            <p className="font-mono text-sm tabular-nums text-muted">
              <span className="text-lg font-bold text-fg">{fmtNum(row.mg)} mg</span> of max{' '}
              <span className="font-bold text-fg">{fmtNum(row.maxMg)} mg</span> ({r.epi ? agent.mgPerKgEpi : agent.mgPerKgPlain} mg/kg, ceiling {r.epi ? agent.absEpi : agent.absPlain} mg) · fraction{' '}
              <span className="font-bold text-fg">{row.fraction.toFixed(2)}</span>
            </p>
          </article>
        )
      })}

      <button type="button" onClick={() => setRows((rs) => [...rs, newRow('ropivacaine')])}
        className="flex min-h-14 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-accent font-bold text-accent active:bg-card">
        <Plus size={20} aria-hidden /> Add local anesthetic
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Render it in `src/App.tsx`**

Import `LocalMaxView` and add `{tab === 'local' && <LocalMaxView />}`; update the placeholder condition to `tab === 'crisis' || tab === 'lists'`.

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit` → no errors.
Browser, 70 kg: lidocaine 1% × 10 mL = `100 mg of max 280 mg`, fraction `0.36`. Bupivacaine 0.5% × 20 mL = `100 mg of max 140 mg`, `0.71`. Total `1.07` shows `TOXIC RISK`, naming Bupivacaine, and a full crimson bar. Reduce bupivacaine to 10 mL: total `0.71`, green. Toggle "With epi" on lidocaine: max `490 mg`. Clear weight: the refusal message shows. A blank volume gives `0 mg`, no `NaN`.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: local anesthetic combined-maximum checker"
```

---

### Task 10: Crisis tab (checklists, timer, LAST, MH, CICO)

**Files:**
- Create: `src/components/Checklist.tsx`, `src/components/Timer.tsx`, `src/views/CrisisView.tsx`
- Modify: `src/App.tsx` (render for `crisis`)

**Interfaces:**
- Consumes: `lastLipid`, `dantrolene`, `ryanodex`, `LAST_STEPS`, `MH_STEPS`, `CICO_PLANS`, `Step` from `../lib/crisis`; `useStore` weight; `fmtNum`, `fmtVol`.
- Produces:
  - `<Checklist items: Step[] accent?: 'crimson' | 'accent' />` (tick state is internal; remount with a `key` to reset)
  - `<Timer title cycleSeconds? />` (elapsed display; with `cycleSeconds` also a countdown that restarts and alerts at zero)
  - `<CrisisView />`

- [ ] **Step 1: Implement `src/components/Checklist.tsx`**

```tsx
import { useState } from 'react'
import * as Checkbox from '@radix-ui/react-checkbox'
import { Check, RotateCcw } from 'lucide-react'

interface Item {
  id: string
  text: string
  detail?: string
  critical?: boolean
}

export function Checklist({ items, accent = 'accent' }: { items: Item[]; accent?: 'crimson' | 'accent' }) {
  const [done, setDone] = useState<Set<string>>(new Set())
  const toggle = (id: string) =>
    setDone((d) => {
      const n = new Set(d)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  const idle = accent === 'crimson' ? 'border-crimson/60' : 'border-line'

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm text-muted">
        <span className="font-mono tabular-nums">{done.size}/{items.length} complete</span>
        <button type="button" onClick={() => setDone(new Set())}
          className="flex min-h-12 items-center gap-1 rounded-lg px-3 active:bg-line">
          <RotateCcw size={16} aria-hidden /> Reset
        </button>
      </div>
      {items.map((it) => {
        const on = done.has(it.id)
        return (
          <label key={it.id}
            className={`flex min-h-14 cursor-pointer items-start gap-3 rounded-xl border p-3 ${on ? 'border-ok bg-ok/10' : `${idle} bg-card`}`}>
            <Checkbox.Root checked={on} onCheckedChange={() => toggle(it.id)}
              className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border-2 ${on ? 'border-ok bg-ok' : 'border-muted bg-base'}`}>
              <Checkbox.Indicator><Check size={20} className="text-base" aria-hidden /></Checkbox.Indicator>
            </Checkbox.Root>
            <span className="min-w-0">
              <span className={`block text-base ${it.critical ? 'font-bold' : 'font-medium'} ${on ? 'text-ok line-through decoration-1' : ''}`}>
                {it.text}
              </span>
              {it.detail && <span className="block text-sm text-muted">{it.detail}</span>}
            </span>
          </label>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Implement `src/components/Timer.tsx`**

```tsx
import { useEffect, useRef, useState } from 'react'
import { Pause, Play, RotateCcw } from 'lucide-react'

const mmss = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`

export function Timer({ title, cycleSeconds }: { title: string; cycleSeconds?: number }) {
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [flash, setFlash] = useState(false)
  const ctx = useRef<AudioContext | null>(null)
  const startedAt = useRef(0)
  const lastCycle = useRef(0)

  const beep = () => {
    try {
      const c = ctx.current
      if (!c) return
      const o = c.createOscillator()
      const g = c.createGain()
      o.frequency.value = 880
      g.gain.value = 0.2
      o.connect(g).connect(c.destination)
      o.start()
      o.stop(c.currentTime + 0.4)
    } catch {
      // audio unavailable: the visual alert still works
    }
  }

  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => {
      const e = (Date.now() - startedAt.current) / 1000
      setElapsed(e)
      if (cycleSeconds) {
        const cycles = Math.floor(e / cycleSeconds)
        if (cycles > lastCycle.current) {
          lastCycle.current = cycles
          beep()
          setFlash(true)
          window.setTimeout(() => setFlash(false), 4000)
        }
      }
    }, 250)
    return () => window.clearInterval(id)
  }, [running, cycleSeconds])

  const start = () => {
    // created inside the tap so the browser permits audio
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (Ctor) {
      ctx.current ??= new Ctor()
      void ctx.current.resume()
    }
    startedAt.current = Date.now() - elapsed * 1000
    setRunning(true)
  }
  const reset = () => {
    setRunning(false)
    setElapsed(0)
    lastCycle.current = 0
    setFlash(false)
  }

  const remaining = cycleSeconds ? cycleSeconds - (elapsed % cycleSeconds) : null

  return (
    <div className={`rounded-xl border p-3 ${flash ? 'animate-pulse border-crimson bg-crimson/30' : 'border-line bg-card'}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{title}</p>
      <div className="flex items-end justify-between gap-2">
        <div>
          {remaining !== null && (
            <p className="font-mono text-4xl font-bold tabular-nums text-accent">{mmss(remaining)}</p>
          )}
          <p className={`font-mono tabular-nums ${remaining !== null ? 'text-sm text-muted' : 'text-4xl font-bold text-accent'}`}>
            {remaining !== null ? 'Elapsed ' : ''}{mmss(elapsed)}
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={running ? () => setRunning(false) : start}
            className="flex min-h-14 min-w-14 items-center justify-center gap-1 rounded-xl bg-accent px-4 font-bold text-base"
            aria-label={running ? 'Pause timer' : 'Start timer'}>
            {running ? <Pause size={22} /> : <Play size={22} />}
          </button>
          <button type="button" onClick={reset} aria-label="Reset timer"
            className="flex min-h-14 min-w-14 items-center justify-center rounded-xl border border-line">
            <RotateCcw size={20} />
          </button>
        </div>
      </div>
      {flash && <p className="mt-1 font-bold text-crimson">RHYTHM / PULSE CHECK NOW</p>}
    </div>
  )
}
```

- [ ] **Step 3: Implement `src/views/CrisisView.tsx`**

```tsx
import { useState } from 'react'
import { PhoneCall, TriangleAlert } from 'lucide-react'
import { Checklist } from '../components/Checklist'
import { Timer } from '../components/Timer'
import {
  CICO_PLANS, LAST_STEPS, MH_STEPS, dantrolene, lastLipid, ryanodex,
} from '../lib/crisis'
import { fmtNum, fmtVol } from '../lib/format'
import { useStore } from '../store'

type Protocol = 'last' | 'mh' | 'cico'

function Stat({ label, value, unit, sub }: { label: string; value: string; unit: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-line bg-base p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="font-mono text-3xl font-bold tabular-nums text-accent">{value} <span className="text-lg">{unit}</span></p>
      {sub && <p className="text-sm text-muted">{sub}</p>}
    </div>
  )
}

const needWeight = (
  <p className="rounded-lg border border-line bg-base p-3 text-sm text-muted">Enter valid weight above to calculate doses.</p>
)

function LastPanel({ kg }: { kg: number | null }) {
  const r = lastLipid(kg)
  return (
    <div className="space-y-3">
      {r ? (
        <>
          <Stat label="20% lipid bolus (1.5 mL/kg over 2–3 min)" value={fmtNum(r.bolusMl)} unit="mL"
            sub={r.bolusCapped ? `CAPPED at 100 mL (uncapped ${fmtNum(r.uncappedBolusMl)} mL)` : undefined} />
          <Stat label="Then infusion (0.25 mL/kg/min)" value={fmtNum(r.infusionMlMin)} unit="mL/min" sub={`${fmtNum(r.infusionMlHr)} mL/h`} />
          <p className="text-sm text-muted">Maximum total lipid about {fmtNum(r.maxTotalMl)} mL (12 mL/kg).</p>
        </>
      ) : needWeight}
      <Checklist items={LAST_STEPS} accent="crimson" />
    </div>
  )
}

function MhPanel({ kg }: { kg: number | null }) {
  const d = dantrolene(kg)
  const ry = ryanodex(kg)
  return (
    <div className="space-y-3">
      {d && ry ? (
        <>
          <Stat label="Dantrolene 2.5 mg/kg" value={fmtNum(d.doseMg)} unit="mg"
            sub={`${d.vials} × 20 mg vials · ${fmtVol(d.volumeMl)} mL after reconstitution (60 mL per vial)`} />
          <Stat label="Ryanodex 2.5 mg/kg" value={fmtNum(ry.doseMg)} unit="mg"
            sub={`${ry.vials} × 250 mg vial · ${fmtVol(ry.volumeMl)} mL at 50 mg/mL`} />
          <p className="text-sm text-muted">Repeat as needed; cumulative ceiling about {fmtNum(d.maxTotalMg)} mg (10 mg/kg), then seek expert advice.</p>
        </>
      ) : needWeight}
      <Checklist items={MH_STEPS} accent="crimson" />
    </div>
  )
}

function CicoPanel() {
  const [idx, setIdx] = useState(0)
  const plan = CICO_PLANS[idx]
  const last = idx === CICO_PLANS.length - 1
  return (
    <div className="space-y-3">
      <Timer title="CICO elapsed time" />
      <div className="flex gap-1" aria-label="Plan progress">
        {CICO_PLANS.map((p, i) => (
          <button key={p.id} type="button" onClick={() => setIdx(i)}
            className={`min-h-12 flex-1 rounded-lg border font-bold ${i === idx ? 'border-crimson bg-crimson text-white' : i < idx ? 'border-ok text-ok' : 'border-line text-muted'}`}>
            {p.id}
          </button>
        ))}
      </div>
      <h3 className="text-lg font-bold text-crimson">{plan.title}</h3>
      <p className="text-sm text-muted">{plan.goal}</p>
      <Checklist key={plan.id} items={plan.steps} accent="crimson" />
      <p className="flex items-start gap-2 rounded-lg border border-crimson bg-crimson/10 p-3 font-semibold text-crimson">
        <TriangleAlert size={18} className="mt-0.5 shrink-0" aria-hidden /> {plan.failure}
      </p>
      {!last && (
        <button type="button" onClick={() => setIdx(idx + 1)}
          className="min-h-14 w-full rounded-xl bg-crimson font-bold text-white active:opacity-80">
          Plan {plan.id} FAILED → go to Plan {CICO_PLANS[idx + 1].id}
        </button>
      )}
    </div>
  )
}

export function CrisisView() {
  const weightKg = useStore((s) => s.weightKg)
  const [proto, setProto] = useState<Protocol>('last')
  const tabs: { id: Protocol; label: string }[] = [
    { id: 'last', label: 'LAST' },
    { id: 'mh', label: 'MH' },
    { id: 'cico', label: 'CICO' },
  ]
  return (
    <div className="space-y-3">
      <p className="flex items-center gap-2 rounded-xl bg-crimson p-3 text-lg font-extrabold text-white">
        <PhoneCall size={22} aria-hidden /> CALL FOR HELP FIRST
      </p>
      <Timer title="CPR / rhythm check (2 min cycle)" cycleSeconds={120} />
      <div className="grid grid-cols-3 gap-2" role="tablist">
        {tabs.map((t) => (
          <button key={t.id} role="tab" aria-selected={proto === t.id} type="button" onClick={() => setProto(t.id)}
            className={`min-h-14 rounded-xl border-2 text-lg font-extrabold ${proto === t.id ? 'border-crimson bg-crimson/20 text-crimson' : 'border-line bg-card text-muted'}`}>
            {t.label}
          </button>
        ))}
      </div>
      {proto === 'last' && <LastPanel kg={weightKg} />}
      {proto === 'mh' && <MhPanel kg={weightKg} />}
      {proto === 'cico' && <CicoPanel />}
    </div>
  )
}
```

- [ ] **Step 4: Render it in `src/App.tsx`**

Import `CrisisView`; add `{tab === 'crisis' && <CrisisView />}`; the placeholder now only applies to `lists`.

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit` → no errors.
Browser, weight 80: LAST bolus `100 mL` with `CAPPED at 100 mL (uncapped 120 mL)`; infusion `20 mL/min`, `1200 mL/h`. MH dantrolene `200 mg`, `10 × 20 mg vials`, `600 mL`; Ryanodex `200 mg`, `1 × 250 mg vial`, `4 mL`. Tick items: they turn emerald, with the counter `n/9`. Start the CPR timer: the countdown runs. To test the alert quickly, temporarily pass `cycleSeconds={5}`, confirm the flash plus beep, then restore 120. CICO: the failure button advances A→B→C→D with the checklist resetting on each plan, and the button disappears on D. Clear weight: panels show the prompt. Check touch targets are at least 48px.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: crisis tab with LAST, MH, CICO protocols, checklists and timers"
```

---

### Task 11: Routine checklists and PACU handoff tab

**Files:**
- Create: `src/views/ChecklistsView.tsx`
- Modify: `src/App.tsx` (render for `lists`, remove the placeholder)

**Interfaces:**
- Consumes: `WHO_ITEMS`, `EXTUBATION_ITEMS`, `PACU_FIELDS`, `buildPacuSummary`, `PacuKey` from `../lib/checklists`; `copyText` from `../lib/clipboard`; `Checklist`; Radix Tabs.
- Produces: `<ChecklistsView />`. PACU text is in memory only.

- [ ] **Step 1: Implement `src/views/ChecklistsView.tsx`**

```tsx
import { useState } from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import { Copy, Eraser, ShieldCheck } from 'lucide-react'
import { Checklist } from '../components/Checklist'
import { EXTUBATION_ITEMS, PACU_FIELDS, WHO_ITEMS, buildPacuSummary, type PacuKey } from '../lib/checklists'
import { copyText } from '../lib/clipboard'

const trigger =
  'min-h-12 flex-1 rounded-lg px-2 text-sm font-bold text-muted data-[state=active]:bg-accent data-[state=active]:text-base'

function Pacu() {
  const [values, setValues] = useState<Partial<Record<PacuKey, string>>>({})
  const [copied, setCopied] = useState<'idle' | 'ok' | 'fail'>('idle')
  const summary = buildPacuSummary(values)

  return (
    <div className="space-y-3">
      <p className="flex items-start gap-2 rounded-lg border border-amber/60 bg-amber/10 p-3 text-sm font-semibold text-amber">
        <ShieldCheck size={18} className="mt-0.5 shrink-0" aria-hidden />
        Do not enter names, MRNs, dates of birth or other identifiers. Nothing here is saved.
      </p>
      {PACU_FIELDS.map((f) => (
        <label key={f.key} className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">{f.label}</span>
          {f.multiline ? (
            <textarea rows={3} value={values[f.key] ?? ''} placeholder={f.placeholder}
              onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-line bg-card p-3 outline-none focus:border-accent" />
          ) : (
            <input value={values[f.key] ?? ''} placeholder={f.placeholder}
              onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
              className="mt-1 min-h-12 w-full rounded-lg border border-line bg-card px-3 outline-none focus:border-accent" />
          )}
        </label>
      ))}
      <pre className="whitespace-pre-wrap rounded-lg border border-line bg-base p-3 font-mono text-sm">{summary}</pre>
      <div className="flex gap-2">
        <button type="button"
          onClick={async () => {
            setCopied((await copyText(summary)) ? 'ok' : 'fail')
            window.setTimeout(() => setCopied('idle'), 2500)
          }}
          className="flex min-h-14 flex-1 items-center justify-center gap-2 rounded-xl bg-accent font-bold text-base active:opacity-80">
          <Copy size={20} aria-hidden />
          {copied === 'ok' ? 'Copied' : copied === 'fail' ? 'Copy failed: select text manually' : 'Copy Summary to Clipboard'}
        </button>
        <button type="button" onClick={() => setValues({})} aria-label="Clear form"
          className="flex min-h-14 min-w-14 items-center justify-center rounded-xl border border-line">
          <Eraser size={20} />
        </button>
      </div>
    </div>
  )
}

export function ChecklistsView() {
  return (
    <Tabs.Root defaultValue="who" className="space-y-3">
      <Tabs.List className="flex gap-1 rounded-xl border border-line bg-card p-1" aria-label="Checklists">
        <Tabs.Trigger value="who" className={trigger}>Pre-induction</Tabs.Trigger>
        <Tabs.Trigger value="ext" className={trigger}>Extubation</Tabs.Trigger>
        <Tabs.Trigger value="pacu" className={trigger}>PACU</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="who"><Checklist items={WHO_ITEMS} /></Tabs.Content>
      <Tabs.Content value="ext"><Checklist items={EXTUBATION_ITEMS} /></Tabs.Content>
      <Tabs.Content value="pacu"><Pacu /></Tabs.Content>
    </Tabs.Root>
  )
}
```

- [ ] **Step 2: Finalise `src/App.tsx`**

Replace the `<main>` body with all four views:

```tsx
<main className="min-h-0 flex-1 overflow-y-auto p-3">
  {tab === 'calc' && <CalculatorView />}
  {tab === 'crisis' && <CrisisView />}
  {tab === 'local' && <LocalMaxView />}
  {tab === 'lists' && <ChecklistsView />}
</main>
```

with imports for `CalculatorView`, `CrisisView`, `LocalMaxView` and `ChecklistsView`.

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit` → no errors; `npm test` → all PASS.
Browser: the Checklists tab shows three sub-tabs. Tick WHO items (emerald). On PACU fill ASA `2` and Procedure `Lap chole`: the preview shows `PACU HANDOFF`, `ASA class: 2`, `Procedure: Lap chole`. Press the copy button and paste into a text field; the text matches. The clear button empties the form. Reloading the page clears the checklist and PACU text, but weight and height remain.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: WHO, extubation and PACU handoff tab with clipboard copy"
```

---

### Task 12: PWA, offline and privacy verification

**Files:**
- Modify: none expected (fix anything found)
- Create: `README.md` (short)

- [ ] **Step 1: Production build and tests**

Run: `npm test && npm run build`
Expected: all tests PASS; build succeeds; `dist/sw.js`, `dist/manifest.webmanifest`, `dist/icons/*.png` exist.

- [ ] **Step 2: Offline check**

Run: `npm run preview`. Open the printed URL in the built-in browser. Wait for the service worker to activate (check `navigator.serviceWorker.ready` with the console tool). Enter biometrics. Stop the preview server and reload the page. Expected: the app still loads and the saved weight and height are present. Confirm the manifest reports a standalone display and valid icons.

- [ ] **Step 3: Network and PHI static check**

Run (Grep tool or bash):

```bash
grep -rnE "fetch\(|XMLHttpRequest|sendBeacon|WebSocket|gtag|analytics|googletagmanager" src || echo "none found"
```

Expected: `none found`.
In the browser console, run `JSON.stringify({...localStorage})`. Expected: only the `anesthassist-v1` key, containing `weightKg`, `heightCm`, `sex` and `concOverrides`.

- [ ] **Step 4: Layout and ergonomics sweep**

At 375×812 on every tab: no horizontal scroll (`document.documentElement.scrollWidth <= innerWidth`), the disclaimer and nav are always visible, and every `button`, `input` and `select` has `getBoundingClientRect().height >= 48` (run a script listing violations; fix any with `min-h-12`). Take a screenshot of each tab and review contrast.

- [ ] **Step 5: README**

Create `README.md` summarising: what the app is, the `npm run dev|build|test|preview|icons` commands, the privacy design (no network, no PHI, what is persisted), a pointer to `docs/superpowers/specs/2026-10-09-anesthassist-design.md`, and the clinical disclaimer that all constants must be verified by a clinician before real use and that the app is an educational aid, not a validated medical device.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "docs: README and final verification fixes"
```

---

## Self-review notes

- **Spec coverage:**
  - Sections 2–3: Tasks 2–6 (part 1).
  - Section 4: Task 7.
  - Section 5: Tasks 7–11.
  - Section 6: hard and soft ranges and the adult banner in Tasks 2 and 7; visible caps in Tasks 8 and 10; the local-anesthetic refusal in Task 9.
  - Section 7: Tasks 1 and 12.
  - Section 8: tests in Tasks 2–7, manual checks in Tasks 8–12.
  - Section 9: added constants are marked `// added` or noted in the code.
- **Type consistency:** `Scalars`, `ScalarKey`, `Drug.companion`, `calcOption`, `LAEntry`/`evaluateLA`, `Step`/`ChecklistItem` (structurally identical, so `Checklist` accepts both), and `sanitizePersisted` are named identically wherever used.
- **Judgment call to flag:** the lipid bolus uses TBW as the spec says. Many references prefer lean body weight for lipid dosing, so a clinician may want to review that.
