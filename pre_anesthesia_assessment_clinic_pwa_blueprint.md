# Pre-Anesthesia Assessment Clinic PWA — Architecture & Minimal Source Blueprint

## 1. System Architecture (Hybrid Offline-First + NotebookLM Pipeline)

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ BUILD TIME: Antigravity MCP + Gemini Notebook (41 Anesthesia Sources)   │
│  └─ Batch-extracts structured DiseasePlan[] JSON -> src/data/diseases.json│
└────────────────────────────────────┬────────────────────────────────────┘
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ RUNTIME: React 19 + TypeScript + Vite PWA (Zero-Backend / Zero-PHI)     │
│  ├─ 1. Ephemeral Zustand Store (Session patient state + instant reset)  │
│  ├─ 2. Risk & Meds Engine (ASA, RCRI, STOP-Bang, GLP-1/SGLT2/DOAC rules)│
│  ├─ 3. Tier-1 Offline Search (MiniSearch < 2ms over bundled JSON + IDB) │
│  ├─ 4. Tier-2 Online Fallback (Edge Worker -> Gemini JSON Schema -> IDB)│
│  └─ 5. One-Tap EHR Note Compiler (Copy-ready structured clinic handoff)  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Folder Structure (6 Core Files)
```text
preop-pwa/
├── vite.config.ts              # Vite + Tailwind v4 + Workbox PWA manifest
├── api/disease-lookup.ts       # Optional Edge fallback for rare diseases
└── src/
    ├── types.ts                # Core clinical interfaces
    ├── data/diseases.json      # Pre-compiled NotebookLM knowledge base
    ├── store.ts                # Zustand ephemeral session + MiniSearch + IDB cache
    └── App.tsx                 # Single-screen clinic workflow + EHR note generator
```

---

## 2. Antigravity MCP Prompt (Extract Knowledge from Gemini Notebook)

Run this exact prompt inside Antigravity IDE connected to `notebooklm-mcp-cli` targeting your **Anesthesia nootbooks** (`1ce36864-79d5-4dbc-b3fa-51b63c6a401f`):

```text
Query notebook 1ce36864-79d5-4dbc-b3fa-51b63c6a401f using ONLY Stoelting's Anesthesia and Co-Existing Disease, Oxford Handbook of Anesthesia, 2024 AHA/ACC Perioperative Cardiovascular Guidelines, ESC 2022 Guidelines, and ASRA 5th Ed Guidelines.

Output ONLY a valid JSON array matching this TypeScript interface (no markdown prose):
interface DiseasePlan {
  id: string;
  name: string;
  aliases: string[];
  system: 'Cardiac' | 'Pulmonary' | 'Neuro' | 'Renal' | 'Endocrine' | 'Heme' | 'Hepatic' | 'Rare';
  workup: string[];
  delayTriggers: string[];
  medsContinue: string[];
  medsHold: string[];
  hemodynamics: string[];
  airwayAndTechnique: string;
  drugsAvoid: string[];
  monitoringAndDisposition: string;
  sources: string[];
}

Generate comprehensive, high-yield clinical entries for: [INSERT BATCH: e.g., HFrEF, Severe Aortic Stenosis, Hypertrophic Cardiomyopathy, COPD, Severe OSA, CKD Stage 4-5, Child-Pugh B/C Cirrhosis, Myasthenia Gravis, Pheochromocytoma, Sickle Cell Disease].
```

---

## 3. Minimal Working Source Code

### `vite.config.ts`
```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'PreOp Clinic Pro',
        short_name: 'PreOp',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        icons: [{ src: '/icon-512.png', sizes: '512x512', type: 'image/png' }],
      },
      workbox: { globPatterns: ['**/*.{js,css,html,json,png,svg}'] },
    }),
  ],
});
```

### `src/types.ts`
```ts
export interface DiseasePlan {
  id: string;
  name: string;
  aliases: string[];
  system: string;
  workup: string[];
  delayTriggers: string[];
  medsContinue: string[];
  medsHold: string[];
  hemodynamics: string[];
  airwayAndTechnique: string;
  drugsAvoid: string[];
  monitoringAndDisposition: string;
  sources: string[];
}

export interface PatientAssessment {
  age: number;
  bmi: number;
  asa: 'I' | 'II' | 'III' | 'IV' | 'E';
  surgeryRisk: 'Low (<1%)' | 'Intermediate (1-5%)' | 'High (>5%)';
  mallampati: 1 | 2 | 3 | 4;
  rcri: string[];
  stopBang: string[];
  medFlags: string[];
  selectedDiseases: DiseasePlan[];
}
```

