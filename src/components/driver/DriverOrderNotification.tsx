import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Bell, Package, MapPin, DollarSign, X, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface ReadyOrder {
  id: string;
  order_number: string;
  driverAmount: number;
  tip: number;
  deliveryFee: number;
  store: {
    name: string;
    address: string;
  };
  customer: {
    name: string;
    address: string;
    phone: string;
  };
  created_at: string;
}

export const DriverOrderNotification: React.FC = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [readyOrders, setReadyOrders] = useState<ReadyOrder[]>([]);
  const [showNotification, setShowNotification] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<ReadyOrder | null>(null);

  useEffect(() => {
    if (!profile?.user_id) return;

    // Écouter les commandes prêtes pour livraison (ready_for_pickup)
    const channel = supabase
      .channel(`driver-orders-${profile.user_id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `status=eq.ready_for_pickup`,
        },
        async (payload) => {
          const order = payload.new as any;

          // Vérifier si le livreur n'est pas déjà assigné
          if (order.driver_id && order.driver_id !== profile.user_id) {
            return; // Commande déjà assignée à un autre livreur
          }

          // Récupérer les informations du magasin
          const { data: store } = await supabase
            .from('stores')
            .select('name, address')
            .eq('id', order.store_id)
            .single();

          // Récupérer les informations du client
          const { data: customerProfile } = await supabase
            .from('profiles')
            .select('first_name, last_name, phone')
            .eq('user_id', order.user_id)
            .single();

          const readyOrder: ReadyOrder = {
            id: order.id,
            order_number: order.order_number,
            driverAmount: order.breakdown?.driverAmount || (order.delivery_fee + (order.tip || 0)),
            tip: order.tip || 0,
            deliveryFee: order.delivery_fee || 0,
            store: {
              name: store?.name || 'Magasin',
              address: store?.address || ''
            },
            customer: {
              name: customerProfile 
                ? `${customerProfile.first_name || ''} ${customerProfile.last_name || ''}`.trim()
                : 'Client',
              address: order.delivery_address,
              phone: customerProfile?.phone || order.phone || ''
            },
            created_at: order.created_at
          };

          setReadyOrders(prev => [readyOrder, ...prev]);
          setCurrentOrder(readyOrder);
          setShowNotification(true);

          // Notification sonore
          try {
            const audio = new Audio('/notification.mp3');
            audio.play().catch(() => {});
          } catch (e) {}

          toast({
            title: "📦 Nouvelle livraison disponible!",
            description: `Commande ${order.order_number} - ${readyOrder.driverAmount.toFixed(2)}$`,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile, toast]);

  const handleAcceptDelivery = async (orderId: string) => {
    if (!profile?.user_id) return;

    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'in_delivery',
          driver_id: profile.user_id
        })
        .eq('id', orderId);

      if (error) throw error;

      setReadyOrders(prev => prev.filter(o => o.id !== orderId));
      setShowNotification(false);
      setCurrentOrder(null);

      toast({
        title: "Livraison acceptée!",
        description: "Vous pouvez maintenant récupérer la commande",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de l'acceptation",
        variant: "destructive",
      });
    }
  };

  const handleDismiss = () => {
    setShowNotification(false);
    if (currentOrder) {
      setReadyOrders(prev => prev.filter(o => o.id !== currentOrder.id));
      setCurrentOrder(null);
    }
  };

  if (!showNotification || !currentOrder) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md animate-in slide-in-from-top-5">
      <Card className="border-2 border-green-500 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-100 rounded-full">
                <Bell className="w-5 h-5 text-green-600 animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Livraison disponible!</h3>
                <p className="text-sm text-muted-foreground">
                  Commande #{currentOrder.order_number}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <Alert className="mb-4 bg-green-50 border-green-200">
            <DollarSign className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Vous recevrez:</strong> {currentOrder.driverAmount.toFixed(2)}$
              {currentOrder.tip > 0 && (
                <span className="block text-xs">
                  (Frais: {currentOrder.deliveryFee.toFixed(2)}$ + Pourboire: {currentOrder.tip.toFixed(2)}$)
                </span>
              )}
            </AlertDescription>
          </Alert>

          <div className="space-y-3 mb-4">
            <div>
              <p className="text-sm font-medium flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Adresse de récupération:
              </p>
              <p className="text-sm text-muted-foreground ml-6">
                {currentOrder.store.name}
                <br />
                {currentOrder.store.address}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium flex items-center gap-2">
                <Package className="w-4 h-4" />
                Adresse de livraison:
              </p>
              <p className="text-sm text-muted-foreground ml-6">
                {currentOrder.customer.name}
                <br />
                {currentOrder.customer.address}
                <br />
                Tel: {currentOrder.customer.phone}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => handleAcceptDelivery(currentOrder.id)}
              className="flex-1"
              variant="default"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Accepter la livraison
            </Button>
            <Button
              onClick={handleDismiss}
              className="flex-1"
              variant="outline"
            >
              Refuser
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

