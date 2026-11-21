import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, RotateCcw, X } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useBiometricResult } from '../store/useBiometrics';
import { isDevineBaselineMet, MAX_HEIGHT_CM, MAX_WEIGHT_KG, MIN_HEIGHT_CM } from '../lib/calc/biometrics';
import { formatKg } from '../lib/calc/format';
import { KeypadModal } from './KeypadModal';
import { NumericStepper } from './ui/NumericStepper';
import { SegmentedControl } from './ui/SegmentedControl';
import { WarningBanner } from './ui/WarningBanner';

const bmiLabel = (bmi: number): { text: string; cls: string } => {
  if (bmi < 18.5) return { text: 'Underweight', cls: 'text-clinical-cyan' };
  if (bmi < 25) return { text: 'Normal', cls: 'text-clinical-emerald' };
  if (bmi < 30) return { text: 'Overweight', cls: 'text-clinical-amber' };
  return { text: 'Obese', cls: 'text-clinical-red' };
};

const Pill: React.FC<{ label: string; value: string; unit?: string; tone: string; title?: string }> = ({ label, value, unit, tone, title }) => (
  <div title={title} className="flex shrink-0 items-baseline gap-1.5 rounded-lg border border-clinical-border bg-clinical-card px-2.5 py-1.5">
    <span className="text-[10px] font-bold uppercase text-slate-400">{label}</span>
    <span className={`font-mono text-sm font-bold tabular-nums ${tone}`}>{value}</span>
    {unit && <span className="text-[10px] text-slate-500">{unit}</span>}
  </div>
);

