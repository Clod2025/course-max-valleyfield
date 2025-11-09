import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ClientHeader } from '@/components/client/ClientHeader';
import { AppFooter } from '@/components/AppFooter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/hooks/useCart';
import { useLoyaltyAccount } from '@/hooks/useLoyalty';
import { useRecentOrders } from '@/hooks/useRecentOrders';
import { Store, ShoppingCart, User, Package, Star, MapPin } from 'lucide-react';

// Types
interface StoreType {
  id: string;
  name: string;
  type: string;
  address: string;
  rating: number;
  deliveryTime: string;
  deliveryFee: number;
  image: string;
  isOpen: boolean;
  categories: string[];
}

const ClientDashboard: React.FC = () => {
  const { profile, loading: authLoading, isRole } = useAuth();
  const { items: cartItems, total: cartTotal } = useCart();
  const { account: loyaltyAccount } = useLoyaltyAccount();
  const { orders: recentOrders } = useRecentOrders();
  const navigate = useNavigate();

  const [stores, setStores] = useState<StoreType[]>([]);
  const [showStores, setShowStores] = useState(false);
  const [loadingStores, setLoadingStores] = useState(true);

  const isClientRole = isRole(['client', 'Client', 'CLIENT']);

  // 🔹 Récupération des magasins depuis Supabase
  const fetchStores = useCallback(async () => {
    try {
      setLoadingStores(true);
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      setStores(data || []);
    } catch (error) {
      console.error('Erreur chargement magasins:', error);
      setStores([]);
    } finally {
      setLoadingStores(false);
    }
  }, []);

  useEffect(() => {
    if (isClientRole) fetchStores();
  }, [isClientRole, fetchStores]);

  // Redirection si utilisateur non autorisé
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <ClientHeader />
        <div className="text-lg">Chargement...</div>
      </div>
    );
  }

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
    navigate(`/store/${storeId}/products`);
  };

  return (
    <div className="min-h-screen bg-background">
      <ClientHeader />

      <div className="container mx-auto py-6 px-4">
        {/* En-tête client */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <User className="w-8 h-8 text-green-600" />
              Bienvenue, {profile.first_name || 'Client'}
            </h1>
            <p className="text-muted-foreground mt-2">
              Découvrez les meilleurs magasins de votre région
            </p>
          </div>
          <Badge variant="default" className="bg-green-600">
            <User className="w-4 h-4 mr-1" />
            Client
          </Badge>
        </div>

        {/* Bouton découvrir les magasins */}
        <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200 mb-8">
          <CardContent className="p-8 text-center">
            <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingCart className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Prêt à faire vos courses ?</h2>
            <p className="text-muted-foreground mb-6">Découvrez tous les magasins disponibles dans votre région</p>
            <Button 
              size="lg"
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-lg font-semibold rounded-xl transition-all hover:scale-105 shadow-lg"
              onClick={() => setShowStores(true)}
            >
              Découvrir les Magasins
            </Button>
          </CardContent>
        </Card>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Panier</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{cartItems?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                Total: {cartTotal != null ? cartTotal.toFixed(2) : '0.00'}$
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Commandes</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{recentOrders?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Ce mois</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Points Fidélité</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loyaltyAccount?.points ?? 0}</div>
              <p className="text-xs text-muted-foreground">Points disponibles</p>
            </CardContent>
          </Card>
        </div>

        {/* Modal des magasins */}
        {showStores && (
          <div 
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-label="Choisir un magasin"
          >
            <div className="bg-background rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
              <div className="p-6 border-b flex items-center justify-between">
                <h2 className="text-2xl font-bold">Choisissez votre magasin</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowStores(false)}
                  className="text-2xl"
                >
                  ×
                </Button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                {loadingStores ? (
                  <div className="text-center py-4">Chargement des magasins...</div>
                ) : stores.length === 0 ? (
                  <div className="text-center py-4">Aucun magasin disponible</div>
                ) : (
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
                            <Badge variant={store.isOpen ? 'default' : 'destructive'}>
                              {store.isOpen ? 'Ouvert' : 'Fermé'}
                            </Badge>
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm">
                              <MapPin className="w-4 h-4 text-muted-foreground" />
                              <span>{store.address}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                <span>{store.rating}</span>
                              </div>
                              <span>{store.deliveryTime}</span>
                              <span>Livraison: {store.deliveryFee}$</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {store.categories.slice(0,3).map((cat, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">{cat}</Badge>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
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