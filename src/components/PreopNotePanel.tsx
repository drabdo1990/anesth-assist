import React, { useEffect, useMemo, useState } from 'react';
import { Check, ClipboardCopy } from 'lucide-react';
import { copyText } from '../lib/copyText';
import { ASA_CLASSES, FASTING_STATUSES, buildPreopNote, type AsaClass } from '../lib/preopNote';
import { useAppStore } from '../store/useAppStore';
import { Panel } from './hud/Panel';
import { ScoreItem } from './ScorePanel';
import { SegmentedControl } from './ui/SegmentedControl';
import { WarningBanner } from './ui/WarningBanner';

const ASA_OPTIONS = ASA_CLASSES.map((c) => ({ value: c, label: c }));

/** Pre-op note: ASA class and fasting status picks, a live preview, and a Copy button. Nothing here is stored. */
export const PreopNotePanel: React.FC = () => {
  const patient = useAppStore((s) => s.patient);
  const scoreAnswers = useAppStore((s) => s.scoreAnswers);
  const medsTaken = useAppStore((s) => s.medsTaken);
  const asaClass = useAppStore((s) => s.asaClass);
  const asaEmergency = useAppStore((s) => s.asaEmergency);
  const fastingStatus = useAppStore((s) => s.fastingStatus);
  const setAsaClass = useAppStore((s) => s.setAsaClass);
  const setAsaEmergency = useAppStore((s) => s.setAsaEmergency);
  const setFastingStatus = useAppStore((s) => s.setFastingStatus);
  const [copied, setCopied] = useState<'idle' | 'ok' | 'fail'>('idle');

  const text = useMemo(
    () =>
      buildPreopNote({
        ageYears: patient.ageYears,
        sex: patient.sex,
        tbwKg: patient.tbwKg,
        heightCm: patient.heightCm,
        creatinineUmolL: patient.creatinineUmolL,
        asaClass,
        asaEmergency,
        fasting: fastingStatus,
        scoreAnswers,
        medsTaken,
      }),
    [patient, scoreAnswers, medsTaken, asaClass, asaEmergency, fastingStatus],
  );

  // A note that changed after it was copied is no longer the copied note.
  useEffect(() => setCopied('idle'), [text]);

  return (
    <div className="mb-3 flex flex-col gap-3">
      <Panel title="Pre-op note">
        <div className="flex flex-col gap-1.5">
          <h4 className="text-sm font-bold text-slate-100">ASA physical status class</h4>
          <SegmentedControl<AsaClass> ariaLabel="ASA physical status class" value={asaClass} options={ASA_OPTIONS} onChange={setAsaClass} />
          <ScoreItem label="Emergency (E)" checked={asaEmergency} locked={false} onToggle={() => setAsaEmergency(!asaEmergency)} />
        </div>

        <div className="flex flex-col gap-1.5">
          <h4 className="text-sm font-bold text-slate-100">Fasting status</h4>
          <div role="radiogroup" aria-label="Fasting status" className="flex flex-col gap-1.5">
            {FASTING_STATUSES.map((f) => (
              <button
                key={f}
                type="button"
                role="radio"
                aria-checked={fastingStatus === f}
                onClick={() => setFastingStatus(f)}
                className={`min-h-[48px] w-full rounded-xl border p-3 text-left text-sm font-semibold touch-manipulation ${
                  fastingStatus === f ? 'border-cyan-400 bg-cyan-500 text-black' : 'border-clinical-border bg-clinical-card/50 text-slate-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <WarningBanner level="info" title="What this note contains">
          It contains the age, sex, weight, height, BMI and creatinine entered above, with no name, no identifier and no free text. It is built here, never stored, and copied only when you tap Copy. Paste it only where patient data is allowed.
        </WarningBanner>

        <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-clinical-border bg-clinical-bg/60 p-3 font-mono text-xs text-slate-200">{text}</pre>

        <button
          type="button"
          onClick={async () => setCopied((await copyText(text)) ? 'ok' : 'fail')}
          className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-cyan-500 font-black uppercase text-black"
        >
          {copied === 'ok' ? <Check className="h-5 w-5" /> : <ClipboardCopy className="h-5 w-5" />}
          {copied === 'ok' ? 'Copied' : 'Copy note to clipboard'}
        </button>
        {copied === 'fail' && <WarningBanner level="red">Copy was blocked by the browser. Select the preview text and copy it manually.</WarningBanner>}
      </Panel>
    </div>
  );
};
