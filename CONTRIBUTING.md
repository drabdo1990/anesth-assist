# Contributing to AnesthAssist

Thank you for your interest in contributing to **AnesthAssist**.

AnesthAssist is an open-source, offline-first perioperative cognitive aid for anesthesia providers, led and maintained by **Dr. Mohamed Abdelwahab** ([@drabdo1990](https://github.com/drabdo1990)).

Because this tool is used as a cognitive aid in high-acuity clinical environments, all contributions—whether clinical data or software engineering—must adhere to strict standards of evidence, safety, and testing.

---

## 1. Clinical Data Contributions

We welcome input from anesthesiologists, CRNAs, anesthesia assistants, intensivists, and pharmacists to challenge, refine, and expand our clinical reference datasets.

### Principles for Clinical Content
1. **Source Traceability is Mandatory:** Every drug dose, concentration, airway dimension, ventilation formula, and perioperative recommendation must be cited to a recognized source in `src/data/sources.ts`.
2. **Tiered Evidence Model:**
   * **Tier 1:** Official society guidelines (e.g. ASA, ASRA Pain Medicine, ESAIC, DAS, AAGBI/QRH, MHAUS).
   * **Tier 2:** Manufacturer product labeling (e.g. FDA DailyMed, EMA Summary of Product Characteristics).
   * **Tier 3:** Peer-reviewed consensus statements, evidence syntheses, and authoritative textbooks (e.g. Stoelting's *Anesthesia and Co-Existing Disease*).
   * **Tier 4:** Local institutional protocols and app-derived safety guards.
3. **Verification Levels:**
   * `primary`: The contributor has read and verified the primary journal/guideline publication.
   * `label`: Dosing and contraindications verified against official prescribing information.
   * `secondary`: Secondary reference or meta-analysis cited; requires clinical sign-off.
4. **Honest Gaps:** If no high-quality published value exists for a specific parameter (e.g. specific video-laryngoscope blade geometry), do not estimate or extrapolate. Leave it unset so the UI displays the *"No high-quality source value specified"* notice.
5. **Data Versioning:** Every clinical data change must increment `DATA_VERSION` in `src/data/sources.ts`.

---

## 2. Technical & Engineering Contributions

### Architecture & Non-Negotiable Constraints
* **Zero-PHI:** Never introduce patient persistence (`localStorage`, `sessionStorage`, `IndexedDB`) or remote logging of patient parameters.
* **Offline-First:** All clinical tools and search indexes must function 100% offline without network connectivity.
* **Minimal Dependencies:** Avoid large third-party runtime dependencies. The bundle must remain fast to load on hospital Wi-Fi or cellular connections.
* **Light / Dark Mode Compliance:** All UI elements must follow the design tokens in `src/theme/palette.ts` and pass the class guard test (`src/theme/__tests__/classGuard.test.ts`).

### Development Workflow

```bash
# 1. Clone the repository
git clone https://github.com/drabdo1990/anesth-helper.git
cd anesth-helper

# 2. Install dependencies
npm ci

# 3. Start local development server
npm run dev

# 4. Run tests
npm test

# 5. Run full verification (type-check + test + build)
npm run verify
```

---

## 3. Pull Request (PR) Checklist

Before submitting a Pull Request:

- [ ] **Tests Pass:** `npm test` passes with zero failures.
- [ ] **Type Check Passes:** `npx tsc -b` reports zero errors.
- [ ] **Data Integrity Passes:** If clinical data was modified, `src/data/__tests__/integrity.test.ts` passes and `DATA_VERSION` in `src/data/sources.ts` was updated.
- [ ] **Clean Git History:** Commits follow conventional style (e.g., `feat:`, `fix:`, `docs:`, `refactor:`).
- [ ] **Clinical Justification:** If adding or changing dosages or guidelines, provide the DOI, PubMed ID, or official link in the PR description.

---

## 4. Code of Conduct

All contributors and maintainers are expected to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

Thank you for helping make anesthesia practice safer!
