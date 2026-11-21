import { describe, expect, it } from 'vitest';
import { DOAC_RULE, PERIOP_RULES, SGLT2_RULE } from '../../data/periopMeds';
import { DATA_VERSION, SOURCE_BY_ID } from '../../data/sources';
import { creatinineClearance } from '../calc/crcl';
import { buildPreopNote, type PreopNoteInput } from '../preopNote';

const EMPTY: PreopNoteInput = {
  ageYears: null,
  sex: null,
  tbwKg: null,
  heightCm: null,
  creatinineUmolL: null,
  asaClass: null,
  asaEmergency: false,
  fasting: null,
  scoreAnswers: {},
  medsTaken: {},
};
// A man, 70 y, 70 kg, 170 cm, creatinine 1.0 mg/dL: CrCl 68 mL/min.
const MAN: PreopNoteInput = { ...EMPTY, ageYears: 70, sex: 'male', tbwKg: 70, heightCm: 170, creatinineUmolL: 88.4 };

const lines = (note: string) => note.split('\n');

describe('buildPreopNote: the fixed lines', () => {
  it('gives the expected lines for a fixed input', () => {
    const note = buildPreopNote({ ...MAN, asaClass: 'III', asaEmergency: true, fasting: 'Meets local fasting protocol' });
    const l = lines(note);
    expect(l[0]).toBe('--- PRE-OP ASSESSMENT NOTE (anonymous) ---');
    expect(l).toContain('Age: 70 y; Sex: male; Weight: 70.0 kg; Height: 170 cm; BMI: 24.2 kg/m²');
    expect(l).toContain('Creatinine: 1.0 mg/dL (88 µmol/L)');
    expect(l).toContain('Creatinine clearance: 68 mL/min (Cockcroft-Gault, actual body weight) [Cockcroft-Gault, App generic]');
    expect(l).toContain('ASA: III-E');
    expect(l).toContain('Fasting: Meets local fasting protocol');
    expect(l).toContain(`App data version: ${DATA_VERSION}`);
    expect(l[l.length - 1]).toBe('No patient identifiers included.');
  });

  it('writes the ASA class without E unless the flag is set, and ignores the flag with no class', () => {
    expect(lines(buildPreopNote({ ...MAN, asaClass: 'II' }))).toContain('ASA: II');
    expect(lines(buildPreopNote({ ...MAN, asaClass: null, asaEmergency: true }))).toContain('ASA: not recorded');
  });
});

describe('buildPreopNote: missing values', () => {
  it('never invents a value: an empty input reads not entered / incomplete / not recorded', () => {
    const note = buildPreopNote(EMPTY);
    const l = lines(note);
    expect(l).toContain('Age: not entered; Sex: not entered; Weight: not entered; Height: not entered; BMI: not entered');
    expect(l).toContain('Creatinine: not entered');
    expect(l).toContain('Creatinine clearance: incomplete (needs age, actual weight, biological sex, serum creatinine)');
    expect(l).toContain('ASA: not recorded');
    expect(l).toContain('Fasting: not recorded');
    expect(l.find((x) => x.startsWith('Revised Cardiac Risk Index'))).toContain('incomplete (needs serum creatinine)');
    expect(l.find((x) => x.startsWith('STOP-Bang'))).toContain('incomplete (needs');
    expect(note).not.toMatch(/NaN|undefined|null/);
  });

  it('treats a NaN number as not entered', () => {
    const note = buildPreopNote({ ...MAN, tbwKg: Number.NaN });
    expect(lines(note)).toContain('Age: 70 y; Sex: male; Weight: not entered; Height: 170 cm; BMI: not entered');
    expect(note).not.toMatch(/NaN/);
  });
});

describe('buildPreopNote: scores', () => {
  it('reports each Assess score with its points, band and source tags', () => {
    const l = lines(
      buildPreopNote({ ...MAN, scoreAnswers: { 'rcri-high-risk-surgery': true, 'rcri-ihd': true, 'sb-snoring': true } }),
    );
    expect(l).toContain('Revised Cardiac Risk Index (RCRI): 2 / 6 (2 factors) [RCRI 1999]');
    expect(l).toContain('STOP-Bang (obstructive sleep apnea screen): 3 / 8 (Intermediate risk) [STOP-Bang 2016, STOP 2008]');
  });
});

