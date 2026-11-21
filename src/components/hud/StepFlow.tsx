import React from 'react';
import { AlertTriangle, Check } from 'lucide-react';
import { currentStepIndex, type FlowStep } from '../../lib/flow';

interface StepFlowProps {
  steps: FlowStep[];
}

/** Derived, read-only checklist: the first undone step is "Now". State is text + icon, never colour alone. */
export const StepFlow: React.FC<StepFlowProps> = ({ steps }) => {
  const current = currentStepIndex(steps);

  return (
    <ol className="flex flex-col gap-2" aria-label="Flow steps">
      {steps.map((step, index) => {
        const isCurrent = index === current;
        let tone = 'border-clinical-border text-slate-400';
        let state = 'Next';

        if (step.tone === 'red') {
          tone = 'border-clinical-red bg-clinical-red/10 text-clinical-red shadow-glow-red';
          state = 'Alert';
        } else if (step.done) {
          tone = 'border-clinical-emerald/60 bg-clinical-emerald/10 text-clinical-emerald';
          state = 'Done';
        } else if (step.manual) {
          tone = 'border-clinical-amber/60 bg-clinical-amber/10 text-clinical-amber';
          state = 'Manual';
        } else if (isCurrent) {
          tone = 'border-clinical-cyan bg-clinical-cyan/10 text-clinical-cyan shadow-glow-cyan';
          state = 'Now';
        }

        return (
          <li
            key={step.id}
            aria-current={isCurrent ? 'step' : undefined}
            className={`flex min-h-[48px] items-center gap-3 rounded-xl border px-3 py-2 ${tone}`}
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-current font-mono text-xs">
              {step.tone === 'red' ? (
                <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
              ) : step.done ? (
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
              ) : step.manual ? (
                '~'
              ) : (
                index + 1
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">{step.label}</p>
              {(isCurrent || step.manual || step.tone === 'red') && step.hint && (
                <p className="mt-0.5 text-xs opacity-90">{step.hint}</p>
              )}
            </div>
            <span className="shrink-0 font-mono text-[10px] font-bold uppercase tracking-widest">{state}</span>
          </li>
        );
      })}
    </ol>
  );
};
