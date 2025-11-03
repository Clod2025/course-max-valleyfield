import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Promotion {
  id: string;
  merchant_id: string;
  store_id?: string;
  title: string;
  description?: string;
  discount_percent: number;
  start_at: string;
  end_at: string;
  is_active: boolean;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

interface UsePromotionsReturn {
  promotions: Promotion[];
  loading: boolean;
  error: string | null;
  activePromotions: Promotion[];
  expiredPromotions: Promotion[];
  futurePromotions: Promotion[];
  fetchPromotions: () => Promise<void>;
  addPromotion: (promotion: Omit<Promotion, 'id' | 'merchant_id' | 'created_at' | 'updated_at'>) => Promise<boolean>;
  updatePromotion: (id: string, updates: Partial<Promotion>) => Promise<boolean>;
  deletePromotion: (id: string) => Promise<boolean>;
  togglePromotionStatus: (id: string) => Promise<boolean>;
}

export const usePromotions = (): UsePromotionsReturn => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPromotions = useCallback(async () => {
    if (!profile?.user_id) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('promotions')
        .select('*')
        .eq('merchant_id', profile.user_id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setPromotions(data || []);
    } catch (err: any) {
      console.error('Erreur lors du chargement des promotions:', err);
      setError(err.message || 'Erreur lors du chargement des promotions');
      toast({
        title: "Erreur",
        description: err.message || 'Impossible de charger les promotions',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [profile?.user_id, toast]);

  const addPromotion = useCallback(async (
    promotionData: Omit<Promotion, 'id' | 'merchant_id' | 'created_at' | 'updated_at'>
  ): Promise<boolean> => {
    if (!profile?.user_id) return false;

    try {
      const { error: insertError } = await supabase
        .from('promotions')
        .insert([{
          merchant_id: profile.user_id,
          store_id: profile.store_id,
          ...promotionData
        }]);

      if (insertError) throw insertError;

      await fetchPromotions();
      toast({
        title: "Succès",
        description: "Promotion créée avec succès",
      });
      return true;
    } catch (err: any) {
      console.error('Erreur lors de l\'ajout d\'une promotion:', err);
      toast({
        title: "Erreur",
        description: err.message || 'Impossible de créer la promotion',
        variant: "destructive"
      });
      return false;
    }
  }, [profile, fetchPromotions, toast]);

  const updatePromotion = useCallback(async (
    id: string,
    updates: Partial<Promotion>
  ): Promise<boolean> => {
    if (!profile?.user_id) return false;

    try {
      const { error: updateError } = await supabase
        .from('promotions')
        .update(updates)
        .eq('id', id)
        .eq('merchant_id', profile.user_id);

      if (updateError) throw updateError;

      await fetchPromotions();
      toast({
        title: "Succès",
        description: "Promotion mise à jour avec succès",
      });
      return true;
    } catch (err: any) {
      console.error('Erreur lors de la mise à jour d\'une promotion:', err);
      toast({
        title: "Erreur",
        description: err.message || 'Impossible de mettre à jour la promotion',
        variant: "destructive"
      });
      return false;
    }
  }, [profile, fetchPromotions, toast]);

  const deletePromotion = useCallback(async (id: string): Promise<boolean> => {
    if (!profile?.user_id) return false;

    try {
      const { error: deleteError } = await supabase
        .from('promotions')
        .delete()
        .eq('id', id)
        .eq('merchant_id', profile.user_id);

      if (deleteError) throw deleteError;

      await fetchPromotions();
      toast({
        title: "Succès",
        description: "Promotion supprimée avec succès",
      });
      return true;
    } catch (err: any) {
      console.error('Erreur lors de la suppression d\'une promotion:', err);
      toast({
        title: "Erreur",
        description: err.message || 'Impossible de supprimer la promotion',
        variant: "destructive"
      });
      return false;
    }
  }, [profile, fetchPromotions, toast]);

  const togglePromotionStatus = useCallback(async (id: string): Promise<boolean> => {
    const promotion = promotions.find(p => p.id === id);
    if (!promotion) return false;

    return await updatePromotion(id, { is_active: !promotion.is_active });
  }, [promotions, updatePromotion]);

  // Catégoriser les promotions par statut
  const activePromotions = promotions.filter(p => {
    if (!p.is_active) return false;
    const now = new Date();
    const start = new Date(p.start_at);
    const end = new Date(p.end_at);
    return start <= now && now <= end;
  });

  const expiredPromotions = promotions.filter(p => {
    const now = new Date();
    const end = new Date(p.end_at);
    return end < now;
  });

  const futurePromotions = promotions.filter(p => {
    const now = new Date();
    const start = new Date(p.start_at);
    return start > now;
  });

  useEffect(() => {
    if (profile?.user_id) {
      fetchPromotions();
    }
  }, [profile?.user_id, fetchPromotions]);

  return {
    promotions,
    loading,
    error,
    activePromotions,
    expiredPromotions,
    futurePromotions,
    fetchPromotions,
    addPromotion,
    updatePromotion,
    deletePromotion,
    togglePromotionStatus
  };
};

export default usePromotions;
