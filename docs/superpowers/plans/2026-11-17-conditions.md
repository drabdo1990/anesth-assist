# Conditions Tab (Rare Diseases First) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A new **Diseases** bottom tab that searches, offline, a full list of uncommon conditions from Stoelting's *Anesthesia and Co-Existing Disease* (8th edition, 2022). Six conditions carry a sourced perioperative plan; every other entry points to its Stoelting chapter, says no plan is written yet, and offers an "Open my NotebookLM notebook" link.

**Architecture:** One data file (`src/data/conditions.ts`) holds every record, each citing a new `stoelting-8e` source. A pure `searchConditions` in `src/lib/conditionSearch.ts` does the filtering (accent-, case- and punctuation-insensitive). A `ConditionsView` renders search, list and detail. The tab is added to `AppTab` and the bottom bar, whose tabs shrink to share the width so five tabs plus SOS fit a 320 px screen.

**Tech Stack:** React 19, TypeScript, Zustand 5, Tailwind 3.4, Vitest 4.

**Spec:** `docs/superpowers/specs/2026-11-17-perioperative-guide-design.md` (§2 Conditions row, §6 Conditions tab, §10 step 7).

## Scope decisions

- **In:** the tab, the search, 110 index entries (the "full list from the start" the user asked for), and plans for the core 6: malignant hyperthermia susceptibility, acute porphyrias, myasthenia gravis, myotonic dystrophy, pheochromocytoma, carcinoid syndrome.
- **Where the list comes from:** sections of Stoelting 8e that have their own heading for an uncommon condition, read from the full text in the user's NotebookLM notebook on 2026-11-17. Common conditions (asthma, diabetes, hypertension, obesity, Parkinson disease and the like) are left out because this batch is rare-first. The list is a curated selection, not every heading in the book.
- **Plan text:** short paraphrases of the Stoelting management sections, one statement per line, no doses except where the text gives a fraction or timing (myasthenia relaxant dose cut, phenoxybenzamine stop, octreotide start). Dantrolene doses are not retyped: the MH plan links to SOS › MH, which already calculates them.
- **No live search of the notebook.** The app stays offline; the notebook link is a plain link the user taps, which opens NotebookLM in the browser and only works for accounts the notebook is shared with. The app sends nothing.
- **Out:** `medRuleIds` and `variants` from spec §3 (no med rule applies to these conditions yet, and there is one source), plans for the other entries (later batches), the Library browsing row in spec §2, comorbidities in the pre-op note.
- **Spec deviations (recorded in Task 4):** the tab label is **Diseases**, because "Conditions" (56 px at 11 px bold) does not fit a 44 px tab at 320 px; the record shape is `{ id, name, aliases, chapter, plan?, crisis?, sourceIds }` with `plan: { preop, intraop, avoid, postop }` instead of the §3 field list.

## Global Constraints

- Every clinical record cites `sourceIds` that resolve in `src/data/sources.ts`; `npm test` fails otherwise.
- No value without a source. A missing plan reads "Plan not written yet", never invented text.
- Offline-first. No clinical network call. The only outbound action is a user-tapped link.
- Patient data stays in memory only. The search text is component state: never stored, never sent.
- Bump `DATA_VERSION` for clinical data changes: `2026.11.17-draft20` → `2026.11.17-draft21` (Task 1 only).
- Touch targets at least 48 px tall.
- Theme classes only from the existing palette. The class-guard test rejects `text-slate-950`, raw hex colours, `text-<accent>-400` and `hover:text-white`.
- Copy every user-visible string and every clinical line from this plan verbatim. Do not reword.

## Review Focus

1. **Accents and punctuation:** typing "guillain barre" or "ehlers danlos" must find Guillain-Barré syndrome and Ehlers-Danlos syndrome (Task 1 test).
2. **Abbreviations:** "MH", "AIP", "pheo", "GBS" must find their condition through aliases (Task 1 test).
3. **A search that matches nothing** must say the condition is not in the app yet and offer the notebook link, never an empty screen (Task 3 manual check).
4. **An index entry without a plan** must never show plan headings or invented text; it shows the chapter pointer and the link (Task 1 schema test, Task 3 manual check).
5. **Safety-critical lines in the six plans** (succinylcholine and volatile agents in MH; etomidate, barbiturates and ketamine in porphyria; succinylcholine in myotonic dystrophy; beta blocker before alpha blockade in pheochromocytoma; octreotide before carcinoid surgery; relaxant dose cut in myasthenia) are pinned by tests so an edit cannot drop them (Task 2 test).
6. **The bottom bar at 320 px** must not scroll sideways with five tabs plus SOS (Task 3 manual check).

---

### Task 1: Source, condition index and search

**Files:**
- Modify: `src/data/sources.ts` (add the `stoelting-8e` source; bump `DATA_VERSION`)
- Create: `src/data/conditions.ts`
- Create: `src/lib/conditionSearch.ts`
- Modify: `src/data/derived.ts` (list condition records under their source)
- Modify: `src/data/__tests__/integrity.test.ts` (the textbook has no public URL)
- Test: `src/data/__tests__/conditions.test.ts`, `src/lib/__tests__/conditionSearch.test.ts`

**Interfaces:**
- Produces: `ConditionPlan`, `ConditionRecord`, `STOELTING_CHAPTERS`, `CONDITIONS`, `PLANNED_CONDITION_IDS`, `PROJECT_NOTEBOOK_URL` from `src/data/conditions.ts`; `normalize(s: string): string` and `searchConditions(query: string, list?: ConditionRecord[]): ConditionRecord[]` from `src/lib/conditionSearch.ts`.

- [ ] **Step 1: Write the failing tests**

