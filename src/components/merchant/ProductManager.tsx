import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Package, 
  Edit, 
  Trash2, 
  Image as ImageIcon,
  Check,
  X,
  Search,
  Filter,
  Scale,
  Package2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  unit: 'kg' | 'unité'; // Nouveau champ obligatoire
  image_url: string;
  is_available: boolean;
  created_at: string;
}

// Service pour générer des images automatiquement
const generateProductImage = async (productName: string): Promise<string> => {
  // Utiliser une API d'images automatiques (ex: Unsplash, Pexels, ou AI)
  const searchTerm = encodeURIComponent(productName.toLowerCase());
  
  // Pour la démo, utiliser Unsplash API
  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${searchTerm}&per_page=1&client_id=YOUR_UNSPLASH_ACCESS_KEY`
    );
    
    if (response.ok) {
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        return data.results[0].urls.regular;
      }
    }
  } catch (error) {
    console.error('Erreur lors de la génération d\'image:', error);
  }
  
  // Fallback: utiliser une image placeholder basée sur le nom
  return `https://via.placeholder.com/300x200/4f46e5/white?text=${encodeURIComponent(productName)}`;
};

export function ProductManager() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Formulaire nouveau produit
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    unit: 'unité' as 'kg' | 'unité', // Nouveau champ avec valeur par défaut
  });

  const categories = [
    'Fruits & Légumes',
    'Produits laitiers',
    'Viandes & Poissons',
    'Boulangerie',
    'Épicerie',
    'Surgelés',
    'Boissons',
    'Hygiène & Beauté'
  ];

  const units = [
    { value: 'kg', label: 'Kilogramme (kg)', icon: Scale },
    { value: 'unité', label: 'Unité (pièce)', icon: Package2 }
  ];

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les produits",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async () => {
    if (!formData.name || !formData.price || !formData.unit) {
      toast({
        title: "Erreur",
        description: "Le nom, le prix et l'unité sont obligatoires",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Générer automatiquement l'image
      const imageUrl = await generateProductImage(formData.name);

      const { data, error } = await supabase
        .from('products')
        .insert({
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          category: formData.category,
          stock: parseInt(formData.stock) || 0,
          unit: formData.unit,
          image_url: imageUrl,
          is_available: false // Par défaut non disponible jusqu'à soumission inventaire
        })
        .select()
        .single();

      if (error) throw error;

      setProducts(prev => [data, ...prev]);
      setFormData({ 
        name: '', 
        description: '', 
        price: '', 
        category: '', 
        stock: '', 
        unit: 'unité' 
      });
      setShowAddForm(false);

      toast({
        title: "Succès",
        description: `Produit "${formData.name}" ajouté avec image automatique`,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le produit",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitInventory = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_available: true })
        .eq('is_available', false);

      if (error) throw error;

      // Recharger les produits
      await loadProducts();

      toast({
        title: "Inventaire soumis",
        description: "Tous vos produits sont maintenant disponibles pour les clients",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de soumettre l'inventaire",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const pendingProducts = products.filter(p => !p.is_available).length;

  const getUnitIcon = (unit: string) => {
    return unit === 'kg' ? Scale : Package2;
  };

  return (
    <div className="space-y-6">
      {/* Header avec actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestion des Produits</h2>
          <p className="text-muted-foreground">
            Ajoutez et gérez vos produits avec images automatiques
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {pendingProducts > 0 && (
            <Button
              onClick={handleSubmitInventory}
              className="bg-green-600 hover:bg-green-700"
              disabled={loading}
            >
              <Package className="w-4 h-4 mr-2" />
              Soumettre Inventaire ({pendingProducts})
            </Button>
          )}
          
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nouveau Produit
          </Button>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{products.length}</div>
            <div className="text-sm text-muted-foreground">Total Produits</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {products.filter(p => p.is_available).length}
            </div>
            <div className="text-sm text-muted-foreground">Disponibles</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{pendingProducts}</div>
            <div className="text-sm text-muted-foreground">En attente</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {products.filter(p => p.stock === 0).length}
            </div>
            <div className="text-sm text-muted-foreground">Rupture stock</div>
          </CardContent>
        </Card>
      </div>

      {/* Formulaire d'ajout */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Nouveau Produit
              <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
                <X className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nom du produit *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Pommes Gala"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  L'image sera générée automatiquement
                </p>
              </div>
              
              <div>
                <Label htmlFor="price">Prix *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <Label htmlFor="unit">Unité de mesure *</Label>
                <select
                  id="unit"
                  value={formData.unit}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    unit: e.target.value as 'kg' | 'unité' 
                  }))}
                  className="w-full p-2 border rounded-md"
                  required
                >
                  {units.map(unit => {
                    const Icon = unit.icon;
                    return (
                      <option key={unit.value} value={unit.value}>
                        {unit.label}
                      </option>
                    );
                  })}
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  Choisissez kg pour les produits vendus au poids, unité pour les pièces
                </p>
              </div>
              
              <div>
                <Label htmlFor="category">Catégorie</Label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">Sélectionner une catégorie</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <Label htmlFor="stock">Stock initial</Label>
                <Input
                  id="stock"
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.unit === 'kg' ? 'Quantité en kg disponible' : 'Nombre d\'unités disponibles'}
                </p>
              </div>
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Description du produit..."
                rows={3}
              />
            </div>
            
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Annuler
              </Button>
              <Button onClick={handleAddProduct} disabled={loading}>
                <ImageIcon className="w-4 h-4 mr-2" />
                Ajouter avec Image Auto
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtres et recherche */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Rechercher des produits..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="p-2 border rounded-md"
        >
          <option value="all">Toutes catégories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Liste des produits */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => {
          const UnitIcon = getUnitIcon(product.unit);
          return (
            <Card key={product.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="aspect-square bg-gray-100 rounded-lg mb-4 overflow-hidden">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = `https://via.placeholder.com/300x200/4f46e5/white?text=${encodeURIComponent(product.name)}`;
                    }}
                  />
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{product.name}</h3>
                      <p className="text-sm text-muted-foreground">{product.category}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <p className="font-bold text-lg">{product.price.toFixed(2)}$</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <UnitIcon className="w-3 h-3" />
                          /{product.unit}
                        </div>
                      </div>
                      <Badge variant={product.is_available ? 'default' : 'secondary'}>
                        {product.is_available ? 'Disponible' : 'En attente'}
                      </Badge>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {product.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span className="text-sm">Stock: {product.stock}</span>
                      <UnitIcon className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{product.unit}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Aucun produit trouvé</h3>
          <p className="text-muted-foreground mb-4">
            Commencez par ajouter votre premier produit
          </p>
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un produit
          </Button>
        </div>
      )}
    </div>
  );
}