import React, { useState } from 'react';
import { PLAN_CARDS, PLAN_PHASES, PLAN_PHASE_LABEL, cardSourceIds, planItems } from '../data/planCards';
import { VENTILATION_SCENARIOS } from '../data/ventilation';
import type { IntraopView } from '../lib/phases';
import { useAppStore } from '../store/useAppStore';
import { Panel } from '../components/hud/Panel';
import { ChecklistItem } from '../components/ui/ChecklistItem';
import { NoSourceValue } from '../components/ui/NoSourceValue';

const linkBtn =
  'min-h-[48px] rounded-xl border border-clinical-border-light bg-clinical-card px-3 text-sm font-bold text-slate-200 touch-manipulation';

/** Rapid case-type cards: a curated view over checklist items the app already has. */
export const PlansView: React.FC = () => {
  const [cardId, setCardId] = useState(PLAN_CARDS[0].id);
  const checks = useAppStore((s) => s.checks);
  const toggle = useAppStore((s) => s.toggleCheck);
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const setIntraopView = useAppStore((s) => s.setIntraopView);
  const setVent = useAppStore((s) => s.setVent);
  const setReferencesOpen = useAppStore((s) => s.setReferencesOpen);

  const card = PLAN_CARDS.find((c) => c.id === cardId) ?? PLAN_CARDS[0];
  const go = (view: IntraopView) => {
    setActiveTab('intraop');
    setIntraopView(view);
  };

  const actions: { key: string; label: string; run: () => void }[] = [];
  if (card.links.airway) actions.push({ key: 'airway', label: 'Airway devices and sizing', run: () => go('airway') });
  if (card.links.dosing) actions.push({ key: 'dosing', label: 'Dosing', run: () => go('dosing') });
  if (card.links.ventScenarioId) {
    const scenarioId = card.links.ventScenarioId;
    const name = VENTILATION_SCENARIOS.find((s) => s.id === scenarioId)?.name ?? scenarioId;
    actions.push({
      key: 'vent',
      label: `Ventilation: ${name}`,
      run: () => {
        setVent({ scenarioId });
        go('vent');
      },
    });
  }
  if (card.links.lists) actions.push({ key: 'lists', label: 'Checklists and crisis lists', run: () => go('lists') });
  if (card.links.references) actions.push({ key: 'references', label: 'Drug reference', run: () => setReferencesOpen(true) });

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-slate-400">
        Rapid case-type cards. Each one groups items already in this app, with the same sources. Ticks are shared with the Lists.
      </p>

      <div className="grid grid-cols-2 gap-1.5" role="group" aria-label="Plan cards">
        {PLAN_CARDS.map((c) => (
          <button
            key={c.id}
            type="button"
            aria-pressed={c.id === card.id}
            onClick={() => setCardId(c.id)}
            className={`min-h-[56px] rounded-xl border px-3 text-sm font-bold touch-manipulation ${
              c.id === card.id ? 'border-cyan-400 bg-cyan-500 text-black' : 'border-slate-700 bg-slate-900 text-slate-300'
            }`}
          >
            {c.title}
          </button>
        ))}
      </div>

      <Panel title={card.title} sourceIds={cardSourceIds(card)}>
        <p className="text-sm text-slate-200">{card.population}</p>
        <p className="text-xs text-slate-400">{card.why}</p>
        <div className="flex flex-wrap gap-1.5">
          {actions.map((a) => (
            <button key={a.key} type="button" onClick={a.run} className={linkBtn}>
              {a.label}
            </button>
          ))}
        </div>
      </Panel>

      {PLAN_PHASES.map((phase) => {
        const items = planItems(card, phase);
        const sourceIds = [...new Set(items.flatMap((i) => i.sourceIds))];
        return (
          <Panel key={phase} title={PLAN_PHASE_LABEL[phase]} sourceIds={items.length > 0 ? sourceIds : undefined}>
            {items.length === 0 ? (
              <NoSourceValue topic={PLAN_PHASE_LABEL[phase]} compact />
            ) : (
              <div className="flex flex-col gap-1.5">
                {items.map((i) => (
                  <ChecklistItem key={i.id} checked={!!checks[i.id]} onToggle={() => toggle(i.id)} label={i.text} />
                ))}
              </div>
            )}
          </Panel>
        );
      })}
    </div>
  );
};
