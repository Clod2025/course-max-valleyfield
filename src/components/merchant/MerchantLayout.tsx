import React, { useState, useEffect } from 'react';
import { MerchantHamburgerMenu } from './MerchantHamburgerMenu';
import { MerchantDashboard } from './MerchantDashboard';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface MerchantLayoutProps {
  children?: React.ReactNode;
}

export function MerchantLayout({ children }: MerchantLayoutProps) {
  const { profile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState('dashboard');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Gérer la connexion/déconnexion
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "Connexion rétablie",
        description: "Vous êtes de nouveau en ligne",
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "Connexion perdue",
        description: "Mode hors ligne activé",
        variant: "destructive"
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  useEffect(() => {
    // Vérifier si l'utilisateur est un marchand
    if (profile && !authLoading) {
      if (profile.role !== 'merchant' && profile.role !== 'store_manager' && profile.role !== 'marchand') {
        toast({
          title: "Accès refusé",
          description: "Cette interface est réservée aux marchands",
          variant: "destructive"
        });
        // Rediriger vers la page d'accueil ou de connexion
        window.location.href = '/';
      }
    }
  }, [profile, authLoading, toast]);

  const handleMenuItemClick = (item: string) => {
    setActiveItem(item);
  };

  const handleSidebarToggle = (collapsed: boolean) => {
    setIsCollapsed(collapsed);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement de l'interface marchand...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Accès non autorisé</h1>
          <p className="text-muted-foreground mb-4">Vous devez être connecté pour accéder à cette interface</p>
          <button 
            onClick={() => window.location.href = '/login'}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
          >
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Indicateur de connexion */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-orange-500 text-white text-center py-2 z-50">
          <p className="text-sm">Mode hors ligne - Certaines fonctionnalités peuvent être limitées</p>
        </div>
      )}

      {/* Menu latéral */}
      <MerchantHamburgerMenu
        onMenuItemClick={handleMenuItemClick}
        activeItem={activeItem}
        onSidebarToggle={handleSidebarToggle}
        isCollapsed={isCollapsed}
      />

      {/* Contenu principal */}
      <div className={`transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-80'}`}>
        <div className="p-6">
          {children || <MerchantDashboard />}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>© 2025 CourseMax</span>
              <span>•</span>
              <span>Interface Marchand</span>
              <span>•</span>
              <span className={`flex items-center gap-1 ${isOnline ? 'text-green-600' : 'text-orange-600'}`}>
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                {isOnline ? 'En ligne' : 'Hors ligne'}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span>Version 1.0.0</span>
              <span>•</span>
              <span>Marchand: {profile.first_name} {profile.last_name}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
