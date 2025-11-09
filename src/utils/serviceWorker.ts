// Service Worker registration utility
const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '[::1]' ||
  window.location.hostname.match(
    /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
  )
);

type Config = {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
};

export function register(config?: Config) {
  if ('serviceWorker' in navigator) {
    const swContainer = navigator.serviceWorker;
    if (!swContainer) {
      console.warn('Service worker API indisponible dans ce contexte.');
      return;
    }
    const publicUrl = new URL(
      process.env.PUBLIC_URL || '',
      window.location.href
    );
    if (publicUrl.origin !== window.location.origin) {
      return;
    }

    window.addEventListener('load', () => {
      const swUrl = `${process.env.PUBLIC_URL || ''}/sw.js`;

      if (isLocalhost) {
        checkValidServiceWorker(swUrl, config);
        swContainer.ready.then(() => {
          console.log('CourseMax PWA prêt pour fonctionnement hors ligne.');
        });
      } else {
        registerValidSW(swUrl, config, swContainer);
      }
    });
  }
}

function registerValidSW(swUrl: string, config: Config | undefined, swContainer: ServiceWorkerContainer) {
  swContainer
    .register(swUrl)
    .then((registration) => {
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker == null) {
          return;
        }
        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (swContainer.controller) {
              console.log('🔄 Nouveau contenu disponible - mise à jour silencieuse en cours...');
              
              // Mise à jour silencieuse automatique
              if (installingWorker.state === 'installed') {
                console.log('🚀 Activation de la mise à jour silencieuse...');
                
                // Envoyer un message au Service Worker pour forcer la mise à jour
                if (swContainer.controller) {
                  swContainer.controller.postMessage({
                    type: 'SILENT_UPDATE'
                  });
                }
                
                // Recharger automatiquement après 2 secondes
                setTimeout(() => {
                  console.log('🔄 Rechargement automatique de la page...');
                  window.location.reload();
                }, 2000);
              }
              
              if (config && config.onUpdate) {
                config.onUpdate(registration);
              }
            } else {
              console.log('✅ Contenu mis en cache pour utilisation hors ligne.');
              if (config && config.onSuccess) {
                config.onSuccess(registration);
              }
            }
          }
        };
      };
    })
    .catch((error) => {
      console.error('❌ Erreur lors de l\'enregistrement du SW:', error);
    });
}

function checkValidServiceWorker(swUrl: string, config?: Config) {
  fetch(swUrl, {
    headers: { 'Service-Worker': 'script' },
  })
    .then((response) => {
      const contentType = response.headers.get('content-type');
      if (
        response.status === 404 ||
        (contentType != null && contentType.indexOf('javascript') === -1)
      ) {
        navigator.serviceWorker?.ready.then((registration) => {
          registration.unregister().then(() => {
            window.location.reload();
          });
        });
      } else {
        if ('serviceWorker' in navigator && navigator.serviceWorker) {
          registerValidSW(swUrl, config, navigator.serviceWorker);
        }
      }
    })
    .catch(() => {
      console.log('Pas de connexion Internet. App en mode hors ligne.');
    });
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker?.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
}
