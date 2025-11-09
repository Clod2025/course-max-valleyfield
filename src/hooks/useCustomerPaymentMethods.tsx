import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface CustomerPaymentMethod {
  id: string;
  user_id: string;
  stripe_payment_method_id?: string;
  stripe_customer_id?: string;
  type: 'card' | 'interac' | 'cash';
  brand?: string;
  last4?: string;
  expiry_month?: number;
  expiry_year?: number;
  is_default: boolean;
  is_active: boolean;
  billing_details?: any;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

interface UseCustomerPaymentMethodsReturn {
  paymentMethods: CustomerPaymentMethod[];
  loading: boolean;
  error: string | null;
  fetchPaymentMethods: () => Promise<void>;
  addPaymentMethod: (paymentMethodData: {
    stripe_payment_method_id: string;
    stripe_customer_id?: string;
    type: 'card' | 'interac' | 'cash';
    brand?: string;
    last4?: string;
    expiry_month?: number;
    expiry_year?: number;
    billing_details?: any;
  }) => Promise<boolean>;
  updatePaymentMethod: (id: string, updates: Partial<CustomerPaymentMethod>) => Promise<boolean>;
  deletePaymentMethod: (id: string) => Promise<boolean>;
  setDefaultPaymentMethod: (id: string) => Promise<boolean>;
}

export const useCustomerPaymentMethods = (): UseCustomerPaymentMethodsReturn => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [paymentMethods, setPaymentMethods] = useState<CustomerPaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPaymentMethods = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('customer_payment_methods')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (fetchError) {
        // ✅ CORRECTION : Si la table n'existe pas (PGRST205), utiliser un tableau vide
        if (fetchError.code === 'PGRST205' || fetchError.message.includes('not found')) {
          console.warn('Table customer_payment_methods non trouvée, utilisation d\'un tableau vide');
          setPaymentMethods([]);
          return;
        }
        throw fetchError;
      }

      setPaymentMethods(data || []);
    } catch (err: any) {
      console.error('Erreur lors du chargement des méthodes de paiement:', err);
      // ✅ Ne pas afficher de toast si la table n'existe pas
      if (err.code !== 'PGRST205' && !err.message.includes('not found')) {
        setError(err.message || 'Erreur lors du chargement des méthodes de paiement');
        toast({
          title: "Erreur",
          description: err.message || 'Impossible de charger les méthodes de paiement',
          variant: "destructive"
        });
      } else {
        setPaymentMethods([]);
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id, toast]);

  const addPaymentMethod = useCallback(async (
    paymentMethodData: {
      stripe_payment_method_id: string;
      stripe_customer_id?: string;
      type: 'card' | 'interac' | 'cash';
      brand?: string;
      last4?: string;
      expiry_month?: number;
      expiry_year?: number;
      billing_details?: any;
    }
  ): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      // Si c'est la première méthode, elle devient par défaut
      const isFirstMethod = paymentMethods.length === 0;

      const { error: insertError } = await supabase
        .from('customer_payment_methods')
        .insert([{
          user_id: user.id,
          ...paymentMethodData,
          is_default: isFirstMethod,
          is_active: true
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
  }, [user, paymentMethods.length, fetchPaymentMethods]);

  const updatePaymentMethod = useCallback(async (
    id: string,
    updates: Partial<CustomerPaymentMethod>
  ): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const { error: updateError } = await supabase
        .from('customer_payment_methods')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id);

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
  }, [user, fetchPaymentMethods]);

  const deletePaymentMethod = useCallback(async (id: string): Promise<boolean> => {
    if (!user?.id) return false;

    if (paymentMethods.length === 1) {
      toast({
        title: "Impossible de supprimer",
        description: "Vous devez avoir au moins une méthode de paiement",
        variant: "destructive"
      });
      return false;
    }

    try {
      const methodToDelete = paymentMethods.find(m => m.id === id);
      const wasDefault = methodToDelete?.is_default;

      // Supprimer la méthode de paiement de Stripe si elle existe
      if (methodToDelete?.stripe_payment_method_id) {
        try {
          const { error: stripeError } = await supabase.functions.invoke('stripe-detach-payment-method', {
            body: {
              payment_method_id: methodToDelete.stripe_payment_method_id
            }
          });

          if (stripeError) {
            console.warn('Erreur lors de la suppression Stripe:', stripeError);
            // Continuer quand même avec la suppression en DB
          }
        } catch (stripeErr) {
          console.warn('Erreur Stripe:', stripeErr);
        }
      }

      // Supprimer de la base de données
      const { error: deleteError } = await supabase
        .from('customer_payment_methods')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      // Si la méthode supprimée était par défaut, définir la première restante comme par défaut
      if (wasDefault && paymentMethods.length > 1) {
        const firstRemaining = paymentMethods.find(m => m.id !== id);
        if (firstRemaining) {
          await updatePaymentMethod(firstRemaining.id, { is_default: true });
        }
      }

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
  }, [user, paymentMethods, fetchPaymentMethods, updatePaymentMethod]);

  const setDefaultPaymentMethod = useCallback(async (id: string): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      // Désactiver toutes les autres méthodes par défaut
      const methodsToUpdate = paymentMethods
        .filter(m => m.is_default && m.id !== id)
        .map(m => updatePaymentMethod(m.id, { is_default: false }));

      await Promise.all(methodsToUpdate);

      // Définir celle-ci comme par défaut
      return await updatePaymentMethod(id, { is_default: true });
    } catch (err) {
      console.error('Erreur lors de la définition de la méthode par défaut:', err);
      return false;
    }
  }, [user, paymentMethods, updatePaymentMethod]);

  useEffect(() => {
    if (user?.id) {
      fetchPaymentMethods();
    }
  }, [user?.id, fetchPaymentMethods]);

  return {
    paymentMethods,
    loading,
    error,
    fetchPaymentMethods,
    addPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    setDefaultPaymentMethod
  };
};

export default useCustomerPaymentMethods;
