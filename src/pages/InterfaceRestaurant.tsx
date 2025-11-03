import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  ChefHat, 
  ShoppingCart, 
  Package, 
  TrendingUp, 
  Users, 
  Clock,
  Plus,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Activity,
  Utensils,
  Coffee
} from 'lucide-react';

const InterfaceRestaurant = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    totalProducts: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    topSellingProduct: '',
    todayRevenue: 0
  });

  const loadRestaurantData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      
      // Charger les produits (plats)
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, name, category, price, stock, image, created_at')
        .eq('merchant_id', user.id)
        .order('created_at', { ascending: false });

      if (!productsError) {
        setProducts(productsData || []);
      }

      // Charger les commandes
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('id, order_number, status, total_amount, created_at, updated_at')
        .eq('store_id', user.id)
        .order('created_at', { ascending: false });

      if (!ordersError) {
        setOrders(ordersData || []);
      }

      // Calculer les statistiques
      const totalOrders = ordersData?.length || 0;
      const pendingOrders = ordersData?.filter(order => 
        ['pending', 'confirmed', 'preparing'].includes(order.status)
      ).length || 0;
      const totalProducts = productsData?.length || 0;
      const totalRevenue = ordersData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      const topSellingProduct = productsData?.reduce((max, p) => (p.stock > max.stock ? p : max), productsData[0])?.name || 'N/A';
      const todayRevenue = ordersData
        ?.filter(order => new Date(order.created_at).toDateString() === new Date().toDateString())
        .reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

      setStats({
        totalOrders,
        pendingOrders,
        totalProducts,
        totalRevenue,
        averageOrderValue,
        topSellingProduct,
        todayRevenue
      });

    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données du restaurant.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, toast]);

  // Vérifier l'accès
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (profile?.role !== 'store_manager' || profile?.type_marchand !== 'Restaurant') {
      toast({
        title: "Accès refusé",
        description: "Cette interface est réservée aux restaurants.",
        variant: "destructive"
      });
      navigate('/dashboard/client');
      return;
    }

    loadRestaurantData();
  }, [user, profile, loadRestaurantData]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-CA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-orange-100 text-orange-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'delivered': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ChefHat className="h-8 w-8 text-orange-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Interface Restaurant</h1>
              <p className="text-sm text-gray-600">Gestion de votre restaurant</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden"
          >
            Menu
          </Button>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'block' : 'hidden'} lg:block w-64 bg-white border-r border-gray-200 min-h-screen`}>
          <nav className="p-4 space-y-2">
            <Button
              variant={activeTab === 'dashboard' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveTab('dashboard')}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Tableau de bord
            </Button>
            <Button
              variant={activeTab === 'menu' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveTab('menu')}
            >
              <Utensils className="h-4 w-4 mr-2" />
              Gestion du menu
            </Button>
            <Button
              variant={activeTab === 'orders' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveTab('orders')}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Commandes
            </Button>
            <Button
              variant={activeTab === 'analytics' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveTab('analytics')}
            >
              <Activity className="h-4 w-4 mr-2" />
              Analytiques
            </Button>
            <Button
              variant={activeTab === 'settings' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveTab('settings')}
            >
              <Package className="h-4 w-4 mr-2" />
              Paramètres
            </Button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-gray-900">Tableau de bord Restaurant</h2>
              
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Commandes totales</CardTitle>
                    <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalOrders}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats.pendingOrders} en cours
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Plats au menu</CardTitle>
                    <Utensils className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalProducts}</div>
                    <p className="text-xs text-muted-foreground">
                      Plats disponibles
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Chiffre d'affaires</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(stats.todayRevenue)} aujourd'hui
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Panier moyen</CardTitle>
                    <Coffee className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(stats.averageOrderValue)}</div>
                    <p className="text-xs text-muted-foreground">
                      Par commande
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Orders */}
              <Card>
                <CardHeader>
                  <CardTitle>Commandes récentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {orders.slice(0, 5).map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <Badge className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                          <div>
                            <p className="font-medium">{order.customer_name || 'Client anonyme'}</p>
                            <p className="text-sm text-gray-600">{order.customer_phone || 'Non renseigné'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(order.total_amount)}</p>
                          <p className="text-sm text-gray-600">{formatDate(order.created_at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'menu' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold text-gray-900">Gestion du menu</h2>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un plat
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <Card key={product.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-2">{product.category}</p>
                      <p className="text-sm text-gray-600 mb-4">{product.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold">{formatCurrency(product.price)}</span>
                        <span className="text-sm text-gray-600">Disponible: {product.stock > 0 ? 'Oui' : 'Non'}</span>
                      </div>
                      <div className="flex space-x-2 mt-4">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-gray-900">Gestion des commandes</h2>
              
              <div className="space-y-4">
                {orders.map((order) => (
                  <Card key={order.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Badge className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                          <div>
                            <p className="font-medium">{order.customer_name || 'Client anonyme'}</p>
                            <p className="text-sm text-gray-600">{order.customer_phone || 'Non renseigné'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(order.total_amount)}</p>
                          <p className="text-sm text-gray-600">{formatDate(order.created_at)}</p>
                        </div>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline">
                            Voir détails
                          </Button>
                          {order.status === 'pending' && (
                            <Button size="sm">
                              Confirmer
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-gray-900">Analytiques Restaurant</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Plats populaires</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {['Entrées', 'Plats principaux', 'Desserts', 'Boissons'].map((category) => (
                        <div key={category} className="flex justify-between">
                          <span>{category}</span>
                          <span className="font-medium">{Math.floor(Math.random() * 100)}%</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Plat le plus vendu</span>
                        <span className="font-medium">{stats.topSellingProduct}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Panier moyen</span>
                        <span className="font-medium">{formatCurrency(stats.averageOrderValue)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-gray-900">Paramètres du restaurant</h2>
              
              <Card>
                <CardHeader>
                  <CardTitle>Informations générales</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nom du restaurant</label>
                    <input
                      type="text"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="Nom de votre restaurant"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Adresse</label>
                    <input
                      type="text"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="Adresse de votre restaurant"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Téléphone</label>
                    <input
                      type="tel"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="Numéro de téléphone"
                    />
                  </div>
                  <Button>Enregistrer les modifications</Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InterfaceRestaurant;