Create `src/data/__tests__/conditions.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { CONDITIONS, PLANNED_CONDITION_IDS, STOELTING_CHAPTERS } from '../conditions';
import { SOURCE_BY_ID } from '../sources';

describe('conditions', () => {
  it('have unique ids and unique names', () => {
    expect(new Set(CONDITIONS.map((c) => c.id)).size).toBe(CONDITIONS.length);
    expect(new Set(CONDITIONS.map((c) => c.name.toLowerCase())).size).toBe(CONDITIONS.length);
  });

  it('is the full first list, so an entry cannot be dropped by accident', () => {
    expect(CONDITIONS.length).toBe(110);
  });

  it('each point to a Stoelting 8e chapter that exists', () => {
    for (const c of CONDITIONS) expect(STOELTING_CHAPTERS[c.chapter], c.id).toBeTruthy();
  });

  it('each cite Stoelting 8e, and every cited source is registered', () => {
    for (const c of CONDITIONS) {
      expect(c.sourceIds, c.id).toContain('stoelting-8e');
      for (const id of c.sourceIds) expect(SOURCE_BY_ID[id], `${c.id} -> ${id}`).toBeDefined();
    }
  });

  it('carry a plan only for the planned ids, so an index entry never shows invented text', () => {
    expect(CONDITIONS.filter((c) => c.plan).map((c) => c.id).sort()).toEqual([...PLANNED_CONDITION_IDS].sort());
    for (const c of CONDITIONS.filter((x) => !x.plan)) expect(Object.keys(c).sort(), c.id).toEqual(['aliases', 'chapter', 'id', 'name', 'sourceIds']);
  });

  it('has lower-case aliases with no duplicates within a record', () => {
    for (const c of CONDITIONS) {
      for (const a of c.aliases) expect(a, c.id).toBe(a.toLowerCase());
      expect(new Set(c.aliases).size, c.id).toBe(c.aliases.length);
    }
  });
});
```

Create `src/lib/__tests__/conditionSearch.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { CONDITIONS } from '../../data/conditions';
import { normalize, searchConditions } from '../conditionSearch';

const ids = (q: string) => searchConditions(q).map((c) => c.id);

describe('normalize', () => {
  it('drops case, accents and punctuation', () => {
    expect(normalize('Guillain-Barré  Syndrome')).toBe('guillain barre syndrome');
    expect(normalize('  Trisomy-21 ')).toBe('trisomy 21');
  });
});

describe('searchConditions', () => {
  it('lists every condition for an empty or blank query', () => {
    expect(searchConditions('').length).toBe(CONDITIONS.length);
    expect(searchConditions('   ').length).toBe(CONDITIONS.length);
  });

  it('finds names regardless of accents, case and hyphens', () => {
    expect(ids('guillain barre')).toContain('guillain-barre');
    expect(ids('EHLERS DANLOS')).toContain('ehlers-danlos');
    expect(ids('myasth')).toContain('myasthenia-gravis');
  });

  it('finds conditions by their abbreviations and other names', () => {
    expect(ids('mh')).toContain('mh-susceptibility');
    expect(ids('aip')).toContain('acute-porphyria');
    expect(ids('pheo')).toContain('pheochromocytoma');
    expect(ids('gbs')).toContain('guillain-barre');
    expect(ids('trisomy 21')).toContain('down-syndrome');
  });

  it('puts names that start with the query first', () => {
    expect(ids('myo')[0]).toMatch(/^myo/);
    expect(searchConditions('marfan')[0].id).toBe('marfan');
  });

  it('returns nothing for a query that matches no condition', () => {
    expect(searchConditions('zzqx')).toEqual([]);
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx.cmd vitest run src/data/__tests__/conditions.test.ts src/lib/__tests__/conditionSearch.test.ts`
Expected: FAIL (cannot resolve `../conditions` / `../conditionSearch`).

- [ ] **Step 3: Register the source and bump the data version**

In `src/data/sources.ts`, change `export const DATA_VERSION = '2026.11.17-draft20';` to `export const DATA_VERSION = '2026.11.17-draft21';`.

Add this entry to the `SOURCES` array directly after the entry with `id: 'miller-6e'` (after its closing `},`):

```ts
  {
    id: 'stoelting-8e',
    tag: 'Stoelting 8e',
    name: "Stoelting's Anesthesia and Co-Existing Disease, 8th Edition",
    publisher: 'Elsevier (Hines RL, Jones SB, eds.)',
    year: '2022',
    tier: 3,
    scope: ['Diseases tab: condition list with chapter pointers', 'perioperative plans for MH susceptibility, acute porphyrias, myasthenia gravis, myotonic dystrophy, pheochromocytoma and carcinoid syndrome'],
    verification: 'primary',
    accessNote:
      "Read from the book's full text in the project NotebookLM notebook on 2026-11-17. A textbook, not a guideline: the plans are short paraphrases of its management sections and need clinician review against current society guidance and local protocol.",
  },
```

The book has no public page, so it gets no `url`. In `src/data/__tests__/integrity.test.ts`, in the test `every label and guideline source has a url, except where no public page exists`, add `'stoelting-8e',` to the expected list directly after `'samba-ponv-2020',`.

- [ ] **Step 4: Create the condition index**

Create `src/data/conditions.ts`:

