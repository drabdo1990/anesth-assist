import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, X } from 'lucide-react';
import { useAppStore, type EmergencyKind } from '../store/useAppStore';
import { MAX_WEIGHT_KG } from '../lib/calc/biometrics';
import { useDialogFocus } from '../lib/useDialogFocus';
import { DisclaimerBanner } from './DisclaimerBanner';
import { CicoPanel } from './emergency/CicoPanel';
import { LastPanel } from './emergency/LastPanel';
import { MhPanel } from './emergency/MhPanel';
import { NumericStepper } from './ui/NumericStepper';
import { SegmentedControl } from './ui/SegmentedControl';

const OPTIONS: { value: EmergencyKind; label: string }[] = [
  { value: 'last', label: 'LAST' },
  { value: 'mh', label: 'MH' },
  { value: 'cico', label: 'CICO' },
];

export const EmergencyOverlay: React.FC = () => {
  const open = useAppStore((s) => s.emergencyOpen);
  const kind = useAppStore((s) => s.emergencyKind);
  const setKind = useAppStore((s) => s.setEmergencyKind);
  const close = useAppStore((s) => s.closeEmergency);
  const weight = useAppStore((s) => s.patient.tbwKg);
  const setPatient = useAppStore((s) => s.setPatient);
  const cicoRunning = useAppStore((s) => s.timers.cico?.running ?? false);
  const dialogRef = useDialogFocus<HTMLDivElement>(open, close);

  // Phone back gesture / hardware back button closes the overlay instead of leaving the app.
  useEffect(() => {
    if (!open) return;
    window.history.pushState({ emergency: true }, '');
    const onPop = () => close();
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('popstate', onPop);
      if (window.history.state?.emergency) window.history.back();
    };
  }, [open, close]);

  if (!open) return null;

  return createPortal(
    // The crisis screen stays dark in both themes: red-on-dark contrast and no glare in a dim OR.
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Emergency support"
      tabIndex={-1}
      data-theme="dark"
      className="fixed inset-x-0 top-0 z-[60] flex h-screen h-[100dvh] flex-col bg-clinical-bg"
    >
      <div className="flex items-center gap-2 border-b-4 border-red-500 bg-red-950 px-3 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
        <h2 className="flex-1 text-xl font-black uppercase tracking-wide text-red-100">Emergency</h2>
        <button type="button" onClick={close} aria-label="Close emergency support" className="flex min-h-[48px] min-w-[48px] items-center justify-center rounded-xl border border-red-400 bg-red-900 text-red-100">
          <X className="h-6 w-6" />
        </button>
      </div>
      <div className="border-b border-slate-800 px-3 py-2">
        <SegmentedControl<EmergencyKind> ariaLabel="Emergency type" tone="red" value={kind} options={OPTIONS} onChange={setKind} />
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-3 pb-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-3">
          {kind !== 'cico' && (
            <NumericStepper
              label="Actual body weight (used for this protocol)"
              value={weight}
              unit="kg"
              step={1}
              coarseStep={5}
              decimals={1}
              min={1}
              max={MAX_WEIGHT_KG}
              emptyText="Tap to enter actual weight"
              onChange={(v) => setPatient({ tbwKg: v })}
              keypadTitle="Enter actual weight"
            />
          )}
          {kind === 'last' && (weight !== null ? <LastPanel weightKg={weight} /> : <NeedWeight />)}
          {kind === 'mh' && (weight !== null ? <MhPanel weightKg={weight} /> : <NeedWeight />)}
          {kind === 'cico' && <CicoPanel />}
          {kind !== 'cico' && cicoRunning && (
            <div className="hidden" aria-hidden="true">
              <CicoPanel />
            </div>
          )}
        </div>
      </div>
      <div className="border-t border-slate-800 bg-clinical-bg px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={close}
          className="mx-auto flex min-h-[56px] w-full max-w-3xl items-center justify-center gap-2 rounded-xl border border-slate-500 bg-slate-800 text-base font-black uppercase text-slate-100 touch-manipulation active:bg-slate-700"
        >
          <ArrowLeft className="h-5 w-5" /> Back to app
        </button>
      </div>
      <DisclaimerBanner />
    </div>,
    document.body,
  );
};

const NeedWeight: React.FC = () => (
  <p className="rounded-2xl border-2 border-dashed border-red-500 p-4 text-center text-lg font-bold text-red-200">
    Enter actual body weight above to calculate doses.
  </p>
);
