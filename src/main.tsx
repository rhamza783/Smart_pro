import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

// Register service worker
registerSW({
  onNeedRefresh() {
    // This will be handled by PWAUpdatePrompt component
  },
  onOfflineReady() {
    // This will be handled by OfflineIndicator component
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
