import React from 'react';
import { AlertOctagon, AlertTriangle, Info } from 'lucide-react';

export type WarningLevel = 'info' | 'amber' | 'red';

const STYLE: Record<WarningLevel, { box: string; icon: string }> = {
  info: { box: 'bg-slate-900 border-slate-700 text-slate-200', icon: 'text-cyan-300' },
  amber: { box: 'bg-amber-500/10 border-amber-500/50 text-amber-200', icon: 'text-amber-300' },
  red: { box: 'bg-red-500/15 border-red-500 text-red-100', icon: 'text-red-300' },
};

interface WarningBannerProps {
  level: WarningLevel;
  title?: string;
  children: React.ReactNode;
}

export const WarningBanner: React.FC<WarningBannerProps> = ({ level, title, children }) => {
  const Icon = level === 'red' ? AlertOctagon : level === 'amber' ? AlertTriangle : Info;
  return (
    <div role={level === 'info' ? 'note' : 'alert'} className={`flex gap-2 rounded-xl border p-2.5 text-xs font-medium ${STYLE[level].box}`}>
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${STYLE[level].icon}`} />
      <div className="min-w-0">
        {title && <strong className="block uppercase tracking-wide">{title}</strong>}
        <div className="leading-relaxed">{children}</div>
      </div>
    </div>
  );
};
