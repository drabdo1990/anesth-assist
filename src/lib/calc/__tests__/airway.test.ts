import { describe, expect, it } from 'vitest';
import { DLT_BANDS, DLT_SAFETY_FLOOR } from '../../../data/airwayDevices';
import {
  adultEttAndBlade,
  dltSizeForHeight,
  lmaSizeForWeight,
  pedsBladeForAge,
  pedsEtt,
  roundToHalf,
} from '../airway';

describe('pediatric ETT', () => {
  it('cuffed = age/4 + 3.5, depth = 3 x ID', () => {
    const r = pedsEtt(4, 'cuffed-msd');
    if (!r.ok) throw new Error('expected ok');
    expect(r.idMm).toBe(4.5);
    expect(r.idRoundedMm).toBe(4.5);
    expect(r.depthCm).toBe(13.5);
  });

  it('alternate cuffed formula age/4 + 3 is 0.5 mm smaller', () => {
    const a = pedsEtt(8, 'cuffed-msd');
    const b = pedsEtt(8, 'cuffed-iowa');
    if (!a.ok || !b.ok) throw new Error('expected ok');
    expect(a.idMm - b.idMm).toBe(0.5);
  });

  it('uncuffed = age/4 + 4', () => {
    const r = pedsEtt(4, 'uncuffed-msd');
    if (!r.ok) throw new Error('expected ok');
    expect(r.idMm).toBe(5);
    expect(r.depthCm).toBe(15);
  });

  it('depth uses the displayed, rounded tube size', () => {
    const r = pedsEtt(5, 'cuffed-msd');
    if (!r.ok) throw new Error('expected ok');
    expect(r.idMm).toBe(4.75);
    expect(r.idRoundedMm).toBe(5);
    expect(r.depthCm).toBe(15);
  });

  it.each([0.5, 0.99, 8.01, 12, Number.NaN])('has no sourced value at age %s', (age) => {
    expect(pedsEtt(age, 'cuffed-msd').ok).toBe(false);
  });

  it('rejects an unknown formula', () => {
    expect(pedsEtt(4, 'nope').ok).toBe(false);
  });

  it('rounds to the nearest 0.5', () => {
    expect(roundToHalf(4.2)).toBe(4);
    expect(roundToHalf(4.3)).toBe(4.5);
    expect(roundToHalf(4.75)).toBe(5);
  });
});

describe('LMA size by weight', () => {
  it.each([
    [3, '1'],
    [7, '1.5'],
    [15, '2'],
    [25, '2.5'],
    [40, '3'],
    [60, '4'],
    [85, '5'],
    [120, '6'],
  ])('%s kg -> size %s', (kg, size) => {
    const r = lmaSizeForWeight(kg);
    if (!r.ok) throw new Error('expected ok');
    expect(r.band.size).toBe(size);
    expect(r.borderlineNext).toBeUndefined();
  });

  it('flags a weight exactly on a band boundary with the next size', () => {
    const r = lmaSizeForWeight(50);
    if (!r.ok) throw new Error('expected ok');
    expect(r.band.size).toBe('3');
    expect(r.borderlineNext?.size).toBe('4');
  });

  it('50.1 kg is size 4 with no boundary flag', () => {
    const r = lmaSizeForWeight(50.1);
    if (!r.ok) throw new Error('expected ok');
    expect(r.band.size).toBe('4');
    expect(r.borderlineNext).toBeUndefined();
  });

  it('returns cuff volume ceilings', () => {
    const r = lmaSizeForWeight(60);
    if (!r.ok) throw new Error('expected ok');
    expect(r.band.maxCuffVolumeMl).toBe(30);
  });

  it.each([0, -1, Number.NaN])('rejects weight %s', (kg) => {
    expect(lmaSizeForWeight(kg).ok).toBe(false);
  });
});

describe('pediatric blade by age', () => {
  it('returns sourced bands', () => {
    expect(pedsBladeForAge(0)?.blade).toBe('Miller 0');
    expect(pedsBladeForAge(8)?.blade).toBe('Miller 1');
    expect(pedsBladeForAge(30)?.blade).toBe('Miller 1.5');
    expect(pedsBladeForAge(60)?.blade).toBe('Miller 2 or Macintosh 2');
  });

  it('returns null where the source has no value', () => {
    expect(pedsBladeForAge(3)).toBeNull();
    expect(pedsBladeForAge(18)).toBeNull();
    expect(pedsBladeForAge(120)).toBeNull();
    expect(pedsBladeForAge(-1)).toBeNull();
  });
});

