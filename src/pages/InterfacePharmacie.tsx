import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Pill, 
  ShoppingCart, 
  Package, 
  TrendingUp, 
  Users, 
  AlertTriangle,
  Plus,
  Edit,
  Trash2,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  Activity,
  Heart,
  Shield,
  Zap
} from 'lucide-react';

interface PharmacyProduct {
  id: string;
  name: string;
  category: string;
  description?: string;
  price: number;
  stock: number;
  image?: string;
  prescription_required?: boolean;
  created_at: string;
}

interface PharmacyOrder {
  id: string;
  customer_name?: string;
  customer_phone?: string;
  status: string;
  total_amount: number;
  prescription_required?: boolean;
  created_at: string;
}

const InterfacePharmacie = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [products, setProducts] = useState<PharmacyProduct[]>([]);
  const [orders, setOrders] = useState<PharmacyOrder[]>([]);
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    totalProducts: 0,
    lowStockProducts: 0,
    totalSales: 0,
    todaySales: 0,
    prescriptionOrders: 0,
    overTheCounterOrders: 0
  });

  // Vérifier l'accès
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (profile?.role !== 'merchant' || profile?.type_marchand !== 'Pharmacie') {
      toast({
        title: "Accès refusé",
        description: "Cette interface est réservée aux pharmacies.",
        variant: "destructive"
      });
      navigate('/dashboard/client');
      return;
    }

    loadPharmacyData();
  }, [user, profile, loadPharmacyData]);

  const loadPharmacyData = useCallback(async () => {
    if (!user?.id) {
      console.error('User ID not available');
      return;
    }

    try {
      setLoading(true);
      
      // Charger les produits depuis la table products existante
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('merchant_id', user.id)
        .order('created_at', { ascending: false });

      if (productsError) {
        console.error('Erreur chargement produits:', productsError);
        setProducts([]);
      } else {
        setProducts(productsData || []);
      }

      // Charger les commandes depuis la table orders existante
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('store_id', user.id)
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('Erreur chargement commandes:', ordersError);
        setOrders([]);
      } else {
        setOrders(ordersData || []);
      }

      // Calculer les statistiques
      const totalOrders = ordersData?.length || 0;
      const pendingOrders = ordersData?.filter(order => order.status === 'pending').length || 0;
      const totalProducts = productsData?.length || 0;
      const lowStockProducts = productsData?.filter(p => p.stock < 10).length || 0;
      const totalSales = ordersData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
      const todaySales = ordersData
        ?.filter(order => new Date(order.created_at).toDateString() === new Date().toDateString())
        .reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
      const prescriptionOrders = ordersData?.filter(order => order.prescription_required === true).length || 0;
      const overTheCounterOrders = totalOrders - prescriptionOrders;

      setStats({
        totalOrders,
        pendingOrders,
        totalProducts,
        lowStockProducts,
        totalSales,
        todaySales,
        prescriptionOrders,
        overTheCounterOrders
      });

    } catch (error) {
      console.error('Erreur lors du chargement des données de la pharmacie:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données de la pharmacie.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, toast]);

  const getStatusColor = (status: string) => {
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'confirmed': return <CheckCircle className="h-4 w-4" />;
      case 'preparing': return <Activity className="h-4 w-4" />;
      case 'ready': return <Package className="h-4 w-4" />;
      case 'delivered': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-CA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
            <Pill className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Interface Pharmacie</h1>
              <p className="text-sm text-gray-600">Gestion de votre pharmacie</p>
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
              variant={activeTab === 'products' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveTab('products')}
            >
              <Package className="h-4 w-4 mr-2" />
              Produits
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
              variant={activeTab === 'prescriptions' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveTab('prescriptions')}
            >
              <Heart className="h-4 w-4 mr-2" />
              Ordonnances
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
              <Shield className="h-4 w-4 mr-2" />
              Paramètres
            </Button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-gray-900">Tableau de bord Pharmacie</h2>
              
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
                      {stats.pendingOrders} en attente
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Produits en stock</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalProducts}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats.lowStockProducts} stock faible
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ventes totales</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(stats.totalSales)}</div>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(stats.todaySales)} aujourd'hui
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ordonnances</CardTitle>
                    <Heart className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.prescriptionOrders}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats.overTheCounterOrders} sans ordonnance
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
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(order.status)}
                            <Badge className={getStatusColor(order.status)}>
                              {order.status}
                            </Badge>
                          </div>
                          <div>
                            <p className="font-medium">{order.customer_name || 'Client anonyme'}</p>
                            <p className="text-sm text-gray-600">{order.customer_phone || 'Non renseigné'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(order.total_amount)}</p>
                          <p className="text-sm text-gray-600">{formatDate(order.created_at)}</p>
                        </div>
                        {order.prescription_required === true && (
                          <Badge variant="outline" className="ml-2">
                            <Heart className="h-3 w-3 mr-1" />
                            Ordonnance
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold text-gray-900">Gestion des produits</h2>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un produit
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <Card key={product.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{product.name}</CardTitle>
                        {product.prescription_required && (
                          <Badge variant="outline">
                            <Heart className="h-3 w-3 mr-1" />
                            Ordonnance
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-2">{product.category}</p>
                      <p className="text-sm text-gray-600 mb-4">{product.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold">{formatCurrency(product.price)}</span>
                        <span className="text-sm text-gray-600">Stock: {product.stock}</span>
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
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(order.status)}
                            <Badge className={getStatusColor(order.status)}>
                              {order.status}
                            </Badge>
                          </div>
                          <div>
                            <p className="font-medium">{order.customer_name || 'Client anonyme'}</p>
                            <p className="text-sm text-gray-600">{order.customer_phone || 'Non renseigné'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(order.total_amount)}</p>
                          <p className="text-sm text-gray-600">{formatDate(order.created_at)}</p>
                        </div>
                        {order.prescription_required === true && (
                          <Badge variant="outline" className="ml-2">
                            <Heart className="h-3 w-3 mr-1" />
                            Ordonnance
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'prescriptions' && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-gray-900">Gestion des ordonnances</h2>
              
              <Card>
                <CardHeader>
                  <CardTitle>Ordonnances en attente</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {orders.filter(order => order.prescription_required === true).map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <Heart className="h-5 w-5 text-red-500" />
                          <div>
                            <p className="font-medium">{order.customer_name || 'Client anonyme'}</p>
                            <p className="text-sm text-gray-600">{order.customer_phone || 'Non renseigné'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(order.total_amount)}</p>
                          <p className="text-sm text-gray-600">{formatDate(order.created_at)}</p>
                        </div>
                        <Button size="sm">
                          Traiter
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-gray-900">Analytiques</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Ventes par catégorie</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {['Médicaments', 'Produits de soins', 'Suppléments', 'Équipements'].map((category) => (
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
                    <CardTitle>Commandes par type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Avec ordonnance</span>
                        <span className="font-medium">{stats.prescriptionOrders}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Sans ordonnance</span>
                        <span className="font-medium">{stats.overTheCounterOrders}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-gray-900">Paramètres de la pharmacie</h2>
              
              <Card>
                <CardHeader>
                  <CardTitle>Informations générales</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nom de la pharmacie</label>
                    <input
                      type="text"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="Nom de votre pharmacie"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Adresse</label>
                    <input
                      type="text"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="Adresse de votre pharmacie"
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

export default InterfacePharmacie;