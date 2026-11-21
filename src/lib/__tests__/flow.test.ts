import { describe, expect, it } from 'vitest';
import { currentStepIndex, type FlowStep } from '../flow';

const s = (done: boolean, manual = false): FlowStep => ({ id: String(Math.random()), label: 'x', done, manual });

describe('currentStepIndex', () => {
  it('returns first undone step', () => expect(currentStepIndex([s(true), s(false), s(false)])).toBe(1));
  it('returns length when all done', () => expect(currentStepIndex([s(true), s(true)])).toBe(2));
  it('returns 0 for empty list', () => expect(currentStepIndex([])).toBe(0));
  it('skips manual/advisory steps that are not done', () => {
    expect(currentStepIndex([s(true), s(false, true), s(false)])).toBe(2);
  });
  it('returns length when remaining steps are manual', () => {
    expect(currentStepIndex([s(true), s(false, true)])).toBe(2);
  });
});
