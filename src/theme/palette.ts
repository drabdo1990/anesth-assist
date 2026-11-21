import colors from 'tailwindcss/colors';

export type Theme = 'dark' | 'light';

export const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;
export const FAMILIES = ['slate', 'cyan', 'amber', 'emerald', 'red', 'violet', 'sky'] as const;
type Family = (typeof FAMILIES)[number];

// Light-mode shade for each dark-mode shade. Slate mirrors fully so muted text stays readable.
const MIRROR: Record<number, number> = { 50: 950, 100: 900, 200: 800, 300: 700, 400: 600, 500: 500, 600: 400, 700: 300, 800: 200, 900: 100, 950: 50 };
// Accent families keep 400-600 so solid fills (buttons, chips) look the same in both themes.
const ACCENT_MIRROR: Record<number, number> = { ...MIRROR, 400: 400, 600: 600 };

export const CLINICAL = {
  dark: {
    bg: '#090d16', card: '#131b2e', border: '#1e293b', 'border-light': '#334155',
    cyan: '#06b6d4', red: '#ef4444', emerald: '#10b981', amber: '#f59e0b', purple: '#a855f7',
  },
  light: {
    bg: '#f8fafc', card: '#ffffff', border: '#e2e8f0', 'border-light': '#cbd5e1',
    cyan: '#0e7490', red: '#b91c1c', emerald: '#047857', amber: '#b45309', purple: '#7e22ce',
  },
} as const satisfies Record<Theme, Record<string, string>>;

const table = colors as unknown as Record<Family, Record<number, string>>;

export const shadeHex = (family: Family, shade: number, theme: Theme): string => {
  const map = family === 'slate' ? MIRROR : ACCENT_MIRROR;
  return table[family][theme === 'dark' ? shade : map[shade]];
};

/** "#rrggbb" to "R G B", the channel form Tailwind's `<alpha-value>` placeholder needs. */
const triple = (hex: string): string => {
  const h = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)).join(' ');
};

export const themeVars = (theme: Theme): Record<string, string> => {
  const vars: Record<string, string> = {};
  for (const f of FAMILIES) for (const s of SHADES) vars[`--c-${f}-${s}`] = triple(shadeHex(f, s, theme));
  for (const [key, hex] of Object.entries(CLINICAL[theme])) vars[`--clinical-${key}`] = triple(hex);
  return vars;
};

export const colorTokens = (): Record<string, Record<string, string>> => {
  const out: Record<string, Record<string, string>> = {};
  for (const f of FAMILIES) {
    out[f] = Object.fromEntries(SHADES.map((s) => [String(s), `rgb(var(--c-${f}-${s}) / <alpha-value>)`]));
  }
  out.clinical = Object.fromEntries(Object.keys(CLINICAL.dark).map((k) => [k, `rgb(var(--clinical-${k}) / <alpha-value>)`]));
  return out;
};
