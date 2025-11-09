import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface PaymentMethod {
  id: string;
  merchant_id: string;
  store_id?: string;
  type: 'square' | 'stripe' | 'paypal' | 'interac' | 'cash';
  provider_account_id?: string;
  credentials?: any; // JSON object for secure credentials
  is_enabled: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

interface UseMerchantPaymentMethodsReturn {
  paymentMethods: PaymentMethod[];
  loading: boolean;
  error: string | null;
  fetchPaymentMethods: () => Promise<void>;
  addPaymentMethod: (method: Omit<PaymentMethod, 'id' | 'merchant_id' | 'created_at' | 'updated_at'>) => Promise<boolean>;
  updatePaymentMethod: (id: string, updates: Partial<PaymentMethod>) => Promise<boolean>;
  deletePaymentMethod: (id: string) => Promise<boolean>;
  togglePaymentMethod: (id: string) => Promise<boolean>;
  setDefaultPaymentMethod: (id: string) => Promise<boolean>;
}

export const useMerchantPaymentMethods = (): UseMerchantPaymentMethodsReturn => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ CORRECTION : Retirer toast des dépendances pour éviter les boucles infinies
  const fetchPaymentMethods = useCallback(async () => {
    if (!profile?.user_id) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('merchant_payment_methods')
        .select('*')
        .eq('merchant_id', profile.user_id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setPaymentMethods(data || []);
    } catch (err: any) {
      console.error('Erreur lors du chargement des méthodes de paiement:', err);
      setError(err.message || 'Erreur lors du chargement des méthodes de paiement');
      // Utiliser toast directement sans dépendance pour éviter les boucles
      toast({
        title: "Erreur",
        description: err.message || 'Impossible de charger les méthodes de paiement',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [profile?.user_id]); // ✅ Retirer toast des dépendances

  const addPaymentMethod = useCallback(async (
    methodData: Omit<PaymentMethod, 'id' | 'merchant_id' | 'created_at' | 'updated_at'>
  ): Promise<boolean> => {
    if (!profile?.user_id) return false;

    try {
      const { error: insertError } = await supabase
        .from('merchant_payment_methods')
        .insert([{
          merchant_id: profile.user_id,
          store_id: profile.store_id,
          ...methodData
        }]);

      if (insertError) throw insertError;

      await fetchPaymentMethods();
      toast({
        title: "Succès",
        description: "Méthode de paiement ajoutée avec succès",
      });
      return true;
    } catch (err: any) {
      console.error('Erreur lors de l\'ajout d\'une méthode de paiement:', err);
      toast({
        title: "Erreur",
        description: err.message || 'Impossible d\'ajouter la méthode de paiement',
        variant: "destructive"
      });
      return false;
    }
  }, [profile, fetchPaymentMethods]); // ✅ Retirer toast des dépendances

  const updatePaymentMethod = useCallback(async (
    id: string,
    updates: Partial<PaymentMethod>
  ): Promise<boolean> => {
    if (!profile?.user_id) return false;

    try {
      const { error: updateError } = await supabase
        .from('merchant_payment_methods')
        .update(updates)
        .eq('id', id)
        .eq('merchant_id', profile.user_id);

      if (updateError) throw updateError;

      await fetchPaymentMethods();
      toast({
        title: "Succès",
        description: "Méthode de paiement mise à jour avec succès",
      });
      return true;
    } catch (err: any) {
      console.error('Erreur lors de la mise à jour d\'une méthode de paiement:', err);
      toast({
        title: "Erreur",
        description: err.message || 'Impossible de mettre à jour la méthode de paiement',
        variant: "destructive"
      });
      return false;
    }
  }, [profile, fetchPaymentMethods]); // ✅ Retirer toast des dépendances

  const deletePaymentMethod = useCallback(async (id: string): Promise<boolean> => {
    if (!profile?.user_id) return false;

    try {
      const { error: deleteError } = await supabase
        .from('merchant_payment_methods')
        .delete()
        .eq('id', id)
        .eq('merchant_id', profile.user_id);

      if (deleteError) throw deleteError;

      await fetchPaymentMethods();
      toast({
        title: "Succès",
        description: "Méthode de paiement supprimée avec succès",
      });
      return true;
    } catch (err: any) {
      console.error('Erreur lors de la suppression d\'une méthode de paiement:', err);
      toast({
        title: "Erreur",
        description: err.message || 'Impossible de supprimer la méthode de paiement',
        variant: "destructive"
      });
      return false;
    }
  }, [profile, fetchPaymentMethods]); // ✅ Retirer toast des dépendances

  const togglePaymentMethod = useCallback(async (id: string): Promise<boolean> => {
    const method = paymentMethods.find(m => m.id === id);
    if (!method) return false;

    return await updatePaymentMethod(id, { is_enabled: !method.is_enabled });
  }, [paymentMethods, updatePaymentMethod]);

  const setDefaultPaymentMethod = useCallback(async (id: string): Promise<boolean> => {
    try {
      // D'abord, désactiver tous les autres par défaut
      const methodsToUpdate = paymentMethods
        .filter(m => m.is_default && m.id !== id)
        .map(m => updatePaymentMethod(m.id, { is_default: false }));

      await Promise.all(methodsToUpdate);

      // Ensuite, définir celui-ci comme par défaut
      return await updatePaymentMethod(id, { is_default: true });
    } catch (err) {
      console.error('Erreur lors de la définition de la méthode par défaut:', err);
      return false;
    }
  }, [paymentMethods, updatePaymentMethod]);

  useEffect(() => {
    if (profile?.user_id) {
      fetchPaymentMethods();
    }
  }, [profile?.user_id, fetchPaymentMethods]); // ✅ fetchPaymentMethods est maintenant stable

  return {
    paymentMethods,
    loading,
    error,
    fetchPaymentMethods,
    addPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    togglePaymentMethod,
    setDefaultPaymentMethod
  };
};

export default useMerchantPaymentMethods;
