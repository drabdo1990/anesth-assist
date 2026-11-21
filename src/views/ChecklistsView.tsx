import React, { useMemo, useState } from 'react';
import { Check, ClipboardCopy, RotateCcw } from 'lucide-react';
import { CHECKLISTS, CHECKLIST_GROUPS, HANDOFF_OPTIONS } from '../data/checklists';
import type { ChecklistGroup, ChecklistRecord } from '../data/types';
import { CICO_PLANS, LAST_STEPS, MH_STEPS } from '../data/emergencies';
import { MEDICATIONS } from '../data/medications';
import { VENT_MODES } from '../data/ventilation';
import { useAppStore } from '../store/useAppStore';
import { EMPTY_HANDOFF, buildHandoffSummary, type HandoffInput } from '../lib/handoff';
import { copyText } from '../lib/copyText';
import { ChecklistItem } from '../components/ui/ChecklistItem';
import { SourceBadge } from '../components/ui/SourceBadge';
import { WarningBanner } from '../components/ui/WarningBanner';

type GroupTab = ChecklistGroup | 'handoff' | 'overview';

// Counts of what the app contains, read from the data files. Nothing about usage is recorded or sent anywhere.
const Overview: React.FC = () => {
  const checks = useAppStore((s) => s.checks);
  const sosSteps = LAST_STEPS.length + MH_STEPS.length + CICO_PLANS.reduce((n, p) => n + p.steps.length, 0);
  const tiles = [
    { label: 'Checklists', value: CHECKLISTS.length, sub: `${CHECKLISTS.reduce((n, c) => n + c.items.length, 0)} items` },
    { label: 'SOS checklists', value: 3, sub: `${sosSteps} steps (LAST, MH, CICO)` },
    { label: 'Forms', value: 1, sub: 'Handoff summary' },
  ];
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-2">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-2xl border border-clinical-border-light bg-clinical-card p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{t.label}</p>
            <p className="font-mono text-3xl font-black text-cyan-200">{t.value}</p>
            <p className="text-xs text-slate-400">{t.sub}</p>
          </div>
        ))}
      </div>
      <table className="w-full text-left text-sm text-slate-200">
        <caption className="pb-1 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Checklists by group</caption>
        <thead className="text-xs text-slate-400">
          <tr>
            <th scope="col" className="py-1">Group</th>
            <th scope="col" className="py-1 text-right">Lists</th>
            <th scope="col" className="py-1 text-right">Items</th>
            <th scope="col" className="py-1 text-right">Ticked now</th>
          </tr>
        </thead>
        <tbody className="font-mono">
          {CHECKLIST_GROUPS.map((g) => {
            const items = CHECKLISTS.filter((c) => c.group === g).flatMap((c) => c.items);
            return (
              <tr key={g} className="border-t border-clinical-border">
                <th scope="row" className="py-2 font-sans font-bold">{g}</th>
                <td className="py-2 text-right">{CHECKLISTS.filter((c) => c.group === g).length}</td>
                <td className="py-2 text-right">{items.length}</td>
                <td className="py-2 text-right">{items.filter((i) => checks[i.id]).length}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="text-xs text-slate-400">Totals are counted from the app&apos;s built-in content. No usage data is collected.</p>
    </div>
  );
};

type Extra = 'handoff' | 'overview';
const EXTRA_LABEL: Record<Extra, string> = { handoff: 'Handoff summary', overview: 'Overview' };

interface ChecklistsViewProps {
  /** The lists this phase shows (see `listsFor` in lib/phases.ts). */
  phaseLists: ChecklistRecord[];
  extras?: Extra[];
}

const chipClass = (on: boolean): string =>
  `min-h-[48px] shrink-0 rounded-xl border px-3 text-xs font-bold ${on ? 'border-cyan-400 bg-cyan-500 text-black' : 'border-clinical-border bg-clinical-card text-slate-300'}`;

const baseName = (name: string): string => name.split(' (')[0];
const namesFor = (category: string): string[] => [...new Set(MEDICATIONS.filter((m) => m.category === category).map((m) => baseName(m.name)))];

const Chips: React.FC<{ label: string; options: readonly string[]; value: string[]; onChange: (v: string[]) => void; single?: boolean }> = ({ label, options, value, onChange, single }) => (
  <fieldset className="flex flex-col gap-1">
    <legend className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</legend>
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const on = value.includes(o);
        return (
          <button
            key={o}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(single ? (on ? [] : [o]) : on ? value.filter((v) => v !== o) : [...value, o])}
            className={`min-h-[48px] rounded-xl border px-3 text-xs font-bold ${on ? 'border-cyan-400 bg-cyan-500/20 text-cyan-100' : 'border-clinical-border-light bg-clinical-card text-slate-300'}`}
          >
            {o}
          </button>
        );
      })}
    </div>
  </fieldset>
);

const NumberField: React.FC<{ label: string; unit: string; value: string; onChange: (v: string) => void }> = ({ label, unit, value, onChange }) => (
  <label className="flex flex-col gap-1">
    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
      {label} ({unit})
    </span>
    <input
      inputMode="decimal"
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, '').slice(0, 6))}
      className="min-h-[48px] rounded-xl border border-clinical-border-light bg-clinical-bg px-3 font-mono text-lg text-cyan-200 focus:border-cyan-500 focus:outline-none"
    />
  </label>
);

const HandoffForm: React.FC = () => {
  const [form, setForm] = useState<HandoffInput>(EMPTY_HANDOFF);
  const [copied, setCopied] = useState<'idle' | 'ok' | 'fail'>('idle');
  const set = <K extends keyof HandoffInput>(key: K, value: HandoffInput[K]) => {
    setCopied('idle');
    setForm((f) => ({ ...f, [key]: value }));
  };
  const { text, omitted } = useMemo(() => buildHandoffSummary(form), [form]);

  return (
    <div className="flex flex-col gap-3">
      <WarningBanner level="info" title="Anonymous handoff">
        Built only from fixed choices and short numeric fields. There are no free-text fields, so names, dates and IDs cannot be added. Nothing is saved: the form clears when you close or refresh the app.
      </WarningBanner>
      <Chips label="Procedure type" options={HANDOFF_OPTIONS.procedureCategories} value={form.procedureCategory ? [form.procedureCategory] : []} onChange={(v) => set('procedureCategory', v[0] ?? '')} single />
      <Chips label="ASA physical status" options={HANDOFF_OPTIONS.asaStatus} value={form.asaStatus ? [form.asaStatus] : []} onChange={(v) => set('asaStatus', v[0] ?? '')} single />
      <Chips label="Airway" options={HANDOFF_OPTIONS.airway} value={form.airway ? [form.airway] : []} onChange={(v) => set('airway', v[0] ?? '')} single />
      <Chips label="Induction agents" options={namesFor('induction')} value={form.inductionAgents} onChange={(v) => set('inductionAgents', v)} />
      <Chips label="Maintenance technique" options={HANDOFF_OPTIONS.maintenance} value={form.maintenance ? [form.maintenance] : []} onChange={(v) => set('maintenance', v[0] ?? '')} single />
      <Chips label="Opioids" options={namesFor('opioids')} value={form.opioids} onChange={(v) => set('opioids', v)} />
      <Chips label="Neuromuscular blockade" options={namesFor('nmba')} value={form.neuromuscularBlockade} onChange={(v) => set('neuromuscularBlockade', v)} />
      <div className="grid grid-cols-2 gap-2">
        <NumberField label="Fluids" unit="mL" value={form.fluidsMl} onChange={(v) => set('fluidsMl', v)} />
        <NumberField label="Blood loss" unit="mL" value={form.bloodLossMl} onChange={(v) => set('bloodLossMl', v)} />
      </div>
      <Chips label="Ventilation mode" options={VENT_MODES.map((m) => m.title)} value={form.ventMode ? [form.ventMode] : []} onChange={(v) => set('ventMode', v[0] ?? '')} single />
      <div className="grid grid-cols-2 gap-2">
        <NumberField label="Tidal volume" unit="mL" value={form.ventTidalVolumeMl} onChange={(v) => set('ventTidalVolumeMl', v)} />
        <NumberField label="Rate" unit="breaths/min" value={form.ventRespiratoryRate} onChange={(v) => set('ventRespiratoryRate', v)} />
        <NumberField label="PEEP" unit="cmH2O" value={form.ventPeepCmH2O} onChange={(v) => set('ventPeepCmH2O', v)} />
        <NumberField label="FiO2" unit="%" value={form.ventFio2Percent} onChange={(v) => set('ventFio2Percent', v)} />
      </div>

      {omitted.length > 0 && (
        <WarningBanner level="amber" title="Left out of the summary">
          {omitted.join(', ')}
        </WarningBanner>
      )}

      <pre className="whitespace-pre-wrap rounded-2xl border border-clinical-border-light bg-clinical-bg p-3 font-mono text-xs text-slate-200" aria-label="Summary preview">{text}</pre>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={async () => setCopied((await copyText(text)) ? 'ok' : 'fail')}
          className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-cyan-500 font-black uppercase text-black"
        >
          {copied === 'ok' ? <Check className="h-5 w-5" /> : <ClipboardCopy className="h-5 w-5" />}
          {copied === 'ok' ? 'Copied' : 'Copy summary to clipboard'}
        </button>
        <button
          type="button"
          onClick={() => {
            setForm(EMPTY_HANDOFF);
            setCopied('idle');
          }}
          className="min-h-[48px] rounded-xl border border-clinical-border-light bg-clinical-card font-bold uppercase text-slate-300"
        >
          Clear form
        </button>
      </div>
      {copied === 'fail' && <WarningBanner level="red">Copy was blocked by the browser. Select the preview text and copy it manually.</WarningBanner>}
    </div>
  );
};

