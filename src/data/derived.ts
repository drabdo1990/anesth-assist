// Builds the "clinical values derived from each source" index shown in the References view.
// Generated from the data files, so it can never drift from what the app actually uses.

import { AIRWAY_EQUIPMENT_REFERENCE, AIRWAY_RULES, LMA_BANDS, PEDS_BLADES, PEDS_ETT_FORMULAS } from './airwayDevices';
import { CICO_PLANS, LAST_STEPS, MH_STEPS } from './emergencies';
import { LOCAL_ANESTHETICS, MEDICATIONS } from './medications';
import { VENTILATION_SCENARIOS, VENT_ADVANCED_REFERENCE, VENT_ALARMS, VENT_MODES, VENT_TROUBLESHOOTING } from './ventilation';
import { CHECKLISTS } from './checklists';
import { CHOICE_SCORES } from './choiceScores';
import { CONDITIONS } from './conditions';
import { GLP1_PROTOCOLS } from './glp1Protocols';
import { NEURAXIAL_REGIMENS } from './neuraxial';
import { PERIOP_RULES } from './periopMeds';
import { PONV_PLAN } from './ponvPlan';
import { REFERENCE_DRUGS } from './referenceDrugs';
import { POSTOP_SCORES, RISK_SCORES } from './riskScores';
import { SOURCES } from './sources';

const range = (min: number | undefined, max: number | undefined, def: number | undefined): string => {
  const lo = min ?? def;
  const hi = max ?? def;
  if (lo === undefined) return '';
  return hi === undefined || hi === lo ? `${lo}` : `${lo}-${hi}`;
};

/** Values the app derives from sources that have no per-record sourceIds. */
const PRINCIPLE_SOURCES: Record<string, string[]> = {
  'cas-2025': ['Total cumulative local anesthetic dose should be discussed and documented (principle shown in the local anesthetic calculator)'],
  'asra-last-2020': ['20% lipid emulsion: >= 70 kg 100 mL bolus then 250 mL over 15-20 min; < 70 kg 1.5 mL/kg bolus then 0.25 mL/kg/min; maximum 12 mL/kg'],
  mhaus: ['Dantrolene initial dose 2.5 mg/kg on actual body weight'],
  'ats-ards-2017': ['ARDS tidal volume 4-8 mL/kg PBW (default 6); plateau pressure limit 30 cmH2O'],
  // Negative findings: the label was read and contains no usable value, so none is encoded.
  'label-dexamethasone': ['Label has no PONV indication or dose: no dexamethasone PONV dose is encoded (shown as "No high-quality source value specified")'],
  'label-mepivacaine': ['Label lists volumes by procedure and gives no mg or mg/kg maximum: the mepivacaine maximum comes from Rosenberg 2004 instead'],
  'cockcroft-gault-1976': ['Creatinine clearance (mL/min) = (140 - age) x actual weight (kg) / (72 x serum creatinine in mg/dL), x 0.85 for women; adults only (shown in the Pre-op Assess section)'],
};

