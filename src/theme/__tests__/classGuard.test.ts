import { readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = fileURLToPath(new URL('../..', import.meta.url));
const files = (dir: string): string[] =>
  readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    if (n === '__tests__') return [];
    return statSync(p).isDirectory() ? files(p) : p.endsWith('.tsx') ? [p] : [];
  });
const sources = files(SRC).map((p) => ({ p: p.slice(SRC.length), text: readFileSync(p, 'utf8') }));
const offenders = (re: RegExp) => sources.filter((s) => re.test(s.text)).map((s) => s.p);

describe('classes that would break in light mode', () => {
  it('no text-slate-950: it mirrors to near-white and would vanish on solid accent buttons; use text-black', () => {
    expect(offenders(/text-slate-950/)).toEqual([]);
  });

  it('no hard-coded page or card hex: use bg-clinical-bg and bg-clinical-card so they follow the theme', () => {
    expect(offenders(/\[#(090d16|131b2e)\]/)).toEqual([]);
  });

  it('no accent text at shade 400: it is unreadable on light; use shade 300, which mirrors', () => {
    expect(offenders(/\btext-(red|amber|cyan|emerald|violet|sky)-400\b/)).toEqual([]);
  });

  it('no hover:text-white on a themed surface: it would vanish on light; use hover:text-slate-100', () => {
    expect(offenders(/hover:text-white/)).toEqual([]);
  });

  it('only color families that the theme maps (slate, cyan, amber, emerald, red, violet, sky, clinical)', () => {
    const unmapped = /\b(?:bg|text|border|ring|from|to|via|fill|stroke|divide|outline|accent|caret|placeholder)-(?:gray|zinc|neutral|stone|orange|yellow|lime|green|teal|blue|indigo|purple|fuchsia|pink|rose)-\d{2,3}\b/;
    expect(offenders(unmapped)).toEqual([]);
  });
});