describe('buildPreopNote: medications', () => {
  it('with nothing ticked, says so without implying the patient takes no medications', () => {
    const note = buildPreopNote(MAN);
    expect(note).toContain('Medications ticked in the app: none (this is not a medication history; the app covers only the classes in its Medications section)');
  });

  it('SGLT2: each drug carries its own label timing, ertugliflozin 4 days, and the restart line', () => {
    const note = buildPreopNote({ ...MAN, medsTaken: { sglt2i: true } });
    expect(note).toContain('- SGLT2 inhibitors: Hold.');
    for (const d of SGLT2_RULE.drugs) {
      expect(note).toContain(d.timings[0].text);
      expect(note).toContain(`Restart: ${d.restart}`);
    }
    expect(lines(note).find((x) => x.includes('Ertugliflozin'))).toContain('at least 4 days');
  });

  it('DOAC: always carries the not-ASRA caution, and apixaban keeps both its lines', () => {
    const note = buildPreopNote({ ...MAN, medsTaken: { doac: true } });
    expect(note).toContain(`Caution: ${DOAC_RULE.cautions![0]}`);
    const apixaban = lines(note).find((x) => x.includes('Apixaban'))!;
    expect(apixaban).toContain('at least 48 hours');
    expect(apixaban).toContain('at least 24 hours');
  });

  it('dabigatran shows the line that fits the CrCl: 68 mL/min is 1 to 2 days, 34 mL/min is 3 to 5 days', () => {
    const at68 = lines(buildPreopNote({ ...MAN, medsTaken: { doac: true } })).find((x) => x.includes('Dabigatran'))!;
    expect(at68).toContain('1 to 2 days');
    expect(at68).not.toContain('3 to 5 days');
    expect(at68).toContain('this patient: CrCl 68.1 mL/min');
    const at34 = lines(buildPreopNote({ ...MAN, creatinineUmolL: 176.8, medsTaken: { doac: true } })).find((x) => x.includes('Dabigatran'))!;
    expect(at34).toContain('3 to 5 days');
    expect(at34).not.toContain('1 to 2 days');
  });

  it('dabigatran shows both lines, marked, when there is no CrCl', () => {
    const line = lines(buildPreopNote({ ...EMPTY, medsTaken: { doac: true } })).find((x) => x.includes('Dabigatran'))!;
    expect(line).toContain('1 to 2 days');
    expect(line).toContain('3 to 5 days');
    expect(line).toContain('(CrCl not available)');
  });

  it('ASRA warfarin: the 5-day line is in the note, and a drug with no restart statement prints no "Restart"', () => {
    const note = buildPreopNote({ ...MAN, medsTaken: { 'asra-warfarin': true } });
    const warfarin = lines(note).find((x) => x.startsWith('  Warfarin:'))!;
    expect(warfarin).toContain('stopped 5 days prior to the planned procedure');
    expect(warfarin).not.toContain('Restart');
    expect(note).not.toContain('undefined');
  });

  it('prints the catheter statements under each drug', () => {
    const note = buildPreopNote({ ...MAN, medsTaken: { 'asra-lmwh': true } });
    expect(note).toContain('    Catheter / post-block: ');
    expect(note).toContain('The catheter should be removed 12 hours after the last dose of LMWH');
  });

  it('tags the CrCl to one decimal, so 49.6 is not shown as 50 beside the 30 to 49 line', () => {
    const input = { ...MAN, creatinineUmolL: 121.3, medsTaken: { 'asra-doac': true } };
    const crcl = creatinineClearance({ ageYears: 70, tbwKg: 70, sex: 'male', creatinineUmolL: 121.3 });
    expect(crcl.kind === 'ok' && crcl.mlPerMin > 49.5 && crcl.mlPerMin < 50).toBe(true);
    const note = buildPreopNote(input);
    const line = lines(note).find((x) => x.includes('Dabigatran') && x.includes('120 hours'))!;
    expect(line).toContain('(this patient: CrCl 49.');
    expect(note).not.toContain('CrCl 50 mL/min)');
  });

  it('ticking every card at once builds a note without errors', () => {
    const all = Object.fromEntries(PERIOP_RULES.map((r) => [r.id, true]));
    expect(() => buildPreopNote({ ...MAN, medsTaken: all })).not.toThrow();
  });

  it('GLP-1: states no timing of its own', () => {
    const note = buildPreopNote({ ...EMPTY, medsTaken: { glp1ra: true } });
    expect(note).toContain('- GLP-1 receptor agonists: Individualise.');
    expect(note).not.toMatch(/\b\d+\s*(h|hours?|days?|weeks?)\b/i);
  });
});

describe('buildPreopNote: sources and privacy', () => {
  it('every source tag in the note is a real source tag', () => {
    const real = new Set(Object.values(SOURCE_BY_ID).map((s) => s.tag));
    const note = buildPreopNote({
      ...MAN,
      scoreAnswers: { 'rcri-ihd': true },
      medsTaken: { sglt2i: true, doac: true, glp1ra: true },
    });
    let seen = 0;
    for (const l of lines(note)) {
      const m = l.match(/\[([^\]]+)\]$/);
      if (!m) continue;
      for (const tag of m[1].split(', ')) {
        seen += 1;
        expect(real.has(tag), `unknown tag "${tag}" in: ${l}`).toBe(true);
      }
    }
    expect(seen).toBeGreaterThan(8);
  });

  it('accepts only fixed choices for ASA class and fasting status (no free text)', () => {
    // @ts-expect-error a name is not an ASA class
    const a: PreopNoteInput = { ...EMPTY, asaClass: 'Mrs Smith' };
    // @ts-expect-error free text is not a fasting status
    const f: PreopNoteInput = { ...EMPTY, fasting: 'ate at 3pm' };
    expect([a, f]).toHaveLength(2);
  });
});
