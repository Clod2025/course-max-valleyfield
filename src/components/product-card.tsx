import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus } from "lucide-react";
import { useCart } from "@/hooks/useCart";

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
  const { cartItems, addToCart, updateCartItem, removeFromCart } = useCart(storeId);
  
  // Find current quantity in cart
  const cartItem = cartItems.find(item => item.product_id === product.id);
  const quantity = cartItem?.quantity || 0;

  const handleAddToCart = () => {
    addToCart(product.id, 1);
  };

  const handleIncreaseQuantity = () => {
    if (cartItem) {
      updateCartItem(cartItem.id!, quantity + 1);
    } else {
      addToCart(product.id, 1);
    }
  };

  const handleDecreaseQuantity = () => {
    if (cartItem) {
      if (quantity === 1) {
        removeFromCart(cartItem.id!);
      } else {
        updateCartItem(cartItem.id!, quantity - 1);
      }
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
                disabled={!product.in_stock}
                size="sm"
                className="gap-1"
              >
                <Plus className="w-4 h-4" />
                Ajouter
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleDecreaseQuantity}
                  size="sm"
                  variant="outline"
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="font-medium min-w-[20px] text-center">
                  {quantity}
                </span>
                <Button
                  onClick={handleIncreaseQuantity}
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
