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
