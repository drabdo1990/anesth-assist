import { describe, expect, it } from 'vitest';
import { PONV_PLAN } from '../ponvPlan';
import { SOURCE_BY_ID } from '../sources';

describe('PONV plan', () => {
  it('cites the ASER 2025 appendix, which is a primary source', () => {
    expect(PONV_PLAN.sourceIds).toEqual(['aser-ponv-5th-2025']);
    expect(SOURCE_BY_ID['aser-ponv-5th-2025'].verification).toBe('primary');
  });

  it('lists the five baseline-risk strategies and says 2 interventions for adults', () => {
    expect(PONV_PLAN.adults.riskReduction).toHaveLength(5);
    expect(PONV_PLAN.adults.headline).toContain('2 interventions');
  });

  it('states no dose anywhere', () => {
    const all = [PONV_PLAN.adults.headline, ...PONV_PLAN.adults.riskReduction, PONV_PLAN.adults.doseNote, PONV_PLAN.children].join(' ');
    expect(all).not.toMatch(/\b\d+(\.\d+)?\s*(mg|mcg|ml|mg\/kg|g)\b/i);
  });

  it('gives children a pointer only', () => {
    expect(PONV_PLAN.children).toContain('Pediatric');
    expect(PONV_PLAN.children).toContain('not encoded');
  });
});
