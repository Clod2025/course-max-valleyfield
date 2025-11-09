import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEventTracking } from '@/hooks/useEventTracking';
import { useABVariant, useABEventTracking } from '@/hooks/useABTesting';

// Exemple d'utilisation du tracking dans un composant produit
interface ProductCardProps {
  product: {
    id: string;
    name: string;
    price: number;
    category: string;
    store_id: string;
    image_url?: string;
  };
}

export const ProductCardWithTracking: React.FC<ProductCardProps> = ({ product }) => {
  const { trackProductView, trackAddToCart } = useEventTracking();
  const { logABEvent } = useABEventTracking();
  
  // A/B Test pour le layout de la carte produit
  const { data: layoutVariant } = useABVariant('product_page_layout');

  // Tracker la vue du produit au montage
  React.useEffect(() => {
    trackProductView({
      product_id: product.id,
      product_name: product.name,
      category: product.category,
      price: product.price,
      store_id: product.store_id,
    });

    // Logger la vue pour l'A/B test
    if (layoutVariant) {
      logABEvent('product_page_layout', 'view');
    }
  }, [product.id, layoutVariant]);

  const handleAddToCart = () => {
    // Tracker l'ajout au panier
    trackAddToCart({
      product_id: product.id,
      product_name: product.name,
      quantity: 1,
      price: product.price,
      store_id: product.store_id,
    });

    // Logger l'événement pour l'A/B test (conversion)
    if (layoutVariant) {
      logABEvent('product_page_layout', 'add_to_cart', product.price);
    }

    // Logique métier pour ajouter au panier
    console.log('Produit ajouté au panier:', product.name);
  };

  // Rendu conditionnel basé sur la variante A/B
  const isModernLayout = layoutVariant === 'modern';

  return (
    <Card className={isModernLayout ? 'shadow-lg border-2' : 'shadow-sm'}>
      <CardHeader className={isModernLayout ? 'pb-2' : 'pb-4'}>
        {product.image_url && (
          <div className={`aspect-square overflow-hidden rounded-lg ${
            isModernLayout ? 'bg-gradient-to-br from-gray-100 to-gray-200' : 'bg-gray-100'
          }`}>
            <img 
              src={product.image_url} 
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div>
          <CardTitle className={`text-lg ${isModernLayout ? 'font-bold' : 'font-semibold'}`}>
            {product.name}
          </CardTitle>
          <p className="text-sm text-muted-foreground capitalize">
            {product.category}
          </p>
        </div>
        
        <div className="flex items-center justify-between">
          <span className={`text-xl font-bold ${
            isModernLayout ? 'text-primary' : 'text-foreground'
          }`}>
            {product.price.toFixed(2)} $
          </span>
          
          <Button 
            onClick={handleAddToCart}
            size={isModernLayout ? 'lg' : 'default'}
            className={isModernLayout ? 'rounded-full px-6' : ''}
          >
            {isModernLayout ? '+ Ajouter' : 'Ajouter au panier'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Exemple de composant avec tracking de recherche
export const SearchWithTracking: React.FC = () => {
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<any[]>([]);
  const { trackSearch } = useEventTracking();

  const handleSearch = async (searchQuery: string) => {
    setResults([]);

    // Tracker la recherche
    trackSearch({
      query: searchQuery,
      results_count: 0,
      filters: {}, // Ajouter les filtres actuels si applicable
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex space-x-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher des produits..."
          className="flex-1 px-3 py-2 border rounded-md"
        />
        <Button onClick={() => handleSearch(query)}>
          Rechercher
        </Button>
      </div>
      
      <div className="text-sm text-muted-foreground">
        {results.length
          ? `${results.length} résultats trouvés`
          : "Aucun résultat pour l'instant - la recherche produit sera connectée prochainement."}
      </div>
    </div>
  );
};
