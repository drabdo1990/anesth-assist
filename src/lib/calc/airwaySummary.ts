import { adultEttAndBlade, dltSizeForHeight, lmaSizeForWeight, pedsBladeForAge, pedsEtt } from './airway';

export interface AirwaySummaryInput {
  population: 'adult' | 'pediatric';
  ageYears: number | null; sex: 'male' | 'female' | null;
  heightCm: number | null; weightKg: number | null;
}
const none = { ok: false as const, reason: 'Enter patient value' };

export const airwaySummary = (i: AirwaySummaryInput) => {
  const ped = i.population === 'pediatric';
  const adultAllowed = i.ageYears != null && i.ageYears >= 18;
  const adultNone = { ok: false as const, reason: i.ageYears == null ? 'Enter age before adult sizing' : 'Adult sizing withheld for a pediatric patient' };
  return {
    ett: ped ? (i.ageYears == null ? none : pedsEtt(i.ageYears, 'cuffed-msd')) : adultAllowed ? adultEttAndBlade(i.sex) : adultNone,
    ettUncuffed: ped && i.ageYears != null ? pedsEtt(i.ageYears, 'uncuffed-msd') : none,
    blade: ped ? (i.ageYears == null ? null : pedsBladeForAge(i.ageYears * 12)) : adultAllowed ? adultEttAndBlade(i.sex) : adultNone,
    lma: i.weightKg == null ? none : lmaSizeForWeight(i.weightKg),
    dlt: ped || !adultAllowed ? adultNone : dltSizeForHeight(i.heightCm, i.ageYears),
  };
};
