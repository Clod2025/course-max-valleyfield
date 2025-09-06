import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingCart, 
  Clock, 
  CheckCircle, 
  XCircle,
  Eye,
  Package,
  User,
  MapPin,
  Phone
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  status: string;
  total_amount: number;
  created_at: string;
  items: Array<{
    product_name: string;
    quantity: number;
    price: number;
  }>;
}

const OrderManagement = () => {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      // Simuler des données pour l'instant
      const mockOrders: Order[] = [
        {
          id: '1',
          customer_name: 'Jean Dupuis',
          customer_phone: '(450) 555-0123',
          delivery_address: '123 Rue des Érables, Valleyfield',
          status: 'pending',
          total_amount: 45.50,
          created_at: '2024-01-28T10:30:00Z',
          items: [
            { product_name: 'Pain complet', quantity: 2, price: 3.50 },
            { product_name: 'Lait 2%', quantity: 1, price: 4.99 }
          ]
        },
        {
          id: '2',
          customer_name: 'Marie Tremblay',
          customer_phone: '(450) 555-0456',
          delivery_address: '456 Avenue du Parc, Valleyfield',
          status: 'preparing',
          total_amount: 32.75,
          created_at: '2024-01-28T09:15:00Z',
          items: [
            { product_name: 'Pommes', quantity: 3, price: 2.99 },
            { product_name: 'Bananes', quantity: 2, price: 1.99 }
          ]
        }
      ];
      setOrders(mockOrders);
    } catch (error) {
      console.error('Erreur lors du chargement des commandes:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />En attente</Badge>;
      case 'preparing':
        return <Badge className="bg-blue-500"><Package className="w-3 h-3 mr-1" />En préparation</Badge>;
      case 'ready':
        return <Badge className="bg-yellow-500"><CheckCircle className="w-3 h-3 mr-1" />Prêt</Badge>;
      case 'delivered':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Livré</Badge>;
      case 'cancelled':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Annulé</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      // Mettre à jour le statut de la commande
      setOrders(prev => 
        prev.map(order => 
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
    }
  };

  const filteredOrders = orders.filter(order => 
    selectedStatus === 'all' || order.status === selectedStatus
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement des commandes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestion des Commandes</h2>
          <p className="text-muted-foreground">Suivez et gérez les commandes de vos clients</p>
        </div>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Filtrer par statut:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">Toutes les commandes</option>
              <option value="pending">En attente</option>
              <option value="preparing">En préparation</option>
              <option value="ready">Prêt</option>
              <option value="delivered">Livré</option>
              <option value="cancelled">Annulé</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Liste des commandes */}
      <div className="space-y-4">
        {filteredOrders.map((order) => (
          <Card key={order.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <ShoppingCart className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Commande #{order.id}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>{order.customer_name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        <span>{order.customer_phone}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{order.delivery_address}</span>
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className="text-sm">
                        <strong>Total:</strong> ${order.total_amount.toFixed(2)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <strong>Date:</strong> {new Date(order.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    {getStatusBadge(order.status)}
                    <div className="mt-2">
                      <p className="text-sm font-medium">Articles:</p>
                      {order.items.map((item, index) => (
                        <p key={index} className="text-xs text-muted-foreground">
                          {item.quantity}x {item.product_name}
                        </p>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                    {order.status === 'pending' && (
                      <Button 
                        size="sm"
                        onClick={() => updateOrderStatus(order.id, 'preparing')}
                      >
                        Commencer
                      </Button>
                    )}
                    {order.status === 'preparing' && (
                      <Button 
                        size="sm"
                        onClick={() => updateOrderStatus(order.id, 'ready')}
                      >
                        Prêt
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredOrders.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Aucune commande trouvée</h3>
            <p className="text-muted-foreground">
              {selectedStatus !== 'all' 
                ? 'Aucune commande ne correspond à ce statut.'
                : 'Aucune commande pour le moment.'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OrderManagement;