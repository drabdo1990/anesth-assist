# AnesthAssist

An offline, mobile-first cognitive aid for anesthesia providers in the operating room: dosing, airway sizing, ventilation settings, checklists and emergency pathways (LAST, malignant hyperthermia, CICO).

**Live demo:** _add deployed URL here_ (load once online, then it works offline; add to home screen to install).

**Feedback welcome:** clinicians are invited to challenge doses, safety wording and usability. Please open an issue and cite a source for any correction.

> **Educational and cognitive aid. Clinical judgment supercedes all calculated suggestions.**
>
> It is not an electronic health record, a patient monitor, a prescribing system or a remote decision-making tool.

## Clinical data status: draft, needs clinician sign-off

The reference layer in `src/data/` was transcribed from product labels (DailyMed) and published references. Several primary texts could not be read in the build session (ASRA, MHAUS, EMHG, ASA 2022 full texts). Each source carries a `verification` field (`primary`, `label` or `secondary`) and an `accessNote`, and the in-app **References** view lists every source with the values derived from it.

**A qualified clinician must review the data before any clinical use.** Where no high-quality source value was available, the app shows **"No high-quality source value specified."** instead of a number. That includes face-mask sizing by contour, video-laryngoscope geometry and most scenario-specific ventilation settings. Aspiration prophylaxis, metaraminol, epinephrine bolus and PONV agents have **no calculated dose**; their label or guideline figures are listed in the in-app reference list instead.

## Run locally

```bash
npm ci
npm run dev        # http://localhost:5173
npm test           # unit tests (clinical calculations and data integrity; 455 tests)
npm run verify     # tests + type-check + production build
```

Requires Node 22+.

## Build and deploy for offline use

```bash
npm run build      # type-check (strict), build, generate the service worker
npm run preview    # serve dist/ locally to test offline behaviour
```

`vite-plugin-pwa` precaches the app shell, bundle, icons and manifest. The app data makes no network requests after the first load; the service worker checks every 15 minutes for an update and **waits** for the clinician to tap “Update ready”. It never reloads a live case automatically. To check offline use: open `npm run preview`, load once, then switch the browser to Offline and reload.

Deploy the `dist/` folder to any static host. `vercel.json` already sets cache headers (service worker and manifest are never cached; hashed assets are immutable).

PWA icons are generated from the favicon artwork by `python scripts/generate-icons.py` (needs `pip install pillow`). Re-run only if you change the logo.

## Android App & Google Play Release

AnesthAssist is packaged as an offline-first native Android application using **Capacitor**:
* **Application ID:** `online.anesthassist.app`
* **Google Play Title:** `AnesthAssist: OR Decision Aid`
* **Official Production Domain:** `https://anesthassist.online`

### Cloud Compilation via GitHub Actions
Before the first release, configure the four signing secrets described in [docs/google-play-keystore-setup.md](docs/google-play-keystore-setup.md). Tagged releases (`v*`) fail if the secrets are missing; manual runs without them produce an unsigned bundle.

To generate a production-ready, signed **Android App Bundle (`.aab`)**:
1. Go to the repository's **Actions** tab on GitHub: [drabdo1990/anesth-helper Actions](https://github.com/drabdo1990/anesth-helper/actions/workflows/android-release.yml).
2. Select **Build & Sign Android App Bundle** and click **Run workflow**.
3. Once completed, download the signed **`anesthassist-release-aab`** artifact and upload it directly to Google Play Console.

### Setup & Play Store Documentation
* **Upload Keystore & Secrets:** See [docs/google-play-keystore-setup.md](docs/google-play-keystore-setup.md).
* **Store Listing Copy & Data Safety Form:** See [docs/google-play-listing.md](docs/google-play-listing.md).
* **Feature Graphic (1024x500):** Generated at `public/feature-graphic.png` via `python scripts/generate-feature-graphic.py`.

## App structure

