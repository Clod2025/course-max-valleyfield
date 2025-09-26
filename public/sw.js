const CACHE_NAME = 'coursemax-v1.0.0';
const STATIC_ASSETS = [
  '/',
  '/home',
  '/login',
  '/register',
  '/stores',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/favicon.ico'
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installation en cours...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Cache ouvert');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch((error) => {
        console.error('Service Worker: Erreur lors de la mise en cache:', error);
      })
  );
  // Force l'activation immédiate du nouveau Service Worker
  self.skipWaiting();
  console.log('Service Worker: skipWaiting() appelé - mise à jour forcée');
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activation en cours...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Suppression de l\'ancien cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Prendre le contrôle de tous les clients immédiatement
      return self.clients.claim();
    })
  );
  console.log('Service Worker: clients.claim() appelé - contrôle pris');
});

// Interception des requêtes
self.addEventListener('fetch', (event) => {
  // Stratégie Cache First pour les assets statiques
  if (event.request.destination === 'script' || 
      event.request.destination === 'style' ||
      event.request.destination === 'manifest') {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          return response || fetch(event.request);
        })
        .catch(() => {
          // Fallback pour les erreurs réseau
          return new Response('Contenu non disponible hors ligne', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/plain' }
          });
        })
    );
    return;
  }

  // Stratégie Network First pour les API et pages dynamiques
  if (event.request.url.includes('/api/') || 
      event.request.url.includes('supabase.co')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Mettre en cache les réponses réussies
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseClone);
              });
          }
          return response;
        })
        .catch(() => {
          // Fallback vers le cache
          return caches.match(event.request)
            .then((response) => {
              return response || new Response('Données non disponibles hors ligne', {
                status: 503,
                statusText: 'Service Unavailable',
                headers: { 'Content-Type': 'application/json' }
              });
            });
        })
    );
    return;
  }

  // Pour tout le reste, essayer le cache puis le réseau
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request);
      })
      .catch(() => {
        // Page de fallback pour navigation hors ligne
        if (event.request.mode === 'navigate') {
          return caches.match('/') || new Response(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>CourseMax - Hors ligne</title>
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <style>
                  body { 
                    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                    text-align: center; 
                    padding: 50px;
                    background: #f5f5f5;
                  }
                  .container {
                    max-width: 400px;
                    margin: 0 auto;
                    background: white;
                    padding: 40px;
                    border-radius: 8px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                  }
                  .emoji { font-size: 48px; margin-bottom: 20px; }
                  h1 { color: #FF4F2E; margin-bottom: 16px; }
                  p { color: #666; line-height: 1.5; }
                  button {
                    background: #FF4F2E;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 6px;
                    font-size: 16px;
                    cursor: pointer;
                    margin-top: 20px;
                  }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="emoji">📱</div>
                  <h1>CourseMax</h1>
                  <p>Vous êtes actuellement hors ligne. Vérifiez votre connexion Internet pour accéder à CourseMax.</p>
                  <button onclick="window.location.reload()">Réessayer</button>
                </div>
              </body>
            </html>
          `, {
            headers: { 'Content-Type': 'text/html' }
          });
        }
      })
  );
});

// Gestion des messages du client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('Service Worker: Message SKIP_WAITING reçu');
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'FORCE_UPDATE') {
    console.log('Service Worker: Mise à jour forcée demandée');
    self.skipWaiting();
  }
});

// Mise à jour silencieuse automatique
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CHECK_UPDATE') {
    console.log('Service Worker: Vérification de mise à jour...');
    // Vérifier s'il y a une nouvelle version disponible
    self.registration.update().then(() => {
      console.log('Service Worker: Mise à jour vérifiée');
    });
  }
});

// Notification de mise à jour silencieuse
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SILENT_UPDATE') {
    console.log('Service Worker: Mise à jour silencieuse activée');
    // Forcer la mise à jour sans notification utilisateur
    self.skipWaiting();
    
    // Notifier tous les clients de recharger
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'RELOAD_PAGE',
          message: 'Mise à jour silencieuse en cours...'
        });
      });
    });
  }
});
