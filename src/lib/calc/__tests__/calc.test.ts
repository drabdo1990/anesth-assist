import { describe, expect, it } from 'vitest';
import {
  calculateAbw40,
  calculateBmi,
  calculateDevineIbw,
  calculateJanmahasatianLbw,
  computeBiometrics,
  isDevineBaselineMet,
} from '../biometrics';
import { calculateDose, calculateVolumeMl, checkAbsoluteMax } from '../dosing';
import { decimalPlaces, formatMcg, formatMg, formatMl, maxDecimalPlaces } from '../format';
import {
  combinedToxicityFraction,
  localAnestheticDoseMg,
  maxAllowedMg,
} from '../localAnesthetic';
import { lipidCumulativeStatus, lipidPlan } from '../lipid';
import {
  dantroleneCumulativeStatus,
  dantroleneDoseMg,
  DANTROLENE_FORMULATIONS,
  vialsFor,
} from '../dantrolene';
import {
  expiratoryTimeSeconds,
  inspiratoryTimeSeconds,
  ardsPlateauAdvice,
  calculateDrivingPressure,
  calculateMinuteVentilationLMin,
  calculateTidalVolumeMl,
  plateauSeverity,
  tidalVolumeSeverity,
} from '../ventilation';

describe('biometrics', () => {
  it('BMI = kg / m^2', () => {
    expect(calculateBmi(70, 175)).toBeCloseTo(22.857, 3);
  });

  it('Devine IBW male/female with the 152.4 cm floor', () => {
    expect(calculateDevineIbw('male', 175)).toBeCloseTo(70.453, 3);
    expect(calculateDevineIbw('female', 162)).toBeCloseTo(45.5 + 0.905 * 9.6, 3);
    expect(calculateDevineIbw('male', 140)).toBe(50);
    expect(calculateDevineIbw('female', 140)).toBe(45.5);
  });

  it('detects whether height meets the Devine baseline floor of 152.4 cm', () => {
    expect(isDevineBaselineMet(152.4)).toBe(true);
    expect(isDevineBaselineMet(170)).toBe(true);
    expect(isDevineBaselineMet(150)).toBe(false);
  });

  it('ABW40 = IBW + 0.4 x (TBW - IBW) only when TBW > IBW', () => {
    expect(calculateAbw40(120, 70)).toBeCloseTo(90, 6);
    expect(calculateAbw40(60, 70)).toBe(60);
  });

  it('Janmahasatian LBW male/female, capped at TBW', () => {
    const bmi = calculateBmi(70, 175);
    expect(calculateJanmahasatianLbw('male', 70, bmi)).toBeCloseTo(55.86, 1);
    expect(calculateJanmahasatianLbw('female', 60, 22)).toBeCloseTo((9270 * 60) / (8780 + 244 * 22), 6);
    // Very low BMI pushes raw LBW above TBW; must be capped.
    expect(calculateJanmahasatianLbw('male', 10, 1)).toBe(10);
  });

  it('keeps PBW uncapped while IBW is capped at TBW', () => {
    const r = computeBiometrics({ tbwKg: 50, heightCm: 180, sex: 'male' });
    if (!r.ok) throw new Error('expected ok');
    expect(r.value.pbw).toBeCloseTo(50 + 0.905 * 27.6, 6);
    expect(r.value.pbw).toBeGreaterThan(70);
    expect(r.value.ibw).toBe(50);
    expect(r.value.abw40).toBe(50);
  });

  it('does not round BMI before computing LBW', () => {
    const r = computeBiometrics({ tbwKg: 70, heightCm: 175, sex: 'male' });
    if (!r.ok) throw new Error('expected ok');
    expect(r.value.lbw).toBe(calculateJanmahasatianLbw('male', 70, calculateBmi(70, 175)));
  });

  it.each([
    [0, 175],
    [-5, 175],
    [70, 0],
    [70, -10],
    [70, 20],
    [70, 300],
    [Number.NaN, 175],
    [70, Number.NaN],
  ])('rejects invalid input (weight %s kg, height %s cm)', (tbwKg, heightCm) => {
    const r = computeBiometrics({ tbwKg, heightCm, sex: 'male' });
    expect(r.ok).toBe(false);
  });
});

