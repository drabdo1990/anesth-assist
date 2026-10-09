# AnesthAssist Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an offline-first, dark-theme anesthesia decision-support PWA with four tabs (Calculator, Crisis Cards, Local Max, Checklists/PACU) where every number comes from a tested pure function.

**Architecture:** Data-driven. `src/lib/` holds pure TypeScript (biometrics, drug catalogue, dosing, local-anesthetic maths, crisis calculators, checklist data). `src/store.ts` is a small persisted Zustand store (weight, height, sex, concentration overrides). `src/components/` and `src/views/` only render. No router, no network calls.

**Tech Stack:** Vite, React 19, TypeScript, Tailwind CSS v4 (`@tailwindcss/vite`), Zustand, Radix UI (toggle-group, checkbox, tabs), Lucide React, vite-plugin-pwa, Vitest, sharp (icon generation only).

**Spec:** `docs/superpowers/specs/2026-10-09-anesthassist-design.md`

**This plan is split in two files.** This file holds the header and Tasks 1–6 (scaffold and pure logic). Tasks 7–12 (store, UI, verification) are in `docs/superpowers/plans/2026-10-09-anesthassist-part2-ui.md`. Execute part 1 first.

Project root: `E:\CLAUDE-cowork\projects\anesthesia helper`. Dependencies are already in `node_modules`. Installed versions are newer than commonly documented (vite 8, TypeScript 7, vite-plugin-pwa 2, lucide-react 1.x). If an import name or config key fails, check the installed package's README or types in `node_modules` and adjust. Do not downgrade.

## Global Constraints

- 100% client-side calculation. No `fetch`, `XMLHttpRequest`, analytics, auth, cookies. Only the service worker touches the network.
- No PHI. Only `weightKg`, `heightCm`, `sex` and per-drug concentration overrides are persisted (localStorage key `anesthassist-v1`). Checklist ticks, timers, local-anesthetic entries and PACU text are in memory only.
- Dark theme only. Colours: background `#090d16`, cards `#131b2e`, borders `#1e293b`, cyan `#06b6d4`, crimson `#ef4444`, emerald `#10b981`.
- Every touch target at least 48px (`min-h-12 min-w-12`). Bottom-nav tabs, checklist rows and stepper buttons at least 56px (`min-h-14`).
- Numbers use `font-mono tabular-nums`. Units are always shown (mg, mcg, mL, kg).
- Biometric formulas exactly as specified (Task 2). Invalid input returns `null`, never a number.
- Hard input range 1–400 kg and 30–250 cm. Soft warning below 2 kg, above 250 kg, below 100 cm.
- Disclaimer text, permanently visible above the nav: "Educational and cognitive aid. Clinical judgment supersedes all calculated suggestions."
- Colour is never the only signal: warnings also carry an icon and a word ("CAPPED", "TOXIC RISK").
- Constants not in the user's spec carry a `// added` comment and are listed in spec section 9.

## Review Focus

1. Weight or height cleared, or half-typed (`"7."`, `""`): no `NaN`, `Infinity` or `0 mg` is ever rendered; cards say "Enter valid weight & height". (Tasks 2, 7, 8)
2. Height under 152.4 cm: Devine uses `max(0, …)`, so IBW is the base value (50 or 45.5), not lower. (Task 2)
3. Lean or small patient where TBW < IBW: IBW falls back to TBW, ABW40 equals TBW, LBW never exceeds TBW. (Task 2)
4. Heavy patient (150 to 200 kg): succinylcholine 200 mg, neostigmine 5 mg, glycopyrrolate 1 mg and lipid 100 mL caps all apply, flagged visibly, with the uncapped figure shown. (Tasks 3, 5, 8)
5. Local-anesthetic rows with blank volume, no weight, or a lidocaine + bupivacaine mix that crosses 1.0: blank counts as 0, no weight refuses to compute, and the sum shows TOXIC RISK naming the drug. (Tasks 4, 9)
6. Corrupt or old localStorage: the store falls back to defaults instead of crashing. (Task 7)

---

### Task 1: Project scaffold, tooling and PWA shell

**Files:**
- Create: `index.html`, `vite.config.ts`, `tsconfig.json`, `.gitignore`, `src/index.css`, `src/main.tsx`, `src/App.tsx` (placeholder), `scripts/make-icons.mjs`, `public/favicon.svg`
- Modify: `package.json` (scripts)
- Create (generated): `public/icons/icon-192.png`, `icon-512.png`, `icon-maskable-512.png`

**Interfaces:**
- Produces: Tailwind theme classes `bg-base`, `bg-card`, `border-line`, `text-accent`, `bg-accent`, `text-crimson`, `bg-crimson`, `text-ok`, `bg-ok`, `text-amber`, `text-fg`, `text-muted`. `npm run dev|build|test|icons` scripts.

- [ ] **Step 1: Initialise git and ignore file**

```bash
cd "E:/CLAUDE-cowork/projects/anesthesia helper"
git init
printf 'node_modules\ndist\n.DS_Store\n*.log\ngraphify-out\n' > .gitignore
```

- [ ] **Step 2: Set package scripts**

Edit `package.json` so `scripts` is:

```json
"scripts": {
  "dev": "vite",
  "build": "tsc --noEmit && vite build",
  "preview": "vite preview --host",
  "test": "vitest run",
  "icons": "node scripts/make-icons.mjs"
}
```

- [ ] **Step 3: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noEmit": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "types": ["vite/client", "vite-plugin-pwa/client"]
  },
  "include": ["src", "vite.config.ts"]
}
```

- [ ] **Step 4: Create `vite.config.ts`**

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: 'index.html',
      },
      manifest: {
        name: 'AnesthAssist',
        short_name: 'AnesthAssist',
        description: 'Offline anesthesia dosing and crisis cognitive aid',
        theme_color: '#090d16',
        background_color: '#090d16',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '.',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
})
```

- [ ] **Step 5: Create `index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="theme-color" content="#090d16" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <link rel="apple-touch-icon" href="/icons/icon-192.png" />
    <title>AnesthAssist</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 6: Create `src/index.css`**

```css
@import "tailwindcss";

