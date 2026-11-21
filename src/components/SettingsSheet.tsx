import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { DATA_STATUS, DATA_VERSION } from '../data/sources';
import { LOCAL_OVERRIDES } from '../data/localOverrides';
import { useAppStore, type ScalarPreference } from '../store/useAppStore';
import type { GuidelineSet } from '../data/resolve';
import { DisclaimerBanner } from './DisclaimerBanner';
import { useDialogFocus } from '../lib/useDialogFocus';
import { SegmentedControl } from './ui/SegmentedControl';
import { WarningBanner } from './ui/WarningBanner';
import { setThemePreference, useThemePreference, type ThemePreference } from '../lib/theme';

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

const SCALAR_OPTIONS: { value: ScalarPreference; label: string }[] = [
  { value: 'auto', label: 'Source default' },
  { value: 'TBW', label: 'TBW' },
  { value: 'IBW', label: 'IBW' },
  { value: 'LBW', label: 'LBW' },
  { value: 'ABW40', label: 'ABW40' },
];

export const SettingsSheet: React.FC = () => {
  const open = useAppStore((s) => s.settingsOpen);
  const setOpen = useAppStore((s) => s.setSettingsOpen);
  const guidelineSet = useAppStore((s) => s.guidelineSet);
  const setGuidelineSet = useAppStore((s) => s.setGuidelineSet);
  const preferredScalar = useAppStore((s) => s.preferredScalar);
  const setPreferredScalar = useAppStore((s) => s.setPreferredScalar);
  const mhContact = useAppStore((s) => s.mhContact);
  const setMhContact = useAppStore((s) => s.setMhContact);
  const audioEnabled = useAppStore((s) => s.audioEnabled);
  const setAudioEnabled = useAppStore((s) => s.setAudioEnabled);
  const theme = useThemePreference();
  const dialogRef = useDialogFocus<HTMLDivElement>(open, () => setOpen(false));

  if (!open) return null;
  const localCount = Object.keys(LOCAL_OVERRIDES).length;

  const clearSaved = () => {
    try {
      useAppStore.persist?.clearStorage?.();
      localStorage.removeItem('anesthassist-storage');
    } catch {
      /* storage unavailable: nothing to clear */
    }
    window.location.reload();
  };

  return createPortal(
    <div onClick={() => setOpen(false)} className="fixed inset-0 z-[75] flex items-end justify-center bg-black/80 sm:items-center">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92vh] w-full max-w-lg flex-col gap-4 overflow-y-auto rounded-t-3xl border border-slate-700 bg-slate-900 p-4 sm:rounded-3xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black uppercase text-slate-100">Settings</h2>
          <button type="button" onClick={() => setOpen(false)} aria-label="Close settings" className="flex min-h-[48px] min-w-[48px] items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-slate-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        <section className="flex flex-col gap-1.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Appearance</h3>
          <SegmentedControl<ThemePreference> ariaLabel="Color theme" value={theme} options={THEME_OPTIONS} onChange={setThemePreference} />
          <p className="text-xs text-slate-400">System follows your device. The SOS screen stays dark in both themes.</p>
        </section>

        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-bold text-slate-200">Active reference set</h3>
          {localCount === 0 ? (
            <p className="text-xs text-slate-400">
              No local protocol values are loaded in this build, so the guideline values are always used. The local-protocol
              switch will appear after values are added to <code>localOverrides.ts</code>.
            </p>
          ) : (
            <>
              <SegmentedControl<GuidelineSet>
                ariaLabel="Active reference set"
                value={guidelineSet}
                options={[
                  { value: 'international', label: 'International guidelines' },
                  { value: 'local', label: 'Use local protocol' },
                ]}
                onChange={setGuidelineSet}
              />
              <p className="text-xs text-slate-400">
                Local protocol values loaded: <strong className="font-mono text-slate-200">{localCount}</strong>. A local value
                that is MORE restrictive is always used. A LESS restrictive local value is shown beside the guideline value and
                only applied when you choose &quot;Use local protocol&quot;.
              </p>
            </>
          )}
        </section>

        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-bold text-slate-200">Preferred weight scalar</h3>
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Preferred weight scalar">
            {SCALAR_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                role="radio"
                aria-checked={preferredScalar === o.value}
                onClick={() => setPreferredScalar(o.value)}
                className={`min-h-[48px] rounded-xl border px-3 text-xs font-bold ${preferredScalar === o.value ? 'border-cyan-400 bg-cyan-500 text-black' : 'border-slate-700 bg-slate-800 text-slate-300'}`}
              >
                {o.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-400">
            Applies to weight-based doses whose label does not name a weight. Doses where the label names the weight (for example rocuronium and sugammadex on actual body weight) are never overridden. You can still switch scalar on each card.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <label htmlFor="mh-contact" className="text-sm font-bold text-slate-200">
            MH hotline / local MH contact
          </label>
          <input
            id="mh-contact"
            value={mhContact}
            maxLength={60}
            onChange={(e) => setMhContact(e.target.value)}
            placeholder="Enter your local number or contact"
            autoComplete="off"
            className="min-h-[48px] rounded-xl border border-slate-700 bg-slate-950 px-3 text-base text-slate-100 focus:border-cyan-500 focus:outline-none"
          />
          <p className="text-xs text-slate-400">Left empty on purpose: no number is supplied by this app. It is saved on this device only.</p>
        </section>

        <label className="flex min-h-[48px] items-center gap-3 rounded-xl border border-slate-700 bg-slate-800 px-3 text-sm font-semibold text-slate-200">
          <input type="checkbox" className="h-6 w-6" checked={audioEnabled} onChange={(e) => setAudioEnabled(e.target.checked)} />
          Timer sounds
        </label>

        <WarningBanner level="amber" title={`Clinical data ${DATA_VERSION}`}>
          {DATA_STATUS}
        </WarningBanner>

        <section className="flex flex-col gap-2 border-t border-slate-800 pt-3">
          <h3 className="text-sm font-bold text-slate-200">What is stored on this device</h3>
          <p className="text-xs text-slate-400">
            Only these settings and anonymous checklist ticks. Patient weight, height, age, dose selections, local anesthetic entries and emergency logs are never saved.
          </p>
          <button type="button" onClick={clearSaved} className="min-h-[48px] rounded-xl border border-red-500/60 bg-red-950/40 text-sm font-bold text-red-200">
            Erase saved settings and reload
          </button>
        </section>
        <DisclaimerBanner />
      </div>
    </div>,
    document.body,
  );
};
