import { describe, expect, it } from 'vitest';
import { GLP1_PROTOCOLS } from '../glp1Protocols';
import { SOURCE_BY_ID } from '../sources';

describe('GLP-1 protocol reference', () => {
  it('lists each published conflicting protocol separately without the local rule', () => {
    expect(GLP1_PROTOCOLS.map((p) => p.id)).toEqual([
      'asa-glp1-2023',
      'multisociety-glp1-2024',
      'spaqi-glp1-2025',
      'uk-glp1-2025',
      'anzca-glp1-2025',
    ]);
    expect(GLP1_PROTOCOLS.some((p) => p.sourceId === 'local-protocol')).toBe(false);
  });

  it('resolves every protocol to a registered, linked source', () => {
    for (const protocol of GLP1_PROTOCOLS) {
      const source = SOURCE_BY_ID[protocol.sourceId];
      expect(source, protocol.id).toBeDefined();
      expect(protocol.drugRule.length, protocol.id).toBeGreaterThan(0);
      expect(protocol.fastingRule.length, protocol.id).toBeGreaterThan(0);
      expect(protocol.distinction.length, protocol.id).toBeGreaterThan(0);
      expect(source.url, protocol.id).toBeTruthy();
    }
  });

  it('keeps each protocol actual rule distinct', () => {
    const text = (id: string): string => {
      const p = GLP1_PROTOCOLS.find((x) => x.id === id);
      return `${p?.drugRule} ${p?.fastingRule}`;
    };
    expect(text('asa-glp1-2023')).toContain('hold');
    expect(GLP1_PROTOCOLS[0].distinction).toContain('Superseded');
    expect(text('multisociety-glp1-2024')).toContain('Most patients continue');
    expect(text('spaqi-glp1-2025')).toContain('24 h');
    expect(text('uk-glp1-2025')).toContain('standard');
    expect(text('anzca-glp1-2025')).toContain('24 h clear-fluid');
  });
});