describe('adult ETT and blade sizing', () => {
  it('returns female sizing standards', () => {
    const r = adultEttAndBlade('female');
    if (!r.ok) throw new Error('expected ok');
    expect(r.idRangeMm).toBe('7.0–7.5');
    expect(r.frenchRange).toBe('28–30');
    expect(r.oralDepthRangeCm).toBe('20–22');
    expect(r.blade).toBe('Macintosh 3');
  });

  it('returns male sizing standards', () => {
    const r = adultEttAndBlade('male');
    if (!r.ok) throw new Error('expected ok');
    expect(r.idRangeMm).toBe('8.0–8.5');
    expect(r.frenchRange).toBe('32–34');
    expect(r.oralDepthRangeCm).toBe('22–24');
    expect(r.blade).toBe('Macintosh 3–4');
  });

  it('rejects null or missing sex', () => {
    expect(adultEttAndBlade(null).ok).toBe(false);
  });
});

describe('DLT sizing by height', () => {
  it.each([
    [155, '35–37 Fr'],
    [164.9, '35–37 Fr'],
    [165, '37–39 Fr'],
    [175, '37–39 Fr'],
    [178, '37–39 Fr'],
    [178.1, '39–41 Fr'],
    [190, '39–41 Fr'],
  ])('height %s cm -> %s', (heightCm, expectedFr) => {
    const r = dltSizeForHeight(heightCm, 18);
    if (!r.ok) throw new Error('expected ok');
    expect(r.sizeFr).toBe(expectedFr);
  });

  it('rejects height < 150 cm and labels the rule as unsourced', () => {
    const shortAdult = dltSizeForHeight(149.9, 18);
    expect(shortAdult.ok).toBe(false);
    if (!shortAdult.ok) {
      expect(shortAdult.reason).toContain('< 150 cm');
      expect(shortAdult.reason).toContain('no source');
    }
    expect(dltSizeForHeight(100, 18).ok).toBe(false);
  });

  it('keeps the sourced "Short (< 165 cm)" band down to the safety floor: 150 cm gets 35-37 Fr', () => {
    const r = dltSizeForHeight(150, 18);
    if (!r.ok) throw new Error('expected ok');
    expect(r.sizeFr).toBe('35–37 Fr');
    expect(r.category).toBe('Short (< 165 cm / < 5\'5")');
  });

  it('rejects patients under 18 by age even when the height is in range', () => {
    const teen = dltSizeForHeight(165, 15);
    expect(teen.ok).toBe(false);
    if (!teen.ok) expect(teen.reason).toContain('age < 18');
    expect(dltSizeForHeight(165, 17.99).ok).toBe(false);
  });

  it('allows adults but requires age before showing an adult DLT size', () => {
    expect(dltSizeForHeight(165, 18).ok).toBe(true);
    expect(dltSizeForHeight(165, null).ok).toBe(false);
    expect(dltSizeForHeight(165).ok).toBe(false);
  });

  it('declares the safety floor as having no source, so it cannot pass for sourced data', () => {
    expect(DLT_SAFETY_FLOOR.sourceIds).toEqual([]);
    expect(DLT_SAFETY_FLOOR.minHeightCm).toBe(150);
    expect(DLT_SAFETY_FLOOR.minAgeYears).toBe(18);
  });

  it('keeps every sourced DLT band free of the app floor (bands stay exactly as sourced)', () => {
    const [short, medium, tall] = DLT_BANDS;
    expect(short.minHeightCm).toBeNull();
    expect(short.maxHeightCm).toBe(165);
    expect([medium.minHeightCm, medium.maxHeightCm]).toEqual([165, 178]);
    expect([tall.minHeightCm, tall.maxHeightCm]).toEqual([178, null]);
    for (const b of DLT_BANDS) expect(b.sourceIds.length).toBeGreaterThan(0);
  });

  it('rejects null or invalid height', () => {
    expect(dltSizeForHeight(null).ok).toBe(false);
    expect(dltSizeForHeight(-10).ok).toBe(false);
    expect(dltSizeForHeight(Number.NaN).ok).toBe(false);
  });
});

