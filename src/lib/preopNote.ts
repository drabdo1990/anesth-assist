// Anonymous pre-op note. The input holds only numbers and fixed pick-lists, so free text cannot get in.
// It reuses the app's own calculations, so the note cannot disagree with the screens.

import { PERIOP_RULES, type PeriopAction } from '../data/periopMeds';
import { RISK_SCORES } from '../data/riskScores';
import { DATA_VERSION, SOURCE_BY_ID } from '../data/sources';
import { calculateBmi, type Sex } from './calc/biometrics';
import { creatinineClearance } from './calc/crcl';
import { matchTimings } from './calc/periopMeds';
import { scoreResult } from './calc/scores';
import { creatinineFromUmol } from './calc/units';

export const ASA_CLASSES = ['I', 'II', 'III', 'IV', 'V', 'VI'] as const;
export type AsaClass = (typeof ASA_CLASSES)[number];

export const FASTING_STATUSES = ['Meets local fasting protocol', 'Does not meet local fasting protocol'] as const;
export type FastingStatus = (typeof FASTING_STATUSES)[number];

export interface PreopNoteInput {
  ageYears: number | null;
  sex: Sex | null;
  tbwKg: number | null;
  heightCm: number | null;
  creatinineUmolL: number | null;
  asaClass: AsaClass | null;
  asaEmergency: boolean;
  fasting: FastingStatus | null;
  scoreAnswers: Record<string, boolean>;
  medsTaken: Record<string, boolean>;
}

const ACTION_LABEL: Record<PeriopAction, string> = {
  continue: 'Continue',
  hold: 'Hold',
  modify: 'Modify',
  individualise: 'Individualise',
};

const finite = (v: number | null): v is number => v !== null && Number.isFinite(v);

const tags = (ids: string[]): string => `[${[...new Set(ids.map((id) => SOURCE_BY_ID[id]?.tag ?? id))].join(', ')}]`;

export const buildPreopNote = (input: PreopNoteInput): string => {
  const age = finite(input.ageYears) ? input.ageYears : null;
  const weight = finite(input.tbwKg) ? input.tbwKg : null;
  const height = finite(input.heightCm) && input.heightCm > 0 ? input.heightCm : null;
  const creatinine = finite(input.creatinineUmolL) && input.creatinineUmolL > 0 ? input.creatinineUmolL : null;
  const bmi = weight !== null && height !== null ? calculateBmi(weight, height) : null;

  const crcl = creatinineClearance({ ageYears: age, tbwKg: weight, sex: input.sex, creatinineUmolL: creatinine });
  const crclMl = crcl.kind === 'ok' ? crcl.mlPerMin : null;
  const ctx = { ageYears: age, sex: input.sex, bmi, creatinineUmolL: creatinine };

  const lines: string[] = ['--- PRE-OP ASSESSMENT NOTE (anonymous) ---'];

  lines.push(
    [
      `Age: ${age === null ? 'not entered' : `${age} y`}`,
      `Sex: ${input.sex ?? 'not entered'}`,
      `Weight: ${weight === null ? 'not entered' : `${weight.toFixed(1)} kg`}`,
      `Height: ${height === null ? 'not entered' : `${Math.round(height)} cm`}`,
      `BMI: ${bmi === null ? 'not entered' : `${bmi.toFixed(1)} kg/m²`}`,
    ].join('; '),
  );
  lines.push(
    creatinine === null
      ? 'Creatinine: not entered'
      : `Creatinine: ${creatinineFromUmol(creatinine, 'mgdl').toFixed(1)} mg/dL (${Math.round(creatinine)} µmol/L)`,
  );
  lines.push(
    crcl.kind === 'ok'
      ? `Creatinine clearance: ${Math.round(crcl.mlPerMin)} mL/min (Cockcroft-Gault, actual body weight) ${tags(['cockcroft-gault-1976', 'app-generic'])}`
      : `Creatinine clearance: incomplete (needs ${crcl.missing.join(', ')})`,
  );
  lines.push(input.asaClass === null ? 'ASA: not recorded' : `ASA: ${input.asaClass}${input.asaEmergency ? '-E' : ''}`);
  lines.push(`Fasting: ${input.fasting ?? 'not recorded'}`);

  for (const score of RISK_SCORES) {
    const r = scoreResult(score, input.scoreAnswers, ctx);
    if (r.kind === 'ok') lines.push(`${score.name}: ${r.points} / ${r.max} (${r.band.label}) ${tags(score.sourceIds)}`);
    else if (r.kind === 'incomplete') lines.push(`${score.name}: incomplete (needs ${r.missing.join(', ')})`);
    else lines.push(`${score.name}: not applicable`);
  }

  const taken = PERIOP_RULES.filter((r) => input.medsTaken[r.id]);
  if (taken.length === 0) {
    lines.push('Medications ticked in the app: none (this is not a medication history; the app covers only the classes in its Medications section)');
  } else {
    lines.push('Medications ticked in the app:');
    for (const rule of taken) {
      lines.push(`- ${rule.drugClass}: ${ACTION_LABEL[rule.action]}. ${rule.summary} ${tags(rule.sourceIds)}`);
      for (const c of rule.cautions ?? []) lines.push(`  Caution: ${c}`);
      for (const d of rule.drugs) {
        const timing = matchTimings(d, crclMl)
          .filter((m) => m.match !== 'no')
          .map(({ timing: t, match }) => {
            const note = match === 'unknown' ? ' (CrCl not available)' : match === 'yes' && crclMl !== null ? ` (this patient: CrCl ${crclMl.toFixed(1)} mL/min)` : '';
            return `${t.when ? `${t.when}: ` : ''}${t.text}${note}`;
          })
          .join(' ');
        lines.push(`  ${d.name}: ${timing}${d.restart ? ` Restart: ${d.restart}` : ''} ${tags([d.sourceId])}`);
        for (const c of d.catheter ?? []) lines.push(`    Catheter / post-block: ${c}`);
      }
    }
  }

  lines.push(`App data version: ${DATA_VERSION}`);
  lines.push('No patient identifiers included.');
  return lines.join('\n');
};
