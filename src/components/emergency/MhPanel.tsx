import React from 'react';
import { Phone } from 'lucide-react';
import { MH_STEPS } from '../../data/emergencies';
import { useAppStore } from '../../store/useAppStore';
import { formatMg, formatMl } from '../../lib/calc/format';
import {
  DANTROLENE_FORMULATIONS,
  dantroleneCumulativeStatus,
  dantroleneDoseMg,
  vialsFor,
} from '../../lib/calc/dantrolene';
import { ChecklistItem } from '../ui/ChecklistItem';
import { SourceBadge } from '../ui/SourceBadge';
import { UnitValue } from '../ui/UnitValue';
import { WarningBanner } from '../ui/WarningBanner';

const telHref = (contact: string): string | null => {
  const digits = contact.replace(/[^0-9+]/g, '');
  return digits.replace(/\D/g, '').length >= 5 ? `tel:${digits}` : null;
};

export const MhPanel: React.FC<{ weightKg: number }> = ({ weightKg }) => {
  const checks = useAppStore((s) => s.emergencyChecks);
  const toggle = useAppStore((s) => s.toggleEmergencyCheck);
  const given = useAppStore((s) => s.dantroleneGivenMg);
  const addDantrolene = useAppStore((s) => s.addDantrolene);
  const reset = useAppStore((s) => s.resetDantrolene);
  const contact = useAppStore((s) => s.mhContact);
  const setSettingsOpen = useAppStore((s) => s.setSettingsOpen);

  const initialMg = dantroleneDoseMg(weightKg);
  const repeatMg = dantroleneDoseMg(weightKg, 1);
  const cumulative = dantroleneCumulativeStatus(weightKg, given);
  const href = telHref(contact);

  return (
    <div className="flex flex-col gap-3">
      <WarningBanner level="red" title="Malignant hyperthermia">
        Stop volatile anesthetics and succinylcholine. Call for help. Hyperventilate with 100% oxygen at high flow. Give dantrolene.
      </WarningBanner>

      <section className="rounded-2xl border border-slate-700 bg-slate-950 p-3" aria-label="MH hotline">
        {contact.trim() ? (
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">MH hotline / local MH contact</p>
              <p className="text-xl font-black text-red-200">{contact}</p>
            </div>
            {href && (
              <a href={href} className="flex min-h-[48px] items-center gap-1 rounded-xl bg-red-500 px-4 font-black uppercase text-white">
                <Phone className="h-5 w-5" /> Call
              </a>
            )}
          </div>
        ) : (
          <button type="button" onClick={() => setSettingsOpen(true)} className="min-h-[48px] w-full rounded-xl border border-dashed border-slate-600 text-sm font-semibold text-slate-300">
            No MH hotline configured. Tap to set one in Settings.
          </button>
        )}
      </section>

      <section className="rounded-2xl border border-red-500/60 bg-slate-950 p-3" aria-label="Dantrolene dosing">
        <p className="text-xs font-bold uppercase tracking-wider text-red-300">Dantrolene · actual body weight {weightKg.toFixed(1)} kg</p>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <UnitValue label="Initial dose 2.5 mg/kg" value={formatMg(initialMg)} unit="mg IV" size="xl" tone="red" />
          <UnitValue label="Repeat (label min. 1 mg/kg)" value={formatMg(repeatMg)} unit="mg IV" size="lg" align="end" />
        </div>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {DANTROLENE_FORMULATIONS.map((f) => {
            const initial = vialsFor(initialMg, f);
            const isRyanodex = f.id === 'ryanodex';
            return (
              <div key={f.id} className={`rounded-xl border p-2 ${isRyanodex ? 'border-cyan-500/40 bg-cyan-950/20' : 'border-amber-500/40 bg-amber-950/20'}`}>
                <p className="text-sm font-black text-slate-100">{isRyanodex ? 'Ryanodex' : 'Dantrium / Revonto'}</p>
                <p className="text-xs text-slate-400">{f.mgPerVial} mg vial · {f.diluentMlPerVial} mL sterile water without bacteriostatic agent per vial</p>
                <p className="mt-1 font-mono text-2xl font-black tabular-nums text-slate-100">
                  {initial.vials} <span className="text-sm font-semibold text-slate-400">vial{initial.vials === 1 ? '' : 's'} · {formatMl(initial.diluentMl)} mL water</span>
                </p>
                <p className="mt-1 text-xs text-slate-300">
                  {isRyanodex
                    ? 'Reconstitute each vial with 5 mL sterile water (50 mg/mL). Give by IV push. Use within 6 hours of reconstitution.'
                    : 'Reconstitute each vial with 60 mL sterile water. Do not use dextrose or saline as diluent. Use within 6 hours. Assign several people to reconstitute.'}
                </p>
              </div>
            );
          })}
        </div>
        <div className="mt-2">
          <SourceBadge sourceIds={['mhaus', 'label-ryanodex', 'label-revonto']} />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-700 bg-slate-900 p-3" aria-label="Cumulative dantrolene tracker">
        <div className="grid grid-cols-2 gap-3">
          <UnitValue label="Dantrolene given (logged)" value={formatMg(given)} unit="mg" size="xl" tone={cumulative.status === 'ok' ? 'neutral' : 'red'} />
          <UnitValue label="Cumulative" value={cumulative.givenMgPerKg.toFixed(1)} unit="mg/kg of 10" size="lg" tone={cumulative.status === 'ok' ? 'amber' : 'red'} align="end" />
        </div>
        {cumulative.status !== 'ok' && (
          <div className="mt-2">
            <WarningBanner level="red" title={cumulative.status === 'exceeded' ? 'Past the labelled cumulative maximum' : 'Labelled cumulative maximum reached'}>
              Both product labels cite 10 mg/kg as the maximum cumulative dose. Call your MH hotline / MH expert before giving more.
            </WarningBanner>
          </div>
        )}
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <button type="button" onClick={() => addDantrolene(initialMg)} className="min-h-[48px] rounded-xl bg-red-500 px-2 text-sm font-black text-white">
            + Initial {formatMg(initialMg)} mg
          </button>
          <button type="button" onClick={() => addDantrolene(repeatMg)} className="min-h-[48px] rounded-xl border border-slate-600 bg-slate-800 px-2 text-sm font-bold text-slate-100">
            + 1 mg/kg
          </button>
          <button type="button" onClick={() => addDantrolene(-repeatMg)} className="min-h-[48px] rounded-xl border border-slate-600 bg-slate-800 px-2 text-sm font-bold text-slate-100">
            - 1 mg/kg
          </button>
          <button type="button" onClick={reset} className="min-h-[48px] rounded-xl border border-slate-600 bg-slate-800 px-2 text-sm font-bold text-slate-300">
            Reset dantrolene total
          </button>
        </div>
        <p className="mt-1 text-xs text-slate-400">Repeat or continue dosing according to your MHAUS / EMHG workflow. Log each dose to track the cumulative total.</p>
      </section>

      <section className="flex flex-col gap-1.5" aria-label="MH steps">
        {MH_STEPS.map((s) => (
          <ChecklistItem key={s.id} large checked={!!checks[s.id]} onToggle={() => toggle(s.id)} label={s.text} note={s.note} critical={s.critical} />
        ))}
        <SourceBadge sourceIds={['mhaus', 'emhg-2024']} />
      </section>
    </div>
  );
};
