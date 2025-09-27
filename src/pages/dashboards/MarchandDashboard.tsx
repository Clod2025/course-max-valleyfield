import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { AlertCircle, ShoppingCart, Clock, Package } from 'lucide-react';
import { MerchantHamburgerMenu } from '@/components/merchant/MerchantHamburgerMenu';
import { ProductManager } from '@/components/merchant/ProductManager';
import { MerchantFinance } from '@/components/merchant/MerchantFinance';
import { PromotionManager } from '@/components/merchant/PromotionManager';
import { InventorySubmission } from '@/components/merchant/InventorySubmission';
import { MerchantSettings } from '@/components/merchant/MerchantSettings';
import { EnhancedOrdersDisplay } from '@/components/merchant/EnhancedOrdersDisplay';

const MarchandDashboard = () => {
  const { profile, loading: authLoading, isRole } = useAuth();
  const navigate = useNavigate();
  const [activeMenuItem, setActiveMenuItem] = useState('orders'); // Par défaut sur les commandes
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // ✅ VÉRIFICATION CORRIGÉE AVEC TOUS LES RÔLES MARCHAND POSSIBLES
  const isMerchantRole = isRole(['merchant', 'store_manager', 'marchand', 'Merchant', 'Marchand', 'MERCHANT']);

  // Protection de route
  useEffect(() => {
    if (!authLoading && profile) {
      if (!isMerchantRole) {
        navigate('/auth/unauthorized');
      }
    }
  }, [profile, authLoading, navigate, isMerchantRole]);

  // Afficher loading pendant la vérification
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // ✅ VÉRIFICATION CORRIGÉE
  if (!profile || !isMerchantRole) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
              <h2 className="text-2xl font-bold mb-2">Accès non autorisé</h2>
              <p className="text-muted-foreground mb-4">
                Vous devez être connecté en tant que marchand pour accéder à cette page.
              </p>
              <div className="text-sm text-gray-500">
                <p>Rôle actuel: <strong>{profile?.role || 'Non défini'}</strong></p>
                <p>Rôles autorisés: merchant, store_manager, marchand</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const renderMainContent = () => {
    switch (activeMenuItem) {
      case 'products':
        return <ProductManager />;
      case 'inventory':
        return <InventorySubmission />;
      case 'promotions':
        return <PromotionManager />;
      case 'finance':
        return <MerchantFinance />;
      case 'settings':
        return <MerchantSettings />;
      case 'orders':
      default:
        return <EnhancedOrdersDisplay />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <MerchantHamburgerMenu 
        onMenuItemClick={setActiveMenuItem}
        activeItem={activeMenuItem}
        onSidebarToggle={setSidebarCollapsed}
        isCollapsed={sidebarCollapsed}
      />
      
      {/* Contenu principal avec espace pour le menu latéral */}
      <div className={`${sidebarCollapsed ? 'ml-20' : 'ml-80'} pt-16 transition-all duration-300`}>
        <div className="container mx-auto py-6 px-4 max-w-7xl">
          <div className="bg-white rounded-lg shadow-sm border min-h-[calc(100vh-8rem)]">
            <div className="p-6">
              {renderMainContent()}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};


export default MarchandDashboard;