import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Package, 
  CheckCircle, 
  Clock, 
  XCircle,
  MapPin,
  Truck,
  User,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCurrentEmployee } from '@/hooks/useEmployeeAuth';

interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  item_status: 'to_find' | 'found' | 'not_available';
  product?: {
    id: string;
    name: string;
    unit: string;
    image_url?: string;
  };
}

interface OrderDetails {
  id: string;
  order_number: string;
  status: string;
  items: any;
  delivery_address: string;
  delivery_city: string;
  phone: string;
  total_amount: number;
  store?: {
    name: string;
    address: string;
  };
}

interface EmployeeOrderDetailsProps {
  orderId: string;
  onBack: () => void;
  onComplete?: () => void;
}

export const EmployeeOrderDetails: React.FC<EmployeeOrderDetailsProps> = ({
  orderId,
  onBack,
  onComplete
}) => {
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const currentEmployee = useCurrentEmployee();

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);

      // Récupérer la commande
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          status,
          items,
          delivery_address,
          delivery_city,
          phone,
          total_amount,
          store:stores(name, address)
        `)
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;

      setOrder(orderData as OrderDetails);

      // Récupérer les items avec leurs statuts
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          id,
          product_id,
          quantity,
          unit_price,
          total_price,
          item_status,
          product:products(id, name, unit, image_url)
        `)
        .eq('order_id', orderId);

      if (itemsError) throw itemsError;

      // Si pas encore de statuts, initialiser à 'to_find'
      if (!itemsData || itemsData.length === 0) {
        // Les items sont peut-être dans orders.items (JSONB)
        const orderItems = orderData.items as any[];
        const initialItems = orderItems.map((item, idx) => ({
          id: `temp-${idx}`,
          product_id: item.product_id || '',
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          item_status: 'to_find' as const,
          product: item.product
        }));
        setItems(initialItems);
      } else {
        setItems(itemsData as OrderItem[]);
      }
    } catch (error: any) {
      console.error('Erreur chargement détails commande:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les détails de la commande",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleItem = async (itemId: string, currentStatus: string) => {
    if (submitting) return;

    try {
      setSubmitting(true);

      // Calculer le nouveau statut
      let newStatus: 'to_find' | 'found' | 'not_available';
      if (currentStatus === 'to_find') {
        newStatus = 'found';
      } else if (currentStatus === 'found') {
        newStatus = 'to_find';
      } else {
        newStatus = 'found';
      }

      // Mettre à jour via la fonction Supabase si l'item existe en DB
      if (!itemId.startsWith('temp-')) {
        const { error } = await supabase
          .from('order_items')
          .update({ item_status: newStatus })
          .eq('id', itemId);

        if (error) throw error;
      }

      // Mettre à jour l'état local
      setItems(prev =>
        prev.map(item =>
          item.id === itemId ? { ...item, item_status: newStatus } : item
        )
      );

      toast({
        title: newStatus === 'found' ? "Produit trouvé ✓" : "Produit marqué à trouver",
        description: "Statut mis à jour"
      });
    } catch (error: any) {
      console.error('Erreur toggle item:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinishOrder = async () => {
    if (!allItemsFound) return;

    try {
      setSubmitting(true);

      // Vérifier qu'on a tous les items trouvés
      const allFound = items.every(item => item.item_status === 'found');
      if (!allFound) {
        toast({
          title: "Action impossible",
          description: "Tous les produits doivent être trouvés pour terminer la course",
          variant: "destructive"
        });
        return;
      }

      // Mettre à jour le statut de la commande à 'ready_for_pickup'
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'ready_for_pickup',
          fulfilled_by_employee: currentEmployee?.id
        })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Commande terminée ✓",
        description: "La commande est prête pour la livraison",
      });

      // Callback parent
      if (onComplete) {
        onComplete();
      }

      onBack();
    } catch (error: any) {
      console.error('Erreur finalisation commande:', error);
      toast({
        title: "Erreur",
        description: "Impossible de finaliser la commande",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const allItemsFound = items.length > 0 && items.every(item => item.item_status === 'found');
  const totalItems = items.length;
  const foundItems = items.filter(item => item.item_status === 'found').length;
  const progress = totalItems > 0 ? (foundItems / totalItems) * 100 : 0;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'found':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'to_find':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'not_available':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Package className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'found':
        return <Badge className="bg-green-50 text-green-700 border-green-200">Trouvé</Badge>;
      case 'to_find':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">À trouver</Badge>;
      case 'not_available':
        return <Badge variant="destructive">Non disponible</Badge>;
      default:
        return <Badge variant="outline">Inconnu</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement des détails...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Commande introuvable</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête commande */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Commande {order.order_number}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {order.store?.name || 'Magasin'}
              </p>
            </div>
            <Button variant="outline" onClick={onBack}>
              ← Retour
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Informations client */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground mt-1" />
              <div>
                <p className="text-sm font-medium">Adresse de livraison</p>
                <p className="text-sm text-muted-foreground">
                  {order.delivery_address}, {order.delivery_city}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <User className="w-4 h-4 text-muted-foreground mt-1" />
              <div>
                <p className="text-sm font-medium">Téléphone</p>
                <p className="text-sm text-muted-foreground">{order.phone}</p>
              </div>
            </div>
          </div>

          {/* Progression */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Progression</span>
              <span className="text-sm text-muted-foreground">
                {foundItems} / {totalItems} produits trouvés
              </span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Liste des produits */}
      <Card>
        <CardHeader>
          <CardTitle>Produits à préparer</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun produit dans cette commande
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-4 rounded-lg border hover:bg-gray-50 transition-colors"
                >
                  <Checkbox
                    checked={item.item_status === 'found'}
                    onCheckedChange={() => handleToggleItem(item.id, item.item_status)}
                    disabled={submitting || item.item_status === 'not_available'}
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{item.product?.name || 'Produit'}</p>
                      {getStatusBadge(item.item_status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Qté: {item.quantity} {item.product?.unit || 'unité'}
                      {' • '}
                      ${item.total_price.toFixed(2)}
                    </p>
                  </div>
                  {getStatusIcon(item.item_status)}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bouton finaliser */}
      <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div>
          <p className="font-medium text-blue-900">
            {allItemsFound ? '✓ Prêt à finaliser' : 'En préparation'}
          </p>
          <p className="text-sm text-blue-700">
            {allItemsFound
              ? 'Tous les produits sont trouvés'
              : `${totalItems - foundItems} produit(s) restant(s)`}
          </p>
        </div>
        <Button
          onClick={handleFinishOrder}
          disabled={!allItemsFound || submitting || items.length === 0}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Truck className="w-4 h-4 mr-2" />
          {submitting ? 'Finalisation...' : 'Terminer la course'}
        </Button>
      </div>
    </div>
  );
};