import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  title?: string;
  body?: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  profiles?: {
    first_name?: string;
    last_name?: string;
  };
}

export interface ReviewFormData {
  rating: number;
  title?: string;
  body?: string;
}

// Configuration des clés de cache pour les avis
export const reviewKeys = {
  all: ['reviews'] as const,
  lists: () => [...reviewKeys.all, 'list'] as const,
  byProduct: (productId: string) => [...reviewKeys.lists(), 'product', productId] as const,
  byUser: (userId: string) => [...reviewKeys.lists(), 'user', userId] as const,
  details: () => [...reviewKeys.all, 'detail'] as const,
  detail: (id: string) => [...reviewKeys.details(), id] as const,
};

// Hook pour récupérer les avis d'un produit
export const useProductReviews = (
  productId: string,
  options?: {
    sortBy?: 'newest' | 'oldest' | 'rating_high' | 'rating_low';
    limit?: number;
    offset?: number;
  }
) => {
  const { sortBy = 'newest', limit = 10, offset = 0 } = options || {};

  return useQuery({
    queryKey: [...reviewKeys.byProduct(productId), { sortBy, limit, offset }],
    queryFn: async (): Promise<Review[]> => {
      let query = supabase
        .from('reviews')
        .select(`
          *,
          profiles(first_name, last_name)
        `)
        .eq('product_id', productId)
        .range(offset, offset + limit - 1);

      // Tri
      switch (sortBy) {
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'oldest':
          query = query.order('created_at', { ascending: true });
          break;
        case 'rating_high':
          query = query.order('rating', { ascending: false });
          break;
        case 'rating_low':
          query = query.order('rating', { ascending: true });
          break;
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes en cache
    enabled: Boolean(productId),
  });
};

// Hook pour récupérer un avis spécifique de l'utilisateur pour un produit
export const useUserProductReview = (productId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: [...reviewKeys.byProduct(productId), 'user', user?.id || ''],
    queryFn: async (): Promise<Review | null> => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', productId)
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // Ignore "not found"
      return data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: Boolean(productId && user?.id),
  });
};

// Hook pour créer un avis
export const useCreateReview = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ productId, reviewData }: { productId: string; reviewData: ReviewFormData }) => {
      if (!user?.id) throw new Error('Utilisateur non connecté');

      const { data, error } = await supabase
        .from('reviews')
        .insert({
          product_id: productId,
          user_id: user.id,
          ...reviewData,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // Invalider les avis du produit
      queryClient.invalidateQueries({ queryKey: reviewKeys.byProduct(data.product_id) });
      // Invalider les produits pour mettre à jour les ratings
      queryClient.invalidateQueries({ queryKey: ['products'] });
      
      toast({
        title: "Avis publié",
        description: "Votre avis a été publié avec succès",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de publier l'avis",
        variant: "destructive",
      });
    },
  });
};

// Hook pour mettre à jour un avis
export const useUpdateReview = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ reviewId, reviewData }: { reviewId: string; reviewData: Partial<ReviewFormData> }) => {
      const { data, error } = await supabase
        .from('reviews')
        .update(reviewData)
        .eq('id', reviewId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.byProduct(data.product_id) });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      
      toast({
        title: "Avis modifié",
        description: "Votre avis a été modifié avec succès",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de modifier l'avis",
        variant: "destructive",
      });
    },
  });
};

// Hook pour supprimer un avis
export const useDeleteReview = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (reviewId: string) => {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.all });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      
      toast({
        title: "Avis supprimé",
        description: "Votre avis a été supprimé",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer l'avis",
        variant: "destructive",
      });
    },
  });
};