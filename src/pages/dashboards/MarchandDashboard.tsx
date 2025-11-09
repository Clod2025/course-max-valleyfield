import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { MerchantHamburgerMenu } from '@/components/merchant/MerchantHamburgerMenu';
import { ProductManager } from '@/components/merchant/ProductManager';
import { MerchantFinance } from '@/components/merchant/MerchantFinance';
import { PromotionManager } from '@/components/merchant/PromotionManager';
import { InventorySubmission } from '@/components/merchant/InventorySubmission';
import { MerchantSettings } from '@/components/merchant/MerchantSettings';
import { EnhancedOrdersDisplay } from '@/components/merchant/EnhancedOrdersDisplay';
import { EmployeesManager } from '@/components/merchant/EmployeesManager';
import { PaymentSettings } from '@/components/merchant/PaymentSettings';
import { MerchantOrderNotifications } from '@/components/merchant/MerchantOrderNotifications';

const MarchandDashboard: React.FC = () => {
  const { profile, loading: authLoading, isRole } = useAuth();
  const navigate = useNavigate();
  const [activeMenuItem, setActiveMenuItem] = useState('orders');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // ✅ Vérification côté front : supermarché uniquement
  const isSupermarche =
    isRole(['store_manager', 'Store Manager']) &&
    profile?.type_marchand === 'Supermarché';

  // Protection de route côté front
  useEffect(() => {
    if (!authLoading && profile) {
      if (!isSupermarche) {
        if (profile?.type_compte === 'Marchand' || profile?.role === 'store_manager') {
          switch (profile?.type_marchand) {
            case 'Pharmacie':
              navigate('/interface-pharmacie');
              return;
            case 'Restaurant':
              navigate('/interface-restaurant');
              return;
            case 'Épicerie':
              navigate('/interface-epicerie');
              return;
            default:
              break;
          }
        } else {
          navigate('/auth/unauthorized');
        }
      }
    }
  }, [profile, authLoading, navigate, isSupermarche, isRole]);

  // Loading pendant vérification
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Accès non autorisé
  if (!profile || !isSupermarche) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
              <h2 className="text-2xl font-bold mb-2">Accès non autorisé</h2>
              <p className="text-muted-foreground mb-4">
                Cette interface est réservée aux supermarchés.
              </p>
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
      case 'employees':
        return <EmployeesManager />;
      case 'payments':
        return <PaymentSettings />;
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

      {/* Notifications de nouvelles commandes */}
      <MerchantOrderNotifications />

      {/* Contenu principal */}
      <div className={`${sidebarCollapsed ? 'ml-20' : 'ml-80'} pt-16 transition-all duration-300`}>
        <div className="container mx-auto py-6 px-4 max-w-7xl">
          <div className="bg-white rounded-lg shadow-sm border min-h-[calc(100vh-8rem)]">
            <div className="p-6">{renderMainContent()}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarchandDashboard;