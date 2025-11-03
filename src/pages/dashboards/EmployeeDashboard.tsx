import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ShoppingCart, 
  LogOut, 
  User,
  AlertCircle,
  Package,
  CheckCircle,
  Clock,
  Truck
} from 'lucide-react';
import { useCurrentEmployee, useEmployeeAuth } from '@/hooks/useEmployeeAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MerchantEmployee } from '@/hooks/useEmployees';
import { EmployeeOrderDetails } from '@/components/employee/EmployeeOrderDetails';

interface Order {
  id: string;
  user_id: string;
  total_amount: number;
  status: string;
  created_at: string;
  fulfilled_by_employee?: string;
  order_number: string;
  phone: string;
}

const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const { logout } = useEmployeeAuth();
  const currentEmployee = useCurrentEmployee();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'details'>('list');

  useEffect(() => {
    // Vérifier si l'employé est authentifié
    if (!currentEmployee) {
      navigate('/employe');
      return;
    }

    // Charger les commandes
    fetchOrders();
  }, [currentEmployee, navigate]);

  const fetchOrders = async () => {
    if (!currentEmployee?.merchant_id) return;

    try {
      setLoading(true);
      
      // Récupérer les commandes du marchand
      const { data, error } = await supabase
        .from('orders')
        .select('id, user_id, total_amount, status, created_at, fulfilled_by_employee, order_number, phone')
        .eq('store_id', currentEmployee.store_id || '')
        .in('status', ['pending', 'preparing', 'ready_for_pickup', 'in_progress', 'completed'])
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setOrders(data || []);
    } catch (err: any) {
      console.error('Erreur lors du chargement des commandes:', err);
      toast({
        title: "Erreur",
        description: "Impossible de charger les commandes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOrder = async (orderId: string) => {
    if (!currentEmployee) return;

    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'preparing',
          fulfilled_by_employee: currentEmployee.id
        })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Commande acceptée",
        description: "Vous avez pris en charge cette commande",
      });

      fetchOrders();
      setSelectedOrder(null);
    } catch (err: any) {
      console.error('Erreur lors de l\'acceptation de la commande:', err);
      toast({
        title: "Erreur",
        description: "Impossible d'accepter la commande",
        variant: "destructive"
      });
    }
  };

  const handleCompleteOrder = async (orderId: string) => {
    if (!currentEmployee) return;

    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'completed' })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Commande complétée",
        description: "La commande a été marquée comme terminée",
      });

      fetchOrders();
      setSelectedOrder(null);
    } catch (err: any) {
      console.error('Erreur lors de la finalisation de la commande:', err);
      toast({
        title: "Erreur",
        description: "Impossible de finaliser la commande",
        variant: "destructive"
      });
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/employe');
  };

  if (!currentEmployee) {
    return null;
  }

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const preparingOrders = orders.filter(o => o.status === 'preparing');
  const readyOrders = orders.filter(o => o.status === 'ready_for_pickup');
  const inProgressOrders = orders.filter(o => o.status === 'in_progress');
  const completedOrders = orders.filter(o => o.status === 'completed' && o.fulfilled_by_employee === currentEmployee.id);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="w-3 h-3 mr-1" />En attente</Badge>;
      case 'preparing':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><Package className="w-3 h-3 mr-1" />Préparation</Badge>;
      case 'ready_for_pickup':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Prête</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200"><Truck className="w-3 h-3 mr-1" />En cours</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Terminée</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Commandes Employé</h1>
                <p className="text-sm text-muted-foreground">
                  {currentEmployee.first_name} {currentEmployee.last_name}
                </p>
              </div>
            </div>
            <Button onClick={handleLogout} variant="outline">
              <LogOut className="w-4 h-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">En attente</p>
                  <p className="text-2xl font-bold text-yellow-600">{pendingOrders.length}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">En préparation</p>
                  <p className="text-2xl font-bold text-blue-600">{preparingOrders.length}</p>
                </div>
                <Package className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Prêtes</p>
                  <p className="text-2xl font-bold text-green-600">{readyOrders.length}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">En cours</p>
                  <p className="text-2xl font-bold text-purple-600">{inProgressOrders.length}</p>
                </div>
                <Truck className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Mes complétées</p>
                  <p className="text-2xl font-bold text-green-600">{completedOrders.length}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Liste des commandes */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Chargement des commandes...</p>
            </div>
          </div>
        ) : viewMode === 'details' && selectedOrder ? (
          <EmployeeOrderDetails
            orderId={selectedOrder.id}
            onBack={() => {
              setViewMode('list');
              setSelectedOrder(null);
            }}
            onComplete={fetchOrders}
          />
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Aucune commande disponible</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Commandes en attente */}
            {pendingOrders.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-yellow-600" />
                  Commandes en attente ({pendingOrders.length})
                </h2>
                <div className="space-y-3">
                  {pendingOrders.map((order) => (
                    <Card key={order.id} className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => {
                        setSelectedOrder(order);
                        setViewMode('details');
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="font-bold">{order.order_number}</span>
                              {getStatusBadge(order.status)}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {order.phone} • ${order.total_amount.toFixed(2)}
                            </p>
                          </div>
                          <Button variant="outline" size="sm">
                            Ouvrir →
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Commandes en préparation */}
            {preparingOrders.length > 0 && (
              <div className="mt-8">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-600" />
                  En préparation ({preparingOrders.length})
                </h2>
                <div className="space-y-3">
                  {preparingOrders.map((order) => (
                    <Card key={order.id} className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => {
                        setSelectedOrder(order);
                        setViewMode('details');
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="font-bold">{order.order_number}</span>
                              {getStatusBadge(order.status)}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {order.phone} • ${order.total_amount.toFixed(2)}
                            </p>
                          </div>
                          <Button variant="outline" size="sm">
                            Ouvrir →
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Commandes prêtes */}
            {readyOrders.length > 0 && (
              <div className="mt-8">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Prêtes pour livraison ({readyOrders.length})
                </h2>
                <div className="space-y-3">
                  {readyOrders.map((order) => (
                    <Card key={order.id} className="cursor-pointer hover:shadow-md transition-shadow border-green-200"
                      onClick={() => {
                        setSelectedOrder(order);
                        setViewMode('details');
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="font-bold">{order.order_number}</span>
                              {getStatusBadge(order.status)}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {order.phone} • ${order.total_amount.toFixed(2)}
                            </p>
                          </div>
                          <Button variant="outline" size="sm">
                            Ouvrir →
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Commandes complétées */}
            {completedOrders.length > 0 && (
              <div className="mt-8">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Mes complétées ({completedOrders.length})
                </h2>
                <div className="space-y-3">
                  {completedOrders.map((order) => (
                    <Card key={order.id} className="cursor-pointer hover:shadow-md transition-shadow opacity-70"
                      onClick={() => {
                        setSelectedOrder(order);
                        setViewMode('details');
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="font-bold">{order.order_number}</span>
                              {getStatusBadge(order.status)}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {order.phone} • ${order.total_amount.toFixed(2)}
                            </p>
                          </div>
                          <Button variant="outline" size="sm">
                            Ouvrir →
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeDashboard;