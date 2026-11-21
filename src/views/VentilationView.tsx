import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { VENTILATION_SCENARIOS, VENT_ADVANCED_REFERENCE, VENT_ALARMS, VENT_MODES, VENT_TROUBLESHOOTING, type ReferenceItem } from '../data/ventilation';
import { useAppStore } from '../store/useAppStore';
import { calculateDevineIbw, isDevineBaselineMet, MAX_HEIGHT_CM, MIN_HEIGHT_CM } from '../lib/calc/biometrics';
import {
  ardsPlateauAdvice,
  calculateDrivingPressure,
  calculateMinuteVentilationLMin,
  calculateTidalVolumeMl,
  expiratoryTimeSeconds,
  inspiratoryTimeSeconds,
  plateauSeverity,
  PLATEAU_LIMIT_CMH2O,
  tidalVolumeSeverity,
  type Severity,
} from '../lib/calc/ventilation';
import { NumericStepper } from '../components/ui/NumericStepper';
import { NoSourceValue } from '../components/ui/NoSourceValue';
import { SourceBadge } from '../components/ui/SourceBadge';
import { UnitValue, type ValueTone } from '../components/ui/UnitValue';
import { WarningBanner } from '../components/ui/WarningBanner';
import { Panel } from '../components/hud/Panel';
import { StepFlow } from '../components/hud/StepFlow';
import { ventSteps } from '../lib/ventFlow';

const TONE: Record<Severity, ValueTone> = { ok: 'cyan', amber: 'amber', red: 'red' };
const IE_OPTIONS: { label: string; i: number; e: number }[] = [
  { label: '1:1', i: 1, e: 1 },
  { label: '1:1.5', i: 1, e: 1.5 },
  { label: '1:2', i: 1, e: 2 },
  { label: '1:3', i: 1, e: 3 },
  { label: '1:4', i: 1, e: 4 },
];

const Accordion: React.FC<{ title: string; items: ReferenceItem[] }> = ({ title, items }) => {
  const [open, setOpen] = useState(false);
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex min-h-[48px] w-full items-center justify-between px-3 text-sm font-bold text-slate-200">
        {title}
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {open && (
        <div className="flex flex-col gap-2 px-3 pb-3">
          <WarningBanner level="amber">General prompts written for this app, not taken from a named guideline. Clinician review is required before use.</WarningBanner>
          {items.map((it) => (
            <div key={it.title}>
              <p className="text-sm font-semibold text-slate-100">{it.title}</p>
              <ul className="list-disc pl-5 text-xs text-slate-300">
                {it.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          ))}
          <SourceBadge sourceIds={['app-generic']} />
        </div>
      )}
    </section>
  );
};

const ReferenceGroup: React.FC = () => {
  const [open, setOpen] = useState(false);
  return (
    <section className="rounded-2xl border border-clinical-border bg-clinical-card">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex min-h-[48px] w-full items-center justify-between px-3 text-sm font-bold text-slate-200">
        Reference
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {open && (
        <div className="flex flex-col gap-2 px-3 pb-3">
          <Accordion title="Mode quick reference (VC, PC, PSV, SIMV)" items={VENT_MODES} />
          <Accordion title="Advanced ventilation and mechanics reference (secondary sources)" items={VENT_ADVANCED_REFERENCE} />
          <Accordion title="Alarm guidance" items={VENT_ALARMS} />
          <Accordion title="Troubleshooting prompts" items={VENT_TROUBLESHOOTING} />
        </div>
      )}
    </section>
  );
};

