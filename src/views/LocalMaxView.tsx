import { AlertTriangle, Plus, ShieldAlert, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { fmtFraction, fmtNum } from '../lib/format'
import {
  type DisplayTone,
  evaluateLA,
  LA_AGENTS,
  type LAEntry,
  localMaxDisplay,
} from '../lib/localAnesthetics'
import { parseVolume } from '../lib/parseNumber'
import { useStore } from '../store'

interface Row extends Omit<LAEntry, 'volumeMl'> {
  key: number
  volume: string
}

let nextKey = 1
const newRow = (agentId = 'lidocaine'): Row => {
  const agent = LA_AGENTS.find((a) => a.id === agentId)!
  return {
    key: nextKey++,
    agentId,
    epi: false,
    conc: agent.concentrations[1] ?? agent.concentrations[0],
    volume: '',
  }
}

export function LocalMaxView() {
  const weightKg = useStore((s) => s.weightKg)
  const [rows, setRows] = useState<Row[]>(() => [newRow('lidocaine'), newRow('bupivacaine')])

  const update = (key: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)))

  const parsed = rows.map((r) => parseVolume(r.volume))
  const anyInvalid = parsed.some((p) => p.invalid)
  const entries: LAEntry[] = rows.map((r, i) => ({
    agentId: r.agentId,
    epi: r.epi,
    conc: r.conc,
    volumeMl: parsed[i].value,
  }))
  const result = evaluateLA(entries, weightKg)

  if (!result) {
    return (
      <p className="rounded-xl border border-line bg-card p-4 text-muted">
        Enter a valid patient weight (1–400 kg) to calculate maximum doses.
      </p>
    )
  }

  const pct = Math.min(result.total * 100, 100)
  const display = localMaxDisplay(result.level, anyInvalid)
  const tone = { toxic: 'bg-crimson', caution: 'bg-amber', ok: 'bg-ok', incomplete: 'bg-muted' }[
    display.tone
  ]
  const text = {
    toxic: 'text-crimson',
    caution: 'text-amber',
    ok: 'text-ok',
    incomplete: 'text-muted',
  }[display.tone]
  const status = {
    toxic:
      'flex items-center gap-2 rounded-md border border-crimson bg-crimson/10 px-2 py-1 font-bold text-crimson',
    caution: 'mt-2 font-semibold text-amber',
    ok: 'mt-2 text-sm text-muted',
    incomplete: 'mt-2 font-semibold text-muted',
  } satisfies Record<DisplayTone, string>
  // Map by entry index so rendering never depends on row order.
  const rowByIndex = new Map(result.rows.map((r) => [r.entryIndex, r]))

  return (
    <div className="space-y-3">
      {anyInvalid && (
        <p
          role="alert"
          className="flex items-center gap-2 rounded-md border border-crimson bg-crimson/10 px-2 py-1 font-bold text-crimson"
        >
          <AlertTriangle size={18} aria-hidden /> Some volumes are invalid and are NOT included in
          the total.
        </p>
      )}
      <section className="rounded-xl border border-line bg-card p-3" aria-live="polite">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          Total fraction of maximum (Σ dose ÷ max)
        </p>
        <p className={`font-mono text-4xl font-bold tabular-nums ${text}`}>
          {fmtFraction(result.total)}
        </p>
        <div
          className="mt-2 h-3 overflow-hidden rounded-full bg-base"
          role="progressbar"
          aria-label="Total fraction of maximum"
          aria-valuenow={Math.round(pct)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className={`h-full ${tone}`} style={{ width: `${pct}%` }} />
        </div>
        <p className={status[display.tone]}>
          {display.tone === 'toxic' && <ShieldAlert size={18} aria-hidden />}
          <span>
            {display.message}
            {display.tone === 'toxic' && result.worst ? ` (largest: ${result.worst.name})` : ''}
          </span>
        </p>
      </section>

      {rows.map((r, i) => {
        const agent = LA_AGENTS.find((a) => a.id === r.agentId)!
        const row = rowByIndex.get(i)
        return (
          <article key={r.key} className="space-y-2 rounded-xl border border-line bg-card p-3">
            <div className="flex items-center gap-2">
              <select
                value={r.agentId}
                aria-label="Local anesthetic"
                onChange={(e) => {
                  const a = LA_AGENTS.find((x) => x.id === e.target.value)!
                  update(r.key, { agentId: a.id, conc: a.concentrations[1] ?? a.concentrations[0] })
                }}
                className="min-h-12 flex-1 rounded-lg border border-line bg-base px-3 text-lg font-bold"
              >
                {LA_AGENTS.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                aria-label="Remove drug"
                onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))}
                className="flex min-h-12 min-w-12 items-center justify-center rounded-lg border border-line text-muted active:bg-line"
              >
                <Trash2 size={20} />
              </button>
            </div>

            <div className="flex gap-2">
              <div
                className="flex overflow-hidden rounded-lg border border-line"
                role="group"
                aria-label="Epinephrine"
              >
                {[false, true].map((e) => (
                  <button
                    key={String(e)}
                    type="button"
                    onClick={() => update(r.key, { epi: e })}
                    className={`min-h-12 px-3 text-sm font-semibold ${r.epi === e ? 'bg-accent text-base' : 'bg-base'}`}
                  >
                    {e ? 'With epi' : 'Plain'}
                  </button>
                ))}
              </div>
              <select
                value={r.conc}
                aria-label="Concentration"
                onChange={(e) => update(r.key, { conc: Number(e.target.value) })}
                className="min-h-12 flex-1 rounded-lg border border-line bg-base px-2 font-mono font-bold"
              >
                {agent.concentrations.map((c) => (
                  <option key={c} value={c}>
                    {c}%
                  </option>
                ))}
              </select>
              <input
                inputMode="decimal"
                placeholder="mL"
                aria-label="Volume in mL"
                value={r.volume}
                onChange={(e) => update(r.key, { volume: e.target.value })}
                aria-invalid={parsed[i].invalid}
                className={`min-h-12 w-24 rounded-lg border bg-base px-2 font-mono text-lg font-bold tabular-nums text-accent outline-none focus:border-accent ${parsed[i].invalid ? 'border-crimson' : 'border-line'}`}
              />
            </div>
            {parsed[i].invalid && (
              <p className="flex items-center gap-1 text-sm font-bold text-crimson">
                <AlertTriangle size={16} aria-hidden /> Invalid volume, counted as 0 mg
              </p>
            )}

            {row && (
              <p className="font-mono text-sm tabular-nums text-muted">
                <span className="text-lg font-bold text-fg">{fmtNum(row.mg)} mg</span> of max{' '}
                <span className="font-bold text-fg">{fmtNum(row.maxMg)} mg</span> (
                {r.epi ? agent.mgPerKgEpi : agent.mgPerKgPlain} mg/kg, ceiling{' '}
                {r.epi ? agent.absEpi : agent.absPlain} mg) · fraction{' '}
                <span className="font-bold text-fg">{fmtFraction(row.fraction)}</span>
              </p>
            )}
          </article>
        )
      })}

      <button
        type="button"
        onClick={() => setRows((rs) => [...rs, newRow('ropivacaine')])}
        className="flex min-h-14 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-accent font-bold text-accent active:bg-card"
      >
        <Plus size={20} aria-hidden /> Add local anesthetic
      </button>
    </div>
  )
}
