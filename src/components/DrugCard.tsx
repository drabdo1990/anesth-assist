import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, FlaskConical, ShieldCheck } from 'lucide-react';
import type { Medication, MedicationDose, WeightScalar } from '../data/types';
import { resolveWithOverrides } from '../data/resolve';
import { useAppStore } from '../store/useAppStore';
import type { Biometrics } from '../lib/calc/biometrics';
import { formatMcg, formatMg, formatMl, maxDecimalPlaces } from '../lib/calc/format';
import {
  calculateDose,
  computeMedicationDose,
  cumulativeDoseStatus,
  doseAppliesToWeight,
  isWeightBased,
  resolveConcentrationIndex,
  scalarWeightKg,
  type DoseComputation,
} from '../lib/calc/medication';
import { BigValue } from './hud/BigValue';
import { Panel } from './hud/Panel';
import { ConcentrationSelector } from './ui/ConcentrationSelector';
import { NumericStepper } from './ui/NumericStepper';
import { SegmentedControl } from './ui/SegmentedControl';
import { UnitValue } from './ui/UnitValue';
import { WarningBanner } from './ui/WarningBanner';
import { WeightScalarBadge } from './ui/WeightScalarBadge';

const NICE_STEPS = [0.005, 0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, 25, 50, 100];

const stepFor = (min: number, max: number): number => {
  const ideal = (max - min) / 20;
  return NICE_STEPS.find((s) => s >= ideal) ?? 100;
};

/** mL: one decimal place, but two below 1 mL so small syringe volumes are not shown as 0.0. */
const fmtVolume = (ml: number): string => (ml < 1 ? ml.toFixed(2) : formatMl(ml));

const fmtMass = (mass: number, unit: 'mg' | 'mcg'): string => (unit === 'mg' ? formatMg(mass) : formatMcg(mass));

const STUB_BIOMETRICS: Biometrics = { tbw: 0, bmi: 0, pbw: 0, ibw: 0, abw40: 0, lbw: 0 };

const SCALARS: { value: WeightScalar; label: string }[] = [
  { value: 'TBW', label: 'TBW' },
  { value: 'IBW', label: 'IBW' },
  { value: 'LBW', label: 'LBW' },
  { value: 'ABW40', label: 'ABW40' },
];

interface DrugCardProps {
  medication: Medication;
  biometrics: Biometrics | null;
  population?: 'adult' | 'pediatric';
}

