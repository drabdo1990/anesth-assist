// Pure biometric calculations. Full precision internally; round only for display (see format.ts).

export type Sex = 'male' | 'female';

export const MIN_HEIGHT_CM = 30;
export const MAX_HEIGHT_CM = 250;
export const MAX_WEIGHT_KG = 500;
export const DEVINE_BASELINE_HEIGHT_CM = 152.4;

export const isDevineBaselineMet = (heightCm: number): boolean => heightCm >= DEVINE_BASELINE_HEIGHT_CM;

export interface BiometricInput {
  tbwKg: number;
  heightCm: number;
  sex: Sex;
}

export interface Biometrics {
  tbw: number;
  bmi: number;
  /** Devine, uncapped. Use for ventilation (predicted body weight). */
  pbw: number;
  /** Devine, capped at TBW. Use for IBW-based drug dosing. */
  ibw: number;
  abw40: number;
  lbw: number;
}

export type BiometricResult =
  | { ok: true; value: Biometrics }
  | { ok: false; error: string };

export const calculateBmi = (weightKg: number, heightCm: number): number =>
  weightKg / Math.pow(heightCm / 100, 2);

export const calculateDevineIbw = (sex: Sex, heightCm: number): number => {
  const base = sex === 'male' ? 50 : 45.5;
  return base + 0.905 * Math.max(0, heightCm - DEVINE_BASELINE_HEIGHT_CM);
};

export const calculateAbw40 = (tbwKg: number, ibwKg: number): number =>
  tbwKg > ibwKg ? ibwKg + 0.4 * (tbwKg - ibwKg) : tbwKg;

export const calculateJanmahasatianLbw = (sex: Sex, tbwKg: number, bmi: number): number => {
  const raw =
    sex === 'male'
      ? (9270 * tbwKg) / (6680 + 216 * bmi)
      : (9270 * tbwKg) / (8780 + 244 * bmi);
  return Math.min(raw, tbwKg);
};

export const validateBiometricInput = (input: BiometricInput): string | null => {
  const { tbwKg, heightCm } = input;
  if (!Number.isFinite(tbwKg) || tbwKg <= 0) return 'Weight must be greater than 0 kg.';
  if (tbwKg > MAX_WEIGHT_KG) return `Weight must be ${MAX_WEIGHT_KG} kg or less.`;
  if (!Number.isFinite(heightCm) || heightCm <= 0) return 'Height must be greater than 0 cm.';
  if (heightCm < MIN_HEIGHT_CM || heightCm > MAX_HEIGHT_CM) {
    return `Height must be between ${MIN_HEIGHT_CM} and ${MAX_HEIGHT_CM} cm.`;
  }
  return null;
};

/** Patient inputs as the UI holds them: any of them can still be unset. Sex is never assumed. */
export interface PatientBiometricInput {
  tbwKg: number | null;
  heightCm: number | null;
  sex: Sex | null;
}

const joinList = (items: string[]): string =>
  items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;

/** Like computeBiometrics, but accepts unset fields and names what is still missing. */
export const computePatientBiometrics = (p: PatientBiometricInput): BiometricResult => {
  const { tbwKg, heightCm, sex } = p;
  if (tbwKg === null || heightCm === null || sex === null) {
    const missing = [
      tbwKg === null ? 'actual weight' : null,
      heightCm === null ? 'height' : null,
      sex === null ? 'biological sex' : null,
    ].filter((s): s is string => s !== null);
    return { ok: false, error: `Enter ${joinList(missing)}.` };
  }
  return computeBiometrics({ tbwKg, heightCm, sex });
};

export const computeBiometrics = (input: BiometricInput): BiometricResult => {
  const error = validateBiometricInput(input);
  if (error) return { ok: false, error };

  const { tbwKg, heightCm, sex } = input;
  const bmi = calculateBmi(tbwKg, heightCm);
  const pbw = calculateDevineIbw(sex, heightCm);
  const ibw = Math.min(tbwKg, pbw);
  return {
    ok: true,
    value: {
      tbw: tbwKg,
      bmi,
      pbw,
      ibw,
      abw40: calculateAbw40(tbwKg, ibw),
      lbw: calculateJanmahasatianLbw(sex, tbwKg, bmi),
    },
  };
};
