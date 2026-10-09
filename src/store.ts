import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Sex } from './lib/biometrics'

interface Persisted {
  weightKg: number | null
  heightCm: number | null
  sex: Sex
  concOverrides: Record<string, number>
}

interface State extends Persisted {
  setWeight: (n: number | null) => void
  setHeight: (n: number | null) => void
  setSex: (s: Sex) => void
  setConc: (drugId: string, conc: number) => void
  clearBiometrics: () => void
}

const num = (v: unknown): number | null =>
  typeof v === 'number' && Number.isFinite(v) ? v : null

export function sanitizePersisted(raw: unknown): Persisted {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const conc: Record<string, number> = {}
  if (r.concOverrides && typeof r.concOverrides === 'object' && !Array.isArray(r.concOverrides)) {
    for (const [k, v] of Object.entries(r.concOverrides as Record<string, unknown>)) {
      if (typeof v === 'number' && Number.isFinite(v) && v > 0) conc[k] = v
    }
  }
  return {
    weightKg: num(r.weightKg),
    heightCm: num(r.heightCm),
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
      weightKg: null,
      heightCm: null,
      sex: 'male',
      concOverrides: {},
      setWeight: (weightKg) => set({ weightKg }),
      setHeight: (heightCm) => set({ heightCm }),
      setSex: (sex) => set({ sex }),
      setConc: (drugId, conc) =>
        set((s) => ({ concOverrides: { ...s.concOverrides, [drugId]: conc } })),
      clearBiometrics: () => set({ weightKg: null, heightCm: null }),
    }),
    {
      name: 'anesthassist-v1',
      version: 1,
      storage: createJSONStorage(() => (typeof localStorage === 'undefined' ? memoryStorage : localStorage)),
      partialize: (s): Persisted => ({
        weightKg: s.weightKg,
        heightCm: s.heightCm,
        sex: s.sex,
        concOverrides: s.concOverrides,
      }),
      merge: (persisted, current) => ({ ...current, ...sanitizePersisted(persisted) }),
    },
  ),
)
