import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ToastProvider } from './context/ToastContext.tsx';
import './index.css';

// Register Service Worker for Offline Mode & PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Clean up any stale or invalid dev-sw.js registrations
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        const url = registration.active?.scriptURL || registration.installing?.scriptURL || registration.waiting?.scriptURL || '';
        if (url.includes('dev-sw.js')) {
          registration.unregister().catch(() => {});
        }
      }
    }).catch(() => {});

    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .then((reg) => {
        console.log('[PWA / Service Worker] Berhasil terpasang dengan scope:', reg.scope);
      })
      .catch((err) => {
        console.info('[PWA / Service Worker] Catatan registrasi:', err?.message || err);
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </StrictMode>,
);