export const BiometricHeader: React.FC = () => {
  const patient = useAppStore((s) => s.patient);
  const setPatient = useAppStore((s) => s.setPatient);
  const newCase = useAppStore((s) => s.newCase);
  const result = useBiometricResult();
  const [open, setOpen] = useState(true);
  const [ageKeypad, setAgeKeypad] = useState(false);

  // Open while weight/height are missing; collapse once both are set so results stay on screen.
  const complete = patient.tbwKg !== null && patient.heightCm !== null && patient.sex !== null;
  const wasComplete = useRef(false);
  useEffect(() => {
    if (complete && !wasComplete.current) setOpen(false);
    if (!complete) setOpen(true);
    wasComplete.current = complete;
  }, [complete]);

  const b = result.ok ? result.value : null;
  const bmi = b ? bmiLabel(b.bmi) : null;
  const pediatric = patient.ageYears !== null && patient.ageYears < 18;
  const actionButton = 'flex min-h-[48px] shrink-0 items-center gap-1 rounded-lg border border-clinical-border-light bg-clinical-card px-3 text-xs font-bold text-slate-300';

  return (
    <header className="sticky top-0 z-30 w-full border-b border-clinical-border bg-clinical-bg/95 px-3 py-1 shadow-lg backdrop-blur-md">
      <div className="mx-auto max-w-4xl">
        <button type="button" onClick={() => setOpen(!open)} aria-expanded={open}
          className="flex min-h-[48px] w-full items-center justify-between gap-2 text-left">
          <span className="font-mono text-sm font-bold tabular-nums text-clinical-cyan">
            {patient.tbwKg !== null ? `${formatKg(patient.tbwKg)} kg` : '-- kg'} ·{' '}
            {patient.heightCm !== null ? `${patient.heightCm} cm` : '-- cm'} · {patient.sex === null ? '--' : patient.sex === 'male' ? 'M' : 'F'}
            {patient.ageYears !== null ? ` · ${patient.ageYears} y` : ''}
          </span>
          <span className="flex items-center gap-1 text-xs font-semibold text-slate-400">
            Patient parameters {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </span>
        </button>

        {open && (
          <div className="grid grid-cols-1 gap-2 rounded-xl border border-clinical-border bg-clinical-card p-2 sm:grid-cols-12">
            <div className="sm:col-span-5">
              <NumericStepper label="Actual weight (TBW)" value={patient.tbwKg} unit="kg" step={1} coarseStep={5} decimals={1}
                min={1} max={MAX_WEIGHT_KG} onChange={(v) => setPatient({ tbwKg: v })} keypadTitle="Enter actual weight (TBW)" />
            </div>
            <div className="sm:col-span-4">
              <NumericStepper label="Height" value={patient.heightCm} unit="cm" step={1} min={MIN_HEIGHT_CM} max={MAX_HEIGHT_CM}
                onChange={(v) => setPatient({ heightCm: Math.round(v) })} keypadTitle="Enter height" />
            </div>
            <div className="sm:col-span-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Biological sex</span>
              <div className="mt-1">
                <SegmentedControl ariaLabel="Biological sex" value={patient.sex} onChange={(sex) => setPatient({ sex })}
                  options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }]} />
              </div>
            </div>
          </div>
        )}

        <div className="mt-1 flex items-center gap-1.5 overflow-x-auto" role="group" aria-label="Calculated body weights">
          {b && bmi ? (
            <>
              <Pill label="BMI" value={b.bmi.toFixed(1)} tone={bmi.cls} unit={bmi.text} />
              <Pill label="PBW" value={formatKg(b.pbw)} unit="kg" tone="text-clinical-purple" title="Predicted body weight (Devine, sex and height only). Used for tidal volume." />
              <Pill label="IBW" value={formatKg(b.ibw)} unit="kg" tone="text-clinical-amber" title="Devine; uses TBW when TBW is lower. Used for IBW-based dosing." />
              <Pill label="LBW" value={formatKg(b.lbw)} unit="kg" tone="text-clinical-cyan" title="Janmahasatian lean body weight, capped at TBW." />
              <Pill label="ABW40" value={formatKg(b.abw40)} unit="kg" tone="text-clinical-emerald" title="IBW + 0.4 x (TBW - IBW)" />
            </>
          ) : (
            <span className="text-xs text-slate-400">Body-weight scalars appear here once weight, height and sex are entered.</span>
          )}
          <button
            type="button"
            onClick={() => setAgeKeypad(true)}
            title="Required before dosing or ventilation"
            className={actionButton}
          >
            Age {patient.ageYears !== null ? `${patient.ageYears} y` : '(required)'}
          </button>
          {patient.ageYears !== null && (
            <button type="button" aria-label="Clear age" onClick={() => setPatient({ ageYears: null })} className={`${actionButton} min-w-[48px] justify-center px-0`}>
              <X className="h-4 w-4" />
            </button>
          )}
          <button type="button" onClick={newCase} className={actionButton}
            title="Clear patient parameters, dose selections and entries for a new case">
            <RotateCcw className="h-4 w-4" /> New case
          </button>
        </div>

        {!result.ok && patient.tbwKg !== null && patient.heightCm !== null && patient.sex === null && (
          <div className="mt-1"><WarningBanner level="amber" title="Select biological sex">
            Predicted, ideal and lean body weights depend on sex and are never assumed. Calculations stay blank until you choose.
          </WarningBanner></div>
        )}
        {!result.ok && patient.sex !== null && (patient.tbwKg !== null || patient.heightCm !== null) && (
          <div className="mt-1"><WarningBanner level="red" title="Invalid input">
            {result.error} Calculations are blank until this is fixed.
          </WarningBanner></div>
        )}
        {pediatric && (
          <div className="mt-1"><WarningBanner level="amber" title="Pediatric patient">
            PBW and IBW use the adult Devine formula, which is not valid for children. Check the source before using IBW- or PBW-based values.
          </WarningBanner></div>
        )}
        {!pediatric && patient.heightCm !== null && !isDevineBaselineMet(patient.heightCm) && (
          <div className="mt-1"><WarningBanner level="amber" title="Height below Devine 152.4 cm (5 ft) baseline">
            Devine formula hit its floor ({patient.sex === 'male' ? '50 kg' : patient.sex === 'female' ? '45.5 kg' : '45.5 kg female, 50 kg male'}) and does not scale below 152.4 cm. Verify tidal volume and IBW against your protocol.
          </WarningBanner></div>
        )}
      </div>

      <KeypadModal title="Enter age (years)" initialValue={patient.ageYears ?? 0} unit="y" min={0} max={120} allowDecimal
        isOpen={ageKeypad} onClose={() => setAgeKeypad(false)} onConfirm={(v) => setPatient({ ageYears: Math.round(v * 100) / 100 })} />
    </header>
  );
};