export const DrugCard: React.FC<DrugCardProps> = ({ medication, biometrics, population = 'adult' }) => {
  const actualWeightKg = useAppStore((s) => s.patient.tbwKg);
  const ageYears = useAppStore((s) => s.patient.ageYears);
  const selectedDoseIds = useAppStore((s) => s.selectedDose);
  const setSelectedDose = useAppStore((s) => s.setSelectedDose);
  const doseValues = useAppStore((s) => s.doseValues);
  const setDoseValue = useAppStore((s) => s.setDoseValue);
  const scalarOverrides = useAppStore((s) => s.scalarOverrides);
  const setScalarOverride = useAppStore((s) => s.setScalarOverride);
  const doseAdminLogs = useAppStore((s) => s.doseAdminLogs);
  const logDose = useAppStore((s) => s.logDose);
  const undoDose = useAppStore((s) => s.undoDose);
  const resetDoseLog = useAppStore((s) => s.resetDoseLog);
  const concentrationChoice = useAppStore((s) => s.concentrationChoice);
  const setConcentrationChoice = useAppStore((s) => s.setConcentrationChoice);
  const preferredScalar = useAppStore((s) => s.preferredScalar);
  const guidelineSet = useAppStore((s) => s.guidelineSet);
  const touchRecent = useAppStore((s) => s.touchRecent);
  const [showDetails, setShowDetails] = useState(false);

  const popDoses =
    population === 'pediatric'
      ? medication.doses.filter((d) => d.population === 'pediatric' || d.population === 'both')
      : medication.doses.filter((d) => (d.population ?? 'adult') === 'adult' || d.population === 'both');

  const applicable =
    actualWeightKg === null ? popDoses : popDoses.filter((d) => doseAppliesToWeight(d, actualWeightKg));

  const isAgeMatch = (d: MedicationDose): boolean => {
    if (ageYears === null || !d.ageBracket) return false;
    const min = d.ageBracket.minYears ?? 0;
    const max = d.ageBracket.maxYears ?? 18;
    return ageYears >= min && ageYears < max;
  };

  const prevAgeRef = useRef<number | null>(null);
  const prevPopRef = useRef<'adult' | 'pediatric' | null>(null);

  // Auto-select age-matched dose on mount, age change, or population change
  useEffect(() => {
    if (population === 'pediatric' && ageYears !== null) {
      if (prevAgeRef.current !== ageYears || prevPopRef.current !== population) {
        const matched = applicable.find(isAgeMatch);
        if (matched) {
          setSelectedDose(medication.id, matched.id);
        }
      }
    }
    prevAgeRef.current = ageYears;
    prevPopRef.current = population;
  }, [population, ageYears, medication.id, applicable, setSelectedDose]);

  const matchedDose = population === 'pediatric' && ageYears !== null ? applicable.find(isAgeMatch) : undefined;
  const isAgeOrPopChanged = prevAgeRef.current !== ageYears || prevPopRef.current !== population;
  const currentSelectedDose = applicable.find((d) => d.id === selectedDoseIds[medication.id]);

  const dose: MedicationDose | undefined =
    population === 'pediatric' && ageYears !== null && isAgeOrPopChanged && matchedDose
      ? matchedDose
      : currentSelectedDose ?? matchedDose ?? applicable[0];

  // Set pediatric default concentration on mount or entering pediatric mode
  const prevConcPopRef = useRef<'adult' | 'pediatric' | null>(null);
  useEffect(() => {
    if (population === 'pediatric') {
      const pedDefault = medication.concentrations.find((c) => c.isPediatricDefault);
      if (pedDefault) {
        if (prevConcPopRef.current !== 'pediatric' || (dose && concentrationChoice[dose.id] === undefined)) {
          if (dose) {
            setConcentrationChoice(dose.id, pedDefault.mgPerMl);
          }
        }
      }
    }
    prevConcPopRef.current = population;
  }, [population, dose?.id, medication.concentrations, concentrationChoice, setConcentrationChoice]);

  if (!dose) {
    return (
      <Panel title={medication.name} sourceIds={medication.sourceIds}>
        <WarningBanner level="info">Enter actual weight to select the applicable dose band.</WarningBanner>
      </Panel>
    );
  }

  // The saved strength is per dose. An infusion can therefore remember 20 mcg/mL while the bolus
  // dose remembers the 100 mcg/mL syringe.
  const pedDefaultConc =
    population === 'pediatric' ? medication.concentrations.find((c) => c.isPediatricDefault) : undefined;
  const defaultMgPerMl =
    pedDefaultConc?.mgPerMl ?? dose.preferredConcentrationMgPerMl ?? medication.concentrations[0].mgPerMl;
  const concIndex = resolveConcentrationIndex(
    medication.concentrations,
    concentrationChoice[dose.id],
    defaultMgPerMl,
  );
  const conc = medication.concentrations[concIndex];
  const weightBased = isWeightBased(dose);
  const isPediatric = population === 'pediatric' || dose.population === 'pediatric';

  const effectiveBiometrics =
    biometrics ??
    (actualWeightKg !== null
      ? { tbw: actualWeightKg, bmi: 0, pbw: 0, ibw: actualWeightKg, abw40: actualWeightKg, lbw: actualWeightKg }
      : STUB_BIOMETRICS);

  const needsWeight =
    dose.weightBandKg !== undefined
      ? actualWeightKg === null
      : isPediatric
        ? actualWeightKg === null
        : weightBased && biometrics === null;

  const lo = dose.min ?? dose.default ?? 0;
  const hi = dose.max ?? dose.default ?? lo;
  const value = doseValues[dose.id] ?? dose.default ?? lo;
  const adjustable = hi > lo;

  const prefApplies = weightBased && preferredScalar !== 'auto' && dose.scalarBasis !== 'label';
  const scalar: WeightScalar | undefined = weightBased
    ? isPediatric
      ? 'TBW'
      : (scalarOverrides[dose.id] ?? (prefApplies ? (preferredScalar as WeightScalar) : dose.scalar) ?? 'TBW')
    : undefined;

  const resolvedMax = dose.absoluteMax
    ? resolveWithOverrides(`dose-max:${dose.id}`, dose.absoluteMax.value, guidelineSet)
    : null;

  const effectiveAbsoluteMax =
    dose.absoluteMax && resolvedMax
      ? { ...dose.absoluteMax, value: resolvedMax.value }
      : dose.absoluteMax;

  const calcResult =
    actualWeightKg !== null
      ? calculateDose({
          dose: {
            ...dose,
            absoluteMax: effectiveAbsoluteMax,
          },
          tbwKg: actualWeightKg,
          ibwKg: effectiveBiometrics.ibw,
          lbwKg: effectiveBiometrics.lbw,
          abw40Kg: effectiveBiometrics.abw40,
          selectedScalar: scalar,
          doseValue: value,
          concentrationMgPerMl: conc.mgPerMl,
          patientAgeYears: ageYears,
        })
      : null;

  const computed: DoseComputation | null = needsWeight
    ? null
    : computeMedicationDose(dose, value, conc.mgPerMl, effectiveBiometrics, {
        scalarOverride: scalar,
        absoluteMax: effectiveAbsoluteMax,
        companion: medication.companion
          ? {
              name: medication.companion.name,
              ratioMgPerMg: medication.companion.ratioMgPerMg,
              concentrationMgPerMl: medication.companion.concentrationMgPerMl,
            }
          : undefined,
      });

  const step = adjustable ? stepFor(lo, hi) : 0;
  const displayDecimals = maxDecimalPlaces(step, lo, hi, value);
  const maxLabel = dose.absoluteMax
    ? `${resolvedMax?.value ?? dose.absoluteMax.value} ${dose.absoluteMax.unit}${dose.absoluteMax.scope ? ` (${dose.absoluteMax.scope})` : ''}`
    : '';

  const isMcg = dose.unit === 'mcg' || dose.unit === 'mcg/kg';
  const bolusMass = calcResult ? calcResult.calculatedMass : computed?.bolus?.mass;
  const bolusMassUnit: 'mg' | 'mcg' = isMcg ? 'mcg' : (computed?.bolus?.massUnit ?? 'mg');
  const bolusVolume = calcResult && calcResult.volumeMl !== null ? calcResult.volumeMl : computed?.bolus?.volumeMl;

  const cumulativeDose = medication.doses.find((d) => d.absoluteMax?.scope === 'cumulative');
  const cumulativeMax = cumulativeDose?.absoluteMax
    ? resolveWithOverrides(`dose-max:${cumulativeDose.id}`, cumulativeDose.absoluteMax.value, guidelineSet).value
    : undefined;
  const loggedMg = (doseAdminLogs[medication.id] ?? []).reduce((sum, mg) => sum + mg, 0);
  const plannedMg = calcResult
    ? isMcg
      ? calcResult.calculatedMass / 1000
      : calcResult.calculatedMass
    : computed?.bolus?.massMg;
  const cumulativeStatus =
    cumulativeMax !== undefined && plannedMg !== undefined
      ? cumulativeDoseStatus(loggedMg, plannedMg, cumulativeMax)
      : null;
  const cumulativeTotal = plannedMg === undefined ? loggedMg : loggedMg + plannedMg;
  const effectiveMax = cumulativeStatus ?? computed?.max;
  const effectivePercent =
    cumulativeMax !== undefined && plannedMg !== undefined
      ? (cumulativeTotal / cumulativeMax) * 100
      : computed?.percentOfMax;

  const maxTone =
    calcResult?.isCapped
      ? null
      : effectiveMax === 'exceeds' || effectiveMax === 'at-limit'
        ? 'red'
        : effectivePercent !== undefined && effectivePercent >= 90
          ? 'amber'
          : null;

  const sourceIds = [
    ...new Set([
      ...dose.sourceIds,
      conc.sourceId,
      ...(resolvedMax?.tag === 'Local protocol' || (cumulativeDose?.absoluteMax && cumulativeMax !== cumulativeDose.absoluteMax.value)
        ? ['local-protocol']
        : []),
    ]),
  ];

  return (
    <Panel title={medication.name} sourceIds={sourceIds}>
      <p className="text-xs text-slate-400">{medication.class}</p>

      {applicable.length > 1 && (
        <div className="flex flex-col gap-1.5" role="radiogroup" aria-label="Dose / indication">
          {applicable.map((d) => {
            const isMatch = isAgeMatch(d);
            return (
              <button
                key={d.id}
                type="button"
                role="radio"
                aria-checked={d.id === dose.id}
                onClick={() => {
                  setSelectedDose(medication.id, d.id);
                  touchRecent(medication.id);
                }}
                className={`min-h-[48px] rounded-xl border px-3 py-2 text-left text-xs font-semibold touch-manipulation ${
                  d.id === dose.id ? 'border-cyan-400 bg-cyan-500/15 text-cyan-100' : 'border-clinical-border-light bg-clinical-card text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span>
                    {d.indication}
                    {d.ageBracket?.label && (
                      <span className="ml-1.5 text-[11px] font-normal text-slate-400">
                        ({d.ageBracket.label})
                      </span>
                    )}
                  </span>
                  {population === 'pediatric' && isMatch && (
                    <span className="shrink-0 rounded border border-cyan-500/40 bg-cyan-500/20 px-1.5 py-0.5 text-[10px] font-bold text-cyan-300">
                      Age match
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
      {applicable.length === 1 && (
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-slate-200">
            {dose.indication}
            {dose.ageBracket?.label && (
              <span className="ml-1.5 text-xs font-normal text-slate-400">
                ({dose.ageBracket.label})
              </span>
            )}
          </p>
          {population === 'pediatric' && isAgeMatch(dose) && (
            <span className="shrink-0 rounded border border-cyan-500/40 bg-cyan-500/20 px-1.5 py-0.5 text-[10px] font-bold text-cyan-300">
              Age match
            </span>
          )}
        </div>
      )}

      {/* Maximum warning goes ABOVE the result so it cannot be missed. */}
      {computed && maxTone && (
        <WarningBanner
          level={maxTone}
          title={
            effectiveMax === 'exceeds'
              ? 'Exceeds absolute maximum'
              : effectiveMax === 'at-limit'
                ? 'Reaches absolute maximum'
                : 'Approaching absolute maximum'
          }
        >
          {cumulativeMax !== undefined && plannedMg !== undefined ? (
            <>
              Logged {formatMg(loggedMg)} mg plus this selected dose ({formatMg(plannedMg)} mg) is{' '}
              {formatMg(cumulativeTotal)} mg of the cumulative {cumulativeMax} mg ceiling. Do not exceed it.
            </>
          ) : (
            <>
              Calculated dose is {effectivePercent !== undefined ? `${Math.round(effectivePercent)}% of` : 'at'} the ceiling of {maxLabel}. Do not
              exceed the ceiling. {resolvedMax?.tag === 'Local protocol' && 'Ceiling set by Local protocol.'}
            </>
          )}
        </WarningBanner>
      )}
      {resolvedMax?.conflict && (
        <WarningBanner level="amber" title="Guideline vs local protocol">
          Guideline ceiling {resolvedMax.guidelineValue}, local protocol {resolvedMax.localValue}. {resolvedMax.origin === 'local-selected' ? 'Using local protocol.' : 'Using the guideline value; select "Use local protocol" in Settings to use the local value.'}
        </WarningBanner>
      )}
      {conc.requiresDilution && (
        <WarningBanner level="amber" title="Dilute before IV use">
          The {conc.label} presentation must be diluted per the preparation notes before intravenous use.
        </WarningBanner>
      )}

      <div className="grid grid-cols-1 gap-2 rounded-xl border border-clinical-border bg-clinical-bg p-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs text-slate-400">
            Source range: {dose.min ?? dose.default}
            {dose.max !== undefined && dose.max !== dose.min ? `-${dose.max}` : ''} {dose.unit}
            {dose.ageBracket?.label ? ` • ${dose.ageBracket.label}` : ''}
          </span>
          {scalar && scalarWeightKgOrNull(effectiveBiometrics, scalar) !== null && (
            <WeightScalarBadge
              scalar={scalar}
              kg={scalarWeightKgOrNull(effectiveBiometrics, scalar) ?? 0}
              basis={scalar === dose.scalar ? dose.scalarBasis : undefined}
            />
          )}
          {calcResult?.isCapped && (
            <span className="inline-flex items-center rounded-md border border-amber-500/40 bg-amber-500/20 px-2 py-0.5 text-xs font-semibold text-amber-200">
              {calcResult.cappedMessage ?? 'Capped at adult max'}
            </span>
          )}
          {calcResult?.isFloorEnforced && (
            <span className="inline-flex items-center rounded-md border border-sky-500/40 bg-sky-500/20 px-2 py-0.5 text-xs font-semibold text-sky-200">
              {calcResult.floorMessage ?? 'Minimum floor applied'}
            </span>
          )}
        </div>

        {adjustable ? (
          <NumericStepper
            label="Selected dose"
            value={value}
            unit={dose.unit}
            step={step}
            min={lo}
            max={hi}
            decimals={displayDecimals}
            onChange={(v) => {
              setDoseValue(dose.id, v);
              touchRecent(medication.id);
            }}
            allowKeypad
            keypadTitle={`Selected dose (${dose.unit})`}
          />
        ) : (
          <UnitValue label="Selected dose" value={String(value)} unit={dose.unit} tone="neutral" size="md" />
        )}

        {weightBased && (
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Weight scalar</span>
            {population === 'pediatric' ? (
              <div className="mt-1 flex items-center">
                <span className="inline-flex items-center rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-300">
                  TBW (Actual weight)
                </span>
              </div>
            ) : (
              <SegmentedControl
                ariaLabel="Weight scalar"
                value={scalar ?? 'TBW'}
                options={SCALARS}
                onChange={(s) => setScalarOverride(dose.id, s)}
              />
            )}
          </div>
        )}

        {needsWeight && (
          <WarningBanner level="info">
            {dose.weightBandKg
              ? 'Enter actual weight to confirm this weight-banded dose.'
              : isPediatric
                ? 'Enter actual weight to calculate this pediatric dose.'
                : 'Enter actual weight, height and biological sex to calculate this weight-based dose.'}
          </WarningBanner>
        )}

        {computed?.kind === 'bolus' && computed.bolus && (
          <div className="grid grid-cols-2 gap-2 border-t border-clinical-border pt-2">
            <BigValue
              label="Total"
              value={fmtMass(bolusMass ?? computed.bolus.mass, bolusMassUnit)}
              unit={bolusMassUnit}
              tone={calcResult?.isCapped ? 'amber' : effectiveMax === 'ok' ? undefined : 'red'}
            />
            <BigValue
              label={`Volume at ${conc.label}`}
              value={fmtVolume(bolusVolume ?? computed.bolus.volumeMl)}
              unit="mL"
            />
          </div>
        )}
        {computed?.kind === 'infusion' && computed.infusion && (
          <div className="grid grid-cols-2 gap-2 border-t border-clinical-border pt-2">
            <BigValue label="Rate" value={computed.infusion.mcgPerMin.toFixed(1)} unit="mcg/min" tone={effectiveMax === 'ok' ? undefined : 'red'} />
            <BigValue label={`Pump at ${conc.label}`} value={computed.infusion.mlPerHr.toFixed(1)} unit="mL/hr" />
          </div>
        )}

        {conc.pediatricInstructions && (
          <div className="rounded-lg border border-slate-700/60 bg-slate-800/50 p-2.5 text-xs text-slate-300">
            <span className="font-semibold text-cyan-300">Dilution preparation: </span>
            {conc.pediatricInstructions}
          </div>
        )}

        {cumulativeMax !== undefined && computed?.bolus && (
          <div className="flex flex-col gap-2 rounded-xl border border-amber-500/40 bg-amber-950/20 p-2">
            <p className="text-xs text-amber-100">
              Cumulative logged: {formatMg(loggedMg)} mg. With this selected dose: {formatMg(cumulativeTotal)} mg of{' '}
              {cumulativeMax} mg.
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => logDose(medication.id, plannedMg ?? computed.bolus!.massMg)}
                className="min-h-[48px] rounded-lg bg-amber-500 px-2 text-xs font-black text-black"
              >
                Log this dose
              </button>
              <button
                type="button"
                disabled={loggedMg === 0}
                onClick={() => undoDose(medication.id)}
                className="min-h-[48px] rounded-lg border border-amber-600/60 px-2 text-xs font-bold text-amber-100 disabled:opacity-40"
              >
                Undo last
              </button>
              <button
                type="button"
                disabled={loggedMg === 0}
                onClick={() => resetDoseLog(medication.id)}
                className="min-h-[48px] rounded-lg border border-amber-600/60 px-2 text-xs font-bold text-amber-100 disabled:opacity-40"
              >
                Reset total
              </button>
            </div>
          </div>
        )}

        {computed?.companion && (
          <div className="flex items-center justify-between gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2 text-xs">
            <span className="flex items-center gap-1 font-bold uppercase text-emerald-300">
              <ShieldCheck className="h-4 w-4" /> {computed.companion.name}
            </span>
            <span className="font-mono font-bold tabular-nums text-emerald-200">
              {formatMg(
                calcResult
                  ? (isMcg ? calcResult.calculatedMass / 1000 : calcResult.calculatedMass) *
                      (medication.companion?.ratioMgPerMg ?? 1)
                  : computed.companion.massMg,
              )}{' '}
              mg ={' '}
              {fmtVolume(
                calcResult
                  ? ((isMcg ? calcResult.calculatedMass / 1000 : calcResult.calculatedMass) *
                      (medication.companion?.ratioMgPerMg ?? 1)) /
                      (medication.companion?.concentrationMgPerMl ?? 1)
                  : computed.companion.volumeMl,
              )}{' '}
              mL
            </span>
          </div>
        )}
      </div>

      <ConcentrationSelector
        options={medication.concentrations}
        selectedIndex={concIndex}
        onChange={(i) => setConcentrationChoice(dose.id, medication.concentrations[i].mgPerMl)}
      />

      <div>
        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          className="flex min-h-[48px] w-full items-center justify-between text-xs font-semibold text-slate-400 hover:text-cyan-300"
          aria-expanded={showDetails}
        >
          <span className="flex items-center gap-1">
            <FlaskConical className="h-4 w-4" /> Preparation, cautions and notes
          </span>
          {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {showDetails && (
          <ul className="mt-1 flex list-disc flex-col gap-1 pl-5 text-xs text-slate-300">
            {[...(dose.notes ?? []), ...(medication.preparation ?? []), ...(medication.cautions ?? [])].map((n) => (
              <li key={n}>{n}</li>
            ))}
            {[...(dose.notes ?? []), ...(medication.preparation ?? []), ...(medication.cautions ?? [])].length === 0 && (
              <li className="list-none text-slate-500">No additional notes in the selected sources.</li>
            )}
          </ul>
        )}
      </div>
    </Panel>
  );
};

const scalarWeightKgOrNull = (b: Biometrics | null, s: WeightScalar): number | null =>
  b === null ? null : scalarWeightKg(b, s);
