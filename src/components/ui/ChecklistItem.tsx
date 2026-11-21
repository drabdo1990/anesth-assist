import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';

interface ChecklistItemProps {
  checked: boolean;
  onToggle: () => void;
  label: string;
  note?: string;
  critical?: boolean;
  /** Larger text for emergency screens. */
  large?: boolean;
}

export const ChecklistItem: React.FC<ChecklistItemProps> = ({ checked, onToggle, label, note, critical, large }) => (
  <button
    type="button"
    role="checkbox"
    aria-checked={checked}
    onClick={onToggle}
    className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left select-none touch-manipulation min-h-[48px] transition-colors ${
      checked
        ? 'border-clinical-emerald/50 bg-emerald-950/40 text-emerald-100'
        : critical
          ? 'border-clinical-border-light bg-clinical-bg/80 text-slate-100'
          : 'border-clinical-border bg-clinical-card/50 text-slate-200'
    }`}
  >
    {checked ? (
      <CheckCircle2 className={`mt-0.5 shrink-0 text-emerald-300 ${large ? 'h-7 w-7' : 'h-5 w-5'}`} />
    ) : (
      <Circle className={`mt-0.5 shrink-0 ${critical ? 'text-red-300' : 'text-slate-500'} ${large ? 'h-7 w-7' : 'h-5 w-5'}`} />
    )}
    <span className="min-w-0 flex-1">
      <span className={`block font-semibold leading-snug ${large ? 'text-lg' : 'text-sm'} ${checked ? 'line-through opacity-70' : ''}`}>{label}</span>
      {note && !checked && <span className={`mt-1 block text-slate-400 ${large ? 'text-sm' : 'text-xs'}`}>{note}</span>}
    </span>
  </button>
);