export const ChecklistsView: React.FC<ChecklistsViewProps> = ({ phaseLists, extras = [] }) => {
  // Groups with no lists in this phase are hidden.
  const tabs: { id: GroupTab; label: string }[] = [
    ...CHECKLIST_GROUPS.filter((g) => phaseLists.some((c) => c.group === g)).map((g) => ({ id: g as GroupTab, label: g })),
    ...extras.map((e) => ({ id: e as GroupTab, label: EXTRA_LABEL[e] })),
  ];
  const [group, setGroup] = useState<GroupTab>(tabs[0].id);
  const [sub, setSub] = useState<string>(phaseLists[0].id);
  const checks = useAppStore((s) => s.checks);
  const toggle = useAppStore((s) => s.toggleCheck);
  const resetChecks = useAppStore((s) => s.resetChecks);

  const lists = phaseLists.filter((c) => c.group === group);
  const list = lists.find((c) => c.id === sub) ?? lists[0];
  const done = list ? list.items.filter((i) => checks[i.id]).length : 0;

  return (
    <div className="flex flex-col gap-3 pb-8">
      {tabs.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label="Checklist groups">
          {tabs.map((t) => (
            <button key={t.id} type="button" role="tab" aria-selected={group === t.id} onClick={() => setGroup(t.id)} className={chipClass(group === t.id)}>
              {t.label}
            </button>
          ))}
        </div>
      )}
      {lists.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label="Checklists">
          {lists.map((c) => (
            <button key={c.id} type="button" role="tab" aria-selected={list?.id === c.id} onClick={() => setSub(c.id)} className={chipClass(list?.id === c.id)}>
              {c.title}
            </button>
          ))}
        </div>
      )}

      {group === 'overview' ? (
        <Overview />
      ) : group === 'handoff' ? (
        <HandoffForm />
      ) : (
        list && (
          <>
            <div className="flex items-center justify-between gap-2">
              <p className="font-mono text-sm font-bold text-emerald-300">
                {done} / {list.items.length} complete
              </p>
              <button
                type="button"
                onClick={() => resetChecks(list.items.map((i) => i.id))}
                className="flex min-h-[48px] items-center gap-1 rounded-xl border border-clinical-border-light bg-clinical-card px-3 text-xs font-bold text-slate-300"
              >
                <RotateCcw className="h-4 w-4" /> Reset list
              </button>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-clinical-border" aria-hidden>
              <div className="h-full bg-emerald-500 transition-all" style={{ width: `${(done / list.items.length) * 100}%` }} />
            </div>
            {list.note && <WarningBanner level="info">{list.note}</WarningBanner>}
            <div className="flex flex-col gap-1.5">
              {list.items.map((item) => (
                <ChecklistItem key={item.id} checked={!!checks[item.id]} onToggle={() => toggle(item.id)} label={item.text} />
              ))}
            </div>
            <p className="text-xs text-slate-400">Tick marks are saved on this device and contain no patient data. &quot;New case&quot; clears them.</p>
            <SourceBadge sourceIds={[...new Set(list.items.flatMap((item) => item.sourceIds))]} />
          </>
        )
      )}
    </div>
  );
};
