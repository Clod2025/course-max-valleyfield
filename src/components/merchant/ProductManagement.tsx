import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Package, 
  DollarSign,
  Save,
  X,
  Search,
  Filter,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { useAuth } from '@/hooks/useAuth';
import { Product, CreateProductData } from '@/types/product';
import { toast } from '@/hooks/use-toast';

const ProductManagement = () => {
  const { profile } = useAuth();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Supposons que l'utilisateur a un store_id dans son profil
  const storeId = profile?.store_id || '';

  const { 
    products, 
    loading, 
    error, 
    addProduct, 
    updateProduct, 
    deleteProduct,
    decrementStock,
    incrementStock
  } = useProducts({ storeId });

  const [formData, setFormData] = useState<CreateProductData>({
    name: '',
    description: '',
    category: '',
    price: 0,
    stock: 0,
    image: '',
    store_id: storeId
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const categories = [
    'Alimentation',
    'Boissons',
    'Produits laitiers',
    'Fruits et légumes',
    'Viande et poisson',
    'Boulangerie',
    'Épicerie',
    'Surgelés',
    'Hygiène',
    'Ménage',
    'Autre'
  ];

  // Validation du formulaire
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Le nom du produit est requis';
    } else if (formData.name.length < 2) {
      errors.name = 'Le nom doit contenir au moins 2 caractères';
    }

    if (!formData.category) {
      errors.category = 'La catégorie est requise';
    }

    if (formData.price <= 0) {
      errors.price = 'Le prix doit être supérieur à 0';
    }

    if (formData.stock < 0) {
      errors.stock = 'Le stock ne peut pas être négatif';
    }

    if (formData.image && !isValidUrl(formData.image)) {
      errors.image = 'Veuillez entrer une URL valide';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Erreur de validation",
        description: "Veuillez corriger les erreurs dans le formulaire",
        variant: "destructive"
      });
      return;
    }

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, formData);
        toast({
          title: "Produit modifié",
          description: `${formData.name} a été modifié avec succès`,
        });
        setEditingProduct(null);
      } else {
        await addProduct(formData);
        toast({
          title: "Produit ajouté",
          description: `${formData.name} a été ajouté avec succès`,
        });
      }
      
      resetForm();
      setShowAddForm(false);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la sauvegarde",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: '',
      price: 0,
      stock: 0,
      image: '',
      store_id: storeId
    });
    setFormErrors({});
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      category: product.category,
      price: product.price,
      stock: product.stock,
      image: product.image || '',
      store_id: product.store_id
    });
    setShowAddForm(true);
  };

  const handleDeleteClick = (product: Product) => {
    setDeleteProductId(product.id);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteProductId) return;

    try {
      await deleteProduct(deleteProductId);
      toast({
        title: "Produit supprimé",
        description: "Le produit a été supprimé avec succès",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression",
        variant: "destructive"
      });
    } finally {
      setShowDeleteDialog(false);
      setDeleteProductId(null);
    }
  };

  const handleStockChange = async (product: Product, newStock: number) => {
    try {
      const difference = newStock - product.stock;
      if (difference > 0) {
        await incrementStock(product.id, difference);
        toast({
          title: "Stock mis à jour",
          description: `Stock de ${product.name} augmenté de ${difference}`,
        });
      } else if (difference < 0) {
        await decrementStock(product.id, Math.abs(difference));
        toast({
          title: "Stock mis à jour",
          description: `Stock de ${product.name} diminué de ${Math.abs(difference)}`,
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour du stock",
        variant: "destructive"
      });
    }
  };

  const getStockBadge = (stock: number) => {
    if (stock === 0) {
      return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Rupture</Badge>;
    } else if (stock <= 5) {
      return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Stock faible</Badge>;
    } else {
      return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />En stock</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement des produits...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestion des Produits</h2>
          <p className="text-muted-foreground">Gérez votre inventaire de produits</p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Ajouter un produit
        </Button>
      </div>

      {/* Formulaire d'ajout/modification */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingProduct ? 'Modifier le produit' : 'Nouveau produit'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nom du produit *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={formErrors.name ? 'border-red-500' : ''}
                  />
                  {formErrors.name && (
                    <p className="text-sm text-red-500 mt-1">{formErrors.name}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="category">Catégorie *</Label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-md ${formErrors.category ? 'border-red-500' : ''}`}
                  >
                    <option value="">Sélectionner une catégorie</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  {formErrors.category && (
                    <p className="text-sm text-red-500 mt-1">{formErrors.category}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder="Décrivez votre produit..."
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="price">Prix ($) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className={formErrors.price ? 'border-red-500' : ''}
                  />
                  {formErrors.price && (
                    <p className="text-sm text-red-500 mt-1">{formErrors.price}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="stock">Stock *</Label>
                  <Input
                    id="stock"
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                    className={formErrors.stock ? 'border-red-500' : ''}
                  />
                  {formErrors.stock && (
                    <p className="text-sm text-red-500 mt-1">{formErrors.stock}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="image">URL de l'image</Label>
                  <Input
                    id="image"
                    type="url"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                    className={formErrors.image ? 'border-red-500' : ''}
                  />
                  {formErrors.image && (
                    <p className="text-sm text-red-500 mt-1">{formErrors.image}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  <Save className="w-4 h-4 mr-2" />
                  {editingProduct ? 'Modifier' : 'Ajouter'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingProduct(null);
                    resetForm();
                  }}
                >
                  <X className="w-4 h-4 mr-2" />
                  Annuler
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Filtres et recherche */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 flex-1 min-w-64">
              <Search className="w-4 h-4" />
              <Input
                placeholder="Rechercher un produit..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="all">Toutes les catégories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des produits par catégorie */}
      <div className="space-y-6">
        {categories.map(category => {
          const categoryProducts = filteredProducts.filter(product => 
            selectedCategory === 'all' ? product.category === category : true
          );
          
          if (selectedCategory !== 'all' && selectedCategory !== category) return null;
          if (categoryProducts.length === 0) return null;

          return (
            <div key={category}>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Package className="w-5 h-5" />
                {category}
                <Badge variant="outline">{categoryProducts.length}</Badge>
              </h3>
              <div className="grid gap-4">
                {categoryProducts.map((product) => (
                  <Card key={product.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                            {product.image ? (
                              <img
                                src={product.image}
                                alt={product.name}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <Package className="w-8 h-8 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{product.name}</h3>
                            {product.description && (
                              <p className="text-muted-foreground text-sm">{product.description}</p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <DollarSign className="w-4 h-4" />
                                <span>{product.price.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="flex items-center gap-2 mb-2">
                              <Label htmlFor={`stock-${product.id}`} className="text-sm">Stock:</Label>
                              <Input
                                id={`stock-${product.id}`}
                                type="number"
                                min="0"
                                value={product.stock}
                                onChange={(e) => handleStockChange(product, Number(e.target.value))}
                                className="w-20 h-8"
                              />
                            </div>
                            {getStockBadge(product.stock)}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEdit(product)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDeleteClick(product)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Aucun produit trouvé</h3>
            <p className="text-muted-foreground">
              {searchTerm || selectedCategory !== 'all' 
                ? 'Aucun produit ne correspond à vos critères de recherche.'
                : 'Commencez par ajouter votre premier produit.'
              }
            </p>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce produit ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-red-500 hover:bg-red-600"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProductManagement;
