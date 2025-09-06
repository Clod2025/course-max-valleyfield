import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface LoyaltyAccount {
  id: string;
  user_id: string;
  points: number;
  total_earned: number;
  total_redeemed: number;
  created_at: string;
  updated_at: string;
}

export interface LoyaltyTransaction {
  id: string;
  user_id: string;
  order_id?: string;
  points_change: number;
  reason: string;
  description?: string;
  created_at: string;
}

// Configuration des clés de cache pour la fidélité
export const loyaltyKeys = {
  all: ['loyalty'] as const,
  account: (userId: string) => [...loyaltyKeys.all, 'account', userId] as const,
  transactions: (userId: string) => [...loyaltyKeys.all, 'transactions', userId] as const,
};

// Hook pour récupérer le compte de fidélité
export const useLoyaltyAccount = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: loyaltyKeys.account(user?.id || ''),
    queryFn: async (): Promise<LoyaltyAccount | null> => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('loyalty_accounts')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // Ignore "not found"
      return data;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes en cache
    enabled: Boolean(user?.id),
  });
};

// Hook pour récupérer l'historique des transactions de fidélité
export const useLoyaltyTransactions = (limit: number = 20) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: [...loyaltyKeys.transactions(user?.id || ''), { limit }],
    queryFn: async (): Promise<LoyaltyTransaction[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('loyalty_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes en cache
    enabled: Boolean(user?.id),
  });
};

// Hook pour utiliser des points (livraison gratuite)
export const useRedeemPoints = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ points, reason, description }: { 
      points: number; 
      reason: string; 
      description?: string;
    }) => {
      if (!user?.id) throw new Error('Utilisateur non connecté');

      const { data, error } = await supabase.rpc('redeem_loyalty_points', {
        p_user_id: user.id,
        p_points_to_redeem: points,
        p_reason: reason,
        p_description: description,
      });

      if (error) throw error;
      if (!data) throw new Error('Points insuffisants');
      
      return data;
    },
    onSuccess: () => {
      // Invalider le cache
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: loyaltyKeys.account(user.id) });
        queryClient.invalidateQueries({ queryKey: loyaltyKeys.transactions(user.id) });
      }
      
      toast({
        title: "Points utilisés",
        description: "Livraison gratuite appliquée !",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'utiliser les points",
        variant: "destructive",
      });
    },
  });
};

// Hook utilitaire pour vérifier si l'utilisateur peut avoir une livraison gratuite
export const useCanGetFreeDelivery = () => {
  const { data: account } = useLoyaltyAccount();
  
  const POINTS_FOR_FREE_DELIVERY = 5000;
  const canRedeem = (account?.points || 0) >= POINTS_FOR_FREE_DELIVERY;
  const pointsNeeded = Math.max(0, POINTS_FOR_FREE_DELIVERY - (account?.points || 0));
  
  return {
    canRedeem,
    pointsNeeded,
    currentPoints: account?.points || 0,
    pointsRequired: POINTS_FOR_FREE_DELIVERY,
  };
};

// Hook pour calculer les points qu'un utilisateur gagnera avec un montant donné
export const useCalculatePointsForAmount = (amount: number) => {
  // 1 point par 10$ dépensés
  const pointsToEarn = Math.floor(amount / 10);
  
  return {
    pointsToEarn,
    amountPerPoint: 10,
    nextPointAt: (Math.floor(amount / 10) + 1) * 10,
    amountToNextPoint: (Math.floor(amount / 10) + 1) * 10 - amount,
  };
};