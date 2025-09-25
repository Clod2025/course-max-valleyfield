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
    // SSR-safe device detection
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      this.deviceType = 'desktop';
      return;
    }

    const userAgent = navigator.userAgent.toLowerCase();
    
    // Use stable initial width instead of innerWidth
    const screenWidth = document.documentElement.clientWidth || window.innerWidth;
    
    // Use matchMedia for touch detection instead of ontouchstart
    const hasTouch = window.matchMedia('(pointer: coarse)').matches || 
                     'ontouchstart' in window ||
                     navigator.maxTouchPoints > 0;

    // Use media queries for more reliable detection
    const isMobile = window.matchMedia('(max-width: 767px)').matches;
    const isTablet = window.matchMedia('(min-width: 768px) and (max-width: 1199px)').matches;

    if (isMobile || (hasTouch && screenWidth < 768)) {
      this.deviceType = 'mobile';
    } else if (isTablet || (hasTouch && screenWidth < 1200)) {
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
  if (isImageRequest(request)) {
    event.respondWith(handleImageRequest(request));
  } else if (isAPIRequest(request)) {
    event.respondWith(handleAPIRequest(request));
  } else if (isStaticRequest(request)) {
    event.respondWith(handleStaticRequest(request));
  } else {
    event.respondWith(handleDefaultRequest(request));
  }
});

// Gestion des images
function handleImageRequest(request) {
  const strategy = CACHE_STRATEGIES.images;
  
  switch (strategy) {
    case 'cache-first':
      return cacheFirst(request, DYNAMIC_CACHE);
    case 'network-first':
      return networkFirst(request, DYNAMIC_CACHE);
    case 'stale-while-revalidate':
      return staleWhileRevalidate(request, DYNAMIC_CACHE);
    default:
      return fetch(request);
  }
}

// Gestion des API
function handleAPIRequest(request) {
  const strategy = CACHE_STRATEGIES.api;
  
  switch (strategy) {
    case 'cache-first':
      return cacheFirst(request, DYNAMIC_CACHE);
    case 'network-first':
      return networkFirst(request, DYNAMIC_CACHE);
    case 'network-only':
      return fetch(request);
    default:
      return fetch(request);
  }
}

// Gestion des ressources statiques
function handleStaticRequest(request) {
  const strategy = CACHE_STRATEGIES.static;
  
  switch (strategy) {
    case 'cache-first':
      return cacheFirst(request, STATIC_CACHE);
    case 'stale-while-revalidate':
      return staleWhileRevalidate(request, STATIC_CACHE);
    default:
      return fetch(request);
  }
}

// Gestion des requêtes par défaut
function handleDefaultRequest(request) {
  return networkFirst(request, DYNAMIC_CACHE);
}

// Stratégie Cache First
async function cacheFirst(request, cacheName) {
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
async function networkFirst(request, cacheName) {
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
async function staleWhileRevalidate(request, cacheName) {
  const cachedResponse = await caches.match(request);
  
  const fetchPromise = fetch(request).then(async (networkResponse) => {
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      await cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  });
  
  return cachedResponse || fetchPromise;
}

// Utilitaires
function isImageRequest(request) {
  return request.destination === 'image' || 
         /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(request.url);
}

function isAPIRequest(request) {
  return request.url.includes('/api/') || 
         request.url.includes('/supabase/');
}

function isStaticRequest(request) {
  return request.destination === 'script' ||
         request.destination === 'style' ||
         /\.(js|css|woff|woff2|ttf)$/i.test(request.url);
}

// Gestion des notifications push
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  let data;
  try {
    data = event.data.json();
  } catch (error) {
    console.error('Failed to parse push data:', error);
    // Fallback to text or empty object
    try {
      data = { title: 'Notification', body: event.data.text() || 'New notification' };
    } catch (textError) {
      data = { title: 'Notification', body: 'New notification' };
    }
  }
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
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
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
      notification.className = 'fixed top-4 right-4 bg-primary text-primary-foreground p-4 rounded-lg shadow-lg z-50';
      
      const title = document.createElement('p');
      title.className = 'font-semibold';
      title.textContent = 'Mise à jour disponible';
      
      const message = document.createElement('p');
      message.className = 'text-sm';
      message.textContent = 'Une nouvelle version de l\'application est disponible.';
      
      const button = document.createElement('button');
      button.className = 'mt-2 bg-white text-primary px-3 py-1 rounded text-sm';
      button.textContent = 'Mettre à jour';
      button.addEventListener('click', () => {
        window.location.reload();
      });
      
      notification.appendChild(title);
      notification.appendChild(message);
      notification.appendChild(button);
      document.body.appendChild(notification);
      
      // Supprimer la notification après 10 secondes
      setTimeout(() => {
        notification.remove();
      }, 10000);
    }
  }
}

