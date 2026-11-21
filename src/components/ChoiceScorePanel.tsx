import React from 'react';
import type { ChoiceScore } from '../data/choiceScores';
import { choiceScoreResult } from '../lib/calc/choiceScores';
import { Panel } from './hud/Panel';
import { WarningBanner } from './ui/WarningBanner';

interface ChoiceScorePanelProps {
  score: ChoiceScore;
  answers: Record<string, number>;
  onAnswer: (itemId: string, optionIndex: number) => void;
}

/** A score whose items each have several answers worth different points. Nothing is pre-selected. */
export const ChoiceScorePanel: React.FC<ChoiceScorePanelProps> = ({ score, answers, onAnswer }) => {
  const result = choiceScoreResult(score, answers);
  return (
    <Panel title={score.name} sourceIds={score.sourceIds}>
      {score.items.map((item) => (
        <div key={item.id} className="flex flex-col gap-1.5">
          <h4 className="text-sm font-bold text-slate-100">{item.label}</h4>
          {item.prompt && <p className="text-xs text-slate-400">{item.prompt}</p>}
          <div role="radiogroup" aria-label={item.label} className="flex flex-col gap-1.5">
            {item.options.map((o, idx) => {
              const on = answers[item.id] === idx;
              return (
                <button
                  key={o.label}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => onAnswer(item.id, idx)}
                  className={`flex min-h-[48px] w-full items-center justify-between gap-3 rounded-xl border p-3 text-left text-sm font-semibold touch-manipulation ${
                    on ? 'border-cyan-400 bg-cyan-500 text-black' : 'border-clinical-border bg-clinical-card/50 text-slate-200'
                  }`}
                >
                  <span className="min-w-0 flex-1">{o.label}</span>
                  <span className="shrink-0 font-mono text-xs">{o.points} pt</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <div aria-live="polite">
        {result.kind === 'incomplete' ? (
          <WarningBanner level="info">Incomplete: answer {result.missing.join(', ')}.</WarningBanner>
        ) : (
          <>
            <p className="font-mono text-lg font-bold text-cyan-300">
              {result.points} / {result.max} · {result.band.label}
            </p>
            {result.band.detail && <p className="text-xs text-slate-300">{result.band.detail}</p>}
          </>
        )}
      </div>
      {score.note && <p className="text-xs text-slate-400">{score.note}</p>}
    </Panel>
  );
};
