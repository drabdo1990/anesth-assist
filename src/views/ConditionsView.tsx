import React, { useMemo, useState } from 'react';
import { ArrowLeft, ExternalLink, Search, ShieldAlert } from 'lucide-react';
import { CONDITIONS, PROJECT_NOTEBOOK_URL, STOELTING_CHAPTERS, type ConditionRecord } from '../data/conditions';
import { searchConditions } from '../lib/conditionSearch';
import { useAppStore } from '../store/useAppStore';
import { Panel } from '../components/hud/Panel';
import { WarningBanner } from '../components/ui/WarningBanner';

const chapterLine = (c: ConditionRecord): string =>
  `Stoelting's Anesthesia and Co-Existing Disease, 8th edition (2022), chapter ${c.chapter}: ${STOELTING_CHAPTERS[c.chapter]}.`;

const SECTIONS: { key: 'preop' | 'intraop' | 'avoid' | 'postop'; label: string }[] = [
  { key: 'preop', label: 'Pre-op' },
  { key: 'intraop', label: 'Intra-op' },
  { key: 'avoid', label: 'Avoid' },
  { key: 'postop', label: 'Post-op' },
];

const NotebookLink: React.FC = () => (
  <div className="flex flex-col gap-1">
    <a
      href={PROJECT_NOTEBOOK_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-clinical-border-light bg-clinical-card px-3 text-sm font-bold text-cyan-300 touch-manipulation"
    >
      <ExternalLink className="h-4 w-4" /> Open my NotebookLM notebook
    </a>
    <p className="text-[11px] text-slate-400">Opens NotebookLM in your browser and needs the internet. It works only for accounts the notebook is shared with. The app sends nothing.</p>
  </div>
);

const Detail: React.FC<{ c: ConditionRecord; onBack: () => void }> = ({ c, onBack }) => {
  const openEmergency = useAppStore((s) => s.openEmergency);
  const { plan } = c;
  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={onBack}
        className="flex min-h-[48px] items-center gap-2 self-start rounded-xl border border-clinical-border bg-clinical-card px-3 text-sm font-bold text-slate-200 touch-manipulation"
      >
        <ArrowLeft className="h-4 w-4" /> All conditions
      </button>
      <Panel title={c.name} sourceIds={c.sourceIds}>
        {c.aliases.length > 0 && <p className="text-xs text-slate-400">Also: {c.aliases.join(', ')}</p>}
        {plan ? (
          <>
            <WarningBanner level="info" title="Textbook summary">
              A short summary of {chapterLine(c)} Check current society guidance and your local protocol.
            </WarningBanner>
            {SECTIONS.map(({ key, label }) => (
              <div key={key} className="flex flex-col gap-1">
                <h4 className={`text-sm font-bold ${key === 'avoid' ? 'text-red-300' : 'text-slate-100'}`}>{label}</h4>
                <ul className="flex list-disc flex-col gap-1 pl-5 text-sm text-slate-200">
                  {plan[key].map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
            ))}
            {c.crisis === 'mh' && (
              <button
                type="button"
                onClick={() => openEmergency('mh')}
                className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-red-500 px-3 text-sm font-black uppercase text-white touch-manipulation"
              >
                <ShieldAlert className="h-5 w-5" /> Open MH crisis steps
              </button>
            )}
          </>
        ) : (
          <>
            <p className="text-sm font-bold text-slate-200">Plan not written yet.</p>
            <p className="text-sm text-slate-300">Read: {chapterLine(c)}</p>
            <NotebookLink />
          </>
        )}
      </Panel>
    </div>
  );
};

/** Diseases tab: offline search over the condition list; plans for the first six, chapter pointers for the rest. */
export const ConditionsView: React.FC = () => {
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const results = useMemo(() => searchConditions(query), [query]);
  const open = CONDITIONS.find((c) => c.id === openId);

  if (open) return <Detail c={open} onBack={() => setOpenId(null)} />;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-slate-400">
        Uncommon conditions from Stoelting's Anesthesia and Co-Existing Disease (8th edition). Each has a perioperative plan (Pre-op, Intra-op, Avoid, Post-op). Searching works offline and nothing you type is stored.
      </p>
      <label className="flex min-h-[48px] items-center gap-2 rounded-xl border border-clinical-border-light bg-clinical-card px-3 focus-within:border-cyan-500">
        <Search className="h-4 w-4 shrink-0 text-slate-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a condition or abbreviation"
          aria-label="Search conditions"
          autoComplete="off"
          enterKeyHint="search"
          className="min-w-0 flex-1 bg-transparent py-3 text-base text-slate-100 placeholder:text-slate-500 focus:outline-none"
        />
      </label>
      <p className="text-xs text-slate-400" aria-live="polite">
        {results.length} of {CONDITIONS.length} conditions
      </p>
      {results.length === 0 ? (
        <Panel title="Not in the app yet">
          <p className="text-sm text-slate-300">No condition matches "{query.trim()}". It may be under another name, or not covered yet.</p>
          <NotebookLink />
        </Panel>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {results.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => setOpenId(c.id)}
                className="flex min-h-[48px] w-full items-center justify-between gap-2 rounded-xl border border-clinical-border bg-clinical-card px-3 py-2 text-left text-sm font-semibold text-slate-100 touch-manipulation"
              >
                <span>{c.name}</span>
                <span
                  className={`shrink-0 rounded-md border px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase ${
                    c.plan ? 'border-cyan-500/60 text-cyan-300' : 'border-clinical-border-light text-slate-400'
                  }`}
                >
                  {c.plan ? 'Plan' : `Ch. ${c.chapter}`}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
