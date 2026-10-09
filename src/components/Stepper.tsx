import { useEffect, useState } from 'react'
import { Minus, Plus } from 'lucide-react'

const parse = (t: string): number | null => {
  if (t.trim() === '') return null
  const n = Number(t)
  return Number.isFinite(n) ? n : null
}

interface Props {
  label: string
  unit: string
  value: number | null
  onChange: (n: number | null) => void
  stepper?: boolean
  start?: number
  max?: number
}

export function NumField({ label, unit, value, onChange, stepper, start = 70, max = 999 }: Props) {
  const [text, setText] = useState(value === null ? '' : String(value))

  useEffect(() => {
    if (parse(text) !== value) setText(value === null ? '' : String(value))
    // only resync when the store value changes from outside
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const bump = (d: number) => {
    const next = value === null ? start : Math.min(max, Math.max(1, Math.round((value + d) * 10) / 10))
    onChange(next)
  }

  return (
    <label className="flex min-w-0 flex-1 flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</span>
      <span className="flex items-stretch gap-1">
        {stepper && (
          <button type="button" aria-label={`Decrease ${label}`} onClick={() => bump(-1)}
            className="flex min-h-12 min-w-12 items-center justify-center rounded-lg border border-line bg-card active:bg-line">
            <Minus size={20} />
          </button>
        )}
        <span className="relative min-w-0 flex-1">
          <input
            inputMode="decimal"
            value={text}
            onChange={(e) => {
              setText(e.target.value)
              onChange(parse(e.target.value))
            }}
            className="min-h-12 w-full rounded-lg border border-line bg-card px-3 pr-10 font-mono text-xl font-bold tabular-nums text-accent outline-none focus:border-accent"
            aria-label={label}
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">{unit}</span>
        </span>
        {stepper && (
          <button type="button" aria-label={`Increase ${label}`} onClick={() => bump(1)}
            className="flex min-h-12 min-w-12 items-center justify-center rounded-lg border border-line bg-card active:bg-line">
            <Plus size={20} />
          </button>
        )}
      </span>
    </label>
  )
}
