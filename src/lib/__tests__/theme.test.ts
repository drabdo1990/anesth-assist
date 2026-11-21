import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { THEME_COLOR, THEME_KEY, applyTheme, parsePreference, readPreference, resolveTheme, writePreference } from '../theme';

const memoryStore = () => {
  const m = new Map<string, string>();
  return {
    m,
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
  };
};
const blockedStore = {
  getItem: () => {
    throw new Error('blocked');
  },
  setItem: () => {
    throw new Error('blocked');
  },
  removeItem: () => {
    throw new Error('blocked');
  },
};

describe('resolveTheme', () => {
  it.each([
    ['system', true, 'dark'],
    ['system', false, 'light'],
    ['light', true, 'light'],
    ['dark', false, 'dark'],
  ] as const)('%s with OS dark=%s -> %s', (pref, systemDark, want) => {
    expect(resolveTheme(pref, systemDark)).toBe(want);
  });
});

describe('stored preference', () => {
  it('treats a missing or invalid value as System', () => {
    expect(parsePreference(null)).toBe('system');
    expect(parsePreference('blue')).toBe('system');
    expect(parsePreference('')).toBe('system');
    expect(readPreference(memoryStore())).toBe('system');
  });

  it('round-trips light and dark, and System removes the key instead of storing it', () => {
    const s = memoryStore();
    writePreference(s, 'dark');
    expect(s.m.get(THEME_KEY)).toBe('dark');
    expect(readPreference(s)).toBe('dark');
    writePreference(s, 'system');
    expect(s.m.has(THEME_KEY)).toBe(false);
  });

  it('does not throw when storage is blocked, and reads as System', () => {
    expect(readPreference(blockedStore)).toBe('system');
    expect(() => writePreference(blockedStore, 'light')).not.toThrow();
    expect(readPreference(null)).toBe('system');
  });
});

describe('applyTheme', () => {
  it('sets data-theme and the browser tab color', () => {
    const root = { dataset: {} as Record<string, string | undefined> };
    const meta = { content: '' };
    applyTheme(root, meta, 'light');
    expect(root.dataset.theme).toBe('light');
    expect(meta.content).toBe(THEME_COLOR.light);
    applyTheme(root, null, 'dark');
    expect(root.dataset.theme).toBe('dark');
  });
});

describe('index.html no-flash script', () => {
  const html = readFileSync(fileURLToPath(new URL('../../../index.html', import.meta.url)), 'utf8');

  it('runs before the app bundle and uses the same key and colors as theme.ts', () => {
    const script = html.indexOf(THEME_KEY);
    expect(script).toBeGreaterThan(-1);
    expect(script).toBeLessThan(html.indexOf('type="module"'));
    expect(html).toContain(THEME_COLOR.dark);
    expect(html).toContain(THEME_COLOR.light);
    expect(html).toContain('dataset.theme');
    expect(html).toContain('name="color-scheme"');
  });
});
