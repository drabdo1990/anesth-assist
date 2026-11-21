import React from 'react';
import { RISK_SCORES } from '../data/riskScores';
import { calculateBmi } from '../lib/calc/biometrics';
import { creatinineClearance } from '../lib/calc/crcl';
import { creatinineFromUmol, creatinineToUmol, type CreatinineUnit } from '../lib/calc/units';
import { useAppStore } from '../store/useAppStore';
import { Panel } from '../components/hud/Panel';
import { ScorePanel } from '../components/ScorePanel';
import { NumericStepper } from '../components/ui/NumericStepper';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { WarningBanner } from '../components/ui/WarningBanner';

const UNIT_OPTIONS: { value: CreatinineUnit; label: string }[] = [
  { value: 'mgdl', label: 'mg/dL' },
  { value: 'umol', label: 'µmol/L' },
];

const STEPPER: Record<CreatinineUnit, { step: number; min: number; max: number; decimals: number; unit: string }> = {
  mgdl: { step: 0.1, min: 0.1, max: 15, decimals: 1, unit: 'mg/dL' },
  umol: { step: 10, min: 10, max: 1300, decimals: 0, unit: 'µmol/L' },
};

/** Pre-op assessment: serum creatinine, creatinine clearance and the risk scores. All inputs live in memory only. */
export const AssessView: React.FC = () => {
  const patient = useAppStore((s) => s.patient);
  const setPatient = useAppStore((s) => s.setPatient);
  const unit = useAppStore((s) => s.creatinineUnit);
  const setUnit = useAppStore((s) => s.setCreatinineUnit);
  const answers = useAppStore((s) => s.scoreAnswers);
  const toggle = useAppStore((s) => s.toggleScoreItem);

  const bmi = patient.tbwKg !== null && patient.heightCm !== null ? calculateBmi(patient.tbwKg, patient.heightCm) : null;
  const ctx = { ageYears: patient.ageYears, sex: patient.sex, bmi, creatinineUmolL: patient.creatinineUmolL };
  const crcl = creatinineClearance({ ageYears: patient.ageYears, tbwKg: patient.tbwKg, sex: patient.sex, creatinineUmolL: patient.creatinineUmolL });
  const s = STEPPER[unit];
  const shown = patient.creatinineUmolL === null ? null : Number(creatinineFromUmol(patient.creatinineUmolL, unit).toFixed(s.decimals));

  return (
    <div className="mb-3 flex flex-col gap-3">
      <Panel title="Serum creatinine">
        <SegmentedControl<CreatinineUnit> ariaLabel="Creatinine unit" value={unit} options={UNIT_OPTIONS} onChange={setUnit} />
        <NumericStepper
          label="Serum creatinine"
          value={shown}
          unit={s.unit}
          step={s.step}
          min={s.min}
          max={s.max}
          decimals={s.decimals}
          keypadTitle="Enter serum creatinine"
          onChange={(v) => setPatient({ creatinineUmolL: creatinineToUmol(v, unit) })}
        />
      </Panel>

      <Panel title="Creatinine clearance" basis="Cockcroft-Gault, actual body weight" sourceIds={['cockcroft-gault-1976', 'app-generic']}>
        {crcl.kind === 'ok' ? (
          <>
            <p className="font-mono text-2xl font-bold text-cyan-300">{Math.round(crcl.mlPerMin)} mL/min</p>
            <p className="text-xs text-slate-400">
              An estimate for adults. It is less reliable at extremes of body weight and while creatinine is changing.
            </p>
          </>
        ) : (
          <WarningBanner level="info">Incomplete: needs {crcl.missing.join(', ')}.</WarningBanner>
        )}
      </Panel>

      {RISK_SCORES.map((score) => (
        <ScorePanel key={score.id} score={score} answers={answers} ctx={ctx} onToggle={toggle} />
      ))}
    </div>
  );
};
