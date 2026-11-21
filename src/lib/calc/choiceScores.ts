import type { ChoiceScore } from '../../data/choiceScores';
import type { RiskBand } from '../../data/riskScores';

export type ChoiceResult =
  | { kind: 'ok'; points: number; max: number; band: RiskBand }
  | { kind: 'incomplete'; missing: string[] };

/** answers maps an item id to the index of the chosen option. A missing or out-of-range answer is never defaulted. */
export const choiceScoreResult = (score: ChoiceScore, answers: Record<string, number | undefined>): ChoiceResult => {
  const unanswered = score.items.filter((i) => {
    const a = answers[i.id];
    return a === undefined || !Number.isInteger(a) || a < 0 || a >= i.options.length;
  });
  if (unanswered.length > 0) return { kind: 'incomplete', missing: unanswered.map((i) => i.label) };
  const points = score.items.reduce((sum, i) => sum + i.options[answers[i.id] as number].points, 0);
  const max = score.items.reduce((sum, i) => sum + Math.max(...i.options.map((o) => o.points)), 0);
  const band = [...score.bands].reverse().find((b) => points >= b.min) ?? score.bands[0];
  return { kind: 'ok', points, max, band };
};
