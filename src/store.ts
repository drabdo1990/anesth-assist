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
  setPatientType: (t: PatientType) => void
  setWeight: (n: number | null) => void
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
      concOverrides: {},
      setPatientType: (patientType) => set({ patientType }),
      setWeight: (weightKg) => set({ weightKg }),
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
          // note: patient type and concentration overrides survive a clear
          concOverrides: s.concOverrides,
        })),
    }),
    {
      name: 'anesthassist-v1',
      version: 2,
      storage: createJSONStorage(() =>
        typeof localStorage === 'undefined' ? memoryStorage : localStorage,
      ),
      // v1 -> v2 adds patientType/ageYears; sanitize fills safe defaults
      migrate: (persisted) => sanitizePersisted(persisted),
      partialize: (s): Persisted => ({
        patientType: s.patientType,
        weightKg: s.weightKg,
        heightCm: s.heightCm,
        ageYears: s.ageYears,
        sex: s.sex,
        concOverrides: s.concOverrides,
      }),
      merge: (persisted, current) => ({ ...current, ...sanitizePersisted(persisted) }),
    },
  ),
)
