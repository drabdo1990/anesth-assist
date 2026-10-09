import { useMemo } from 'react'
import { computeScalars, type Scalars } from './lib/biometrics'
import { useStore } from './store'

export function useScalars(): Scalars | null {
  const weightKg = useStore((s) => s.weightKg)
  const heightCm = useStore((s) => s.heightCm)
  const sex = useStore((s) => s.sex)
  return useMemo(() => computeScalars(weightKg, heightCm, sex), [weightKg, heightCm, sex])
}
