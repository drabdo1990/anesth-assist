# AnesthAssist: Design Spec (offline anesthesia decision-support PWA)

Status: approved by the user on 2026-10-09 (design sections 1-3 and the written spec).

## 1. Purpose and constraints
A bedside cognitive aid for anesthesia providers in routine cases and emergencies.
- **From the user:**
  - 100% client-side calculation, with no network calls, no auth, no telemetry and no PHI.
  - Dark theme only.
  - Touch targets of at least 48px.
  - Stack: Vite, React 19, TypeScript, Tailwind, Lucide, Radix, Zustand (persisted), vite-plugin-pwa (`autoUpdate`).
  - Four tabs behind a sticky bottom nav: Calculator, Crisis Cards, Local Max / Blocks, Checklists & PACU.
  - Exact biometric formulas; a permanent disclaimer; no mock data.
- **Agreed:** constants not in the spec use standard published values (ASRA, MHAUS, DAS) and are flagged for review (`source: 'added'` in the data files, and listed in section 9).
- **Success:** every number in the app is produced by a tested pure function, and the app works fully offline after the first load.

## 2. Architecture (data-driven; logic separate from rendering)
```
src/lib/biometrics.ts        bmi, devineIBW, abw40, janmahasatianLBW, computeScalars
src/lib/drugs.ts             typed drug catalogue
src/lib/dosing.ts            calcDose(def, scalars, conc)
src/lib/localAnesthetics.ts  max-dose table, maxMg, fraction sum
src/lib/crisis.ts            LAST, dantrolene/Ryanodex calculators; CICO/MH step data
src/lib/checklists.ts        WHO, extubation, PACU templates
src/store.ts                 Zustand persist store
src/components/              BiometricBar, ScalarBadge, DrugCard, Stepper, Checklist, Timer, BottomNav, Disclaimer
src/views/                   CalculatorView, CrisisView, LocalMaxView, ChecklistsView
src/lib/*.test.ts            Vitest unit tests
```
`lib/` is pure TypeScript with no React or I/O.

## 3. Calculation layer
- **Biometrics (exact):**
  - BMI = TBW/(h/100)².
  - Devine IBW: male `50 + 0.905·max(0, h−152.4)`, female `45.5 + …`. If TBW < IBW, IBW = TBW.
  - ABW40 = IBW + 0.4·(TBW−IBW) if TBW > IBW, else TBW.
  - Janmahasatian LBW: male `9270·TBW/(6680+216·BMI)`, female `9270·TBW/(8780+244·BMI)`, capped at TBW.
  - Invalid input (empty, zero, negative, NaN) returns `null`, never a misleading number.
- **Drug record:** `{id, name, category, scalar: TBW|IBW|LBW, doses[{label, perKg|fixed, unit}], maxDoseMg?, concentrations[], defaultConc, source}`.
- **`calcDose` output:** `{mass, unit, volumeMl, scalarUsed, scalarKg, capped, uncapped}`.
- **Catalogue:**
  - Propofol 1.5–2.5 mg/kg on LBW (10 mg/mL).
  - Etomidate 0.2–0.3 mg/kg on TBW (2 mg/mL).
  - Ketamine 1–2 mg/kg on TBW (10 mg/mL).
  - Rocuronium 0.6 mg/kg standard and 1.2 mg/kg RSI on IBW (10 mg/mL).
  - Succinylcholine 1.0–1.5 mg/kg on TBW (20 mg/mL), max 200 mg.
  - Sugammadex 2, 4 and 16 mg/kg on TBW (100 mg/mL).
  - Neostigmine 0.05 mg/kg on TBW, max 5 mg (1 mg/mL), linked to glycopyrrolate 0.01 mg/kg, max 1 mg (0.2 mg/mL), as one card.
  - Phenylephrine 50–100 mcg fixed bolus (100 mcg/mL).
  - Ephedrine 5–10 mg fixed bolus (5 mg/mL).
  - Vial concentration is selectable per drug.
- **Local anesthetics:**
  - `maxMg = min(mgPerKg × TBW, absolute)`.
  - Lidocaine: 4 mg/kg plain, 7 mg/kg with epinephrine (spec). Absolute 300/500 mg (added).
  - Bupivacaine: 2 / 2.5 mg/kg (spec). Absolute 175/225 mg (added).
  - Ropivacaine 3 mg/kg, absolute 200 mg. Mepivacaine and chloroprocaine are included as added entries.
  - Input is mL × % concentration (`mg = % × 10 × mL`).
  - Fraction `Σ(doseMg/maxMg)`: green below 0.8, amber from 0.8 to below 1.0, crimson "TOXIC RISK" at 1.0 or above, naming the drug.
- **Crisis:**
  - LAST: lipid 20% bolus 1.5 mL/kg over 2–3 min (max 100 mL), then infusion 0.25 mL/kg/min shown as mL/min and mL/h. Total 12 mL/kg tracked.
  - MH: dantrolene 2.5 mg/kg (20 mg vials, 60 mL sterile water each, 0.33 mg/mL), with vial count and mL. Ryanodex 2.5 mg/kg (250 mg vials, 50 mg/mL), with vial count and mL. Cumulative 10 mg/kg flag (added).
  - CICO: DAS Plan A → B → C → D with failure criteria on each, ending in eFONA (scalpel-bougie-tube).

