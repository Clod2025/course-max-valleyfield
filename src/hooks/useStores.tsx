import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Store {
  id: string;
  name: string;
  address: string;
  phone?: string;
  type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Configuration des clés de cache bien structurées
export const storeKeys = {
  all: ['stores'] as const,
  lists: () => [...storeKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...storeKeys.lists(), { filters }] as const,
  details: () => [...storeKeys.all, 'detail'] as const,
  detail: (id: string) => [...storeKeys.details(), id] as const,
  nearby: (lat: number, lng: number, radius: number) => 
    [...storeKeys.all, 'nearby', { lat, lng, radius }] as const,
};

// Hook pour récupérer tous les magasins actifs
export const useStores = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: storeKeys.lists(),
    queryFn: async (): Promise<Store[]> => {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - les magasins changent peu
    gcTime: 10 * 60 * 1000, // 10 minutes en cache
    enabled: options?.enabled ?? true,
  });
};

// Hook pour récupérer un magasin spécifique
export const useStore = (storeId: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: storeKeys.detail(storeId),
    queryFn: async (): Promise<Store | null> => {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('id', storeId)
        .single();

      if (error) throw error;
      return data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - détails du magasin
    gcTime: 15 * 60 * 1000, // 15 minutes en cache
    enabled: Boolean(storeId) && (options?.enabled ?? true),
  });
};

// Hook pour invalider le cache des magasins
export const useInvalidateStores = () => {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: storeKeys.all }),
    invalidateList: () => queryClient.invalidateQueries({ queryKey: storeKeys.lists() }),
    invalidateStore: (storeId: string) => 
      queryClient.invalidateQueries({ queryKey: storeKeys.detail(storeId) }),
  };
};