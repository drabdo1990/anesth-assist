import { describe, expect, it } from 'vitest';
import { DOAC_RULE, GLP1_RULE, PERIOP_RULES, SGLT2_RULE, type PeriopDrug } from '../periopMeds';
import { ASRA_RULES } from '../periopAsra';
import { CARDIAC_RULES } from '../periopCardiac';
import { MEDICATIONS } from '../medications';
import { SOURCE_BY_ID } from '../sources';

const drug = (rule: typeof DOAC_RULE, id: string) => {
  const d = rule.drugs.find((x) => x.id === id);
  if (!d) throw new Error(`missing drug ${id}`);
  return d;
};

describe('perioperative medication rules', () => {
  it('have unique rule ids and unique drug ids', () => {
    const ruleIds = PERIOP_RULES.map((r) => r.id);
    expect(new Set(ruleIds).size).toBe(ruleIds.length);
    const drugIds = PERIOP_RULES.flatMap((r) => r.drugs.map((d) => d.id));
    expect(new Set(drugIds).size).toBe(drugIds.length);
  });

  it('cite sources that exist, and every drug is cited by its rule and backed by a label (label cards) or a primary text (guideline cards)', () => {
    for (const r of PERIOP_RULES) {
      expect(r.sourceIds.length, r.id).toBeGreaterThan(0);
      for (const id of r.sourceIds) expect(SOURCE_BY_ID[id], `${r.id} -> ${id}`).toBeDefined();
      for (const d of r.drugs) {
        expect(r.sourceIds, `${r.id} lists ${d.id}'s source`).toContain(d.sourceId);
        const expected = r.section === "Manufacturers' labels" ? 'label' : 'primary';
        expect(SOURCE_BY_ID[d.sourceId].verification, d.id).toBe(expected);
      }
    }
  });

  it('put every rule under a section heading', () => {
    for (const r of PERIOP_RULES) expect(r.section.length, r.id).toBeGreaterThan(0);
  });

  it('give every drug at least one timing, and a non-empty restart statement where it has one', () => {
    for (const d of PERIOP_RULES.flatMap((r) => r.drugs)) {
      expect(d.timings.length, d.id).toBeGreaterThan(0);
      if (d.restart !== undefined) expect(d.restart.length, d.id).toBeGreaterThan(0);
    }
    for (const d of [...SGLT2_RULE.drugs, ...DOAC_RULE.drugs]) expect(d.restart, `${d.id} is a label card and always has a restart`).toBeDefined();
  });

  it('SGLT2: ertugliflozin says 4 days, the other three say 3 days', () => {
    expect(drug(SGLT2_RULE, 'ertugliflozin').timings[0].text).toContain('at least 4 days');
    for (const id of ['empagliflozin', 'dapagliflozin', 'canagliflozin']) {
      expect(drug(SGLT2_RULE, id).timings[0].text, id).toContain('at least 3 days');
    }
  });

  it('DOAC: apixaban shows both the 48-hour and the 24-hour line', () => {
    const texts = drug(DOAC_RULE, 'apixaban').timings.map((t) => t.text).join(' | ');
    expect(texts).toContain('at least 48 hours');
    expect(texts).toContain('at least 24 hours');
  });

  it('DOAC: dabigatran has a 1 to 2 day line at CrCl 50 or more and a 3 to 5 day line below 50', () => {
    const t = drug(DOAC_RULE, 'dabigatran').timings;
    expect(t.find((x) => x.crclMin === 50)?.text).toContain('1 to 2 days');
    expect(t.find((x) => x.crclBelow === 50)?.text).toContain('3 to 5 days');
  });

  it('DOAC label card: always carries the caution that its timings are not ASRA neuraxial intervals, and names the ASRA card', () => {
    expect(DOAC_RULE.cautions?.some((c) => c.includes('ASRA') && /spinal|epidural|neuraxial/i.test(c))).toBe(true);
    expect(DOAC_RULE.cautions?.some((c) => c.includes('DOACs: spinal, epidural or deep block (ASRA)'))).toBe(true);
  });

  it('GLP-1: points to the comparison and states no timing of its own', () => {
    expect(GLP1_RULE.drugs).toEqual([]);
    expect(GLP1_RULE.action).toBe('individualise');
    expect(GLP1_RULE.summary).not.toMatch(/\b\d+\s*(h|hours?|days?|weeks?)\b/i);
  });

  const asraDrug = (ruleId: string, drugId: string): PeriopDrug => {
    const d = ASRA_RULES.find((r) => r.id === ruleId)?.drugs.find((x) => x.id === drugId);
    if (!d) throw new Error(`missing ${ruleId} / ${drugId}`);
    return d;
  };
  const everything = (d: PeriopDrug) => [...d.timings.map((t) => t.text), ...(d.catheter ?? []), d.restart ?? ''].join(' | ');

  it('ASRA: has the seven cards, all in the ASRA section and citing the ASRA source', () => {
    expect(ASRA_RULES.map((r) => r.id)).toEqual(['asra-warfarin', 'asra-ufh', 'asra-lmwh', 'asra-fondaparinux', 'asra-doac', 'asra-antiplatelet', 'asra-thrombolytic']);
    for (const r of ASRA_RULES) {
      expect(r.section, r.id).toBe('ASRA: spinal, epidural and deep blocks');
      expect(r.sourceIds, r.id).toEqual(['asra-anticoag-2025']);
      expect(r.cautions?.some((c) => c.includes('spinal, epidural or deep plexus/peripheral block')), r.id).toBe(true);
    }
  });

  const ASRA_PINS: Array<[string, string, string]> = [
    ['asra-warfarin', 'warfarin', 'stopped 5 days prior to the planned procedure'],
    ['asra-warfarin', 'warfarin', 'removed when the INR is <1.5'],
    ['asra-ufh', 'ufh-iv', 'minimum of 4–6 hours'],
    ['asra-ufh', 'ufh-iv', 'minimum of 1 hour after needle placement'],
    ['asra-ufh', 'ufh-sc', 'minimum of 12 hours after subcutaneous heparin'],
    ['asra-ufh', 'ufh-sc', 'minimum of 24 hours after subcutaneous heparin'],
    ['asra-lmwh', 'lmwh', 'at least 12 hours after low-dose LMWH'],
    ['asra-lmwh', 'lmwh', 'at least 24 hours prior to needle/catheter placement'],
    ['asra-fondaparinux', 'fondaparinux', '36 hours (young patients) to 42 hours (elderly patients)'],
    ['asra-fondaparinux', 'fondaparinux', 'minimum of 58 hours'],
    ['asra-fondaparinux', 'fondaparinux', 'minimum of 70 hours'],
    ['asra-fondaparinux', 'fondaparinux', 'minimum of 105 hours'],
    ['asra-doac', 'apixaban-asra', 'high dose of apixaban be discontinued at least 72 hours'],
    ['asra-doac', 'apixaban-asra', 'low dose of apixaban be discontinued for at least 36 hours'],
    ['asra-doac', 'edoxaban-asra', 'high dose of edoxaban be discontinued for at least 72 hours'],
    ['asra-doac', 'rivaroxaban-asra', 'high dose of rivaroxaban be discontinued for at least 72 hours'],
    ['asra-doac', 'rivaroxaban-asra', 'low dose of rivaroxaban be discontinued for at least 24 hours (30 hours if CrCl <30 mL/min)'],
    ['asra-doac', 'dabigatran-asra', 'discontinued for at least 72 hours in patients with a CrCl ≥50 mL/min'],
    ['asra-doac', 'dabigatran-asra', 'discontinued for 120 hours in patients with a CrCl 30–49 mL/min'],
    ['asra-doac', 'dabigatran-asra', 'low dose of dabigatran be discontinued for at least 48 hours'],
    ['asra-antiplatelet', 'thienopyridines', '5–7 days for clopidogrel, and 7–10 days for prasugrel'],
    ['asra-antiplatelet', 'ticagrelor', 'is 5 days'],
    ['asra-antiplatelet', 'cilostazol', 'avoided for 2 days'],
    ['asra-antiplatelet', 'cangrelor', 'avoided for 3 hours'],
    ['asra-thrombolytic', 'thrombolytics', 'against needle placement for at least 48 hours'],
  ];

  it.each(ASRA_PINS)('ASRA %s / %s says "%s"', (ruleId, drugId, text) => {
    expect(everything(asraDrug(ruleId, drugId))).toContain(text);
  });

  it('ASRA: every statement ends the way ASRA ends it (a grade or a full stop), so none was cut short', () => {
    for (const r of ASRA_RULES) {
      const texts = [...(r.cautions ?? []), ...r.drugs.flatMap((d) => [...d.timings.map((t) => t.text), ...(d.catheter ?? []), ...(d.restart ? [d.restart] : [])])];
      for (const t of texts) expect(t, `${r.id}: ...${t.slice(-60)}`).toMatch(/(\(grade [A-Z0-9]+\)|\.)$/);
    }
  });

  it('ASRA DOAC card: says the app cannot tell the dose, and warfarin and aspirin have no restart line', () => {
    expect(ASRA_RULES.find((r) => r.id === 'asra-doac')?.cautions?.some((c) => c.includes('cannot tell which dose'))).toBe(true);
    expect(asraDrug('asra-warfarin', 'warfarin').restart).toBeUndefined();
    expect(asraDrug('asra-antiplatelet', 'aspirin-nsaids').restart).toBeUndefined();
  });

  const cardiac = (id: string) => {
    const r = CARDIAC_RULES.find((x) => x.id === id);
    if (!r) throw new Error(`missing ${id}`);
    return r;
  };
  const cardiacText = (id: string) =>
    cardiac(id)
      .drugs.flatMap((d) => [...d.timings.map((t) => t.text), d.restart ?? ''])
      .join(' | ');

  it('cardiac: has the five cards, in the cardiac section, each showing both guidelines side by side', () => {
    expect(CARDIAC_RULES.map((r) => r.id)).toEqual(['beta-blocker', 'statin', 'raas-inhibitor', 'antiplatelet-pci', 'oac-bridging']);
    for (const r of CARDIAC_RULES) {
      expect(r.section, r.id).toBe('Cardiac drugs: AHA/ACC and ESC');
      expect(r.sourceIds, r.id).toEqual(['aha-acc-periop-2024', 'esc-ncs-2022']);
      expect(r.drugs.map((d) => d.sourceId), r.id).toEqual(['aha-acc-periop-2024', 'esc-ncs-2022']);
    }
  });

  // The two ESC RAAS rows were captured with their class but not their level (see the esc-ncs-2022 accessNote). Only these may omit it.
  const ESC_LEVEL_NOT_CAPTURED = [
    'Transient discontinuation of ACEIs or ARBs before NCS in hypertensive patients should be considered. (Class IIa)',
    'In patients without HF, withholding RAAS inhibitors on the day of NCS should be considered to prevent peri-operative hypotension. (Class IIa)',
  ];

  it('cardiac: ESC lines carry the class and level printed in the guideline, AHA/ACC lines do not invent one', () => {
    for (const r of CARDIAC_RULES) {
      const esc = r.drugs.find((d) => d.sourceId === 'esc-ncs-2022')!;
      for (const t of [...esc.timings.map((x) => x.text), ...(esc.restart ? [esc.restart] : [])]) {
        if (ESC_LEVEL_NOT_CAPTURED.includes(t)) expect(t, r.id).toMatch(/\(Class (I|II|III)[ab]?\)$/);
        else expect(t, r.id).toMatch(/\(Class (I|II|III)[ab]?, level [ABC]\)$/);
      }
      const aha = r.drugs.find((d) => d.sourceId === 'aha-acc-periop-2024')!;
      for (const t of aha.timings) expect(t.text, r.id).not.toMatch(/\(Class /);
    }
  });

  it('cardiac: every statement ends the way its guideline ends it, so none was cut short', () => {
    for (const r of CARDIAC_RULES) {
      const texts = [...(r.cautions ?? []), ...r.drugs.flatMap((d) => [...d.timings.map((t) => t.text), ...(d.restart ? [d.restart] : [])])];
      for (const t of texts) expect(t, `${r.id}: ...${t.slice(-60)}`).toMatch(/[.)]$/);
    }
  });

  it('beta-blockers: continue chronic therapy, and do not start routinely or on the day of surgery', () => {
    expect(cardiac('beta-blocker').action).toBe('continue');
    const t = cardiacText('beta-blocker');
    expect(t).toContain('beta blockers should be continued through the perioperative period');
    expect(t).toContain('beta blockers should not be initiated on the day of surgery');
    expect(t).toContain('Routine initiation of beta-blocker peri-operatively is not recommended. (Class III, level A)');
  });

  it('statins: continue', () => {
    expect(cardiac('statin').action).toBe('continue');
    expect(cardiacText('statin')).toContain('it is recommended to continue statins during the peri-operative period. (Class I, level B)');
  });

  it('RAAS inhibitors: the two guidelines differ, both are shown, and the card does not pick one', () => {
    expect(cardiac('raas-inhibitor').action).toBe('individualise');
    const t = cardiacText('raas-inhibitor');
    expect(t).toContain('perioperative continuation is reasonable');
    expect(t).toContain('withholding RAAS inhibitors on the day of NCS should be considered');
  });

  it('antiplatelet drugs after a stent: ESC withholding days and the aspirin statement are present', () => {
    const t = cardiacText('antiplatelet-pci');
    expect(t).toContain('withhold ticagrelor for 3–5 days, clopidogrel for 5 days, and prasugrel for 7 days prior to NCS');
    expect(t).toContain('continue aspirin peri-operatively if the bleeding risk allows');
    expect(t).toContain('continue aspirin∗ (75-100 mg)');
    expect(cardiac('antiplatelet-pci').cautions?.some((c) => c.includes('ASRA'))).toBe(true);
  });

  it('bridging: not recommended routinely, and the card points to ASRA for spinal and epidural timing', () => {
    const t = cardiacText('oac-bridging');
    expect(t).toContain('routine periprocedural bridging is not recommended');
    expect(t).toContain('Bridging of OAC therapy is not recommended in patients with low/moderate thrombotic risk undergoing NCS. (Class III, level B)');
    expect(cardiac('oac-bridging').cautions?.some((c) => c.includes('ASRA'))).toBe(true);
  });
});

