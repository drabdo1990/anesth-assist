import { TriangleAlert } from 'lucide-react'
import { useScalars } from '../hooks'
import { calcOption } from '../lib/dosing'
import type { Drug } from '../lib/drugs'
import { fmtNum, fmtRange, fmtVol } from '../lib/format'
import { useStore } from '../store'
import { ScalarBadge } from './ScalarBadge'

function DrugBody({ drug }: { drug: Drug }) {
  const scalars = useScalars()
  const isPeds = useStore((s) => s.patientType === 'pediatric')
  const override = useStore((s) => s.concOverrides[drug.id])
  const setConc = useStore((s) => s.setConc)
  const conc = drug.concentrations.includes(override) ? override : drug.defaultConc
  const allFixed = drug.options.every((o) => o.basis === 'fixed')
  // pediatric scalars collapse to TBW, so label the badge TBW instead of IBW/LBW
  const badgeKind = isPeds ? ('tbw' as const) : drug.scalar
  const currentTarget = isPeds ? 'pediatric' : 'adult'
  const visibleOptions = drug.options.filter(
    (o) => !o.target || o.target === 'all' || o.target === currentTarget,
  )

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-bold">{drug.name}</h3>
        {scalars && !allFixed && visibleOptions.length > 0 && (
          <ScalarBadge kind={badgeKind} kg={scalars[badgeKind]} />
        )}
      </div>

      {!scalars ? (
        <p className="rounded-md border border-line bg-base p-3 text-sm text-muted">
          {isPeds ? 'Enter valid pediatric weight' : 'Enter valid weight & height'}
        </p>
      ) : visibleOptions.length === 0 ? (
        <p className="rounded-md border border-line bg-base p-3 text-sm text-muted">
          {isPeds
            ? 'Adult indication only — no routine pediatric dosing.'
            : 'Pediatric indication only.'}
        </p>
      ) : (
        visibleOptions.map((opt) => {
          const r = calcOption(drug, opt, scalars, conc)
          return (
            <div key={opt.label} className="rounded-lg border border-line bg-base p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                {opt.label}
              </p>
              <p className="font-mono text-3xl font-bold tabular-nums text-accent">
                {fmtRange(r.massLow, r.massHigh)} <span className="text-lg">{r.unit}</span>
                {r.perHour && <span className="text-lg text-muted">/h</span>}
              </p>
              <p className="font-mono text-xl font-semibold tabular-nums">
                {fmtRange(r.volLow, r.volHigh, fmtVol)}{' '}
                <span className="text-base text-muted">{r.perHour ? 'mL/h' : 'mL'}</span>
                <span className="ml-2 text-xs text-muted">
                  @ {fmtNum(conc)} {r.unit}/mL
                </span>
              </p>
              {r.ceilingHit && (
                <p className="mt-2 flex items-center gap-2 rounded-md border border-crimson bg-crimson/10 px-2 py-1 text-sm font-bold text-crimson">
                  <TriangleAlert size={16} aria-hidden />
                  CAPPED at {fmtNum(drug.maxMass!)} {r.unit}
                  <span className="font-normal text-muted">
                    (uncapped {fmtNum(r.uncappedHigh)} {r.unit})
                  </span>
                </p>
              )}
            </div>
          )
        })
      )}

      {drug.concentrations.length > 1 && (
        <div
          className="flex flex-wrap items-center gap-1.5"
          role="group"
          aria-label={`${drug.name} concentration`}
        >
          <span className="text-xs text-muted">Vial:</span>
          {drug.concentrations.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setConc(drug.id, c)}
              className={`min-h-12 min-w-12 rounded-lg border px-3 font-mono text-sm font-bold ${c === conc ? 'border-accent bg-accent text-base' : 'border-line bg-card'}`}
            >
              {fmtNum(c)}
            </button>
          ))}
          <span className="text-xs text-muted">{drug.unit}/mL</span>
        </div>
      )}
      {drug.note && <p className="text-xs text-muted">{drug.note}</p>}
    </div>
  )
}

export function DrugCard({ drug }: { drug: Drug }) {
  return (
    <article className="space-y-4 rounded-xl border border-line bg-card p-3">
      <DrugBody drug={drug} />
      {drug.companion && (
        <div className="border-t border-line pt-3">
          <DrugBody drug={drug.companion} />
        </div>
      )}
    </article>
  )
}
