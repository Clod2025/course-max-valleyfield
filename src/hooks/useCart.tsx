import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface CartItem {
  id?: string;
  product_id: string;
  quantity: number;
  product?: {
    id: string;
    name: string;
    price: number;
    unit: string;
    image_url?: string;
    store_id: string;
  };
}

export const useCart = (storeId?: string) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchCart = useCallback(async () => {
    if (!user || !storeId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cart')
        .select(`
          *,
          product:products(*)
        `)
        .eq('user_id', user.id)
        .eq('store_id', storeId);

      if (error) throw error;
      setCartItems(data || []);
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, storeId]);

  const addToCart = async (productId: string | { store_id: string; product_id: string; product_name: string; quantity: number; price: number }, quantity: number = 1) => {
    if (typeof productId === 'object') {
      // Handle the object format from ClientPriceComparisonModal
      const { store_id, product_id, product_name, quantity: qty, price } = productId;
      if (!user || !store_id) {
        toast({
          title: "Erreur",
          description: "Vous devez être connecté pour ajouter des produits au panier",
          variant: "destructive",
        });
        return;
      }
      productId = product_id;
      quantity = qty;
    }
    
    if (!user || !storeId) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour ajouter des produits au panier",
        variant: "destructive",
      });
      return;
    }

    try {
      const existingItem = cartItems.find(item => item.product_id === productId);
      if (existingItem) {
        const { error } = await supabase
          .from('cart')
          .update({ quantity: existingItem.quantity + quantity })
          .eq('id', existingItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('cart')
          .insert({
            user_id: user.id,
            store_id: storeId,
            product_id: productId,
            quantity
          });
        if (error) throw error;
      }
      fetchCart();
      toast({
        title: "Produit ajouté",
        description: "Le produit a été ajouté au panier",
      });
    } catch (error: any) {
      console.error('Error adding to cart:', error);
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de l'ajout au panier",
        variant: "destructive",
      });
    }
  };

  const updateCartItem = async (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }

    try {
      const { error } = await supabase
        .from('cart')
        .update({ quantity })
        .eq('id', cartItemId);

      if (error) throw error;

      fetchCart();
    } catch (error: any) {
      console.error('Error updating cart:', error);
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la mise à jour",
        variant: "destructive",
      });
    }
  };

  const removeFromCart = async (cartItemId: string) => {
    try {
      const { error } = await supabase
        .from('cart')
        .delete()
        .eq('id', cartItemId);

      if (error) throw error;

      fetchCart();
      toast({
        title: "Produit retiré",
        description: "Le produit a été retiré du panier",
      });
    } catch (error: any) {
      console.error('Error removing from cart:', error);
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la suppression",
        variant: "destructive",
      });
    }
  };

  const clearCart = async () => {
    if (!user || !storeId) return;

    try {
      const { error } = await supabase
        .from('cart')
        .delete()
        .eq('user_id', user.id)
        .eq('store_id', storeId);

      if (error) throw error;

      setCartItems([]);
    } catch (error: any) {
      console.error('Error clearing cart:', error);
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors du vidage du panier",
        variant: "destructive",
      });
    }
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => {
      const price = item.product?.price || 0;
      return total + (price * item.quantity);
    }, 0);
  };

  const getCartItemsCount = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  useEffect(() => {
    if (user && storeId) {
      fetchCart();
    }
  }, [user, storeId, fetchCart]);

  return {
    cartItems,
    loading,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    getCartTotal,
    getCartItemsCount,
    fetchCart
  };
};