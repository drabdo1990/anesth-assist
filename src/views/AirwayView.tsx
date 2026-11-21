import React, { useEffect, useState } from 'react';
import { AlertOctagon, BookOpen } from 'lucide-react';
import {
  AIRWAY_EQUIPMENT_REFERENCE,
  AIRWAY_PRINCIPLES,
  AIRWAY_UNSOURCED,
  LMA_MAX_CUFF_PRESSURE_CMH2O,
  PEDS_ETT_AGE_RANGE_YEARS,
  PEDS_ETT_FORMULAS,
} from '../data/airwayDevices';
import { useAppStore } from '../store/useAppStore';
import {
  adultEttAndBlade,
  dltSizeForHeight,
  lmaSizeForWeight,
  pedsBladeForAge,
  pedsEtt,
} from '../lib/calc/airway';
import { airwaySummary } from '../lib/calc/airwaySummary';
import { BigValue } from '../components/hud/BigValue';
import { Panel } from '../components/hud/Panel';
import { NumericStepper } from '../components/ui/NumericStepper';
import { NoSourceValue } from '../components/ui/NoSourceValue';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { UnitValue } from '../components/ui/UnitValue';
import { WarningBanner } from '../components/ui/WarningBanner';

type Population = 'adult' | 'pediatric';

