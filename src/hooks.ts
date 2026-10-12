import { useMemo } from 'react'
import { computePedsScalars, computeScalars, type Scalars } from './lib/biometrics'
import { useStore } from './store'

export function useScalars(): Scalars | null {
  const weightKg = useStore((s) => s.weightKg)
  const heightCm = useStore((s) => s.heightCm)
  const sex = useStore((s) => s.sex)
  const patientType = useStore((s) => s.patientType)
  return useMemo(
    () =>
      patientType === 'pediatric'
        ? computePedsScalars(weightKg)
        : computeScalars(weightKg, heightCm, sex),
    [patientType, weightKg, heightCm, sex],
  )
}