export const VentilationView: React.FC = () => {
  const patient = useAppStore((s) => s.patient);
  const vent = useAppStore((s) => s.vent);
  const setVent = useAppStore((s) => s.setVent);
  const [ie, setIe] = useState(IE_OPTIONS[2]);
  const savedScenarioId = useAppStore((s) => s.ventScenarioId);

  // Restore the last-used scenario (a saved preference) once when the tab first opens.
  useEffect(() => {
    if (savedScenarioId !== vent.scenarioId) {
      const saved = VENTILATION_SCENARIOS.find((s) => s.id === savedScenarioId);
      if (saved) setVent({ scenarioId: saved.id, mlPerKgPbw: saved.tidalVolumeMlPerKgPbw?.target ?? null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scenario = VENTILATION_SCENARIOS.find((s) => s.id === vent.scenarioId) ?? VENTILATION_SCENARIOS[0];
  const range = scenario.tidalVolumeMlPerKgPbw;
  const steps = ventSteps({
    scenario,
    ageYears: patient.ageYears,
    heightCm: patient.heightCm,
    sex: patient.sex,
    mlPerKgPbw: vent.mlPerKgPbw,
    respiratoryRate: vent.respiratoryRate,
    peepCmH2O: vent.peepCmH2O,
    plateauCmH2O: vent.plateauCmH2O,
  });

  const heightOk = patient.heightCm !== null && patient.heightCm >= MIN_HEIGHT_CM && patient.heightCm <= MAX_HEIGHT_CM;
  const ageUnknown = patient.ageYears === null;
  const pediatric = patient.ageYears !== null && patient.ageYears < 18;
  const isPediatricContext = pediatric || scenario.id === 'pediatric';
  const pbwAllowed = !ageUnknown && !isPediatricContext;
  const pbw =
    pbwAllowed && heightOk && patient.heightCm !== null && patient.sex !== null
      ? calculateDevineIbw(patient.sex, patient.heightCm)
      : null;
  const shortStature = !ageUnknown && !pediatric && patient.heightCm !== null && !isDevineBaselineMet(patient.heightCm);

  const mlPerKg = vent.mlPerKgPbw;
  const vt = pbw !== null && mlPerKg !== null ? calculateTidalVolumeMl(pbw, mlPerKg) : null;
  const mv = vt !== null && vent.respiratoryRate !== null ? calculateMinuteVentilationLMin(vt, vent.respiratoryRate) : null;
  const driving =
    vent.plateauCmH2O !== null && vent.peepCmH2O !== null ? calculateDrivingPressure(vent.plateauCmH2O, vent.peepCmH2O) : null;

  const vtSeverity: Severity = range && mlPerKg !== null ? tidalVolumeSeverity(mlPerKg, range) : 'ok';
  const limit = scenario.plateauPressureLimit ?? PLATEAU_LIMIT_CMH2O;
  const plateauSev: Severity = vent.plateauCmH2O !== null ? plateauSeverity(vent.plateauCmH2O, limit) : 'ok';
  const advice =
    scenario.id === 'ards' && vent.plateauCmH2O !== null && mlPerKg !== null ? ardsPlateauAdvice(vent.plateauCmH2O, mlPerKg, limit) : {};

  return (
    <div className="flex flex-col gap-4 pb-8">
      <StepFlow steps={steps} />
      <Panel title="Ventilation settings">
        <div className="flex flex-col gap-4">
      <div className="flex gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label="Ventilation scenario">
        {VENTILATION_SCENARIOS.map((s) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={s.id === scenario.id}
            onClick={() => setVent({ scenarioId: s.id, mlPerKgPbw: s.tidalVolumeMlPerKgPbw?.target ?? null })}
            className={`min-h-[48px] shrink-0 rounded-xl border px-3 text-xs font-bold ${s.id === scenario.id ? 'border-cyan-400 bg-cyan-500 text-black' : 'border-slate-800 bg-slate-900 text-slate-300'}`}
          >
            {s.name}
          </button>
        ))}
      </div>

      {/* Patient parameters the recommendation is built from */}
      <section className="rounded-2xl border border-violet-500/40 bg-violet-950/20 p-3" aria-label="Parameters used">
        <p className="text-[10px] font-bold uppercase tracking-wider text-violet-300">Parameters used (Devine predicted body weight)</p>
        {pbw !== null && patient.heightCm !== null ? (
          <div className="mt-1 grid grid-cols-2 gap-2">
            <UnitValue label="PBW" value={pbw.toFixed(1)} unit="kg PBW" size="lg" tone="neutral" />
            <p className="self-end text-right font-mono text-xs text-slate-300">
              Height {patient.heightCm} cm · {patient.sex === 'male' ? 'Male' : 'Female'}
              {patient.ageYears !== null ? ` · ${patient.ageYears} y` : ''}
            </p>
          </div>
        ) : ageUnknown ? (
          <WarningBanner level="amber">Enter age above before choosing adult or pediatric ventilation. Adult PBW is withheld until age is known.</WarningBanner>
        ) : isPediatricContext ? (
          <WarningBanner level="info">PBW is not used in pediatric ventilation because the Devine formula is adult-only.</WarningBanner>
        ) : (
          <WarningBanner level="info">Enter height and sex above. Tidal volume is calculated from PBW, never actual body weight.</WarningBanner>
        )}
      </section>

      {isPediatricContext && (
        <WarningBanner level="red" title="Pediatric: PBW formula not valid">
          The Devine PBW formula applies to adults. Calculated PBW tidal volume is withheld to avoid delivering adult volumes. Set pediatric tidal volume from a current pediatric protocol; this app does not provide one.
        </WarningBanner>
      )}
      {shortStature && (
        <WarningBanner level="amber" title="Height below Devine 152.4 cm (5 ft) baseline">
          PBW is fixed at the {patient.sex === 'male' ? '50 kg' : patient.sex === 'female' ? '45.5 kg' : '45.5 kg (female) or 50 kg (male)'} baseline floor. Calculated tidal volume ({vt?.toFixed(0)} mL) may overestimate lung volume for short stature.
        </WarningBanner>
      )}

      {scenario.cautions?.map((c) => (
        <WarningBanner key={c} level="info">{c}</WarningBanner>
      ))}
      {!range && <NoSourceValue topic={`${scenario.name}: tidal volume range`} />}

      {/* Tidal volume */}
      <section className="flex flex-col gap-2 rounded-2xl border border-slate-800 bg-clinical-card p-3">
        <NumericStepper
          label="Tidal volume target"
          value={mlPerKg}
          unit="mL/kg PBW"
          step={0.5}
          min={2}
          max={12}
          decimals={1}
          emptyText={range ? 'Tap to enter' : 'Enter from your protocol'}
          onChange={(v) => setVent({ mlPerKgPbw: v })}
        />
        {range && (
          <p className="font-mono text-xs text-slate-400">
            Source range {range.min}-{range.max} mL/kg PBW{range.targetIsAssumed ? ` (no single target in the source; ${range.target} used as the starting point)` : `, default ${range.target}`}
          </p>
        )}
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-950 p-2">
          <UnitValue label="Tidal volume" value={vt !== null ? vt.toFixed(0) : '--'} unit="mL" size="xl" tone={isPediatricContext ? 'red' : TONE[vtSeverity]} />
          <UnitValue label="Per PBW" value={!isPediatricContext && mlPerKg !== null ? mlPerKg.toFixed(1) : '--'} unit="mL/kg PBW" size="lg" align="end" tone={isPediatricContext ? 'red' : TONE[vtSeverity]} />
        </div>
        {scenario.id === 'ards' && mlPerKg !== null && mlPerKg > 8 && (
          <WarningBanner level="red" title="Above lung-protective range">
            Tidal volume is above 8 mL/kg PBW. ARDS lung-protective range is 4-8 mL/kg PBW.
          </WarningBanner>
        )}
        {range && mlPerKg !== null && vtSeverity !== 'ok' && !(scenario.id === 'ards' && mlPerKg > 8) && (
          <WarningBanner level={vtSeverity === 'red' ? 'red' : 'amber'} title={vtSeverity === 'red' ? 'Outside source range' : 'At the edge of the source range'}>
            {mlPerKg} mL/kg PBW against a source range of {range.min}-{range.max} mL/kg PBW.
          </WarningBanner>
        )}
        <SourceBadge sourceIds={scenario.sourceIds.length ? scenario.sourceIds : ['app-generic']} />
      </section>

      {/* Rate, minute ventilation, timing */}
      <section className="flex flex-col gap-2 rounded-2xl border border-slate-800 bg-clinical-card p-3">
        <NumericStepper label="Respiratory rate" value={vent.respiratoryRate} unit="breaths/min" step={1} min={4} max={60} emptyText="Enter rate" onChange={(v) => setVent({ respiratoryRate: v })} />
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-950 p-2">
          <UnitValue label="Minute ventilation" value={mv !== null ? mv.toFixed(1) : '--'} unit="L/min" size="xl" tone="cyan" />
          <p className="self-end text-right font-mono text-xs text-slate-400">= VT x RR / 1000</p>
        </div>
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">I:E ratio</span>
          <div className="mt-1 flex flex-wrap gap-1.5" role="radiogroup" aria-label="I:E ratio">
            {IE_OPTIONS.map((o) => (
              <button
                key={o.label}
                type="button"
                role="radio"
                aria-checked={o.label === ie.label}
                onClick={() => setIe(o)}
                className={`min-h-[48px] min-w-[56px] rounded-xl border px-3 font-mono text-sm font-bold ${o.label === ie.label ? 'border-cyan-400 bg-cyan-500/20 text-cyan-100' : 'border-slate-700 bg-slate-900 text-slate-300'}`}
              >
                {o.label}
              </button>
            ))}
          </div>
          {vent.respiratoryRate !== null && (
            <p className="mt-1 font-mono text-sm text-slate-200">
              Inspiratory time {inspiratoryTimeSeconds(vent.respiratoryRate, ie.i, ie.e).toFixed(2)} s · expiratory time {expiratoryTimeSeconds(vent.respiratoryRate, ie.i, ie.e).toFixed(2)} s
            </p>
          )}
        </div>
      </section>

      {/* Pressures */}
      <section className="flex flex-col gap-2 rounded-2xl border border-slate-800 bg-clinical-card p-3">
        <NumericStepper label="PEEP" value={vent.peepCmH2O} unit="cmH2O" step={1} min={0} max={30} emptyText="Enter PEEP" onChange={(v) => setVent({ peepCmH2O: v })} />
        <NumericStepper label="Plateau pressure" value={vent.plateauCmH2O} unit="cmH2O" step={1} min={0} max={60} emptyText="Enter plateau" onChange={(v) => setVent({ plateauCmH2O: v })} />
        <NumericStepper label="FiO2" value={vent.fio2Percent} unit="%" step={5} min={21} max={100} emptyText="Enter FiO2" onChange={(v) => setVent({ fio2Percent: v })} />
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-950 p-2">
          <UnitValue label="Plateau" value={vent.plateauCmH2O !== null ? String(vent.plateauCmH2O) : '--'} unit="cmH2O" size="lg" tone={TONE[plateauSev]} />
          <UnitValue label="Driving pressure" value={driving !== null ? String(driving) : '--'} unit="cmH2O" size="lg" align="end" />
        </div>
        {plateauSev === 'amber' && (
          <WarningBanner level="amber" title="Approaching plateau limit">Plateau pressure is within 2 cmH2O of the {limit} cmH2O limit.</WarningBanner>
        )}
        {plateauSev === 'red' && (
          <WarningBanner level="red" title={`Plateau above ${limit} cmH2O`}>Plateau pressure exceeds the safety limit.</WarningBanner>
        )}
        {advice.suggestReduceTowardMlPerKg !== undefined && (
          <WarningBanner level="red" title="Consider lowering tidal volume">
            Plateau remains above {limit} cmH2O at {mlPerKg} mL/kg PBW. Consider reducing toward {advice.suggestReduceTowardMlPerKg} mL/kg PBW.
          </WarningBanner>
        )}
      </section>

      {scenario.unsourced && scenario.unsourced.length > 0 && (
        <section className="flex flex-col gap-1.5" aria-label="Settings without a sourced default">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-300">No sourced default for {scenario.name}</h3>
          {scenario.unsourced.map((t) => (
            <NoSourceValue key={t} topic={t} compact />
          ))}
          <p className="text-xs text-slate-400">Enter these from your protocol; they are not suggested by this app.</p>
        </section>
      )}

        </div>
      </Panel>
      <ReferenceGroup />
    </div>
  );
};
