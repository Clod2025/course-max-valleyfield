import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Générer un ID de session unique pour le browser
const generateSessionId = (): string => {
  const stored = localStorage.getItem('coursemax_session_id');
  if (stored) return stored;
  
  const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  localStorage.setItem('coursemax_session_id', newSessionId);
  return newSessionId;
};

// Types pour les événements
export interface EventPayload {
  [key: string]: any;
}

export interface ProductViewEvent {
  product_id: string;
  product_name: string;
  category: string;
  price: number;
  store_id: string;
}

export interface AddToCartEvent {
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  store_id: string;
}

export interface OrderCompleteEvent {
  order_id: string;
  order_number: string;
  total_amount: number;
  items_count: number;
  store_id: string;
  delivery_fee: number;
}

// Hook principal pour le tracking
export const useEventTracking = () => {
  const logEventMutation = useMutation({
    mutationFn: async ({
      eventType,
      payload = {},
      pageUrl = window.location.href,
      userAgent = navigator.userAgent,
      referrer = document.referrer || undefined,
    }: {
      eventType: string;
      payload?: EventPayload;
      pageUrl?: string;
      userAgent?: string;
      referrer?: string;
    }) => {
      const sessionId = generateSessionId();

      const { data, error } = await supabase.rpc('log_event', {
        p_session_id: sessionId,
        p_event_type: eventType,
        p_payload: payload,
        p_page_url: pageUrl,
        p_user_agent: userAgent,
        p_referrer: referrer,
      });

      if (error) throw error;
      return data;
    },
  });

  // Fonction helper générique
  const logEvent = (eventType: string, payload?: EventPayload) => {
    logEventMutation.mutate({ eventType, payload });
  };

  // Fonctions spécialisées pour chaque type d'événement
  const trackPageView = (pageUrl?: string) => {
    logEvent('page_view', { page_url: pageUrl || window.location.href });
  };

  const trackProductView = (product: ProductViewEvent) => {
    logEvent('product_view', product);
  };

  const trackAddToCart = (item: AddToCartEvent) => {
    logEvent('add_to_cart', item);
  };

  const trackRemoveFromCart = (item: Omit<AddToCartEvent, 'quantity'>) => {
    logEvent('remove_from_cart', item);
  };

  const trackBeginCheckout = (cartData: {
    items_count: number;
    total_amount: number;
    store_id: string;
  }) => {
    logEvent('begin_checkout', cartData);
  };

  const trackOrderComplete = (order: OrderCompleteEvent) => {
    logEvent('order_complete', order);
  };

  const trackSearch = (searchData: {
    query: string;
    results_count: number;
    filters?: any;
  }) => {
    logEvent('search_product', searchData);
  };

  const trackStoreClick = (storeData: {
    store_id: string;
    store_name: string;
    store_type: string;
  }) => {
    logEvent('click_store', storeData);
  };

  return {
    logEvent,
    trackPageView,
    trackProductView,
    trackAddToCart,
    trackRemoveFromCart,
    trackBeginCheckout,
    trackOrderComplete,
    trackSearch,
    trackStoreClick,
    isLoading: logEventMutation.isPending,
  };
};

// Hook pour tracker automatiquement les vues de pages
export const usePageViewTracking = () => {
  const { trackPageView } = useEventTracking();

  // Tracker la vue de page actuelle au montage
  React.useEffect(() => {
    trackPageView();
  }, []);

  return { trackPageView };
};