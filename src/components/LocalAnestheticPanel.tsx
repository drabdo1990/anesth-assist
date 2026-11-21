import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { LOCAL_ANESTHETICS } from '../data/medications';
import { resolveWithOverrides } from '../data/resolve';
import type { LocalAnesthetic, LocalAnestheticLimitRecord } from '../data/types';
import { useAppStore, type LaAdmin } from '../store/useAppStore';
import {
  combinedToxicityFraction,
  localAnestheticDoseMg,
  maxAllowedMg,
  type LocalAdministration,
} from '../lib/calc/localAnesthetic';
import { formatMg } from '../lib/calc/format';
import { NumericStepper } from './ui/NumericStepper';
import { SourceBadge } from './ui/SourceBadge';
import { UnitValue, type ValueTone } from './ui/UnitValue';
import { WarningBanner } from './ui/WarningBanner';
import { NoSourceValue } from './ui/NoSourceValue';

interface Row {
  admin: LaAdmin;
  agent: LocalAnesthetic;
  doseMg: number;
  record: LocalAnestheticLimitRecord | undefined;
  maxMg: number | null;
  maxNote: string;
  absoluteMaxMg?: number;
  localProtocol: boolean;
  conflict?: { guidelineValue: number; localValue?: number };
}

const resolveMaxMg = (
  agent: LocalAnesthetic,
  withEpi: boolean,
  weightKg: number,
  guidelineSet: 'international' | 'local',
): Omit<Row, 'admin' | 'agent' | 'doseMg'> => {
  const record = withEpi ? agent.withEpinephrine : agent.plain;
  if (!record) return { maxMg: null, maxNote: '', record, localProtocol: false };
  const which = withEpi ? 'epi' : 'plain';
  const abs =
    record.absoluteMaxMg !== undefined
      ? resolveWithOverrides(`la:${agent.id}:${which}:absoluteMaxMg`, record.absoluteMaxMg, guidelineSet)
      : undefined;
  const perKg =
    record.mgPerKg !== undefined
      ? resolveWithOverrides(`la:${agent.id}:${which}:mgPerKg`, record.mgPerKg, guidelineSet)
      : undefined;
  const maxMg = maxAllowedMg({ mgPerKg: perKg?.value, absoluteMaxMg: abs?.value }, weightKg);
  const note = [perKg ? `${perKg.value} mg/kg` : null, abs ? `${abs.value} mg absolute` : null]
    .filter(Boolean)
    .join(', ');
  const conflict = [abs, perKg].find((resolved) => resolved?.conflict);
  return {
    maxMg,
    maxNote: note,
    record,
    absoluteMaxMg: abs?.value,
    localProtocol: [abs, perKg].some((resolved) => resolved?.tag === 'Local protocol'),
    conflict: conflict ? { guidelineValue: conflict.guidelineValue, localValue: conflict.localValue } : undefined,
  };
};

const STATUS_TONE: Record<'safe' | 'caution' | 'toxic', ValueTone> = { safe: 'emerald', caution: 'amber', toxic: 'red' };

interface Props {
  weightKg: number | null;
}

