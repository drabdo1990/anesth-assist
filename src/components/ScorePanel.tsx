import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import type { RiskScore } from '../data/riskScores';
import { itemValue, scoreResult, type ScoreContext } from '../lib/calc/scores';
import { Panel } from './hud/Panel';
import { WarningBanner } from './ui/WarningBanner';

interface ScoreItemProps {
  label: string;
  checked: boolean;
  locked: boolean;
  onToggle: () => void;
}

// Not ChecklistItem: that one strikes through and turns green when "done", which would read as good news for a risk factor.
export const ScoreItem: React.FC<ScoreItemProps> = ({ label, checked, locked, onToggle }) => (
  <button
    type="button"
    role="checkbox"
    aria-checked={checked}
    disabled={locked}
    onClick={onToggle}
    className={`flex min-h-[48px] w-full items-start gap-3 rounded-xl border p-3 text-left text-sm font-semibold touch-manipulation disabled:cursor-default ${
      checked ? 'border-amber-500/60 bg-amber-950/30 text-amber-100' : 'border-clinical-border bg-clinical-card/50 text-slate-200'
    }`}
  >
    {checked ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" /> : <Circle className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />}
    <span className="min-w-0 flex-1">
      {label}
      {locked && <span className="mt-1 block text-xs font-normal text-slate-400">Set from the patient inputs</span>}
    </span>
  </button>
);

interface ScorePanelProps {
  score: RiskScore;
  answers: Record<string, boolean>;
  ctx: ScoreContext;
  onToggle: (id: string) => void;
}

export const ScorePanel: React.FC<ScorePanelProps> = ({ score, answers, ctx, onToggle }) => {
  const result = scoreResult(score, answers, ctx);
  return (
    <Panel title={score.name} sourceIds={score.sourceIds}>
      <div className="flex flex-col gap-1.5">
        {score.items.map((item) => (
          <ScoreItem
            key={item.id}
            label={item.label}
            checked={itemValue(item, answers, ctx)}
            locked={!!item.derive}
            onToggle={() => onToggle(item.id)}
          />
        ))}
      </div>
      <div aria-live="polite">
        {result.kind === 'incomplete' ? (
          <WarningBanner level="info">Incomplete: needs {result.missing.join(', ')}.</WarningBanner>
        ) : result.kind === 'not-applicable' ? (
          <WarningBanner level="info">{result.reason}</WarningBanner>
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
