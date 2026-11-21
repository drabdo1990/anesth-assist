import React from 'react';
import { NEURAXIAL_REGIMENS } from '../data/neuraxial';
import type { NeuraxialRegimen } from '../data/types';
import { SourceBadge } from './ui/SourceBadge';
import { WarningBanner } from './ui/WarningBanner';

const span = (r: [number, number] | undefined, unit: string): string =>
  r === undefined ? '' : r[0] === r[1] ? `${r[0]} ${unit}` : `${r[0]}-${r[1]} ${unit}`;

const Row: React.FC<{ r: NeuraxialRegimen }> = ({ r }) => (
  <li className="flex flex-col gap-1 rounded-xl border border-slate-800 bg-clinical-card p-2.5">
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-sm font-bold text-slate-100">{r.agent}</span>
      <span className="font-mono text-sm font-bold tabular-nums text-cyan-300">{r.concLabel}</span>
    </div>
    <p className="font-mono text-xs text-slate-300">
      {span(r.volumeMl, 'mL')} · total {span(r.totalDoseMg, 'mg')}
      {r.baricity ? ` · ${r.baricity}${r.glucosePercent ? ` (${r.glucosePercent}% dextrose)` : ''}` : ''}
    </p>
    <p className="text-[11px] text-slate-400">
      {r.onsetMin ? `Onset ${span(r.onsetMin, 'min')}` : ''}
      {r.onsetMin && r.durationMin ? ' · ' : ''}
      {r.durationMin ? `Duration ${span(r.durationMin, 'min')}` : ''}
    </p>
    {r.discrepancy && (
      <WarningBanner level="amber" title="Check source">
        Printed total dose does not match concentration x volume: {r.discrepancy}
      </WarningBanner>
    )}
    <SourceBadge sourceIds={r.sourceIds} />
  </li>
);

/** Reference only. Not scaled by weight and not part of the combined toxicity fraction. */
export const NeuraxialReference: React.FC = () => (
  <details className="rounded-2xl border border-slate-800 bg-slate-900 p-3">
    <summary className="min-h-[48px] cursor-pointer text-sm font-bold text-slate-200">
      Neuraxial regimens for a 70 kg adult (reference only)
    </summary>
    <div className="mt-2 flex flex-col gap-3">
      <WarningBanner level="info">
        Typical regimens as printed in the notebook sources. Adjust to the patient and your protocol; these figures do not use the weight you entered.
      </WarningBanner>
      {(['spinal', 'epidural'] as const).map((route) => (
        <section key={route} className="flex flex-col gap-2" aria-label={`${route} regimens`}>
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">{route}</h3>
          <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {NEURAXIAL_REGIMENS.filter((r) => r.route === route).map((r) => (
              <Row key={r.id} r={r} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  </details>
);
