import * as Tabs from '@radix-ui/react-tabs'
import { Copy, Eraser, ShieldCheck } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Checklist } from '../components/Checklist'
import {
  buildPacuSummary,
  EXTUBATION_ITEMS,
  PACU_FIELDS,
  type PacuKey,
  WHO_ITEMS,
} from '../lib/checklists'
import { copyText } from '../lib/clipboard'

const trigger =
  'min-h-12 flex-1 rounded-lg px-2 text-sm font-bold text-muted data-[state=active]:bg-accent data-[state=active]:text-base'

function Pacu() {
  const [values, setValues] = useState<Partial<Record<PacuKey, string>>>({})
  const [copied, setCopied] = useState<'idle' | 'ok' | 'fail'>('idle')
  // keep a handle on the reset timeout so a quick second copy is not cut short
  const copyTimer = useRef<number | null>(null)
  useEffect(
    () => () => {
      if (copyTimer.current !== null) window.clearTimeout(copyTimer.current)
    },
    [],
  )
  const summary = buildPacuSummary(values)

  return (
    <div className="space-y-3">
      <p className="flex items-start gap-2 rounded-lg border border-amber/60 bg-amber/10 p-3 text-sm font-semibold text-amber">
        <ShieldCheck size={18} className="mt-0.5 shrink-0" aria-hidden />
        Do not enter names, MRNs, dates of birth or other identifiers. Nothing here is saved.
      </p>
      {PACU_FIELDS.map((f) => (
        <label key={f.key} htmlFor={`pacu-${f.key}`} className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">
            {f.label}
          </span>
          {f.multiline ? (
            <textarea
              id={`pacu-${f.key}`}
              rows={3}
              value={values[f.key] ?? ''}
              placeholder={f.placeholder}
              onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-line bg-card p-3 outline-none focus:border-accent"
            />
          ) : (
            <input
              id={`pacu-${f.key}`}
              value={values[f.key] ?? ''}
              placeholder={f.placeholder}
              onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
              className="mt-1 min-h-12 w-full rounded-lg border border-line bg-card px-3 outline-none focus:border-accent"
            />
          )}
        </label>
      ))}
      <pre className="whitespace-pre-wrap rounded-lg border border-line bg-base p-3 font-mono text-sm">
        {summary}
      </pre>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={async () => {
            if (copyTimer.current !== null) window.clearTimeout(copyTimer.current)
            setCopied((await copyText(summary)) ? 'ok' : 'fail')
            copyTimer.current = window.setTimeout(() => setCopied('idle'), 2500)
          }}
          className="flex min-h-14 flex-1 items-center justify-center gap-2 rounded-xl bg-accent font-bold text-base active:opacity-80"
        >
          <Copy size={20} aria-hidden />
          {copied === 'ok'
            ? 'Copied'
            : copied === 'fail'
              ? 'Copy failed: select text manually'
              : 'Copy Summary to Clipboard'}
        </button>
        <button
          type="button"
          onClick={() => setValues({})}
          aria-label="Clear form"
          className="flex min-h-14 min-w-14 items-center justify-center rounded-xl border border-line"
        >
          <Eraser size={20} />
        </button>
      </div>
    </div>
  )
}

export function ChecklistsView() {
  return (
    <Tabs.Root defaultValue="who" className="space-y-3">
      <Tabs.List
        className="flex gap-1 rounded-xl border border-line bg-card p-1"
        aria-label="Checklists"
      >
        <Tabs.Trigger value="who" className={trigger}>
          Pre-induction
        </Tabs.Trigger>
        <Tabs.Trigger value="ext" className={trigger}>
          Extubation
        </Tabs.Trigger>
        <Tabs.Trigger value="pacu" className={trigger}>
          PACU
        </Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="who" forceMount className="data-[state=inactive]:hidden">
        <Checklist items={WHO_ITEMS} />
      </Tabs.Content>
      <Tabs.Content value="ext" forceMount className="data-[state=inactive]:hidden">
        <Checklist items={EXTUBATION_ITEMS} />
      </Tabs.Content>
      <Tabs.Content value="pacu" forceMount className="data-[state=inactive]:hidden">
        <Pacu />
      </Tabs.Content>
    </Tabs.Root>
  )
}
