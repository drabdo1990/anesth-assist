import React from 'react';
import { REFERENCE_DRUGS } from '../data/referenceDrugs';
import { referenceGroupsForFilter, type DosingFilter } from '../data/referenceGroups';
import type { ReferenceDoseLine, ReferenceDrug, ReferenceDrugGroup, ReferenceInfusionLine } from '../data/types';
import { SourceBadge } from './ui/SourceBadge';
import { WarningBanner } from './ui/WarningBanner';

const GROUP_LABELS: Record<ReferenceDrugGroup, string> = {
  induction: 'Induction',
  premedication: 'Premedication',
  opioid: 'Opioids',
  nmba: 'Muscle relaxants',
  vasoactive: 'Vasoactive',
  antiemetic: 'Antiemetics',
  'analgesic-adjunct': 'Analgesic adjuncts',
  'electrolyte-metabolic': 'Electrolytes and metabolic',
  emergency: 'Emergency',
};

const range = (min: number, max?: number): string => (max === undefined || max === min ? `${min}` : `${min}-${max}`);

const doseText = (d: ReferenceDoseLine): string =>
  `${d.population === 'adult' ? 'Adult' : 'Pediatric'}${d.route ? ` ${d.route}` : ''}: ${range(d.min, d.max)} ${d.unit}` +
  `${d.scalar ? ` (${d.scalar})` : ''}${d.maxAbsolute ? `, max ${d.maxAbsolute.value} ${d.maxAbsolute.unit}` : ''}`;

const InfusionRow: React.FC<{ i: ReferenceInfusionLine }> = ({ i }) => (
  <li className="rounded-lg bg-slate-950 p-2 text-xs">
    <div className="flex justify-between gap-2 font-medium text-slate-200">
      <span>{i.indication}</span>
      <span className="shrink-0 font-mono text-sky-300">
        {range(i.rateMin, i.rateMax)} {i.unit}
      </span>
    </div>
    {i.loadingDose && <p className="text-slate-400">Loading: {i.loadingDose}</p>}
    {i.standardDilution && <p className="text-slate-400">Dilution: {i.standardDilution}</p>}
    {i.suggested60kgRate && <p className="text-slate-400">60 kg example: {i.suggested60kgRate}</p>}
    {i.notes && <p className="italic text-slate-400">{i.notes}</p>}
    {i.discrepancy && (
      <WarningBanner level="amber" title="Check source">
        {i.discrepancy}
      </WarningBanner>
    )}
  </li>
);

const DrugEntry: React.FC<{ drug: ReferenceDrug }> = ({ drug }) => (
  <details className="rounded-xl border border-slate-800 bg-clinical-card p-2.5">
    <summary className="min-h-[40px] cursor-pointer text-sm font-bold text-slate-100">
      {drug.name}
      {drug.scalar && !drug.supplementTo && <span className="ml-2 text-[10px] font-semibold text-slate-400">source scalar: {drug.scalar}</span>}
    </summary>
    <div className="mt-2 flex flex-col gap-2">
      {drug.discrepancy && (
        <WarningBanner level="amber" title="Check source">
          {drug.discrepancy}
        </WarningBanner>
      )}
      {drug.concentrationsMgPerMl && (
        <p className="text-xs text-slate-400">Listed strengths: {drug.concentrationsMgPerMl.map((c) => `${c} mg/mL`).join(', ')}</p>
      )}
      {drug.doses.length > 0 && (
        <ul className="flex flex-col gap-1 text-xs text-slate-200">
          {drug.doses.map((d, idx) => (
            <li key={idx}>
              <span className="font-mono">{doseText(d)}</span>
              {d.note && <span className="text-slate-400"> · {d.note}</span>}
            </li>
          ))}
        </ul>
      )}
      {drug.infusions.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {drug.infusions.map((i, idx) => (
            <InfusionRow key={idx} i={i} />
          ))}
        </ul>
      )}
      {drug.tivaTargets && (
        <p className="text-xs text-violet-300">
          Plasma targets:{' '}
          {Object.entries(drug.tivaTargets)
            .filter(([k]) => k !== 'unit')
            .map(([k, v]) => `${k} ${v}`)
            .join('; ')}{' '}
          ({drug.tivaTargets.unit})
        </p>
      )}
      {drug.cautions?.map((c) => (
        <p key={c} className="text-[11px] text-amber-300">
          ⚠ {c}
        </p>
      ))}
      <SourceBadge sourceIds={drug.sourceIds} />
    </div>
  </details>
);

interface Props {
  /** Lower-cased, trimmed search text from the dosing view. */
  query: string;
  /** The dosing view's active filter; the groups it shows come from referenceGroups.ts. */
  filter?: DosingFilter;
}

/** Reference only: nothing here uses the weight you entered or computes a dose. */
export const ReferenceDrugsPanel: React.FC<Props> = ({ query, filter = 'all' }) => {
  const allowedGroups = referenceGroupsForFilter(filter);
  if (allowedGroups.length === 0) return null;

  const matches = REFERENCE_DRUGS.filter(
    (d) => allowedGroups.includes(d.group) && (query === '' || d.name.toLowerCase().includes(query) || d.id.includes(query)),
  );
  if (matches.length === 0) return null;

  return (
    <section className="flex flex-col gap-3" aria-label="Secondary-sourced drug reference">
      <h2 className="text-sm font-black uppercase tracking-wider text-cyan-300">Secondary-sourced drug reference</h2>
      <WarningBanner level="amber" title="Reference only, no calculation">
        Doses and infusion rates below are quoted from textbooks in the project notebook, not from product labels. They are not scaled to the patient, and no volume or rate is calculated. Verify against the product label and your protocol.
      </WarningBanner>
      {allowedGroups.map((g) => {
        const drugs = matches.filter((d) => d.group === g);
        if (drugs.length === 0) return null;
        return (
          <div key={g} className="flex flex-col gap-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">{GROUP_LABELS[g]}</h3>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {drugs.map((d) => (
                <DrugEntry key={d.id} drug={d} />
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
};
