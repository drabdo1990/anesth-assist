# Design Specification: Android Packaging & Google Play Release (Capacitor)

**Date:** 2026-11-20  
**Status:** In Review  
**Project Lead:** Dr. Mohamed Abdelwahab ([@drabdo1990](https://github.com/drabdo1990))  
**Application ID:** `online.anesthassist.app`  
**Web & Production Domain:** `https://anesthassist.online`  

---

## 1. Executive Summary & Goals

This specification details the architecture for wrapping the **AnesthAssist** perioperative cognitive aid PWA into a native Android application using **Capacitor** and configuring an automated **GitHub Actions** release pipeline to produce signed, production-ready Android App Bundles (`.aab`) for publishing to the **Google Play Store**.

### Key Architectural Goals
1. **100% Offline Resilience from Zero:** All assets (HTML, JavaScript, CSS, icons, datasets) are embedded directly within the native Android package (`assets/public/`). The app opens and functions flawlessly with zero latency in lead-lined, RF-shielded operating suites without requiring any initial network connectivity.
2. **Zero Disruption to Existing Web PWA:** The existing Vite build pipeline, Vercel deployments, and web service worker caching remain completely unaffected. Web users can continue using the PWA at `https://anesthassist.online` and `https://anesth-helper.vercel.app`.
3. **Ergonomic Operating Room UX:** Native Android status bar and navigation bar are themed dark (`#090d16`) to match the clinical dark theme. Accidental system hardware back-button presses will dismiss open overlays (SOS, Settings, References) without accidentally terminating the active clinical case.
4. **Cloud-Native Compilation via GitHub Actions:** The compilation of the Android App Bundle (`.aab`), Java/Gradle dependencies, and cryptographic signing are automated in GitHub Actions. The maintainer does not need a local Android SDK or Java installation to generate store-ready releases.
5. **Google Play Medical Policy Compliance:** Adherence to Google Play's health and medical app requirements, including prominent educational disclaimers, clear declaration of non-diagnostic cognitive aid scope, zero-PHI data safety compliance, and privacy policy links.

---

## 2. Technical Stack & Configuration

### Dependencies
* `@capacitor/core`: Core runtime bridge between web and native Android.
* `@capacitor/cli`: Command-line interface for native project synchronization.
* `@capacitor/android`: Native Android platform runtime and Gradle template.
* `@capacitor/app`: Hardware back-button event listener and lifecycle handling.
* `@capacitor/status-bar`: Native status bar appearance and styling.

### Capacitor Configuration (`capacitor.config.ts`)
```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'online.anesthassist.app',
  appName: 'AnesthAssist',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  android: {
    backgroundColor: '#090d16',
    allowMixedContent: false,
    captureInput: true,
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#090d16',
    },
  },
};

export default config;
```

---

## 3. Native Android Architecture & Ergonomics

### 3.1 Project Scaffolding
Running `npx cap add android` generates the `android/` native project structure:
* `android/app/build.gradle`: Android module build config with target SDK 34+ (Google Play requirement).
* `android/app/src/main/AndroidManifest.xml`: Permissions, app orientation (portrait), and hardware acceleration.
* `android/app/src/main/res/`: Adaptive icons, splash backgrounds, and theme colors.

### 3.2 Operating Room Back-Button Safety Handler
In operating room conditions, an accidental tap on Android's hardware/gesture back button must never abort an in-progress case.

A centralized native event listener will be mounted in `src/App.tsx` (active only when running inside Capacitor):
```typescript
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';

if (Capacitor.isNativePlatform()) {
  CapApp.addListener('backButton', ({ canGoBack }) => {
    // 1. If SOS Emergency overlay is open, prompt or close
    // 2. If Settings or References modal is open, dismiss the modal
    // 3. If on root screen with active patient entries, require double-back to exit
  });
}
```

### 3.3 Safe Area & Display Cutouts
The application already incorporates standard CSS safe-area insets (`env(safe-area-inset-top)`, `env(safe-area-inset-bottom)`). In Android's `styles.xml`, the window will be configured with:
```xml
<item name="android:windowLayoutInDisplayCutoutMode">shortEdges</item>
<item name="android:statusBarColor">#090d16</item>
<item name="android:navigationBarColor">#090d16</item>
```

---

## 4. Keystore & Code Signing Architecture

Google Play uses **Play App Signing**. The developer signs the Android App Bundle (`.aab`) with an **Upload Key**. Google Play verifies the upload key, strips it, and re-signs the delivered APKs with the master app signing key.

### Upload Key Creation
We will provide a script (`scripts/create-upload-keystore.sh` and `.ps1`) to generate `anesthassist-upload-keystore.jks`:
* Key Alias: `anesthassist`
* Key Algorithm: RSA 2048-bit
* Validity: 10,000 days (approx. 27 years)

### Secret Management
For GitHub Actions automation, the keystore will be base64-encoded and stored in GitHub Repository Secrets:
* `ANDROID_KEYSTORE_BASE64`: Base64 string of `anesthassist-upload-keystore.jks`
* `ANDROID_KEYSTORE_PASSWORD`: Keystore password
* `ANDROID_KEY_ALIAS`: `anesthassist`
* `ANDROID_KEY_PASSWORD`: Key password

---

## 5. Automated CI/CD Release Pipeline (`.github/workflows/android-release.yml`)

The GitHub Actions workflow automates the build from source to signed `.aab`:

```yaml
name: Build & Sign Android App Bundle

on:
  push:
    tags:
      - 'v*'
  workflow_dispatch:

jobs:
  build-android:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run verification & tests
        run: npm test

      - name: Build web application
        run: npm run build

      - name: Setup Java 17
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'

      - name: Setup Android SDK
        uses: android-actions/setup-android@v3

      - name: Sync Capacitor Android
        run: npx cap sync android

      - name: Build Release Android App Bundle (.aab)
        run: |
          cd android
          chmod +x gradlew
          ./gradlew bundleRelease

      - name: Sign Android App Bundle
        uses: r0adkll/sign-android-release@v1
        with:
          releaseDirectory: android/app/build/outputs/bundle/release
          signingKeyBase64: ${{ secrets.ANDROID_KEYSTORE_BASE64 }}
          alias: ${{ secrets.ANDROID_KEY_ALIAS }}
          keyStorePassword: ${{ secrets.ANDROID_KEYSTORE_PASSWORD }}
          keyPassword: ${{ secrets.ANDROID_KEY_PASSWORD }}

      - name: Upload AAB Artifact
        uses: actions/upload-artifact@v4
        with:
          name: anesthassist-release-aab
          path: android/app/build/outputs/bundle/release/*.aab
```

---

## 6. Google Play Store Submission Package

### 6.1 Listing Metadata
* **App Title:** `AnesthAssist: OR Decision Aid` (28 chars, max 30)
* **Short Description:** `Offline cognitive aid and dosing guide for anesthesia providers in the OR.` (76 chars, max 80)
* **Full Description:** Detailed summary of Stoelting 8e perioperative plans, pediatric dosing & dilution math, airway calculators, crisis checklists (LAST, MH, CICO), zero-PHI guarantee, and non-diagnostic educational disclaimer.
* **Category:** Medical -> Clinical Reference & Decision Support
* **Content Rating (IARC):** Unrestricted / 3+ (Medical Reference; no profanity, no violence).
* **Target Audience:** Healthcare Professionals (18+).

### 6.2 Data Safety Form
* **Does your app collect or share user data?** `No`.
* **Is data encrypted in transit?** `N/A` (no data transmitted).
* **Does the app provide a way for users to request data deletion?** `Yes` (in-app "Erase saved settings" button).

### 6.3 Store Visual Assets
* **App Icon:** 512 x 512 px 32-bit PNG (`public/icon-512.png`).
* **Feature Graphic:** 1024 x 500 px PNG/JPG banner with title and aesthetic dark clinical branding.
* **Phone Screenshots:** 5 high-resolution mockups (Pre-op Assessment, Pediatric Dosing & Dilutions, Stoelting Disease Management, Crisis Checklists, SOS Emergency Screen).

---

## 7. Verification & Acceptance Criteria

1. **Build Integrity:** `npm test` passes 441/441 tests; `tsc -b` passes with zero errors; `npm run build` generates production bundle cleanly.
2. **Capacitor Sync:** `npx cap sync android` completes without warnings or missing plugin bindings.
3. **AAB Compilation:** Gradle builds `app-release.aab` with target SDK 34+ and zero manifest collisions.
4. **Offline Validation:** The compiled Android app launches into all tabs (Pre-op, Plans, Intra-op, Post-op, Diseases, SOS) with Airplane Mode enabled on an Android device or emulator.
5. **Web Invariance:** Web deployment at `https://anesthassist.online` continues to build, update, and serve without regressions.
