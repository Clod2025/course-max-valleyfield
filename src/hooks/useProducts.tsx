import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types/product';

interface UseProductsOptions {
  storeId?: string;
  category?: string;
  searchTerm?: string;
  limit?: number;
}

interface UseProductsReturn {
  products: Product[];
  loading: boolean;
  error: string | null;
  searchProducts: (term: string) => void;
  addProduct: (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  decrementStock: (productId: string, quantity: number) => Promise<void>;
  incrementStock: (productId: string, quantity: number) => Promise<void>;
  refreshProducts: () => Promise<void>;
}

export const useProducts = (options: UseProductsOptions = {}): UseProductsReturn => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('products')
        .select(`
          *,
          stores (
            id,
            name,
            manager_id
          )
        `)
        .eq('is_active', true)
        .order('name');

      if (options.storeId) {
        query = query.eq('store_id', options.storeId);
      }

      if (options.category) {
        query = query.eq('category', options.category);
      }

      if (options.searchTerm) {
        query = query.ilike('name', `%${options.searchTerm}%`);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      setProducts(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des produits');
    } finally {
      setLoading(false);
    }
  }, [options.storeId, options.category, options.searchTerm, options.limit]);

  const searchProducts = useCallback((searchTerm: string) => {
    if (!searchTerm.trim()) {
      setProducts(prev => 
        prev.filter(product => 
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.description?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
      return;
    }

    const filtered = products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setProducts(filtered);
  }, [products]);

  const addProduct = async (productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([productData])
        .select()
        .single();

      if (error) throw error;

      setProducts(prev => [data, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'ajout du produit');
      throw err;
    }
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setProducts(prev => 
        prev.map(product => product.id === id ? data : product)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour du produit');
      throw err;
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      setProducts(prev => prev.filter(product => product.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression du produit');
      throw err;
    }
  };

  const decrementStock = async (productId: string, quantity: number) => {
    try {
      const { error } = await supabase.rpc('decrement_product_stock', {
        product_id: productId,
        quantity: quantity
      });

      if (error) throw error;

      // Mettre à jour le stock localement
      setProducts(prev => 
        prev.map(product => 
          product.id === productId 
            ? { ...product, stock: Math.max(0, product.stock - quantity) }
            : product
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la décrémentation du stock');
      throw err;
    }
  };

  const incrementStock = async (productId: string, quantity: number) => {
    try {
      const { error } = await supabase.rpc('increment_product_stock', {
        product_id: productId,
        quantity: quantity
      });

      if (error) throw error;

      // Mettre à jour le stock localement
      setProducts(prev => 
        prev.map(product => 
          product.id === productId 
            ? { ...product, stock: product.stock + quantity }
            : product
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'incrémentation du stock');
      throw err;
    }
  };

  const refreshProducts = async () => {
    await fetchProducts();
  };

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Écouter les changements en temps réel
  useEffect(() => {
    const channel = supabase
      .channel('products_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products'
        },
        (payload) => {
          console.log('Changement détecté:', payload);
          
          if (payload.eventType === 'INSERT') {
            setProducts(prev => [payload.new as Product, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setProducts(prev => 
              prev.map(product => 
                product.id === payload.new.id ? payload.new as Product : product
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setProducts(prev => 
              prev.filter(product => product.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    products,
    loading,
    error,
    searchProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    decrementStock,
    incrementStock,
    refreshProducts
  };
};
