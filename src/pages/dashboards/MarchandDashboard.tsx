import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { AlertCircle, ShoppingCart, Clock, Package } from 'lucide-react';
import { MerchantHeader } from '@/components/merchant/MerchantHeader';
import { ProductManager } from '@/components/merchant/ProductManager';
import { MerchantFinance } from '@/components/merchant/MerchantFinance';
import { PromotionManager } from '@/components/merchant/PromotionManager';
import { InventorySubmission } from '@/components/merchant/InventorySubmission';
import { MerchantSettings } from '@/components/merchant/MerchantSettings';
import { AppFooter } from '@/components/AppFooter';

const MarchandDashboard = () => {
  const { profile, loading: authLoading, isRole } = useAuth();
  const navigate = useNavigate();
  const [activeMenuItem, setActiveMenuItem] = useState('orders'); // Par défaut sur les commandes

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
        return <OrdersDisplay />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <MerchantHeader 
        onMenuItemClick={setActiveMenuItem}
        activeItem={activeMenuItem}
      />
      
      {/* Contenu principal avec espace pour le menu latéral */}
      <div className="lg:ml-80">
        <div className="container mx-auto py-6 px-4">
          {renderMainContent()}
        </div>
      </div>

      <AppFooter />
    </div>
  );
};

// Composant pour afficher les commandes (zone principale par défaut)
const OrdersDisplay = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simuler le chargement des commandes
    setTimeout(() => {
      setOrders([
        {
          id: '1',
          customer: 'Marie Dubois',
          items: ['Pommes Gala x2 kg', 'Lait 2L x1 unité'],
          total: 12.50,
          status: 'pending',
          time: '10:30'
        },
        {
          id: '2',
          customer: 'Jean Martin',
          items: ['Pain complet x1 unité', 'Beurre x1 unité'],
          total: 8.75,
          status: 'preparing',
          time: '10:45'
        },
        {
          id: '3',
          customer: 'Sophie Tremblay',
          items: ['Bananes x1.5 kg', 'Fromage cheddar x0.5 kg'],
          total: 15.25,
          status: 'ready',
          time: '11:15'
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Commandes en cours</h2>
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Commandes en cours</h2>
          <p className="text-muted-foreground">
            Gérez vos commandes et préparez les articles
          </p>
        </div>
        <Badge variant="secondary">{orders.length} commandes</Badge>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Aucune commande</h3>
            <p className="text-muted-foreground">
              Les nouvelles commandes apparaîtront ici
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => (
            <Card key={order.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{order.customer}</h3>
                    <p className="text-sm text-muted-foreground">
                      Commande #{order.id} • {order.time}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold">{order.total.toFixed(2)}$</div>
                    <Badge variant={
                      order.status === 'pending' ? 'secondary' :
                      order.status === 'preparing' ? 'default' : 
                      order.status === 'ready' ? 'outline' : 'destructive'
                    }>
                      {order.status === 'pending' ? 'En attente' :
                       order.status === 'preparing' ? 'En préparation' : 
                       order.status === 'ready' ? 'Prête' : 'Livrée'}
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <h4 className="font-medium">Articles commandés:</h4>
                  <ul className="text-sm text-muted-foreground">
                    {order.items.map((item, index) => (
                      <li key={index}>• {item}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="flex gap-3">
                  {order.status === 'pending' && (
                    <Button variant="outline" className="flex-1">
                      <Clock className="w-4 h-4 mr-2" />
                      Commencer préparation
                    </Button>
                  )}
                  {order.status === 'preparing' && (
                    <Button className="flex-1">
                      <Package className="w-4 h-4 mr-2" />
                      Marquer comme prête
                    </Button>
                  )}
                  {order.status === 'ready' && (
                    <Button variant="outline" className="flex-1" disabled>
                      <Package className="w-4 h-4 mr-2" />
                      En attente de livraison
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MarchandDashboard;