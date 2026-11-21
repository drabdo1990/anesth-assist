import { describe, expect, it } from 'vitest';
import { dispatchBackAction, type ModalHierarchy } from '../nativeBridge';

describe('Hardware Back-Button Action Routing', () => {
  it('closes emergency modal if open', () => {
    const state: ModalHierarchy = { emergencyOpen: true, settingsOpen: false, referencesOpen: false };
    const action = dispatchBackAction(state);
    expect(action).toBe('CLOSE_EMERGENCY');
  });

  it('closes settings sheet if open', () => {
    const state: ModalHierarchy = { emergencyOpen: false, settingsOpen: true, referencesOpen: false };
    const action = dispatchBackAction(state);
    expect(action).toBe('CLOSE_SETTINGS');
  });

  it('closes references view if open', () => {
    const state: ModalHierarchy = { emergencyOpen: false, settingsOpen: false, referencesOpen: true };
    const action = dispatchBackAction(state);
    expect(action).toBe('CLOSE_REFERENCES');
  });

  it('prioritizes emergency modal closure over settings and references', () => {
    const state: ModalHierarchy = { emergencyOpen: true, settingsOpen: true, referencesOpen: true };
    const action = dispatchBackAction(state);
    expect(action).toBe('CLOSE_EMERGENCY');
  });

  it('returns ROOT_NAVIGATE if no overlays are open', () => {
    const state: ModalHierarchy = { emergencyOpen: false, settingsOpen: false, referencesOpen: false };
    const action = dispatchBackAction(state);
    expect(action).toBe('ROOT_NAVIGATE');
  });
});