export const AirwayView: React.FC = () => {
  const patient = useAppStore((s) => s.patient);
  const setPatient = useAppStore((s) => s.setPatient);
  const openEmergency = useAppStore((s) => s.openEmergency);
  const [population, setPopulation] = useState<Population>(
    patient.ageYears !== null && patient.ageYears < 18 ? 'pediatric' : 'adult',
  );

  useEffect(() => {
    if (patient.ageYears !== null) {
      setPopulation(patient.ageYears < 18 ? 'pediatric' : 'adult');
    }
  }, [patient.ageYears]);
  const [ageUnit, setAgeUnit] = useState<'years' | 'months'>('years');

  const ageYears = patient.ageYears;
  const ageMonths = ageYears === null ? null : ageYears * 12;
  const pedsBlade = ageMonths === null ? null : pedsBladeForAge(ageMonths);
  const adultAgeOk = ageYears !== null && ageYears >= 18;
  const lma = patient.tbwKg !== null ? lmaSizeForWeight(patient.tbwKg) : null;
  const adultAirway = adultAgeOk && patient.sex !== null ? adultEttAndBlade(patient.sex) : null;
  const dlt = patient.heightCm !== null ? dltSizeForHeight(patient.heightCm, patient.ageYears) : null;
  const summary = airwaySummary({
    population,
    ageYears: patient.ageYears,
    sex: patient.sex,
    heightCm: patient.heightCm,
    weightKg: patient.tbwKg,
  });

  const ageDisplay = ageYears === null ? null : ageUnit === 'years' ? Math.round(ageYears * 100) / 100 : Math.round(ageYears * 12);

  return (
    <div className="flex flex-col gap-4 pb-8">
      <SegmentedControl<Population>
        ariaLabel="Population"
        value={population}
        options={[
          { value: 'adult', label: 'Adult' },
          { value: 'pediatric', label: 'Pediatric' },
        ]}
        onChange={setPopulation}
      />

      {population === 'pediatric' && (
        <Panel title="Patient">
          <SegmentedControl<'years' | 'months'>
            ariaLabel="Age unit"
            value={ageUnit}
            options={[
              { value: 'years', label: 'Years' },
              { value: 'months', label: 'Months' },
            ]}
            onChange={setAgeUnit}
          />
          <NumericStepper
            label={`Age (${ageUnit})`}
            value={ageDisplay}
            unit={ageUnit === 'years' ? 'y' : 'mo'}
            step={1}
            min={0}
            max={ageUnit === 'years' ? 18 : 216}
            decimals={ageUnit === 'years' && ageYears !== null && !Number.isInteger(ageYears) ? 2 : 0}
            onChange={(v) => setPatient({ ageYears: ageUnit === 'years' ? v : v / 12 })}
            keypadTitle="Enter age"
          />
        </Panel>
      )}

      <Panel title="Airway summary">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {summary.ett.ok ? (
            <BigValue
              label={population === 'pediatric' ? 'ETT cuffed' : 'ETT'}
              value={'idRangeMm' in summary.ett ? summary.ett.idRangeMm : summary.ett.idRoundedMm.toFixed(1)}
              unit="mm ID"
              sourceIds={'sourceIds' in summary.ett ? summary.ett.sourceIds : ['msd-peds-ett']}
            />
          ) : population === 'pediatric' ? (
            <p className="text-sm text-slate-400">{ageYears === null ? 'Enter age for ETT sizing.' : 'No sourced pediatric ETT size for this age.'}</p>
          ) : !adultAgeOk ? (
            <p className="text-sm text-slate-400">
              {ageYears === null ? 'Enter age before adult ETT sizing.' : 'Adult ETT sizing is withheld under age 18.'}
            </p>
          ) : patient.sex === null ? (
            <p className="text-sm text-slate-400">Select sex above for ETT sizing.</p>
          ) : (
            <NoSourceValue topic="ETT" compact />
          )}

          {population === 'pediatric' && summary.ettUncuffed.ok && (
            <BigValue label="ETT uncuffed" value={summary.ettUncuffed.idRoundedMm.toFixed(1)} unit="mm ID" sourceIds={['msd-peds-ett']} />
          )}

          {population === 'pediatric' && summary.ett.ok && 'depthCm' in summary.ett && (
            <BigValue label="Oral depth" value={summary.ett.depthCm.toFixed(1)} unit="cm" sourceIds={['msd-peds-ett']} />
          )}

          {population === 'adult' ? (
            summary.blade && 'ok' in summary.blade && summary.blade.ok ? (
              <BigValue label="Blade" value={summary.blade.blade} sourceIds={summary.blade.sourceIds} />
            ) : !adultAgeOk ? (
              <p className="text-sm text-slate-400">
                {ageYears === null ? 'Enter age before adult blade sizing.' : 'Adult blade sizing is withheld under age 18.'}
              </p>
            ) : patient.sex === null ? (
              <p className="text-sm text-slate-400">Select sex above for blade sizing.</p>
            ) : (
              <NoSourceValue topic="Blade" compact />
            )
          ) : summary.blade && 'blade' in summary.blade ? (
            <BigValue label="Blade" value={summary.blade.blade} sourceIds={['wikem-peds-airway']} />
          ) : ageYears === null ? (
            <p className="text-sm text-slate-400">Enter age for blade sizing.</p>
          ) : (
            <NoSourceValue topic="Blade" compact />
          )}

          {summary.lma.ok ? (
            <BigValue label="LMA" value={`LMA ${summary.lma.band.size}`} sourceIds={['teleflex-lma']} />
          ) : patient.tbwKg === null ? (
            <p className="text-sm text-slate-400">Enter weight for LMA sizing.</p>
          ) : (
            <NoSourceValue topic="LMA" compact />
          )}

          {population === 'adult' && (
            summary.dlt.ok ? (
              <BigValue label="DLT" value={summary.dlt.sizeFr} unit="Fr" sourceIds={summary.dlt.sourceIds} />
            ) : patient.heightCm === null ? (
              <p className="text-sm text-slate-400">Enter height for DLT sizing.</p>
            ) : !adultAgeOk ? (
              <p className="text-sm text-slate-400">
                {ageYears === null ? 'Enter age before DLT sizing.' : 'Adult DLT sizing is withheld under age 18.'}
              </p>
            ) : (
              <NoSourceValue topic="DLT" compact />
            )
          )}
        </div>
        {population === 'pediatric' && ageYears !== null && (() => {
          const alt = pedsEtt(ageYears, 'cuffed-iowa');
          return alt.ok ? (
            <WarningBanner level="amber" title="Sources differ (cuffed)">
              The alternate cuffed formula (age/4 + 3) gives {alt.idRoundedMm.toFixed(1)} mm. Have the adjacent sizes ready.
            </WarningBanner>
          ) : null;
        })()}
      </Panel>

      <button
        type="button"
        onClick={() => openEmergency('cico')}
        className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-red-500 bg-red-500/15 px-3 text-sm font-black uppercase text-red-200"
      >
        <AlertOctagon className="h-5 w-5" /> CICO / failed airway pathway
      </button>

      <details className="rounded-2xl border border-clinical-border bg-clinical-card p-3">
        <summary className="flex min-h-[48px] cursor-pointer items-center text-base font-bold text-slate-100">Reference</summary>
        <div className="flex flex-col gap-4 pt-3">
      <WarningBanner level="info" title="ASA difficult airway principles">
        <ul className="list-disc pl-4">
          {AIRWAY_PRINCIPLES.map((p) => (
            <li key={p.text}>{p.text}</li>
          ))}
        </ul>
      </WarningBanner>

      {population === 'pediatric' && (
        <>
          {ageYears === null ? (
            <WarningBanner level="info">Enter the child&apos;s age to size tubes and blades.</WarningBanner>
          ) : (
            <>
              <Panel title="Endotracheal tube (pediatric)" basis="age" sourceIds={['msd-peds-ett', 'iowa-peds-ett', 'asa-airway-2022']}>
                {(['cuffed-msd', 'uncuffed-msd'] as const).map((fid) => {
                  const r = pedsEtt(ageYears, fid);
                  const formula = PEDS_ETT_FORMULAS.find((f) => f.id === fid);
                  if (!r.ok) {
                    return (
                      <div key={fid}>
                        <NoSourceValue topic={`ETT ${formula?.cuffed ? 'cuffed' : 'uncuffed'}`} />
                        <p className="mt-1 text-xs text-slate-400">{r.reason}</p>
                      </div>
                    );
                  }
                  return (
                    <div key={fid} className="rounded-xl bg-slate-950 p-2">
                      <p className="text-xs font-semibold uppercase text-slate-400">{formula?.label}</p>
                      <div className="grid grid-cols-2 gap-2">
                        <UnitValue label={formula?.cuffed ? 'ETT cuffed' : 'ETT uncuffed'} value={r.idRoundedMm.toFixed(1)} unit="mm ID" size="lg" tone="cyan" />
                        <UnitValue label="Oral depth (3 x ID)" value={r.depthCm.toFixed(1)} unit="cm" size="lg" align="end" />
                      </div>
                      <p className="font-mono text-xs text-slate-400">Unrounded ID {r.idMm.toFixed(2)} mm</p>
                    </div>
                  );
                })}
                <p className="text-xs text-slate-400">
                  Source formulas cover ages {PEDS_ETT_AGE_RANGE_YEARS.min} to {PEDS_ETT_AGE_RANGE_YEARS.max} years. Confirm tube position with capnography and auscultation and check cuff pressure.
                </p>
              </Panel>

              <Panel title="Laryngoscope blade (pediatric)" basis="age" sourceIds={['wikem-peds-airway']}>
                {pedsBlade ? (
                  <UnitValue label={pedsBlade.label} value={pedsBlade.blade} unit="" size="lg" tone="cyan" />
                ) : (
                  <NoSourceValue topic="Blade for this age" />
                )}
              </Panel>
            </>
          )}
        </>
      )}

      {population === 'adult' && (
        <>
          <Panel title="Endotracheal tube & laryngoscope blade (adult)" basis="sex" sourceIds={['oxford-miller-airway']}>
            <div className="flex flex-col gap-2">
              {adultAirway && adultAirway.ok ? (
                <>
                  <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-950 p-2">
                    <UnitValue label={`ETT internal diameter (${adultAirway.sex})`} value={adultAirway.idRangeMm} unit="mm ID" size="lg" tone="cyan" />
                    <UnitValue label="Oral depth to teeth" value={adultAirway.oralDepthRangeCm} unit="cm" size="lg" align="end" />
                    <UnitValue label="Outer size" value={adultAirway.frenchRange} unit="French" size="md" />
                    <UnitValue label="Laryngoscope blade" value={adultAirway.blade} unit="" size="md" align="end" tone="cyan" />
                  </div>
                  <p className="text-xs text-slate-400">
                    Standard adult tracheal intubation sizing (Oxford Handbook & Miller&apos;s Anesthesia). Verify bilateral breath sounds and maintain cuff pressure at 20–30 cmH2O.
                  </p>
                </>
              ) : !adultAgeOk ? (
                <WarningBanner level="amber" title={ageYears === null ? 'Age required' : 'Pediatric patient'}>
                  {ageYears === null
                    ? 'Enter age before using adult ETT and blade sizing.'
                    : 'Adult ETT and blade sizing is withheld for a patient under 18. Use the Pediatric view.'}
                </WarningBanner>
              ) : patient.sex === null ? (
                <WarningBanner level="info">Select biological sex to display adult ETT sizing and blade recommendations.</WarningBanner>
              ) : (
                <NoSourceValue topic="Adult ETT and blade" />
              )}
            </div>
          </Panel>

          <Panel title="Double-lumen endobronchial tube (DLT)" basis="height" sourceIds={['oxford-miller-airway']}>
            {patient.heightCm === null ? (
              <WarningBanner level="info">Enter patient height in the biometric bar to size a left-sided double-lumen tube (DLT).</WarningBanner>
            ) : dlt && dlt.ok ? (
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-950 p-2">
                  <UnitValue label={`Height ${patient.heightCm.toFixed(0)} cm`} value={dlt.sizeFr} unit="Left DLT" size="lg" tone="cyan" />
                  <UnitValue label="Height tier" value={dlt.category.split('(')[0].trim()} unit="" size="md" align="end" />
                </div>
                <p className="text-xs text-slate-300">
                  {dlt.category}. Airway dimensions correlate with height. Chronic smokers and cystic fibrosis patients may tolerate larger sizes than predicted.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <NoSourceValue topic="DLT size for this height" />
                {dlt && !dlt.ok && <WarningBanner level="amber">{dlt.reason}</WarningBanner>}
              </div>
            )}
          </Panel>
        </>
      )}

      <Panel title="Laryngeal mask airway (LMA Classic)" basis="weight" sourceIds={['teleflex-lma', 'esafe-lma-cuff']}>
        {patient.tbwKg === null ? (
          <WarningBanner level="info">Enter actual weight to size an LMA.</WarningBanner>
        ) : lma && lma.ok ? (
          <>
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-950 p-2">
              <UnitValue label={`Weight ${patient.tbwKg.toFixed(1)} kg`} value={`LMA ${lma.band.size}`} unit="" size="xl" tone="cyan" />
              <UnitValue label="Max cuff volume (ceiling)" value={String(lma.band.maxCuffVolumeMl)} unit="mL" size="lg" align="end" />
            </div>
            {lma.borderlineNext && (
              <WarningBanner level="amber" title="On a size boundary">
                Weight sits exactly between size {lma.band.size} and size {lma.borderlineNext.size}. Choose by clinical judgment.
              </WarningBanner>
            )}
            <p className="text-xs text-slate-300">
              Maximum cuff pressure {LMA_MAX_CUFF_PRESSURE_CMH2O} cmH2O. The cuff volume is a ceiling, not a target: inflate to a seal, and measure cuff pressure. Weight-based sizing is approximate.
            </p>
          </>
        ) : (
          <NoSourceValue topic="LMA size" />
        )}
      </Panel>

      <Panel title="Oropharyngeal and nasopharyngeal airway" basis="clinical" sourceIds={['rch-airway', 'wikem-peds-airway']}>
        <ul className="list-disc pl-5 text-sm text-slate-200">
          <li>Oropharyngeal: centre of the incisors to the angle of the mandible, measured with the airway on the face.</li>
          <li>Nasopharyngeal: tip of the nose to the tragus.</li>
        </ul>
        <NoSourceValue topic="OPA / NPA size by age or sex" compact />
      </Panel>

      {AIRWAY_EQUIPMENT_REFERENCE.map((item) => (
        <Panel key={item.title} title={item.title} basis="reference" sourceIds={item.sourceIds}>
          <ul className="list-disc pl-5 text-sm text-slate-200">
            {item.points.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </Panel>
      ))}

      <button
        type="button"
        onClick={() => useAppStore.getState().setReferencesOpen(true)}
        className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-cyan-800/60 bg-cyan-950/30 px-3 text-xs font-bold text-cyan-300 hover:bg-cyan-950/60 touch-manipulation transition-colors"
      >
        <BookOpen className="h-4 w-4" /> Open sources and derived airway values
      </button>

      <section className="flex flex-col gap-2" aria-label="Items without a sourced value">
        <h3 className="text-sm font-black uppercase tracking-wider text-slate-300">No sourced value in this build</h3>
        {AIRWAY_UNSOURCED.map((t) => (
          <NoSourceValue key={t} topic={t} compact />
        ))}
      </section>
        </div>
      </details>
    </div>
  );
};
