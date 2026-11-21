import { useSyncExternalStore } from 'react';

export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

/** No stored value means System. Kept out of the Zustand store so its persist version is untouched. */
export const THEME_KEY = 'anesthassist-theme';
/** Browser tab color. The inline script in index.html carries the same two values. */
export const THEME_COLOR: Record<ResolvedTheme, string> = { dark: '#090d16', light: '#f8fafc' };

export const resolveTheme = (pref: ThemePreference, systemDark: boolean): ResolvedTheme =>
  pref === 'system' ? (systemDark ? 'dark' : 'light') : pref;

export const parsePreference = (raw: string | null): ThemePreference => (raw === 'light' || raw === 'dark' ? raw : 'system');

export const readPreference = (store: Pick<Storage, 'getItem'> | null): ThemePreference => {
  try {
    return parsePreference(store?.getItem(THEME_KEY) ?? null);
  } catch {
    return 'system';
  }
};

export const writePreference = (store: Pick<Storage, 'setItem' | 'removeItem'> | null, pref: ThemePreference): void => {
  try {
    if (pref === 'system') store?.removeItem(THEME_KEY);
    else store?.setItem(THEME_KEY, pref);
  } catch {
    /* storage blocked: the choice still applies for this session */
  }
};

export const applyTheme = (
  root: { dataset: Record<string, string | undefined> },
  meta: { content: string } | null,
  theme: ResolvedTheme,
): void => {
  root.dataset.theme = theme;
  if (meta) meta.content = THEME_COLOR[theme];
};

// ---- browser wiring (not unit-tested: it only connects the pure functions above to the page) ----

const safeStorage = (): Storage | null => {
  try {
    return localStorage;
  } catch {
    return null;
  }
};
const systemQuery = (): MediaQueryList | null => (typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: dark)') : null);

let preference: ThemePreference = 'system';
const listeners = new Set<() => void>();

const apply = () => {
  // No matchMedia: stay dark, which is what the app looked like before themes existed.
  const systemDark = systemQuery()?.matches ?? true;
  applyTheme(document.documentElement, document.querySelector<HTMLMetaElement>('meta[name="theme-color"]'), resolveTheme(preference, systemDark));
  listeners.forEach((l) => l());
};

/** Call once, before React renders. Follows OS changes while the preference is System. */
export const initTheme = (): void => {
  preference = readPreference(safeStorage());
  apply();
  systemQuery()?.addEventListener('change', apply);
  // Another tab changed the choice.
  window.addEventListener('storage', (e) => {
    if (e.key !== THEME_KEY) return;
    preference = parsePreference(e.newValue);
    apply();
  });
};

export const setThemePreference = (pref: ThemePreference): void => {
  preference = pref;
  writePreference(safeStorage(), pref);
  apply();
};

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const useThemePreference = (): ThemePreference => useSyncExternalStore(subscribe, () => preference);
