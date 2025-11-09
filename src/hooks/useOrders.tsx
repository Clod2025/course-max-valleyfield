// hooks/useOrders.ts
import { useCallback, useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready_for_pickup'
  | 'in_delivery'
  | 'delivered'
  | 'cancelled';

export interface OrderItem {
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product?: {
    name: string;
    unit?: string;
  };
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  store_id: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  tax_amount: number;
  delivery_fee: number;
  total_amount: number;
  delivery_address?: string;
  delivery_city?: string;
  delivery_postal_code?: string;
  phone?: string;
  notes?: string;
  delivery_instructions?: string;
  created_at?: string;
  updated_at?: string;
  delivered_at?: string | null;
  store?: { name?: string; address?: string; phone?: string };
  profiles?: { first_name?: string; last_name?: string; email?: string };
}

export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const mounted = useRef(true);

  useEffect(() => {
    return () => {
      mounted.current = false;
    };
  }, []);

  const fetchOrders = useCallback(async () => {
    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/orders/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Impossible de récupérer les commandes');
      if (mounted.current) setOrders(body.orders || []);
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [user, toast]);

  const createOrder = useCallback(
    async (payload: {
      store_id: string;
      items: OrderItem[];
      delivery_address?: string;
      delivery_city?: string;
      delivery_postal_code?: string;
      phone?: string;
      notes?: string;
      delivery_instructions?: string;
    }) => {
      if (!user) return { error: 'Utilisateur non connecté' };
      if (isSubmitting) return { error: 'Déjà en cours' };

      setIsSubmitting(true);
      try {
        const res = await fetch('/api/orders/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: user.id, ...payload }),
        });

        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Erreur lors de la création de la commande');

        fetchOrders();
        toast({ title: 'Commande créée', description: 'Votre commande a été créée' });

        return { data: body.order, error: null };
      } catch (err: any) {
        toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
        return { error: err.message || 'Erreur inconnue' };
      } finally {
        setIsSubmitting(false);
      }
    },
    [user, isSubmitting, toast, fetchOrders]
  );

  const updateOrderStatus = useCallback(
    async (orderId: string, status: OrderStatus) => {
      try {
        const res = await fetch('/api/orders/update-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_id: orderId, status }),
        });

        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Impossible de mettre à jour la commande');

        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status, delivered_at: status === 'delivered' ? new Date().toISOString() : o.delivered_at } : o))
        );

        toast({ title: 'Statut mis à jour', description: 'Le statut de la commande a été modifié' });
        return { error: null };
      } catch (err: any) {
        toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
        return { error: err.message || 'Erreur' };
      }
    },
    [toast]
  );

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`orders-user-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const rec = payload.record as any;
          setOrders((prev) => {
            const idx = prev.findIndex((o) => o.id === rec.id);
            if (payload.eventType === 'DELETE') return prev.filter((o) => o.id !== rec.id);
            if (idx === -1) return [{ ...rec, items: Array.isArray(rec.items) ? rec.items : JSON.parse(rec.items) }, ...prev];
            const next = [...prev];
            next[idx] = { ...next[idx], ...rec, items: Array.isArray(rec.items) ? rec.items : JSON.parse(rec.items) };
            return next;
          });
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return { orders, loading, createOrder, updateOrderStatus, isSubmitting, refetch: fetchOrders };
};