### `src/data/diseases.json` (Starter Seed — Expand via NotebookLM MCP)
```json
[
  {
    "id": "hocm",
    "name": "Hypertrophic Cardiomyopathy (HOCM)",
    "aliases": ["HCM", "IHSS", "LVOT obstruction"],
    "system": "Cardiac",
    "workup": ["12-lead ECG", "TTE (LVOT gradient, SAM, diastolic function)", "ICD/Pacemaker interrogation"],
    "delayTriggers": ["Syncope", "Resting LVOT gradient > 50 mmHg without cardiology review", "Decompensated HF"],
    "medsContinue": ["Beta-blockers", "Non-DHP CCBs (Verapamil/Diltiazem)", "Disopyramide"],
    "medsHold": ["ACEi/ARBs (morning of surgery)", "Vasodilators/Nitrates"],
    "hemodynamics": ["Maintain preload (euvolemia)", "Maintain/increase afterload (phenylephrine)", "Normal-to-slow HR (60-70 bpm), preserve sinus rhythm"],
    "airwayAndTechnique": "GA preferred for major cases; avoid rapid drops in SVR from high-dose spinal.",
    "drugsAvoid": ["Beta-agonists (ephedrine, isoproterenol)", "Vasodilators (nitroglycerin, propofol bolus)", "Ketamine"],
    "monitoringAndDisposition": "Pre-induction arterial line; TEE for major surgery; PACU/HDU telemetry.",
    "sources": ["Stoelting's Ch. 8", "2024 AHA/ACC Guidelines"]
  },
  {
    "id": "myasthenia-gravis",
    "name": "Myasthenia Gravis (MG)",
    "aliases": ["MG", "Autoimmune neuromuscular"],
    "system": "Neuro",
    "workup": ["PFTs (FVC < 2.0 L or NIF < -20 cmH2O predicts post-op ventilation)", "Anti-AChR/MuSK titers", "Chest CT (thymoma)"],
    "delayTriggers": ["Bulbar weakness (dysphagia/dysarthria)", "Recent myasthenic crisis", "FVC < 1.5 L"],
    "medsContinue": ["Pyridostigmine (continue up to morning of surgery)", "Chronic steroids (add stress dose)"],
    "medsHold": ["None unless directed by neurology"],
    "hemodynamics": ["Avoid hypothermia, acidosis, and hypokalemia (worsen weakness)"],
    "airwayAndTechnique": "Regional/neuraxial preferred when feasible; avoid NMBDs if possible (propofol/remifentanil intubation).",
    "drugsAvoid": ["Succinylcholine (unpredictable resistance/Phase II block)", "Aminoglycosides", "Magnesium sulfate", "High-dose volatile agents"],
    "monitoringAndDisposition": "Quantitative TOF monitoring mandatory; Sugammadex if rocuronium used (10-20% standard dose); ICU/HDU if Leventhal criteria met.",
    "sources": ["Stoelting's Ch. 24", "Oxford Handbook of Anesthesia"]
  }
]
```

