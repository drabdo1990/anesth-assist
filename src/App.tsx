import React, { useEffect, useState } from 'react';
import { Activity, BookOpen, RefreshCw, Settings, WifiOff } from 'lucide-react';
import { useAppStore } from './store/useAppStore';
import { initNativeBridge } from './lib/nativeBridge';
import { applyPwaUpdate } from './lib/pwaUpdate';
import { BiometricHeader } from './components/BiometricHeader';
import { EmergencyOverlay } from './components/EmergencyOverlay';
import { Navigation } from './components/Navigation';
import { SettingsSheet } from './components/SettingsSheet';
import { CicoPanel } from './components/emergency/CicoPanel';
import { SegmentedControl } from './components/ui/SegmentedControl';
import { listsFor, needsBiometrics, type IntraopView } from './lib/phases';
import { AirwayView } from './views/AirwayView';
import { AssessView } from './views/AssessView';
import { MedsPanel } from './components/MedsPanel';
import { PreopNotePanel } from './components/PreopNotePanel';
import { PlansView } from './views/PlansView';
import { PostopView } from './views/PostopView';
import { ChecklistsView } from './views/ChecklistsView';
import { ConditionsView } from './views/ConditionsView';
import { DosingView } from './views/DosingView';
import { ReferencesView } from './views/ReferencesView';
import { VentilationView } from './views/VentilationView';

const INTRAOP_VIEWS: { value: IntraopView; label: string }[] = [
  { value: 'dosing', label: 'Dosing' },
  { value: 'airway', label: 'Airway' },
  { value: 'vent', label: 'Vent' },
  { value: 'lists', label: 'Lists' },
];

export const App: React.FC = () => {
  const activeTab = useAppStore((s) => s.activeTab);
  const intraopView = useAppStore((s) => s.intraopView);
  const setIntraopView = useAppStore((s) => s.setIntraopView);
  const setSettingsOpen = useAppStore((s) => s.setSettingsOpen);
  const setReferencesOpen = useAppStore((s) => s.setReferencesOpen);
  const emergencyOpen = useAppStore((s) => s.emergencyOpen);
  const updateAvailable = useAppStore((s) => s.updateAvailable);
  const cicoRunning = useAppStore((s) => s.timers.cico?.running ?? false);
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  useEffect(() => {
    const cleanup = initNativeBridge({
      getState: () => ({
        emergencyOpen: useAppStore.getState().emergencyOpen,
        settingsOpen: useAppStore.getState().settingsOpen,
        referencesOpen: useAppStore.getState().referencesOpen,
      }),
      closeEmergency: () => useAppStore.getState().closeEmergency(),
      closeSettings: () => useAppStore.getState().setSettingsOpen(false),
      closeReferences: () => useAppStore.getState().setReferencesOpen(false),
    });
    return cleanup;
  }, []);

  const iconBtn =
    'flex min-h-[48px] min-w-[48px] items-center justify-center rounded-xl border border-clinical-border bg-clinical-card text-slate-300 touch-manipulation';

  return (
    <div className="flex min-h-screen min-h-[100dvh] w-full max-w-full flex-col overflow-x-hidden bg-clinical-bg font-sans text-slate-100 selection:bg-cyan-500 selection:text-black">
      <div className="border-b border-clinical-border/80 px-3 pb-1.5 pt-[max(0.375rem,env(safe-area-inset-top))]">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-700 text-black">
              <Activity className="h-4 w-4 stroke-[2.8]" />
            </div>
            <div>
              <h1 className="text-sm font-black uppercase leading-none tracking-wider">AnesthAssist</h1>
              <p className="text-[10px] leading-tight text-slate-400">OR cognitive aid · works offline</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {!online && (
              <span className="flex items-center gap-1 rounded-full border border-amber-800 bg-amber-950/60 px-2 py-0.5 font-mono text-[10px] text-amber-300">
                <WifiOff className="h-3 w-3" /> Offline
              </span>
            )}
            <button type="button" className={iconBtn} aria-label="References" onClick={() => setReferencesOpen(true)}>
              <BookOpen className="h-5 w-5" />
            </button>
            <button type="button" className={iconBtn} aria-label="Settings" onClick={() => setSettingsOpen(true)}>
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {updateAvailable && (
        <div className="border-b border-cyan-800/60 bg-cyan-950/60 px-3 py-2">
          <button
            type="button"
            disabled={emergencyOpen || cicoRunning}
            onClick={() => void applyPwaUpdate()}
            className="mx-auto flex min-h-[48px] w-full max-w-4xl items-center justify-center gap-2 rounded-xl border border-cyan-500/60 bg-cyan-900 px-3 text-sm font-bold text-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className="h-4 w-4" />
            {emergencyOpen || cicoRunning ? 'Finish the emergency before updating' : 'Update ready: tap to reload'}
          </button>
        </div>
      )}

      {needsBiometrics(activeTab, intraopView) && <BiometricHeader />}

      <main className="mx-auto w-full max-w-4xl flex-1 p-3 sm:p-4">
        {activeTab === 'intraop' && (
          <div className="mb-3">
            <SegmentedControl<IntraopView> ariaLabel="Intra-op tools" value={intraopView} options={INTRAOP_VIEWS} onChange={setIntraopView} />
          </div>
        )}
        {activeTab === 'intraop' && intraopView === 'dosing' && <DosingView />}
        {activeTab === 'intraop' && intraopView === 'airway' && <AirwayView />}
        {activeTab === 'intraop' && intraopView === 'vent' && <VentilationView />}
        {activeTab === 'plans' && <PlansView />}
        {activeTab === 'conditions' && <ConditionsView />}
        {/* Checklist views stay mounted and are only hidden, so the handoff form keeps what was typed. */}
        <div className={activeTab === 'preop' ? '' : 'hidden'} aria-hidden={activeTab !== 'preop'}>
          <AssessView />
          <MedsPanel />
          <ChecklistsView phaseLists={listsFor('preop')} />
          <PreopNotePanel />
        </div>
        <div className={activeTab === 'intraop' && intraopView === 'lists' ? '' : 'hidden'} aria-hidden={!(activeTab === 'intraop' && intraopView === 'lists')}>
          <ChecklistsView phaseLists={listsFor('intraop')} extras={['overview']} />
        </div>
        <div className={activeTab === 'postop' ? '' : 'hidden'} aria-hidden={activeTab !== 'postop'}>
          <PostopView />
          <ChecklistsView phaseLists={listsFor('postop')} extras={['handoff']} />
        </div>
      </main>

      {/* Spacer so content clears the fixed disclaimer + navigation strip. */}
      <div className="h-[128px]" aria-hidden="true" />

      <Navigation />
      <EmergencyOverlay />
      {!emergencyOpen && cicoRunning && (
        <div className="hidden" aria-hidden="true">
          <CicoPanel />
        </div>
      )}
      <SettingsSheet />
      <ReferencesView />
    </div>
  );
};

export default App;
