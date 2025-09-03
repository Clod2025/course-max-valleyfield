import { useState, useEffect } from 'react';
import { Header } from '@/components/header';
import { AppFooter } from '@/components/AppFooter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useOrders } from '@/hooks/useOrders';
import { useAuth } from '@/hooks/useAuth';
import { 
  Clock, 
  CheckCircle, 
  Package, 
  AlertCircle,
  Eye,
  Phone,
  MapPin
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const MerchantDashboard = () => {
  const { orders, loading, updateOrderStatus } = useOrders();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  // Redirect if not merchant
  useEffect(() => {
    if (user && user.user_metadata?.role !== 'store_manager') {
      navigate('/');
    }
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Chargement...</div>
        </div>
        <AppFooter />
      </div>
    );
  }

  const pendingOrders = orders.filter(order => ['pending', 'confirmed', 'preparing'].includes(order.status));
  const readyOrders = orders.filter(order => order.status === 'ready_for_pickup');
  const completedOrders = orders.filter(order => ['delivered', 'in_delivery'].includes(order.status));

  const handleConfirmOrder = async (orderId: string) => {
    await updateOrderStatus(orderId, 'confirmed');
  };

  const handleMarkReady = async (orderId: string) => {
    await updateOrderStatus(orderId, 'ready_for_pickup');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'confirmed': return 'bg-blue-500';
      case 'preparing': return 'bg-orange-500';
      case 'ready_for_pickup': return 'bg-green-500';
      case 'in_delivery': return 'bg-purple-500';
      case 'delivered': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'confirmed': return 'Confirmée';
      case 'preparing': return 'En préparation';
      case 'ready_for_pickup': return 'Prête à récupérer';
      case 'in_delivery': return 'En livraison';
      case 'delivered': return 'Livrée';
      default: return status;
    }
  };

  const OrderCard = ({ order, showActions = true }: { order: any, showActions?: boolean }) => (
    <Card key={order.id} className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">Commande #{order.order_number}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {new Date(order.created_at).toLocaleString('fr-CA')}
            </p>
          </div>
          <Badge className={`${getStatusColor(order.status)} text-white`}>
            {getStatusLabel(order.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium flex items-center gap-2">
              <Package className="w-4 h-4" />
              {order.items?.length || 0} produit(s)
            </p>
            <p className="text-muted-foreground">Total: {order.total_amount?.toFixed(2)}$</p>
          </div>
          <div>
            <p className="font-medium flex items-center gap-2">
              <Phone className="w-4 h-4" />
              {order.phone}
            </p>
            <p className="text-muted-foreground flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {order.delivery_address}
            </p>
          </div>
        </div>

        {order.notes && (
          <div className="bg-accent/10 p-3 rounded-md">
            <p className="text-sm font-medium mb-1">Notes du client:</p>
            <p className="text-sm text-muted-foreground">{order.notes}</p>
          </div>
        )}

        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)}>
                <Eye className="w-4 h-4 mr-2" />
                Voir détails
              </Button>
            </DialogTrigger>
          </Dialog>

          {showActions && (
            <>
              {order.status === 'pending' && (
                <Button 
                  size="sm" 
                  onClick={() => handleConfirmOrder(order.id)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirmer
                </Button>
              )}
              
              {(order.status === 'confirmed' || order.status === 'preparing') && (
                <Button 
                  size="sm" 
                  onClick={() => handleMarkReady(order.id)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Package className="w-4 h-4 mr-2" />
                  Marquer prête
                </Button>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Tableau de bord marchand</h1>
          <p className="text-muted-foreground">Gérez vos commandes en temps réel</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold">{pendingOrders.length}</p>
                  <p className="text-sm text-muted-foreground">Nouvelles commandes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold">{readyOrders.length}</p>
                  <p className="text-sm text-muted-foreground">Prêtes à récupérer</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{completedOrders.length}</p>
                  <p className="text-sm text-muted-foreground">Complétées aujourd'hui</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{orders.length}</p>
                  <p className="text-sm text-muted-foreground">Total commandes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Orders Sections */}
        <div className="space-y-8">
          {/* Pending Orders */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-yellow-500" />
              Nouvelles commandes ({pendingOrders.length})
            </h2>
            {pendingOrders.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">Aucune nouvelle commande</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {pendingOrders.map(order => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            )}
          </section>

          {/* Ready Orders */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Package className="w-6 h-6 text-green-500" />
              Prêtes à récupérer ({readyOrders.length})
            </h2>
            {readyOrders.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">Aucune commande prête</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {readyOrders.map(order => (
                  <OrderCard key={order.id} order={order} showActions={false} />
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Order Details Dialog */}
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Détails de la commande #{selectedOrder?.order_number}</DialogTitle>
              <DialogDescription>
                Commande passée le {selectedOrder && new Date(selectedOrder.created_at).toLocaleString('fr-CA')}
              </DialogDescription>
            </DialogHeader>
            
            {selectedOrder && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Informations client</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <p><strong>Nom:</strong> {selectedOrder.profiles?.first_name} {selectedOrder.profiles?.last_name}</p>
                    <p><strong>Email:</strong> {selectedOrder.profiles?.email}</p>
                    <p><strong>Téléphone:</strong> {selectedOrder.phone}</p>
                    <p><strong>Adresse:</strong> {selectedOrder.delivery_address}, {selectedOrder.delivery_city}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Produits commandés</h3>
                  <div className="space-y-2">
                    {selectedOrder.items?.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between items-center p-2 border rounded">
                        <span>{item.product?.name || 'Produit'}</span>
                        <span>{item.quantity} × {item.unit_price?.toFixed(2)}$ = {item.total_price?.toFixed(2)}$</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-accent/10 p-4 rounded">
                  <div className="flex justify-between">
                    <span>Sous-total:</span>
                    <span>{selectedOrder.subtotal?.toFixed(2)}$</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxes:</span>
                    <span>{selectedOrder.tax_amount?.toFixed(2)}$</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Livraison:</span>
                    <span>{selectedOrder.delivery_fee?.toFixed(2)}$</span>
                  </div>
                  <div className="flex justify-between font-bold border-t pt-2">
                    <span>Total:</span>
                    <span>{selectedOrder.total_amount?.toFixed(2)}$</span>
                  </div>
                </div>

                {selectedOrder.notes && (
                  <div>
                    <h3 className="font-semibold mb-2">Notes du client</h3>
                    <p className="text-sm bg-accent/10 p-3 rounded">{selectedOrder.notes}</p>
                  </div>
                )}

                {selectedOrder.delivery_instructions && (
                  <div>
                    <h3 className="font-semibold mb-2">Instructions de livraison</h3>
                    <p className="text-sm bg-accent/10 p-3 rounded">{selectedOrder.delivery_instructions}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <AppFooter />
    </div>
  );
};

export default MerchantDashboard;