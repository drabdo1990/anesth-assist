import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import { setPwaUpdate } from './lib/pwaUpdate';
import { initTheme } from './lib/theme';
import { useAppStore } from './store/useAppStore';
import './index.css';

// A new service worker waits until the clinician taps the in-app update button.
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    useAppStore.getState().setUpdateAvailable(true);
  },
  onRegisteredSW(_swUrl, registration) {
    if (registration) {
      setInterval(() => {
        void registration.update().catch(() => undefined);
      }, 15 * 60 * 1000);
    }
  },
});
setPwaUpdate(() => updateSW(true));

// Keep preference/checklist writes from two open tabs from overwriting each other.
window.addEventListener('storage', (event) => {
  if (event.key === 'anesthassist-storage') void useAppStore.persist.rehydrate();
});

initTheme();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
