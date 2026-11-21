# Google Play Store Listing & Submission Package

**Application ID:** `online.anesthassist.app`  
**Developer / Clinical Lead:** Dr. Mohamed Abdelwahab ([@drabdo1990](https://github.com/drabdo1990))  
**Production URL:** [https://anesthassist.online](https://anesthassist.online)  
**Privacy Policy:** [https://github.com/drabdo1990/anesth-helper/blob/main/PRIVACY.md](https://github.com/drabdo1990/anesth-helper/blob/main/PRIVACY.md)

---

## 1. Store Listing Metadata

### App Title (29 / 30 chars)
```text
AnesthAssist: OR Decision Aid
```

### Short Description (74 / 80 chars)
```text
Offline cognitive aid and dosing guide for anesthesia providers in the OR.
```

### Full Description (Max 4,000 chars)
```text
AnesthAssist is an offline-first, zero-latency cognitive aid and perioperative clinical decision support tool designed for operating room anesthesia providers, residents, CRNAs, and critical care clinicians.

Built specifically for high-acuity surgical environments, AnesthAssist runs 100% locally on your device with no reliance on cellular or hospital Wi-Fi connections.

KEY CLINICAL MODULES & CAPABILITIES:

1. COMPREHENSIVE DOSING & DILUTION ENGINE
• Adult & Pediatric dual-mode formulary covering induction, paralysis, analgesia, reversal, sedation, and antiemetics.
• Pediatric dosing strictly locks to Total Body Weight (TBW) with automatic age-bracket matching (Infant, Child, Adolescent) and safety ceiling caps.
• Step-by-step dilution instructions (e.g., Fentanyl 10 mcg/mL, Atropine 0.1 mg/mL) with exact required volume calculations.
• Dedicated local anesthetic maximum dose calculator (plain vs. epinephrine) with cumulative toxicity tracking.

2. STOELTING 8th EDITION DISEASE MANAGEMENT
• Offline, instant search across 110 uncommon co-existing perioperative diseases.
• Complete 4-section structured plans (Pre-op Assessment, Intra-op Management, Avoid/High-Risk Pitfalls, Post-op & PACU).
• Chapter citations from Stoelting's Anesthesia and Co-Existing Disease (8th ed.).

3. RAPID CASE PLANS
• Curated rapid-decision pathways for Pediatric Emergencies, Obstetric Cesarean under Neuraxial, Obesity / Bariatric Surgery, and Rapid Sequence Induction (RSI / Full Stomach).

4. VENTILATION & AIRWAY SIZING
• Lung-protective ventilation calculator deriving tidal volumes strictly from Predicted Body Weight (PBW).
• Airway sizing guides for ETTs, video-laryngoscopes, double-lumen tubes (DLT), and supraglottic airways (LMA).

5. CRISIS & EMERGENCY PATHWAYS (SOS BUTTON)
• Always-accessible full-screen emergency protocols with active timers:
  - Local Anesthetic Systemic Toxicity (LAST) with 20% lipid emulsion bolus and infusion calculator.
  - Malignant Hyperthermia (MH) protocol with dantrolene vial calculator.
  - Can't Intubate, Can't Oxygenate (CICO) emergency cognitive pathway.

6. ZERO-PHI GUARANTEE & OFFLINE PRIVACY
• Zero Protected Health Information: Patient biometric entries exist only in volatile RAM and are never stored to disk or transmitted across any network.
• No account, no login, no advertisements, and zero tracking analytics.

CLINICAL DISCLAIMER:
AnesthAssist is intended strictly as an educational and cognitive aid for qualified medical professionals. It is not an electronic health record, a patient monitor, or an autonomous prescribing system. Clinical judgment supersedes all calculated suggestions.
```

---

## 2. Google Play Console Declarations

### Category & Tags
* **Primary Category:** Medical
* **Tags:** Medical Reference, Health & Fitness, Tools, Productivity

### Target Audience & Content
* **Target Audience:** Healthcare Professionals (Ages 18+)
* **Ads:** "No, my app does not contain ads"
* **App Access:** "All functionality is available without special access or login credentials"

### Data Safety Form
* **Does your app collect or share user data?** `No`
* **Is data encrypted in transit?** `N/A` (no data transmitted over the network)
* **Can users request data deletion?** No server-side data exists. Local settings can be erased in-app via **Settings → Erase saved settings and reload**.

---

## 3. Required Store Graphics Checklist

- [x] **App Icon:** 512 x 512 px PNG 32-bit (`public/icon-512.png`)
- [x] **Feature Graphic:** 1024 x 500 px PNG (`public/feature-graphic.png`)
- [ ] **Screenshots:** 4 to 8 phone screenshots captured from the app (Pre-op, Dosing, Plans, Diseases, SOS Emergency).
