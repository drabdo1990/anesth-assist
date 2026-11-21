import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { SOURCE_BY_ID } from '../sources';

// SourceBadge silently skips unknown ids, so a typo or a deleted source would hide a citation without any error.
// This scans every literal source id passed in src (components, views, data) and requires it to be registered.

const SRC_ROOT = join(__dirname, '..', '..');

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return name === '__tests__' ? [] : walk(p);
    return /\.tsx?$/.test(name) ? [p] : [];
  });

const literalSourceIds = (text: string): string[] => {
  const ids: string[] = [];
  for (const m of text.matchAll(/sourceIds?\s*[:=]\s*\{?\s*\[([^\]]*)\]/g)) {
    for (const s of m[1].matchAll(/'([a-z0-9-]+)'/g)) ids.push(s[1]);
  }
  for (const m of text.matchAll(/sourceId\s*[:=]\s*\{?\s*'([a-z0-9-]+)'/g)) ids.push(m[1]);
  return ids;
};

describe('literal source ids', () => {
  it('every sourceId/sourceIds literal in src exists in the source registry', () => {
    const missing: string[] = [];
    for (const file of walk(SRC_ROOT)) {
      if (file.endsWith('sources.ts')) continue;
      for (const id of literalSourceIds(readFileSync(file, 'utf8'))) {
        if (!(id in SOURCE_BY_ID)) missing.push(`${file.slice(SRC_ROOT.length + 1)} -> ${id}`);
      }
    }
    expect(missing).toEqual([]);
  });
});
