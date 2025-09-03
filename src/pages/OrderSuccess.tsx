import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Header } from '@/components/header';
import { AppFooter } from '@/components/AppFooter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Package, Clock, MapPin, Phone, Home } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface OrderDetails {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  delivery_address: string;
  delivery_city: string;
  phone: string;
  created_at: string;
  estimated_delivery?: string;
  store: {
    name: string;
    phone?: string;
  };
}

const OrderSuccess = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId || !user) return;

      try {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            stores!inner(name, phone)
          `)
          .eq('id', orderId)
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        setOrder((data as any));
      } catch (error) {
        console.error('Error fetching order:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, user]);

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

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-2">Commande introuvable</h2>
              <p className="text-muted-foreground mb-4">
                Cette commande n'existe pas ou vous n'avez pas les permissions pour la voir.
              </p>
              <Link to="/stores">
                <Button>Retour aux magasins</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
        <AppFooter />
      </div>
    );
  }

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
      case 'pending': return 'En attente de confirmation';
      case 'confirmed': return 'Confirmée par le marchand';
      case 'preparing': return 'En préparation';
      case 'ready_for_pickup': return 'Prête pour récupération';
      case 'in_delivery': return 'En livraison';
      case 'delivered': return 'Livrée';
      default: return status;
    }
  };

  const estimatedDelivery = order.estimated_delivery 
    ? new Date(order.estimated_delivery).toLocaleString('fr-CA')
    : 'Dans 25-45 minutes après confirmation';

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          {/* Success Header */}
          <Card className="mb-8">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold mb-2">Commande confirmée !</h1>
              <p className="text-muted-foreground mb-4">
                Votre commande a été passée avec succès
              </p>
              <div className="text-2xl font-bold text-primary">
                Commande #{order.order_number}
              </div>
            </CardContent>
          </Card>

          {/* Order Status */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Statut de la commande
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <span className="font-medium">Statut actuel:</span>
                <Badge className={`${getStatusColor(order.status)} text-white px-4 py-2`}>
                  {getStatusLabel(order.status)}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Livraison estimée</p>
                    <p className="text-muted-foreground">{estimatedDelivery}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Adresse</p>
                    <p className="text-muted-foreground">{order.delivery_address}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Details */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Détails de la commande</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium">Magasin</p>
                  <p className="text-muted-foreground">{order.store.name}</p>
                  {order.store.phone && (
                    <p className="text-muted-foreground flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {order.store.phone}
                    </p>
                  )}
                </div>
                <div>
                  <p className="font-medium">Total</p>
                  <p className="text-2xl font-bold text-primary">
                    {order.total_amount.toFixed(2)}$
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground">
                  Commande passée le {new Date(order.created_at).toLocaleString('fr-CA')}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Prochaines étapes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm mt-0.5">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Confirmation du marchand</p>
                    <p className="text-sm text-muted-foreground">
                      Le marchand va recevoir votre commande et la confirmer dans les prochaines minutes.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold text-sm mt-0.5">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Préparation de la commande</p>
                    <p className="text-sm text-muted-foreground">
                      Une fois confirmée, le marchand va préparer votre commande.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold text-sm mt-0.5">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Livraison</p>
                    <p className="text-sm text-muted-foreground">
                      Notre livreur récupèrera votre commande et vous la livrera dans les 25-45 minutes.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="text-center">
                <h3 className="font-semibold mb-2">Besoin d'aide ?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Vous pouvez nous contacter si vous avez des questions sur votre commande.
                </p>
                <div className="flex items-center justify-center gap-2 text-sm">
                  <Phone className="w-4 h-4" />
                  <span className="font-medium">450-123-4567</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Link to="/stores" className="flex-1">
              <Button variant="outline" className="w-full">
                Faire une autre commande
              </Button>
            </Link>
            <Link to="/" className="flex-1">
              <Button className="w-full">
                <Home className="w-4 h-4 mr-2" />
                Retour à l'accueil
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <AppFooter />
    </div>
  );
};

export default OrderSuccess;