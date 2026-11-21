import React from 'react';
import { PERIOP_RULES, type PeriopAction, type PeriopDrug, type PeriopMedRule } from '../data/periopMeds';
import { creatinineClearance } from '../lib/calc/crcl';
import { matchTimings } from '../lib/calc/periopMeds';
import { useAppStore } from '../store/useAppStore';
import { Panel } from './hud/Panel';
import { ScoreItem } from './ScorePanel';
import { SourceBadge } from './ui/SourceBadge';
import { WarningBanner } from './ui/WarningBanner';

const ACTION_LABEL: Record<PeriopAction, string> = {
  continue: 'Continue',
  hold: 'Hold',
  modify: 'Modify',
  individualise: 'Individualise',
};

const DrugBlock: React.FC<{ drug: PeriopDrug; crcl: number | null }> = ({ drug, crcl }) => (
  <div className="flex flex-col gap-1.5 rounded-xl border border-clinical-border bg-clinical-bg/60 p-2.5">
    <h4 className="text-sm font-bold text-slate-100">{drug.name}</h4>
    {matchTimings(drug, crcl).map(({ timing, match }) => (
      <p key={timing.text} className={`text-sm ${match === 'no' ? 'text-slate-500' : 'text-slate-100'}`}>
        {timing.when && <span className="font-semibold text-cyan-300">{timing.when}: </span>}
        {timing.text}
        {match === 'yes' && crcl !== null && (
          <span className="ml-1 font-mono text-xs text-emerald-300">(this patient: CrCl {crcl.toFixed(1)} mL/min)</span>
        )}
        {match === 'unknown' && <span className="ml-1 text-xs text-amber-300">(enter age, weight, sex and creatinine in Assess to match)</span>}
      </p>
    ))}
    {drug.catheter && (
      <div className="flex flex-col gap-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Catheters, monitoring and post-block dosing</p>
        {drug.catheter.map((c) => (
          <p key={c} className="text-xs text-slate-300">
            {c}
          </p>
        ))}
      </div>
    )}
    {drug.restart && <p className="text-xs text-slate-300">Restart: {drug.restart}</p>}
    <SourceBadge sourceIds={[drug.sourceId]} />
  </div>
);

const RuleCard: React.FC<{ rule: PeriopMedRule; crcl: number | null }> = ({ rule, crcl }) => (
  <Panel title={rule.drugClass} sourceIds={rule.sourceIds}>
    <p className="text-sm text-slate-200">
      <span className="font-bold text-amber-300">{ACTION_LABEL[rule.action]}.</span> {rule.summary}
    </p>
    {rule.cautions?.map((c) => (
      <WarningBanner key={c} level="amber">
        {c}
      </WarningBanner>
    ))}
    {rule.drugs.map((d) => (
      <DrugBlock key={d.id} drug={d} crcl={crcl} />
    ))}
    {rule.why && <p className="text-xs text-slate-400">Why: {rule.why}</p>}
  </Panel>
);

/** Pre-op medications: tick what the patient takes to see the manufacturers' perioperative instructions. */
export const MedsPanel: React.FC = () => {
  const taken = useAppStore((s) => s.medsTaken);
  const toggle = useAppStore((s) => s.toggleMedTaken);
  const patient = useAppStore((s) => s.patient);
  const clearance = creatinineClearance({
    ageYears: patient.ageYears,
    tbwKg: patient.tbwKg,
    sex: patient.sex,
    creatinineUmolL: patient.creatinineUmolL,
  });
  const crcl = clearance.kind === 'ok' ? clearance.mlPerMin : null;

  return (
    <div className="mb-3 flex flex-col gap-3">
      <Panel title="Perioperative medications">
        <p className="text-xs text-slate-400">
          Tick what the patient takes. Each card names its source: the manufacturers' labels, ASRA (for spinal, epidural and deep blocks) or the AHA/ACC and ESC cardiac guidelines.
        </p>
        <div className="flex flex-col gap-1.5">
          {PERIOP_RULES.map((r, i) => (
            <React.Fragment key={r.id}>
              {r.section !== PERIOP_RULES[i - 1]?.section && (
                <h4 className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{r.section}</h4>
              )}
              <ScoreItem label={r.drugClass} checked={taken[r.id] === true} locked={false} onToggle={() => toggle(r.id)} />
            </React.Fragment>
          ))}
        </div>
      </Panel>
      {PERIOP_RULES.filter((r) => taken[r.id]).map((r) => (
        <RuleCard key={r.id} rule={r} crcl={crcl} />
      ))}
    </div>
  );
};
