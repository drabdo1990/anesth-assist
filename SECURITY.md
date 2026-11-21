# Security Policy

## Scope & Architectural Security

**AnesthAssist** is an offline-first, client-side Progressive Web Application (PWA) designed as a cognitive aid for perioperative anesthesia providers. 

Because AnesthAssist operates entirely in the clinician's browser:
* **Zero Patient Health Information (Zero-PHI):** Patient parameters (weight, height, age, sex, creatinine, risk scores, emergency logs) live strictly in ephemeral browser memory. They are never written to `localStorage`, `IndexedDB`, or transmitted across the network.
* **No Server-Side Processing:** The application does not maintain a backend database, API, user account service, or session tracker.
* **No Third-Party Telemetry or Analytics:** No tracking scripts, marketing pixels, or external analytics libraries are included in the bundle.
* **Strict Content Security Policy (CSP):** The application is served with strict CSP headers (`default-src 'self'`) to eliminate cross-site scripting (XSS) vectors.

---

## Supported Versions

Only the latest release deployed to the `main` branch is actively maintained and monitored for security updates.

| Version / Branch | Supported |
| :--- | :--- |
| `main` (Latest) | :white_check_mark: |
| Prior Releases | :x: |

---

## Reporting a Vulnerability

If you discover a security vulnerability, potential PHI exposure vector, or unexpected external network request:

1. **Do not open a public GitHub issue.**
2. Report the vulnerability privately via **GitHub Private Vulnerability Reporting** on this repository:
   - Navigate to the **Security** tab of [drabdo1990/anesth-helper](https://github.com/drabdo1990/anesth-helper).
   - Click on **Report a vulnerability**.
3. Alternatively, contact the project maintainer:
   - **Clinical Lead:** Dr. Mohamed Abdelwahab ([@drabdo1990](https://github.com/drabdo1990))

### What to Include in Your Report
* Description of the potential vulnerability or leakage vector.
* Steps to reproduce or proof-of-concept.
* Browser version, device OS, and PWA installation state.

### Response Timeline
* **Initial acknowledgement:** Within 48 hours.
* **Assessment & triage:** Within 5 business days.
* **Patch & release:** Deployed immediately upon verification to the `main` branch and Vercel production edge.
