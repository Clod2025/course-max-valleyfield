import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  image_url: string;
  unit: string;
  in_stock: boolean;
}

interface ProductCardProps {
  product: Product;
  storeId: string;
}

export const ProductCard = ({ product, storeId }: ProductCardProps) => {
  const [quantity, setQuantity] = useState(0);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleAddToCart = async () => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour ajouter des produits au panier",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('cart')
        .upsert({
          user_id: user.id,
          store_id: storeId,
          product_id: product.id,
          quantity: quantity + 1
        }, {
          onConflict: 'user_id,product_id'
        });

      if (error) throw error;

      setQuantity(quantity + 1);
      toast({
        title: "Produit ajouté",
        description: `${product.name} ajouté au panier`,
      });
    } catch (error) {
      console.error('Erreur lors de l\'ajout au panier:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le produit au panier",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromCart = async () => {
    if (!user || quantity === 0) return;

    setLoading(true);
    try {
      if (quantity === 1) {
        const { error } = await supabase
          .from('cart')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', product.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('cart')
          .update({ quantity: quantity - 1 })
          .eq('user_id', user.id)
          .eq('product_id', product.id);

        if (error) throw error;
      }

      setQuantity(quantity - 1);
      toast({
        title: "Produit retiré",
        description: `${product.name} retiré du panier`,
      });
    } catch (error) {
      console.error('Erreur lors du retrait du panier:', error);
      toast({
        title: "Erreur",
        description: "Impossible de retirer le produit du panier",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="aspect-square overflow-hidden">
        <img
          src={product.image_url || '/api/placeholder/200/200'}
          alt={product.name}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
      </div>
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-lg leading-tight">{product.name}</h3>
            <Badge variant="secondary" className="text-xs">
              {product.unit}
            </Badge>
          </div>
          
          {product.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {product.description}
            </p>
          )}
          
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold text-primary">
              {product.price.toFixed(2)}$
            </span>
            
            {quantity === 0 ? (
              <Button 
                onClick={handleAddToCart}
                disabled={loading || !product.in_stock}
                size="sm"
                className="gap-1"
              >
                <Plus className="w-4 h-4" />
                Ajouter
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleRemoveFromCart}
                  disabled={loading}
                  size="sm"
                  variant="outline"
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="font-medium min-w-[20px] text-center">
                  {quantity}
                </span>
                <Button
                  onClick={handleAddToCart}
                  disabled={loading}
                  size="sm"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};