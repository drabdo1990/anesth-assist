import type { ReactNode } from 'react'
import { useScalars } from '../hooks'
import {
  adultEtt,
  BRONCHIAL_BLOCKERS,
  bladeRecommendation,
  CUFF_PRESSURE_MAX,
  dltSize,
  GUEDEL_TABLE,
  guedelSize,
  pedsEtt,
  SAD_TABLE,
  selectSad,
} from '../lib/airwayEquipment'
import { estimatePedsWeight, isAgeValid } from '../lib/biometrics'
import { useStore } from '../store'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-bold uppercase tracking-widest text-amber">{title}</h2>
      {children}
    </section>
  )
}

function Info({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div
      className={`flex items-baseline justify-between gap-2 rounded-lg border px-3 py-2 ${
        highlight ? 'border-amber bg-amber/10' : 'border-line bg-base'
      }`}
    >
      <span className="text-sm text-muted">{label}</span>
      <span
        className={`font-mono text-lg font-bold tabular-nums ${highlight ? 'text-amber' : 'text-fg'}`}
      >
        {value}
      </span>
    </div>
  )
}

interface Row {
  key: string
  cells: ReactNode[]
}

function DataTable({ head, rows }: { head: string[]; rows: Row[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-line">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="bg-base text-xs uppercase tracking-wide text-muted">
            {head.map((h) => (
              <th key={h} className="px-3 py-2 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} className="border-t border-line bg-card">
              {r.cells.map((c, j) => (
                <td key={head[j]} className="px-3 py-2 font-mono tabular-nums">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function AirwayView() {
  const patientType = useStore((s) => s.patientType)
  const sex = useStore((s) => s.sex)
  const heightCm = useStore((s) => s.heightCm)
  const ageYears = useStore((s) => s.ageYears)
  const scalars = useScalars()
  const weight = scalars?.tbw ?? null
  const isPeds = patientType === 'pediatric'

  const sad = selectSad(weight)
  const guedel = guedelSize(weight)
  const ett = adultEtt(sex)
  const dlt = heightCm !== null ? dltSize(heightCm, sex) : null
  const pEtt = isPeds && isAgeValid(ageYears) ? pedsEtt(ageYears) : null

  return (
    <div className="space-y-6">
      <Section title="Endotracheal Tubes">
        {!isPeds && (
          <div className="space-y-2">
            <Info
              label={sex === 'female' ? 'Female standard ID' : 'Male standard ID'}
              value={`${ett.idLow.toFixed(1)}–${ett.idHigh.toFixed(1)} mm`}
              highlight
            />
            <Info label="Depth at teeth" value={`≈ ${ett.depthLow}–${ett.depthHigh} cm`} />
          </div>
        )}
        {isPeds &&
          (pEtt ? (
            <div className="space-y-2">
              <Info label="Uncuffed ID ((age/4)+4)" value={`${pEtt.uncuffedId} mm`} highlight />
              <Info label="Cuffed ID ((age/4)+3.5)" value={`${pEtt.cuffedId} mm`} highlight />
              <Info label="Microcuff ID ((age/4)+3.0)" value={`${pEtt.microcuffId} mm`} />
              <Info label="Oral depth ((age/2)+12)" value={`≈ ${pEtt.oralDepth} cm`} />
              <Info label="Nasal depth ((age/2)+15)" value={`≈ ${pEtt.nasalDepth} cm`} />
            </div>
          ) : (
            <p className="rounded-lg border border-line bg-base p-3 text-sm text-muted">
              Enter pediatric age in the top bar to size pediatric tubes.
            </p>
          ))}
        <p className="flex items-center gap-2 rounded-md border border-amber/60 bg-amber/10 px-2 py-1 text-xs font-semibold text-amber">
          <span aria-hidden>⚠</span> Cuff pressure ≤ 20–{CUFF_PRESSURE_MAX} cmH₂O (subglottic
          ischemia risk)
        </p>
      </Section>

      <Section title="Supraglottic Airway / i-gel">
        <DataTable
          head={['Size', 'Patient', 'Max cuff air']}
          rows={SAD_TABLE.map((r) => ({
            key: r.size,
            cells: [
              <span key="size" className={sad?.size === r.size ? 'font-bold text-amber' : ''}>
                {r.size}
              </span>,
              <span key="patient" className="font-sans">
                {r.maxKg === null ? `> ${r.minKg} kg` : `${r.minKg}–${r.maxKg} kg`}
              </span>,
              `${r.cuffMl} mL`,
            ],
          }))}
        />
        <p className="text-xs text-muted">
          i-gel maps 1:1 to the same size bands (sizes 1–5); it is cuffless — no cuff volume.
          {sad && (
            <>
              {' '}
              Selected for {weight?.toFixed(1)} kg:{' '}
              <strong className="text-amber">size {sad.size}</strong>.
            </>
          )}
        </p>
      </Section>

      <Section title="Double-Lumen Tubes (left Robertshaw)">
        <DataTable
          head={['Height', 'Female', 'Male']}
          rows={[
            { key: 'short', cells: ['< 160 cm', '35 Fr', '35 Fr'] },
            { key: 'medium', cells: ['160–175 cm', '37 Fr', '39 Fr'] },
            { key: 'tall', cells: ['> 175 cm', '39–41 Fr', '39–41 Fr'] },
          ]}
        />
        <Info
          label={heightCm === null ? 'Enter height for suggestion' : `Suggestion @ ${heightCm} cm`}
          value={dlt ?? '—'}
          highlight={dlt !== null}
        />
        <DataTable
          head={['Blocker', 'Requires']}
          rows={BRONCHIAL_BLOCKERS.map((b) => ({
            key: b.size,
            cells: [
              b.size,
              <span key="req" className="font-sans">
                {b.slt}
              </span>,
            ],
          }))}
        />
      </Section>

      <Section title="Pharyngeal Airways & Blades">
        <DataTable
          head={['Guedel', 'Patient']}
          rows={GUEDEL_TABLE.map((g) => ({
            key: g.size,
            cells: [
              <span key="size" className={guedel === g.size ? 'font-bold text-amber' : ''}>
                {g.size}
              </span>,
              <span key="patient" className="font-sans">
                {g.patient}
              </span>,
            ],
          }))}
        />
        <p className="text-xs text-muted">
          Size: corner of mouth → angle of mandible (or central incisors → mandibular angle).
        </p>
        <Info
          label="Laryngoscope blade"
          value={bladeRecommendation(isAgeValid(ageYears) ? ageYears : null, isPeds)}
          highlight
        />
        {isPeds && isAgeValid(ageYears) && (
          <p className="text-xs text-muted">
            Age {ageYears} yr → est. weight {estimatePedsWeight(ageYears)} kg ((age + 4) × 2).
          </p>
        )}
      </Section>
    </div>
  )
}