```ts
// Diseases tab (spec step 7): a searchable list of uncommon conditions, rare diseases first.
// Every record points to its chapter in Stoelting's Anesthesia and Co-Existing Disease, 8th edition (2022).
// Only records with a `plan` carry clinical statements; every other record is a pointer to the chapter.

export interface ConditionPlan {
  preop: string[];
  intraop: string[];
  avoid: string[];
  postop: string[];
}

export interface ConditionRecord {
  id: string;
  name: string;
  /** Lower-case other names and abbreviations the search also matches. */
  aliases: string[];
  /** Chapter number in Stoelting 8e; the title is in STOELTING_CHAPTERS. */
  chapter: number;
  plan?: ConditionPlan;
  /** The SOS panel this plan links to. */
  crisis?: 'mh';
  sourceIds: string[];
}

export const STOELTING_CHAPTERS: Record<number, string> = {
  2: 'Anesthetic Considerations for Obstructive Lung Disease',
  3: 'Restrictive Respiratory Diseases and Lung Transplantation',
  7: 'Congenital Heart Disease',
  8: 'Abnormalities of Cardiac Conduction and Cardiac Rhythm',
  10: 'Heart Failure and Cardiomyopathies',
  12: 'Vascular Disease',
  13: 'Diseases Affecting the Brain',
  14: 'Disorders of the Spine and Spinal Cord',
  15: 'Diseases of the Autonomic and Peripheral Nervous Systems',
  16: 'Diseases of the Liver and Biliary Tract',
  17: 'Diseases of the Gastrointestinal System',
  18: 'Inborn Errors of Metabolism',
  21: 'Renal Disease',
  22: 'Endocrine Disease',
  23: 'Hematologic Disorders',
  24: 'Skin and Collagen Disorders',
  26: 'Diseases Related to Immune System Dysfunction',
  27: 'Cancer',
  29: 'Psychiatric Disease, Substance Use Disorders, and Drug Overdose',
  31: 'Pediatric Diseases',
};

/** The user's own NotebookLM notebook. Opens only for accounts it is shared with; the app sends nothing to it. */
export const PROJECT_NOTEBOOK_URL = 'https://notebooklm.google.com/notebook/1ce36864-79d5-4dbc-b3fa-51b63c6a401f';

/** Conditions with a written plan. Task 2 of the conditions plan fills these in. */
export const PLANNED_CONDITION_IDS: string[] = [];

const entry = (id: string, name: string, chapter: number, aliases: string[] = []): ConditionRecord => ({
  id,
  name,
  aliases,
  chapter,
  sourceIds: ['stoelting-8e'],
});

export const CONDITIONS: ConditionRecord[] = [
  // Respiratory
  entry('cystic-fibrosis', 'Cystic fibrosis', 2, ['cf']),
  entry('primary-ciliary-dyskinesia', 'Primary ciliary dyskinesia', 2, ['kartagener syndrome', 'pcd']),
  entry('sarcoidosis', 'Sarcoidosis', 3),
  entry('lymphangioleiomyomatosis', 'Lymphangioleiomyomatosis', 3, ['lam']),
  // Heart
  entry('tetralogy-of-fallot', 'Tetralogy of Fallot', 7, ['tof', 'tet spells']),
  entry('eisenmenger-syndrome', 'Eisenmenger syndrome', 7),
  entry('transposition-great-arteries', 'Transposition of the great arteries', 7, ['tga']),
  entry('hypoplastic-left-heart', 'Hypoplastic left heart syndrome', 7, ['hlhs']),
  entry('long-qt', 'Long QT syndrome', 8, ['lqts', 'torsades de pointes']),
  entry('brugada', 'Brugada syndrome', 8),
  entry('wpw', 'Wolff-Parkinson-White syndrome', 8, ['wpw', 'pre-excitation']),
  entry('takotsubo', 'Stress (takotsubo) cardiomyopathy', 10, ['takotsubo', 'broken heart syndrome']),
  entry('peripartum-cardiomyopathy', 'Peripartum cardiomyopathy', 10, ['ppcm']),
  entry('polyarteritis-nodosa', 'Polyarteritis nodosa', 12, ['pan']),
  // Brain, spine and nerves
  entry('moyamoya', 'Moyamoya disease', 13),
  entry('chiari', 'Chiari malformation', 13, ['arnold-chiari malformation']),
  entry('tuberous-sclerosis', 'Tuberous sclerosis', 13),
  entry('neurofibromatosis', 'Neurofibromatosis', 13, ['von recklinghausen disease', 'nf1']),
  entry('huntington', 'Huntington disease', 13, ['huntington chorea']),
  entry('multiple-sclerosis', 'Multiple sclerosis', 13, ['ms']),
  entry('kearns-sayre', 'Kearns-Sayre syndrome', 13, ['kearns-sayer syndrome']),
  entry('autonomic-hyperreflexia', 'Autonomic hyperreflexia (chronic spinal cord injury)', 14, ['autonomic dysreflexia']),
  entry('als', 'Amyotrophic lateral sclerosis', 14, ['als', 'motor neuron disease', 'lou gehrig disease']),
  entry('friedreich-ataxia', 'Friedreich ataxia', 14),
  entry('multiple-system-atrophy', 'Multiple system atrophy', 15, ['msa', 'shy-drager syndrome']),
  entry('pots', 'Postural orthostatic tachycardia syndrome', 15, ['pots']),
  entry('paraganglioma', 'Paraganglioma', 15),
  entry('familial-dysautonomia', 'Familial dysautonomia', 15, ['riley-day syndrome']),
  entry('charcot-marie-tooth', 'Charcot-Marie-Tooth disease', 15, ['cmt', 'hereditary motor and sensory neuropathy']),
  entry('guillain-barre', 'Guillain-Barré syndrome', 15, ['gbs', 'acute inflammatory demyelinating polyneuropathy', 'aidp']),
  // Liver, gut and metabolism
  entry('gilbert', 'Gilbert syndrome', 16),
  entry('crigler-najjar', 'Crigler-Najjar syndrome', 16),
  entry('achalasia', 'Achalasia', 17),
  entry('zollinger-ellison', 'Zollinger-Ellison syndrome', 17, ['gastrinoma']),
  entry('carcinoid-syndrome', 'Carcinoid syndrome', 17, ['carcinoid tumor', 'carcinoid crisis', 'neuroendocrine tumor']),
  entry('acute-porphyria', 'Acute porphyrias', 18, ['porphyria', 'acute intermittent porphyria', 'aip', 'variegate porphyria', 'hereditary coproporphyria']),
  entry('lesch-nyhan', 'Lesch-Nyhan syndrome', 18),
  entry('hemochromatosis', 'Hemochromatosis', 18, ['haemochromatosis']),
  entry('wilson-disease', 'Wilson disease', 18, ['hepatolenticular degeneration']),
  // Kidney
  entry('goodpasture', 'Goodpasture syndrome', 21, ['anti-gbm disease']),
  entry('polycystic-kidney', 'Polycystic kidney disease', 21, ['adpkd']),
  entry('bartter-gitelman', 'Bartter and Gitelman syndromes', 21, ['bartter syndrome', 'gitelman syndrome']),
  entry('fanconi-syndrome', 'Fanconi syndrome', 21),
  // Endocrine
  entry('pheochromocytoma', 'Pheochromocytoma', 22, ['phaeochromocytoma', 'pheo', 'catecholamine-secreting tumor']),
  entry('insulinoma', 'Insulinoma', 22),
  entry('cushing', 'Cushing syndrome (hypercortisolism)', 22, ['hypercortisolism', 'cushing disease']),
  entry('conn', 'Primary hyperaldosteronism (Conn syndrome)', 22, ['conn syndrome', 'hyperaldosteronism']),
  entry('acromegaly', 'Acromegaly', 22),
  // Blood
  entry('thalassemia', 'Thalassemia', 23, ['thalassaemia']),
  entry('hereditary-spherocytosis', 'Hereditary spherocytosis', 23),
  entry('g6pd', 'G6PD deficiency', 23, ['glucose-6-phosphate dehydrogenase deficiency', 'favism']),
  entry('sickle-cell', 'Sickle cell disease', 23, ['sickle cell anemia', 'sickle cell anaemia', 'hbss']),
  entry('methemoglobinemia', 'Methemoglobinemia', 23, ['methaemoglobinaemia']),
  entry('polycythemia-vera', 'Polycythemia vera', 23, ['polycythaemia vera']),
  entry('hemophilia', 'Hemophilia A and B', 23, ['haemophilia', 'factor viii deficiency', 'factor ix deficiency']),
  entry('von-willebrand', 'von Willebrand disease', 23, ['vwd']),
  entry('antiphospholipid', 'Antiphospholipid syndrome', 23, ['aps', 'lupus anticoagulant']),
  // Skin and connective tissue
  entry('epidermolysis-bullosa', 'Epidermolysis bullosa', 24, ['eb']),
  entry('pemphigus', 'Pemphigus', 24),
  entry('mastocytosis', 'Mastocytosis', 24, ['urticaria pigmentosa']),
  entry('scleroderma', 'Scleroderma', 24, ['systemic sclerosis']),
  entry('pseudoxanthoma-elasticum', 'Pseudoxanthoma elasticum', 24),
  entry('ehlers-danlos', 'Ehlers-Danlos syndrome', 24, ['eds']),
  entry('marfan', 'Marfan syndrome', 24),
  // Muscle and neuromuscular junction
  entry('duchenne', 'Duchenne muscular dystrophy', 24, ['dmd', 'pseudohypertrophic muscular dystrophy']),
  entry('becker', 'Becker muscular dystrophy', 24),
  entry('limb-girdle', 'Limb-girdle muscular dystrophy', 24),
  entry('fshd', 'Facioscapulohumeral muscular dystrophy', 24, ['fshd']),
  entry('oculopharyngeal', 'Oculopharyngeal dystrophy', 24),
  entry('emery-dreifuss', 'Emery-Dreifuss muscular dystrophy', 24),
  entry('myotonic-dystrophy', 'Myotonic dystrophy', 24, ['myotonia dystrophica', 'dystrophia myotonica', 'steinert disease', 'dm1']),
  entry('nemaline', 'Nemaline rod myopathy', 24),
  entry('myotonia-congenita', 'Myotonia congenita', 24),
  entry('paramyotonia-congenita', 'Paramyotonia congenita', 24),
  entry('periodic-paralysis', 'Periodic paralysis (hyperkalemic and hypokalemic)', 24, ['hyperkalemic periodic paralysis', 'hypokalemic periodic paralysis']),
  entry('central-core', 'Central core disease', 24, ['ccd']),
  entry('centronuclear', 'Centronuclear myopathy', 24, ['myotubular myopathy']),
  entry('mitochondrial-myopathy', 'Mitochondrial myopathies', 24, ['mitochondrial disease']),
  entry('myasthenia-gravis', 'Myasthenia gravis', 24, ['mg']),
  entry('lambert-eaton', 'Lambert-Eaton myasthenic syndrome', 24, ['eaton-lambert syndrome', 'myasthenic syndrome', 'lems']),
  entry('mh-susceptibility', 'Malignant hyperthermia susceptibility', 24, ['mh', 'mhs', 'malignant hyperthermia']),
  // Bone and joints
  entry('kyphoscoliosis', 'Kyphoscoliosis', 24, ['scoliosis']),
  entry('ankylosing-spondylitis', 'Ankylosing spondylitis', 24, ['bamboo spine']),
  entry('paget', 'Paget disease of bone', 24),
  entry('achondroplasia', 'Achondroplasia', 24, ['dwarfism']),
  entry('russell-silver', 'Russell-Silver syndrome', 24, ['silver-russell syndrome']),
  entry('tracheomegaly', 'Tracheomegaly', 24, ['mounier-kuhn syndrome']),
  entry('prader-willi', 'Prader-Willi syndrome', 24),
  entry('prune-belly', 'Prune-belly syndrome', 24, ['eagle-barrett syndrome']),
  entry('meige', 'Meige syndrome', 24),
  entry('spasmodic-dysphonia', 'Spasmodic dysphonia', 24),
  entry('chondrodysplasia-calcificans', 'Chondrodysplasia calcificans', 24),
  entry('erythromelalgia', 'Erythromelalgia', 24),
  entry('klippel-feil', 'Klippel-Feil syndrome', 24),
  entry('osteogenesis-imperfecta', 'Osteogenesis imperfecta', 24, ['brittle bone disease', 'oi']),
  entry('fop', 'Fibrodysplasia ossificans progressiva', 24, ['fop']),
  // Immune, cancer and psychiatric
  entry('hereditary-angioedema', 'Hereditary angioedema', 26, ['hae', 'c1 esterase inhibitor deficiency']),
  entry('svc-syndrome', 'Superior vena cava / superior mediastinal syndrome', 27, ['anterior mediastinal mass', 'svc obstruction']),
  entry('nms', 'Neuroleptic malignant syndrome', 29, ['nms']),
  // Pediatric
  entry('cdh', 'Congenital diaphragmatic hernia', 31, ['cdh']),
  entry('ea-tef', 'Esophageal atresia and tracheoesophageal fistula', 31, ['tef', 'oesophageal atresia']),
  entry('spina-bifida', 'Spina bifida', 31, ['myelomeningocele']),
  entry('sma', 'Spinal muscular atrophy', 31, ['sma', 'werdnig-hoffmann disease']),
  entry('pierre-robin', 'Pierre Robin sequence', 31),
  entry('hemifacial-microsomia', 'Hemifacial microsomia', 31, ['goldenhar syndrome']),
  entry('treacher-collins', 'Treacher Collins syndrome', 31),
  entry('apert', 'Apert syndrome', 31),
  entry('crouzon', 'Crouzon syndrome', 31),
  entry('laryngeal-papillomatosis', 'Laryngeal papillomatosis', 31, ['recurrent respiratory papillomatosis']),
  entry('down-syndrome', 'Down syndrome (trisomy 21)', 31, ['trisomy 21']),
];
```

