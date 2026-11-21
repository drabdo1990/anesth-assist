import React from 'react';
import type { MedicationConcentration } from '../../data/types';

interface ConcentrationSelectorProps {
  options: MedicationConcentration[];
  selectedIndex: number;
  onChange: (index: number) => void;
}

export const ConcentrationSelector: React.FC<ConcentrationSelectorProps> = ({ options, selectedIndex, onChange }) => (
  <div className="flex flex-col gap-1">
    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Concentration</span>
    <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Concentration">
      {options.map((c, i) => {
        const selected = i === selectedIndex;
        return (
          <button
            key={c.label}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(i)}
            className={`min-h-[48px] rounded-xl border px-3 text-xs font-mono font-bold touch-manipulation ${
              selected ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200' : 'border-slate-700 bg-slate-900 text-slate-300'
            }`}
          >
            {c.label}
            {c.requiresDilution && <span className="ml-1 text-amber-300" title="Dilute before IV use">!</span>}
          </button>
        );
      })}
    </div>
  </div>
);
