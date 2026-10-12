import * as ToggleGroup from '@radix-ui/react-toggle-group'
import { TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { useScalars } from '../hooks'
import { pedsBaselinePills } from '../lib/airwayEquipment'
import {
  estimatePedsWeight,
  inputAdvisories,
  isAgeValid,
  type PatientType,
  type Sex,
} from '../lib/biometrics'
import { useStore } from '../store'
import { ScalarBadge } from './ScalarBadge'
import { NumField } from './Stepper'

type AgeUnit = 'years' | 'months'

function TypeToggle() {
  const patientType = useStore((s) => s.patientType)
  const setPatientType = useStore((s) => s.setPatientType)
  return (
    <ToggleGroup.Root
      type="single"
      value={patientType}
      onValueChange={(v) => v && setPatientType(v as PatientType)}
      className="flex overflow-hidden rounded-lg border border-line"
      aria-label="Patient type"
    >
      {(['adult', 'pediatric'] as const).map((t) => (
        <ToggleGroup.Item
          key={t}
          value={t}
          className="min-h-12 flex-1 bg-card px-4 text-sm font-semibold capitalize data-[state=on]:bg-accent data-[state=on]:text-base"
        >
          {t === 'pediatric' ? 'Pediatric / Neonate' : 'Adult'}
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  )
}

export function BiometricBar({ compact = false }: { compact?: boolean }) {
  const {
    patientType,
    weightKg,
    heightCm,
    ageYears,
    sex,
    setWeight,
    setHeight,
    setAge,
    setSex,
    clearBiometrics,
  } = useStore()
  const [resetKey, setResetKey] = useState(0)
  const [ageUnit, setAgeUnit] = useState<AgeUnit>('years')
  const [userEnteredWeight, setUserEnteredWeight] = useState(false)
  // the store clears biometrics on a type switch; forget the manual-weight flag too
  // (adjusting state during render, keyed on the previous type)
  const [prevType, setPrevType] = useState(patientType)
  if (prevType !== patientType) {
    setPrevType(patientType)
    setUserEnteredWeight(false)
  }
  const scalars = useScalars()
  const isPeds = patientType === 'pediatric'
  const { softWarnings, adultOnly } = inputAdvisories(weightKg, heightCm)
  const warnings = isPeds
    ? softWarnings
    : [
        ...softWarnings,
        ...(adultOnly ? ['Formulas are adult-oriented. Verify independently.'] : []),
      ]

  // the store always holds age in YEARS; the unit toggle only changes display
  const switchAgeUnit = (u: AgeUnit) => {
    if (u !== ageUnit) setAgeUnit(u)
  }

  const ageDisplay = ageYears === null ? null : ageUnit === 'months' ? ageYears * 12 : ageYears

  const onAgeChange = (v: number | null) => {
    if (v === null) {
      setAge(null)
      return
    }
    const years = ageUnit === 'months' ? v / 12 : v
    setAge(years)
    // auto-estimate weight if not manually entered by user
    if ((weightKg === null || !userEnteredWeight) && isAgeValid(years)) {
      setWeight(estimatePedsWeight(years))
    }
  }

  const useEstimatedWeight = () => {
    if (isAgeValid(ageYears)) {
      setUserEnteredWeight(false)
      setWeight(estimatePedsWeight(ageYears))
    }
  }

  return (
    <section className="sticky top-0 z-10 border-b border-line bg-base/95 p-3 backdrop-blur">
      {!compact && <TypeToggle />}

      {!compact && isPeds && (
        <div className="mt-2 space-y-2">
          <div className="flex items-end gap-2">
            <NumField
              key={`a${resetKey}`}
              label="Age"
              unit={ageUnit === 'years' ? 'yr' : 'mo'}
              value={ageDisplay}
              onChange={onAgeChange}
              max={ageUnit === 'years' ? 14 : 168}
              allowZero
            />
            <ToggleGroup.Root
              type="single"
              value={ageUnit}
              onValueChange={(v) => v && switchAgeUnit(v as AgeUnit)}
              className="flex overflow-hidden rounded-lg border border-line"
              aria-label="Age unit"
            >
              {(['months', 'years'] as const).map((u) => (
                <ToggleGroup.Item
                  key={u}
                  value={u}
                  className="min-h-12 bg-card px-3 text-xs font-semibold uppercase data-[state=on]:bg-accent data-[state=on]:text-base"
                >
                  {u === 'months' ? 'Mo' : 'Yr'}
                </ToggleGroup.Item>
              ))}
            </ToggleGroup.Root>
            <button
              type="button"
              onClick={useEstimatedWeight}
              disabled={!isAgeValid(ageYears)}
              className="min-h-12 rounded-lg border border-line px-3 text-xs font-semibold text-accent disabled:text-muted active:bg-line"
              aria-label="Estimate weight from age"
            >
              Est. wt
            </button>
          </div>
          <NumField
            key={`w${resetKey}`}
            label="Weight (TBW)"
            unit="kg"
            value={weightKg}
            onChange={(w) => {
              setUserEnteredWeight(w !== null)
              setWeight(w)
            }}
            stepper
            max={100}
          />
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted">Unknown weight: (age + 4) × 2 — e.g. 4 yr → 16 kg.</p>
            <button
              type="button"
              onClick={() => {
                setUserEnteredWeight(false)
                clearBiometrics()
                setResetKey((k) => k + 1)
              }}
              className="ml-auto min-h-12 rounded-lg border border-line px-3 text-sm text-muted active:bg-line"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {!compact && !isPeds && (
        <div className="mt-2 flex gap-2">
          <NumField
            key={`w${resetKey}`}
            label="Weight (TBW)"
            unit="kg"
            value={weightKg}
            onChange={setWeight}
            stepper
            max={400}
          />
          <NumField
            key={`h${resetKey}`}
            label="Height"
            unit="cm"
            value={heightCm}
            onChange={setHeight}
            max={250}
          />
        </div>
      )}

      {!compact && !isPeds && (
        <div className="mt-2 flex items-center gap-2">
          <ToggleGroup.Root
            type="single"
            value={sex}
            onValueChange={(v) => v && setSex(v as Sex)}
            className="flex overflow-hidden rounded-lg border border-line"
            aria-label="Biological sex"
          >
            {(['male', 'female'] as const).map((s) => (
              <ToggleGroup.Item
                key={s}
                value={s}
                className="min-h-12 min-w-24 bg-card px-4 text-sm font-semibold capitalize data-[state=on]:bg-accent data-[state=on]:text-base"
              >
                {s}
              </ToggleGroup.Item>
            ))}
          </ToggleGroup.Root>
          <button
            type="button"
            onClick={() => {
              clearBiometrics()
              setResetKey((k) => k + 1)
            }}
            className="ml-auto min-h-12 rounded-lg border border-line px-3 text-sm text-muted active:bg-line"
          >
            Clear
          </button>
        </div>
      )}

      {!compact && !isPeds && (
        <div className="mt-2 flex flex-wrap gap-1.5" aria-live="polite">
          {scalars ? (
            <>
              <span className="inline-flex items-center rounded-md border border-line bg-card px-2 py-1 font-mono text-xs font-bold tabular-nums">
                BMI: {scalars.bmi?.toFixed(1) ?? '—'}
              </span>
              <ScalarBadge kind="ibw" kg={scalars.ibw} />
              <ScalarBadge kind="lbw" kg={scalars.lbw} />
              <ScalarBadge kind="abw40" kg={scalars.abw40} />
            </>
          ) : (
            <span className="text-sm text-muted">
              Enter weight (1–400 kg) and height (120–220 cm)
            </span>
          )}
        </div>
      )}

      {!compact && isPeds && (
        <div className="mt-2 flex flex-wrap gap-1.5" aria-live="polite">
          {isAgeValid(ageYears) ? (
            pedsBaselinePills(ageYears, scalars?.tbw ?? null).map((p) => (
              <span
                key={p.label}
                className="inline-flex items-center gap-1.5 rounded-md border border-line bg-card px-2 py-1 font-mono text-xs font-bold tabular-nums"
              >
                <span className="font-sans font-medium text-muted">{p.label}</span> {p.value}
              </span>
            ))
          ) : (
            <span className="text-sm text-muted">Enter age (0–14 yr) for baseline parameters</span>
          )}
        </div>
      )}

      {warnings.map((w) => (
        <p
          key={w}
          className="mt-2 flex items-center gap-2 rounded-md border border-amber/60 bg-amber/10 px-2 py-1 text-sm font-semibold text-amber"
        >
          <TriangleAlert size={16} aria-hidden /> {w}
        </p>
      ))}
    </section>
  )
}
