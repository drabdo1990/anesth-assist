import React, { useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { KeypadModal } from '../KeypadModal';

interface NumericStepperProps {
  label: string;
  value: number | null;
  unit: string;
  step: number;
  min: number;
  max: number;
  decimals?: number;
  /** Placeholder shown while value is null. */
  emptyText?: string;
  onChange: (value: number) => void;
  /** Extra coarse step buttons, e.g. [5] adds -5 / +5. */
  coarseStep?: number;
  allowKeypad?: boolean;
  keypadTitle?: string;
}

const clamp = (n: number, min: number, max: number): number => Math.min(max, Math.max(min, n));

export const NumericStepper: React.FC<NumericStepperProps> = ({
  label,
  value,
  unit,
  step,
  min,
  max,
  decimals = 0,
  emptyText = 'Tap to enter',
  onChange,
  coarseStep,
  allowKeypad = true,
  keypadTitle,
}) => {
  const [keypadOpen, setKeypadOpen] = useState(false);
  const factor = Math.pow(10, decimals);
  const bump = (delta: number) => {
    const base = value ?? min;
    onChange(clamp(Math.round((base + delta) * factor) / factor, min, max));
  };

  const btn =
    'min-h-[48px] min-w-[48px] rounded-xl bg-slate-800 active:bg-slate-700 text-slate-100 font-mono font-bold flex items-center justify-center select-none touch-manipulation border border-slate-700/60 disabled:opacity-40';

  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</span>
      <div className="flex items-stretch gap-1.5">
        {coarseStep ? (
          <button type="button" className={`${btn} text-xs`} onClick={() => bump(-coarseStep)} disabled={value === null} aria-label={`Decrease ${label} by ${coarseStep}`}>
            -{coarseStep}
          </button>
        ) : null}
        <button type="button" className={btn} onClick={() => bump(-step)} disabled={value === null} aria-label={`Decrease ${label}`}>
          <Minus className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={() => allowKeypad && setKeypadOpen(true)}
          className="flex-1 min-h-[48px] rounded-xl bg-slate-950 border border-slate-700 hover:border-cyan-500/60 flex items-baseline justify-center gap-1 px-2 touch-manipulation"
          aria-label={`Enter ${label}`}
        >
          {value === null ? (
            <span className="self-center text-sm text-slate-400">{emptyText}</span>
          ) : (
            <>
              <span className="text-2xl font-mono font-extrabold text-cyan-300 tabular-nums">{value.toFixed(decimals)}</span>
              <span className="text-xs font-semibold text-slate-400">{unit}</span>
            </>
          )}
        </button>
        <button type="button" className={btn} onClick={() => bump(step)} disabled={value === null} aria-label={`Increase ${label}`}>
          <Plus className="w-5 h-5" />
        </button>
        {coarseStep ? (
          <button type="button" className={`${btn} text-xs`} onClick={() => bump(coarseStep)} disabled={value === null} aria-label={`Increase ${label} by ${coarseStep}`}>
            +{coarseStep}
          </button>
        ) : null}
      </div>
      {allowKeypad && (
        <KeypadModal
          title={keypadTitle ?? `Enter ${label}`}
          initialValue={value ?? min}
          unit={unit}
          min={min}
          max={max}
          allowDecimal={decimals > 0}
          isOpen={keypadOpen}
          onClose={() => setKeypadOpen(false)}
          onConfirm={(v) => onChange(clamp(Math.round(v * factor) / factor, min, max))}
        />
      )}
    </div>
  );
};