export const derivedValuesBySource = (): Record<string, string[]> => {
  const out: Record<string, string[]> = Object.fromEntries(SOURCES.map((s) => [s.id, [] as string[]]));
  const add = (ids: string[], text: string): void => {
    for (const id of ids) out[id]?.push(text);
  };

  for (const m of MEDICATIONS) {
    for (const d of m.doses) {
      const max = d.absoluteMax ? `; ceiling ${d.absoluteMax.value} ${d.absoluteMax.unit}` : '';
      add(d.sourceIds, `${m.name}: ${d.indication}: ${range(d.min, d.max, d.default)} ${d.unit}${d.scalar ? ` (${d.scalar})` : ''}${max}`);
    }
    for (const c of m.concentrations) add([c.sourceId], `${m.name}: concentration ${c.label}`);
    if (m.companion) add([m.companion.sourceId], `${m.name}: ${m.companion.name} ${m.companion.ratioMgPerMg} mg per mg`);
  }

  for (const la of LOCAL_ANESTHETICS) {
    for (const [name, rec] of [['plain', la.plain], ['with epinephrine', la.withEpinephrine]] as const) {
      if (!rec) continue;
      const parts = [rec.mgPerKg !== undefined ? `${rec.mgPerKg} mg/kg` : null, rec.absoluteMaxMg !== undefined ? `${rec.absoluteMaxMg} mg` : null].filter(Boolean).join(', ');
      add(rec.sourceIds, `${la.name} ${name}: maximum ${parts}`);
    }
    for (const a of la.alternates ?? []) {
      add([a.sourceId], `${la.name}: ${a.label}: ${a.absoluteMaxMg !== undefined ? `${a.absoluteMaxMg} mg` : `${a.mgPerKg} mg/kg`}`);
    }
  }

  for (const d of REFERENCE_DRUGS) add(d.sourceIds, `Reference drug (not calculated): ${d.name}`);

  for (const item of AIRWAY_EQUIPMENT_REFERENCE) add(item.sourceIds, `Airway equipment reference: ${item.title}`);
  for (const item of VENT_ADVANCED_REFERENCE) add(item.sourceIds, `Ventilation reference: ${item.title}`);

  for (const r of NEURAXIAL_REGIMENS) {
    add(r.sourceIds, `Neuraxial ${r.route}: ${r.agent} ${r.concLabel}, ${r.volumeMl[0]}-${r.volumeMl[1]} mL, ${r.totalDoseMg[0]}-${r.totalDoseMg[1]} mg`);
  }

  for (const f of PEDS_ETT_FORMULAS) add([f.sourceId], `Pediatric ETT: ${f.label}`);
  add(['msd-peds-ett'], 'Pediatric oral ETT depth = 3 x internal diameter (cm)');
  for (const b of LMA_BANDS) add(['teleflex-lma'], `LMA size ${b.size}: ${b.fromKg ?? 0}-${b.toKg ?? 'above'} kg`);
  for (const b of LMA_BANDS) add(['esafe-lma-cuff'], `LMA size ${b.size}: maximum cuff volume ${b.maxCuffVolumeMl} mL`);
  for (const b of PEDS_BLADES) add(['wikem-peds-airway'], `Pediatric blade ${b.label}: ${b.blade}`);
  for (const r of AIRWAY_RULES) add(r.sourceIds, `Airway rule: ${r.device}${r.recommendedSize ? ` (${r.recommendedSize})` : ''}`);

  for (const s of VENTILATION_SCENARIOS) {
    const v = s.tidalVolumeMlPerKgPbw;
    if (v) {
      add(s.sourceIds, `${s.name}: tidal volume ${v.min}-${v.max} mL/kg PBW (start ${v.target})${s.plateauPressureLimit ? `; plateau limit ${s.plateauPressureLimit} cmH2O` : ''}`);
    } else {
      add(s.sourceIds, `${s.name}: clinical ventilation parameters and cautions`);
    }
  }

  for (const m of VENT_MODES) add(m.sourceIds, `Ventilator mode: ${m.title}`);
  for (const a of VENT_ALARMS) add(a.sourceIds, `Ventilator alarm: ${a.title}`);
  for (const t of VENT_TROUBLESHOOTING) add(t.sourceIds, `Ventilator troubleshooting: ${t.title}`);

  for (const c of CHECKLISTS) for (const i of c.items) add(i.sourceIds, `Checklist ${c.title}: ${i.text}`);
  for (const p of GLP1_PROTOCOLS) add([p.sourceId], `GLP-1 protocol ${p.label}: ${p.drugRule} Fasting: ${p.fastingRule}`);
  for (const s of [...LAST_STEPS, ...MH_STEPS, ...CICO_PLANS.flatMap((p) => p.steps)]) add(s.sourceIds, `Emergency step: ${s.text}`);

  for (const s of RISK_SCORES) {
    add(s.sourceIds, `Risk score ${s.name}: ${s.items.length} items; bands ${s.bands.map((b) => `${b.min}+ ${b.label}`).join(', ')}`);
  }
  for (const s of POSTOP_SCORES) {
    add(s.sourceIds, `Risk score ${s.name}: ${s.items.length} items; bands ${s.bands.map((b) => `${b.min}+ ${b.label}`).join(', ')}`);
  }
  for (const s of CHOICE_SCORES) {
    const pts = s.items.map((i) => i.options.map((o) => o.points).join('/')).join('; ');
    add(s.sourceIds, `Choice score ${s.name}: ${s.items.length} items (${pts}); bands ${s.bands.map((b) => `${b.min}+ ${b.label}`).join(', ')}`);
  }
  add(PONV_PLAN.sourceIds, `PONV plan: ${PONV_PLAN.adults.headline}`);

  for (const c of CONDITIONS) {
    add(c.sourceIds, c.plan ? `Condition plan: ${c.name} (ch. ${c.chapter})` : `Condition list entry, no plan yet: ${c.name} (ch. ${c.chapter})`);
  }

  for (const r of PERIOP_RULES) {
    for (const d of r.drugs) add([d.sourceId], `Perioperative ${r.drugClass}: ${d.name}: ${d.timings.map((t) => t.text).join(' | ')}`);
    if (r.drugs.length === 0) add(r.sourceIds, `Perioperative ${r.drugClass}: ${r.summary}`);
  }

  for (const [id, lines] of Object.entries(PRINCIPLE_SOURCES)) for (const l of lines) out[id]?.push(l);

  return out;
};

/** Sources that intentionally have no derived value (kept for traceability or future local data). */
export const SOURCES_WITHOUT_DERIVED_VALUES = [
  'local-protocol',
  'project-notebook',
  'samba-ponv-2020',
  // Registered ahead of the perioperative guide records (spec 2026-11-17); remove each id once a record cites it.
  'dasi-hlatky-1989',
  'ariscat-canet-2010',
  'cfs-rockwood-2005',
  'padss-chung-1995',
];
