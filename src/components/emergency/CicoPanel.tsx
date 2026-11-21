import React, { useEffect } from 'react';
import { PhoneCall } from 'lucide-react';
import { CICO_PLANS } from '../../data/emergencies';
import { useAppStore } from '../../store/useAppStore';
import { playEmergencyPulseTone, unlockAudio } from '../../lib/audioAlerts';
import { ChecklistItem } from '../ui/ChecklistItem';
import { SourceBadge } from '../ui/SourceBadge';
import { Timer } from '../ui/Timer';
import { WarningBanner } from '../ui/WarningBanner';

export const CicoPanel: React.FC = () => {
  const checks = useAppStore((s) => s.emergencyChecks);
  const toggle = useAppStore((s) => s.toggleEmergencyCheck);
  const planId = useAppStore((s) => s.cicoPlan);
  const setPlan = useAppStore((s) => s.setCicoPlan);
  const timerStart = useAppStore((s) => s.timerStart);
  const timerRunning = useAppStore((s) => s.timers.cico?.running ?? false);
  const audioEnabled = useAppStore((s) => s.audioEnabled);
  const alertEvery = useAppStore((s) => s.cicoAlertEvery);
  const setAlertEvery = useAppStore((s) => s.setCicoAlertEvery);
  const helpCalled = useAppStore((s) => s.cicoHelpCalled);
  const setHelpCalled = useAppStore((s) => s.setCicoHelpCalled);

  useEffect(() => {
    if (!timerRunning && helpCalled) setHelpCalled(false);
  }, [timerRunning, helpCalled, setHelpCalled]);

  const idx = CICO_PLANS.findIndex((p) => p.id === planId);
  const plan = CICO_PLANS[idx < 0 ? 0 : idx];
  const next = CICO_PLANS[idx + 1];

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => {
          unlockAudio();
          setHelpCalled(true);
          timerStart('cico');
          if (audioEnabled) playEmergencyPulseTone();
        }}
        className={`flex min-h-[64px] w-full items-center justify-center gap-3 rounded-2xl text-xl font-black uppercase ${
          helpCalled ? 'border-2 border-emerald-400 bg-emerald-950 text-emerald-200' : 'animate-pulse bg-red-500 text-white'
        }`}
      >
        <PhoneCall className="h-7 w-7" /> {helpCalled ? 'Help called · timer running' : 'Call for help'}
      </button>

      <Timer id="cico" label="Airway event timer" alertEverySeconds={alertEvery} alertOptions={[30, 60, 120]} onAlertChange={setAlertEvery} />

      <div className="grid grid-cols-4 gap-1.5" role="tablist" aria-label="Airway plan">
        {CICO_PLANS.map((p) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={p.id === plan.id}
            onClick={() => setPlan(p.id)}
            className={`min-h-[56px] rounded-xl border text-lg font-black ${
              p.id === plan.id ? (p.id === 'D' ? 'border-red-400 bg-red-500 text-white' : 'border-amber-300 bg-amber-400 text-black') : 'border-slate-700 bg-slate-900 text-slate-300'
            }`}
          >
            Plan {p.id}
          </button>
        ))}
      </div>

      <h3 className="text-xl font-black text-slate-100">{plan.title}</h3>

      {plan.id === 'D' && (
        <WarningBanner level="red" title="CICO declared: perform invasive airway access without delay">
          Do not wait for further attempts at less invasive techniques.
        </WarningBanner>
      )}

      <section className="flex flex-col gap-1.5" aria-label={`${plan.title} steps`}>
        {plan.steps.map((s) => (
          <ChecklistItem key={s.id} large checked={!!checks[s.id]} onToggle={() => toggle(s.id)} label={s.text} critical={s.critical} />
        ))}
      </section>

      {plan.failureCriteria.length > 0 && (
        <section className="rounded-2xl border border-amber-500/50 bg-amber-500/10 p-3">
          <p className="text-xs font-black uppercase tracking-wider text-amber-300">This plan has failed if</p>
          <ul className="mt-1 list-disc pl-5 text-base text-amber-100">
            {plan.failureCriteria.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
          {next && (
            <button type="button" onClick={() => setPlan(next.id)} className="mt-3 min-h-[56px] w-full rounded-xl bg-amber-400 text-lg font-black uppercase text-black">
              Plan {plan.id} failed → go to Plan {next.id}
            </button>
          )}
        </section>
      )}

      <WarningBanner level="info" title="After any intubation or rescue device">
        Confirm with capnography (waveform end-tidal CO2). Limit repeated attempts and escalate promptly when ventilation or oxygenation fails.
      </WarningBanner>
      <SourceBadge sourceIds={['asa-airway-2022']} />
    </div>
  );
};