- [ ] **Step 5: Create the search**

Create `src/lib/conditionSearch.ts`:

```ts
import { CONDITIONS, type ConditionRecord } from '../data/conditions';

/** Lower case, accents removed, and every run of other characters turned into one space. */
export const normalize = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const byName = (a: ConditionRecord, b: ConditionRecord): number => a.name.localeCompare(b.name, 'en');

/**
 * Conditions whose name or an alias contains the query. Names that start with the query come first, then A to Z.
 * An empty query lists everything, conditions with a plan first.
 */
export const searchConditions = (query: string, list: ConditionRecord[] = CONDITIONS): ConditionRecord[] => {
  const q = normalize(query);
  if (!q) return [...list].sort((a, b) => Number(!a.plan) - Number(!b.plan) || byName(a, b));
  const starts = (c: ConditionRecord): number => (normalize(c.name).startsWith(q) ? 0 : 1);
  return list
    .filter((c) => [c.name, ...c.aliases].some((t) => normalize(t).includes(q)))
    .sort((a, b) => starts(a) - starts(b) || byName(a, b));
};
```

- [ ] **Step 6: List the records under their source in References**

In `src/data/derived.ts`, add `import { CONDITIONS } from './conditions';` after the line `import { CHOICE_SCORES } from './choiceScores';`.

