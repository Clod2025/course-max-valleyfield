import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface OrderItem {
  product_id: string;
  quantity: number;
}

export const useOrderStock = () => {
  const updateStockForOrder = useCallback(async (items: OrderItem[]) => {
    try {
      // Décrémenter le stock pour chaque produit de la commande
      const stockUpdates = items.map(item => 
        supabase.rpc('decrement_product_stock', {
          product_id: item.product_id,
          quantity: item.quantity
        })
      );

      const results = await Promise.all(stockUpdates);
      
      // Vérifier s'il y a des erreurs
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        throw new Error(`Erreur lors de la mise à jour du stock: ${errors[0].error?.message}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Erreur lors de la mise à jour du stock:', error);
      throw error;
    }
  }, []);

  const restoreStockForOrder = useCallback(async (items: OrderItem[]) => {
    try {
      // Restaurer le stock pour chaque produit (en cas d'annulation)
      const stockUpdates = items.map(item => 
        supabase.rpc('increment_product_stock', {
          product_id: item.product_id,
          quantity: item.quantity
        })
      );

      const results = await Promise.all(stockUpdates);
      
      // Vérifier s'il y a des erreurs
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        throw new Error(`Erreur lors de la restauration du stock: ${errors[0].error?.message}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Erreur lors de la restauration du stock:', error);
      throw error;
    }
  }, []);

  return {
    updateStockForOrder,
    restoreStockForOrder
  };
};
