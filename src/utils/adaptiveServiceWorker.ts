/**
 * Service Worker adaptatif pour PWA responsive
 */

export interface AdaptiveSWConfig {
  enableCaching: boolean;
  enableOfflineSupport: boolean;
  enablePushNotifications: boolean;
  cacheStrategies: {
    images: 'cache-first' | 'network-first' | 'stale-while-revalidate';
    api: 'network-first' | 'cache-first' | 'network-only';
    static: 'cache-first' | 'stale-while-revalidate';
  };
  deviceSpecificCaching: boolean;
}

const DEFAULT_CONFIG: AdaptiveSWConfig = {
  enableCaching: true,
  enableOfflineSupport: true,
  enablePushNotifications: true,
  cacheStrategies: {
    images: 'stale-while-revalidate',
    api: 'network-first',
    static: 'cache-first'
  },
  deviceSpecificCaching: true
};

export class AdaptiveServiceWorker {
  private config: AdaptiveSWConfig;
  private deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop';

  constructor(config: Partial<AdaptiveSWConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.detectDeviceType();
  }

  private detectDeviceType() {
    const userAgent = navigator.userAgent.toLowerCase();
    const screenWidth = window.innerWidth;
    const hasTouch = 'ontouchstart' in window;

    if (screenWidth < 768 || (hasTouch && screenWidth < 1024)) {
      this.deviceType = 'mobile';
    } else if (screenWidth < 1200 && hasTouch) {
      this.deviceType = 'tablet';
    } else {
      this.deviceType = 'desktop';
    }
  }

  public generateServiceWorker(): string {
    return `
// Service Worker adaptatif pour PWA responsive
const CACHE_NAME = 'coursemax-pwa-v1-${this.deviceType}';
const STATIC_CACHE = 'coursemax-static-v1';
const DYNAMIC_CACHE = 'coursemax-dynamic-v1';

// Ressources à mettre en cache selon le type d'appareil
const STATIC_ASSETS = ${this.getStaticAssets()};

// Stratégies de cache adaptatives
const CACHE_STRATEGIES = ${JSON.stringify(this.config.cacheStrategies)};

// Installation du Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installation');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Mise en cache des ressources statiques');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activation');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('Service Worker: Suppression de l\'ancien cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Interception des requêtes
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Stratégie adaptative selon le type de ressource
  if (this.isImageRequest(request)) {
    event.respondWith(this.handleImageRequest(request));
  } else if (this.isAPIRequest(request)) {
    event.respondWith(this.handleAPIRequest(request));
  } else if (this.isStaticRequest(request)) {
    event.respondWith(this.handleStaticRequest(request));
  } else {
    event.respondWith(this.handleDefaultRequest(request));
  }
});

// Gestion des images
handleImageRequest(request) {
  const strategy = CACHE_STRATEGIES.images;
  
  switch (strategy) {
    case 'cache-first':
      return this.cacheFirst(request, DYNAMIC_CACHE);
    case 'network-first':
      return this.networkFirst(request, DYNAMIC_CACHE);
    case 'stale-while-revalidate':
      return this.staleWhileRevalidate(request, DYNAMIC_CACHE);
    default:
      return fetch(request);
  }
}

// Gestion des API
handleAPIRequest(request) {
  const strategy = CACHE_STRATEGIES.api;
  
  switch (strategy) {
    case 'cache-first':
      return this.cacheFirst(request, DYNAMIC_CACHE);
    case 'network-first':
      return this.networkFirst(request, DYNAMIC_CACHE);
    case 'network-only':
      return fetch(request);
    default:
      return fetch(request);
  }
}

// Gestion des ressources statiques
handleStaticRequest(request) {
  const strategy = CACHE_STRATEGIES.static;
  
  switch (strategy) {
    case 'cache-first':
      return this.cacheFirst(request, STATIC_CACHE);
    case 'stale-while-revalidate':
      return this.staleWhileRevalidate(request, STATIC_CACHE);
    default:
      return fetch(request);
  }
}

// Stratégie Cache First
async cacheFirst(request, cacheName) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Cache First Error:', error);
    return new Response('Offline', { status: 503 });
  }
}

// Stratégie Network First
async networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('Network failed, trying cache:', error);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    return new Response('Offline', { status: 503 });
  }
}

// Stratégie Stale While Revalidate
async staleWhileRevalidate(request, cacheName) {
  const cachedResponse = await caches.match(request);
  
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      const cache = caches.open(cacheName);
      cache.then((cache) => cache.put(request, networkResponse.clone()));
    }
    return networkResponse;
  });
  
  return cachedResponse || fetchPromise;
}

// Utilitaires
isImageRequest(request) {
  return request.destination === 'image' || 
         request.url.match(/\\.(jpg|jpeg|png|gif|webp|svg)$/i);
}

isAPIRequest(request) {
  return request.url.includes('/api/') || 
         request.url.includes('/supabase/');
}

isStaticRequest(request) {
  return request.destination === 'script' ||
         request.destination === 'style' ||
         request.url.match(/\\.(js|css|woff|woff2|ttf)$/i);
}

// Gestion des notifications push
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: data.data,
    actions: data.actions || []
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Gestion des clics sur les notifications
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || '/')
  );
});

// Gestion de la synchronisation en arrière-plan
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(this.doBackgroundSync());
  }
});

async doBackgroundSync() {
  // Implémentation de la synchronisation en arrière-plan
  console.log('Background sync triggered');
}
    `;
  }

  private getStaticAssets(): string {
    const baseAssets = [
      '/',
      '/index.html',
      '/manifest.json',
      '/icons/icon-192x192.png',
      '/icons/icon-512x512.png'
    ];

    // Assets spécifiques au type d'appareil
    const deviceSpecificAssets = {
      mobile: [
        '/assets/mobile.css',
        '/assets/mobile.js'
      ],
      tablet: [
        '/assets/tablet.css',
        '/assets/tablet.js'
      ],
      desktop: [
        '/assets/desktop.css',
        '/assets/desktop.js'
      ]
    };

    return JSON.stringify([
      ...baseAssets,
      ...deviceSpecificAssets[this.deviceType]
    ]);
  }

  public async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if ('serviceWorker' in navigator) {
      try {
        const swUrl = '/sw.js';
        const registration = await navigator.serviceWorker.register(swUrl);
        
        console.log('Service Worker enregistré:', registration);
        
        // Mettre à jour le Service Worker si nécessaire
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // Nouveau Service Worker disponible
                this.showUpdateNotification();
              }
            });
          }
        });
        
        return registration;
      } catch (error) {
        console.error('Erreur d\'enregistrement du Service Worker:', error);
        return null;
      }
    }
    return null;
  }

  private showUpdateNotification() {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      // Afficher une notification pour mettre à jour l'app
      const notification = document.createElement('div');
      notification.innerHTML = `
        <div class="fixed top-4 right-4 bg-primary text-primary-foreground p-4 rounded-lg shadow-lg z-50">
          <p class="font-semibold">Mise à jour disponible</p>
          <p class="text-sm">Une nouvelle version de l'application est disponible.</p>
          <button onclick="window.location.reload()" class="mt-2 bg-white text-primary px-3 py-1 rounded text-sm">
            Mettre à jour
          </button>
        </div>
      `;
      document.body.appendChild(notification);
      
      // Supprimer la notification après 10 secondes
      setTimeout(() => {
        notification.remove();
      }, 10000);
    }
  }
}
```

