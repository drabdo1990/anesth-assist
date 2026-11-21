import React from 'react';
import { SOURCE_BY_ID } from '../../data/sources';
import { useAppStore } from '../../store/useAppStore';

interface SourceBadgeProps {
  sourceIds: string[];
}

/** One chip per distinct source tag. Amber dot = primary text not accessed in this build. */
export const SourceBadge: React.FC<SourceBadgeProps> = ({ sourceIds }) => {
  const setReferencesOpen = useAppStore((s) => s.setReferencesOpen);
  const seen = new Map<string, { names: string[]; secondary: boolean }>();
  for (const id of sourceIds) {
    const s = SOURCE_BY_ID[id];
    if (!s) continue;
    const entry = seen.get(s.tag) ?? { names: [], secondary: false };
    entry.names.push(`${s.name} (${s.year})`);
    entry.secondary = entry.secondary || s.verification === 'secondary';
    seen.set(s.tag, entry);
  }
  return (
    <div className="flex flex-wrap items-center gap-1">
      {[...seen.entries()].map(([tag, e]) => (
        <button
          key={tag}
          type="button"
          onClick={() => setReferencesOpen(true)}
          title={`${e.names.join('; ')}${e.secondary ? ' - primary text not fully verified; see References' : ''}`}
          className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-900 px-1.5 py-0.5 text-[10px] font-semibold text-slate-300 hover:border-cyan-500/50"
        >
          {e.secondary && <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" aria-label="primary text not fully verified" />}
          {tag}
        </button>
      ))}
    </div>
  );
};
