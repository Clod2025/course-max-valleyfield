import { useState, useEffect } from 'react';
import { Header } from '@/components/header';
import { AppFooter } from '@/components/AppFooter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ShoppingCart, 
  Heart, 
  Clock, 
  Package, 
  MapPin, 
  Star,
  Plus,
  RotateCcw
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useOrders } from '@/hooks/useOrders';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const ClientDashboard = () => {
  const { user, profile } = useAuth();
  const { orders, loading: ordersLoading } = useOrders();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Mock data for favorites and recent orders (we'll implement proper hooks later)
  const [favorites] = useState([
    {
      id: '1',
      name: 'Bananes',
      price: 2.99,
      unit: 'lb',
      store: 'IGA Valleyfield',
      image: '/api/placeholder/60/60'
    },
    {
      id: '2',
      name: 'Pain tranché',
      price: 3.49,
      unit: 'unité',
      store: 'Metro Plus',
      image: '/api/placeholder/60/60'
    }
  ]);

  const [recentOrders] = useState([
    {
      id: '1',
      order_number: 'CM20250103-001',
      total: 45.67,
      store: 'IGA Valleyfield',
      date: '2025-01-03',
      items: 5
    },
    {
      id: '2',
      order_number: 'CM20250102-003',
      total: 32.15,
      store: 'Pharmaprix',
      date: '2025-01-02',
      items: 3
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'confirmed': return 'bg-blue-500';
      case 'preparing': return 'bg-orange-500';
      case 'ready_for_pickup': return 'bg-purple-500';
      case 'in_delivery': return 'bg-indigo-500';
      case 'delivered': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'confirmed': return 'Confirmée';
      case 'preparing': return 'En préparation';
      case 'ready_for_pickup': return 'Prête pour ramassage';
      case 'in_delivery': return 'En livraison';
      case 'delivered': return 'Livrée';
      case 'cancelled': return 'Annulée';
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Bonjour {profile?.first_name || 'Client'} !
          </h1>
          <p className="text-muted-foreground">
            Gérez vos commandes et découvrez de nouveaux produits à Valleyfield
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/stores')}>
            <CardContent className="p-6 text-center">
              <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-2">Nouvelle commande</h3>
              <p className="text-sm text-muted-foreground">
                Commandez chez vos magasins préférés
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <Heart className="w-12 h-12 mx-auto mb-4 text-red-500" />
              <h3 className="font-semibold mb-2">Mes favoris</h3>
              <p className="text-sm text-muted-foreground">
                {favorites.length} produits sauvegardés
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <Clock className="w-12 h-12 mx-auto mb-4 text-blue-500" />
              <h3 className="font-semibold mb-2">Commandes récentes</h3>
              <p className="text-sm text-muted-foreground">
                {recentOrders.length} commandes récentes
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Dashboard Content */}
        <Tabs defaultValue="orders" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="orders">
              <Package className="w-4 h-4 mr-2" />
              Mes commandes
            </TabsTrigger>
            <TabsTrigger value="favorites">
              <Heart className="w-4 h-4 mr-2" />
              Favoris
            </TabsTrigger>
            <TabsTrigger value="recent">
              <Clock className="w-4 h-4 mr-2" />
              Récents
            </TabsTrigger>
          </TabsList>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Mes commandes</h2>
              <Button onClick={() => navigate('/stores')}>
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle commande
              </Button>
            </div>

            {ordersLoading ? (
              <div className="grid gap-4">
                {[1, 2, 3].map(i => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : orders.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">Aucune commande</h3>
                  <p className="text-muted-foreground mb-4">
                    Vous n'avez pas encore passé de commande
                  </p>
                  <Button onClick={() => navigate('/stores')}>
                    Commander maintenant
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {orders.map((order) => (
                  <Card key={order.id}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-semibold text-lg">
                            Commande #{order.order_number}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {order.store?.name} • {new Date(order.created_at).toLocaleDateString('fr-CA')}
                          </p>
                        </div>
                        <Badge className={`${getStatusColor(order.status)} text-white`}>
                          {getStatusText(order.status)}
                        </Badge>
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1 text-muted-foreground" />
                            <span className="text-sm">{order.delivery_address}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-lg">
                            {order.total_amount.toFixed(2)}$
                          </p>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigate(`/order-details/${order.id}`)}
                          >
                            Voir détails
                          </Button>
                        </div>
                      </div>

                      {order.status === 'in_delivery' && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-700">
                            🚚 Votre commande est en route ! Temps estimé: 15-25 min
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Favorites Tab */}
          <TabsContent value="favorites" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Mes favoris</h2>
              <Button variant="outline" onClick={() => navigate('/stores')}>
                Parcourir les produits
              </Button>
            </div>

            {favorites.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Heart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">Aucun favori</h3>
                  <p className="text-muted-foreground mb-4">
                    Ajoutez des produits à vos favoris pour les retrouver facilement
                  </p>
                  <Button onClick={() => navigate('/stores')}>
                    Découvrir des produits
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {favorites.map((product) => (
                  <Card key={product.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <h4 className="font-semibold">{product.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {product.store}
                          </p>
                          <p className="font-semibold text-primary">
                            {product.price.toFixed(2)}$ / {product.unit}
                          </p>
                        </div>
                        <Button size="sm" onClick={() => navigate('/stores')}>
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Recent Tab */}
          <TabsContent value="recent" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Commandes récentes</h2>
              <Button variant="outline">
                Voir tout l'historique
              </Button>
            </div>

            {recentOrders.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Clock className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">Aucun historique</h3>
                  <p className="text-muted-foreground">
                    Vos commandes récentes apparaîtront ici
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {recentOrders.map((order) => (
                  <Card key={order.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-semibold">{order.order_number}</h4>
                          <p className="text-sm text-muted-foreground">
                            {order.store} • {order.items} articles • {order.date}
                          </p>
                        </div>
                        <div className="text-right space-x-2">
                          <span className="font-semibold">
                            {order.total.toFixed(2)}$
                          </span>
                          <Button size="sm" variant="outline">
                            <RotateCcw className="w-4 h-4 mr-1" />
                            Recommander
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <AppFooter />
    </div>
  );
};

export default ClientDashboard;