import React from 'react';
import { LAST_STEPS } from '../../data/emergencies';
import { useAppStore } from '../../store/useAppStore';
import { formatMl } from '../../lib/calc/format';
import { lipidCumulativeStatus, lipidPlan } from '../../lib/calc/lipid';
import { ChecklistItem } from '../ui/ChecklistItem';
import { SourceBadge } from '../ui/SourceBadge';
import { UnitValue } from '../ui/UnitValue';
import { WarningBanner } from '../ui/WarningBanner';

export const LastPanel: React.FC<{ weightKg: number }> = ({ weightKg }) => {
  const checks = useAppStore((s) => s.emergencyChecks);
  const toggle = useAppStore((s) => s.toggleEmergencyCheck);
  const given = useAppStore((s) => s.lipidGivenMl);
  const addLipid = useAppStore((s) => s.addLipid);
  const reset = useAppStore((s) => s.resetLipid);

  const plan = lipidPlan(weightKg);
  const cumulative = lipidCumulativeStatus(weightKg, given);
  const over70 = plan.stratum === 'at-or-over-70';

  return (
    <div className="flex flex-col gap-3">
      <WarningBanner level="red" title="Local anesthetic systemic toxicity">
        Stop injecting. Call for help. Give 20% lipid emulsion. Do not rely on local anesthetic-related interventions alone.
      </WarningBanner>

      <section className="rounded-2xl border border-red-500/60 bg-slate-950 p-3" aria-label="Lipid emulsion dosing">
        <p className="text-xs font-bold uppercase tracking-wider text-red-300">
          20% lipid emulsion · actual weight {weightKg.toFixed(1)} kg · {over70 ? '70 kg or more' : 'under 70 kg'}
        </p>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <UnitValue label={`Bolus over ${plan.bolusMinutes[0]}-${plan.bolusMinutes[1]} min`} value={formatMl(plan.bolusMl)} unit="mL" size="xl" tone="red" />
          {over70 ? (
            <UnitValue
              label={`Then over ${plan.infusionMinutes?.[0]}-${plan.infusionMinutes?.[1]} min`}
              value={String(plan.infusionTotalMl)}
              unit="mL"
              size="xl"
              tone="red"
              align="end"
            />
          ) : (
            <UnitValue label="Then infusion" value={formatMl(plan.infusionMlPerMin ?? 0)} unit="mL/min" size="xl" tone="red" align="end" />
          )}
        </div>
        <p className="mt-2 font-mono text-sm text-slate-300">
          {over70
            ? `Infusion pump equivalent: ${Math.round(((plan.infusionTotalMl ?? 0) * 60) / (plan.infusionMinutes?.[1] ?? 20))}-${Math.round(((plan.infusionTotalMl ?? 0) * 60) / (plan.infusionMinutes?.[0] ?? 15))} mL/hr`
            : `Infusion 0.25 mL/kg/min = ${formatMl(plan.infusionMlPerHr ?? 0)} mL/hr`}
        </p>
        <p className="mt-1 text-sm text-slate-200">
          If instability continues: repeat the bolus and double the infusion rate
          {!over70 && plan.doubledInfusionMlPerMin !== undefined ? ` (${formatMl(plan.doubledInfusionMlPerMin)} mL/min)` : ''}.
        </p>
        <p className="mt-1 text-xs text-slate-400">Continue the infusion for at least 10 minutes after hemodynamic stability.</p>
        <div className="mt-2">
          <SourceBadge sourceIds={['asra-last-2020']} />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-700 bg-slate-900 p-3" aria-label="Cumulative lipid tracker">
        <div className="grid grid-cols-2 gap-3">
          <UnitValue label="Lipid given (logged)" value={formatMl(given)} unit="mL" size="xl" tone={cumulative.status === 'ok' ? 'neutral' : 'red'} />
          <UnitValue label="Ceiling 12 mL/kg" value={formatMl(cumulative.maxMl)} unit="mL" size="lg" tone="amber" align="end" />
        </div>
        <p className="mt-1 font-mono text-sm text-slate-300">Remaining to ceiling: {formatMl(cumulative.remainingMl)} mL</p>
        {cumulative.status !== 'ok' && (
          <div className="mt-2">
            <WarningBanner level="red" title={cumulative.status === 'exceeds' ? 'Cumulative ceiling exceeded' : 'Cumulative ceiling reached'}>
              Maximum cumulative lipid emulsion is 12 mL/kg ({formatMl(cumulative.maxMl)} mL for this weight). Do not give more.
            </WarningBanner>
          </div>
        )}
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <button type="button" onClick={() => addLipid(plan.bolusMl)} className="min-h-[48px] rounded-xl bg-red-500 px-2 text-sm font-black text-white">
            + Bolus {formatMl(plan.bolusMl)}
          </button>
          <button type="button" onClick={() => addLipid(50)} className="min-h-[48px] rounded-xl border border-slate-600 bg-slate-800 px-2 text-sm font-bold text-slate-100">
            + 50 mL
          </button>
          <button type="button" onClick={() => addLipid(-50)} className="min-h-[48px] rounded-xl border border-slate-600 bg-slate-800 px-2 text-sm font-bold text-slate-100">
            - 50 mL
          </button>
          <button type="button" onClick={reset} className="min-h-[48px] rounded-xl border border-slate-600 bg-slate-800 px-2 text-sm font-bold text-slate-300">
            Reset lipid total
          </button>
        </div>
        <p className="mt-1 text-xs text-slate-400">Log each bolus and infusion volume so the 12 mL/kg ceiling is tracked.</p>
      </section>

      <section className="flex flex-col gap-1.5" aria-label="LAST steps">
        {LAST_STEPS.map((s) => (
          <ChecklistItem key={s.id} large checked={!!checks[s.id]} onToggle={() => toggle(s.id)} label={s.text} note={s.note} critical={s.critical} />
        ))}
        <SourceBadge sourceIds={['asra-last-2020']} />
      </section>
    </div>
  );
};
