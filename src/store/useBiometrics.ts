import { useMemo } from 'react';
import { computePatientBiometrics, type BiometricResult } from '../lib/calc/biometrics';
import { useAppStore } from './useAppStore';

/** Derived biometrics for the current patient. Blank until weight, height and biological sex are all entered. */
export const useBiometricResult = (): BiometricResult => {
  const tbwKg = useAppStore((s) => s.patient.tbwKg);
  const heightCm = useAppStore((s) => s.patient.heightCm);
  const sex = useAppStore((s) => s.patient.sex);
  return useMemo(() => computePatientBiometrics({ tbwKg, heightCm, sex }), [tbwKg, heightCm, sex]);
};
