import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Store, 
  Package, 
  ShoppingCart, 
  Plus, 
  Minus,
  Search,
  Filter,
  Star,
  MapPin,
  Clock
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface TestStore {
  id: string;
  name: string;
  type: 'restaurant' | 'pharmacy' | 'grocery' | 'other';
  address: string;
  city: string;
  phone: string;
  email: string;
  rating: number;
  delivery_time: number;
  delivery_fee: number;
  is_open: boolean;
  products: TestProduct[];
}

interface TestProduct {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  image: string;
  rating: number;
  is_popular: boolean;
  is_available: boolean;
}

const TestData = () => {
  const [stores, setStores] = useState<TestStore[]>([]);
  const [selectedStore, setSelectedStore] = useState<TestStore | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cart, setCart] = useState<{[key: string]: number}>({});

  useEffect(() => {
    loadTestData();
  }, []);

  const loadTestData = () => {
    const testStores: TestStore[] = [
      {
        id: 'store-1',
        name: 'Restaurant Le Bistro',
        type: 'restaurant',
        address: '123 Rue Principale',
        city: 'Valleyfield',
        phone: '(450) 555-0123',
        email: 'contact@lebistro.com',
        rating: 4.8,
        delivery_time: 25,
        delivery_fee: 5.99,
        is_open: true,
        products: [
          {
            id: 'prod-1',
            name: 'Pizza Margherita',
            description: 'Tomate, mozzarella, basilic frais',
            category: 'Pizzas',
            price: 18.99,
            stock: 15,
            image: '/placeholder.svg',
            rating: 4.9,
            is_popular: true,
            is_available: true
          },
          {
            id: 'prod-2',
            name: 'Pasta Carbonara',
            description: 'Pâtes fraîches, lardons, crème, parmesan',
            category: 'Pâtes',
            price: 16.50,
            stock: 8,
            image: '/placeholder.svg',
            rating: 4.7,
            is_popular: true,
            is_available: true
          },
          {
            id: 'prod-3',
            name: 'Salade César',
            description: 'Laitue romaine, croûtons, parmesan, sauce césar',
            category: 'Salades',
            price: 12.99,
            stock: 12,
            image: '/placeholder.svg',
            rating: 4.5,
            is_popular: false,
            is_available: true
          },
          {
            id: 'prod-4',
            name: 'Tiramisu',
            description: 'Dessert italien au café et mascarpone',
            category: 'Desserts',
            price: 8.99,
            stock: 6,
            image: '/placeholder.svg',
            rating: 4.8,
            is_popular: true,
            is_available: true
          }
        ]
      },
      {
        id: 'store-2',
        name: 'Pharmacie Centrale',
        type: 'pharmacy',
        address: '456 Boulevard des Érables',
        city: 'Valleyfield',
        phone: '(450) 555-0456',
        email: 'info@pharmaciecentrale.com',
        rating: 4.9,
        delivery_time: 20,
        delivery_fee: 4.99,
        is_open: true,
        products: [
          {
            id: 'prod-5',
            name: 'Tylenol Extra Fort',
            description: 'Acétaminophène 500mg, 100 comprimés',
            category: 'Médicaments',
            price: 12.99,
            stock: 25,
            image: '/placeholder.svg',
            rating: 4.6,
            is_popular: true,
            is_available: true
          },
          {
            id: 'prod-6',
            name: 'Vitamine D3',
            description: '1000 UI, 120 capsules',
            category: 'Vitamines',
            price: 24.99,
            stock: 18,
            image: '/placeholder.svg',
            rating: 4.7,
            is_popular: true,
            is_available: true
          },
          {
            id: 'prod-7',
            name: 'Crème Hydratante',
            description: 'Crème pour le visage, 50ml',
            category: 'Soins',
            price: 19.99,
            stock: 10,
            image: '/placeholder.svg',
            rating: 4.4,
            is_popular: false,
            is_available: true
          },
          {
            id: 'prod-8',
            name: 'Thermomètre Digital',
            description: 'Thermomètre infrarouge sans contact',
            category: 'Équipement',
            price: 45.99,
            stock: 5,
            image: '/placeholder.svg',
            rating: 4.8,
            is_popular: false,
            is_available: true
          }
        ]
      },
      {
        id: 'store-3',
        name: 'Épicerie Martin',
        type: 'grocery',
        address: '789 Avenue du Parc',
        city: 'Valleyfield',
        phone: '(450) 555-0789',
        email: 'martin@epicerie.com',
        rating: 4.6,
        delivery_time: 30,
        delivery_fee: 6.99,
        is_open: true,
        products: [
          {
            id: 'prod-9',
            name: 'Pain Artisanal',
            description: 'Pain de campagne cuit au feu de bois',
            category: 'Boulangerie',
            price: 4.99,
            stock: 20,
            image: '/placeholder.svg',
            rating: 4.8,
            is_popular: true,
            is_available: true
          },
          {
            id: 'prod-10',
            name: 'Lait Bio 2%',
            description: 'Lait biologique 2% de matières grasses, 1L',
            category: 'Produits Laitiers',
            price: 5.99,
            stock: 15,
            image: '/placeholder.svg',
            rating: 4.5,
            is_popular: true,
            is_available: true
          },
          {
            id: 'prod-11',
            name: 'Pommes Gala',
            description: 'Pommes Gala biologiques, 3kg',
            category: 'Fruits',
            price: 8.99,
            stock: 12,
            image: '/placeholder.svg',
            rating: 4.6,
            is_popular: false,
            is_available: true
          },
          {
            id: 'prod-12',
            name: 'Saumon Frais',
            description: 'Filet de saumon atlantique, 500g',
            category: 'Poissonnerie',
            price: 24.99,
            stock: 8,
            image: '/placeholder.svg',
            rating: 4.9,
            is_popular: true,
            is_available: true
          },
          {
            id: 'prod-13',
            name: 'Épinards Bio',
            description: 'Épinards biologiques frais, 200g',
            category: 'Légumes',
            price: 3.99,
            stock: 0,
            image: '/placeholder.svg',
            rating: 4.3,
            is_popular: false,
            is_available: false
          }
        ]
      },
      {
        id: 'store-4',
        name: 'Café Artisanal',
        type: 'restaurant',
        address: '321 Rue de la Paix',
        city: 'Valleyfield',
        phone: '(450) 555-0321',
        email: 'info@cafeartisanal.com',
        rating: 4.7,
        delivery_time: 15,
        delivery_fee: 3.99,
        is_open: true,
        products: [
          {
            id: 'prod-14',
            name: 'Cappuccino',
            description: 'Café italien avec mousse de lait',
            category: 'Boissons Chaudes',
            price: 4.50,
            stock: 50,
            image: '/placeholder.svg',
            rating: 4.8,
            is_popular: true,
            is_available: true
          },
          {
            id: 'prod-15',
            name: 'Croissant au Beurre',
            description: 'Croissant artisanal au beurre AOP',
            category: 'Viennoiseries',
            price: 2.99,
            stock: 25,
            image: '/placeholder.svg',
            rating: 4.9,
            is_popular: true,
            is_available: true
          },
          {
            id: 'prod-16',
            name: 'Smoothie Vert',
            description: 'Smoothie aux épinards, banane et mangue',
            category: 'Boissons Froides',
            price: 6.99,
            stock: 15,
            image: '/placeholder.svg',
            rating: 4.6,
            is_popular: false,
            is_available: true
          }
        ]
      }
    ];

    setStores(testStores);
  };

  const addToCart = (productId: string) => {
    setCart(prev => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[productId] > 1) {
        newCart[productId] -= 1;
      } else {
        delete newCart[productId];
      }
      return newCart;
    });
  };

  const getCartTotal = () => {
    if (!selectedStore) return 0;
    return Object.entries(cart).reduce((total, [productId, quantity]) => {
      const product = selectedStore.products.find(p => p.id === productId);
      return total + (product ? product.price * quantity : 0);
    }, 0);
  };

  const getCartItemsCount = () => {
    return Object.values(cart).reduce((total, quantity) => total + quantity, 0);
  };

  const filteredProducts = selectedStore ? selectedStore.products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }) : [];

  const categories = selectedStore ? [...new Set(selectedStore.products.map(p => p.category))] : [];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🧪 Test des Produits - CourseMax</h1>
        
        {/* Sélection du magasin */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Choisir un magasin :</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stores.map((store) => (
              <Card 
                key={store.id} 
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  selectedStore?.id === store.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedStore(store)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Store className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{store.name}</h3>
                      <Badge variant="outline" className="text-xs">
                        {store.type}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>{store.address}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{store.delivery_time} min</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <span>{store.rating}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Produits du magasin sélectionné */}
        {selectedStore && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">{selectedStore.name}</h2>
                <p className="text-muted-foreground">{selectedStore.products.length} produits disponibles</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Panier ({getCartItemsCount()} articles)</p>
                  <p className="text-lg font-bold">${getCartTotal().toFixed(2)}</p>
                </div>
                <Button disabled={getCartItemsCount() === 0}>
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Commander
                </Button>
              </div>
            </div>

            {/* Filtres */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4" />
                    <Input
                      placeholder="Rechercher un produit..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-64"
                    />
                  </div>
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
              </CardContent>
            </Card>

            {/* Grille de produits */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => {
                const quantity = cart[product.id] || 0;
                return (
                  <Card key={product.id} className="overflow-hidden">
                    <div className="aspect-square bg-gray-100 flex items-center justify-center">
                      <Package className="w-16 h-16 text-gray-400" />
                    </div>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <h3 className="font-semibold line-clamp-2">{product.name}</h3>
                          {product.is_popular && (
                            <Badge className="bg-orange-500 text-xs">Populaire</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {product.description}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {product.category}
                          </Badge>
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs">{product.rating}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-lg">${product.price}</span>
                          <span className="text-xs text-muted-foreground">
                            {product.stock} en stock
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {quantity > 0 ? (
                            <div className="flex items-center gap-2 flex-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeFromCart(product.id)}
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
                                onClick={() => addToCart(product.id)}
                                disabled={product.stock === 0}
                                className="h-8 w-8 p-0"
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              onClick={() => addToCart(product.id)}
                              disabled={product.stock === 0}
                              className="flex-1"
                              size="sm"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              {product.stock === 0 ? 'Rupture' : 'Ajouter'}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {filteredProducts.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Aucun produit trouvé</h3>
                  <p className="text-muted-foreground">
                    Aucun produit ne correspond à vos critères de recherche.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TestData;