describe('dose and volume', () => {
  it('mg/kg dose with exact volume', () => {
    const d = calculateDose(2, 'mg/kg', 55, 10);
    expect(d.mass).toBe(110);
    expect(d.volumeMl).toBe(11);
  });

  it('mcg dose converts to mL via mg (no 1000x error)', () => {
    // Phenylephrine 100 mcg/mL = 0.1 mg/mL; 100 mcg bolus -> 1 mL
    const d = calculateDose(100, 'mcg', 70, 0.1);
    expect(d.massUnit).toBe('mcg');
    expect(d.massMg).toBeCloseTo(0.1, 9);
    expect(d.volumeMl).toBeCloseTo(1, 9);
    const perKg = calculateDose(1, 'mcg/kg', 70, 0.1);
    expect(perKg.mass).toBe(70);
    expect(perKg.volumeMl).toBeCloseTo(0.7, 9);
  });

  it('calculateVolumeMl', () => {
    expect(calculateVolumeMl(110, 10)).toBe(11);
  });

  it('fixed dose ignores weight', () => {
    expect(calculateDose(4, 'mg', 999, 2).volumeMl).toBe(2);
  });

  it('flags absolute max on unrounded values', () => {
    const under = calculateDose(2, 'mg/kg', 49.99, 10);
    expect(checkAbsoluteMax(under, { value: 100, unit: 'mg' })).toBe('ok');
    expect(checkAbsoluteMax(calculateDose(2, 'mg/kg', 50, 10), { value: 100, unit: 'mg' })).toBe('at-limit');
    // 100.04 mg would display as "100.0" but must still exceed a 100 mg ceiling.
    const over = calculateDose(2.0008, 'mg/kg', 50, 10);
    expect(formatMg(over.massMg)).toBe('100.0');
    expect(checkAbsoluteMax(over, { value: 100, unit: 'mg' })).toBe('exceeds');
  });

  it('supports mcg and mL ceilings', () => {
    const d = calculateDose(2, 'mcg/kg', 100, 0.1);
    expect(checkAbsoluteMax(d, { value: 150, unit: 'mcg' })).toBe('exceeds');
    expect(checkAbsoluteMax(d, { value: 1, unit: 'mL' })).toBe('exceeds');
    expect(checkAbsoluteMax(d, { value: 2, unit: 'mL' })).toBe('at-limit');
  });
});

describe('display formatting', () => {
  it('mg: 1 dp unless below 1 mg', () => {
    expect(formatMg(110)).toBe('110.0');
    expect(formatMg(0.456)).toBe('0.46');
  });
  it('mcg: whole unless below 10 mcg', () => {
    expect(formatMcg(99.6)).toBe('100');
    expect(formatMcg(7.25)).toBe('7.3');
  });
  it('mL: 1 dp', () => {
    expect(formatMl(11)).toBe('11.0');
  });
  it('counts the decimal places needed to show a dose exactly', () => {
    expect(decimalPlaces(2)).toBe(0);
    expect(decimalPlaces(0.25)).toBe(2);
    expect(decimalPlaces(0.05)).toBe(2);
    expect(decimalPlaces(0.001)).toBe(3);
  });
  it('keeps a dose visible when the step is coarser than its starting value', () => {
    expect(maxDecimalPlaces(0.1, 0.05, 2, 0.05)).toBe(2);
    expect(maxDecimalPlaces(0.1, 0.25, 2, 0.25)).toBe(2);
  });
});

describe('local anesthetic', () => {
  it('converts % x mL to mg', () => {
    expect(localAnestheticDoseMg(20, 0.5)).toBe(100);
    expect(localAnestheticDoseMg(10, 1)).toBe(100);
  });

  it('max allowed = min(mg/kg x weight, absolute ceiling)', () => {
    expect(maxAllowedMg({ mgPerKg: 2.5, absoluteMaxMg: 175 }, 70)).toBe(175);
    expect(maxAllowedMg({ mgPerKg: 2.5, absoluteMaxMg: 175 }, 50)).toBe(125);
    expect(maxAllowedMg({ mgPerKg: 4 }, 50)).toBe(200);
  });

  it('empty administration list is safe at 0', () => {
    const r = combinedToxicityFraction([]);
    expect(r.total).toBe(0);
    expect(r.status).toBe('safe');
  });

  it('sums fractions and trips at 1.0', () => {
    const safe = combinedToxicityFraction([
      { doseMg: 50, maxMg: 175 },
      { doseMg: 50, maxMg: 175 },
    ]);
    expect(safe.total).toBeCloseTo(0.5714, 3);
    expect(safe.status).toBe('safe');

    const caution = combinedToxicityFraction([
      { doseMg: 100, maxMg: 175 },
      { doseMg: 30, maxMg: 150 },
    ]);
    expect(caution.status).toBe('caution');

    const toxic = combinedToxicityFraction([
      { doseMg: 100, maxMg: 200 },
      { doseMg: 100, maxMg: 200 },
    ]);
    expect(toxic.total).toBe(1);
    expect(toxic.status).toBe('toxic');
  });
});

