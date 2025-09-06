import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  image_url?: string;
  store_id: string;
  in_stock: boolean;
  unit?: string;
  created_at: string;
  popularity_score?: number;
}

// Configuration des clés de cache pour les produits
export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...productKeys.lists(), { filters }] as const,
  popular: () => [...productKeys.all, 'popular'] as const,
  popularByStore: (storeId: string) => [...productKeys.popular(), storeId] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
  byStore: (storeId: string) => [...productKeys.all, 'store', storeId] as const,
  byCategory: (category: string) => [...productKeys.all, 'category', category] as const,
};

// Hook pour récupérer les produits populaires globalement
export const usePopularProducts = (limit: number = 20, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: [...productKeys.popular(), { limit }],
    queryFn: async (): Promise<Product[]> => {
      // Simulation de popularité basée sur les commandes récentes
      // En production, vous pourriez avoir une table de statistiques
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          stores(name, type)
        `)
        .eq('in_stock', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    },
    staleTime: 15 * 60 * 1000, // 15 minutes - les produits populaires changent lentement
    gcTime: 30 * 60 * 1000, // 30 minutes en cache
    enabled: options?.enabled ?? true,
  });
};

// Hook pour récupérer les produits populaires d'un magasin spécifique
export const usePopularProductsByStore = (
  storeId: string, 
  limit: number = 10,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: [...productKeys.popularByStore(storeId), { limit }],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', storeId)
        .eq('in_stock', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 20 * 60 * 1000, // 20 minutes en cache
    enabled: Boolean(storeId) && (options?.enabled ?? true),
  });
};

// Hook pour récupérer les produits par catégorie
export const useProductsByCategory = (
  category: string,
  storeId?: string,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: [...productKeys.byCategory(category), { storeId }],
    queryFn: async (): Promise<Product[]> => {
      let query = supabase
        .from('products')
        .select('*')
        .eq('category', category)
        .eq('in_stock', true)
        .order('name');

      if (storeId) {
        query = query.eq('store_id', storeId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    staleTime: 8 * 60 * 1000, // 8 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes en cache
    enabled: Boolean(category) && (options?.enabled ?? true),
  });
};
