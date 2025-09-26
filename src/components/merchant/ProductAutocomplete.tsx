import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Package, 
  Check, 
  Loader2,
  ArrowDown,
  ArrowUp,
  X
} from 'lucide-react';

interface CanadianProduct {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  image_url: string;
  description: string;
  barcode?: string;
  unit: 'kg' | 'unité';
}

interface ProductAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (product: CanadianProduct) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
}

// Base de données de produits canadiens populaires
const CANADIAN_PRODUCTS_DB: CanadianProduct[] = [
  // Fruits et légumes
  {
    id: 'apple-gala',
    name: 'Pommes Gala',
    brand: 'Canada',
    category: 'Fruits',
    price: 3.99,
    image_url: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=100&h=100&fit=crop',
    description: 'Pommes Gala fraîches du Canada',
    unit: 'kg'
  },
  {
    id: 'banana',
    name: 'Bananes',
    brand: 'Dole',
    category: 'Fruits',
    price: 2.49,
    image_url: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=100&h=100&fit=crop',
    description: 'Bananes biologiques',
    unit: 'kg'
  },
  {
    id: 'carrot',
    name: 'Carottes',
    brand: 'Canada',
    category: 'Légumes',
    price: 1.99,
    image_url: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da35?w=100&h=100&fit=crop',
    description: 'Carottes fraîches du Canada',
    unit: 'kg'
  },
  {
    id: 'potato',
    name: 'Pommes de terre',
    brand: 'Canada',
    category: 'Légumes',
    price: 2.99,
    image_url: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=100&h=100&fit=crop',
    description: 'Pommes de terre Yukon Gold',
    unit: 'kg'
  },
  {
    id: 'lettuce',
    name: 'Laitue romaine',
    brand: 'Canada',
    category: 'Légumes',
    price: 1.49,
    image_url: 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=100&h=100&fit=crop',
    description: 'Laitue romaine fraîche',
    unit: 'unité'
  },
  // Produits laitiers
  {
    id: 'milk-2l',
    name: 'Lait 2%',
    brand: 'Natrel',
    category: 'Produits laitiers',
    price: 4.99,
    image_url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=100&h=100&fit=crop',
    description: 'Lait 2% frais Natrel',
    unit: 'unité'
  },
  {
    id: 'cheese-cheddar',
    name: 'Fromage cheddar',
    brand: 'Black Diamond',
    category: 'Produits laitiers',
    price: 6.99,
    image_url: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=100&h=100&fit=crop',
    description: 'Fromage cheddar vieilli',
    unit: 'unité'
  },
  {
    id: 'yogurt',
    name: 'Yogourt grec',
    brand: 'Liberté',
    category: 'Produits laitiers',
    price: 3.49,
    image_url: 'https://images.unsplash.com/photo-1571212058282-26960b5a2b5a?w=100&h=100&fit=crop',
    description: 'Yogourt grec nature',
    unit: 'unité'
  },
  // Viandes
  {
    id: 'chicken-breast',
    name: 'Poitrine de poulet',
    brand: 'Maple Leaf',
    category: 'Viandes',
    price: 12.99,
    image_url: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=100&h=100&fit=crop',
    description: 'Poitrine de poulet fraîche',
    unit: 'kg'
  },
  {
    id: 'ground-beef',
    name: 'Bœuf haché',
    brand: 'Canada',
    category: 'Viandes',
    price: 8.99,
    image_url: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=100&h=100&fit=crop',
    description: 'Bœuf haché extra-maigre',
    unit: 'kg'
  },
  {
    id: 'salmon',
    name: 'Saumon frais',
    brand: 'Canada',
    category: 'Poissons',
    price: 18.99,
    image_url: 'https://images.unsplash.com/photo-1519708227418-c8fd9a8b66c5?w=100&h=100&fit=crop',
    description: 'Saumon frais du Pacifique',
    unit: 'kg'
  },
  // Produits de boulangerie
  {
    id: 'bread-white',
    name: 'Pain blanc',
    brand: 'Wonder',
    category: 'Boulangerie',
    price: 2.99,
    image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=100&h=100&fit=crop',
    description: 'Pain blanc frais',
    unit: 'unité'
  },
  {
    id: 'croissant',
    name: 'Croissants',
    brand: 'Tim Hortons',
    category: 'Boulangerie',
    price: 4.99,
    image_url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=100&h=100&fit=crop',
    description: 'Croissants au beurre',
    unit: 'unité'
  },
  // Boissons
  {
    id: 'coffee-tim',
    name: 'Café Tim Hortons',
    brand: 'Tim Hortons',
    category: 'Boissons',
    price: 7.99,
    image_url: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=100&h=100&fit=crop',
    description: 'Café torréfié Tim Hortons',
    unit: 'unité'
  },
  {
    id: 'maple-syrup',
    name: 'Sirop d\'érable',
    brand: 'Canada',
    category: 'Épicerie',
    price: 12.99,
    image_url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=100&h=100&fit=crop',
    description: 'Sirop d\'érable pur du Canada',
    unit: 'unité'
  },
  {
    id: 'poutine-sauce',
    name: 'Sauce poutine',
    brand: 'St-Hubert',
    category: 'Épicerie',
    price: 3.99,
    image_url: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=100&h=100&fit=crop',
    description: 'Sauce poutine authentique',
    unit: 'unité'
  }
];

