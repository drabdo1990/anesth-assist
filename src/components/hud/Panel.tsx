import React from 'react';
import { SourceBadge } from '../ui/SourceBadge';

type PanelTone = 'cyan' | 'ok' | 'amber' | 'red';

interface PanelProps {
  title: string;
  basis?: string;
  sourceIds?: string[];
  tone?: PanelTone;
  children: React.ReactNode;
}

// Literal class strings only: Tailwind purges anything built by interpolation.
const TONE: Record<PanelTone, string> = {
  cyan: 'border-clinical-cyan shadow-glow-cyan',
  ok: 'border-clinical-emerald shadow-glow-emerald',
  amber: 'border-clinical-amber shadow-glow-amber',
  red: 'border-clinical-red shadow-glow-red',
};

const TICK = 'pointer-events-none absolute h-2.5 w-2.5 border-clinical-cyan/70';

/** HUD card: hairline cyan frame with corner ticks and a mono caps title. */
export const Panel: React.FC<PanelProps> = ({ title, basis, sourceIds, tone, children }) => (
  <section className={`relative flex flex-col gap-2 rounded-2xl border bg-clinical-card p-3 ${tone ? TONE[tone] : 'border-clinical-cyan/25'}`}>
    <span aria-hidden="true" className={`${TICK} -left-px -top-px rounded-tl-2xl border-l-2 border-t-2`} />
    <span aria-hidden="true" className={`${TICK} -right-px -top-px rounded-tr-2xl border-r-2 border-t-2`} />
    <span aria-hidden="true" className={`${TICK} -bottom-px -left-px rounded-bl-2xl border-b-2 border-l-2`} />
    <span aria-hidden="true" className={`${TICK} -bottom-px -right-px rounded-br-2xl border-b-2 border-r-2`} />
    <div className="flex items-start justify-between gap-2">
      <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-clinical-cyan">{title}</h3>
      {basis && <span className="shrink-0 rounded-md border border-clinical-border-light px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase text-slate-300">Basis: {basis}</span>}
    </div>
    {children}
    {sourceIds && <SourceBadge sourceIds={sourceIds} />}
  </section>
);
