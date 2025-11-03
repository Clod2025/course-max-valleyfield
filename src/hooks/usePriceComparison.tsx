import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types/product';
import { MerchantPrice } from '@/components/PriceComparison/MerchantsList';

interface UsePriceComparisonOptions {
  debounceMs?: number;
  updateInterval?: number;
}

interface UsePriceComparisonReturn {
  // Search state
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  suggestions: string[];
  isSearching: boolean;
  
  // Results state
  merchants: MerchantPrice[];
  isLoading: boolean;
  error: string | null;
  
  // Real-time updates
  lastUpdated: Date | null;
  isUpdating: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'error';
  
  // Actions
  searchProducts: (query: string) => Promise<void>;
  clearSearch: () => void;
  refreshPrices: () => Promise<void>;
}

export const usePriceComparison = (options: UsePriceComparisonOptions = {}): UsePriceComparisonReturn => {
  const { debounceMs = 300, updateInterval = 30000 } = options;
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Results state
  const [merchants, setMerchants] = useState<MerchantPrice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Real-time updates
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected');
  
  // Refs for cleanup
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const updateTimer = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<any>(null);

  // Search products function
  const searchProducts = useCallback(async (query: string) => {
    if (!query.trim()) {
      setMerchants([]);
      return;
    }

    setIsSearching(true);
    setIsLoading(true);
    setError(null);

    try {
      // ✅ CORRECTION : Requête avec toutes les colonnes nécessaires
      const { data: products, error } = await supabase
        .from('products')
        .select(`
          *,
          store:stores(
            id,
            name,
            address,
            city,
            phone,
            logo_url,
            is_active
          )
        `)
        .ilike('name', `%${query}%`)
        .eq('is_active', true)
        .gt('stock', 0)
        .limit(20);

      if (error) throw error;

      // ✅ CORRECTION : Grouper par magasin avec la structure MerchantPrice correcte
      const merchantMap = new Map<string, MerchantPrice>();
      
      products?.forEach((product: any) => {
        const storeId = product.store_id;
        const storeName = product.store?.name || 'Magasin inconnu';
        
        if (!merchantMap.has(storeId)) {
          merchantMap.set(storeId, {
            id: storeId,
            name: storeName,
            logo_url: product.store?.logo_url || undefined,
            address: product.store?.address || '',
            city: product.store?.city || '',
            phone: product.store?.phone || undefined,
            price: product.price, // Prix du produit
            isBestPrice: false, // Sera calculé après
            rating: 4.5, // Simulation
            deliveryTime: '25-45 min',
            isAvailable: true,
            lastUpdated: product.updated_at || new Date().toISOString()
          });
        } else {
          // Prendre le prix le plus bas si plusieurs produits du même magasin
          const merchant = merchantMap.get(storeId)!;
          if (product.price < merchant.price) {
            merchant.price = product.price;
          }
        }
      });

      // ✅ Calculer quel magasin a le meilleur prix
      const merchantsArray = Array.from(merchantMap.values());
      if (merchantsArray.length > 0) {
        const lowestPrice = Math.min(...merchantsArray.map(m => m.price));
        merchantsArray.forEach(merchant => {
          merchant.isBestPrice = merchant.price === lowestPrice;
        });
      }

      setMerchants(merchantsArray);
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error('Erreur lors de la recherche:', err);
      setError(err.message || 'Erreur lors de la recherche');
    } finally {
      setIsSearching(false);
      setIsLoading(false);
    }
  }, []);

  // Debounced search
  const debouncedSearch = useCallback((query: string) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    debounceTimer.current = setTimeout(async () => {
      if (query.trim()) {
        await searchProducts(query.trim());
      } else {
        setMerchants([]);
      }
    }, debounceMs);
  }, [debounceMs, searchProducts]);

  // Get suggestions
  const getSuggestions = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .select('name')
        .ilike('name', `%${query}%`)
        .eq('is_active', true)
        .limit(5);

      if (error) throw error;

      const uniqueSuggestions = [...new Set(data?.map(p => p.name) || [])];
      setSuggestions(uniqueSuggestions);
    } catch (err) {
      console.error('Erreur lors de la récupération des suggestions:', err);
    }
  }, []);

  // ✅ CORRECTION : refreshPrices avec useCallback stable
  const refreshPrices = useCallback(async () => {
    if (!searchQuery.trim()) return;

    setIsUpdating(true);
    try {
      await searchProducts(searchQuery);
    } finally {
      setIsUpdating(false);
    }
  }, [searchQuery, searchProducts]);

  // ✅ CORRECTION : useEffect avec dépendances stables
  useEffect(() => {
    if (!searchQuery.trim()) return;

    // Set up periodic updates
    updateTimer.current = setInterval(() => {
      refreshPrices();
    }, updateInterval);

    // Set up real-time subscription for price changes
    const channel = supabase
      .channel('price_updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'products'
        },
        (payload) => {
          // Check if the updated product matches our search
          const updatedProduct = payload.new as any;
          if (updatedProduct.name.toLowerCase().includes(searchQuery.toLowerCase())) {
            refreshPrices();
          }
        }
      )
      .subscribe((status) => {
        setConnectionStatus(status === 'SUBSCRIBED' ? 'connected' : 'disconnected');
      });

    channelRef.current = channel;

    return () => {
      if (updateTimer.current) {
        clearInterval(updateTimer.current);
      }
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [searchQuery, refreshPrices, updateInterval]);

  // Handle search query changes
  useEffect(() => {
    if (searchQuery.trim()) {
      debouncedSearch(searchQuery);
      getSuggestions(searchQuery);
    } else {
      setMerchants([]);
      setSuggestions([]);
    }
  }, [searchQuery, debouncedSearch, getSuggestions]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      if (updateTimer.current) {
        clearInterval(updateTimer.current);
      }
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setMerchants([]);
    setSuggestions([]);
    setError(null);
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    suggestions,
    isSearching,
    merchants,
    isLoading,
    error,
    lastUpdated,
    isUpdating,
    connectionStatus,
    searchProducts,
    clearSearch,
    refreshPrices
  };
};
