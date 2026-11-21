interface SegmentedControlProps<T extends string> {
  /** null = nothing selected yet. */
  value: T | null;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  ariaLabel: string;
  tone?: 'cyan' | 'red';
}

export function SegmentedControl<T extends string>({ value, options, onChange, ariaLabel, tone = 'cyan' }: SegmentedControlProps<T>) {
  const on = tone === 'red' ? 'bg-red-500 text-white border-red-400' : 'bg-cyan-500 text-black border-cyan-400';
  return (
    <div className="flex gap-1.5" role="radiogroup" aria-label={ariaLabel}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          onClick={() => onChange(o.value)}
          className={`min-h-[48px] flex-1 rounded-xl border px-3 text-sm font-bold touch-manipulation ${
            o.value === value ? on : 'border-slate-700 bg-slate-900 text-slate-300'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