### `src/store.ts`
```ts
import { create } from 'zustand';
import MiniSearch from 'minisearch';
import seedDiseases from './data/diseases.json';
import { DiseasePlan, PatientAssessment } from './types';

const CACHE_KEY = 'preop_custom_diseases_v1';

const loadAllDiseases = (): DiseasePlan[] => {
  const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || '[]');
  return [...(seedDiseases as DiseasePlan[]), ...cached];
};

const buildIndex = (items: DiseasePlan[]) => {
  const ms = new MiniSearch<DiseasePlan>({
    fields: ['name', 'aliases', 'system', 'drugsAvoid', 'workup'],
    storeFields: ['id'],
    searchOptions: { boost: { name: 3, aliases: 3 }, fuzzy: 0.2, prefix: true },
  });
  ms.addAll(items);
  return ms;
};

const initialPatient: PatientAssessment = {
  age: 55,
  bmi: 28,
  asa: 'II',
  surgeryRisk: 'Intermediate (1-5%)',
  mallampati: 2,
  rcri: [],
  stopBang: [],
  medFlags: [],
  selectedDiseases: [],
};

interface ClinicStore {
  patient: PatientAssessment;
  diseases: DiseasePlan[];
  index: MiniSearch<DiseasePlan>;
  query: string;
  loadingRemote: boolean;
  setQuery: (q: string) => void;
  updatePatient: (patch: Partial<PatientAssessment>) => void;
  toggleArrayItem: (key: 'rcri' | 'stopBang' | 'medFlags', val: string) => void;
  toggleDisease: (d: DiseasePlan) => void;
  searchOnlineFallback: () => Promise<void>;
  resetPatient: () => void;
}

export const useClinicStore = create<ClinicStore>((set, get) => ({
  patient: initialPatient,
  diseases: loadAllDiseases(),
  index: buildIndex(loadAllDiseases()),
  query: '',
  loadingRemote: false,

  setQuery: (query) => set({ query }),
  updatePatient: (patch) => set((s) => ({ patient: { ...s.patient, ...patch } })),

  toggleArrayItem: (key, val) =>
    set((s) => {
      const list = s.patient[key];
      const next = list.includes(val) ? list.filter((i) => i !== val) : [...list, val];
      return { patient: { ...s.patient, [key]: next } };
    }),

  toggleDisease: (d) =>
    set((s) => {
      const exists = s.patient.selectedDiseases.some((x) => x.id === d.id);
      const next = exists
        ? s.patient.selectedDiseases.filter((x) => x.id !== d.id)
        : [...s.patient.selectedDiseases, d];
      return { patient: { ...s.patient, selectedDiseases: next } };
    }),

  searchOnlineFallback: async () => {
    const { query, diseases } = get();
    if (!query.trim()) return;
    set({ loadingRemote: true });
    try {
      const res = await fetch('/api/disease-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disease: query }),
      });
      if (!res.ok) throw new Error('Lookup failed');
      const plan: DiseasePlan = await res.json();
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || '[]');
      localStorage.setItem(CACHE_KEY, JSON.stringify([...cached, plan]));
      const updated = [...diseases, plan];
      set({ diseases: updated, index: buildIndex(updated) });
    } finally {
      set({ loadingRemote: false });
    }
  },

  resetPatient: () => set({ patient: initialPatient, query: '' }),
}));
```