@theme {
  --color-base: #090d16;
  --color-card: #131b2e;
  --color-line: #1e293b;
  --color-accent: #06b6d4;
  --color-crimson: #ef4444;
  --color-ok: #10b981;
  --color-amber: #f59e0b;
  --color-fg: #e2e8f0;
  --color-muted: #94a3b8;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}

:root { color-scheme: dark; }
html, body, #root { height: 100%; }
body {
  margin: 0;
  background: #090d16;
  color: var(--color-fg);
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  -webkit-tap-highlight-color: transparent;
  overscroll-behavior: none;
}
input, button, select, textarea { font: inherit; color: inherit; }
```

- [ ] **Step 7: Create `src/main.tsx` and placeholder `src/App.tsx`**

`src/main.tsx`:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

`src/App.tsx`:

```tsx
export default function App() {
  return <div className="p-4 text-accent">AnesthAssist</div>
}
```

- [ ] **Step 8: Create icon generator and icons**

`public/favicon.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="96" fill="#090d16"/><path d="M64 272h112l40-112 64 208 48-136h120" fill="none" stroke="#06b6d4" stroke-width="36" stroke-linecap="round" stroke-linejoin="round"/></svg>
```

`scripts/make-icons.mjs`:

```js
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'

mkdirSync('public/icons', { recursive: true })
const wave = (inset) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
<rect width="512" height="512" fill="#090d16"/>
<g transform="translate(${inset} ${inset}) scale(${(512 - 2 * inset) / 512})">
<path d="M64 272h112l40-112 64 208 48-136h120" fill="none" stroke="#06b6d4" stroke-width="36" stroke-linecap="round" stroke-linejoin="round"/></g></svg>`

const jobs = [
  ['public/icons/icon-192.png', 192, 0],
  ['public/icons/icon-512.png', 512, 0],
  ['public/icons/icon-maskable-512.png', 512, 90],
]
for (const [file, size, inset] of jobs) {
  await sharp(Buffer.from(wave(inset))).resize(size, size).png().toFile(file)
  console.log('wrote', file)
}
```

Run: `npm run icons`
Expected: three `wrote …` lines and files under `public/icons/`.

- [ ] **Step 9: Verify build**

Run: `npm run build`
Expected: `tsc` clean; Vite builds; output mentions `sw.js` and `manifest.webmanifest` in `dist/`. If `tsc` rejects an option under TypeScript 7, remove that single option and rerun. If `vite-plugin-pwa/client` types do not resolve, remove that entry from `types`.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite React TS Tailwind PWA shell"
```

---

### Task 2: Biometrics (pure functions)

**Files:**
- Create: `src/lib/biometrics.ts`
- Test: `src/lib/biometrics.test.ts`

**Interfaces:**
- Produces:
  - `type Sex = 'male' | 'female'`
  - `type ScalarKey = 'tbw' | 'ibw' | 'lbw'`
  - `interface Scalars { tbw: number; ibw: number; lbw: number; abw40: number; bmi: number }`
  - `computeScalars(tbw: number | null, heightCm: number | null, sex: Sex): Scalars | null`
  - `isWeightValid(tbw: number | null): tbw is number`
  - `inputAdvisories(tbw: number | null, heightCm: number | null): { softWarnings: string[]; adultOnly: boolean }`
  - `WEIGHT_RANGE`, `HEIGHT_RANGE`

- [ ] **Step 1: Write the failing tests** (`src/lib/biometrics.test.ts`)

```ts
import { describe, expect, it } from 'vitest'
import { computeScalars, inputAdvisories, isWeightValid } from './biometrics'

describe('computeScalars', () => {
  it('male 175 cm / 80 kg matches hand-computed values', () => {
    const s = computeScalars(80, 175, 'male')!
    expect(s.bmi).toBeCloseTo(26.122, 2)
    expect(s.ibw).toBeCloseTo(70.453, 2)
    expect(s.lbw).toBeCloseTo(60.18, 1)
    expect(s.abw40).toBeCloseTo(74.27, 1)
    expect(s.tbw).toBe(80)
  })

  it('female uses 45.5 base and the female LBW constants', () => {
    const s = computeScalars(70, 165, 'female')!
    // IBW = 45.5 + 0.905*(165-152.4) = 56.903
    expect(s.ibw).toBeCloseTo(56.903, 2)
    const bmi = 70 / 1.65 ** 2
    expect(s.lbw).toBeCloseTo((9270 * 70) / (8780 + 244 * bmi), 6)
  })

  it('height under 152.4 cm uses the base IBW (max(0, ...))', () => {
    expect(computeScalars(60, 150, 'male')!.ibw).toBe(50)
    expect(computeScalars(60, 150, 'female')!.ibw).toBe(45.5)
  })

  it('IBW falls back to TBW when TBW < IBW, and ABW40 equals TBW', () => {
    const s = computeScalars(50, 160, 'female')! // IBW formula = 52.378 > 50
    expect(s.ibw).toBe(50)
    expect(s.abw40).toBe(50)
  })

  it('caps LBW at TBW', () => {
    const s = computeScalars(30, 200, 'male')! // raw LBW = 33.5 > 30
    expect(s.lbw).toBe(30)
  })

  it('returns null for missing, zero, negative, NaN or out-of-range input', () => {
    expect(computeScalars(null, 175, 'male')).toBeNull()
    expect(computeScalars(80, null, 'male')).toBeNull()
    expect(computeScalars(0, 175, 'male')).toBeNull()
    expect(computeScalars(-5, 175, 'male')).toBeNull()
    expect(computeScalars(NaN, 175, 'male')).toBeNull()
    expect(computeScalars(401, 175, 'male')).toBeNull()
    expect(computeScalars(80, 29, 'male')).toBeNull()
    expect(computeScalars(80, 251, 'male')).toBeNull()
  })
})

describe('isWeightValid', () => {
  it('accepts 1..400 only', () => {
    expect(isWeightValid(1)).toBe(true)
    expect(isWeightValid(400)).toBe(true)
    expect(isWeightValid(0.5)).toBe(false)
    expect(isWeightValid(null)).toBe(false)
  })
})

describe('inputAdvisories', () => {
  it('flags soft-range values', () => {
    expect(inputAdvisories(1.5, 175).softWarnings.length).toBe(1)
    expect(inputAdvisories(300, 175).softWarnings.length).toBe(1)
    expect(inputAdvisories(70, 90).softWarnings.length).toBe(1)
    expect(inputAdvisories(70, 175).softWarnings).toEqual([])
  })
  it('flags adult-only banner for short, light or BMI >= 40', () => {
    expect(inputAdvisories(70, 135).adultOnly).toBe(true)
    expect(inputAdvisories(25, 175).adultOnly).toBe(true)
    expect(inputAdvisories(140, 170).adultOnly).toBe(true) // BMI 48
    expect(inputAdvisories(70, 175).adultOnly).toBe(false)
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/lib/biometrics.test.ts`
Expected: FAIL (module `./biometrics` not found).

- [ ] **Step 3: Implement `src/lib/biometrics.ts`**

```ts
export type Sex = 'male' | 'female'
export type ScalarKey = 'tbw' | 'ibw' | 'lbw'

export interface Scalars {
  tbw: number
  ibw: number
  lbw: number
  abw40: number
  bmi: number
}

export const WEIGHT_RANGE = { min: 1, max: 400 } as const
export const HEIGHT_RANGE = { min: 30, max: 250 } as const

const finite = (n: number | null): n is number => typeof n === 'number' && Number.isFinite(n)

export function isWeightValid(tbw: number | null): tbw is number {
  return finite(tbw) && tbw >= WEIGHT_RANGE.min && tbw <= WEIGHT_RANGE.max
}

function isHeightValid(h: number | null): h is number {
  return finite(h) && h >= HEIGHT_RANGE.min && h <= HEIGHT_RANGE.max
}

export function computeScalars(
  tbw: number | null,
  heightCm: number | null,
  sex: Sex,
): Scalars | null {
  if (!isWeightValid(tbw) || !isHeightValid(heightCm)) return null

  const bmi = tbw / (heightCm / 100) ** 2

  // Devine IBW; if TBW < IBW use TBW
  const devine = (sex === 'male' ? 50 : 45.5) + 0.905 * Math.max(0, heightCm - 152.4)
  const ibw = tbw < devine ? tbw : devine

  const abw40 = tbw > ibw ? ibw + 0.4 * (tbw - ibw) : tbw

  // Janmahasatian LBW, capped at TBW
  const rawLbw =
    sex === 'male'
      ? (9270 * tbw) / (6680 + 216 * bmi)
      : (9270 * tbw) / (8780 + 244 * bmi)
  const lbw = Math.min(rawLbw, tbw)

  return { tbw, ibw, lbw, abw40, bmi }
}

export function inputAdvisories(tbw: number | null, heightCm: number | null) {
  const softWarnings: string[] = []
  if (finite(tbw) && (tbw < 2 || tbw > 250)) softWarnings.push('Weight looks unusual: check input')
  if (finite(heightCm) && heightCm < 100) softWarnings.push('Height looks unusual: check input')

  const bmi =
    isWeightValid(tbw) && isHeightValid(heightCm) ? tbw / (heightCm / 100) ** 2 : null
  const adultOnly =
    (finite(heightCm) && heightCm < 140) ||
    (finite(tbw) && tbw < 30) ||
    (bmi !== null && bmi >= 40)
  return { softWarnings, adultOnly }
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/lib/biometrics.test.ts`
Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/biometrics.ts src/lib/biometrics.test.ts
git commit -m "feat: biometric scalars (BMI, Devine IBW, ABW40, Janmahasatian LBW)"
```

---

### Task 3: Drug catalogue, dosing and formatting

**Files:**
- Create: `src/lib/drugs.ts`, `src/lib/dosing.ts`, `src/lib/format.ts`
- Test: `src/lib/dosing.test.ts`

**Interfaces:**
- Consumes: `Scalars`, `ScalarKey` from `./biometrics`.
- Produces:
  - `type Category = 'Induction' | 'NMBA' | 'Reversal' | 'Vasopressor'`
  - `interface DoseOption { label: string; basis: 'perKg' | 'fixed'; low: number; high?: number }`
  - `interface Drug { id: string; name: string; category: Category; scalar: ScalarKey; unit: 'mg' | 'mcg'; options: DoseOption[]; maxMass?: number; concentrations: number[]; defaultConc: number; note?: string; companion?: Drug }` (`concentrations` are in `unit` per mL)
  - `DRUGS: Drug[]`, `CATEGORIES: Category[]`
  - `interface DoseResult { label: string; unit: 'mg' | 'mcg'; massLow: number; massHigh: number | null; volLow: number; volHigh: number | null; ceilingHit: boolean; uncappedHigh: number }`
  - `calcOption(drug: Drug, opt: DoseOption, scalars: Scalars, conc: number): DoseResult`
  - `fmtNum(n: number): string`, `fmtVol(ml: number): string`, `fmtRange(low: number, high: number | null, fmt?: (n: number) => string): string`

- [ ] **Step 1: Write the failing tests** (`src/lib/dosing.test.ts`)

```ts
import { describe, expect, it } from 'vitest'
import { computeScalars } from './biometrics'
import { DRUGS } from './drugs'
import { calcOption } from './dosing'
import { fmtNum, fmtRange, fmtVol } from './format'

const drug = (id: string) => DRUGS.find((d) => d.id === id)!
const male80 = computeScalars(80, 175, 'male')!

describe('calcOption', () => {
  it('propofol is dosed on LBW', () => {
    const p = drug('propofol')
    expect(p.scalar).toBe('lbw')
    const r = calcOption(p, p.options[0], male80, p.defaultConc)
    expect(r.massLow).toBeCloseTo(1.5 * male80.lbw, 6)
    expect(r.massHigh).toBeCloseTo(2.5 * male80.lbw, 6)
    expect(r.volLow).toBeCloseTo((1.5 * male80.lbw) / 10, 6)
  })

  it('rocuronium standard and RSI use IBW', () => {
    const r = drug('rocuronium')
    expect(r.scalar).toBe('ibw')
    expect(calcOption(r, r.options[0], male80, 10).massLow).toBeCloseTo(0.6 * male80.ibw, 6)
    expect(calcOption(r, r.options[1], male80, 10).massLow).toBeCloseTo(1.2 * male80.ibw, 6)
  })

  it('sugammadex has 2, 4 and 16 mg/kg on TBW', () => {
    const s = drug('sugammadex')
    expect(s.options.map((o) => o.low)).toEqual([2, 4, 16])
    expect(calcOption(s, s.options[2], male80, 100).massLow).toBe(1280)
    expect(calcOption(s, s.options[2], male80, 100).volLow).toBeCloseTo(12.8, 6)
  })

  it('succinylcholine caps at 200 mg for a heavy patient and reports the uncapped value', () => {
    const heavy = computeScalars(150, 175, 'male')!
    const sux = drug('succinylcholine')
    const r = calcOption(sux, sux.options[0], heavy, 20)
    expect(r.massLow).toBe(150) // 1.0 mg/kg, below cap
    expect(r.massHigh).toBe(200) // 1.5 mg/kg = 225 -> 200
    expect(r.ceilingHit).toBe(true)
    expect(r.uncappedHigh).toBe(225)
    expect(r.volHigh).toBe(10)
  })

  it('succinylcholine below cap is not flagged', () => {
    const sux = drug('succinylcholine')
    const r = calcOption(sux, sux.options[0], male80, 20)
    expect(r.ceilingHit).toBe(false)
    expect(r.massHigh).toBe(120)
  })

  it('neostigmine caps at 5 mg and collapses the range; glycopyrrolate caps at 1 mg', () => {
    const heavy = computeScalars(200, 180, 'male')!
    const neo = drug('neostigmine')
    const rn = calcOption(neo, neo.options[0], heavy, 1)
    expect(rn.massLow).toBe(5)
    expect(rn.massHigh).toBeNull()
    expect(rn.ceilingHit).toBe(true)
    const gly = neo.companion!
    const rg = calcOption(gly, gly.options[0], heavy, 0.2)
    expect(rg.massLow).toBe(1)
    expect(rg.ceilingHit).toBe(true)
    expect(rg.volLow).toBeCloseTo(5, 6)
  })

  it('phenylephrine and ephedrine are fixed boluses, independent of weight', () => {
    const phe = drug('phenylephrine')
    const r = calcOption(phe, phe.options[0], male80, 100)
    expect(r.unit).toBe('mcg')
    expect([r.massLow, r.massHigh]).toEqual([50, 100])
    expect([r.volLow, r.volHigh]).toEqual([0.5, 1])
    const eph = drug('ephedrine')
    const e = calcOption(eph, eph.options[0], male80, 5)
    expect([e.massLow, e.massHigh]).toEqual([5, 10])
    expect([e.volLow, e.volHigh]).toEqual([1, 2])
  })

  it('every drug default concentration is in its own concentration list', () => {
    for (const d of DRUGS) {
      expect(d.concentrations).toContain(d.defaultConc)
      if (d.companion) expect(d.companion.concentrations).toContain(d.companion.defaultConc)
    }
  })
})

describe('format', () => {
  it('fmtNum keeps sensible precision', () => {
    expect(fmtNum(105.4)).toBe('105')
    expect(fmtNum(42.27)).toBe('42.3')
    expect(fmtNum(3.5)).toBe('3.5')
    expect(fmtNum(0.8)).toBe('0.8')
    expect(fmtNum(0.05)).toBe('0.05')
  })
  it('fmtVol uses 0.01 below 1 mL, else 0.1', () => {
    expect(fmtVol(0.456)).toBe('0.46')
    expect(fmtVol(4.23)).toBe('4.2')
    expect(fmtVol(12.8)).toBe('12.8')
  })
  it('fmtRange collapses a null high', () => {
    expect(fmtRange(5, null)).toBe('5')
    expect(fmtRange(90, 150)).toBe('90–150')
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/lib/dosing.test.ts`
Expected: FAIL (modules not found).

- [ ] **Step 3: Implement `src/lib/drugs.ts`**

```ts
import type { ScalarKey } from './biometrics'

export type Category = 'Induction' | 'NMBA' | 'Reversal' | 'Vasopressor'

export interface DoseOption {
  label: string
  basis: 'perKg' | 'fixed'
  low: number
  high?: number
}

export interface Drug {
  id: string
  name: string
  category: Category
  scalar: ScalarKey
  unit: 'mg' | 'mcg'
  options: DoseOption[]
  maxMass?: number // absolute ceiling in `unit`
  concentrations: number[] // `unit` per mL
  defaultConc: number
  note?: string
  companion?: Drug
}

export const CATEGORIES: Category[] = ['Induction', 'NMBA', 'Reversal', 'Vasopressor']

const glycopyrrolate: Drug = {
  id: 'glycopyrrolate',
  name: 'Glycopyrrolate',
  category: 'Reversal',
  scalar: 'tbw',
  unit: 'mg',
  options: [{ label: '0.01 mg/kg', basis: 'perKg', low: 0.01 }],
  maxMass: 1,
  concentrations: [0.2],
  defaultConc: 0.2,
}

// Dose rates and scalars come from the spec. Vial concentrations are added defaults
// (editable per drug); see spec section 9.
export const DRUGS: Drug[] = [
  {
    id: 'propofol',
    name: 'Propofol',
    category: 'Induction',
    scalar: 'lbw',
    unit: 'mg',
    options: [{ label: 'Induction 1.5–2.5 mg/kg', basis: 'perKg', low: 1.5, high: 2.5 }],
    concentrations: [10],
    defaultConc: 10,
  },
  {
    id: 'etomidate',
    name: 'Etomidate',
    category: 'Induction',
    scalar: 'tbw',
    unit: 'mg',
    options: [{ label: 'Induction 0.2–0.3 mg/kg', basis: 'perKg', low: 0.2, high: 0.3 }],
    concentrations: [2],
    defaultConc: 2,
  },
  {
    id: 'ketamine',
    name: 'Ketamine',
    category: 'Induction',
    scalar: 'tbw',
    unit: 'mg',
    options: [{ label: 'Induction 1–2 mg/kg', basis: 'perKg', low: 1, high: 2 }],
    concentrations: [10, 50, 100],
    defaultConc: 10,
  },
  {
    id: 'rocuronium',
    name: 'Rocuronium',
    category: 'NMBA',
    scalar: 'ibw',
    unit: 'mg',
    options: [
      { label: 'Standard 0.6 mg/kg', basis: 'perKg', low: 0.6 },
      { label: 'RSI 1.2 mg/kg', basis: 'perKg', low: 1.2 },
    ],
    concentrations: [10],
    defaultConc: 10,
  },
  {
    id: 'succinylcholine',
    name: 'Succinylcholine',
    category: 'NMBA',
    scalar: 'tbw',
    unit: 'mg',
    options: [{ label: '1.0–1.5 mg/kg', basis: 'perKg', low: 1, high: 1.5 }],
    maxMass: 200,
    concentrations: [20, 100],
    defaultConc: 20,
  },
  {
    id: 'sugammadex',
    name: 'Sugammadex',
    category: 'Reversal',
    scalar: 'tbw',
    unit: 'mg',
    options: [
      { label: 'Routine 2 mg/kg', basis: 'perKg', low: 2 },
      { label: 'Deep 4 mg/kg', basis: 'perKg', low: 4 },
      { label: 'Immediate 16 mg/kg', basis: 'perKg', low: 16 },
    ],
    concentrations: [100],
    defaultConc: 100,
  },
  {
    id: 'neostigmine',
    name: 'Neostigmine + Glycopyrrolate',
    category: 'Reversal',
    scalar: 'tbw',
    unit: 'mg',
    options: [{ label: 'Neostigmine 0.05 mg/kg', basis: 'perKg', low: 0.05 }],
    maxMass: 5,
    concentrations: [1, 0.5],
    defaultConc: 1,
    companion: glycopyrrolate,
  },
  {
    id: 'phenylephrine',
    name: 'Phenylephrine',
    category: 'Vasopressor',
    scalar: 'tbw',
    unit: 'mcg',
    options: [{ label: 'Bolus 50–100 mcg', basis: 'fixed', low: 50, high: 100 }],
    concentrations: [100],
    defaultConc: 100,
    note: 'Diluted syringe (100 mcg/mL).',
  },
  {
    id: 'ephedrine',
    name: 'Ephedrine',
    category: 'Vasopressor',
    scalar: 'tbw',
    unit: 'mg',
    options: [{ label: 'Bolus 5–10 mg', basis: 'fixed', low: 5, high: 10 }],
    concentrations: [5, 50],
    defaultConc: 5,
  },
]
```

- [ ] **Step 4: Implement `src/lib/format.ts` and `src/lib/dosing.ts`**

`src/lib/format.ts`:

```ts
const trim = (s: string) => (s.includes('.') ? s.replace(/0+$/, '').replace(/\.$/, '') : s)

export function fmtNum(n: number): string {
  if (n >= 100) return String(Math.round(n))
  if (n >= 10) return trim(n.toFixed(1))
  return trim(n.toFixed(2))
}

export function fmtVol(ml: number): string {
  return ml < 1 ? trim(ml.toFixed(2)) : trim(ml.toFixed(1))
}

export function fmtRange(
  low: number,
  high: number | null,
  fmt: (n: number) => string = fmtNum,
): string {
  return high === null ? fmt(low) : `${fmt(low)}–${fmt(high)}`
}
```

`src/lib/dosing.ts`:

```ts
import type { Scalars } from './biometrics'
import type { Drug, DoseOption } from './drugs'

export interface DoseResult {
  label: string
  unit: 'mg' | 'mcg'
  massLow: number
  massHigh: number | null
  volLow: number
  volHigh: number | null
  ceilingHit: boolean
  uncappedHigh: number
}

export function calcOption(
  drug: Drug,
  opt: DoseOption,
  scalars: Scalars,
  conc: number,
): DoseResult {
  const kg = scalars[drug.scalar]
  const raw = (v: number) => (opt.basis === 'perKg' ? v * kg : v)
  const cap = (m: number) => (drug.maxMass === undefined ? m : Math.min(m, drug.maxMass))

  const rawLow = raw(opt.low)
  const rawHigh = raw(opt.high ?? opt.low)
  const low = cap(rawLow)
  const high = cap(rawHigh)
  const isRange = opt.high !== undefined && opt.high !== opt.low && low !== high

  return {
    label: opt.label,
    unit: drug.unit,
    massLow: low,
    massHigh: isRange ? high : null,
    volLow: low / conc,
    volHigh: isRange ? high / conc : null,
    ceilingHit: drug.maxMass !== undefined && rawHigh >= drug.maxMass,
    uncappedHigh: rawHigh,
  }
}
```

- [ ] **Step 5: Run to verify pass**

Run: `npx vitest run src/lib/dosing.test.ts`
Expected: all PASS. If a float equality (for example `toEqual([0.5, 1])`) fails by rounding, switch that assertion to `toBeCloseTo`.

- [ ] **Step 6: Commit**

```bash
git add src/lib
git commit -m "feat: drug catalogue, dose calculation and number formatting"
```

---

### Task 4: Local anesthetic maximums

**Files:**
- Create: `src/lib/localAnesthetics.ts`
- Test: `src/lib/localAnesthetics.test.ts`

**Interfaces:**
- Consumes: `isWeightValid` from `./biometrics`.
- Produces:
  - `interface LAAgent { id: string; name: string; mgPerKgPlain: number; mgPerKgEpi: number; absPlain: number; absEpi: number; concentrations: number[] /* percent */ }`
  - `LA_AGENTS: LAAgent[]`
  - `maxDoseMg(agent: LAAgent, epi: boolean, tbw: number): number`
  - `interface LAEntry { agentId: string; epi: boolean; volumeMl: number | null; conc: number }`
  - `interface LARow { agentId: string; name: string; mg: number; maxMg: number; fraction: number }`
  - `interface LAResult { rows: LARow[]; total: number; level: 'ok' | 'caution' | 'toxic'; worst: LARow | null }`
  - `evaluateLA(entries: LAEntry[], tbw: number | null): LAResult | null` (returns `null` if weight invalid)

- [ ] **Step 1: Write the failing tests** (`src/lib/localAnesthetics.test.ts`)

```ts
import { describe, expect, it } from 'vitest'
import { LA_AGENTS, evaluateLA, maxDoseMg } from './localAnesthetics'

const agent = (id: string) => LA_AGENTS.find((a) => a.id === id)!

describe('maxDoseMg', () => {
  it('lidocaine plain 4 mg/kg, epi 7 mg/kg, with absolute ceilings', () => {
    expect(maxDoseMg(agent('lidocaine'), false, 70)).toBe(280)
    expect(maxDoseMg(agent('lidocaine'), true, 70)).toBe(490)
    expect(maxDoseMg(agent('lidocaine'), false, 100)).toBe(300) // ceiling
    expect(maxDoseMg(agent('lidocaine'), true, 100)).toBe(500) // ceiling
  })
  it('bupivacaine plain 2 mg/kg, epi 2.5 mg/kg, ceilings 175/225', () => {
    expect(maxDoseMg(agent('bupivacaine'), false, 70)).toBe(140)
    expect(maxDoseMg(agent('bupivacaine'), true, 70)).toBe(175)
    expect(maxDoseMg(agent('bupivacaine'), false, 120)).toBe(175)
    expect(maxDoseMg(agent('bupivacaine'), true, 120)).toBe(225)
  })
})

describe('evaluateLA', () => {
  it('refuses without a valid weight', () => {
    expect(evaluateLA([], null)).toBeNull()
    expect(evaluateLA([], 0)).toBeNull()
  })

  it('converts mL x % to mg (1% = 10 mg/mL)', () => {
    const r = evaluateLA([{ agentId: 'lidocaine', epi: false, volumeMl: 10, conc: 1 }], 70)!
    expect(r.rows[0].mg).toBe(100)
    expect(r.rows[0].fraction).toBeCloseTo(100 / 280, 6)
    expect(r.level).toBe('ok')
  })

  it('lidocaine + bupivacaine crossing 1.0 is toxic and names the worst drug', () => {
    const r = evaluateLA(
      [
        { agentId: 'lidocaine', epi: false, volumeMl: 10, conc: 1 }, // 100/280 = 0.357
        { agentId: 'bupivacaine', epi: false, volumeMl: 20, conc: 0.5 }, // 100/140 = 0.714
      ],
      70,
    )!
    expect(r.total).toBeCloseTo(0.357 + 0.714, 2)
    expect(r.level).toBe('toxic')
    expect(r.worst!.agentId).toBe('bupivacaine')
  })

  it('below 0.8 is ok, 0.8 to below 1.0 is caution, exactly 1.0 is toxic', () => {
    const ok = evaluateLA([{ agentId: 'bupivacaine', epi: false, volumeMl: 22, conc: 0.5 }], 70)! // 110/140 = 0.786
    expect(ok.level).toBe('ok')
    const caution = evaluateLA([{ agentId: 'bupivacaine', epi: false, volumeMl: 23, conc: 0.5 }], 70)! // 115/140 = 0.821
    expect(caution.level).toBe('caution')
    const toxic = evaluateLA([{ agentId: 'bupivacaine', epi: false, volumeMl: 28, conc: 0.5 }], 70)! // 140/140 = 1
    expect(toxic.level).toBe('toxic')
  })

  it('blank, zero or negative volume counts as 0 and an unknown agent is ignored', () => {
    const r = evaluateLA(
      [
        { agentId: 'lidocaine', epi: false, volumeMl: null, conc: 1 },
        { agentId: 'lidocaine', epi: false, volumeMl: -5, conc: 1 },
        { agentId: 'nope', epi: false, volumeMl: 10, conc: 1 },
      ],
      70,
    )!
    expect(r.total).toBe(0)
    expect(r.rows.length).toBe(2)
    expect(r.level).toBe('ok')
  })
})
```

Note: because unknown agents are skipped, `r.rows` is not index-aligned with the input entries when an entry is skipped. The UI (Part 2, Task 9) only offers known agents, so its rows stay aligned.

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/lib/localAnesthetics.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `src/lib/localAnesthetics.ts`**

```ts
import { isWeightValid } from './biometrics'

export interface LAAgent {
  id: string
  name: string
  mgPerKgPlain: number
  mgPerKgEpi: number
  absPlain: number
  absEpi: number
  concentrations: number[] // percent
}

// Lidocaine and bupivacaine mg/kg values come from the spec. Absolute ceilings and
// the other agents are added standard values (spec section 9).
export const LA_AGENTS: LAAgent[] = [
  { id: 'lidocaine', name: 'Lidocaine', mgPerKgPlain: 4, mgPerKgEpi: 7, absPlain: 300, absEpi: 500, concentrations: [0.5, 1, 1.5, 2] },
  { id: 'bupivacaine', name: 'Bupivacaine', mgPerKgPlain: 2, mgPerKgEpi: 2.5, absPlain: 175, absEpi: 225, concentrations: [0.25, 0.5, 0.75] },
  { id: 'ropivacaine', name: 'Ropivacaine', mgPerKgPlain: 3, mgPerKgEpi: 3, absPlain: 200, absEpi: 200, concentrations: [0.2, 0.5, 0.75, 1] },
  { id: 'mepivacaine', name: 'Mepivacaine', mgPerKgPlain: 4, mgPerKgEpi: 7, absPlain: 400, absEpi: 550, concentrations: [1, 1.5, 2] },
  { id: 'chloroprocaine', name: 'Chloroprocaine', mgPerKgPlain: 11, mgPerKgEpi: 14, absPlain: 800, absEpi: 1000, concentrations: [2, 3] },
]

export function maxDoseMg(agent: LAAgent, epi: boolean, tbw: number): number {
  const perKg = epi ? agent.mgPerKgEpi : agent.mgPerKgPlain
  const abs = epi ? agent.absEpi : agent.absPlain
  return Math.min(perKg * tbw, abs)
}

export interface LAEntry {
  agentId: string
  epi: boolean
  volumeMl: number | null
  conc: number // percent
}

export interface LARow {
  agentId: string
  name: string
  mg: number
  maxMg: number
  fraction: number
}

export interface LAResult {
  rows: LARow[]
  total: number
  level: 'ok' | 'caution' | 'toxic'
  worst: LARow | null
}

export function evaluateLA(entries: LAEntry[], tbw: number | null): LAResult | null {
  if (!isWeightValid(tbw)) return null

  const rows: LARow[] = []
  for (const e of entries) {
    const agent = LA_AGENTS.find((a) => a.id === e.agentId)
    if (!agent) continue
    const vol = e.volumeMl !== null && Number.isFinite(e.volumeMl) && e.volumeMl > 0 ? e.volumeMl : 0
    const mg = e.conc * 10 * vol
    const maxMg = maxDoseMg(agent, e.epi, tbw)
    rows.push({ agentId: agent.id, name: agent.name, mg, maxMg, fraction: mg / maxMg })
  }

  const total = rows.reduce((s, r) => s + r.fraction, 0)
  // small epsilon so float error cannot hide an exact 1.0 or 0.8
  const level = total >= 1 - 1e-9 ? 'toxic' : total >= 0.8 - 1e-9 ? 'caution' : 'ok'
  const worst = rows.reduce<LARow | null>(
    (w, r) => (w === null || r.fraction > w.fraction ? r : w),
    null,
  )
  return { rows, total, level, worst }
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/lib/localAnesthetics.test.ts`
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/localAnesthetics.ts src/lib/localAnesthetics.test.ts
git commit -m "feat: local anesthetic maximums and fraction-of-maximum toxicity check"
```

---

### Task 5: Crisis calculators and protocol data

**Files:**
- Create: `src/lib/crisis.ts`
- Test: `src/lib/crisis.test.ts`

**Interfaces:**
- Consumes: `isWeightValid` from `./biometrics`.
- Produces:
  - `interface Step { id: string; text: string; detail?: string; critical?: boolean }`
  - `lastLipid(kg: number | null): { bolusMl: number; bolusCapped: boolean; uncappedBolusMl: number; infusionMlMin: number; infusionMlHr: number; maxTotalMl: number } | null`
  - `dantrolene(kg: number | null): { doseMg: number; vials: number; volumeMl: number; maxTotalMg: number } | null`
  - `ryanodex(kg: number | null): { doseMg: number; vials: number; volumeMl: number } | null`
  - `LAST_STEPS: Step[]`, `MH_STEPS: Step[]`
  - `interface CicoPlan { id: 'A' | 'B' | 'C' | 'D'; title: string; goal: string; steps: Step[]; failure: string }`
  - `CICO_PLANS: CicoPlan[]`

- [ ] **Step 1: Write the failing tests** (`src/lib/crisis.test.ts`)

```ts
import { describe, expect, it } from 'vitest'
import { CICO_PLANS, LAST_STEPS, MH_STEPS, dantrolene, lastLipid, ryanodex } from './crisis'

describe('lastLipid', () => {
  it('1.5 mL/kg bolus, 0.25 mL/kg/min infusion, 12 mL/kg total', () => {
    const r = lastLipid(60)!
    expect(r.bolusMl).toBe(90)
    expect(r.bolusCapped).toBe(false)
    expect(r.infusionMlMin).toBe(15)
    expect(r.infusionMlHr).toBe(900)
    expect(r.maxTotalMl).toBe(720)
  })
  it('caps the bolus at 100 mL and reports the uncapped value', () => {
    const r = lastLipid(120)!
    expect(r.bolusMl).toBe(100)
    expect(r.bolusCapped).toBe(true)
    expect(r.uncappedBolusMl).toBe(180)
  })
  it('returns null for invalid weight', () => {
    expect(lastLipid(null)).toBeNull()
    expect(lastLipid(0)).toBeNull()
    expect(lastLipid(NaN)).toBeNull()
  })
})

describe('dantrolene / ryanodex', () => {
  it('80 kg: 200 mg = 10 x 20 mg vials = 600 mL (60 mL per vial); 10 mg/kg ceiling 800 mg', () => {
    const d = dantrolene(80)!
    expect(d.doseMg).toBe(200)
    expect(d.vials).toBe(10)
    expect(d.volumeMl).toBeCloseTo(600, 6)
    expect(d.maxTotalMg).toBe(800)
  })
  it('80 kg ryanodex: 200 mg = 1 x 250 mg vial = 4 mL (50 mg/mL)', () => {
    const r = ryanodex(80)!
    expect(r.doseMg).toBe(200)
    expect(r.vials).toBe(1)
    expect(r.volumeMl).toBe(4)
  })
  it('rounds vials up', () => {
    expect(dantrolene(70)!.vials).toBe(9) // 175 mg / 20
    expect(ryanodex(110)!.vials).toBe(2) // 275 mg / 250
  })
  it('null on invalid weight', () => {
    expect(dantrolene(null)).toBeNull()
    expect(ryanodex(-1)).toBeNull()
  })
})

describe('protocol data', () => {
  it('has unique step ids and non-empty lists', () => {
    for (const steps of [LAST_STEPS, MH_STEPS, ...CICO_PLANS.map((p) => p.steps)]) {
      const ids = steps.map((s) => s.id)
      expect(new Set(ids).size).toBe(ids.length)
      expect(steps.length).toBeGreaterThan(0)
    }
    expect(MH_STEPS[0].text.toLowerCase()).toContain('volatile')
  })
  it('CICO runs A to D and D is front-of-neck access', () => {
    expect(CICO_PLANS.map((p) => p.id)).toEqual(['A', 'B', 'C', 'D'])
    expect(CICO_PLANS[3].title.toLowerCase()).toContain('front of neck')
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/lib/crisis.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `src/lib/crisis.ts`**

```ts
import { isWeightValid } from './biometrics'

export interface Step {
  id: string
  text: string
  detail?: string
  critical?: boolean
}

export function lastLipid(kg: number | null) {
  if (!isWeightValid(kg)) return null
  const uncappedBolusMl = 1.5 * kg
  const bolusMl = Math.min(uncappedBolusMl, 100)
  const infusionMlMin = 0.25 * kg
  return {
    bolusMl,
    bolusCapped: uncappedBolusMl > 100,
    uncappedBolusMl,
    infusionMlMin,
    infusionMlHr: infusionMlMin * 60,
    maxTotalMl: 12 * kg, // added: ASRA upper limit for total 20% lipid
  }
}

export function dantrolene(kg: number | null) {
  if (!isWeightValid(kg)) return null
  const doseMg = 2.5 * kg
  return {
    doseMg,
    vials: Math.ceil(doseMg / 20), // added: 20 mg vials
    volumeMl: (doseMg * 60) / 20, // added: each 20 mg vial reconstituted in 60 mL
    maxTotalMg: 10 * kg, // added: cumulative 10 mg/kg flag
  }
}

export function ryanodex(kg: number | null) {
  if (!isWeightValid(kg)) return null
  const doseMg = 2.5 * kg
  return {
    doseMg,
    vials: Math.ceil(doseMg / 250), // added: 250 mg vials
    volumeMl: doseMg / 50, // added: 50 mg/mL after reconstitution (250 mg in 5 mL)
  }
}

export const LAST_STEPS: Step[] = [
  { id: 'stop', text: 'STOP injecting local anesthetic', critical: true },
  { id: 'help', text: 'CALL FOR HELP; get the lipid emulsion and a LAST kit', critical: true },
  { id: 'airway', text: 'Airway: 100% O2, ventilate, secure the airway if needed' },
  { id: 'seizure', text: 'Seizures: benzodiazepine first', detail: 'Avoid propofol in large doses' },
  { id: 'bolus', text: 'Give 20% lipid emulsion bolus', detail: 'Over 2–3 min (dose above)', critical: true },
  { id: 'infusion', text: 'Start lipid infusion', detail: 'Rate above; continue ≥10 min after circulatory stability' },
  { id: 'repeat', text: 'No response: repeat bolus once or twice and double the infusion rate', detail: 'Keep within the 12 mL/kg total' },
  { id: 'arrest', text: 'Cardiac arrest: CPR; reduced-dose epinephrine ≤1 mcg/kg', detail: 'Avoid vasopressin, calcium-channel blockers, beta-blockers and further local anesthetic' },
  { id: 'monitor', text: 'Monitor ≥4–6 h (≥12 h if cardiac event); notify ICU and the LAST registry' },
]

export const MH_STEPS: Step[] = [
  { id: 'volatile', text: 'STOP volatile agents and succinylcholine', critical: true },
  { id: 'help', text: 'CALL FOR HELP; call the MH hotline', critical: true },
  { id: 'o2', text: 'Hyperventilate with 100% O2 at high flow (10 L/min or more)', critical: true },
  { id: 'circuit', text: 'Switch to a clean circuit or machine if possible; continue anesthesia with TIVA' },
  { id: 'dantrolene', text: 'Give dantrolene as soon as possible', detail: 'Dose above; repeat until signs resolve (cumulative ceiling shown)', critical: true },
  { id: 'cool', text: 'Active cooling: stop when temperature < 38 °C', detail: 'Cold IV saline, surface ice, cool lavage' },
  { id: 'k', text: 'Treat hyperkalaemia and arrhythmia; check K+, ABG, CK, lactate' },
  { id: 'urine', text: 'Insert a urinary catheter; keep urine output > 1 mL/kg/h (myoglobinuria)' },
  { id: 'icu', text: 'Admit to ICU; monitor for recurrence for ≥24 h' },
]

export interface CicoPlan {
  id: 'A' | 'B' | 'C' | 'D'
  title: string
  goal: string
  steps: Step[]
  failure: string
}

export const CICO_PLANS: CicoPlan[] = [
  {
    id: 'A',
    title: 'Plan A: Face-mask ventilation and tracheal intubation',
    goal: 'Maximum 3 attempts at laryngoscopy, then move on.',
    steps: [
      { id: 'a-pos', text: 'Optimise position and pre-oxygenate (ramped, 100% O2)' },
      { id: 'a-nmb', text: 'Confirm full neuromuscular blockade' },
      { id: 'a-ext', text: 'Optimise laryngoscopy: BURP, bougie, video-laryngoscope' },
      { id: 'a-three', text: 'Limit to 3 attempts; call for help after the first failure', critical: true },
    ],
    failure: 'Failed intubation: go to Plan B (supraglottic airway).',
  },
  {
    id: 'B',
    title: 'Plan B: Maintain oxygenation with a supraglottic airway',
    goal: 'Maximum 3 insertion attempts.',
    steps: [
      { id: 'b-sad', text: 'Insert a 2nd-generation supraglottic airway' },
      { id: 'b-cuff', text: 'Check cuff pressure; confirm capnography trace' },
      { id: 'b-ox', text: 'Oxygenation adequate? If yes, wake or intubate through the device per local plan' },
    ],
    failure: 'Cannot oxygenate through the device: go to Plan C.',
  },
  {
    id: 'C',
    title: 'Plan C: Final attempt at face-mask ventilation',
    goal: 'Last non-invasive attempt while preparing for Plan D.',
    steps: [
      { id: 'c-nmb', text: 'Ensure paralysis (consider rocuronium + sugammadex 16 mg/kg)', critical: true },
      { id: 'c-mask', text: 'Two-handed jaw thrust, oropharyngeal and nasopharyngeal airways' },
      { id: 'c-prep', text: 'Open the front-of-neck kit now', critical: true },
    ],
    failure: 'CICO persists: go to Plan D immediately.',
  },
  {
    id: 'D',
    title: 'Plan D: Emergency front of neck access (eFONA)',
    goal: 'Scalpel-bougie-tube technique.',
    steps: [
      { id: 'd-announce', text: 'Announce "CICO: performing front-of-neck access"', critical: true },
      { id: 'd-neck', text: 'Extend the neck; palpate the laryngeal handshake' },
      { id: 'd-cut', text: 'Scalpel: transverse stab through the cricothyroid membrane, rotate the blade 90°', critical: true },
      { id: 'd-bougie', text: 'Slide the bougie along the blade into the trachea; railroad a 6.0 cuffed tube' },
      { id: 'd-confirm', text: 'Inflate the cuff, ventilate, confirm with capnography' },
    ],
    failure: 'If the neck is not palpable: vertical midline incision first, then proceed.',
  },
]
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/lib/crisis.test.ts`
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/crisis.ts src/lib/crisis.test.ts
git commit -m "feat: LAST, MH and CICO calculators and protocol data"
```

---

### Task 6: Routine checklists and PACU summary builder

**Files:**
- Create: `src/lib/checklists.ts`, `src/lib/clipboard.ts`
- Test: `src/lib/checklists.test.ts`

**Interfaces:**
- Produces:
  - `interface ChecklistItem { id: string; text: string; detail?: string; critical?: boolean }` (structurally the same as `Step`)
  - `WHO_ITEMS: ChecklistItem[]`, `EXTUBATION_ITEMS: ChecklistItem[]`
  - `type PacuKey = 'asa' | 'procedure' | 'anesthetic' | 'airway' | 'access' | 'meds' | 'fluids' | 'events' | 'pain' | 'nausea' | 'concerns'`
  - `interface PacuField { key: PacuKey; label: string; multiline?: boolean; placeholder?: string }`
  - `PACU_FIELDS: PacuField[]`
  - `buildPacuSummary(values: Partial<Record<PacuKey, string>>): string`
  - `copyText(text: string): Promise<boolean>` (in `clipboard.ts`)

- [ ] **Step 1: Write the failing tests** (`src/lib/checklists.test.ts`)

```ts
import { describe, expect, it } from 'vitest'
import { EXTUBATION_ITEMS, PACU_FIELDS, WHO_ITEMS, buildPacuSummary } from './checklists'

describe('checklist data', () => {
  it('has unique ids', () => {
    for (const list of [WHO_ITEMS, EXTUBATION_ITEMS]) {
      const ids = list.map((i) => i.id)
      expect(new Set(ids).size).toBe(ids.length)
      expect(list.length).toBeGreaterThan(4)
    }
  })
  it('PACU form has no identifier fields', () => {
    const text = PACU_FIELDS.map((f) => f.label.toLowerCase()).join(' ')
    for (const banned of ['name', 'mrn', 'birth', 'dob', 'address', 'phone']) {
      expect(text).not.toContain(banned)
    }
  })
})

describe('buildPacuSummary', () => {
  it('includes only filled fields, trimmed, in field order', () => {
    const out = buildPacuSummary({ procedure: '  Lap chole ', asa: '2', pain: '' })
    const lines = out.split('\n')
    expect(lines[0]).toBe('PACU HANDOFF')
    expect(out).toContain('ASA class: 2')
    expect(out).toContain('Procedure: Lap chole')
    expect(out).not.toContain('Pain')
    expect(out.indexOf('ASA class')).toBeLessThan(out.indexOf('Procedure'))
  })
  it('empty input still returns a header and a note', () => {
    const out = buildPacuSummary({})
    expect(out.startsWith('PACU HANDOFF')).toBe(true)
    expect(out).toContain('No details entered')
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/lib/checklists.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `src/lib/checklists.ts` and `src/lib/clipboard.ts`**

`src/lib/checklists.ts`:

```ts
export interface ChecklistItem {
  id: string
  text: string
  detail?: string
  critical?: boolean
}

export const WHO_ITEMS: ChecklistItem[] = [
  { id: 'who-id', text: 'Patient identity, procedure, site and consent confirmed' },
  { id: 'who-site', text: 'Surgical site marked (if applicable)' },
  { id: 'who-machine', text: 'Anesthesia machine and medication check complete', detail: 'Leak test, backup ventilation, suction' },
  { id: 'who-ox', text: 'Pulse oximeter on and functioning' },
  { id: 'who-allergy', text: 'Known allergy?', critical: true },
  { id: 'who-airway', text: 'Difficult airway or aspiration risk? Equipment and help available', critical: true },
  { id: 'who-blood', text: 'Risk of blood loss > 500 mL: IV access and fluids planned' },
  { id: 'who-abx', text: 'Antibiotic prophylaxis given within the last 60 minutes, if indicated' },
  { id: 'who-drugs', text: 'Emergency drugs drawn up or immediately available', detail: 'Vasopressors, succinylcholine, atropine' },
  { id: 'who-pos', text: 'Positioning and pressure points checked' },
]

export const EXTUBATION_ITEMS: ChecklistItem[] = [
  { id: 'ext-reversal', text: 'Neuromuscular blockade reversed', detail: 'TOF ratio ≥ 0.9 on quantitative monitoring', critical: true },
  { id: 'ext-resp', text: 'Spontaneous breathing: adequate rate and tidal volume' },
  { id: 'ext-sat', text: 'SpO2 adequate on low FiO2; EtCO2 acceptable' },
  { id: 'ext-aware', text: 'Awake: eyes open, follows commands, or deep anesthetic level planned' },
  { id: 'ext-reflex', text: 'Airway reflexes present: cough, swallow' },
  { id: 'ext-hemo', text: 'Hemodynamically stable' },
  { id: 'ext-temp', text: 'Temperature acceptable; shivering controlled' },
  { id: 'ext-pain', text: 'Analgesia in place; nausea prophylaxis given' },
  { id: 'ext-suction', text: 'Oropharynx suctioned; throat pack removed' },
  { id: 'ext-rescue', text: 'Re-intubation equipment ready and difficult-airway plan known', critical: true },
]

export type PacuKey =
  | 'asa'
  | 'procedure'
  | 'anesthetic'
  | 'airway'
  | 'access'
  | 'meds'
  | 'fluids'
  | 'events'
  | 'pain'
  | 'nausea'
  | 'concerns'

export interface PacuField {
  key: PacuKey
  label: string
  multiline?: boolean
  placeholder?: string
}

export const PACU_FIELDS: PacuField[] = [
  { key: 'asa', label: 'ASA class', placeholder: 'e.g. 2' },
  { key: 'procedure', label: 'Procedure', placeholder: 'Procedure type (no names)' },
  { key: 'anesthetic', label: 'Anesthetic', placeholder: 'GA / regional / MAC' },
  { key: 'airway', label: 'Airway', placeholder: 'ETT / LMA / grade of view' },
  { key: 'access', label: 'Lines and access', placeholder: 'PIV x2, art line' },
  { key: 'meds', label: 'Key meds given', multiline: true, placeholder: 'Opioids, antiemetics, reversal, antibiotics' },
  { key: 'fluids', label: 'Fluids, EBL and urine output', placeholder: 'e.g. 1000 mL crystalloid, EBL 100 mL' },
  { key: 'events', label: 'Intra-op events', multiline: true },
  { key: 'pain', label: 'Pain score', placeholder: '0–10' },
  { key: 'nausea', label: 'Nausea / vomiting' },
  { key: 'concerns', label: 'Post-op concerns and plan', multiline: true },
]

export function buildPacuSummary(values: Partial<Record<PacuKey, string>>): string {
  const lines = PACU_FIELDS.flatMap((f) => {
    const v = (values[f.key] ?? '').trim()
    return v ? [`${f.label}: ${v}`] : []
  })
  return ['PACU HANDOFF', ...(lines.length ? lines : ['No details entered'])].join('\n')
}
```

`src/lib/clipboard.ts`:

```ts
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // fall through to legacy path
  }
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  } catch {
    return false
  }
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run`
Expected: every test file so far PASSES.

- [ ] **Step 5: Commit**

```bash
git add src/lib
git commit -m "feat: WHO, extubation and PACU checklist data with summary builder"
```

---

Part 1 ends here. Continue with `docs/superpowers/plans/2026-10-09-anesthassist-part2-ui.md` (Tasks 7–12).
