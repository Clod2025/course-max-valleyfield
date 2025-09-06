import { useState, useEffect } from 'react';
import { ClientHeader } from '@/components/client/ClientHeader';
import { AppFooter } from '@/components/AppFooter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ShoppingCart, 
  Heart, 
  Clock, 
  Package, 
  MapPin, 
  Star,
  Plus,
  User,
  AlertCircle,
  Store,
  Search,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { useLoyaltyAccount } from '@/hooks/useLoyalty';
import { useRecentOrders } from '@/hooks/useRecentOrders';
import { useNavigate } from 'react-router-dom';

const ClientDashboard = () => {
  const { profile, loading: authLoading, isRole } = useAuth();
  const { items: cartItems, total: cartTotal } = useCart();
  const { account: loyaltyAccount, loading: loyaltyLoading } = useLoyaltyAccount();
  const { orders: recentOrders, loading: ordersLoading } = useRecentOrders();
  const navigate = useNavigate();
  
  const [showStores, setShowStores] = useState(false);

  // ✅ VÉRIFICATION CORRIGÉE AVEC TOUS LES RÔLES CLIENT POSSIBLES
  const isClientRole = isRole(['client', 'Client', 'CLIENT']);

  // Données simulées des magasins (à remplacer par des vraies données)
  const stores = [
    {
      id: '1',
      name: 'Épicerie Martin',
      type: 'Épicerie',
      address: '123 Rue Principale, Valleyfield',
      rating: 4.8,
      deliveryTime: '20-30 min',
      deliveryFee: 5.99,
      image: '/placeholder-store.jpg',
      isOpen: true,
      categories: ['Fruits & Légumes', 'Viandes', 'Produits laitiers']
    },
    {
      id: '2',
      name: 'Pharmacie Plus',
      type: 'Pharmacie',
      address: '456 Avenue des Érables, Valleyfield',
      rating: 4.6,
      deliveryTime: '15-25 min',
      deliveryFee: 3.99,
      image: '/placeholder-pharmacy.jpg',
      isOpen: true,
      categories: ['Médicaments', 'Soins personnels', 'Vitamines']
    },
    {
      id: '3',
      name: 'Boucherie du Coin',
      type: 'Boucherie',
      address: '789 Rue du Commerce, Valleyfield',
      rating: 4.9,
      deliveryTime: '25-35 min',
      deliveryFee: 4.99,
      image: '/placeholder-butcher.jpg',
      isOpen: false,
      categories: ['Viandes fraîches', 'Charcuterie', 'Volaille']
    }
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <ClientHeader />
        <div className="container mx-auto py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Chargement...</div>
          </div>
        </div>
      </div>
    );
  }

  // ✅ VÉRIFICATION CORRIGÉE
  if (!profile || !isClientRole) {
    return (
      <div className="min-h-screen bg-background">
        <ClientHeader />
        <div className="container mx-auto py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
              <h2 className="text-2xl font-bold mb-2">Accès non autorisé</h2>
              <p className="text-muted-foreground mb-4">
                Vous devez être connecté en tant que client pour accéder à cette page.
              </p>
              <div className="text-sm text-gray-500">
                <p>Rôle actuel: <strong>{profile?.role || 'Non défini'}</strong></p>
                <p>Rôles autorisés: client</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const handleStoreSelect = (storeId: string) => {
    // Rediriger vers la page des produits du magasin
    navigate(`/store/${storeId}/products`);
  };

  return (
    <div className="min-h-screen bg-background">
      <ClientHeader />
      
      <div className="container mx-auto py-6 px-4">
        {/* En-tête Client */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <User className="w-8 h-8 text-green-600" />
                Bienvenue, {profile.first_name || 'Client'}
              </h1>
              <p className="text-muted-foreground mt-2">
                Découvrez les meilleurs magasins de votre région
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="default" className="bg-green-600">
                <User className="w-4 h-4 mr-1" />
                Client
              </Badge>
            </div>
          </div>
        </div>

        {/* Bouton Magasiner Principal */}
        <div className="mb-8">
          <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <CardContent className="p-8 text-center">
              <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingCart className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Prêt à faire vos courses ?</h2>
              <p className="text-muted-foreground mb-6">
                Découvrez tous les magasins disponibles dans votre région
              </p>
              <Button 
                size="lg" 
                className="bg-green-600 hover:bg-green-700 text-lg px-8 py-3"
                onClick={() => setShowStores(true)}
              >
                <Store className="w-5 h-5 mr-2" />
                Magasiner Maintenant
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Panier Actuel</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{cartItems?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                Total: {cartTotal?.toFixed(2) || '0.00'}$
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Commandes</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{recentOrders?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Ce mois</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Points Fidélité</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loyaltyAccount?.points || 0}</div>
              <p className="text-xs text-muted-foreground">Points disponibles</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Favoris</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground">Produits sauvés</p>
            </CardContent>
          </Card>
        </div>

        {/* Commandes récentes */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Vos Dernières Commandes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ordersLoading ? (
              <div className="text-center py-4">Chargement...</div>
            ) : recentOrders && recentOrders.length > 0 ? (
              <div className="space-y-3">
                {recentOrders.slice(0, 3).map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="bg-green-100 p-2 rounded-lg">
                        <Package className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">Commande #{order.order_number}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString()} • {order.items?.length || 0} articles
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge 
                        variant={order.status === 'delivered' ? 'default' : 'secondary'}
                        className={order.status === 'delivered' ? 'bg-green-600' : ''}
                      >
                        {order.status}
                      </Badge>
                      <p className="text-sm font-semibold mt-1">{order.total_amount}$</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Aucune commande récente</h3>
                <p className="text-muted-foreground mb-4">
                  Commencez vos courses dès maintenant !
                </p>
                <Button onClick={() => setShowStores(true)}>
                  <Store className="w-4 h-4 mr-2" />
                  Découvrir les Magasins
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal des magasins */}
        {showStores && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-background rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
              {/* En-tête du modal */}
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Choisissez votre magasin</h2>
                    <p className="text-muted-foreground">Sélectionnez un magasin pour commencer vos courses</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowStores(false)}
                    className="text-2xl"
                  >
                    ×
                  </Button>
                </div>
              </div>

              {/* Liste des magasins */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {stores.map((store) => (
                    <Card 
                      key={store.id} 
                      className={`hover:shadow-lg transition-all duration-200 cursor-pointer ${
                        !store.isOpen ? 'opacity-60' : ''
                      }`}
                      onClick={() => store.isOpen && handleStoreSelect(store.id)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-blue-100 p-3 rounded-lg">
                              <Store className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">{store.name}</h3>
                              <p className="text-sm text-muted-foreground">{store.type}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {store.isOpen ? (
                              <Badge className="bg-green-600">Ouvert</Badge>
                            ) : (
                              <Badge variant="destructive">Fermé</Badge>
                            )}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <span>{store.address}</span>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-500 fill-current" />
                              <span className="text-sm font-medium">{store.rating}</span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {store.deliveryTime}
                            </div>
                            <div className="text-sm font-medium">
                              Livraison: {store.deliveryFee}$
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-1">
                            {store.categories.slice(0, 3).map((category, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {category}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {store.isOpen && (
                          <Button 
                            className="w-full mt-4 bg-green-600 hover:bg-green-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStoreSelect(store.id);
                            }}
                          >
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            Commencer mes courses
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <AppFooter />
    </div>
  );
};

export default ClientDashboard;