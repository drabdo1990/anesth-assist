import { describe, expect, it } from 'vitest';
import { DOAC_RULE, PERIOP_RULES } from '../../../data/periopMeds';
import { ASRA_RULES } from '../../../data/periopAsra';
import { matchTimings } from '../periopMeds';

const dabigatran = DOAC_RULE.drugs.find((d) => d.id === 'dabigatran')!;
const apixaban = DOAC_RULE.drugs.find((d) => d.id === 'apixaban')!;

const byWhen = (m: ReturnType<typeof matchTimings>, text: string) => m.find((x) => x.timing.when?.includes(text))!;

describe('matchTimings (dabigatran by creatinine clearance)', () => {
  it('CrCl exactly 50 takes the 1 to 2 day line', () => {
    const m = matchTimings(dabigatran, 50);
    expect(byWhen(m, '50 mL/min or more').match).toBe('yes');
    expect(byWhen(m, 'below 50').match).toBe('no');
  });

  it('CrCl 49.9 takes the 3 to 5 day line', () => {
    const m = matchTimings(dabigatran, 49.9);
    expect(byWhen(m, '50 mL/min or more').match).toBe('no');
    expect(byWhen(m, 'below 50').match).toBe('yes');
  });

  it('without a CrCl both lines stay visible and are marked unknown', () => {
    const m = matchTimings(dabigatran, null);
    expect(byWhen(m, '50 mL/min or more').match).toBe('unknown');
    expect(byWhen(m, 'below 50').match).toBe('unknown');
  });

  it('the unconditional line is always shown', () => {
    expect(matchTimings(dabigatran, 80).filter((x) => x.match === 'always')).toHaveLength(1);
  });
});

describe('matchTimings (unconditional drugs)', () => {
  it('apixaban keeps both lines, marked always, whatever the CrCl', () => {
    for (const crcl of [null, 20, 90]) {
      const m = matchTimings(apixaban, crcl);
      expect(m).toHaveLength(2);
      expect(m.every((x) => x.match === 'always')).toBe(true);
    }
  });
});

describe('CrCl-conditional timings never leave a gap or an overlap', () => {
  it.each([0, 10, 29.9, 49.99, 50, 50.01, 89, 150])('CrCl %s matches exactly one conditional line per drug', (crcl) => {
    for (const drug of PERIOP_RULES.flatMap((r) => r.drugs)) {
      const conditional = matchTimings(drug, crcl).filter((x) => x.match !== 'always');
      // A single conditional line (ASRA fondaparinux, "no block below CrCl 30") is a one-sided exclusion, not a set of alternatives.
      if (conditional.length < 2) continue;
      expect(conditional.filter((x) => x.match === 'yes'), `${drug.id} at ${crcl}`).toHaveLength(1);
    }
  });
});

describe('ASRA dabigatran lines follow creatinine clearance and never disappear', () => {
  const dabi = ASRA_RULES.find((r) => r.id === 'asra-doac')!.drugs.find((d) => d.id === 'dabigatran-asra')!;
  const states = (crcl: number | null) => matchTimings(dabi, crcl).map((m) => m.match);

  it('CrCl 68: the 72-hour line fits', () => expect(states(68)).toEqual(['yes', 'no', 'no', 'always', 'always']));
  it('CrCl 45: the 120-hour line fits', () => expect(states(45)).toEqual(['no', 'yes', 'no', 'always', 'always']));
  it('CrCl 20: the "no block unless the level is below 30 ng/mL" line fits', () => expect(states(20)).toEqual(['no', 'no', 'yes', 'always', 'always']));
  it('no CrCl: every CrCl line stays visible', () => expect(states(null)).toEqual(['unknown', 'unknown', 'unknown', 'always', 'always']));
});

describe('ASRA fondaparinux: the "no block below CrCl 30" line follows creatinine clearance', () => {
  const fonda = ASRA_RULES.find((r) => r.id === 'asra-fondaparinux')!.drugs[0];
  const severe = (crcl: number | null) => matchTimings(fonda, crcl)[2].match;

  it('CrCl 20: fits', () => expect(severe(20)).toBe('yes'));
  it('CrCl 40: does not fit, but stays listed', () => expect(severe(40)).toBe('no'));
  it('no CrCl: stays visible', () => expect(severe(null)).toBe('unknown'));
  // The 58-hour line (CrCl 30–50, 50 included) is left untagged: crclBelow is exclusive, so tagging it would grey it out for CrCl 50.0–50.9.
});