export function ProductAutocomplete({ 
  value, 
  onChange, 
  onSelect, 
  placeholder = "Rechercher un produit...",
  label = "Nom du produit",
  disabled = false
}: ProductAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<CanadianProduct[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Fonction de recherche avec cache
  const searchProducts = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    
    // Simulation d'un délai de recherche (cache local)
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const filtered = CANADIAN_PRODUCTS_DB.filter(product =>
      product.name.toLowerCase().includes(query.toLowerCase()) ||
      product.brand.toLowerCase().includes(query.toLowerCase()) ||
      product.category.toLowerCase().includes(query.toLowerCase())
    );
    
    setSuggestions(filtered.slice(0, 8)); // Limiter à 8 suggestions
    setIsLoading(false);
  }, []);

  // Gestion de la recherche avec debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchProducts(value);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [value, searchProducts]);

  // Gestion des touches clavier
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Sélection d'un produit
  const handleSelect = (product: CanadianProduct) => {
    onSelect(product);
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  // Gestion du clic en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node) &&
          listRef.current && !listRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <Label htmlFor="product-search">{label}</Label>
      <div className="relative">
        <Input
          ref={inputRef}
          id="product-search"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="pr-10"
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          ) : (
            <Search className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Liste des suggestions */}
      {isOpen && (suggestions.length > 0 || isLoading) && (
        <Card 
          ref={listRef}
          className="absolute z-50 w-full mt-1 max-h-80 overflow-y-auto shadow-lg border"
        >
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 text-center">
                <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Recherche en cours...</p>
              </div>
            ) : suggestions.length > 0 ? (
              <div className="py-2">
                {suggestions.map((product, index) => (
                  <div
                    key={product.id}
                    className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-muted transition-colors ${
                      index === selectedIndex ? 'bg-muted' : ''
                    }`}
                    onClick={() => handleSelect(product)}
                  >
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/100x100?text=Produit';
                        }}
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm truncate">{product.name}</h4>
                        <Badge variant="outline" className="text-xs">
                          {product.brand}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">
                        {product.category}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-primary">
                          ${product.price.toFixed(2)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          /{product.unit}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex-shrink-0">
                      <Check className="w-4 h-4 text-green-600" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center">
                <Package className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Aucun produit trouvé
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Essayez avec un autre terme de recherche
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Instructions clavier */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-muted/50 text-xs text-muted-foreground rounded-b-md">
          <div className="flex items-center justify-center gap-4">
            <span>↑↓ Naviguer</span>
            <span>↵ Sélectionner</span>
            <span>Esc Fermer</span>
          </div>
        </div>
      )}
    </div>
  );
}
