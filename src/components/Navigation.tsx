import React from 'react';
import { BedDouble, ClipboardList, LayoutGrid, ShieldAlert, Stethoscope, Syringe } from 'lucide-react';
import { useAppStore, type AppTab } from '../store/useAppStore';
import { DisclaimerBanner } from './DisclaimerBanner';

const TABS: { id: AppTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'preop', label: 'Pre-op', icon: ClipboardList },
  { id: 'plans', label: 'Plans', icon: LayoutGrid },
  { id: 'intraop', label: 'Intra-op', icon: Syringe },
  { id: 'postop', label: 'Post-op', icon: BedDouble },
  { id: 'conditions', label: 'Diseases', icon: Stethoscope },
];

/** Sticky bottom bar: the case phases, Plans and Diseases, plus the always-reachable red Emergency button. Tabs share the width (min-w-0) so five tabs and SOS fit a 320 px screen. */
export const Navigation: React.FC = () => {
  const activeTab = useAppStore((s) => s.activeTab);
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const openEmergency = useAppStore((s) => s.openEmergency);
  const emergencyOpen = useAppStore((s) => s.emergencyOpen);

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 transform-gpu border-t border-clinical-border bg-clinical-bg/95 pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] backdrop-blur-md">
      {/* Permanent disclaimer: pinned directly above the nav so it is visible on every screen. */}
      <DisclaimerBanner />
      <nav aria-label="Main" className="mx-auto flex max-w-4xl items-stretch gap-1 px-1.5 py-1.5">
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              aria-current={active ? 'page' : undefined}
              className={`flex min-h-[56px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-bold touch-manipulation ${
                active ? 'bg-cyan-500/15 text-cyan-300' : 'text-slate-400'
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => openEmergency()}
          aria-haspopup="dialog"
          aria-expanded={emergencyOpen}
          className="flex min-h-[56px] min-w-[64px] flex-col items-center justify-center gap-0.5 rounded-xl bg-red-500 text-[11px] font-black uppercase text-white shadow-glow-red touch-manipulation active:bg-red-600"
        >
          <ShieldAlert className="h-6 w-6" />
          SOS
        </button>
      </nav>
    </div>
  );
};
