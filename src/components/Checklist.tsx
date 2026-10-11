import * as Checkbox from '@radix-ui/react-checkbox'
import { Check, RotateCcw } from 'lucide-react'
import { useState } from 'react'

interface Item {
  id: string
  text: string
  detail?: string
  critical?: boolean
}

export function Checklist({
  items,
  accent = 'accent',
}: {
  items: Item[]
  accent?: 'crimson' | 'accent'
}) {
  const [done, setDone] = useState<Set<string>>(new Set())
  const toggle = (id: string) =>
    setDone((d) => {
      const n = new Set(d)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  const idle = accent === 'crimson' ? 'border-crimson/60' : 'border-line'

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm text-muted">
        <span className="font-mono tabular-nums">
          {done.size}/{items.length} complete
        </span>
        <button
          type="button"
          onClick={() => setDone(new Set())}
          className="flex min-h-12 items-center gap-1 rounded-lg px-3 active:bg-line"
        >
          <RotateCcw size={16} aria-hidden /> Reset
        </button>
      </div>
      {items.map((it) => {
        const on = done.has(it.id)
        return (
          // biome-ignore lint/a11y/noLabelWithoutControl: Radix Checkbox renders a labelable role="checkbox" button; the wrapping label gives it its accessible name.
          <label
            key={it.id}
            className={`flex min-h-14 cursor-pointer items-start gap-3 rounded-xl border p-3 ${on ? 'border-ok bg-ok/10' : `${idle} bg-card`}`}
          >
            <Checkbox.Root
              checked={on}
              onCheckedChange={() => toggle(it.id)}
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-md border-2 ${on ? 'border-ok bg-ok' : 'border-muted bg-base'}`}
            >
              <Checkbox.Indicator>
                <Check size={24} className="text-base" aria-hidden />
              </Checkbox.Indicator>
            </Checkbox.Root>
            <span className="min-w-0">
              <span
                className={`block text-[1rem] ${it.critical ? 'font-bold' : 'font-medium'} ${on ? 'text-ok line-through decoration-1' : ''}`}
              >
                {it.text}
              </span>
              {it.detail && <span className="block text-sm text-muted">{it.detail}</span>}
            </span>
          </label>
        )
      })}
    </div>
  )
}
