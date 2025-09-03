import { useState, useEffect } from 'react';
import { Header } from '@/components/header';
import { AppFooter } from '@/components/AppFooter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Truck, 
  Package, 
  CheckCircle, 
  MapPin,
  Phone,
  Clock,
  Navigation,
  Eye
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

interface Delivery {
  id: string;
  order_id: string;
  status: 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'failed';
  pickup_time?: string;
  estimated_delivery?: string;
  actual_delivery?: string;
  tracking_code?: string;
  driver_notes?: string;
  delivery_notes?: string;
  created_at: string;
  orders: {
    id: string;
    order_number: string;
    delivery_address: string;
    delivery_city: string;
    delivery_postal_code?: string;
    phone: string;
    total_amount: number;
    status: string;
    delivery_instructions?: string;
    items: any;
    store: {
      name: string;
      address: string;
      phone?: string;
    };
    profiles: {
      first_name?: string;
      last_name?: string;
      email: string;
    };
  };
}

const DriverDashboard = () => {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Redirect if not driver
  useEffect(() => {
    if (user && user.user_metadata?.role !== 'livreur') {
      navigate('/');
    }
  }, [user, navigate]);

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('deliveries')
        .select(`
          *,
          orders!inner(
            *,
            stores!inner(name, address, phone),
            profiles!inner(first_name, last_name, email)
          )
        `)
        .eq('driver_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDeliveries((data as any) || []);
    } catch (error) {
      console.error('Error fetching deliveries:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les livraisons",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateDeliveryStatus = async (deliveryId: string, status: 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'failed') => {
    try {
      const updateData: any = { status };
      
      if (status === 'picked_up') {
        updateData.pickup_time = new Date().toISOString();
      } else if (status === 'delivered') {
        updateData.actual_delivery = new Date().toISOString();
      }

      const { error } = await supabase
        .from('deliveries')
        .update(updateData)
        .eq('id', deliveryId);

      if (error) throw error;

      // Also update order status
      let orderStatus: 'pending' | 'confirmed' | 'preparing' | 'ready_for_pickup' | 'in_delivery' | 'delivered' | 'cancelled' = 'in_delivery';
      if (status === 'delivered') {
        orderStatus = 'delivered';
      }

      const delivery = deliveries.find(d => d.id === deliveryId);
      if (delivery) {
        await supabase
          .from('orders')
          .update({ status: orderStatus })
          .eq('id', delivery.order_id);
      }

      fetchDeliveries();
      toast({
        title: "Statut mis à jour",
        description: "Le statut de la livraison a été mis à jour",
      });
    } catch (error) {
      console.error('Error updating delivery status:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la mise à jour du statut",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (user) {
      fetchDeliveries();
    }
  }, [user]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('deliveries-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'deliveries',
          filter: `driver_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Delivery change received:', payload);
          fetchDeliveries();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

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

  const assignedDeliveries = deliveries.filter(d => d.status === 'assigned');
  const activeDeliveries = deliveries.filter(d => ['picked_up', 'in_transit'].includes(d.status));
  const completedDeliveries = deliveries.filter(d => d.status === 'delivered');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return 'bg-blue-500';
      case 'picked_up': return 'bg-orange-500';
      case 'in_transit': return 'bg-purple-500';
      case 'delivered': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'assigned': return 'Assignée';
      case 'picked_up': return 'Récupérée';
      case 'in_transit': return 'En transit';
      case 'delivered': return 'Livrée';
      case 'failed': return 'Échec';
      default: return status;
    }
  };

  const DeliveryCard = ({ delivery, showActions = true }: { delivery: Delivery, showActions?: boolean }) => {
    const order = delivery.orders;
    
    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg">Commande #{order.order_number}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {new Date(delivery.created_at).toLocaleString('fr-CA')}
              </p>
            </div>
            <Badge className={`${getStatusColor(delivery.status)} text-white`}>
              {getStatusLabel(delivery.status)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium flex items-center gap-2">
                <Package className="w-4 h-4" />
                {order.store.name}
              </p>
              <p className="text-muted-foreground">{order.store.address}</p>
            </div>
            <div>
              <p className="font-medium flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {order.profiles.first_name} {order.profiles.last_name}
              </p>
              <p className="text-muted-foreground">{order.delivery_address}</p>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              <span>{order.phone}</span>
            </div>
            <div className="font-semibold">
              Total: {order.total_amount.toFixed(2)}$
            </div>
          </div>

          {delivery.estimated_delivery && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>
                Livraison prévue: {new Date(delivery.estimated_delivery).toLocaleString('fr-CA')}
              </span>
            </div>
          )}

          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" onClick={() => setSelectedDelivery(delivery)}>
                  <Eye className="w-4 h-4 mr-2" />
                  Voir détails
                </Button>
              </DialogTrigger>
            </Dialog>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const address = encodeURIComponent(`${order.delivery_address}, ${order.delivery_city}`);
                window.open(`https://maps.google.com?q=${address}`, '_blank');
              }}
            >
              <Navigation className="w-4 h-4 mr-2" />
              Navigation
            </Button>

            {showActions && (
              <>
                {delivery.status === 'assigned' && (
                  <Button 
                    size="sm" 
                    onClick={() => updateDeliveryStatus(delivery.id, 'picked_up')}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    <Package className="w-4 h-4 mr-2" />
                    Marquer récupérée
                  </Button>
                )}
                
                {delivery.status === 'picked_up' && (
                  <Button 
                    size="sm" 
                    onClick={() => updateDeliveryStatus(delivery.id, 'delivered')}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Marquer livrée
                  </Button>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Tableau de bord livreur</h1>
          <p className="text-muted-foreground">Gérez vos livraisons</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{assignedDeliveries.length}</p>
                  <p className="text-sm text-muted-foreground">Assignées</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold">{activeDeliveries.length}</p>
                  <p className="text-sm text-muted-foreground">En cours</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{completedDeliveries.length}</p>
                  <p className="text-sm text-muted-foreground">Complétées aujourd'hui</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">{deliveries.length}</p>
                  <p className="text-sm text-muted-foreground">Total livraisons</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Deliveries Sections */}
        <div className="space-y-8">
          {/* Assigned Deliveries */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Package className="w-6 h-6 text-blue-500" />
              Livraisons assignées ({assignedDeliveries.length})
            </h2>
            {assignedDeliveries.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">Aucune livraison assignée</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {assignedDeliveries.map(delivery => (
                  <DeliveryCard key={delivery.id} delivery={delivery} />
                ))}
              </div>
            )}
          </section>

          {/* Active Deliveries */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Truck className="w-6 h-6 text-orange-500" />
              Livraisons en cours ({activeDeliveries.length})
            </h2>
            {activeDeliveries.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">Aucune livraison en cours</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {activeDeliveries.map(delivery => (
                  <DeliveryCard key={delivery.id} delivery={delivery} />
                ))}
              </div>
            )}
          </section>

          {/* Completed Deliveries */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-500" />
              Livraisons complétées ({completedDeliveries.length})
            </h2>
            {completedDeliveries.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">Aucune livraison complétée aujourd'hui</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {completedDeliveries.slice(0, 5).map(delivery => (
                  <DeliveryCard key={delivery.id} delivery={delivery} showActions={false} />
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Delivery Details Dialog */}
        <Dialog open={!!selectedDelivery} onOpenChange={() => setSelectedDelivery(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Détails de la livraison</DialogTitle>
              <DialogDescription>
                Commande #{selectedDelivery?.orders.order_number}
              </DialogDescription>
            </DialogHeader>
            
            {selectedDelivery && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-2">Récupération</h3>
                    <div className="text-sm space-y-1">
                      <p><strong>Magasin:</strong> {selectedDelivery.orders.store.name}</p>
                      <p><strong>Adresse:</strong> {selectedDelivery.orders.store.address}</p>
                      {selectedDelivery.orders.store.phone && (
                        <p><strong>Téléphone:</strong> {selectedDelivery.orders.store.phone}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Livraison</h3>
                    <div className="text-sm space-y-1">
                      <p><strong>Client:</strong> {selectedDelivery.orders.profiles.first_name} {selectedDelivery.orders.profiles.last_name}</p>
                      <p><strong>Téléphone:</strong> {selectedDelivery.orders.phone}</p>
                      <p><strong>Adresse:</strong> {selectedDelivery.orders.delivery_address}, {selectedDelivery.orders.delivery_city}</p>
                    </div>
                  </div>
                </div>

                {selectedDelivery.orders.delivery_instructions && (
                  <div>
                    <h3 className="font-semibold mb-2">Instructions de livraison</h3>
                    <p className="text-sm bg-accent/10 p-3 rounded">{selectedDelivery.orders.delivery_instructions}</p>
                  </div>
                )}

                <div>
                  <h3 className="font-semibold mb-2">Produits à livrer</h3>
                  <div className="space-y-2">
                    {selectedDelivery.orders.items?.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between items-center p-2 border rounded">
                        <span>{item.product?.name || 'Produit'}</span>
                        <span>{item.quantity} × {item.unit_price?.toFixed(2)}$</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 pt-2 border-t font-semibold">
                    Total à collecter: {selectedDelivery.orders.total_amount.toFixed(2)}$
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      const storeAddress = encodeURIComponent(selectedDelivery.orders.store.address);
                      window.open(`https://maps.google.com?q=${storeAddress}`, '_blank');
                    }}
                  >
                    Navigation vers le magasin
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const clientAddress = encodeURIComponent(`${selectedDelivery.orders.delivery_address}, ${selectedDelivery.orders.delivery_city}`);
                      window.open(`https://maps.google.com?q=${clientAddress}`, '_blank');
                    }}
                  >
                    Navigation vers le client
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <AppFooter />
    </div>
  );
};

export default DriverDashboard;