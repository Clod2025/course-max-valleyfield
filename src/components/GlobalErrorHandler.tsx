import React, { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export const GlobalErrorHandler: React.FC = () => {
  const { toast } = useToast();

  useEffect(() => {
    // Gestionnaire d'erreurs global
    const handleError = (event: ErrorEvent) => {
      console.error('Erreur JavaScript globale:', event.error);
      
      // Afficher une notification d'erreur
      toast({
        title: "Erreur JavaScript",
        description: "Une erreur inattendue s'est produite. Veuillez recharger la page.",
        variant: "destructive",
      });
    };

    // Gestionnaire d'erreurs de promesses non capturées
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Promesse rejetée non gérée:', event.reason);
      
      // Afficher une notification d'erreur
      toast({
        title: "Erreur de promesse",
        description: "Une opération a échoué. Veuillez réessayer.",
        variant: "destructive",
      });
    };

    // Ajouter les écouteurs d'événements
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Nettoyer les écouteurs
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [toast]);

  return null; // Ce composant ne rend rien
};

export default GlobalErrorHandler;
