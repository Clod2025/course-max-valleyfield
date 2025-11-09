import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingCart, 
  Package, 
  DollarSign, 
  Users, 
  TrendingUp, 
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Eye,
  BarChart3
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MerchantHamburgerMenu } from './MerchantHamburgerMenu';
import { EnhancedOrdersDisplay } from './EnhancedOrdersDisplay';
import { ProductManager } from './ProductManager';
import { InventorySubmission } from './InventorySubmission';
import { PromotionManager } from './PromotionManager';
import { MerchantFinance } from './MerchantFinance';
import { MerchantSettings } from './MerchantSettings';
import { CommisManagementNew } from './CommisManagementNew';

interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  totalProducts: number;
  activeProducts: number;
  totalRevenue: number;
  monthlyRevenue: number;
  totalEmployees: number;
  activeEmployees: number;
}

export function MerchantDashboard() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [activeItem, setActiveItem] = useState('dashboard');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    pendingOrders: 0,
    totalProducts: 0,
    activeProducts: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalEmployees: 0,
    activeEmployees: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    setLoading(true);
    try {
      // Charger les statistiques du dashboard
      const [ordersResult, productsResult, employeesResult, revenueResult] = await Promise.allSettled([
        // Commandes
        supabase
          .from('commandes')
          .select('id, statut, total, date_commande')
          .eq('merchant_id', profile?.id),
        
        // Produits
        supabase
          .from('products')
          .select('id, is_active')
          .eq('merchant_id', profile?.id),
        
        // Employés
        supabase
          .from('commis')
          .select('id, is_active')
          .eq('merchant_id', profile?.id),
        
        // Revenus
        supabase
          .from('transactions')
          .select('montant, type, created_at')
          .eq('merchant_id', profile?.id)
          .eq('type', 'vente')
      ]);

      // Traiter les résultats
      const orders = ordersResult.status === 'fulfilled' ? ordersResult.value.data || [] : [];
      const products = productsResult.status === 'fulfilled' ? productsResult.value.data || [] : [];
      const employees = employeesResult.status === 'fulfilled' ? employeesResult.value.data || [] : [];
      const transactions = revenueResult.status === 'fulfilled' ? revenueResult.value.data || [] : [];

      // Calculer les statistiques
      const totalOrders = orders.length;
      const pendingOrders = orders.filter(o => o.statut === 'en_attente').length;
      const totalProducts = products.length;
      const activeProducts = products.filter(p => p.is_active).length;
      const totalEmployees = employees.length;
      const activeEmployees = employees.filter(e => e.is_active).length;
      
      const totalRevenue = transactions.reduce((sum, t) => sum + parseFloat(t.montant), 0);
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlyRevenue = transactions
        .filter(t => {
          const date = new Date(t.created_at);
          return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        })
        .reduce((sum, t) => sum + parseFloat(t.montant), 0);

      setStats({
        totalOrders,
        pendingOrders,
        totalProducts,
        activeProducts,
        totalRevenue,
        monthlyRevenue,
        totalEmployees,
        activeEmployees
      });

    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
      // Utiliser des données de démonstration
      setStats({
        totalOrders: 24,
        pendingOrders: 3,
        totalProducts: 156,
        activeProducts: 142,
        totalRevenue: 12450.75,
        monthlyRevenue: 3250.25,
        totalEmployees: 8,
        activeEmployees: 7
      });
      
      toast({
        title: "Mode démonstration",
        description: "Utilisation de données de démonstration pour le dashboard",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMenuItemClick = (item: string) => {
    setActiveItem(item);
  };

  const renderContent = () => {
    switch (activeItem) {
      case 'dashboard':
        return <DashboardContent stats={stats} loading={loading} onRefresh={loadDashboardStats} />;
      case 'orders':
        return <EnhancedOrdersDisplay />;
      case 'products':
        return <ProductManager />;
      case 'inventory':
        return <InventorySubmission />;
      case 'promotions':
        return <PromotionManager />;
      case 'finance':
        return <MerchantFinance />;
      case 'employees':
        return <CommisManagementNew />;
      case 'settings':
        return <MerchantSettings />;
      default:
        return <DashboardContent stats={stats} loading={loading} onRefresh={loadDashboardStats} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Menu latéral */}
      <MerchantHamburgerMenu
        onMenuItemClick={handleMenuItemClick}
        activeItem={activeItem}
        onSidebarToggle={setIsCollapsed}
        isCollapsed={isCollapsed}
      />

      {/* Contenu principal */}
      <div className={`transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-80'}`}>
        <div className="p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

interface DashboardContentProps {
  stats: DashboardStats;
  loading: boolean;
  onRefresh: () => void;
}

function DashboardContent({ stats, loading, onRefresh }: DashboardContentProps) {
  const { toast } = useToast();

  const statCards = [
    {
      title: 'Commandes Total',
      value: stats.totalOrders,
      icon: ShoppingCart,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      change: '+12%',
      changeType: 'positive' as const
    },
    {
      title: 'En Attente',
      value: stats.pendingOrders,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      change: stats.pendingOrders > 0 ? 'Action requise' : 'À jour',
      changeType: stats.pendingOrders > 0 ? 'warning' as const : 'positive' as const
    },
    {
      title: 'Produits Actifs',
      value: stats.activeProducts,
      icon: Package,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      change: `${Math.round((stats.activeProducts / stats.totalProducts) * 100)}% actifs`,
      changeType: 'positive' as const
    },
    {
      title: 'Revenus Mensuels',
      value: `$${stats.monthlyRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      change: '+8.5%',
      changeType: 'positive' as const
    }
  ];

  const recentActions = [
    { action: 'Nouvelle commande #1234', time: 'Il y a 5 min', type: 'order' },
    { action: 'Produit "Pommes" ajouté', time: 'Il y a 1h', type: 'product' },
    { action: 'Employé "Marie" activé', time: 'Il y a 2h', type: 'employee' },
    { action: 'Paiement reçu $45.50', time: 'Il y a 3h', type: 'payment' }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard Marchand</h1>
            <p className="text-muted-foreground">Vue d'ensemble de votre activité</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Marchand</h1>
          <p className="text-muted-foreground">Vue d'ensemble de votre activité</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={onRefresh}>
            <TrendingUp className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle Action
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <div className="flex items-center mt-2">
                      <Badge 
                        variant={stat.changeType === 'positive' ? 'default' : stat.changeType === 'warning' ? 'secondary' : 'destructive'}
                        className="text-xs"
                      >
                        {stat.change}
                      </Badge>
                    </div>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Contenu principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Actions récentes */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Activité Récente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActions.map((action, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="font-medium">{action.action}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{action.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Actions rapides */}
        <Card>
          <CardHeader>
            <CardTitle>Actions Rapides</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un Produit
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Users className="w-4 h-4 mr-2" />
              Gérer les Employés
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Eye className="w-4 h-4 mr-2" />
              Voir les Commandes
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <DollarSign className="w-4 h-4 mr-2" />
              Finance
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Alertes importantes */}
      {stats.pendingOrders > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              <div>
                <h3 className="font-semibold text-orange-800">Action Requise</h3>
                <p className="text-orange-700">
                  Vous avez {stats.pendingOrders} commande(s) en attente de traitement.
                </p>
              </div>
              <Button size="sm" className="ml-auto">
                Voir les Commandes
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
