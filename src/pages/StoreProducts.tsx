import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ClientHeader } from '@/components/client/ClientHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingCart, 
  Search, 
  Star, 
  Plus, 
  Minus,
  ArrowLeft,
  Filter,
  Heart,
  Clock,
  MapPin
} from 'lucide-react';
import { useCart } from '@/hooks/useCart';

const StoreProducts = () => {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const { addItem, items: cartItems } = useCart();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  // Données simulées (à remplacer par de vraies données)
  const store = {
    id: storeId,
    name: 'Épicerie Martin',
    address: '123 Rue Principale, Valleyfield',
    rating: 4.8,
    deliveryTime: '20-30 min',
    deliveryFee: 5.99,
    isOpen: true
  };

  const categories = [
    { id: 'all', name: 'Tous les produits', count: 45 },
    { id: 'fruits', name: 'Fruits & Légumes', count: 12 },
    { id: 'dairy', name: 'Produits laitiers', count: 8 },
    { id: 'meat', name: 'Viandes', count: 6 },
    { id: 'bakery', name: 'Boulangerie', count: 9 },
    { id: 'frozen', name: 'Surgelés', count: 10 }
  ];

  const products = [
    {
      id: '1',
      name: 'Pommes Gala',
      category: 'fruits',
      price: 3.99,
      unit: '/kg',
      image: '/placeholder-apple.jpg',
      inStock: true,
      description: 'Pommes fraîches et croquantes',
      rating: 4.5
    },
    {
      id: '2',
      name: 'Lait 2%',
      category: 'dairy',
      price: 4.29,
      unit: '/2L',
      image: '/placeholder-milk.jpg',
      inStock: true,
      description: 'Lait frais 2% de matières grasses',
      rating: 4.8
    },
    {
      id: '3',
      name: 'Pain de blé entier',
      category: 'bakery',
      price: 2.99,
      unit: '/unité',
      image: '/placeholder-bread.jpg',
      inStock: true,
      description: 'Pain frais de blé entier',
      rating: 4.6
    },
    {
      id: '4',
      name: 'Bœuf haché maigre',
      category: 'meat',
      price: 8.99,
      unit: '/kg',
      image: '/placeholder-meat.jpg',
      inStock: true,
      description: 'Bœuf haché frais, 90% maigre',
      rating: 4.7
    },
    {
      id: '5',
      name: 'Bananes',
      category: 'fruits',
      price: 1.99,
      unit: '/kg',
      image: '/placeholder-banana.jpg',
      inStock: false,
      description: 'Bananes mûres et sucrées',
      rating: 4.3
    }
  ];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleQuantityChange = (productId: string, change: number) => {
    setQuantities(prev => ({
      ...prev,
      [productId]: Math.max(0, (prev[productId] || 0) + change)
    }));
  };

  const handleAddToCart = (product: any) => {
    const quantity = quantities[product.id] || 1;
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: quantity,
      image: product.image
    });
    
    // Reset quantity
    setQuantities(prev => ({
      ...prev,
      [product.id]: 0
    }));
  };

  const getCartItemQuantity = (productId: string) => {
    const cartItem = cartItems?.find(item => item.id === productId);
    return cartItem?.quantity || 0;
  };

  return (
    <div className="min-h-screen bg-background">
      <ClientHeader />
      
      <div className="container mx-auto py-6 px-4">
        {/* En-tête du magasin */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard/client')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour au dashboard
          </Button>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold">{store.name}</h1>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {store.address}
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      {store.rating}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {store.deliveryTime}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className="bg-green-600 mb-2">Ouvert</Badge>
                  <p className="text-sm text-muted-foreground">
                    Livraison: {store.deliveryFee}$
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filtres et catégories */}
          <div className="space-y-6">
            {/* Recherche */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Rechercher</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Rechercher un produit..."
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Catégories */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Catégories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.id ? 'default' : 'ghost'}
                      className="w-full justify-between"
                      onClick={() => setSelectedCategory(category.id)}
                    >
                      <span>{category.name}</span>
                      <Badge variant="outline">{category.count}</Badge>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Produits */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">
                {filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''}
                {selectedCategory !== 'all' && (
                  <span className="text-muted-foreground ml-2">
                    dans {categories.find(c => c.id === selectedCategory)?.name}
                  </span>
                )}
              </h2>
              
              <Button
                onClick={() => navigate('/payment')}
                className="bg-green-600 hover:bg-green-700"
                disabled={!cartItems || cartItems.length === 0}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Passer commande ({cartItems?.length || 0})
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProducts.map((product) => {
                const currentQuantity = quantities[product.id] || 0;
                const cartQuantity = getCartItemQuantity(product.id);
                
                return (
                  <Card 
                    key={product.id} 
                    className={`hover:shadow-lg transition-all duration-200 ${
                      !product.inStock ? 'opacity-60' : ''
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="aspect-square bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                        <div className="text-4xl">🛒</div>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-semibold">{product.name}</h3>
                          <p className="text-sm text-muted-foreground">{product.description}</p>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span className="text-sm">{product.rating}</span>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg">{product.price.toFixed(2)}$</p>
                            <p className="text-xs text-muted-foreground">{product.unit}</p>
                          </div>
                        </div>

                        {cartQuantity > 0 && (
                          <div className="p-2 bg-green-50 rounded-lg text-center">
                            <p className="text-sm text-green-800">
                              {cartQuantity} dans le panier
                            </p>
                          </div>
                        )}

                        {product.inStock ? (
                          <div className="space-y-3">
                            {/* Sélecteur de quantité */}
                            <div className="flex items-center justify-center gap-3">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleQuantityChange(product.id, -1)}
                                disabled={currentQuantity <= 0}
                              >
                                <Minus className="w-4 h-4" />
                              </Button>
                              <span className="w-8 text-center font-medium">
                                {currentQuantity || 1}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleQuantityChange(product.id, 1)}
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>

                            <Button
                              className="w-full bg-green-600 hover:bg-green-700"
                              onClick={() => handleAddToCart(product)}
                            >
                              <ShoppingCart className="w-4 h-4 mr-2" />
                              Ajouter au panier
                            </Button>
                          </div>
                        ) : (
                          <Button variant="outline" className="w-full" disabled>
                            Rupture de stock
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full"
                        >
                          <Heart className="w-4 h-4 mr-2" />
                          Ajouter aux favoris
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <Search className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Aucun produit trouvé</h3>
                <p className="text-muted-foreground">
                  Essayez de modifier votre recherche ou sélectionner une autre catégorie.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreProducts;
