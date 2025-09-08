import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, X, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Vérifier si l'app est déjà installée
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppiOS = (window.navigator as any).standalone === true;
    
    if (isStandalone || isInWebAppiOS) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Afficher le prompt après 3 secondes
      setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    const result = await deferredPrompt.prompt();
    const userChoice = await result.userChoice;

    if (userChoice.outcome === 'accepted') {
      console.log('PWA installée avec succès!');
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    
    // Re-afficher dans 24 heures
    setTimeout(() => {
      if (deferredPrompt && !isInstalled) {
        setShowPrompt(true);
      }
    }, 24 * 60 * 60 * 1000);
  };

  if (!showPrompt || !deferredPrompt || isInstalled) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
      <Card className="w-80 bg-primary text-primary-foreground shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              <h4 className="font-semibold">Installer CourseMax</h4>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="text-primary-foreground hover:bg-primary-foreground/20 h-6 w-6 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <p className="text-sm text-primary-foreground/90 mb-4">
            Installez l'app pour un accès rapide et des notifications.
          </p>
          
          <div className="flex gap-2">
            <Button
              onClick={handleInstallClick}
              size="sm"
              variant="secondary"
              className="flex-1"
            >
              <Download className="w-4 h-4 mr-2" />
              Installer
            </Button>
            <Button
              onClick={handleDismiss}
              size="sm"
              variant="ghost"
              className="text-primary-foreground hover:bg-primary-foreground/20"
            >
              Plus tard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