export const LocalAnestheticPanel: React.FC<Props> = ({ weightKg }) => {
  const admins = useAppStore((s) => s.laAdmins);
  const add = useAppStore((s) => s.addLaAdmin);
  const update = useAppStore((s) => s.updateLaAdmin);
  const remove = useAppStore((s) => s.removeLaAdmin);
  const clear = useAppStore((s) => s.clearLaAdmins);
  const guidelineSet = useAppStore((s) => s.guidelineSet);

  if (weightKg === null || weightKg <= 0) {
    return (
      <WarningBanner level="info" title="Actual weight needed">
        Local anesthetic limits depend on actual body weight. Enter actual weight to use this calculator.
      </WarningBanner>
    );
  }

  const rows: Row[] = admins.map((admin) => {
    const agent = LOCAL_ANESTHETICS.find((a) => a.id === admin.anestheticId) ?? LOCAL_ANESTHETICS[0];
    const resolved = resolveMaxMg(agent, admin.withEpi, weightKg, guidelineSet);
    return { admin, agent, doseMg: localAnestheticDoseMg(admin.volumeMl, admin.percent), ...resolved };
  });

  const countable: LocalAdministration[] = rows
    .filter((r): r is Row & { maxMg: number } => r.maxMg !== null && r.doseMg > 0)
    .map((r) => ({ doseMg: r.doseMg, maxMg: r.maxMg }));
  const excluded = rows.filter((r) => r.maxMg === null && r.doseMg > 0);
  const total = combinedToxicityFraction(countable);

  return (
    <section className="flex flex-col gap-3" aria-label="Local anesthetic maximum dose calculator">
      <WarningBanner level="info" title="Total local anesthetic exposure">
        Add every local anesthetic given (surgeon, anesthesia, block service). The combined fraction is the sum of dose / maximum for each entry and must stay below 1.0. Weight used: actual body weight {weightKg.toFixed(1)} kg.
        Published maxima are not evidence-based and vary by source (Rosenberg 2004); reduce for age, pregnancy, and organ disease. CAS advises documenting the cumulative dose.
      </WarningBanner>

      <div className="rounded-2xl border border-slate-700 bg-slate-950 p-3">
        <div className="flex items-end justify-between gap-2">
          <UnitValue label="Combined fraction (sum of dose / max)" value={total.total.toFixed(2)} unit={`= ${Math.round(total.total * 100)}%`} size="xl" tone={STATUS_TONE[total.status]} />
          <span className={`rounded-lg px-2 py-1 text-xs font-black uppercase ${total.status === 'toxic' ? 'bg-red-500 text-white' : total.status === 'caution' ? 'bg-amber-500 text-black' : 'bg-emerald-500/20 text-emerald-300'}`}>
            {total.status === 'toxic' ? 'At or over 1.0' : total.status === 'caution' ? 'Caution' : 'Below limit'}
          </span>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-800" role="img" aria-label={`${Math.round(total.total * 100)} percent of combined maximum`}>
          <div
            className={`h-full ${total.status === 'toxic' ? 'bg-red-500' : total.status === 'caution' ? 'bg-amber-500' : 'bg-emerald-500'}`}
            style={{ width: `${Math.min(100, total.total * 100)}%` }}
          />
        </div>
      </div>

      {total.status === 'toxic' && (
        <WarningBanner level="red" title="Combined maximum reached or exceeded">
          Stop and reassess. Know the LAST pathway (Emergency button).
        </WarningBanner>
      )}
      {excluded.length > 0 && (
        <WarningBanner level="red" title="Total is underestimated">
          {excluded.length} entr{excluded.length === 1 ? 'y has' : 'ies have'} no sourced maximum for the chosen epinephrine option and {excluded.length === 1 ? 'is' : 'are'} NOT included in the total.
        </WarningBanner>
      )}

      {rows.map(({ admin, agent, doseMg, record, maxMg, maxNote, absoluteMaxMg, localProtocol, conflict }) => (
        <div key={admin.id} className="flex flex-col gap-2 rounded-2xl border border-slate-800 bg-clinical-card p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Agent">
              {LOCAL_ANESTHETICS.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  role="radio"
                  aria-checked={a.id === admin.anestheticId}
                  onClick={() => update(admin.id, { anestheticId: a.id, percent: a.concentrationsPercent[0] })}
                  className={`min-h-[48px] rounded-xl border px-3 text-xs font-bold ${a.id === admin.anestheticId ? 'border-cyan-400 bg-cyan-500/20 text-cyan-100' : 'border-slate-700 bg-slate-900 text-slate-300'}`}
                >
                  {a.name}
                </button>
              ))}
            </div>
            <button type="button" aria-label="Remove entry" onClick={() => remove(admin.id)} className="min-h-[48px] min-w-[48px] rounded-xl border border-slate-700 bg-slate-900 text-slate-300 flex items-center justify-center">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Concentration</span>
            <div className="mt-1 flex flex-wrap gap-1.5" role="radiogroup" aria-label="Concentration percent">
              {agent.concentrationsPercent.map((p) => (
                <button
                  key={p}
                  type="button"
                  role="radio"
                  aria-checked={p === admin.percent}
                  onClick={() => update(admin.id, { percent: p })}
                  className={`min-h-[48px] rounded-xl border px-3 font-mono text-sm font-bold ${p === admin.percent ? 'border-cyan-400 bg-cyan-500/20 text-cyan-100' : 'border-slate-700 bg-slate-900 text-slate-300'}`}
                >
                  {p}% <span className="text-[10px] text-slate-400">({p * 10} mg/mL)</span>
                </button>
              ))}
            </div>
          </div>

          <NumericStepper label="Volume given" value={admin.volumeMl} unit="mL" step={1} coarseStep={5} min={0} max={500} decimals={1} onChange={(v) => update(admin.id, { volumeMl: v })} />

          <label className="flex min-h-[48px] items-center gap-3 rounded-xl border border-slate-700 bg-slate-900 px-3 text-sm font-semibold text-slate-200">
            <input type="checkbox" className="h-6 w-6" checked={admin.withEpi} onChange={(e) => update(admin.id, { withEpi: e.target.checked })} />
            Contains epinephrine
          </label>

          <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-950 p-2">
            <UnitValue label="Dose given" value={admin.percent > 0 ? formatMg(doseMg) : '--'} unit="mg" size="lg" />
            {maxMg !== null ? (
              <UnitValue label={`Maximum (${maxNote})`} value={formatMg(maxMg)} unit="mg" size="lg" tone="cyan" align="end" />
            ) : (
              <NoSourceValue topic={`Maximum ${admin.withEpi ? 'with epinephrine' : 'plain'}`} compact />
            )}
          </div>
          {maxMg !== null && admin.percent > 0 && (
            <p className="font-mono text-xs text-slate-400">
              Fraction {(doseMg / maxMg).toFixed(2)} · implied {(doseMg / weightKg).toFixed(1)} mg/kg
            </p>
          )}
          {record && record.mgPerKg === undefined && absoluteMaxMg !== undefined && (
            <WarningBanner level="amber" title="Fixed adult total, not weight-scaled">
              This published maximum is a fixed adult total ({absoluteMaxMg} mg) and does not shrink with weight. At {weightKg.toFixed(1)} kg it equals {(absoluteMaxMg / weightKg).toFixed(1)} mg/kg. Reduce for small, elderly or compromised patients.
            </WarningBanner>
          )}
          {conflict && (
            <WarningBanner level="amber" title="Guideline vs local protocol">
              Guideline {conflict.guidelineValue}, local protocol {conflict.localValue}. The value currently in force is shown above.
            </WarningBanner>
          )}
          {record?.note && <p className="text-xs text-slate-400">{record.note}</p>}
          {agent.alternates && agent.alternates.length > 0 && (
            <ul className="list-disc pl-5 text-xs text-amber-200">
              {agent.alternates.map((a) => (
                <li key={a.label}>Other published figure: {a.label}: {a.absoluteMaxMg !== undefined ? `${a.absoluteMaxMg} mg` : `${a.mgPerKg} mg/kg`}</li>
              ))}
            </ul>
          )}
          {agent.cautions?.map((c) => (
            <WarningBanner key={c} level="amber">{c}</WarningBanner>
          ))}
          <SourceBadge sourceIds={[...agent.sourceIds, ...(record?.sourceIds ?? []), ...(localProtocol ? ['local-protocol'] : [])]} />
        </div>
      ))}

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => add(LOCAL_ANESTHETICS[0].id, LOCAL_ANESTHETICS[0].concentrationsPercent[0])}
          className="min-h-[48px] rounded-xl bg-cyan-500 font-black uppercase text-black flex items-center justify-center gap-1.5"
        >
          <Plus className="h-5 w-5" /> Add entry
        </button>
        <button type="button" onClick={clear} disabled={admins.length === 0} className="min-h-[48px] rounded-xl border border-slate-700 bg-slate-900 font-bold uppercase text-slate-300 disabled:opacity-40">
          Clear all
        </button>
      </div>
      {admins.length === 0 && <p className="text-center text-xs text-slate-400">No entries. The combined fraction starts at 0.00.</p>}
    </section>
  );
};
