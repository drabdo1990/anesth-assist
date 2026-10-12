import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { isAgeValid, type PatientType, type Sex } from './lib/biometrics'

interface Persisted {
  patientType: PatientType
  weightKg: number | null
  heightCm: number | null
  ageYears: number | null
  sex: Sex
  concOverrides: Record<string, number>
}

interface State extends Persisted {
  /**
   * True when the user typed the weight, false when it came from the age estimate.
   * Kept in the store (in memory only) so a BiometricBar remount on a tab switch
   * cannot forget it and silently overwrite a measured weight.
   */
  weightIsManual: boolean
  setPatientType: (t: PatientType) => void
  /** programmatic / estimated weight: not user-entered */
  setWeight: (n: number | null) => void
  /** user typed the weight field */
  setWeightManual: (n: number | null) => void
  setHeight: (n: number | null) => void
  setAge: (n: number | null) => void
  setSex: (s: Sex) => void
  setConc: (drugId: string, conc: number) => void
  clearBiometrics: () => void
}

const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null)

export function sanitizePersisted(raw: unknown): Persisted {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const conc: Record<string, number> = {}
  if (r.concOverrides && typeof r.concOverrides === 'object' && !Array.isArray(r.concOverrides)) {
    for (const [k, v] of Object.entries(r.concOverrides as Record<string, unknown>)) {
      if (typeof v === 'number' && Number.isFinite(v) && v > 0) conc[k] = v
    }
  }
  const ageYears = num(r.ageYears)
  return {
    patientType: r.patientType === 'pediatric' ? 'pediatric' : 'adult',
    weightKg: num(r.weightKg),
    heightCm: num(r.heightCm),
    ageYears: isAgeValid(ageYears) ? ageYears : null,
    sex: r.sex === 'female' ? 'female' : 'male',
    concOverrides: conc,
  }
}

// Only provider preferences are stored. Patient biometrics stay in memory so the
// next case never opens with the previous patient's weight (zero PHI storage).
type StoredPrefs = Pick<Persisted, 'patientType' | 'concOverrides'>

export function storedPrefs(raw: unknown): StoredPrefs {
  const { patientType, concOverrides } = sanitizePersisted(raw)
  return { patientType, concOverrides }
}

const memoryStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
} as unknown as Storage

export const useStore = create<State>()(
  persist(
    (set) => ({
      patientType: 'adult',
      weightKg: null,
      heightCm: null,
      ageYears: null,
      sex: 'male',
      weightIsManual: false,
      concOverrides: {},
      // a type switch means a different patient: drop biometrics so adult values
      // never feed pediatric doses (or vice versa)
      setPatientType: (patientType) =>
        set((s) =>
          s.patientType === patientType
            ? {}
            : {
                patientType,
                weightKg: null,
                heightCm: null,
                ageYears: null,
                weightIsManual: false,
              },
        ),
      setWeight: (weightKg) => set({ weightKg, weightIsManual: false }),
      setWeightManual: (weightKg) => set({ weightKg, weightIsManual: weightKg !== null }),
      setHeight: (heightCm) => set({ heightCm }),
      setAge: (ageYears) => set({ ageYears }),
      setSex: (sex) => set({ sex }),
      setConc: (drugId, conc) =>
        set((s) => ({ concOverrides: { ...s.concOverrides, [drugId]: conc } })),
      clearBiometrics: () =>
        set((s) => ({
          weightKg: null,
          heightCm: null,
          ageYears: null,
          sex: 'male',
          weightIsManual: false,
          // note: patient type and concentration overrides survive a clear
          concOverrides: s.concOverrides,
        })),
    }),
    {
      name: 'anesthassist-v1',
      version: 3,
      storage: createJSONStorage(() =>
        typeof localStorage === 'undefined' ? memoryStorage : localStorage,
      ),
      // v2 -> v3 stops persisting biometrics; older stored values are discarded
      migrate: (persisted) => storedPrefs(persisted),
      partialize: (s): StoredPrefs => ({
        patientType: s.patientType,
        concOverrides: s.concOverrides,
      }),
      merge: (persisted, current) => ({ ...current, ...storedPrefs(persisted) }),
    },
  ),
)