Then, directly after the line `add(PONV_PLAN.sourceIds, \`PONV plan: ${PONV_PLAN.adults.headline}\`);`, add:

```ts
  for (const c of CONDITIONS) {
    add(c.sourceIds, c.plan ? `Condition plan: ${c.name} (ch. ${c.chapter})` : `Condition list entry, no plan yet: ${c.name} (ch. ${c.chapter})`);
  }
```

Do not add `stoelting-8e` to `SOURCES_WITHOUT_DERIVED_VALUES`: it now has derived values.

- [ ] **Step 7: Run the tests**

Run: `npx.cmd vitest run src/data/__tests__/conditions.test.ts src/lib/__tests__/conditionSearch.test.ts`
Expected: PASS.

Run: `npm run verify` (if vitest crashes with "heap out of memory", run `npx.cmd vitest run --maxWorkers=2` then `npm run build`, and say so).
Expected: all tests pass and the build succeeds.

- [ ] **Step 8: Commit**

```bash
git add src/data/sources.ts src/data/conditions.ts src/data/derived.ts src/lib/conditionSearch.ts src/data/__tests__/conditions.test.ts src/lib/__tests__/conditionSearch.test.ts src/data/__tests__/integrity.test.ts
git commit -m "feat(conditions): add the Stoelting 8e condition list and offline search"
```

---

### Task 2: The six plans

**Files:**
- Modify: `src/data/conditions.ts` (replace six `entry(...)` lines with full records; set `PLANNED_CONDITION_IDS`)
- Test: `src/data/__tests__/conditions.test.ts` (add plan tests)

**Interfaces:**
- Consumes: `ConditionRecord`, `ConditionPlan`, `CONDITIONS`, `PLANNED_CONDITION_IDS` from Task 1.
- Produces: six records with `plan`; the `mh-susceptibility` record has `crisis: 'mh'`.

- [ ] **Step 1: Write the failing tests**

Append to the end of `src/data/__tests__/conditions.test.ts`:

```ts
const plan = (id: string) => {
  const p = CONDITIONS.find((c) => c.id === id)?.plan;
  if (!p) throw new Error(`no plan for ${id}`);
  return p;
};
const text = (lines: string[]) => lines.join(' ');

describe('condition plans', () => {
  it('cover the core 6, rare diseases first', () => {
    expect([...PLANNED_CONDITION_IDS].sort()).toEqual(
      ['acute-porphyria', 'carcinoid-syndrome', 'mh-susceptibility', 'myasthenia-gravis', 'myotonic-dystrophy', 'pheochromocytoma'].sort(),
    );
  });

  it('have every section filled and no empty line', () => {
    for (const id of PLANNED_CONDITION_IDS) {
      const p = plan(id);
      for (const section of [p.preop, p.intraop, p.avoid, p.postop]) {
        expect(section.length, id).toBeGreaterThan(0);
        for (const l of section) expect(l.trim().length, id).toBeGreaterThan(10);
      }
    }
  });

  it('keep the safety-critical statements', () => {
    expect(text(plan('mh-susceptibility').avoid)).toMatch(/volatile/);
    expect(text(plan('mh-susceptibility').avoid)).toMatch(/Succinylcholine/);
    expect(text(plan('acute-porphyria').avoid)).toMatch(/etomidate/);
    expect(text(plan('acute-porphyria').avoid)).toMatch(/ketamine/);
    expect(text(plan('acute-porphyria').avoid)).toMatch(/Barbiturates/);
    expect(text(plan('myotonic-dystrophy').avoid)).toMatch(/Succinylcholine/);
    expect(text(plan('pheochromocytoma').avoid)).toMatch(/beta blocker before alpha blockade/);
    expect(text(plan('carcinoid-syndrome').preop)).toMatch(/octreotide 24 to 48 hours before surgery/);
    expect(text(plan('myasthenia-gravis').intraop)).toMatch(/one-half to two-thirds/);
  });

  it('send MH to the SOS panel instead of retyping dantrolene doses', () => {
    expect(CONDITIONS.find((c) => c.id === 'mh-susceptibility')?.crisis).toBe('mh');
    for (const id of PLANNED_CONDITION_IDS) expect(JSON.stringify(plan(id)), id).not.toMatch(/mg\/kg/);
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx.cmd vitest run src/data/__tests__/conditions.test.ts`
Expected: FAIL (the planned-ids test fails because the list is empty; the safety test throws `no plan for mh-susceptibility`).

- [ ] **Step 3: Write the plans**

In `src/data/conditions.ts`, change `export const PLANNED_CONDITION_IDS: string[] = [];` to:

```ts
export const PLANNED_CONDITION_IDS = [
  'mh-susceptibility',
  'acute-porphyria',
  'myasthenia-gravis',
  'myotonic-dystrophy',
  'pheochromocytoma',
  'carcinoid-syndrome',
];
```

Then replace each of these six lines in `CONDITIONS` with the record below it, keeping its position in the array.

Replace `entry('carcinoid-syndrome', 'Carcinoid syndrome', 17, ['carcinoid tumor', 'carcinoid crisis', 'neuroendocrine tumor']),` with:

```ts
  {
    id: 'carcinoid-syndrome',
    name: 'Carcinoid syndrome',
    aliases: ['carcinoid tumor', 'carcinoid crisis', 'neuroendocrine tumor'],
    chapter: 17,
    plan: {
      preop: [
        'Give octreotide 24 to 48 hours before surgery and continue it through the procedure: somatostatin analogues can prevent a carcinoid crisis.',
        'Look for right-sided heart disease (fibrosis of the tricuspid and pulmonary valves), dehydration and electrolyte loss from diarrhea, and wheezing.',
      ],
      intraop: [
        'Use invasive arterial pressure monitoring: blood pressure can change rapidly.',
        'Give octreotide again before the tumor is handled; it attenuates most adverse hemodynamic responses.',
        'Carcinoid crisis: intense flushing, diarrhea, tachycardia, and hypertension or hypotension, sometimes with bronchospasm.',
        'Bronchospasm is often resistant to treatment, and beta agonists can worsen it through mediator release; octreotide and antihistamines with ipratropium have been used.',
        'Drugs not known to release mediators: propofol, etomidate, vecuronium, cisatracurium, rocuronium, fentanyl, sufentanil, alfentanil, remifentanil and all inhalation agents (desflurane may suit liver metastases).',
        'Epidural analgesia is safe after adequate octreotide treatment if the local anesthetic is given gradually with careful hemodynamic monitoring.',
      ],
      avoid: [
        'Histamine-releasing drugs.',
        'Drugs that may provoke mediator release: succinylcholine, mivacurium, atracurium, epinephrine, norepinephrine, dopamine, isoproterenol and thiopental.',
      ],
      postop: [
        'Delayed awakening has been described; plan ICU monitoring when needed.',
        'Symptoms can persist after palliative surgery or with metastases.',
        'Ondansetron is a good antiemetic for these patients.',
      ],
    },
    sourceIds: ['stoelting-8e'],
  },
```

