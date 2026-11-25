# AnesthAssist (Native Android)

Offline clinical decision support and perioperative cognitive aid for anesthesiology clinicians, built natively with **Kotlin** and **Jetpack Compose (Material 3)**.

> **Disclaimer:** Dr. Mohamed Abdelwahab — Educational and cognitive aid. Clinical judgment supercedes all calculated suggestions.

## Architecture & Privacy

- **Offline-First Clinical Engine:** All clinical tables, drug formularies, 185 condition summaries, and guidelines are bundled locally in `app/src/main/assets/clinical_data.json`. The only Android permission requested is `INTERNET`, used strictly when you manually tap **Check for Updates** in Settings (zero background traffic, zero analytics, zero PHI transmitted).
- **Zero-PHI Persistence:** Patient biometrics (weight, height, sex, age, creatinine), risk score answers, dose logs, local anesthetic entries, and crisis timers remain strictly in memory (RAM) and clear on process exit or **New Case**. Only non-PHI UI preferences (theme, preferred weight scalar, concentration choices, MH hotline string, audio toggle, creatinine unit, and anonymous checklist ticks) are stored in `SharedPreferences` (`allowBackup="false"`).
- **Theme:** High-contrast dark OR palette and light clinical palette with System / Light / Dark selection. The **SOS** emergency overlay always stays in high-contrast dark mode.

## Clinical Modules

1. **Biometrics Engine:** Live BMI, Devine IBW/PBW (with 152.4 cm baseline warning), ABW40, and Janmahasatian LBW with numeric keypad and steppers.
2. **Pre-op:**
   - Cockcroft-Gault Creatinine Clearance (`mg/dL` & `µmol/L`)
   - Risk scores: **RCRI** and **STOP-Bang** (auto-deriving BMI, age, sex, and creatinine items)
   - Perioperative medication rules (SGLT2i, DOACs, GLP-1 with 5-society protocol comparison, ASRA neuraxial/deep block timing, AHA/ACC & ESC cardiac rules) with CrCl-matched highlighting
   - Fasting / NPO checklist and **Anonymous Pre-op Assessment Note** copyable to clipboard
3. **Plans:** Perioperative phase-by-phase plan cards (Pediatric, Obstetric Cesarean, Obesity, RSI / full stomach) with deep-links into Intra-op tools.
4. **Intra-op:**
   - **Dosing:** 30 adult & pediatric medications with scalar selection (TBW locked for pediatrics, adult max caps, minimum floors, companion drug calculations, dose logging), Local Anesthetic combined toxicity tracker, Neuraxial spinal/epidural reference, and Reference drug tables.
   - **Airway:** Adult ETT/blade, Pediatric ETT (Khine cuffed / Cole uncuffed) & age-based blades, LMA weight bands, and Double-Lumen Tube sizing with pediatric/height safety floor.
   - **Ventilation:** PBW-based tidal volume, minute ventilation, driving pressure, plateau pressure alerts, scenario targets, modes, alarms, and troubleshooting.
   - **Lists:** Pre-induction, WHO timeout, and QRH crisis checklists.
5. **Post-op:** **Apfel** PONV score, 2025 ASER prophylaxis plan, **Modified Aldrete**, **PADSS**, **4AT** delirium screen, emergence/extubation checklist, and **Anonymous PACU Handoff** generator.
6. **Diseases:** Instant accent/hyphen-insensitive search and category/chapter filters across **185 conditions** (**110 Stoelting 8e** rare diseases, **24 Acute Intraoperative Emergencies**, and **51 Subspecialty** board cards) with Pre-op, Intra-op, Avoid, Post-op guidance plus direct cross-links into **SOS** (MH / LAST) and **QRH Crisis Checklists** in Lists.
7. **SOS Emergency Overlay:** Always-reachable red SOS button opening **LAST** (20% lipid emulsion bolus/infusion & 12 mL/kg cap), **MH** (2.5 mg/kg dantrolene & Dantrium/Ryanodex vial calculator), and **CICO** (DAS Plans A–D with live stopwatch and interval tone alerts). First-response banners, MH hotline, and step checklists are immediately visible even before patient weight is entered.
