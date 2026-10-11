import { PhoneCall, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { Checklist } from '../components/Checklist'
import { Timer } from '../components/Timer'
import { CICO_PLANS, dantrolene, LAST_STEPS, lastLipid, MH_STEPS, ryanodex } from '../lib/crisis'
import { fmtNum, fmtVol } from '../lib/format'
import { useStore } from '../store'

type Protocol = 'last' | 'mh' | 'cico'

function Stat({
  label,
  value,
  unit,
  sub,
}: {
  label: string
  value: string
  unit: string
  sub?: string
}) {
  return (
    <div className="rounded-lg border border-line bg-base p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="font-mono text-3xl font-bold tabular-nums text-accent">
        {value} <span className="text-lg">{unit}</span>
      </p>
      {sub && <p className="text-sm text-muted">{sub}</p>}
    </div>
  )
}

const needWeight = (
  <p className="rounded-lg border border-line bg-base p-3 text-sm text-muted">
    Enter valid weight above to calculate doses.
  </p>
)

function LastPanel({ kg }: { kg: number | null }) {
  const r = lastLipid(kg)
  return (
    <div className="space-y-3">
      {r ? (
        <>
          <Stat
            label="20% lipid bolus (1.5 mL/kg over 2–3 min)"
            value={fmtNum(r.bolusMl)}
            unit="mL"
            sub={
              r.bolusCapped
                ? `CAPPED at 100 mL (uncapped ${fmtNum(r.uncappedBolusMl)} mL)`
                : undefined
            }
          />
          <Stat
            label="Then infusion (0.25 mL/kg/min)"
            value={fmtNum(r.infusionMlMin)}
            unit="mL/min"
            sub={`${fmtNum(r.infusionMlHr)} mL/h`}
          />
          <p className="text-sm text-muted">
            Maximum total lipid about {fmtNum(r.maxTotalMl)} mL (12 mL/kg).
          </p>
        </>
      ) : (
        needWeight
      )}
      <Checklist items={LAST_STEPS} accent="crimson" />
    </div>
  )
}

function MhPanel({ kg }: { kg: number | null }) {
  const d = dantrolene(kg)
  const ry = ryanodex(kg)
  return (
    <div className="space-y-3">
      {d && ry ? (
        <>
          <Stat
            label="Dantrolene 2.5 mg/kg"
            value={fmtNum(d.doseMg)}
            unit="mg"
            sub={`${d.vials} × 20 mg vials · ${fmtVol(d.volumeMl)} mL after reconstitution (60 mL per vial)`}
          />
          <Stat
            label="Ryanodex 2.5 mg/kg"
            value={fmtNum(ry.doseMg)}
            unit="mg"
            sub={`${ry.vials} × 250 mg vial · ${fmtVol(ry.volumeMl)} mL at 50 mg/mL`}
          />
          <p className="text-sm text-muted">
            Repeat as needed; cumulative ceiling about {fmtNum(d.maxTotalMg)} mg (10 mg/kg), then
            seek expert advice.
          </p>
        </>
      ) : (
        needWeight
      )}
      <Checklist items={MH_STEPS} accent="crimson" />
    </div>
  )
}

function CicoPanel() {
  const [idx, setIdx] = useState(0)
  const plan = CICO_PLANS[idx]
  const last = idx === CICO_PLANS.length - 1
  return (
    <div className="space-y-3">
      <Timer title="CICO elapsed time" label="CICO" />
      <div className="flex gap-1" role="group" aria-label="Plan progress">
        {CICO_PLANS.map((p, i) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setIdx(i)}
            className={`min-h-12 flex-1 rounded-lg border font-bold ${i === idx ? 'border-crimson bg-crimson text-white' : i < idx ? 'border-ok text-ok' : 'border-line text-muted'}`}
          >
            {p.id}
          </button>
        ))}
      </div>
      <h3 className="text-lg font-bold text-crimson">{plan.title}</h3>
      <p className="text-sm text-muted">{plan.goal}</p>
      {CICO_PLANS.map((p, i) => (
        <div key={p.id} className={i === idx ? '' : 'hidden'}>
          <Checklist items={p.steps} accent="crimson" />
        </div>
      ))}
      <p className="flex items-start gap-2 rounded-lg border border-crimson bg-crimson/10 p-3 font-semibold text-crimson">
        <TriangleAlert size={18} className="mt-0.5 shrink-0" aria-hidden /> {plan.failure}
      </p>
      {!last && (
        <button
          type="button"
          onClick={() => setIdx(idx + 1)}
          className="min-h-14 w-full rounded-xl bg-crimson font-bold text-white active:opacity-80"
        >
          Plan {plan.id} FAILED → go to Plan {CICO_PLANS[idx + 1].id}
        </button>
      )}
    </div>
  )
}

export function CrisisView() {
  const weightKg = useStore((s) => s.weightKg)
  const [proto, setProto] = useState<Protocol>('last')
  const tabs: { id: Protocol; label: string }[] = [
    { id: 'last', label: 'LAST' },
    { id: 'mh', label: 'MH' },
    { id: 'cico', label: 'CICO' },
  ]
  return (
    <div className="space-y-3">
      <p className="flex items-center gap-2 rounded-xl bg-crimson p-3 text-lg font-extrabold text-white">
        <PhoneCall size={22} aria-hidden /> CALL FOR HELP FIRST
      </p>
      <Timer title="CPR / rhythm check (2 min cycle)" label="CPR" cycleSeconds={120} />
      <div className="grid grid-cols-3 gap-2" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={proto === t.id}
            type="button"
            onClick={() => setProto(t.id)}
            className={`min-h-14 rounded-xl border-2 text-lg font-extrabold ${proto === t.id ? 'border-crimson bg-crimson/20 text-crimson' : 'border-line bg-card text-muted'}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className={proto === 'last' ? '' : 'hidden'}>
        <LastPanel kg={weightKg} />
      </div>
      <div className={proto === 'mh' ? '' : 'hidden'}>
        <MhPanel kg={weightKg} />
      </div>
      <div className={proto === 'cico' ? '' : 'hidden'}>
        <CicoPanel />
      </div>
    </div>
  )
}
