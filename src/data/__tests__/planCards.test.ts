import { describe, expect, it } from 'vitest';
import { CHECKLISTS } from '../checklists';
import { PLAN_CARDS, PLAN_PHASES, cardSourceIds, planItems } from '../planCards';
import { SOURCE_BY_ID } from '../sources';
import { VENTILATION_SCENARIOS } from '../ventilation';

const card = (id: string) => {
  const c = PLAN_CARDS.find((x) => x.id === id);
  if (!c) throw new Error(`missing card ${id}`);
  return c;
};
const idsOf = (c: ReturnType<typeof card>) => PLAN_PHASES.flatMap((p) => c.phases[p]);

describe('plan cards', () => {
  it('are the four first-batch cards with unique ids and titles', () => {
    expect(PLAN_CARDS.map((c) => c.id)).toEqual(['peds', 'ob-cs-neuraxial', 'obesity', 'rsi']);
    expect(new Set(PLAN_CARDS.map((c) => c.title)).size).toBe(PLAN_CARDS.length);
  });

  it('have exactly the five phases, so no section is ever missing from the screen', () => {
    for (const c of PLAN_CARDS) expect(Object.keys(c.phases).sort(), c.id).toEqual([...PLAN_PHASES].sort());
  });

  it('carry no clinical text of their own: only ids, links and a short scope note', () => {
    for (const c of PLAN_CARDS) expect(Object.keys(c).sort(), c.id).toEqual(['id', 'links', 'phases', 'population', 'title', 'why']);
  });

  it('use checklist item ids that exist, and item ids are unique across every checklist', () => {
    const all = CHECKLISTS.flatMap((l) => l.items.map((i) => i.id));
    expect(new Set(all).size).toBe(all.length);
    for (const c of PLAN_CARDS) {
      for (const p of PLAN_PHASES) {
        expect(new Set(c.phases[p]).size, `${c.id}/${p} repeats an item`).toBe(c.phases[p].length);
        expect(() => planItems(c, p), `${c.id}/${p}`).not.toThrow();
      }
    }
  });

  it('cite only sources that exist, and every card shows at least one source', () => {
    for (const c of PLAN_CARDS) {
      const ids = cardSourceIds(c);
      expect(ids.length, c.id).toBeGreaterThan(0);
      for (const s of ids) expect(SOURCE_BY_ID[s], `${c.id} -> ${s}`).toBeDefined();
    }
  });

  it('link only to ventilation scenarios that exist', () => {
    for (const c of PLAN_CARDS) {
      if (c.links.ventScenarioId) expect(VENTILATION_SCENARIOS.map((s) => s.id), c.id).toContain(c.links.ventScenarioId);
    }
  });

  it('pediatric: has the child, infant and neonate fasting lines and links to Dosing', () => {
    const ids = idsOf(card('peds'));
    for (const id of ['fasting-peds-clear', 'fasting-breast-milk', 'fasting-formula']) expect(ids).toContain(id);
    expect(card('peds').links.dosing).toBe(true);
    expect(card('peds').links.ventScenarioId).toBe('pediatric');
  });

  it('obstetric neuraxial: includes the elective-obstetric fasting line and the coagulation check', () => {
    const ids = idsOf(card('ob-cs-neuraxial'));
    expect(ids).toContain('fasting-elective-obstetric');
    expect(ids).toContain('nxp-coag');
  });

  it('obesity and RSI keep their own fasting lines', () => {
    expect(idsOf(card('obesity'))).toContain('fasting-bariatric');
    expect(idsOf(card('rsi'))).toContain('fasting-emergency');
  });
});
