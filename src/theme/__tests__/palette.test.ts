import colors from 'tailwindcss/colors';
import { describe, expect, it } from 'vitest';
import { CLINICAL, FAMILIES, SHADES, colorTokens, shadeHex, themeVars, type Theme } from '../palette';

const THEMES: Theme[] = ['dark', 'light'];
const ACCENTS = FAMILIES.filter((f) => f !== 'slate');

const rgb = (hex: string): [number, number, number] => {
  const h = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
};
const luminance = ([r, g, b]: [number, number, number]) => {
  const [R, G, B] = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
};
const contrast = (a: [number, number, number], b: [number, number, number]) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
const mix = (a: [number, number, number], b: [number, number, number], alpha: number): [number, number, number] =>
  a.map((v, i) => v * alpha + b[i] * (1 - alpha)) as [number, number, number];

const surfaces = (t: Theme) => [CLINICAL[t].bg, CLINICAL[t].card, ...[900, 800, 950].map((s) => shadeHex('slate', s, t))];

describe('palette', () => {
  it('dark values are exactly Tailwind defaults and the old clinical hexes, so dark mode does not change', () => {
    for (const f of FAMILIES) {
      for (const s of SHADES) expect(shadeHex(f, s, 'dark'), `${f}-${s}`).toBe((colors as unknown as Record<string, Record<number, string>>)[f][s]);
    }
    expect(CLINICAL.dark).toEqual({
      bg: '#090d16', card: '#131b2e', border: '#1e293b', 'border-light': '#334155',
      cyan: '#06b6d4', red: '#ef4444', emerald: '#10b981', amber: '#f59e0b', purple: '#a855f7',
    });
  });

  it('both themes define exactly the same variables, so no class loses its color in either theme', () => {
    expect(Object.keys(themeVars('light')).sort()).toEqual(Object.keys(themeVars('dark')).sort());
  });

  it('exposes a Tailwind token for every family and shade, using the alpha placeholder', () => {
    const tokens = colorTokens();
    for (const f of FAMILIES) for (const s of SHADES) expect(tokens[f][s]).toBe(`rgb(var(--c-${f}-${s}) / <alpha-value>)`);
    expect(tokens.clinical.bg).toBe('rgb(var(--clinical-bg) / <alpha-value>)');
  });

  it('slate mirrors fully: slate-400 text in light is the dark slate-600 value', () => {
    expect(shadeHex('slate', 400, 'light')).toBe(shadeHex('slate', 600, 'dark'));
    expect(shadeHex('slate', 950, 'light')).toBe(shadeHex('slate', 50, 'dark'));
  });

  it('accent shades 400-600 are identical in both themes, so solid buttons keep their color', () => {
    for (const f of ACCENTS) for (const s of [400, 500, 600] as const) expect(shadeHex(f, s, 'light'), `${f}-${s}`).toBe(shadeHex(f, s, 'dark'));
    expect(shadeHex('cyan', 300, 'light')).toBe(shadeHex('cyan', 700, 'dark'));
  });

  it.each(THEMES)('%s: slate-100 to slate-400 text reads at 4.5:1 on every surface', (t) => {
    for (const shade of [100, 200, 300, 400]) {
      for (const bg of surfaces(t)) {
        expect(contrast(rgb(shadeHex('slate', shade, t)), rgb(bg)), `${t} slate-${shade} on ${bg}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it.each(THEMES)('%s: accent text (shades 100-300) reads at 4.5:1 on the page and on a tinted panel', (t) => {
    for (const f of ACCENTS) {
      for (const shade of [100, 200, 300]) {
        const fg = rgb(shadeHex(f, shade, t));
        const tint = mix(rgb(shadeHex(f, 950, t)), rgb(CLINICAL[t].card), 0.6);
        expect(contrast(fg, rgb(CLINICAL[t].bg)), `${t} ${f}-${shade} on bg`).toBeGreaterThanOrEqual(4.5);
        expect(contrast(fg, tint), `${t} ${f}-${shade} on tint`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  // Light only: the dark clinical colors are the existing ones and are pinned by the parity test above
  // (dark clinical-purple is 4.34:1, below 4.5, and dark mode must not change).
  it('light: clinical accent colors read at 4.5:1 on the page and card', () => {
    for (const key of ['cyan', 'red', 'emerald', 'amber', 'purple'] as const) {
      for (const bg of [CLINICAL.light.bg, CLINICAL.light.card]) {
        expect(contrast(rgb(CLINICAL.light[key]), rgb(bg)), `light clinical-${key}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
});
