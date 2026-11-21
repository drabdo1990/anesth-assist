import { describe, expect, it } from 'vitest';
import { CHECKLISTS } from '../checklists';

const fasting = CHECKLISTS.find((c) => c.id === 'fasting-npo');
const items = fasting?.items ?? [];

describe('preoperative fasting checklist', () => {
  it('covers routine intervals, children and special scenarios', () => {
    expect(fasting).toBeDefined();
    expect(items.map((i) => i.id)).toEqual(
      expect.arrayContaining([
        'fasting-assessment',
        'fasting-solids',
        'fasting-nonclear',
        'fasting-clear',
        'fasting-clear-liberal',
        'fasting-carbohydrate',
        'fasting-gum',
        'fasting-peds-clear',
        'fasting-breast-milk',
        'fasting-formula',
        'fasting-enteral',
        'fasting-risk-conditions',
        'fasting-bariatric',
        'fasting-glp-assessment',
        'fasting-glp-symptoms',
        'fasting-glp-high-risk',
        'fasting-glp-spaqi',
        'fasting-elective-obstetric',
        'fasting-labor',
        'fasting-emergency',
        'fasting-unscheduled-sedation',
        'fasting-pocus',
        'fasting-bowel-prep',
      ]),
    );
  });

  it('cites each guideline family used', () => {
    expect([...new Set(items.flatMap((i) => i.sourceIds))]).toEqual(
      expect.arrayContaining([
        'asa-fasting-2017',
        'asa-fasting-2023',
        'adult-fasting-2026',
        'glp1-multisociety-2024',
        'glp1-spaqi-2025',
        'asa-obstetric-2016',
        'asa-labor-2022',
        'acep-unscheduled-2026',
      ]),
    );
  });

  it('keeps the source-specific SPAQI protocol distinct', () => {
    const protocol = items.find((i) => i.id === 'fasting-glp-spaqi');
    expect(protocol?.text).toContain('SPAQI 2025');
    expect(protocol?.text).toContain('24 h');
    expect(protocol?.text).toContain('<10% glucose');
    expect(protocol?.text).toContain('4 h');
    expect(protocol?.text).toContain('≥10% glucose');
    expect(protocol?.text).toContain('8 h');
    expect(protocol?.sourceIds).toEqual(['glp1-spaqi-2025']);
  });
});