## 4. State and persistence
- One Zustand store with `persist` (versioned): `weightKg`, `heightCm`, `sex`, per-drug concentration overrides.
- Not persisted, in memory only: checklist ticks, timers, local-anesthetic entries and PACU text.
- Scalars are derived with `useMemo` and never stored.
- "Clear biometrics" resets the persisted values.

## 5. UI shell and ergonomics
- The active tab is local state, with no router or URL.
- Layout: sticky `BiometricBar` (Calculator and Local Max tabs; Crisis tab shows a compact weight readout), the scrolling view, the permanent disclaimer, and the bottom nav.
- Bottom nav: four tabs at 56px or taller. Checklist rows and stepper buttons are also 56px or taller. Every touch target is at least 48px.
- Biometric bar: kg stepper and direct numeric entry, a cm field, a Radix ToggleGroup for sex, and a pill strip (BMI, IBW, LBW, ABW40).
- Numbers are large, bold and `font-mono` with `tabular-nums`. Scalar badges are text, for example `[IBW: 62 kg]`.
- Colour never carries meaning alone: warnings also have an icon and a word ("CAPPED", "TOXIC RISK").
- Palette: background `#090d16`, cards `#131b2e`, borders `#1e293b`, cyan `#06b6d4`, crimson `#ef4444`, emerald `#10b981`.
- Disclaimer text: "Educational and cognitive aid. Clinical judgment supersedes all calculated suggestions." The spec's spelling "supercedes" is corrected.
- Timer: a 2-minute CPR/rhythm-check cycle with a visual flash and a WebAudio beep, started from the user's tap so audio is permitted. CICO shows a "CALL FOR HELP" banner and an elapsed timer.
- Checklists: a large check target that turns emerald when ticked, with a reset. The PACU handoff has a "Copy Summary to Clipboard" action (`navigator.clipboard`, `execCommand` fallback) built only from the displayed fields.

## 6. Safety and edge cases
- Hard range: 1–400 kg and 30–250 cm. Outside it, all doses and scalar pills show "Enter valid weight/height".
- Soft warning band (below 2 kg, above 250 kg, below 100 cm): numbers are shown with a "check input" flag.
- A banner appears when height is below 140 cm, weight is below 30 kg, or BMI is 40 or above: "Formulas are adult-oriented. Verify independently."
- Caps are visible: a "CAPPED at 200 mg" flag with the uncapped figure in small text. Ranges show both ends. Volumes round to 0.1 mL, or 0.01 mL below 1 mL.
- The local-anesthetic checker refuses to compute without a weight, and applies absolute ceilings even when mg/kg × weight is higher.
- Privacy: no network APIs, analytics, auth or cookies. The PACU form has no identifier fields and a "Do not enter names, MRNs or DOBs" note.

## 7. PWA
- `vite-plugin-pwa` with `registerType: 'autoUpdate'`, precaching all built assets, and a manifest with a standalone display mode.
- Icons (192, 512, maskable) are generated once with sharp.
- There are no runtime fetches, so the offline experience is identical to the online one.

## 8. Testing and verification
1. **Vitest:**
   - biometrics against hand-computed values (male 175 cm / 80 kg; the IBW > TBW fallback; the LBW cap);
   - dose and cap logic (succinylcholine 200 mg, neostigmine 5 mg, glycopyrrolate 1 mg, lipid 100 mL);
   - local-anesthetic fractions (a lidocaine + bupivacaine case that crosses 1.0);
   - the lipid, dantrolene and Ryanodex calculators.
2. `npm run build`: `tsc` clean, and the service worker and manifest are generated.
3. **Manual in the built-in browser:**
   - a 375×812 viewport on all four tabs, with no horizontal scroll;
   - touch-target sizes;
   - the numbers against the tests;
   - persistence of biometrics only after reload;
   - the clipboard output;
   - an offline reload after the service worker installs.
4. A grep for `fetch(`, `XMLHttpRequest` and analytics to confirm there is no network use.

## 9. Added constants to review (not in your spec)
Absolute local-anesthetic ceilings (lidocaine 300/500 mg, bupivacaine 175/225 mg, ropivacaine 200 mg); ropivacaine, mepivacaine and chloroprocaine entries; lipid total 12 mL/kg; dantrolene vial size, reconstitution and the 10 mg/kg flag; Ryanodex vial size and concentration; default vial concentrations; the 0.8 amber threshold; the soft input ranges and the pediatric/obesity banner thresholds.
Lidocaine uses 4 mg/kg plain as written, although many references use 4.5.

## 10. Out of scope
Pediatric-specific dosing, drug-interaction checking, infusion calculators, user-editable drug lists, cloud sync.

## 11. Note on process
Project dependencies were installed in the project folder before the design gate. Nothing else has been written. A clinician must verify all constants before any real use. The app is labelled an educational aid and is not a validated medical device.
