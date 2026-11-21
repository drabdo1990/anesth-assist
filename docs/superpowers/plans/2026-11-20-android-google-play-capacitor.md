# Android Packaging & Google Play Release (Capacitor) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Package the AnesthAssist perioperative cognitive aid into a native Android application using Capacitor with package ID `online.anesthassist.app` and establish an automated GitHub Actions CI/CD pipeline to compile and sign production-ready `.aab` bundles for Google Play Store release.

**Architecture:** Vite web application (`dist/`) bundled into an Android Gradle project via Capacitor, native OR hardware back-button handling, and automated cloud `.aab` compilation/signing via GitHub Actions.

**Tech Stack:** Capacitor 7 (`@capacitor/core`, `@capacitor/cli`, `@capacitor/android`, `@capacitor/app`, `@capacitor/status-bar`), Android Gradle (SDK 34+), GitHub Actions, React 19, TypeScript, Vitest.

**Spec:** [docs/superpowers/specs/2026-11-20-android-google-play-capacitor-design.md](file:///e:/coding-agents-files/antigravity/anesth-helper/docs/superpowers/specs/2026-11-20-android-google-play-capacitor-design.md)

## Global Constraints

- **Application ID:** `online.anesthassist.app`
- **Application Name:** `AnesthAssist`
- **Zero-PHI Architecture:** No persistent patient storage or remote logging; all patient entries remain strictly volatile in memory.
- **Web Invariance:** Existing web PWA deployments to Vercel at `https://anesthassist.online` and `https://anesth-helper.vercel.app` must remain 100% operational with zero regressions.
- **Target Android SDK:** Android SDK 34+ (mandatory for Google Play Store submission).
- **Offline First:** All core assets, Stoelting 8e disease management plans, and drug calculators must load instantly without network connectivity.

## Review Focus

1. **Back-button pressed while Emergency SOS overlay is open:** Must dismiss the overlay cleanly without terminating the application or losing active emergency timers.
2. **Back-button pressed while Settings or References sheet is open:** Must close the respective sheet/modal without leaving the active case view.
3. **Back-button pressed on root screen:** Must not accidentally close the app; requires a confirmation or double-tap guard.
4. **Offline launch on fresh install:** Native WebView must point to local bundled assets (`dist/` / `public`) so the app never shows a blank white page when launched in an RF-shielded OR.
5. **Web PWA build parity:** Running `npm run build` must continue producing clean web artifacts without injecting native-only crashes on standard browser platforms.

---

### Task 1: Capacitor Core Dependencies & Configuration

**Files:**
- Modify: `package.json`
- Create: `capacitor.config.ts`
- Test: `src/lib/__tests__/capacitorConfig.test.ts`

**Interfaces:**
- Produces: `capacitor.config.ts` exporting default `CapacitorConfig` with `appId: 'online.anesthassist.app'`, `appName: 'AnesthAssist'`, `webDir: 'dist'`.

- [ ] **Step 1: Write failing test for Capacitor configuration**

Create `src/lib/__tests__/capacitorConfig.test.ts`:
```typescript
import { describe, expect, it } from 'vitest';
import config from '../../../capacitor.config';

describe('Capacitor Configuration', () => {
  it('defines correct appId matching domain ownership', () => {
    expect(config.appId).toBe('online.anesthassist.app');
  });

  it('defines the correct user-facing appName', () => {
    expect(config.appName).toBe('AnesthAssist');
  });

  it('points webDir to the Vite production output directory dist', () => {
    expect(config.webDir).toBe('dist');
  });

  it('uses https scheme for Android webview', () => {
    expect(config.server?.androidScheme).toBe('https');
  });

  it('sets dark background color matching clinical theme', () => {
    expect(config.android?.backgroundColor).toBe('#090d16');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/__tests__/capacitorConfig.test.ts`  
Expected: FAIL ("Cannot find module '../../../capacitor.config'")

- [ ] **Step 3: Install Capacitor dependencies and create `capacitor.config.ts`**

Run:
```bash
npm install @capacitor/core @capacitor/app @capacitor/status-bar
npm install -D @capacitor/cli @capacitor/android
```

Create `capacitor.config.ts`:
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

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/__tests__/capacitorConfig.test.ts`  
Expected: PASS (5/5 tests passed)

- [ ] **Step 5: Commit changes**

```bash
git add package.json package-lock.json capacitor.config.ts src/lib/__tests__/capacitorConfig.test.ts
git commit -m "feat(android): install capacitor and create capacitor.config.ts"
```

---

### Task 2: Native Bridge & Hardware Back-Button Ergonomics

**Files:**
- Create: `src/lib/nativeBridge.ts`
- Modify: `src/App.tsx`
- Test: `src/lib/__tests__/nativeBridge.test.ts`

**Interfaces:**
- Produces: `dispatchBackAction(state: BackActionState): BackActionResult`
- Consumes: `useAppStore` modal state (`emergencyOpen`, `settingsOpen`, `referencesOpen`, `keypadOpen`)

- [ ] **Step 1: Write failing unit test for native back action routing**

Create `src/lib/__tests__/nativeBridge.test.ts`:
```typescript
import { describe, expect, it } from 'vitest';
import { dispatchBackAction, type ModalHierarchy } from '../nativeBridge';

describe('Hardware Back-Button Action Routing', () => {
  it('closes emergency modal if open', () => {
    const state: ModalHierarchy = { emergencyOpen: true, settingsOpen: false, referencesOpen: false, keypadOpen: false };
    const action = dispatchBackAction(state);
    expect(action).toBe('CLOSE_EMERGENCY');
  });

  it('closes settings sheet if open', () => {
    const state: ModalHierarchy = { emergencyOpen: false, settingsOpen: true, referencesOpen: false, keypadOpen: false };
    const action = dispatchBackAction(state);
    expect(action).toBe('CLOSE_SETTINGS');
  });

  it('closes references view if open', () => {
    const state: ModalHierarchy = { emergencyOpen: false, settingsOpen: false, referencesOpen: true, keypadOpen: false };
    const action = dispatchBackAction(state);
    expect(action).toBe('CLOSE_REFERENCES');
  });

  it('closes keypad modal if open', () => {
    const state: ModalHierarchy = { emergencyOpen: false, settingsOpen: false, referencesOpen: false, keypadOpen: true };
    const action = dispatchBackAction(state);
    expect(action).toBe('CLOSE_KEYPAD');
  });

  it('returns ROOT_NAVIGATE if no overlays are open', () => {
    const state: ModalHierarchy = { emergencyOpen: false, settingsOpen: false, referencesOpen: false, keypadOpen: false };
    const action = dispatchBackAction(state);
    expect(action).toBe('ROOT_NAVIGATE');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/__tests__/nativeBridge.test.ts`  
Expected: FAIL ("Cannot find module '../nativeBridge'")

- [ ] **Step 3: Implement `src/lib/nativeBridge.ts` and mount in `src/App.tsx`**

Create `src/lib/nativeBridge.ts`:
```typescript
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';

export interface ModalHierarchy {
  emergencyOpen: boolean;
  settingsOpen: boolean;
  referencesOpen: boolean;
  keypadOpen: boolean;
}

export type BackActionResult =
  | 'CLOSE_EMERGENCY'
  | 'CLOSE_SETTINGS'
  | 'CLOSE_REFERENCES'
  | 'CLOSE_KEYPAD'
  | 'ROOT_NAVIGATE';

export function dispatchBackAction(state: ModalHierarchy): BackActionResult {
  if (state.emergencyOpen) return 'CLOSE_EMERGENCY';
  if (state.settingsOpen) return 'CLOSE_SETTINGS';
  if (state.referencesOpen) return 'CLOSE_REFERENCES';
  if (state.keypadOpen) return 'CLOSE_KEYPAD';
  return 'ROOT_NAVIGATE';
}

export function registerNativeBackButton(handlers: {
  getState: () => ModalHierarchy;
  closeEmergency: () => void;
  closeSettings: () => void;
  closeReferences: () => void;
  closeKeypad: () => void;
}): () => void {
  if (!Capacitor.isNativePlatform()) {
    return () => {};
  }

  const listener = CapApp.addListener('backButton', () => {
    const state = handlers.getState();
    const action = dispatchBackAction(state);

    switch (action) {
      case 'CLOSE_EMERGENCY':
        handlers.closeEmergency();
        break;
      case 'CLOSE_SETTINGS':
        handlers.closeSettings();
        break;
      case 'CLOSE_REFERENCES':
        handlers.closeReferences();
        break;
      case 'CLOSE_KEYPAD':
        handlers.closeKeypad();
        break;
      case 'ROOT_NAVIGATE':
        // Safe root behavior: do not minimize app during active case
        break;
    }
  });

  return () => {
    listener.then((sub) => sub.remove());
  };
}
```

In `src/App.tsx`, mount `registerNativeBackButton` inside an effect using the zustand store actions.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/__tests__/nativeBridge.test.ts`  
Expected: PASS (5/5 tests passed)

- [ ] **Step 5: Commit changes**

```bash
git add src/lib/nativeBridge.ts src/lib/__tests__/nativeBridge.test.ts src/App.tsx
git commit -m "feat(native): add OR hardware back-button protection handler"
```

---

### Task 3: Native Android Project Initialization & Manifest Optimization

**Files:**
- Create: `android/` directory (via `npx cap add android`)
- Modify: `android/app/src/main/AndroidManifest.xml`
- Modify: `android/app/build.gradle`
- Test: `src/lib/__tests__/androidBuildFiles.test.ts`

**Interfaces:**
- Produces: Complete native Android project structure in `android/` configured for package `online.anesthassist.app`.

- [ ] **Step 1: Write test checking Android project files presence and package configuration**

Create `src/lib/__tests__/androidBuildFiles.test.ts`:
```typescript
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Android Project Scaffolding', () => {
  const root = process.cwd();
  const manifestPath = join(root, 'android/app/src/main/AndroidManifest.xml');
  const gradlePath = join(root, 'android/app/build.gradle');

  it('contains AndroidManifest.xml', () => {
    expect(existsSync(manifestPath)).toBe(true);
  });

  it('configures package namespace online.anesthassist.app in build.gradle', () => {
    const content = readFileSync(gradlePath, 'utf8');
    expect(content).toContain('namespace "online.anesthassist.app"');
    expect(content).toContain('applicationId "online.anesthassist.app"');
  });

  it('locks orientation to portrait for clinical touch accuracy', () => {
    const content = readFileSync(manifestPath, 'utf8');
    expect(content).toContain('android:screenOrientation="portrait"');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/__tests__/androidBuildFiles.test.ts`  
Expected: FAIL (File not found)

- [ ] **Step 3: Run Capacitor Android initialization and configure manifest**

Run:
```bash
npm run build
npx cap add android
```

In `android/app/src/main/AndroidManifest.xml`, configure:
- `android:screenOrientation="portrait"` on `MainActivity`
- `android:label="AnesthAssist"`

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/__tests__/androidBuildFiles.test.ts`  
Expected: PASS (3/3 tests passed)

- [ ] **Step 5: Commit changes**

```bash
git add android/ src/lib/__tests__/androidBuildFiles.test.ts
git commit -m "feat(android): initialize native android project and configure manifest"
```

---

### Task 4: Keystore Generation Scripts & Security Instructions

**Files:**
- Create: `scripts/generate-keystore.ps1`
- Create: `scripts/generate-keystore.sh`
- Create: `docs/google-play-keystore-setup.md`

- [ ] **Step 1: Create PowerShell and Bash keystore generator scripts**

Create `scripts/generate-keystore.ps1`:
```powershell
# Generates Android upload keystore for AnesthAssist
$KeystorePath = "anesthassist-upload-keystore.jks"
if (Test-Path $KeystorePath) {
    Write-Warning "Keystore already exists at $KeystorePath. Skipping generation to prevent overwriting."
    exit 0
}

Write-Host "Generating Android Upload Keystore for online.anesthassist.app..."
keytool -genkey -v -keystore $KeystorePath -alias anesthassist -keyalg RSA -keysize 2048 -validity 10000 `
    -dname "CN=Dr. Mohamed Abdelwahab, OU=Clinical, O=AnesthAssist, L=Cairo, ST=Cairo, C=EG"

Write-Host "Upload keystore generated: $KeystorePath"
Write-Host "To base64 encode for GitHub Secrets run:"
Write-Host "[Convert]::ToBase64String([IO.File]::ReadAllBytes('$KeystorePath')) | Set-Clipboard"
```

Create `scripts/generate-keystore.sh`:
```bash
#!/usr/bin/env bash
set -euo pipefail

KEYSTORE_PATH="anesthassist-upload-keystore.jks"
if [ -f "$KEYSTORE_PATH" ]; then
    echo "Warning: Keystore already exists at $KEYSTORE_PATH. Skipping generation."
    exit 0
fi

echo "Generating Android Upload Keystore for online.anesthassist.app..."
keytool -genkey -v -keystore "$KEYSTORE_PATH" -alias anesthassist -keyalg RSA -keysize 2048 -validity 10000 \
    -dname "CN=Dr. Mohamed Abdelwahab, OU=Clinical, O=AnesthAssist, L=Cairo, ST=Cairo, C=EG"

echo "Upload keystore generated: $KEYSTORE_PATH"
echo "To base64 encode for GitHub Secrets run:"
echo "base64 -w 0 $KEYSTORE_PATH"
```

- [ ] **Step 2: Create `docs/google-play-keystore-setup.md`**

Document how to run the script, where to store the `.jks` securely, and how to add `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEY_ALIAS`, `ANDROID_KEYSTORE_PASSWORD`, and `ANDROID_KEY_PASSWORD` to GitHub Repository Secrets.

- [ ] **Step 3: Commit changes**

```bash
git add scripts/generate-keystore.ps1 scripts/generate-keystore.sh docs/google-play-keystore-setup.md
git commit -m "docs(security): add keystore generation scripts and secrets guide"
```

---

### Task 5: Automated GitHub Actions CI/CD Release Pipeline

**Files:**
- Create: `.github/workflows/android-release.yml`
- Test: `src/lib/__tests__/workflowIntegrity.test.ts`

- [ ] **Step 1: Write test verifying workflow structure and triggers**

Create `src/lib/__tests__/workflowIntegrity.test.ts`:
```typescript
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Android Release Workflow Integrity', () => {
  const workflowPath = join(process.cwd(), '.github/workflows/android-release.yml');

  it('workflow file exists and contains release job', () => {
    const yaml = readFileSync(workflowPath, 'utf8');
    expect(yaml).toContain('name: Build & Sign Android App Bundle');
    expect(yaml).toContain('workflow_dispatch:');
    expect(yaml).toContain('bundleRelease');
    expect(yaml).toContain('upload-artifact');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/__tests__/workflowIntegrity.test.ts`  
Expected: FAIL (File not found)

- [ ] **Step 3: Create `.github/workflows/android-release.yml`**

Create `.github/workflows/android-release.yml` containing:
- Manual trigger (`workflow_dispatch`) and tag trigger (`v*`).
- Java 17 and Android SDK setup.
- Web build (`npm run build`).
- Native sync (`npx cap sync android`).
- Release bundle generation (`./gradlew bundleRelease`).
- Keystore signing step.
- Artifact upload (`app-release.aab`).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/__tests__/workflowIntegrity.test.ts`  
Expected: PASS (1/1 test passed)

- [ ] **Step 5: Commit changes**

```bash
git add .github/workflows/android-release.yml src/lib/__tests__/workflowIntegrity.test.ts
git commit -m "ci(android): add automated GitHub Actions build and sign workflow"
```

---

### Task 6: Google Play Store Submission Package & Visual Assets Generator

**Files:**
- Create: `docs/google-play-listing.md`
- Create: `scripts/generate-feature-graphic.py`
- Create: `public/feature-graphic.png` (1024x500)

- [ ] **Step 1: Create `docs/google-play-listing.md`**

Write the complete Google Play Store package:
- App Title: `AnesthAssist: OR Decision Aid` (28 chars)
- Short Description: `Offline cognitive aid and dosing guide for anesthesia providers in the OR.` (76 chars)
- Full Description: Clinical capabilities, 8 dosing categories, 110 Stoelting 8e perioperative plans, pediatric dilution engine, emergency algorithms (LAST, MH, CICO), zero-PHI guarantee, educational disclaimer.
- Data Safety Form Q&A (zero data collected, zero data shared).
- Clinical Lead Attribution: Dr. Mohamed Abdelwahab.

- [ ] **Step 2: Create feature graphic generator script `scripts/generate-feature-graphic.py`**

Write Python script using `Pillow` to generate the official 1024x500 banner (`public/feature-graphic.png`) with dark clinical theme (`#090d16`), cyan accent (`#06b6d4`), title `AnesthAssist`, subtitle `OR Decision Aid · Offline Cognitive Support`, and Dr. Mohamed Abdelwahab attribution.

- [ ] **Step 3: Run generator script and verify output**

Run: `python scripts/generate-feature-graphic.py`  
Expected: Creates `public/feature-graphic.png` with dimensions 1024x500.

- [ ] **Step 4: Commit changes**

```bash
git add docs/google-play-listing.md scripts/generate-feature-graphic.py public/feature-graphic.png
git commit -m "docs(play-store): add store listing copy and 1024x500 feature graphic"
```

---

### Task 7: Full Verification & Documentation Update

**Files:**
- Modify: `README.md` (Add Android App section and Play Store instructions)
- Test: Full verification suite (`npm test`, `npx tsc -b`, `npm run build`)

- [ ] **Step 1: Update `README.md`**

Add an "Android App & Google Play" section explaining:
- Package ID: `online.anesthassist.app`
- How to trigger a build via GitHub Actions to download `app-release.aab`
- Link to `docs/google-play-listing.md` and `docs/google-play-keystore-setup.md`.

- [ ] **Step 2: Run all tests and build verification**

Run:
```bash
npm test
npx tsc -b
npm run build
```
Expected: All 445+ tests pass, TypeScript compiles with zero errors, Vite builds `dist/` cleanly.

- [ ] **Step 3: Commit changes**

```bash
git add README.md
git commit -m "docs: document Android app architecture and Google Play release workflow"
```
