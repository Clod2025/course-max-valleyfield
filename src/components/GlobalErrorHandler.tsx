import React, { useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export const GlobalErrorHandler: React.FC = () => {
  const { toast } = useToast();

  // ✅ CORRECTION : Utiliser useCallback pour stabiliser les fonctions
  const handleError = useCallback((event: ErrorEvent) => {
    console.error('Erreur JavaScript globale:', event.error);
    
    // ✅ CORRECTION : Utiliser setTimeout pour éviter les mises à jour pendant le rendu
    setTimeout(() => {
      toast({
        title: "Erreur JavaScript",
        description: "Une erreur inattendue s'est produite. Veuillez recharger la page.",
        variant: "destructive",
      });
    }, 0);
  }, [toast]);

  const handleUnhandledRejection = useCallback((event: PromiseRejectionEvent) => {
    console.error('Promesse rejetée non gérée:', event.reason);
    
    // ✅ CORRECTION : Utiliser setTimeout pour éviter les mises à jour pendant le rendu
    setTimeout(() => {
      toast({
        title: "Erreur de promesse",
        description: "Une opération a échoué. Veuillez réessayer.",
        variant: "destructive",
      });
    }, 0);
  }, [toast]);

  useEffect(() => {
    // Ajouter les écouteurs d'événements
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Nettoyer les écouteurs
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [handleError, handleUnhandledRejection]);

  return null; // Ce composant ne rend rien
};

export default GlobalErrorHandler;
