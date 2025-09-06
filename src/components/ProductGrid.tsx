import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Heart, 
  ShoppingCart, 
  Minus, 
  Plus, 
  Star,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { Product } from '@/types/product';

interface ProductGridProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  onRemoveFromCart: (product: Product) => void;
  onToggleFavorite: (productId: string) => void;
  getItemQuantity: (productId: string) => number;
  favorites: string[];
  loading: boolean;
}

const ProductGrid = ({
  products,
  onAddToCart,
  onRemoveFromCart,
  onToggleFavorite,
  getItemQuantity,
  favorites,
  loading
}: ProductGridProps) => {
  const [imageLoading, setImageLoading] = useState<Record<string, boolean>>({});

  const handleImageLoad = (productId: string) => {
    setImageLoading(prev => ({ ...prev, [productId]: false }));
  };

  const handleImageError = (productId: string) => {
    setImageLoading(prev => ({ ...prev, [productId]: false }));
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, index) => (
          <Card key={index} className="overflow-hidden">
            <Skeleton className="h-48 w-full" />
            <CardContent className="p-4">
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-3 w-1/2 mb-4" />
              <Skeleton className="h-8 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucun produit trouvé</h3>
          <p className="text-muted-foreground">
            Essayez de modifier vos critères de recherche ou de filtrage.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => {
        const quantity = getItemQuantity(product.id);
        const isFavorite = favorites.includes(product.id);
        const isInStock = product.stock > 0;
        const isLoading = imageLoading[product.id] !== false;

        return (
          <Card key={product.id} className="group overflow-hidden hover:shadow-lg transition-all duration-300">
            {/* Image du produit */}
            <div className="relative aspect-square overflow-hidden">
              {isLoading && (
                <Skeleton className="absolute inset-0 w-full h-full" />
              )}
              <img
                src={product.image || '/placeholder.svg'}
                alt={product.name}
                className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                  isLoading ? 'opacity-0' : 'opacity-100'
                }`}
                onLoad={() => handleImageLoad(product.id)}
                onError={() => handleImageError(product.id)}
              />
              
              {/* Badges */}
              <div className="absolute top-2 left-2 flex flex-col gap-1">
                {!isInStock && (
                  <Badge variant="destructive" className="text-xs">
                    Rupture
                  </Badge>
                )}
                {product.stock <= 5 && product.stock > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    Stock faible
                  </Badge>
                )}
              </div>

              {/* Bouton favori */}
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 h-8 w-8 p-0 bg-white/80 hover:bg-white"
                onClick={() => onToggleFavorite(product.id)}
              >
                <Heart 
                  className={`w-4 h-4 ${
                    isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'
                  }`} 
                />
              </Button>

              {/* Overlay pour produits non disponibles */}
              {!isInStock && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Badge variant="destructive" className="text-sm">
                    Non disponible
                  </Badge>
                </div>
              )}
            </div>

            <CardContent className="p-4">
              {/* Nom et description */}
              <div className="mb-3">
                <h3 className="font-semibold text-sm mb-1 line-clamp-2">
                  {product.name}
                </h3>
                {product.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {product.description}
                  </p>
                )}
              </div>

              {/* Prix et stock */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg text-primary">
                    ${product.price.toFixed(2)}
                  </span>
                  {product.unit && (
                    <span className="text-xs text-muted-foreground">
                      / {product.unit}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  {isInStock ? (
                    <>
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      <span>{product.stock} en stock</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3 h-3 text-red-500" />
                      <span>Rupture</span>
                    </>
                  )}
                </div>
              </div>

              {/* Contrôles du panier */}
              <div className="flex items-center gap-2">
                {quantity > 0 ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onRemoveFromCart(product)}
                      className="h-8 w-8 p-0"
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    
                    <span className="flex-1 text-center font-medium">
                      {quantity}
                    </span>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onAddToCart(product)}
                      disabled={!isInStock}
                      className="h-8 w-8 p-0"
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => onAddToCart(product)}
                    disabled={!isInStock}
                    className="flex-1"
                    size="sm"
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    {isInStock ? 'Ajouter' : 'Indisponible'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default ProductGrid;
