import { useState, useEffect } from "react";
import { Header } from "@/components/header";
import { AppFooter } from "@/components/AppFooter";
import { StoreSelector } from "@/components/store-selector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CategorySection } from "@/components/category-section";
import { ArrowLeft, ShoppingCart, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { ClientPriceComparisonModal } from "@/components/client/ClientPriceComparisonModal";

interface SelectedStore {
  id: string;
  name: string;
  address: string;
  distance: number;
  deliveryFee: number;
  type: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  image: string;
  stock: number;
  is_active: boolean;
  store_id: string;
  created_at: string;
  updated_at: string;
}

const Stores = () => {
  const [selectedStore, setSelectedStore] = useState<SelectedStore | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [groupedProducts, setGroupedProducts] = useState<Record<string, Product[]>>({});
  const [showPriceComparison, setShowPriceComparison] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { getCartItemsCount, getCartTotal } = useCart(selectedStore?.id);

  const handleStoreSelect = async (store: SelectedStore) => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour commander",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }

    setSelectedStore(store);
    await loadProducts(store.id);
  };

  const loadProducts = async (storeId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', storeId)
        .eq('is_active', true)
        .gt('stock', 0)
        .order('category')
        .order('name');

      if (error) throw error;

      setProducts(data || []);
      
      // Grouper les produits par catégorie
      const grouped = (data || []).reduce((acc, product) => {
        if (!acc[product.category]) {
          acc[product.category] = [];
        }
        acc[product.category].push(product);
        return acc;
      }, {} as Record<string, Product[]>);
      
      setGroupedProducts(grouped);
    } catch (error) {
      console.error('Erreur lors du chargement des produits:', error);
      
      // Message d'erreur plus spécifique
      let errorMessage = "Impossible de charger les produits";
      if (error instanceof Error) {
        if (error.message.includes('permission')) {
          errorMessage = "Erreur de permissions. Vérifiez votre connexion.";
        } else if (error.message.includes('network')) {
          errorMessage = "Erreur de connexion. Vérifiez votre internet.";
        } else if (error.message.includes('timeout')) {
          errorMessage = "Délai d'attente dépassé. Veuillez réessayer.";
        }
      }
      
      toast({
        title: "Erreur de chargement",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBackToStores = () => {
    setSelectedStore(null);
    setProducts([]);
    setGroupedProducts({});
  };

  const handleGoToCheckout = () => {
    if (!selectedStore) return;
    navigate(`/order-checkout?store_id=${selectedStore.id}&store_name=${encodeURIComponent(selectedStore.name)}`);
  };

  const cartItemsCount = getCartItemsCount();
  const cartTotal = getCartTotal();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto py-6">
        {!selectedStore ? (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-bold text-gradient">
                Choisissez votre magasin
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Sélectionnez parmi nos magasins partenaires près de chez vous
              </p>
              
              {/* Bouton Comparer les prix */}
              <div className="flex justify-center">
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => setShowPriceComparison(true)}
                  className="flex items-center gap-2"
                >
                  <BarChart3 className="w-5 h-5" />
                  Comparer les prix
                </Button>
              </div>
            </div>
            
            <StoreSelector onStoreSelect={handleStoreSelect} />
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button 
                  variant="outline" 
                  onClick={handleBackToStores}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Retour aux magasins
                </Button>
                
                <div>
                  <h1 className="text-2xl font-bold">Commander chez {selectedStore.name}</h1>
                  <p className="text-muted-foreground">
                    Livraison: {selectedStore.deliveryFee.toFixed(2)}$ • {selectedStore.distance.toFixed(1)}km
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline"
                  onClick={() => setShowPriceComparison(true)}
                  className="flex items-center gap-2"
                >
                  <BarChart3 className="w-4 h-4" />
                  Comparer
                </Button>
                
                <Button 
                  onClick={handleGoToCheckout}
                  disabled={cartItemsCount === 0}
                  className="flex items-center gap-2" 
                  variant={cartItemsCount > 0 ? "default" : "outline"}
                >
                  <ShoppingCart className="w-4 h-4" />
                  Panier {cartItemsCount > 0 && `(${cartItemsCount}) ${cartTotal.toFixed(2)}$`}
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Chargement des produits...</p>
              </div>
            ) : products.length === 0 ? (
              <Card className="max-w-2xl mx-auto text-center py-12">
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-6xl">🛍️</div>
                    <h3 className="text-xl font-semibold">Aucun produit disponible</h3>
                    <p className="text-muted-foreground">
                      Ce magasin n'a pas encore de produits disponibles pour la commande en ligne.
                    </p>
                    <Button onClick={handleBackToStores} variant="outline">
                      Choisir un autre magasin
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-8">
                {Object.entries(groupedProducts).map(([category, categoryProducts]) => (
                  <CategorySection
                    key={category}
                    category={category}
                    products={categoryProducts}
                    storeId={selectedStore.id}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <AppFooter />
      
      {/* Modal de comparaison de prix */}
      <ClientPriceComparisonModal 
        isOpen={showPriceComparison} 
        onClose={() => setShowPriceComparison(false)} 
      />
    </div>
  );
};

export default Stores;
