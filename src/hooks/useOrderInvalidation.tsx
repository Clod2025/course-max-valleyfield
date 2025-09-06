import { useQueryClient } from '@tanstack/react-query';
import { useInvalidateOrders, orderKeys } from './useRecentOrders';
import { productKeys } from './usePopularProducts';
import { storeKeys } from './useStores';

// Hook centralisé pour gérer toutes les invalidations après une commande
export const useOrderInvalidation = () => {
  const queryClient = useQueryClient();
  const { invalidateAfterOrder } = useInvalidateOrders();

  const invalidateAfterNewOrder = async (orderId: string, storeId: string) => {
    // Invalider toutes les requêtes liées aux commandes
    invalidateAfterOrder();

    // Invalider les produits populaires (ils peuvent changer après commande)
    await queryClient.invalidateQueries({ 
      queryKey: productKeys.popular() 
    });

    // Invalider les produits populaires du magasin spécifique
    await queryClient.invalidateQueries({ 
      queryKey: productKeys.popularByStore(storeId) 
    });

    // Invalider le cache du magasin (stocks peuvent avoir changé)
    await queryClient.invalidateQueries({ 
      queryKey: storeKeys.detail(storeId) 
    });

    // Invalider les statistiques et analytics
    await queryClient.invalidateQueries({ 
      queryKey: orderKeys.analytics() 
    });

    // Mettre à jour immédiatement le cache avec la nouvelle commande si disponible
    const newOrderData = await queryClient.fetchQuery({
      queryKey: orderKeys.detail(orderId),
      staleTime: 0, // Forcer le fetch
    });

    if (newOrderData) {
      // Optimistic update pour les commandes récentes
      queryClient.setQueryData(
        orderKeys.recent(),
        (oldData: any) => oldData ? [newOrderData, ...oldData.slice(0, 9)] : [newOrderData]
      );
    }
  };

  const invalidateAfterOrderStatusChange = async (orderId: string, newStatus: string) => {
    // Invalider les commandes par statut
    await queryClient.invalidateQueries({ 
      queryKey: orderKeys.byStatus(newStatus) 
    });

    // Invalider les commandes récentes
    await queryClient.invalidateQueries({ 
      queryKey: orderKeys.recent() 
    });

    // Mettre à jour optimiste du statut de la commande
    queryClient.setQueryData(
      orderKeys.detail(orderId),
      (oldData: any) => oldData ? { ...oldData, status: newStatus } : null
    );
  };

  const prefetchRelatedData = async (storeId: string) => {
    // Précharger les données susceptibles d'être consultées après une commande
    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: productKeys.popularByStore(storeId),
        staleTime: 2 * 60 * 1000,
      }),
      queryClient.prefetchQuery({
        queryKey: storeKeys.detail(storeId),
        staleTime: 5 * 60 * 1000,
      }),
    ]);
  };

  return {
    invalidateAfterNewOrder,
    invalidateAfterOrderStatusChange,
    prefetchRelatedData,
  };
};
