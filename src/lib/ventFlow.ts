import type { FlowStep } from './flow';
import type { VentilationScenario } from '../data/types';
import { PLATEAU_LIMIT_CMH2O, tidalVolumeSeverity } from './calc/ventilation';

export interface VentFlowInput {
  scenario?: VentilationScenario;
  ageYears: number | null;
  heightCm: number | null;
  sex: 'male' | 'female' | null;
  mlPerKgPbw: number | null;
  respiratoryRate: number | null;
  peepCmH2O: number | null;
  plateauCmH2O: number | null;
}

export const ventSteps = (i: VentFlowInput): FlowStep[] => {
  const r = i.scenario?.tidalVolumeMlPerKgPbw;
  const ageYears = i.ageYears;
  const ageUnknown = ageYears == null;
  const peds = i.scenario?.id === 'pediatric' || (!ageUnknown && ageYears < 18);
  const adultPeds = ageYears != null && ageYears < 18;
  const limit = i.scenario?.plateauPressureLimit ?? PLATEAU_LIMIT_CMH2O;
  const pbwKnown = !ageUnknown && !peds && i.heightCm != null && i.sex != null;
  // Reuse the VT card's rule so the two never disagree; 'amber' is an edge value, still in range.
  const vtOk = pbwKnown && !!r && i.mlPerKgPbw != null && tidalVolumeSeverity(i.mlPerKgPbw, r) !== 'red';
  const vtManual = peds || (!!i.scenario && !r);
  const plateauOverLimit = i.plateauCmH2O != null && i.plateauCmH2O > limit;
  const plateauDone = i.plateauCmH2O != null && i.plateauCmH2O <= limit;

  // The scenario is not a step: the store always has one selected (default 'ards').
  return [
    {
      id: 'pbw',
      label: 'Age, height + sex (predicted body weight)',
      done: pbwKnown,
      manual: peds,
      hint: ageUnknown ? 'Enter age before choosing adult or pediatric ventilation' : adultPeds || i.scenario?.id === 'pediatric' ? 'Pediatric: PBW is not used' : undefined,
    },
    {
      id: 'vt',
      label: 'Set tidal volume in range',
      done: vtOk,
      manual: vtManual,
      hint: peds
        ? 'Pediatric: no adult target'
        : i.scenario && !r
          ? 'No sourced range: clinician judgement'
          : undefined,
    },
    { id: 'rate-peep', label: 'Set rate and PEEP', done: i.respiratoryRate != null && i.peepCmH2O != null },
    {
      id: 'plateau',
      label: `Plateau <= ${limit} cmH2O`,
      done: plateauDone,
      tone: plateauOverLimit ? 'red' : undefined,
      hint: plateauOverLimit ? `High airway pressure (>${limit} cmH2O)` : undefined,
    },
  ];
};
