import React from 'react';
import { AlertCircle } from 'lucide-react';

/** Permanent, non-dismissable disclaimer. Rendered once in the app shell so it shows on every screen. */
export const DisclaimerBanner: React.FC = () => (
  <aside aria-label="Clinical disclaimer" className="w-full border-t border-clinical-cyan/20 bg-clinical-card/90 px-3 py-1.5 text-center">
    <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-[11px] font-medium leading-tight text-slate-300">
      <span className="font-semibold text-cyan-300">Dr. Mohamed Abdelwahab</span>
      <span className="hidden text-slate-500 sm:inline" aria-hidden="true">·</span>
      <p className="inline-flex items-center justify-center gap-1.5">
        <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-300" />
        <span>Educational and cognitive aid. Clinical judgment supercedes all calculated suggestions.</span>
      </p>
    </div>
  </aside>
);

