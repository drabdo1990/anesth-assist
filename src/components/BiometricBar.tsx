import * as ToggleGroup from '@radix-ui/react-toggle-group'
import { TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { useScalars } from '../hooks'
import { inputAdvisories, type Sex } from '../lib/biometrics'
import { useStore } from '../store'
import { ScalarBadge } from './ScalarBadge'
import { NumField } from './Stepper'

export function BiometricBar({ compact = false }: { compact?: boolean }) {
  const { weightKg, heightCm, sex, setWeight, setHeight, setSex, clearBiometrics } = useStore()
  const [resetKey, setResetKey] = useState(0)
  const scalars = useScalars()
  const { softWarnings, adultOnly } = inputAdvisories(weightKg, heightCm)

  return (
    <section className="sticky top-0 z-10 border-b border-line bg-base/95 p-3 backdrop-blur">
      <div className="flex gap-2">
        <NumField
          key={`w${resetKey}`}
          label="Weight (TBW)"
          unit="kg"
          value={weightKg}
          onChange={setWeight}
          stepper
          max={400}
        />
        {!compact && (
          <NumField
            key={`h${resetKey}`}
            label="Height"
            unit="cm"
            value={heightCm}
            onChange={setHeight}
            max={250}
          />
        )}
      </div>

      {!compact && (
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

      {!compact && (
        <div className="mt-2 flex flex-wrap gap-1.5" aria-live="polite">
          {scalars ? (
            <>
              <span className="inline-flex items-center rounded-md border border-line bg-card px-2 py-1 font-mono text-xs font-bold tabular-nums">
                BMI: {scalars.bmi.toFixed(1)}
              </span>
              <ScalarBadge kind="ibw" kg={scalars.ibw} />
              <ScalarBadge kind="lbw" kg={scalars.lbw} />
              <ScalarBadge kind="abw40" kg={scalars.abw40} />
            </>
          ) : (
            <span className="text-sm text-muted">
              Enter weight (1–400 kg) and height (30–250 cm)
            </span>
          )}
        </div>
      )}

      {[
        ...softWarnings,
        ...(adultOnly ? ['Formulas are adult-oriented. Verify independently.'] : []),
      ].map((w) => (
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
