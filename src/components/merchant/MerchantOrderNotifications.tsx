import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Bell, Package, CheckCircle, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface NewOrder {
  id: string;
  order_number: string;
  total_amount: number;
  merchantAmount: number;
  items: any[];
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  delivery_address: string;
  created_at: string;
}

export const MerchantOrderNotifications: React.FC = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [newOrders, setNewOrders] = useState<NewOrder[]>([]);
  const [showNotification, setShowNotification] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<NewOrder | null>(null);

  useEffect(() => {
    if (!profile?.id) return;

    // Récupérer le store_id du merchant
    const fetchStoreId = async () => {
      const { data: store } = await supabase
        .from('stores')
        .select('id')
        .eq('manager_id', profile.user_id)
        .single();

      if (!store) return;

      // Écouter les nouvelles commandes avec statut "paid"
      const channel = supabase
        .channel(`merchant-orders-${store.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'orders',
            filter: `store_id=eq.${store.id}`,
          },
          async (payload) => {
            const order = payload.new as any;
            
            // Vérifier si c'est une commande payée
            if (order.status === 'paid' && order.payment?.status === 'succeeded') {
              // Récupérer les informations du client
              const { data: customerProfile } = await supabase
                .from('profiles')
                .select('first_name, last_name, email, phone')
                .eq('user_id', order.user_id)
                .single();

              const newOrder: NewOrder = {
                id: order.id,
                order_number: order.order_number,
                total_amount: order.total_amount,
                merchantAmount: order.breakdown?.merchantAmount || 0,
                items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items,
                customer: {
                  name: customerProfile 
                    ? `${customerProfile.first_name || ''} ${customerProfile.last_name || ''}`.trim()
                    : 'Client',
                  email: customerProfile?.email || '',
                  phone: customerProfile?.phone || order.phone || ''
                },
                delivery_address: order.delivery_address,
                created_at: order.created_at
              };

              setNewOrders(prev => [newOrder, ...prev]);
              setCurrentOrder(newOrder);
              setShowNotification(true);

              // Jouer une notification sonore (optionnel)
              try {
                const audio = new Audio('/notification.mp3');
                audio.play().catch(() => {
                  // Ignorer les erreurs de lecture audio
                });
              } catch (e) {
                // Ignorer
              }

              toast({
                title: "🎉 Nouvelle commande reçue!",
                description: `Commande ${order.order_number} - ${newOrder.total_amount.toFixed(2)}$`,
              });
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    fetchStoreId();
  }, [profile, toast]);

  const handleStartPreparation = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'preparing' })
        .eq('id', orderId);

      if (error) throw error;

      setNewOrders(prev => prev.filter(o => o.id !== orderId));
      setShowNotification(false);
      setCurrentOrder(null);

      toast({
        title: "Préparation commencée",
        description: "La commande est maintenant en préparation",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la mise à jour",
        variant: "destructive",
      });
    }
  };

  const handleReadyForDelivery = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'ready_for_pickup' })
        .eq('id', orderId);

      if (error) throw error;

      setNewOrders(prev => prev.filter(o => o.id !== orderId));
      setShowNotification(false);
      setCurrentOrder(null);

      toast({
        title: "Commande prête!",
        description: "Les livreurs ont été notifiés",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la mise à jour",
        variant: "destructive",
      });
    }
  };

  const handleDismiss = () => {
    setShowNotification(false);
    if (currentOrder) {
      setNewOrders(prev => prev.filter(o => o.id !== currentOrder.id));
      setCurrentOrder(null);
    }
  };

  if (!showNotification || !currentOrder) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md animate-in slide-in-from-top-5">
      <Card className="border-2 border-blue-500 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-full">
                <Bell className="w-5 h-5 text-blue-600 animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Nouvelle commande!</h3>
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

          <Alert className="mb-4 bg-blue-50 border-blue-200">
            <Package className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Montant à recevoir:</strong> {currentOrder.merchantAmount.toFixed(2)}$
            </AlertDescription>
          </Alert>

          <div className="space-y-3 mb-4">
            <div>
              <p className="text-sm font-medium">Client:</p>
              <p className="text-sm">{currentOrder.customer.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Adresse de livraison:</p>
              <p className="text-sm text-muted-foreground">{currentOrder.delivery_address}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Articles ({currentOrder.items.length}):</p>
              <div className="text-sm text-muted-foreground">
                {currentOrder.items.slice(0, 3).map((item: any, idx: number) => (
                  <div key={idx}>
                    • {item.quantity}x {item.name || item.product?.name || 'Produit'}
                  </div>
                ))}
                {currentOrder.items.length > 3 && (
                  <div>... et {currentOrder.items.length - 3} autres</div>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => handleStartPreparation(currentOrder.id)}
              className="flex-1"
              variant="default"
            >
              <Package className="w-4 h-4 mr-2" />
              Commencer la préparation
            </Button>
            <Button
              onClick={() => handleReadyForDelivery(currentOrder.id)}
              className="flex-1"
              variant="outline"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Prête pour livraison
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

