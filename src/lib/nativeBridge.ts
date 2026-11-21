import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';

export interface ModalHierarchy {
  emergencyOpen: boolean;
  settingsOpen: boolean;
  referencesOpen: boolean;
}

export type BackActionResult =
  | 'CLOSE_EMERGENCY'
  | 'CLOSE_SETTINGS'
  | 'CLOSE_REFERENCES'
  | 'ROOT_NAVIGATE';

/** Determines which layer to dismiss when Android back button is tapped. */
export function dispatchBackAction(state: ModalHierarchy): BackActionResult {
  if (state.emergencyOpen) return 'CLOSE_EMERGENCY';
  if (state.settingsOpen) return 'CLOSE_SETTINGS';
  if (state.referencesOpen) return 'CLOSE_REFERENCES';
  return 'ROOT_NAVIGATE';
}

/** Configures status bar style and registers hardware back-button listener on native platforms. */
export function initNativeBridge(handlers: {
  getState: () => ModalHierarchy;
  closeEmergency: () => void;
  closeSettings: () => void;
  closeReferences: () => void;
}): () => void {
  if (!Capacitor.isNativePlatform()) {
    return () => {};
  }

  // Set dark status bar styling matching clinical theme
  StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
  StatusBar.setBackgroundColor({ color: '#090d16' }).catch(() => {});

  const listenerPromise = CapApp.addListener('backButton', () => {
    const state = handlers.getState();
    const action = dispatchBackAction(state);

    switch (action) {
      case 'CLOSE_EMERGENCY':
        handlers.closeEmergency();
        break;
      case 'CLOSE_SETTINGS':
        handlers.closeSettings();
        break;
      case 'CLOSE_REFERENCES':
        handlers.closeReferences();
        break;
      case 'ROOT_NAVIGATE':
        // Do not minimize or abort active case on single back press
        break;
    }
  });

  return () => {
    listenerPromise.then((handle) => handle.remove()).catch(() => {});
  };
}
