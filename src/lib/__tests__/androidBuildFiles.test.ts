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
    expect(content).toContain('namespace = "online.anesthassist.app"');
    expect(content).toContain('applicationId "online.anesthassist.app"');
  });

  it('locks orientation to portrait for clinical touch accuracy', () => {
    const content = readFileSync(manifestPath, 'utf8');
    expect(content).toContain('android:screenOrientation="portrait"');
  });
});
