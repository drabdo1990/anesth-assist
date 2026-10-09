import { useEffect, useRef, useState } from 'react'
import { Minus, Plus } from 'lucide-react'

import { parseDecimalInput } from '../lib/parseNumber'

interface Props {
  label: string
  unit: string
  value: number | null
  onChange: (n: number | null) => void
  stepper?: boolean
  max?: number
}

export function NumField({ label, unit, value, onChange, stepper, max = 999 }: Props) {
  const [text, setText] = useState(value === null ? '' : String(value))

  useEffect(() => {
    if (parseDecimalInput(text).value !== value) setText(value === null ? '' : String(value))
    // only resync when the store value changes from outside
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const inputRef = useRef<HTMLInputElement>(null)
  const { invalid } = parseDecimalInput(text)

  const bump = (d: number) => {
    // never invent a value: with an empty field, send the user to the input instead
    if (value === null) {
      inputRef.current?.focus()
      return
    }
    onChange(Math.min(max, Math.max(1, Math.round((value + d) * 10) / 10)))
  }

  return (
    <label className="flex min-w-0 flex-1 flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</span>
      <span className="flex items-stretch gap-1">
        {stepper && (
          <button type="button" aria-label={`Decrease ${label}`} onClick={() => bump(-1)}
            className="flex min-h-14 min-w-14 items-center justify-center rounded-lg border border-line bg-card active:bg-line">
            <Minus size={20} />
          </button>
        )}
        <span className="relative min-w-0 flex-1">
          <input
            ref={inputRef}
            inputMode="decimal"
            value={text}
            onChange={(e) => {
              setText(e.target.value)
              onChange(parseDecimalInput(e.target.value).value)
            }}
            aria-invalid={invalid}
            className={`min-h-12 w-full rounded-lg border ${invalid ? 'border-crimson' : 'border-line'} bg-card px-3 pr-10 font-mono text-xl font-bold tabular-nums text-accent outline-none focus:border-accent`}
            aria-label={label}
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">{unit}</span>
        </span>
        {stepper && (
          <button type="button" aria-label={`Increase ${label}`} onClick={() => bump(1)}
            className="flex min-h-14 min-w-14 items-center justify-center rounded-lg border border-line bg-card active:bg-line">
            <Plus size={20} />
          </button>
        )}
      </span>
      {invalid && <span className="text-xs font-bold text-crimson">Invalid number</span>}
    </label>
  )
}
