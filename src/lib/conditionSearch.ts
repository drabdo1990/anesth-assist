import { CONDITIONS, type ConditionRecord } from '../data/conditions';

/** Lower case, accents removed, and every run of other characters turned into one space. */
export const normalize = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const byName = (a: ConditionRecord, b: ConditionRecord): number => a.name.localeCompare(b.name, 'en');

/**
 * Conditions whose name or an alias contains the query. Names that start with the query come first, then A to Z.
 * An empty query lists everything, conditions with a plan first.
 */
export const searchConditions = (query: string, list: ConditionRecord[] = CONDITIONS): ConditionRecord[] => {
  const q = normalize(query);
  if (!q) return [...list].sort((a, b) => Number(!a.plan) - Number(!b.plan) || byName(a, b));
  const starts = (c: ConditionRecord): number => (normalize(c.name).startsWith(q) ? 0 : 1);
  return list
    .filter((c) => [c.name, ...c.aliases].some((t) => normalize(t).includes(q)))
    .sort((a, b) => starts(a) - starts(b) || byName(a, b));
};
