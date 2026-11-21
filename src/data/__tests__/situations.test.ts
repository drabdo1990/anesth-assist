import { describe, expect, it } from 'vitest';
import { SITUATIONS } from '../situations';
import { MEDICATIONS } from '../medications';

const ids = new Set(MEDICATIONS.map((m) => m.id));
describe('SITUATIONS', () => {
  it('only references existing medications', () => {
    for (const s of SITUATIONS) for (const d of s.drugIds) expect(ids.has(d), `${s.id}:${d}`).toBe(true);
  });
  it('has unique situation ids and no empty lists', () => {
    expect(new Set(SITUATIONS.map((s) => s.id)).size).toBe(SITUATIONS.length);
    for (const s of SITUATIONS) expect(s.drugIds.length).toBeGreaterThan(0);
  });
});
