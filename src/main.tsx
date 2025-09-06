import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import * as serviceWorker from './utils/serviceWorker'

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Enregistrer le service worker pour PWA
if (process.env.NODE_ENV === 'production') {
  serviceWorker.register({
    onSuccess: () => {
      console.log('CourseMax installé avec succès!');
    },
    onUpdate: () => {
      console.log('Nouvelle version disponible!');
      // Optionnel: Afficher notification de mise à jour
    },
  });
} else {
  serviceWorker.unregister();
}
