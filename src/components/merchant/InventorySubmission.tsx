import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Package, 
  Upload, 
  Check, 
  Clock,
  AlertCircle,
  FileText,
  Download
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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
  const { profile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [importedProducts, setImportedProducts] = useState<Product[]>([]);

  useEffect(() => {
    loadProducts();
  }, [profile?.user_id]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      if (!profile?.user_id) {
        throw new Error('Profil non authentifié');
      }

      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, category, stock, is_active')
        .order('created_at', { ascending: false });

      if (error) {
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
      setProducts([]);
      toast({
        title: "Erreur",
        description: "Impossible de charger l’inventaire.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Gérer l'upload de fichier CSV
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Vérifier que c'est un fichier CSV
    if (!file.name.endsWith('.csv')) {
      toast({
        title: "Format invalide",
        description: "Veuillez télécharger un fichier CSV",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new Error('Le fichier CSV doit contenir au moins un en-tête et une ligne de données');
      }

      // Parser les en-têtes
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const requiredHeaders = ['nom', 'prix', 'categorie', 'stock'];
      
      // Vérifier que tous les en-têtes requis sont présents
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      if (missingHeaders.length > 0) {
        throw new Error(`En-têtes manquants: ${missingHeaders.join(', ')}`);
      }

      // Parser les données
      const newProducts: Product[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const productData: any = {};
        
        headers.forEach((header, index) => {
          productData[header] = values[index];
        });

        // Créer le produit
        const product: Product = {
          id: `import-${Date.now()}-${i}`,
          name: productData.nom || 'Produit sans nom',
          price: parseFloat(productData.prix) || 0,
          category: productData.categorie || 'Autre',
          stock: parseInt(productData.stock) || 0,
          is_available: false // Nouveaux produits en attente
        };

        // Valider les données
        if (product.name && product.price > 0) {
          newProducts.push(product);
        }
      }

      setImportedProducts(newProducts);
      setProducts(prev => [...prev, ...newProducts]);
      
      toast({
        title: "Import réussi",
        description: `${newProducts.length} produits importés depuis le fichier CSV`,
      });

      // Réinitialiser l'input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error: any) {
      console.error('Erreur lors de l\'import CSV:', error);
      toast({
        title: "Erreur d'import",
        description: error.message || "Impossible d'importer le fichier CSV",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  // Télécharger un exemple de fichier CSV
  const downloadTemplate = () => {
    const csvContent = `nom,prix,categorie,stock
Lait 2% 4L,7.99,Produits Laitiers,50
Pain Blanc,3.49,Boulangerie,100
Oeufs Grade A (12),4.29,Épicerie,75
Pommes McIntosh,5.99,Fruits et Légumes,200
Poulet Entier,12.99,Viande et Volaille,30`;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'modele-inventaire.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      const isDemoMode = products.some(p => p.id.startsWith('demo-') || p.id.startsWith('import-'));
      
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
      // Mettre à jour les produits existants
      const { error: updateError } = await supabase
        .from('products')
        .update({ is_active: true })
        .eq('is_active', false);

      if (updateError) throw updateError;

      // Note: L'insertion de produits nécessite un store_id
      // Les produits importés seront conservés en mode démonstration
      // jusqu'à ce que le magasin soit correctement configuré
      toast({
        title: "Information",
        description: "L'insertion de produits nécessite une configuration complète du magasin",
      });

      // Recharger les produits
      await loadProducts();
      setImportedProducts([]);

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

      {/* Upload CSV */}
      <Card className="border-2 border-dashed border-primary/30 hover:border-primary/50 transition-colors">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 p-3 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Importer un inventaire CSV</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Téléchargez votre fichier CSV depuis votre ordinateur
                </p>
                <div className="flex items-center gap-2 text-xs text-blue-700">
                  <Download className="w-4 h-4" />
                  Format requis: nom, prix, categorie, stock
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                id="csv-upload"
              />
              <Button
                onClick={downloadTemplate}
                variant="ghost"
                size="sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Modèle CSV
              </Button>
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                variant="outline"
              >
                {uploading ? (
                  <>
                    <Upload className="w-4 h-4 mr-2 animate-spin" />
                    Import...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    Choisir un fichier
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

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