The bottom bar has three case phases plus a **Plans** tab of rapid case-type cards (pediatric, obstetric cesarean under neuraxial, obesity, RSI / full stomach) that group items already in the app and add no new clinical statements. A **Diseases** tab searches, offline, the complete catalog of 110 conditions from Stoelting's *Anesthesia and Co-Existing Disease* (8th edition), each with a full four-section perioperative plan (Pre-op, Intra-op, Avoid, Post-op). **Pre-op** holds an Assess section (serum creatinine, Cockcroft-Gault creatinine clearance, the RCRI and STOP-Bang) and a Medications section (SGLT2 inhibitors and DOACs with the manufacturers' label wording; the ASRA intervals for spinal, epidural and deep blocks with warfarin, heparins, fondaparinux, DOACs, antiplatelet drugs and thrombolytics; the AHA/ACC and ESC statements on beta-blockers, statins, RAAS inhibitors, antiplatelet drugs after a stent and bridging; and a pointer for GLP-1 agonists) above the Fasting / NPO checklist. A **Pre-op note** below the Fasting / NPO checklist builds an anonymous plain-text summary (with a Copy button) of the numbers, ASA class, fasting status, scores and ticked medications. **Intra-op** holds Dosing, Airway, Vent and Lists, with a switch at the top. **Post-op** holds the Apfel PONV risk score (adults) with what the 2025 consensus advises, the modified Aldrete score and PADSS with their 9-of-10 discharge mark, the 4AT delirium screen, the emergence checklist and the handoff summary. The rows below describe each tool.

| Tab / control | What it does |
|---|---|
| **Dosing** | Adult and pediatric drug cards in eight categories. Includes an interactive Adult / Pediatric segmented mode switch (auto-defaults to Pediatric when patient age < 18). In Pediatric mode, calculations strictly lock to actual body weight (TBW), auto-match age brackets (e.g. Infant vs. Child), enforce hard caps at adult single-dose maximum ceilings, and pre-select safe pediatric dilution presets (e.g. Fentanyl 10 mcg/mL, Atropine 0.1 mg/mL) with preparation steps and exact volume (mL) calculations. The tab also holds a local anesthetic calculator with pediatric thresholds, a neuraxial reference, and a searchable reference-drug list. |
| **Airway** | Adult and pediatric ETT/blade summaries, age-gated DLT sizing, LMA size by weight, OPA/NPA landmarks, ASA difficult-airway principles. |
| **Vent** | Scenario selector, tidal volume from **PBW** (adult age required; never actual weight), minute ventilation, I:E timing, plateau and driving-pressure warnings, mode/alarm/troubleshooting prompts. |
| **Lists** | Pre-induction, a sourced Fasting / NPO checklist (routine, pediatric, obstetric, GLP-1 and urgent/unscheduled scenarios), machine check (generic structure), intraoperative prompts, emergence/extubation, grouped lists for airway planning, lung-protective and one-lung ventilation, ventilator troubleshooting, local anesthetic dose checking and neuraxial preparation (these restate values cited elsewhere in the app), crisis lists for anaphylaxis, massive blood loss, bronchospasm and laryngospasm adapted from the Association of Anaesthetists Quick Reference Handbook, and an anonymous handoff summary built only from fixed choices and numeric fields. |
| **Diseases** | Offline search over 110 uncommon conditions (name, other names, abbreviations; accents and hyphens ignored). All 110 conditions show a complete Pre-op / Intra-op / Avoid / Post-op plan summarized from Stoelting 8e with chapter citations and zero crisis-drug calculation clutter. |
| **SOS** (red, bottom bar) | Full-screen LAST, MH and CICO support from any tab. |
| **References** (book icon) | Source registry, verification status and the values derived from each source, plus a side-by-side comparison of the published conflicting GLP-1 perioperative protocols. The old prose guide is archived in `docs/reference-archive-2026-10-14.md` and is not a dosing source. |

### Biometric formulas (exact)

- Devine IBW/PBW: male `50 + 0.905 x max(0, height - 152.4)`, female `45.5 + ...`. **PBW** is the uncapped value used for ventilation; **IBW** is capped at TBW for IBW-based dosing.
- ABW40: `IBW + 0.4 x (TBW - IBW)` if TBW > IBW, else TBW.
- Janmahasatian LBW: male `9270 x TBW / (6680 + 216 x BMI)`, female `9270 x TBW / (8780 + 244 x BMI)`, capped at TBW.
- Invalid inputs (zero/negative weight or height, height outside 30-250 cm) are **rejected**, outputs go blank and an error is shown. Nothing is silently corrected.
- Rounding happens only for display. Maximum-dose checks use unrounded values.

## Update the clinical reference layer

All clinical content is in `src/data/`:

| File | Content |
|---|---|
| `sources.ts` | Source registry (id, tag, year/version, URL, tier, verification) and `DATA_VERSION` |
| `medications.ts` | Drugs, doses, concentrations, scalars, ceilings; local anesthetic limits; documented gaps |
| `airwayDevices.ts` | Airway tables and formulas; list of unsourced airway topics |
| `ventilation.ts` | Scenarios and reference prompts |
| `checklists.ts` | Checklists and handoff option lists |
| `emergencies.ts` | LAST, MH and CICO steps |
| `localOverrides.ts` | **Local protocol overrides (ships empty)** |

