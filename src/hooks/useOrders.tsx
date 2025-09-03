import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface OrderItem {
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product?: {
    name: string;
    unit: string;
  };
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  store_id: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready_for_pickup' | 'in_delivery' | 'delivered' | 'cancelled';
  items: any;
  subtotal: number;
  tax_amount: number;
  delivery_fee: number;
  total_amount: number;
  delivery_address: string;
  delivery_city: string;
  delivery_postal_code?: string;
  phone: string;
  notes?: string;
  delivery_instructions?: string;
  created_at: string;
  updated_at: string;
  estimated_delivery?: string;
  delivered_at?: string;
  store?: {
    name: string;
    address: string;
    phone?: string;
  };
  profiles?: {
    first_name?: string;
    last_name?: string;
    email: string;
  };
}

export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchOrders = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('orders')
        .select(`
          *,
          store:stores(name, address, phone),
          profiles(first_name, last_name, email)
        `)
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching orders:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les commandes",
          variant: "destructive",
        });
        return;
      }

      setOrders((data as any) || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const createOrder = async (orderData: {
    store_id: string;
    items: OrderItem[];
    delivery_address: string;
    delivery_city: string;
    delivery_postal_code?: string;
    phone: string;
    notes?: string;
    delivery_instructions?: string;
  }) => {
    if (!user) return { error: 'Utilisateur non connecté' };

    try {
      const subtotal = orderData.items.reduce((sum, item) => sum + item.total_price, 0);
      const tax_amount = subtotal * 0.15; // 15% tax
      const delivery_fee = 5.99;
      const total_amount = subtotal + tax_amount + delivery_fee;

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          store_id: orderData.store_id,
          items: JSON.stringify(orderData.items),
          subtotal,
          tax_amount,
          delivery_fee,
          total_amount,
          delivery_address: orderData.delivery_address,
          delivery_city: orderData.delivery_city,
          delivery_postal_code: orderData.delivery_postal_code,
          phone: orderData.phone,
          notes: orderData.notes,
          delivery_instructions: orderData.delivery_instructions,
          status: 'pending' as const,
          order_number: `CM${Date.now()}`
        })
        .select()
        .single();

      if (orderError) {
        throw orderError;
      }

      // Create order items
      const orderItems = orderData.items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        throw itemsError;
      }

      toast({
        title: "Commande créée",
        description: `Votre commande ${order.order_number} a été créée avec succès`,
      });

      return { data: order, error: null };
    } catch (error: any) {
      console.error('Error creating order:', error);
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la création de la commande",
        variant: "destructive",
      });
      return { error: error.message };
    }
  };

  const updateOrderStatus = async (orderId: string, status: 'pending' | 'confirmed' | 'preparing' | 'ready_for_pickup' | 'in_delivery' | 'delivered' | 'cancelled') => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status,
          ...(status === 'delivered' && { delivered_at: new Date().toISOString() })
        })
        .eq('id', orderId);

      if (error) throw error;

      // Update local state
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status } : order
      ));

      toast({
        title: "Statut mis à jour",
        description: `La commande a été mise à jour`,
      });

      return { error: null };
    } catch (error: any) {
      console.error('Error updating order status:', error);
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la mise à jour",
        variant: "destructive",
      });
      return { error: error.message };
    }
  };

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  // Real-time subscription for orders
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          console.log('Order change received:', payload);
          fetchOrders(); // Refresh orders when changes occur
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    orders,
    loading,
    fetchOrders,
    createOrder,
    updateOrderStatus
  };
};