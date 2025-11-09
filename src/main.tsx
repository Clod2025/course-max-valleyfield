import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { updateSW } from './registerServiceWorker';

// Création du root React
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Activer le service worker uniquement en production
if (process.env.NODE_ENV === 'production') {
  updateSW(); // enregistre et met à jour le SW automatiquement
  console.log('✅ Service Worker PWA activé');

  if ('serviceWorker' in navigator && navigator.serviceWorker) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (!event.data) return;

      switch (event.data.type) {
        case 'RELOAD_PAGE':
          console.log('🔄 Nouvelle version détectée, rechargement...');
          window.location.reload();
          break;
        case 'OFFLINE_READY':
          console.log('📶 App prête à fonctionner hors ligne');
          break;
        default:
          console.log('📬 Message Service Worker:', event.data);
      }
    });
  } else {
    console.warn('Service workers non disponibles dans ce navigateur.');
  }
} else {
  console.log('🔧 Mode développement - Service Worker désactivé');
}