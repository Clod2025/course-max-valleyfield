import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  Upload, 
  Check, 
  Clock,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
  is_available: boolean;
}

export function InventorySubmission() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, category, stock, is_active')
        .order('created_at', { ascending: false });

      if (error) {
        // Si la table n'existe pas, utiliser des données de démonstration
        if (error.code === 'PGRST116' || error.message?.includes('relation "products" does not exist')) {
          console.log('Table products non trouvée, utilisation de données de démonstration');
          const demoProducts: Product[] = [
            {
              id: 'demo-inventory-1',
              name: 'Nouveau Produit 1',
              price: 12.99,
              category: 'Test',
              stock: 0,
              is_available: false
            },
            {
              id: 'demo-inventory-2',
              name: 'Nouveau Produit 2',
              price: 8.50,
              category: 'Test',
              stock: 0,
              is_available: false
            }
          ];
          setProducts(demoProducts);
          return;
        }
        throw error;
      }
      
      // Mapper is_active vers is_available pour la compatibilité
      const mappedProducts = (data || []).map((item: any) => ({
        ...item,
        is_available: item.is_active
      }));
      
      setProducts(mappedProducts);
    } catch (error) {
      console.error('Erreur lors du chargement des produits:', error);
      // En cas d'erreur, utiliser des données de démonstration
      const demoProducts: Product[] = [
        {
          id: 'demo-inventory-error',
          name: 'Produit en attente',
          price: 10.00,
          category: 'Test',
          stock: 0,
          is_available: false
        }
      ];
      setProducts(demoProducts);
      
      toast({
        title: "Mode démonstration",
        description: "Utilisation de données de démonstration pour l'inventaire",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitInventory = async () => {
    const pendingProducts = products.filter(p => !p.is_available);
    
    if (pendingProducts.length === 0) {
      toast({
        title: "Information",
        description: "Tous vos produits sont déjà disponibles",
      });
      return;
    }

    setSubmitting(true);
    try {
      // Vérifier si on est en mode démonstration
      const isDemoMode = products.some(p => p.id.startsWith('demo-'));
      
      if (isDemoMode) {
        // Mode démonstration - mettre à jour localement
        setProducts(prev => prev.map(p => ({ ...p, is_available: true })));

        toast({
          title: "Inventaire soumis (Démo)",
          description: `${pendingProducts.length} produits sont maintenant disponibles en mode démonstration`,
        });
        return;
      }

      // Mode production - utiliser Supabase
      const { error } = await supabase
        .from('products')
        .update({ is_active: true })
        .eq('is_active', false);

      if (error) throw error;

      // Recharger les produits
      await loadProducts();

      toast({
        title: "Inventaire soumis avec succès",
        description: `${pendingProducts.length} produits sont maintenant disponibles pour les clients`,
      });
    } catch (error) {
      console.error('Erreur lors de la soumission de l\'inventaire:', error);
      toast({
        title: "Erreur",
        description: "Impossible de soumettre l'inventaire",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const pendingProducts = products.filter(p => !p.is_available);
  const availableProducts = products.filter(p => p.is_available);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Soumission d'Inventaire</h2>
          <p className="text-muted-foreground">
            Rendez vos produits disponibles pour les clients
          </p>
        </div>
        
        {pendingProducts.length > 0 && (
          <Button
            onClick={handleSubmitInventory}
            disabled={submitting}
            className="bg-green-600 hover:bg-green-700"
          >
            <Upload className="w-4 h-4 mr-2" />
            Soumettre Inventaire ({pendingProducts.length})
          </Button>
        )}
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{products.length}</div>
            <div className="text-sm text-muted-foreground">Total Produits</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{pendingProducts.length}</div>
            <div className="text-sm text-muted-foreground">En attente</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{availableProducts.length}</div>
            <div className="text-sm text-muted-foreground">Disponibles</div>
          </CardContent>
        </Card>
      </div>

      {/* Information importante */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900">Comment ça fonctionne</h3>
              <ul className="text-sm text-blue-800 mt-2 space-y-1">
                <li>• Les nouveaux produits sont en attente par défaut</li>
                <li>• Cliquez "Soumettre Inventaire" pour les rendre disponibles</li>
                <li>• Les clients pourront alors voir et commander vos produits</li>
                <li>• Vous pouvez soumettre plusieurs fois selon vos ajouts</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Produits en attente */}
      {pendingProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-600" />
              Produits en attente ({pendingProducts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingProducts.map((product) => (
                <div key={product.id} className="p-4 border rounded-lg bg-orange-50">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{product.name}</h4>
                    <Badge variant="secondary">En attente</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{product.category}</p>
                  <div className="flex items-center justify-between">
                    <span className="font-bold">{product.price.toFixed(2)}$</span>
                    <span className="text-sm">Stock: {product.stock}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Produits disponibles */}
      {availableProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600" />
              Produits disponibles ({availableProducts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableProducts.map((product) => (
                <div key={product.id} className="p-4 border rounded-lg bg-green-50">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{product.name}</h4>
                    <Badge className="bg-green-600">Disponible</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{product.category}</p>
                  <div className="flex items-center justify-between">
                    <span className="font-bold">{product.price.toFixed(2)}$</span>
                    <span className="text-sm">Stock: {product.stock}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* État vide */}
      {products.length === 0 && !loading && (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Aucun produit</h3>
            <p className="text-muted-foreground">
              Ajoutez des produits pour pouvoir soumettre votre inventaire
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
