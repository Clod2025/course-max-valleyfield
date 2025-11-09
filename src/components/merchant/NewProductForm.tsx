import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Image as ImageIcon, 
  Check, 
  X, 
  Loader2,
  Package,
  DollarSign,
  Package2,
  Scale
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface ImageResult {
  id: string;
  url: string;
  thumbnail: string;
  alt: string;
  source: string;
}

interface NewProductFormProps {
  onProductAdded?: (product: any) => void;
  onCancel?: () => void;
}

export function NewProductForm({ onProductAdded, onCancel }: NewProductFormProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [unit, setUnit] = useState<'kg' | 'unité'>('unité');
  const [description, setDescription] = useState('');
  
  const [images, setImages] = useState<ImageResult[]>([]);
  const [selectedImage, setSelectedImage] = useState<ImageResult | null>(null);
  const [searchingImages, setSearchingImages] = useState(false);
  const [addingProduct, setAddingProduct] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

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

  const searchImages = async () => {
    if (!productName.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir le nom du produit avant de chercher des images",
        variant: "destructive"
      });
      return;
    }

    setSearchingImages(true);
    try {
      const response = await fetch('/api/search-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productName: productName.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        setImages(data.images);
        if (data.images.length > 0) {
          setSelectedImage(data.images[0]); // Sélectionner la première image par défaut
        }
        toast({
          title: "Images trouvées",
          description: `${data.images.length} image(s) trouvée(s) pour "${productName}"`,
        });
      } else {
        throw new Error(data.error || 'Erreur lors de la recherche d\'images');
      }
    } catch (error: any) {
      console.error('Erreur lors de la recherche d\'images:', error);
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les images. Utilisation d'une image par défaut.",
        variant: "destructive"
      });
      
      // Fallback: créer une image placeholder
      const fallbackImage: ImageResult = {
        id: 'fallback',
        url: `https://via.placeholder.com/400x300/4f46e5/white?text=${encodeURIComponent(productName)}`,
        thumbnail: `https://via.placeholder.com/200x150/4f46e5/white?text=${encodeURIComponent(productName)}`,
        alt: productName,
        source: 'Placeholder'
      };
      setImages([fallbackImage]);
      setSelectedImage(fallbackImage);
    } finally {
      setSearchingImages(false);
    }
  };

  const handleAddProduct = async () => {
    if (!validateForm()) {
      toast({
        title: "Erreur de validation",
        description: "Veuillez corriger les erreurs dans le formulaire",
        variant: "destructive"
      });
      return;
    }

    setAddingProduct(true);
    try {
      const { data, error } = await supabase.rpc('create_product_with_image', {
        p_nom: productName.trim(),
        p_categorie: category,
        p_prix: parseFloat(price),
        p_stock: parseInt(stock) || 0,
        p_unite: unit,
        p_description: description.trim() || null,
        p_image_url: selectedImage.url,
        p_merchant_id: profile?.id
      });

      if (error) throw error;

      toast({
        title: "Produit ajouté",
        description: `"${productName}" a été ajouté avec succès`,
      });

      // Appeler le callback si fourni
      if (onProductAdded) {
        onProductAdded(data);
      }

      // Réinitialiser le formulaire
      resetForm();

    } catch (error: any) {
      console.error('Erreur lors de l\'ajout du produit:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'ajouter le produit",
        variant: "destructive"
      });
    } finally {
      setAddingProduct(false);
    }
  };

  const resetForm = () => {
    setProductName('');
    setCategory('');
    setPrice('');
    setStock('');
    setUnit('unité');
    setDescription('');
    setImages([]);
    setSelectedImage(null);
    setFormErrors({});
  };

  const getUnitIcon = (unitValue: string) => {
    return unitValue === 'kg' ? Scale : Package2;
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!productName.trim()) {
      errors.productName = 'Le nom du produit est requis';
    } else if (productName.trim().length < 2) {
      errors.productName = 'Le nom doit contenir au moins 2 caractères';
    }

    if (!category) {
      errors.category = 'La catégorie est requise';
    }

    if (!price || parseFloat(price) <= 0) {
      errors.price = 'Le prix doit être supérieur à 0';
    }

    if (stock && parseInt(stock) < 0) {
      errors.stock = 'Le stock ne peut pas être négatif';
    }

    if (!selectedImage) {
      errors.image = 'Veuillez sélectionner une image';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          Nouveau Produit
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Section 1: Informations de base */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Informations du produit</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="productName">Nom du produit *</Label>
              <div className="flex gap-2">
                <Input
                  id="productName"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="Ex: Pommes Golden, Pain de mie..."
                  className={`flex-1 ${formErrors.productName ? 'border-red-500' : ''}`}
                />
                <Button
                  type="button"
                  onClick={searchImages}
                  disabled={searchingImages || !productName.trim()}
                  variant="outline"
                >
                  {searchingImages ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline ml-2">Chercher Images</span>
                </Button>
              </div>
              {formErrors.productName && (
                <p className="text-sm text-red-500 mt-1">{formErrors.productName}</p>
              )}
            </div>

            <div>
              <Label htmlFor="category">Catégorie *</Label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={`w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${formErrors.category ? 'border-red-500' : ''}`}
              >
                <option value="">Sélectionner une catégorie</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              {formErrors.category && (
                <p className="text-sm text-red-500 mt-1">{formErrors.category}</p>
              )}
            </div>

            <div>
              <Label htmlFor="price">Prix ($) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                className={formErrors.price ? 'border-red-500' : ''}
              />
              {formErrors.price && (
                <p className="text-sm text-red-500 mt-1">{formErrors.price}</p>
              )}
            </div>

            <div>
              <Label htmlFor="stock">Stock initial</Label>
              <Input
                id="stock"
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="0"
                className={formErrors.stock ? 'border-red-500' : ''}
              />
              {formErrors.stock && (
                <p className="text-sm text-red-500 mt-1">{formErrors.stock}</p>
              )}
            </div>

            <div>
              <Label htmlFor="unit">Unité de mesure *</Label>
              <select
                id="unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value as 'kg' | 'unité')}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {units.map(unitOption => {
                  const Icon = unitOption.icon;
                  return (
                    <option key={unitOption.value} value={unitOption.value}>
                      {unitOption.label}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description du produit (optionnel)..."
              rows={3}
            />
          </div>
        </div>

        {/* Section 2: Sélection d'image */}
        {images.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Sélectionner une image *</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {images.map((image) => (
                <div
                  key={image.id}
                  className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImage?.id === image.id
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedImage(image)}
                >
                  <div className="aspect-square">
                    <img
                      src={image.thumbnail}
                      alt={image.alt}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  {selectedImage?.id === image.id && (
                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                      <Check className="w-6 h-6 text-primary bg-white rounded-full p-1" />
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1">
                    {image.source}
                  </div>
                </div>
              ))}
            </div>
            
            {selectedImage && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <ImageIcon className="w-4 h-4" />
                  <span className="font-medium">Image sélectionnée:</span>
                  <Badge variant="outline">{selectedImage.source}</Badge>
                </div>
                <img
                  src={selectedImage.url}
                  alt={selectedImage.alt}
                  className="w-32 h-24 object-cover rounded border"
                />
              </div>
            )}
            {formErrors.image && (
              <p className="text-sm text-red-500">{formErrors.image}</p>
            )}
          </div>
        )}

        {/* Section 3: Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
          <Button
            onClick={handleAddProduct}
            disabled={addingProduct}
            className="flex-1"
          >
            {addingProduct ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Ajout en cours...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Ajouter le Produit
              </>
            )}
          </Button>
          
          {onCancel && (
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={addingProduct}
            >
              <X className="w-4 h-4 mr-2" />
              Annuler
            </Button>
          )}
        </div>

        {/* Aperçu du produit */}
        {(productName || selectedImage) && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-3">Aperçu du produit</h4>
            <div className="flex items-center gap-4">
              {selectedImage && (
                <img
                  src={selectedImage.thumbnail}
                  alt={productName}
                  className="w-16 h-16 object-cover rounded border"
                />
              )}
              <div className="flex-1">
                <h5 className="font-medium">{productName || 'Nom du produit'}</h5>
                <p className="text-sm text-gray-600">{category || 'Catégorie'}</p>
                <div className="flex items-center gap-2 mt-1">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-green-600">
                    {price ? `$${parseFloat(price).toFixed(2)}` : '$0.00'}
                  </span>
                  <span className="text-sm text-gray-500">/ {unit}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
