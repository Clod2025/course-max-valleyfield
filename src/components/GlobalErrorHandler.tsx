import React, { useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

export const GlobalErrorHandler: React.FC = () => {
  const { toast } = useToast();
  
  // ✅ CORRECTION : Utiliser useRef pour capturer la fonction toast stable
  const toastRef = useRef(toast);
  toastRef.current = toast;

  // ✅ CORRECTION : useCallback sans dépendances pour éviter boucle infinie
  const handleError = useCallback((event: ErrorEvent) => {
    if (process.env.NODE_ENV === 'development') {
      console.error('Erreur JavaScript globale:', event.error);
    }
    
    // ✅ CORRECTION : Utiliser setTimeout pour éviter les mises à jour pendant le rendu
    setTimeout(() => {
      toastRef.current({
        title: "Erreur JavaScript",
        description: "Une erreur inattendue s'est produite. Veuillez recharger la page.",
        variant: "destructive",
      });
    }, 0);
  }, []); // ✅ Pas de dépendances = stable

  const handleUnhandledRejection = useCallback((event: PromiseRejectionEvent) => {
    if (process.env.NODE_ENV === 'development') {
      console.error('Promesse rejetée non gérée:', event.reason);
    }
    
    // ✅ CORRECTION : Utiliser setTimeout pour éviter les mises à jour pendant le rendu
    setTimeout(() => {
      toastRef.current({
        title: "Erreur de promesse",
        description: "Une opération a échoué. Veuillez réessayer.",
        variant: "destructive",
      });
    }, 0);
  }, []); // ✅ Pas de dépendances = stable

  useEffect(() => {
    // Ajouter les écouteurs d'événements
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Nettoyer les écouteurs
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [handleError, handleUnhandledRejection]); // ✅ Maintenant stable

  return null; // Ce composant ne rend rien
};

export default GlobalErrorHandler;
