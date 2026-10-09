import { useState } from 'react'
import { Plus, ShieldAlert, Trash2 } from 'lucide-react'
import { fmtNum } from '../lib/format'
import { LA_AGENTS, evaluateLA, type LAEntry } from '../lib/localAnesthetics'
import { useStore } from '../store'

interface Row extends Omit<LAEntry, 'volumeMl'> {
  key: number
  volume: string
}

let nextKey = 1
const newRow = (agentId = 'lidocaine'): Row => {
  const agent = LA_AGENTS.find((a) => a.id === agentId)!
  return { key: nextKey++, agentId, epi: false, conc: agent.concentrations[1] ?? agent.concentrations[0], volume: '' }
}

export function LocalMaxView() {
  const weightKg = useStore((s) => s.weightKg)
  const [rows, setRows] = useState<Row[]>(() => [newRow('lidocaine'), newRow('bupivacaine')])

  const update = (key: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)))

  const entries: LAEntry[] = rows.map((r) => {
    const v = r.volume.trim() === '' ? null : Number(r.volume)
    return { agentId: r.agentId, epi: r.epi, conc: r.conc, volumeMl: v !== null && Number.isFinite(v) ? v : null }
  })
  const result = evaluateLA(entries, weightKg)

  if (!result) {
    return <p className="rounded-xl border border-line bg-card p-4 text-muted">Enter a valid patient weight (1–400 kg) to calculate maximum doses.</p>
  }

  const pct = Math.min(result.total * 100, 100)
  const tone = result.level === 'toxic' ? 'bg-crimson' : result.level === 'caution' ? 'bg-amber' : 'bg-ok'
  const text = result.level === 'toxic' ? 'text-crimson' : result.level === 'caution' ? 'text-amber' : 'text-ok'

  return (
    <div className="space-y-3">
      <section className="rounded-xl border border-line bg-card p-3" aria-live="polite">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Total fraction of maximum (Σ dose ÷ max)</p>
        <p className={`font-mono text-4xl font-bold tabular-nums ${text}`}>{result.total.toFixed(2)}</p>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-base" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
          <div className={`h-full ${tone}`} style={{ width: `${pct}%` }} />
        </div>
        {result.level === 'toxic' && (
          <p className="mt-2 flex items-center gap-2 rounded-md border border-crimson bg-crimson/10 px-2 py-1 font-bold text-crimson">
            <ShieldAlert size={18} aria-hidden /> TOXIC RISK: total ≥ 1.0{result.worst ? ` (largest: ${result.worst.name})` : ''}
          </p>
        )}
        {result.level === 'caution' && (
          <p className="mt-2 font-semibold text-amber">CAUTION: approaching the combined maximum (≥ 0.8)</p>
        )}
        {result.level === 'ok' && <p className="mt-2 text-sm text-muted">Safe if total stays below 1.0.</p>}
      </section>

      {rows.map((r, i) => {
        const agent = LA_AGENTS.find((a) => a.id === r.agentId)!
        const row = result.rows[i]
        return (
          <article key={r.key} className="space-y-2 rounded-xl border border-line bg-card p-3">
            <div className="flex items-center gap-2">
              <select value={r.agentId} aria-label="Local anesthetic"
                onChange={(e) => {
                  const a = LA_AGENTS.find((x) => x.id === e.target.value)!
                  update(r.key, { agentId: a.id, conc: a.concentrations[1] ?? a.concentrations[0] })
                }}
                className="min-h-12 flex-1 rounded-lg border border-line bg-base px-3 text-lg font-bold">
                {LA_AGENTS.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              <button type="button" aria-label="Remove drug" onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))}
                className="flex min-h-12 min-w-12 items-center justify-center rounded-lg border border-line text-muted active:bg-line">
                <Trash2 size={20} />
              </button>
            </div>

            <div className="flex gap-2">
              <div className="flex overflow-hidden rounded-lg border border-line" role="group" aria-label="Epinephrine">
                {[false, true].map((e) => (
                  <button key={String(e)} type="button" onClick={() => update(r.key, { epi: e })}
                    className={`min-h-12 px-3 text-sm font-semibold ${r.epi === e ? 'bg-accent text-base' : 'bg-base'}`}>
                    {e ? 'With epi' : 'Plain'}
                  </button>
                ))}
              </div>
              <select value={r.conc} aria-label="Concentration" onChange={(e) => update(r.key, { conc: Number(e.target.value) })}
                className="min-h-12 flex-1 rounded-lg border border-line bg-base px-2 font-mono font-bold">
                {agent.concentrations.map((c) => <option key={c} value={c}>{c}%</option>)}
              </select>
              <input inputMode="decimal" placeholder="mL" aria-label="Volume in mL" value={r.volume}
                onChange={(e) => update(r.key, { volume: e.target.value })}
                className="min-h-12 w-24 rounded-lg border border-line bg-base px-2 font-mono text-lg font-bold tabular-nums text-accent outline-none focus:border-accent" />
            </div>

            <p className="font-mono text-sm tabular-nums text-muted">
              <span className="text-lg font-bold text-fg">{fmtNum(row.mg)} mg</span> of max{' '}
              <span className="font-bold text-fg">{fmtNum(row.maxMg)} mg</span> ({r.epi ? agent.mgPerKgEpi : agent.mgPerKgPlain} mg/kg, ceiling {r.epi ? agent.absEpi : agent.absPlain} mg) · fraction{' '}
              <span className="font-bold text-fg">{row.fraction.toFixed(2)}</span>
            </p>
          </article>
        )
      })}

      <button type="button" onClick={() => setRows((rs) => [...rs, newRow('ropivacaine')])}
        className="flex min-h-14 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-accent font-bold text-accent active:bg-card">
        <Plus size={20} aria-hidden /> Add local anesthetic
      </button>
    </div>
  )
}
