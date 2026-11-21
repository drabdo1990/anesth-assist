import React from 'react';
import { FOUR_AT, MODIFIED_ALDRETE, PADSS } from '../data/choiceScores';
import { PONV_PLAN } from '../data/ponvPlan';
import { POSTOP_SCORES } from '../data/riskScores';
import { calculateBmi } from '../lib/calc/biometrics';
import { useAppStore } from '../store/useAppStore';
import { Panel } from '../components/hud/Panel';
import { ChoiceScorePanel } from '../components/ChoiceScorePanel';
import { ScorePanel } from '../components/ScorePanel';

const linkBtn =
  'min-h-[48px] rounded-xl border border-clinical-border-light bg-clinical-card px-3 text-sm font-bold text-slate-200 touch-manipulation';

/** Post-op tools: PONV risk and what the 2025 consensus advises, the PACU discharge scores and the 4AT delirium screen. All inputs live in memory only. */
export const PostopView: React.FC = () => {
  const patient = useAppStore((s) => s.patient);
  const answers = useAppStore((s) => s.scoreAnswers);
  const toggle = useAppStore((s) => s.toggleScoreItem);
  const choiceAnswers = useAppStore((s) => s.choiceAnswers);
  const setChoice = useAppStore((s) => s.setChoiceAnswer);
  const setReferencesOpen = useAppStore((s) => s.setReferencesOpen);

  const bmi = patient.tbwKg !== null && patient.heightCm !== null ? calculateBmi(patient.tbwKg, patient.heightCm) : null;
  const ctx = { ageYears: patient.ageYears, sex: patient.sex, bmi, creatinineUmolL: patient.creatinineUmolL };
  const child = patient.ageYears !== null && patient.ageYears < 18;

  return (
    <div className="mb-3 flex flex-col gap-3">
      {POSTOP_SCORES.map((score) => (
        <ScorePanel key={score.id} score={score} answers={answers} ctx={ctx} onToggle={toggle} />
      ))}

      <Panel title="PONV: what the 2025 consensus advises" sourceIds={PONV_PLAN.sourceIds}>
        {child ? (
          <p className="text-sm text-slate-200">{PONV_PLAN.children}</p>
        ) : (
          <>
            <p className="text-sm font-semibold text-slate-100">{PONV_PLAN.adults.headline}</p>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Reduce baseline risk</p>
            <ul className="list-disc pl-5 text-sm text-slate-200">
              {PONV_PLAN.adults.riskReduction.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
            <p className="text-xs text-slate-400">{PONV_PLAN.adults.doseNote}</p>
            <div>
              <button type="button" onClick={() => setReferencesOpen(true)} className={linkBtn}>
                Drug reference
              </button>
            </div>
          </>
        )}
      </Panel>

      <ChoiceScorePanel score={MODIFIED_ALDRETE} answers={choiceAnswers} onAnswer={setChoice} />
      <ChoiceScorePanel score={PADSS} answers={choiceAnswers} onAnswer={setChoice} />
      <ChoiceScorePanel score={FOUR_AT} answers={choiceAnswers} onAnswer={setChoice} />
    </div>
  );
};