To change a value:

1. Edit the data file. Every dose, concentration, rule and step needs `sourceIds` that exist in `sources.ts`; add the source first if it is new.
2. Bump `DATA_VERSION` in `sources.ts`.
3. Run `npm test`. The integrity tests fail if any `sourceId` does not resolve, a record has no source, a default lies outside its range, or a weight-based dose has no scalar and basis.
4. Update the source's `verification` and `accessNote` honestly (for example promote `secondary` to `primary` after you read the full text).
5. `npm run build` and redeploy. The service worker updates installed apps automatically.

Do not add a value you cannot tie to a named source. Leave it out so the UI shows the "No high-quality source value specified" placeholder.

## International guidelines vs local protocol

Settings (gear icon) has an **Active reference set** switch and an **Appearance** switch (System, Light or Dark; System is the default and follows the device). The SOS screen stays dark in both themes.

- Local values go in `src/data/localOverrides.ts`, keyed as documented in that file. **No local notebook was supplied, so this build contains none.**
- Rules applied by `src/data/resolve.ts`:
  - same as the guideline: used and labelled guideline-consistent;
  - **more restrictive** than the guideline: the local value is used and tagged **Local protocol**;
  - **less restrictive** (a conflict): both values are shown, the guideline value is used, and the local value applies only if the user selects **Use local protocol**.
- A guideline safety limit is never silently overridden.

## What is and is not stored

**Stored on the device (localStorage, key `anesthassist-storage`):** reference set choice, preferred weight scalar, chosen concentration for each dose, last ventilation scenario, recently used drugs, the MH hotline/contact you type in Settings, timer-sound setting, the creatinine unit (mg/dL or µmol/L), the color theme (key `anesthassist-theme`, absent when set to System), and anonymous checklist tick marks.

**Never stored:** patient weight, height, sex, age, serum creatinine, risk-score and 4AT answers, ASA class, emergency flag and fasting-status picks, ticked medications, dose selections, cumulative dose logs, local anesthetic entries, emergency logs, timers and handoff text. They live in memory and disappear when the app closes. **New case** clears them (and checklist ticks) on demand. Older saved data (including the previous version's patient values) is discarded on upgrade.

**Never done:** authentication, analytics or telemetry, clinical network calls, logging of clinical entries. The only background request is the service-worker update check. The handoff generator only uses fixed choices and numeric fields, has no free-text fields, and adds no weight, height or biometrics. The pre-op note does include the age, sex, weight, height, BMI and creatinine you enter, but it is built only on screen, never stored, and copied to the clipboard only when you tap Copy; it has no free-text field and no identifier, so paste it only where patient data is allowed. The Diseases search runs on the device and its text is never stored; the "Open my NotebookLM notebook" link opens an external site only when you tap it, and the app sends nothing to it.

## Tests

`npm test` runs 200+ tests covering IBW/PBW, LBW, ABW40 and BMI; dose and volume math (including mcg/mg conversion); single and cumulative maximum-dose flags; infusion rates; ETT/LMA/DLT sizing; pediatric age guards; tidal volume and minute ventilation; the local anesthetic combined fraction; LAST lipid bolus, infusion and the 12 mL/kg ceiling; dantrolene dose, vial counts and the cumulative warning; guideline-vs-local resolution; the fasting/NPO checklist and its source coverage; anonymous handoff construction; and source traceability of every clinical record. CI and Vercel run `npm run verify`.

## Repository Policies

- **Security & Vulnerability Disclosure:** See [SECURITY.md](SECURITY.md) for details on zero-PHI verification and reporting security concerns.
- **Privacy Policy:** See [PRIVACY.md](PRIVACY.md) for our zero-PHI architecture, local device storage policies, and HIPAA/GDPR alignment.
- **Contribution Guidelines:** See [CONTRIBUTING.md](CONTRIBUTING.md) for instructions on proposing clinical data updates, evidence tier requirements, and engineering standards.
- **Code of Conduct:** See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) for community participation and clinical discussion standards.

## License

MIT, see [LICENSE](LICENSE). The software is provided as is, and the clinical-use disclaimer above still applies.

Exception: `src/data/checklistsQrh.ts` is adapted from the Association of Anaesthetists Quick Reference Handbook (www.anaesthetists.org/qrh) and is shared under CC BY-NC-SA 4.0 (attribution, non-commercial, share-alike), not MIT. Remove that file if you need a purely MIT or commercial build.