describe('LAST lipid emulsion', () => {
  it('<70 kg: 1.5 mL/kg bolus, 0.25 mL/kg/min infusion, double on repeat', () => {
    const p = lipidPlan(60);
    expect(p.stratum).toBe('under-70');
    expect(p.bolusMl).toBe(90);
    expect(p.infusionMlPerMin).toBe(15);
    expect(p.infusionMlPerHr).toBe(900);
    expect(p.doubledInfusionMlPerMin).toBe(30);
    expect(p.maxCumulativeMl).toBe(720);
  });

  it('>=70 kg: 100 mL bolus, 250 mL over 15-20 min', () => {
    for (const w of [70, 80, 120]) {
      const p = lipidPlan(w);
      expect(p.stratum).toBe('at-or-over-70');
      expect(p.bolusMl).toBe(100);
      expect(p.infusionTotalMl).toBe(250);
      expect(p.infusionMinutes).toEqual([15, 20]);
    }
  });

  it('69.9 kg stays in the weight-based stratum', () => {
    expect(lipidPlan(69.9).stratum).toBe('under-70');
  });

  it('enforces the 12 mL/kg cumulative ceiling', () => {
    expect(lipidPlan(80).maxCumulativeMl).toBe(960);
    expect(lipidCumulativeStatus(80, 500)).toMatchObject({ status: 'ok', remainingMl: 460 });
    expect(lipidCumulativeStatus(80, 960)).toMatchObject({ status: 'at-limit', remainingMl: 0 });
    expect(lipidCumulativeStatus(80, 961)).toMatchObject({ status: 'exceeds', remainingMl: 0 });
  });
});

describe('malignant hyperthermia dantrolene', () => {
  const [dantrium, ryanodex] = DANTROLENE_FORMULATIONS;

  it('2.5 mg/kg on actual body weight', () => {
    expect(dantroleneDoseMg(80)).toBe(200);
  });

  it('vial counts and diluent per formulation', () => {
    expect(vialsFor(200, dantrium)).toEqual({ vials: 10, diluentMl: 600 });
    expect(vialsFor(200, ryanodex)).toEqual({ vials: 1, diluentMl: 5 });
    expect(vialsFor(210, dantrium).vials).toBe(11);
  });

  it('warns at and beyond 10 mg/kg cumulative', () => {
    expect(dantroleneCumulativeStatus(80, 600).status).toBe('ok');
    expect(dantroleneCumulativeStatus(80, 800).status).toBe('reached');
    expect(dantroleneCumulativeStatus(80, 801).status).toBe('exceeded');
  });
});

describe('ventilation', () => {
  it('tidal volume from PBW and minute ventilation', () => {
    const vt = calculateTidalVolumeMl(75, 6);
    expect(vt).toBe(450);
    expect(calculateMinuteVentilationLMin(vt, 20)).toBe(9);
  });

  it('uses PBW, not actual weight, for a short obese patient', () => {
    const r = computeBiometrics({ tbwKg: 120, heightCm: 165, sex: 'female' });
    if (!r.ok) throw new Error('expected ok');
    expect(calculateTidalVolumeMl(r.value.pbw, 6)).toBeLessThan(calculateTidalVolumeMl(120, 6));
  });

  it('ARDS tidal volume severity: 6 ok, 4 and 8 edge (amber), 8.1 red', () => {
    const range = { min: 4, max: 8 };
    expect(tidalVolumeSeverity(6, range)).toBe('ok');
    expect(tidalVolumeSeverity(8, range)).toBe('amber');
    expect(tidalVolumeSeverity(4, range)).toBe('amber');
    expect(tidalVolumeSeverity(8.1, range)).toBe('red');
    expect(tidalVolumeSeverity(3.9, range)).toBe('red');
  });

  it('plateau severity and driving pressure', () => {
    expect(plateauSeverity(25)).toBe('ok');
    expect(plateauSeverity(29)).toBe('amber');
    expect(plateauSeverity(30)).toBe('amber');
    expect(plateauSeverity(30.1)).toBe('red');
    expect(calculateDrivingPressure(28, 10)).toBe(18);
  });

  it('splits the breath cycle by I:E ratio', () => {
    // rate 12 -> 5 s cycle; 1:2 -> Ti 1.667 s, Te 3.333 s
    expect(inspiratoryTimeSeconds(12, 1, 2)).toBeCloseTo(5 / 3, 9);
    expect(expiratoryTimeSeconds(12, 1, 2)).toBeCloseTo(10 / 3, 9);
    expect(inspiratoryTimeSeconds(12, 1, 2) + expiratoryTimeSeconds(12, 1, 2)).toBeCloseTo(5, 9);
    expect(inspiratoryTimeSeconds(10, 1, 1)).toBe(3);
  });

  it('prompts a reduction toward 4 mL/kg PBW only when plateau > 30 at <= 6 mL/kg', () => {
    expect(ardsPlateauAdvice(32, 6)).toEqual({ suggestReduceTowardMlPerKg: 4 });
    expect(ardsPlateauAdvice(32, 8)).toEqual({});
    expect(ardsPlateauAdvice(28, 6)).toEqual({});
    expect(ardsPlateauAdvice(32, 4)).toEqual({});
  });
});