Replace `entry('acute-porphyria', 'Acute porphyrias', 18, ['porphyria', 'acute intermittent porphyria', 'aip', 'variegate porphyria', 'hereditary coproporphyria']),` with:

```ts
  {
    id: 'acute-porphyria',
    name: 'Acute porphyrias',
    aliases: ['porphyria', 'acute intermittent porphyria', 'aip', 'variegate porphyria', 'hereditary coproporphyria'],
    chapter: 18,
    plan: {
      preop: [
        'Ask about family history: a silent porphyria can present for the first time after a triggering drug.',
        'Examine and record any neuropathy and autonomic instability, especially before a regional block.',
        'Keep fasting short; if a long fast is unavoidable, give a glucose-containing infusion, because caloric restriction can precipitate an attack.',
        'Decide before surgery which drug in each class you may need (antibiotics, antihypertensives, antiarrhythmics and others) is safe. The American Porphyria Foundation keeps a drug database.',
      ],
      intraop: [
        'Regional anesthesia is not contraindicated, and no local anesthetic is known to have triggered an attack; watch for hypotension with autonomic neuropathy or hypovolemia.',
        'Propofol is well tolerated for induction. Nitrous oxide, isoflurane, sevoflurane and desflurane are considered safe, as are most IV opioids, depolarizing and nondepolarizing relaxants and their reversal drugs.',
        'Benzodiazepines, proton pump inhibitors and H2 blockers can be used before surgery.',
        'Expect blood pressure lability from autonomic dysfunction.',
        'Several possible triggers together are more dangerous than any single drug.',
      ],
      avoid: [
        'Barbiturates (thiopental, methohexital), etomidate and ketamine.',
        'Ketorolac, amiodarone and many calcium channel blockers (check each one before giving it).',
      ],
      postop: [
        'If an attack is suspected, watch skeletal muscle strength and cranial nerve function: weakness warns of respiratory failure and aspiration. Postoperative ventilation is rarely needed.',
        'Ondansetron or scopolamine for PONV; codeine, oxycodone, hydrocodone, acetaminophen and many NSAIDs for pain. Tramadol has insufficient evidence.',
        'Treating a crisis: remove triggers, hydrate, give carbohydrate, correct electrolytes including magnesium, and give IV heme early in a severe attack.',
      ],
    },
    sourceIds: ['stoelting-8e'],
  },
```

Replace `entry('pheochromocytoma', 'Pheochromocytoma', 22, ['phaeochromocytoma', 'pheo', 'catecholamine-secreting tumor']),` with:

```ts
  {
    id: 'pheochromocytoma',
    name: 'Pheochromocytoma',
    aliases: ['phaeochromocytoma', 'pheo', 'catecholamine-secreting tumor'],
    chapter: 22,
    plan: {
      preop: [
        'Start alpha blockade first (phenoxybenzamine most often; prazosin or doxazosin are alternatives). Aim for normal blood pressure, relief of symptoms and resolution of ST-T changes and arrhythmias. The best duration is unknown: 3 days to 2 weeks or longer.',
        'Add a beta blocker only after alpha blockade, for heart rate above 120 or arrhythmias.',
        'Phenoxybenzamine has been stopped 24 to 48 hours before surgery to avoid vascular unresponsiveness after the tumor is removed.',
        'Correct hypovolemia. A calcium channel blocker or metyrosine can be added in resistant cases.',
      ],
      intraop: [
        'Place an arterial line before induction. A central venous line is usually enough; a PA catheter or TEE helps with very active tumors or cardiac involvement.',
        'Expect systolic pressure above 200 mmHg during pneumoperitoneum and tumor handling even after alpha blockade. Have nitroprusside (the agent of choice), phentolamine, nitroglycerin, labetalol, esmolol and magnesium ready.',
        'Expect hypotension after the tumor veins are ligated: a large positive fluid balance and vasopressors are usually needed, and the response to vasopressors may be blunted. Lightening anesthesia helps.',
        'Treat ventricular arrhythmias with lidocaine or a beta blocker such as esmolol.',
        'Minimize fear, stress, pain, shivering, hypoxia and hypercarbia: all release catecholamines.',
      ],
      avoid: [
        'A nonselective beta blocker before alpha blockade: unopposed alpha vasoconstriction can cause a hypertensive crisis.',
        'Histamine releasers (morphine, atracurium).',
        'Vagolytic or sympathomimetic drugs: atropine, ketamine, pancuronium, succinylcholine.',
      ],
      postop: [
        'Check blood glucose: insulin rises after resection and hypoglycemia can occur.',
        'Give glucocorticoids after bilateral adrenalectomy or when hypoadrenalism is possible.',
        'About half of patients stay hypertensive for several days, because catecholamines take 7 to 10 days to normalize. If hypertension persists, consider a missed tumor, renal ischemia or essential hypertension.',
      ],
    },
    sourceIds: ['stoelting-8e'],
  },
```

Replace `entry('myotonic-dystrophy', 'Myotonic dystrophy', 24, ['myotonia dystrophica', 'dystrophia myotonica', 'steinert disease', 'dm1']),` with:

