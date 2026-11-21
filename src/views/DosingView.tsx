import React, { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { CATEGORY_LABELS, CATEGORY_ORDER, CATEGORY_PLACEHOLDERS, LOCAL_ANESTHETICS, MEDICATIONS } from '../data/medications';
import { useAppStore } from '../store/useAppStore';
import { useBiometricResult } from '../store/useBiometrics';
import { DrugCard } from '../components/DrugCard';
import { LocalAnestheticPanel } from '../components/LocalAnestheticPanel';
import { NeuraxialReference } from '../components/NeuraxialReference';
import { ReferenceDrugsPanel } from '../components/ReferenceDrugsPanel';
import { OTHER_REFERENCE_FILTER, OTHER_REFERENCE_LABEL, type DosingFilter } from '../data/referenceGroups';
import { NoSourceValue } from '../components/ui/NoSourceValue';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { WarningBanner } from '../components/ui/WarningBanner';
import { SITUATIONS } from '../data/situations';

type Filter = DosingFilter;

export const DosingView: React.FC = () => {
  const [filter, setFilter] = useState<Filter>('all');
  const [situation, setSituation] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const recents = useAppStore((s) => s.recents);
  const actualWeightKg = useAppStore((s) => s.patient.tbwKg);
  const ageYears = useAppStore((s) => s.patient.ageYears);
  const result = useBiometricResult();
  const biometrics = result.ok ? result.value : null;

  const [population, setPopulation] = useState<'adult' | 'pediatric'>(
    ageYears !== null && ageYears < 18 ? 'pediatric' : 'adult',
  );

  useEffect(() => {
    if (ageYears !== null) {
      setPopulation(ageYears < 18 ? 'pediatric' : 'adult');
    }
  }, [ageYears]);

  const filteredMedications = useMemo(() => {
    if (population === 'pediatric') {
      return MEDICATIONS.filter((m) =>
        m.doses.some((d) => d.population === 'pediatric' || d.population === 'both'),
      );
    }
    return MEDICATIONS;
  }, [population]);

  const q = query.trim().toLowerCase();
  const visibleCategories = useMemo(
    () => CATEGORY_ORDER.filter((c) => filter === 'all' || filter === c),
    [filter],
  );

  const matches = (name: string, cls: string): boolean => q === '' || name.toLowerCase().includes(q) || cls.toLowerCase().includes(q);
  const recentMeds = recents.map((id) => filteredMedications.find((m) => m.id === id)).filter((m) => m !== undefined);
  const activeSituation = SITUATIONS.find((s) => s.id === situation);
  const situationMeds = activeSituation?.drugIds.map((id) => filteredMedications.find((m) => m.id === id)).filter((m) => m !== undefined) ?? [];

  if (ageYears === null) {
    return (
      <WarningBanner level="amber" title="Age required">
        Enter age in the patient bar before using the dosing calculator. This prevents adult doses being shown for an
        unknown child.
      </WarningBanner>
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-8">
      <SegmentedControl
        ariaLabel="Dosing population"
        value={population}
        options={[
          { value: 'adult', label: 'Adult' },
          { value: 'pediatric', label: 'Pediatric' },
        ]}
        onChange={(v) => setPopulation(v)}
      />

      {ageYears !== null && ageYears < 18 && population === 'adult' && (
        <WarningBanner level="amber" title="Adult reference mode">
          Showing adult reference doses for a pediatric patient.
        </WarningBanner>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          inputMode="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value !== '') setSituation(null);
          }}
          placeholder="Search drug or class"
          className="min-h-[48px] w-full rounded-xl border border-slate-800 bg-slate-900 pl-10 pr-3 text-sm text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          aria-label="Search drugs"
        />
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1" role="group" aria-label="Dosing situations">
        {([{ id: null, label: 'All drugs' }, ...SITUATIONS] as { id: string | null; label: string }[]).map((s) => (
          <button
            key={s.id ?? 'all'}
            type="button"
            aria-pressed={situation === s.id}
            onClick={() => {
              setSituation(s.id);
              if (s.id !== null) {
                setQuery('');
                setFilter('all');
              }
            }}
            className={`min-h-[48px] shrink-0 rounded-xl border px-3 text-xs font-bold ${situation === s.id ? 'border-cyan-400 bg-cyan-500 text-black' : 'border-slate-800 bg-slate-900 text-slate-300'}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {situation === null && (
      <div className="flex gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label="Drug categories">
        {([
          { id: 'all', label: 'All' },
          ...CATEGORY_ORDER.map((c) => ({ id: c, label: CATEGORY_LABELS[c] })),
          { id: OTHER_REFERENCE_FILTER, label: OTHER_REFERENCE_LABEL },
        ] as { id: Filter; label: string }[]).map((c) => (
          <button
            key={c.id}
            type="button"
            role="tab"
            aria-selected={filter === c.id}
            onClick={() => setFilter(c.id)}
            className={`min-h-[48px] shrink-0 rounded-xl border px-3 text-xs font-bold ${filter === c.id ? 'border-cyan-400 bg-cyan-500 text-black' : 'border-slate-800 bg-slate-900 text-slate-300'}`}
          >
            {c.label}
          </button>
        ))}
      </div>
      )}

      {activeSituation && (
        <>
          <p className="rounded-lg border border-amber-800 bg-amber-950/40 px-3 py-2 text-xs text-amber-200">
            App grouping, not a guideline. Doses come from each card&apos;s sources.
          </p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {situationMeds.map((m) => (
              <DrugCard key={m.id} medication={m} biometrics={biometrics} population={population} />
            ))}
          </div>
        </>
      )}

      {situation === null && filter === 'all' && q === '' && recentMeds.length > 0 && (
        <p className="text-xs text-slate-400">
          Recently used: {recentMeds.map((m) => m?.name).join(', ')}
        </p>
      )}

      {situation === null && visibleCategories.map((cat) => {
        const meds = filteredMedications.filter((m) => m.category === cat && matches(m.name, m.class));
        const placeholders = CATEGORY_PLACEHOLDERS.filter((p) => p.category === cat && (q === '' || p.topic.toLowerCase().includes(q)));
        if (
          cat === 'local' &&
          q !== '' &&
          !'local anesthetic'.includes(q) &&
          !LOCAL_ANESTHETICS.some((a) => a.name.toLowerCase().includes(q) || a.id.includes(q))
        ) {
          return null;
        }
        if (meds.length === 0 && placeholders.length === 0 && cat !== 'local') return null;
        return (
          <section key={cat} className="flex flex-col gap-3" aria-label={CATEGORY_LABELS[cat]}>
            <h2 className="text-sm font-black uppercase tracking-wider text-cyan-300">{CATEGORY_LABELS[cat]}</h2>
            {cat === 'local' ? (
              <>
                <LocalAnestheticPanel weightKg={actualWeightKg} />
                <NeuraxialReference />
              </>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {meds.map((m) => (
                  <DrugCard key={m.id} medication={m} biometrics={biometrics} population={population} />
                ))}
                {placeholders.map((p) => (
                  <NoSourceValue key={p.topic} topic={p.topic} />
                ))}
              </div>
            )}
          </section>
        );
      })}

      {situation === null && <ReferenceDrugsPanel query={q} filter={filter} />}
    </div>
  );
};
