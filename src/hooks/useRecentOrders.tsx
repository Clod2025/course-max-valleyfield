import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface RecentOrder {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  delivery_address: string;
  delivery_city: string;
  created_at: string;
  updated_at: string;
  store: {
    id: string;
    name: string;
    type: string;
  };
  items: any[];
}

// Configuration des clés de cache pour les commandes
export const orderKeys = {
  all: ['orders'] as const,
  lists: () => [...orderKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...orderKeys.lists(), { filters }] as const,
  recent: () => [...orderKeys.all, 'recent'] as const,
  recentByUser: (userId: string) => [...orderKeys.recent(), userId] as const,
  details: () => [...orderKeys.all, 'detail'] as const,
  detail: (id: string) => [...orderKeys.details(), id] as const,
  byStatus: (status: string) => [...orderKeys.all, 'status', status] as const,
  analytics: () => [...orderKeys.all, 'analytics'] as const,
};

// Hook pour récupérer les commandes récentes de l'utilisateur connecté
export const useRecentOrders = (limit: number = 10, options?: { enabled?: boolean }) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: [...orderKeys.recentByUser(user?.id || ''), { limit }],
    queryFn: async (): Promise<RecentOrder[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          status,
          total_amount,
          delivery_address,
          delivery_city,
          created_at,
          updated_at,
          items,
          store:stores(id, name, type)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - les commandes récentes doivent être fraîches
    gcTime: 5 * 60 * 1000, // 5 minutes en cache
    enabled: Boolean(user?.id) && (options?.enabled ?? true),
  });
};

// Hook pour récupérer toutes les commandes récentes (admin/dashboard)
export const useAllRecentOrders = (limit: number = 50, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: [...orderKeys.recent(), 'all', { limit }],
    queryFn: async (): Promise<RecentOrder[]> => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          status,
          total_amount,
          delivery_address,
          delivery_city,
          created_at,
          updated_at,
          items,
          store:stores(id, name, type),
          profiles(first_name, last_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    },
    staleTime: 1 * 60 * 1000, // 1 minute pour les admins
    gcTime: 3 * 60 * 1000, // 3 minutes en cache
    enabled: options?.enabled ?? true,
  });
};

// Hook pour invalider le cache des commandes après une nouvelle commande
export const useInvalidateOrders = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return {
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: orderKeys.all }),
    invalidateUserOrders: () => {
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: orderKeys.recentByUser(user.id) });
      }
    },
    invalidateRecentOrders: () => 
      queryClient.invalidateQueries({ queryKey: orderKeys.recent() }),
    invalidateOrder: (orderId: string) => 
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderId) }),
    // Fonction utilitaire pour invalider après une commande
    invalidateAfterOrder: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.recent() });
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: orderKeys.recentByUser(user.id) });
      }
      // Invalider aussi les produits populaires qui pourraient changer
      queryClient.invalidateQueries({ queryKey: ['products', 'popular'] });
    },
  };
};

// Hook pour récupérer les commandes par statut
export const useOrdersByStatus = (
  status: string,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: [...orderKeys.byStatus(status)],
    queryFn: async (): Promise<RecentOrder[]> => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          status,
          total_amount,
          delivery_address,
          delivery_city,
          created_at,
          updated_at,
          items,
          store:stores(id, name, type),
          profiles(first_name, last_name, email)
        `)
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    staleTime: 30 * 1000, // 30 secondes pour les statuts actifs
    gcTime: 2 * 60 * 1000, // 2 minutes en cache
    enabled: Boolean(status) && (options?.enabled ?? true),
  });
};
