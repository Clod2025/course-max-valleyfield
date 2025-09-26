import { useEffect, useState, useCallback } from 'react';

interface UpdateStatus {
  isUpdateAvailable: boolean;
  isUpdating: boolean;
  lastUpdateCheck: Date | null;
}

export const useSilentUpdate = () => {
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>({
    isUpdateAvailable: false,
    isUpdating: false,
    lastUpdateCheck: null
  });

  // Vérifier les mises à jour disponibles
  const checkForUpdates = useCallback(async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        
        // Vérifier s'il y a une mise à jour disponible
        await registration.update();
        
        setUpdateStatus(prev => ({
          ...prev,
          lastUpdateCheck: new Date()
        }));

        console.log('🔍 Vérification de mise à jour effectuée');
      } catch (error) {
        console.error('❌ Erreur lors de la vérification de mise à jour:', error);
      }
    }
  }, []);

  // Forcer une mise à jour silencieuse
  const forceSilentUpdate = useCallback(async () => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      try {
        setUpdateStatus(prev => ({ ...prev, isUpdating: true }));
        
        // Envoyer un message au Service Worker pour forcer la mise à jour
        navigator.serviceWorker.controller.postMessage({
          type: 'SILENT_UPDATE'
        });

        console.log('🚀 Mise à jour silencieuse forcée');
        
        // Recharger la page après un court délai
        setTimeout(() => {
          window.location.reload();
        }, 1000);
        
      } catch (error) {
        console.error('❌ Erreur lors de la mise à jour silencieuse:', error);
        setUpdateStatus(prev => ({ ...prev, isUpdating: false }));
      }
    }
  }, []);

  // Vérifier les mises à jour périodiquement
  const startPeriodicUpdateCheck = useCallback(() => {
    // Vérifier toutes les 5 minutes
    const interval = setInterval(() => {
      checkForUpdates();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [checkForUpdates]);

  // Écouter les messages du Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'RELOAD_PAGE') {
          console.log('🔄 Rechargement de page demandé par le Service Worker');
          window.location.reload();
        }
      };

      navigator.serviceWorker.addEventListener('message', handleMessage);

      return () => {
        navigator.serviceWorker.removeEventListener('message', handleMessage);
      };
    }
  }, []);

  // Écouter les changements de Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const handleControllerChange = () => {
        console.log('🔄 Service Worker controller changé - mise à jour détectée');
        setUpdateStatus(prev => ({
          ...prev,
          isUpdateAvailable: true
        }));
      };

      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

      return () => {
        navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      };
    }
  }, []);

  // Démarrer la vérification automatique
  useEffect(() => {
    // Vérification initiale
    checkForUpdates();
    
    // Démarrer la vérification périodique
    const cleanup = startPeriodicUpdateCheck();
    
    return cleanup;
  }, [checkForUpdates, startPeriodicUpdateCheck]);

  return {
    ...updateStatus,
    checkForUpdates,
    forceSilentUpdate
  };
};
