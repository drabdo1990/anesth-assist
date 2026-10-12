import { TriangleAlert } from 'lucide-react'
import { type ReactNode, useState } from 'react'
import { NumField } from '../components/Stepper'
import { useScalars } from '../hooks'
import {
  drivingPressure,
  drivingTone,
  minuteVentilation,
  pplatTone,
  rrBaseline,
  volutraumaRisk,
  vtRows,
} from '../lib/ventilation'
import { useStore } from '../store'

const TONE_CLASS: Record<string, string> = {
  ok: 'text-ok',
  caution: 'text-amber',
  danger: 'text-crimson',
}

function Pill({
  active,
  onClick,
  children,
  ariaLabel,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
  ariaLabel: string
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={ariaLabel}
      onClick={onClick}
      className={`min-h-12 rounded-lg border px-4 text-sm font-semibold ${
        active ? 'border-accent bg-accent text-base' : 'border-line bg-card text-muted'
      }`}
    >
      {children}
    </button>
  )
}

export function VentilationView() {
  const patientType = useStore((s) => s.patientType)
  const scalars = useScalars()
  const isPeds = patientType === 'pediatric'

  const [rr, setRr] = useState<number | null>(isPeds ? 24 : 12)
  const [pplat, setPplat] = useState<number | null>(null)
  const [peep, setPeep] = useState<number | null>(5)
  const [copd, setCopd] = useState(false)
  const [lap, setLap] = useState(false)

  const isPedsRr = isPeds
  const [rrMin, rrMax] = rrBaseline(isPedsRr)
  const dosingWeight = scalars?.[isPeds ? 'tbw' : 'ibw'] ?? null
  const rows = dosingWeight ? vtRows(dosingWeight) : []
  const dp = pplat !== null && peep !== null ? drivingPressure(pplat, peep) : null
  const dpTone = drivingTone(dp)
  const ppTone = pplatTone(pplat)
  const volutrauma =
    !isPeds &&
    scalars !== null &&
    dosingWeight !== null &&
    volutraumaRisk(scalars.tbw, dosingWeight)

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h2 className="text-sm font-bold uppercase tracking-widest text-accent">
          Tidal Volume — {isPeds ? '6–8 mL/kg TBW' : '6–8 mL/kg IBW (PBW)'}
        </h2>
        {!dosingWeight ? (
          <p className="rounded-lg border border-line bg-base p-3 text-sm text-muted">
            {isPeds ? 'Enter pediatric weight' : 'Enter weight & height'} in the top bar.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2">
              {rows.map((r) => (
                <div
                  key={r.label}
                  className="rounded-lg border border-line bg-card p-3 text-center"
                >
                  <p className="text-xs font-semibold text-muted">{r.label}</p>
                  <p className="font-mono text-2xl font-bold tabular-nums text-accent">
                    {Math.round(r.vtMl)}
                    <span className="text-sm text-muted"> mL</span>
                  </p>
                  <p className="font-mono text-xs tabular-nums text-muted">
                    V̇E {minuteVentilation(r.vtMl, rr ?? 0).toFixed(1)} L/min
                  </p>
                </div>
              ))}
            </div>
            <NumField label="Respiratory rate" unit="/min" value={rr} onChange={setRr} max={60} />
            <p className="text-xs text-muted">
              Baseline RR {rrMin}–{rrMax}/min ({isPeds ? 'pediatric' : 'adult'}); target PaCO₂ 35–40
              mmHg, ETCO₂ 30–35 mmHg.
            </p>
          </>
        )}
        {volutrauma && (
          <p className="flex items-center gap-2 rounded-md border border-crimson bg-crimson/10 px-2 py-1.5 text-sm font-bold text-crimson">
            <TriangleAlert size={16} aria-hidden />
            VT is set on IBW, never TBW — dialing VT by actual weight risks volutrauma.
          </p>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-bold uppercase tracking-widest text-accent">Pressure Limits</h2>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-line bg-card p-3 text-center">
            <p className="text-xs font-semibold text-muted">Driving pressure (ΔP)</p>
            <p
              className={`font-mono text-2xl font-bold tabular-nums ${dp !== null ? TONE_CLASS[dpTone ?? ''] : 'text-muted'}`}
            >
              {dp === null ? '—' : dp}
              <span className="text-sm text-muted"> cmH₂O</span>
            </p>
            <p className="text-[11px] text-muted">Pplat − PEEP; target &lt; 14–15</p>
          </div>
          <div className="rounded-lg border border-line bg-card p-3 text-center">
            <p className="text-xs font-semibold text-muted">Plateau pressure</p>
            <p
              className={`font-mono text-2xl font-bold tabular-nums ${pplat !== null ? TONE_CLASS[ppTone ?? ''] : 'text-muted'}`}
            >
              {pplat === null ? '—' : pplat}
              <span className="text-sm text-muted"> cmH₂O</span>
            </p>
            <p className="text-[11px] text-muted">Safe limit &lt; 30</p>
          </div>
        </div>
        <div className="flex gap-2">
          <NumField
            label="Pplat (measured)"
            unit="cmH₂O"
            value={pplat}
            onChange={setPplat}
            max={60}
          />
          <NumField label="PEEP" unit="cmH₂O" value={peep} onChange={setPeep} max={20} />
        </div>
        <p className="text-xs text-muted">
          Intraoperative PEEP baseline 5–8 cmH₂O; use decremental titration to find the best
          compliance.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-bold uppercase tracking-widest text-accent">Modifiers</h2>
        <div className="flex flex-wrap gap-2">
          <Pill
            active={copd}
            onClick={() => setCopd((v) => !v)}
            ariaLabel="Toggle COPD obstructive lung mode"
          >
            COPD / Obstructive
          </Pill>
          <Pill
            active={lap}
            onClick={() => setLap((v) => !v)}
            ariaLabel="Toggle laparoscopy Trendelenburg mode"
          >
            Laparoscopy / Trendelenburg
          </Pill>
        </div>
        {copd && (
          <ul className="list-disc space-y-1 rounded-lg border border-amber/60 bg-amber/10 p-3 pl-6 text-sm text-amber">
            <li>Prolong expiratory time: I:E = 1:3 to 1:4</li>
            <li>Lower RR (&lt; 10–12/min) to prevent intrinsic PEEP and gas trapping</li>
            <li>Watch for auto-PEEP on flow curve / auscultation</li>
          </ul>
        )}
        {lap && (
          <ul className="list-disc space-y-1 rounded-lg border border-amber/60 bg-amber/10 p-3 pl-6 text-sm text-amber">
            <li>Anticipate decreased compliance (cephalad diaphragm displacement)</li>
            <li>Monitor driving pressure elevation after pneumoperitoneum / Trendelenburg</li>
            <li>Re-check V_T and ΔP after position changes</li>
          </ul>
        )}
      </section>
    </div>
  )
}
