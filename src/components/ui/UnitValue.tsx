import React from 'react';

export type ValueTone = 'neutral' | 'cyan' | 'amber' | 'red' | 'emerald';
type ValueSize = 'sm' | 'md' | 'lg' | 'xl';

const TONE: Record<ValueTone, string> = {
  neutral: 'text-slate-100',
  cyan: 'text-cyan-300',
  amber: 'text-amber-300',
  red: 'text-red-300',
  emerald: 'text-emerald-300',
};

const SIZE: Record<ValueSize, string> = {
  sm: 'text-base',
  md: 'text-xl',
  lg: 'text-3xl',
  xl: 'text-5xl',
};

interface UnitValueProps {
  value: string;
  unit: string;
  tone?: ValueTone;
  size?: ValueSize;
  label?: string;
  align?: 'start' | 'end';
}

/** Large monospaced number with an explicit unit. Tabular figures prevent visual jitter. */
export const UnitValue: React.FC<UnitValueProps> = ({ value, unit, tone = 'neutral', size = 'md', label, align = 'start' }) => (
  <div className={`flex flex-col ${align === 'end' ? 'items-end' : 'items-start'}`}>
    {label && <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</span>}
    <span className="flex items-baseline gap-1">
      <span className={`font-mono font-black tabular-nums tracking-tight ${SIZE[size]} ${TONE[tone]}`}>{value}</span>
      <span className="text-xs font-semibold text-slate-400">{unit}</span>
    </span>
  </div>
);