```ts
  {
    id: 'myotonic-dystrophy',
    name: 'Myotonic dystrophy',
    aliases: ['myotonia dystrophica', 'dystrophia myotonica', 'steinert disease', 'dm1'],
    chapter: 24,
    plan: {
      preop: [
        'Look for cardiomyopathy and conduction disease: first-degree heart block is common, and complete heart block can cause sudden death.',
        'Assess respiratory muscle weakness. Pharyngeal and chest wall weakness raise aspiration risk; central sleep apnea and hypersomnolence add to sensitivity to sedatives.',
        'Many patients reach surgery with the myotonia unrecognized.',
      ],
      intraop: [
        'Keep the patient warm and prevent shivering: cold and shivering trigger myotonia.',
        'TIVA may be preferable to volatile agents, which can aggravate cardiomyopathy and conduction problems. Expect increased sensitivity to propofol, opioids and benzodiazepines.',
        'The response to nondepolarizing relaxants is normal, but existing weakness may make them unnecessary, which also avoids neostigmine.',
        'Myotonic contraction from surgical handling or diathermy is not relieved by relaxants or general or regional anesthesia; local anesthetic infiltration of the muscle, phenytoin, quinine or procainamide may help (quinine and procainamide can worsen conduction).',
        'Epidural anesthesia is considered safe.',
      ],
      avoid: [
        'Succinylcholine: it can cause prolonged myotonia that relaxants and anesthesia cannot reverse.',
        'Other myotonia triggers: methohexital, etomidate, neostigmine, hypothermia, and mechanical or electrical stimulation.',
      ],
      postop: [
        'Watch breathing closely: weak respiratory muscles add to any residual opioid, benzodiazepine or propofol effect. Perioperative complications are mainly cardiopulmonary.',
      ],
    },
    sourceIds: ['stoelting-8e'],
  },
```

Replace `entry('myasthenia-gravis', 'Myasthenia gravis', 24, ['mg']),` with:

```ts
  {
    id: 'myasthenia-gravis',
    name: 'Myasthenia gravis',
    aliases: ['mg'],
    chapter: 24,
    plan: {
      preop: [
        'Tell the patient they may stay intubated and ventilated after surgery.',
        'After transsternal thymectomy, the need for ventilation correlated with disease longer than 6 years, pyridostigmine above 750 mg a day, vital capacity below 2.9 L and COPD unrelated to myasthenia.',
        'Bulbar weakness brings a high aspiration risk. Look for associated thyroid and other autoimmune disease.',
        'Infection, electrolyte disturbance, stress, surgery and some antibiotics (especially aminoglycosides) can worsen weakness.',
      ],
      intraop: [
        'Patients are very sensitive to nondepolarizing relaxants: if one is needed, reduce the initial dose by one-half to two-thirds and titrate with a nerve stimulator.',
        'Patients are resistant to succinylcholine (ED95 about 2.6 times normal), but usual doses still usually give adequate intubating conditions.',
        'Intubation is often possible without a relaxant, and volatile agents can reduce or remove the need for one.',
        'After rocuronium, sugammadex may reverse more reliably than neostigmine with glycopyrrolate.',
      ],
      avoid: [
        'Nondepolarizing relaxants in usual doses or without neuromuscular monitoring.',
        'Opioids for maintenance where possible: their respiratory effects can last into recovery.',
      ],
      postop: [
        'Delay extubation until respiratory function is clearly good: strength can seem adequate early and fall again a few hours later.',
        'Plan postoperative ventilation for patients who meet the risk criteria.',
      ],
    },
    sourceIds: ['stoelting-8e'],
  },
```

Replace `entry('mh-susceptibility', 'Malignant hyperthermia susceptibility', 24, ['mh', 'mhs', 'malignant hyperthermia']),` with:

```ts
  {
    id: 'mh-susceptibility',
    name: 'Malignant hyperthermia susceptibility',
    aliases: ['mh', 'mhs', 'malignant hyperthermia'],
    chapter: 24,
    plan: {
      preop: [
        'Plan a trigger-free anesthetic: any combination of sedation, TIVA or regional anesthesia.',
        'Have the MH cart with dantrolene immediately available.',
        'Treat central core disease and King-Denborough syndrome as MH susceptible unless proven otherwise; Duchenne and Becker muscular dystrophies are also highly associated.',
      ],
      intraop: [
        'Prepare the machine: remove the vaporizers, change the CO2 absorbent and the breathing circuit, and fit activated charcoal filters on the inspiratory and expiratory limbs.',
        'Flush with fresh gas at 10 to 15 L/min for 10 to 15 minutes (some authors suggest up to 60 minutes for modern machines), then confirm the gas analyzer reads zero volatile agent in both limbs.',
        'Early signs of a crisis: rising EtCO2, tachycardia, tachypnea, masseter or generalized rigidity, mixed acidosis, sweating, mottled skin, arrhythmias and labile blood pressure. A rising temperature is a later sign.',
      ],
      avoid: [
        'All halogenated volatile anesthetics: sevoflurane, desflurane, isoflurane, halothane, enflurane and methoxyflurane.',
        'Succinylcholine.',
      ],
      postop: [
        'After masseter rigidity from succinylcholine, observe for 12 to 24 hours (EtCO2, urine, creatine kinase, potassium and blood gases). MHAUS advises creatine kinase and urine myoglobin every 6 hours for 36 hours.',
        'After a crisis, admit to ICU for at least 24 hours and continue dantrolene, because recurrence is common. Crisis steps and dantrolene doses are in SOS › MH.',
      ],
    },
    crisis: 'mh',
    sourceIds: ['stoelting-8e'],
  },
```

- [ ] **Step 4: Run the tests**

Run: `npx.cmd vitest run src/data/__tests__/conditions.test.ts src/lib/__tests__/conditionSearch.test.ts`
Expected: PASS (the count stays 110, the six now have plans, and index entries still have no extra keys).

Run: `npm run verify` (or the 2-worker fallback above).
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/data/conditions.ts src/data/__tests__/conditions.test.ts
git commit -m "feat(conditions): add the first six perioperative plans from Stoelting 8e"
```

---

### Task 3: The Diseases tab

**Files:**
- Modify: `src/lib/phases.ts` (add `'conditions'` to `AppTab`)
- Modify: `src/lib/__tests__/phases.test.ts`
- Modify: `src/components/Navigation.tsx`
- Create: `src/views/ConditionsView.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `CONDITIONS`, `STOELTING_CHAPTERS`, `PROJECT_NOTEBOOK_URL`, `ConditionRecord` from `src/data/conditions.ts`; `searchConditions` from `src/lib/conditionSearch.ts`; `openEmergency(kind?)` from the store.

- [ ] **Step 1: Write the failing test**

In `src/lib/__tests__/phases.test.ts`:
- Inside `describe('listsFor', …)`, add:

```ts
  it('gives the Diseases tab no checklists of its own', () => {
    expect(listsFor('conditions')).toEqual([]);
  });
```

- In the `it.each([...])` table of `describe('needsBiometrics', …)`, add the row `['conditions', 'dosing', false],` after `['postop', 'vent', true],`.

- [ ] **Step 2: Run the type check to verify it fails**

Run: `npx.cmd tsc -b`
Expected: FAIL: `'conditions'` is not assignable to type `AppTab` (Vitest alone does not type-check, so use tsc here).

- [ ] **Step 3: Add the tab id**

