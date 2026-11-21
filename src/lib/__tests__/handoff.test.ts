import { describe, expect, it } from 'vitest';
import { buildHandoffSummary, EMPTY_HANDOFF, type HandoffInput } from '../handoff';

const filled: HandoffInput = {
  ...EMPTY_HANDOFF,
  procedureCategory: 'General surgery',
  asaStatus: 'II',
  airway: 'Oral ETT',
  inductionAgents: ['Propofol', 'Fentanyl'],
  maintenance: 'Volatile',
  opioids: ['Fentanyl'],
  neuromuscularBlockade: ['Rocuronium'],
  fluidsMl: '1000',
  bloodLossMl: '50',
  ventMode: 'Volume control (VC)',
  ventTidalVolumeMl: '450',
  ventRespiratoryRate: '12',
  ventPeepCmH2O: '5',
  ventFio2Percent: '40',
};

describe('buildHandoffSummary', () => {
  it('includes only entered fields', () => {
    const { text, omitted } = buildHandoffSummary(filled);
    expect(omitted).toEqual([]);
    expect(text).toContain('Procedure: General surgery');
    expect(text).toContain('ASA status: II');
    expect(text).toContain('Induction agents: Propofol, Fentanyl');
    expect(text).toContain('Fluids: 1000 mL');
    expect(text).toContain('Blood loss: 50 mL');
    expect(text).toContain('Ventilation: Volume control (VC); VT: 450 mL; RR: 12 breaths/min; PEEP: 5 cmH2O; FiO2: 40 %');
  });

  it('never adds fixed clinical claims or biometrics', () => {
    const { text } = buildHandoffSummary(EMPTY_HANDOFF);
    expect(text).not.toMatch(/NKDA|TOF|kg|BMI|cm/i);
    expect(text).toBe('--- ANESTHESIA HANDOFF (anonymous) ---\nNo patient identifiers included.');
  });

  it('omits non-numeric numeric fields', () => {
    const { text, omitted } = buildHandoffSummary({ ...filled, fluidsMl: 'John' });
    expect(text).not.toContain('John');
    expect(omitted).toContain('Fluids');
  });

  it('ignores any extra free-text property supplied by old saved data', () => {
    const legacy = { ...filled, emergenceAnalgesiaPlan: 'John Smith 555-123-4567' } as HandoffInput;
    expect(buildHandoffSummary(legacy).text).not.toContain('John Smith');
  });
});