### `src/App.tsx`
```tsx
import React, { useMemo, useState } from 'react';
import { useClinicStore } from './store';

const RCRI_ITEMS = ['High-risk surgery', 'Ischemic heart disease', 'CHF history', 'CVD history', 'Insulin-dependent DM', 'Cr > 2.0 mg/dL'];
const STOP_BANG_ITEMS = ['Snoring', 'Tired', 'Observed apnea', 'High BP', 'BMI > 35', 'Age > 50', 'Neck > 40cm', 'Male'];
const MED_RULES: Record<string, string> = {
  'GLP-1 Agonist': 'Hold daily 1d / weekly 1wk; assess gastric POCUS / aspiration risk',
  'SGLT2 Inhibitor': 'Hold 3-4 days pre-op (euglycemic DKA risk)',
  'DOAC (Apixaban/Rivaroxaban)': 'Hold 48-72h for high bleed/neuraxial (adjust for CrCl)',
  'ACEi / ARB': 'Hold 24h pre-op if for HTN (continue if HFrEF per 2024 AHA/ACC)',
  'Chronic Steroids': 'Give Hydrocortisone 50-100mg IV at induction for moderate/major surgery',
};

export default function App() {
  const { patient, diseases, index, query, loadingRemote, setQuery, updatePatient, toggleArrayItem, toggleDisease, searchOnlineFallback, resetPatient } = useClinicStore();
  const [copied, setCopied] = useState(false);

  const searchResults = useMemo(() => {
    if (!query.trim()) return diseases;
    const ids = new Set(index.search(query).map((r) => r.id));
    return diseases.filter((d) => ids.has(d.id));
  }, [query, diseases, index]);

  const clinicalNote = useMemo(() => {
    const sbScore = patient.stopBang.length;
    const osaRisk = sbScore >= 5 ? 'High' : sbScore >= 3 ? 'Intermediate' : 'Low';
    const diseaseBlocks = patient.selectedDiseases
      .map(
        (d) =>
          `• ${d.name.toUpperCase()} [${d.sources.join(', ')}]\n` +
          `  - Workup: ${d.workup.join('; ')}\n` +
          `  - Delay if: ${d.delayTriggers.join('; ')}\n` +
          `  - Goals: ${d.hemodynamics.join('; ')}\n` +
          `  - Technique: ${d.airwayAndTechnique} | Avoid: ${d.drugsAvoid.join(', ')}\n` +
          `  - Monitor/Post-op: ${d.monitoringAndDisposition}`
      )
      .join('\n');

    const medBlocks = patient.medFlags.map((m) => `• ${m}: ${MED_RULES[m]}`).join('\n');

    return [
      `PRE-ANESTHESIA ASSESSMENT SUMMARY`,
      `Demographics & Risk: Age ${patient.age}y | BMI ${patient.bmi} | ASA ${patient.asa} | Surgery Risk: ${patient.surgeryRisk}`,
      `Airway: Mallampati ${patient.mallampati} | STOP-Bang: ${sbScore}/8 (${osaRisk} OSA risk)`,
      `Cardiac (RCRI): ${patient.rcri.length}/6 factors (${patient.rcri.join(', ') || 'None'})`,
      medBlocks ? `\nPERIOPERATIVE MEDICATIONS:\n${medBlocks}` : '',
      diseaseBlocks ? `\nCOMORBIDITY & ANESTHETIC PLAN:\n${diseaseBlocks}` : '',
    ]
      .filter(Boolean)
      .join('\n');
  }, [patient]);

  const copyNote = () => {
    navigator.clipboard.writeText(clinicalNote);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 max-w-6xl mx-auto font-sans">
      <header className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div>
          <h1 className="text-xl font-bold text-teal-400">PreOp Clinic Pro</h1>
          <p className="text-xs text-slate-400">Offline-First Anesthesia Assessment & Disease Engine</p>
        </div>
        <button onClick={resetPatient} className="px-3 py-1.5 bg-rose-900/60 hover:bg-rose-800 text-rose-200 rounded text-sm font-medium">
          New Patient (Reset)
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT COLUMN: RISK & MEDS */}
        <section className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-3">
            <h2 className="text-sm font-semibold text-teal-300 uppercase">1. Baseline & Airway</h2>
            <div className="grid grid-cols-4 gap-2 text-xs">
              <label>Age<input type="number" value={patient.age} onChange={(e) => updatePatient({ age: +e.target.value })} className="w-full mt-1 bg-slate-800 p-1.5 rounded" /></label>
              <label>BMI<input type="number" value={patient.bmi} onChange={(e) => updatePatient({ bmi: +e.target.value })} className="w-full mt-1 bg-slate-800 p-1.5 rounded" /></label>
              <label>ASA
                <select value={patient.asa} onChange={(e) => updatePatient({ asa: e.target.value as any })} className="w-full mt-1 bg-slate-800 p-1.5 rounded">
                  {['I', 'II', 'III', 'IV', 'E'].map((v) => <option key={v}>{v}</option>)}
                </select>
              </label>
              <label>Mallampati
                <select value={patient.mallampati} onChange={(e) => updatePatient({ mallampati: +e.target.value as any })} className="w-full mt-1 bg-slate-800 p-1.5 rounded">
                  {[1, 2, 3, 4].map((v) => <option key={v}>{v}</option>)}
                </select>
              </label>
            </div>
            <select value={patient.surgeryRisk} onChange={(e) => updatePatient({ surgeryRisk: e.target.value as any })} className="w-full bg-slate-800 p-1.5 rounded text-xs">
              {['Low (<1%)', 'Intermediate (1-5%)', 'High (>5%)'].map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>

          <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-2">
            <h2 className="text-sm font-semibold text-teal-300 uppercase">2. RCRI ({patient.rcri.length}/6) & STOP-Bang ({patient.stopBang.length}/8)</h2>
            <div className="flex flex-wrap gap-1.5">
              {RCRI_ITEMS.map((item) => (
                <button key={item} onClick={() => toggleArrayItem('rcri', item)} className={`px-2 py-1 rounded text-xs ${patient.rcri.includes(item) ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-300'}`}>
                  {item}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-800">
              {STOP_BANG_ITEMS.map((item) => (
                <button key={item} onClick={() => toggleArrayItem('stopBang', item)} className={`px-2 py-1 rounded text-xs ${patient.stopBang.includes(item) ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'}`}>
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-2">
            <h2 className="text-sm font-semibold text-teal-300 uppercase">3. High-Risk Medication Alerts</h2>
            <div className="flex flex-wrap gap-1.5">
              {Object.keys(MED_RULES).map((med) => (
                <button key={med} onClick={() => toggleArrayItem('medFlags', med)} className={`px-2 py-1 rounded text-xs ${patient.medFlags.includes(med) ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-300'}`}>
                  {med}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: DISEASE SEARCH & EHR OUTPUT */}
        <section className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search disease, alias, or drug trigger (e.g. HOCM, Myasthenia, Succinylcholine)..."
                className="flex-1 bg-slate-800 px-3 py-2 rounded text-sm focus:outline-none focus:ring-1 focus:ring-teal-400"
              />
              {searchResults.length === 0 && query.trim() && (
                <button onClick={searchOnlineFallback} disabled={loadingRemote} className="px-3 py-2 bg-teal-600 hover:bg-teal-500 rounded text-xs font-semibold">
                  {loadingRemote ? 'Querying...' : '+ AI Lookup'}
                </button>
              )}
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {searchResults.map((d) => {
                const active = patient.selectedDiseases.some((x) => x.id === d.id);
                return (
                  <div key={d.id} className={`p-3 rounded border text-xs space-y-1.5 ${active ? 'bg-teal-950/40 border-teal-500' : 'bg-slate-800/70 border-slate-700'}`}>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-sm text-teal-300">{d.name} <span className="text-slate-400 font-normal">({d.system})</span></span>
                      <button onClick={() => toggleDisease(d)} className={`px-2.5 py-1 rounded font-semibold ${active ? 'bg-teal-500 text-slate-950' : 'bg-slate-700 text-white'}`}>
                        {active ? 'Added ✓' : '+ Add to Plan'}
                      </button>
                    </div>
                    <p><strong className="text-amber-300">Workup:</strong> {d.workup.join(' • ')}</p>
                    <p><strong className="text-rose-400">Delay Triggers:</strong> {d.delayTriggers.join(' • ')}</p>
                    <p><strong className="text-emerald-300">Goals & Plan:</strong> {d.hemodynamics.join('; ')} | {d.airwayAndTechnique}</p>
                    <p><strong className="text-rose-300">Avoid:</strong> {d.drugsAvoid.join(', ')} | <strong className="text-sky-300">Post-Op:</strong> {d.monitoringAndDisposition}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-2">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-semibold text-teal-300 uppercase">4. Copy-Ready EHR Pre-Op Note</h2>
              <button onClick={copyNote} className="px-3 py-1 bg-teal-600 hover:bg-teal-500 text-slate-950 font-bold rounded text-xs">
                {copied ? 'Copied!' : 'Copy Note'}
              </button>
            </div>
            <pre className="bg-slate-950 p-3 rounded border border-slate-800 text-xs text-slate-200 whitespace-pre-wrap font-mono leading-relaxed">
              {clinicalNote}
            </pre>
          </div>
        </section>
      </div>
    </div>
  );
}
```

### `api/disease-lookup.ts` (Optional Serverless Edge Fallback)
```ts
import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export default async function handler(req: Request) {
  const { disease } = await req.json();
  const res = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Provide concise, textbook-accurate preoperative and intraoperative anesthesia recommendations for: ${disease}. Cite Stoelting's, Miller's, AHA/ACC, or ASRA guidelines.`,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          name: { type: Type.STRING },
          aliases: { type: Type.ARRAY, items: { type: Type.STRING } },
          system: { type: Type.STRING },
          workup: { type: Type.ARRAY, items: { type: Type.STRING } },
          delayTriggers: { type: Type.ARRAY, items: { type: Type.STRING } },
          medsContinue: { type: Type.ARRAY, items: { type: Type.STRING } },
          medsHold: { type: Type.ARRAY, items: { type: Type.STRING } },
          hemodynamics: { type: Type.ARRAY, items: { type: Type.STRING } },
          airwayAndTechnique: { type: Type.STRING },
          drugsAvoid: { type: Type.ARRAY, items: { type: Type.STRING } },
          monitoringAndDisposition: { type: Type.STRING },
          sources: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ['id', 'name', 'aliases', 'system', 'workup', 'delayTriggers', 'medsContinue', 'medsHold', 'hemodynamics', 'airwayAndTechnique', 'drugsAvoid', 'monitoringAndDisposition', 'sources'],
      },
    },
  });
  return new Response(res.text, { headers: { 'Content-Type': 'application/json' } });
}
```

---

## 4. Quick Setup Commands
```bash
npm create vite@latest preop-pwa -- --template react-ts
cd preop-pwa
npm i zustand minisearch @google/genai
npm i -D tailwindcss @tailwindcss/vite vite-plugin-pwa
```