In `src/lib/phases.ts`, change:

```ts
export type AppTab = 'preop' | 'plans' | 'intraop' | 'postop';
```

to:

```ts
export type AppTab = 'preop' | 'plans' | 'intraop' | 'postop' | 'conditions';
```

No other change in this file: `listsFor('conditions')` already returns `[]` and `needsBiometrics('conditions', …)` already returns `false`.

- [ ] **Step 4: Add the tab to the bottom bar**

In `src/components/Navigation.tsx`:
- Change the import line to `import { BedDouble, ClipboardList, LayoutGrid, ShieldAlert, Stethoscope, Syringe } from 'lucide-react';`
- Add `{ id: 'conditions', label: 'Diseases', icon: Stethoscope },` as the last entry of `TABS`.
- Change the comment `/** Sticky bottom bar: three case phases plus the always-reachable red Emergency button. */` to `/** Sticky bottom bar: the case phases, Plans and Diseases, plus the always-reachable red Emergency button. Tabs share the width (min-w-0) so five tabs and SOS fit a 320 px screen. */`
- In the tab button class string, change `min-w-[56px]` to `min-w-0`.
- In the SOS button class string, change `min-w-[72px]` to `min-w-[64px]`.

- [ ] **Step 5: Create the view**

Create `src/views/ConditionsView.tsx`:

```tsx
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
        Uncommon conditions from Stoelting's Anesthesia and Co-Existing Disease (8th edition). Six have a perioperative plan; the rest point to their chapter. Searching works offline and nothing you type is stored.
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
```

- [ ] **Step 6: Render it**

In `src/App.tsx`:
- Add `import { ConditionsView } from './views/ConditionsView';` after `import { ChecklistsView } from './views/ChecklistsView';`.
- After the line `{activeTab === 'plans' && <PlansView />}`, add `{activeTab === 'conditions' && <ConditionsView />}`.

- [ ] **Step 7: Run the tests**

Run: `npx.cmd vitest run src/lib/__tests__/phases.test.ts`
Expected: PASS.

Run: `npm run verify` (or the 2-worker fallback).
Expected: all pass, including the class-guard test and the build.

- [ ] **Step 8: Check by hand** (`npm run dev` on a free port; stop it afterwards)

1. The bottom bar shows Pre-op, Plans, Intra-op, Post-op, Diseases and SOS. In DevTools device mode at 320 px wide, the bar does not scroll sideways and no label is cut off.
2. Diseases opens with no biometric header. An empty search lists 110 conditions with the six "Plan" items first.
3. "guillain barre", "MH", "aip", "pheo" and "trisomy 21" each find their condition.
4. "zzqx" shows "Not in the app yet" with the notebook link.
5. A planned condition shows Pre-op, Intra-op, Avoid and Post-op, the textbook-summary banner and the Stoelting 8e source badge. Malignant hyperthermia susceptibility shows "Open MH crisis steps", which opens SOS on the MH panel.
6. An index entry (for example Marfan syndrome) shows "Plan not written yet", the chapter line and the notebook link, and no plan headings.
7. "All conditions" returns to the list. localStorage `anesthassist-storage` holds no search text.
8. Light and dark themes both read correctly.

- [ ] **Step 9: Commit**

```bash
git add src/lib/phases.ts src/lib/__tests__/phases.test.ts src/components/Navigation.tsx src/views/ConditionsView.tsx src/App.tsx
git commit -m "feat(conditions): add the Diseases tab with search, plans and the notebook link"
```

---

### Task 4: Docs

**Files:**
- Modify: `README.md`
- Modify: `docs/superpowers/specs/2026-11-17-perioperative-guide-design.md`

- [ ] **Step 1: README**

1. Find the sentence ending `that group items already in the app and add no new clinical statements.` (it appears once) and add directly after it, in the same paragraph: ` A **Diseases** tab searches, offline, a list of uncommon conditions from Stoelting's *Anesthesia and Co-Existing Disease* (8th edition): six have a perioperative plan (malignant hyperthermia susceptibility, acute porphyrias, myasthenia gravis, myotonic dystrophy, pheochromocytoma, carcinoid syndrome) and the rest point to their chapter.`
2. In the tab table, add this row directly above the row that starts `| **SOS** (red, bottom bar) |`:

```markdown
| **Diseases** | Offline search over uncommon conditions (name, other names, abbreviations; accents and hyphens ignored). Six conditions show a Pre-op / Intra-op / Avoid / Post-op plan summarized from Stoelting 8e; every other entry shows its Stoelting chapter, "Plan not written yet" and a link to the project NotebookLM notebook. |
```

3. In the paragraph starting `**Never done:**`, append at its end: ` The Diseases search runs on the device and its text is never stored; the "Open my NotebookLM notebook" link opens an external site only when you tap it, and the app sends nothing to it.`

- [ ] **Step 2: Spec**

1. Replace the whole line that begins `7. **Conditions**, in batches of about ten` with:

```markdown
7. **Conditions** (plan: `docs/superpowers/plans/2026-11-17-conditions.md`): a **Diseases** bottom tab (label "Diseases": "Conditions" does not fit a tab at 320 px; tabs now share the bar width with `min-w-0` and SOS is 64 px). An offline, accent- and punctuation-insensitive search over 110 uncommon conditions with their own section in Stoelting's *Anesthesia and Co-Existing Disease*, 8th edition (2022), read in full from the project notebook (new source `stoelting-8e`). The first plans, rare diseases first, are malignant hyperthermia susceptibility (linking to SOS › MH, no dantrolene doses retyped), acute porphyrias, myasthenia gravis, myotonic dystrophy, pheochromocytoma and carcinoid syndrome, as Pre-op / Intra-op / Avoid / Post-op lines. Every other entry shows its chapter, "Plan not written yet" and an "Open my NotebookLM notebook" link (no live notebook search: the app stays offline). Deviation from §3: the record is `{ id, name, aliases, chapter, plan?, crisis?, sourceIds }`; `medRuleIds`, `variants` and the Library browsing row are deferred. Later batches add plans to the listed entries and common comorbidities.
```

2. In §2, in the row that starts `| **Conditions** tab |`, change `| **Conditions** tab |` to `| **Diseases** tab (Conditions) |`.

- [ ] **Step 3: Run the tests**

Run: `npx.cmd vitest run --maxWorkers=2`
Expected: PASS (docs only).

- [ ] **Step 4: Commit**

```bash
git add README.md docs/superpowers/specs/2026-11-17-perioperative-guide-design.md
git commit -m "docs: record the Diseases tab in the README and spec step 7"
```
