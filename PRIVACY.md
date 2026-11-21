# Privacy Policy

**Effective Date:** November 2026  
**Clinical Lead & Maintainer:** Dr. Mohamed Abdelwahab ([@drabdo1990](https://github.com/drabdo1990))

---

## 1. Zero-PHI Architecture (Patient Privacy)

AnesthAssist is purposefully built with a **Zero-PHI (Protected Health Information)** architecture:

* **Ephemeral Calculation Only:** Any clinical inputs entered during a clinical case—including patient weight, height, age, biological sex, serum creatinine, airway classification, and checklist selections—are retained solely in volatile browser memory (RAM).
* **Automatic Discard:** Navigating away from the application, closing the browser tab, or tapping **"New Case"** clears all clinical inputs from memory.
* **No Persistent Patient Storage:** The app never saves patient identifiers, notes, or calculation outputs to disk (`localStorage`, `sessionStorage`, `IndexedDB`, or cookies).
* **Zero Network Transmission:** Calculations run 100% locally on the device using bundled client-side JavaScript. No patient data or calculation queries are sent to any remote server or third-party service.

---

## 2. Information Stored Locally on Your Device

To support an optimal user experience across shifts, the application stores only anonymous user preferences in `localStorage` under the key `anesthassist-storage`:

* **Color Theme Preference:** System, Light, or Dark (`anesthassist-theme`).
* **Clinical Reference Preferences:** Preferred body weight scalar (e.g. TBW, IBW, LBW), active reference set (International vs. Local protocol).
* **Dose Selections:** Recently used concentration choices for formulary drugs.
* **Local MH Contact:** The local Malignant Hyperthermia hotline number or contact entered manually in Settings (stored only on this physical device).
* **Audio Preference:** Timer sound alert toggle (on/off).
* **Anonymous Checklist Status:** Routine workflow checklist tick marks.

You can erase all locally stored preferences at any time by navigating to **Settings (gear icon) → Erase saved settings and reload**.

---

## 3. Telemetry, Tracking, and Analytics

* **No Analytics:** AnesthAssist contains no third-party tracking software, Google Analytics, telemetry SDKs, or session replay tools.
* **No Advertising:** The application contains zero advertisements or marketing trackers.
* **No Cookies:** No tracking, session, or advertising cookies are utilized.

---

## 4. Service Worker & Offline Operations

AnesthAssist uses a standard PWA Service Worker (`vite-plugin-pwa`) to cache application code, stylesheets, and clinical datasets for reliable offline use in shielded operating rooms. 

* The only periodic background request made by the service worker is an anonymous HTTP `GET` to check whether an updated application version is available on the hosting CDN.
* live cases are never reloaded automatically during an update.

---

## 5. Regulatory Alignment (HIPAA & GDPR)

Because AnesthAssist neither collects, stores, processes, nor transmits identifiable health data or personal identifiers, using the application in clinical environments does not generate Protected Health Information (PHI) under HIPAA or personal data under GDPR.

---

## 6. Questions & Contact

For questions regarding this privacy policy or the application's clinical architecture, please open an issue on GitHub or reach out to:

* **Dr. Mohamed Abdelwahab**  
  GitHub: [@drabdo1990](https://github.com/drabdo1990)  
  Repository: [https://github.com/drabdo1990/anesth-helper](https://github.com/drabdo1990/anesth-helper)