describe('pediatric medication formulary', () => {
  it('contains at least 18 pediatric doses with scalar locked to TBW', () => {
    const pedsDoses = MEDICATIONS.flatMap((m) => m.doses).filter((d) => d.population === 'pediatric');
    expect(pedsDoses.length).toBeGreaterThanOrEqual(18);
    for (const d of pedsDoses) {
      expect(d.scalar).toBe('TBW');
    }
  });

  it('ensures all pediatric age brackets have minYears < maxYears', () => {
    const pedsDoses = MEDICATIONS.flatMap((m) => m.doses).filter((d) => d.population === 'pediatric');
    for (const d of pedsDoses) {
      if (d.ageBracket) {
        if (d.ageBracket.minYears !== undefined && d.ageBracket.maxYears !== undefined) {
          expect(d.ageBracket.minYears).toBeLessThan(d.ageBracket.maxYears);
        }
      }
    }
  });

  it('provides pediatric dilution presets for fentanyl, atropine, ketamine, and midazolam', () => {
    const fentanyl = MEDICATIONS.find((m) => m.id === 'fentanyl' || m.id === 'fentanyl-bolus');
    expect(fentanyl).toBeDefined();
    expect(fentanyl?.concentrations?.some((c) => c.isPediatricDefault && c.pediatricInstructions)).toBe(true);

    const atropine = MEDICATIONS.find((m) => m.id === 'atropine-premed' || m.id === 'atropine');
    expect(atropine).toBeDefined();
    expect(atropine?.concentrations?.some((c) => c.isPediatricDefault && c.pediatricInstructions)).toBe(true);

    const ketamine = MEDICATIONS.find((m) => m.id === 'ketamine' || m.id === 'ketamine-induction');
    expect(ketamine).toBeDefined();
    expect(ketamine?.concentrations?.some((c) => c.isPediatricDefault && c.pediatricInstructions)).toBe(true);

    const midazolam = MEDICATIONS.find((m) => m.id === 'midazolam-premed' || m.id === 'midazolam');
    expect(midazolam).toBeDefined();
    expect(midazolam?.concentrations?.some((c) => c.isPediatricDefault && c.pediatricInstructions)).toBe(true);
  });
});

