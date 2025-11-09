import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ShoppingCart, 
  MapPin, 
  Clock, 
  DollarSign, 
  Truck, 
  Plus, 
  Minus, 
  Trash2,
  Route,
  Users,
  Package,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { deliveryPricingService, MultiMerchantDeliveryCalculation } from '@/services/DeliveryPricingService';
import { distanceCalculatorService } from '@/services/DistanceCalculatorService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

export interface MultiMerchantCartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  category?: string;
}

export interface MerchantOrder {
  merchantId: string;
  merchantName: string;
  merchantAddress: string;
  merchantImage?: string;
  items: MultiMerchantCartItem[];
  subtotal: number;
  taxes: number;
  total: number;
}

export interface MultiMerchantCartData {
  clientId: string;
  deliveryAddress: string;
  merchantOrders: MerchantOrder[];
  deliveryCalculation?: MultiMerchantDeliveryCalculation;
  totalOrderValue: number;
  totalDeliveryFee: number;
  grandTotal: number;
}

interface MultiMerchantCartProps {
  initialCart?: MultiMerchantCartData;
  onCartUpdate?: (cart: MultiMerchantCartData) => void;
  onCheckout?: (cart: MultiMerchantCartData) => void;
  className?: string;
}

export const MultiMerchantCart: React.FC<MultiMerchantCartProps> = ({
  initialCart,
  onCartUpdate,
  onCheckout,
  className
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [cart, setCart] = useState<MultiMerchantCartData>(
    initialCart || {
      clientId: user?.id || '',
      deliveryAddress: '',
      merchantOrders: [],
      totalOrderValue: 0,
      totalDeliveryFee: 0,
      grandTotal: 0,
      deliveryCalculation: undefined
    }
  );

  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Recalculer les totaux et la livraison quand le panier change
  useEffect(() => {
    // Éviter les recalculs inutiles
    if (cart.merchantOrders.length === 0 || !cart.deliveryAddress) {
      return;
    }
    
    // Vérifier si un recalcul est nécessaire
    const needsRecalculation = cart.merchantOrders.some(order => 
      order.items.some(item => item.quantity > 0)
    );
    
    if (needsRecalculation) {
      recalculateCart();
    }
  }, [cart.merchantOrders.length, cart.deliveryAddress]);

  const recalculateCart = useCallback(async () => {
    if (cart.merchantOrders.length === 0 || !cart.deliveryAddress) {
      setCart(prev => ({
        ...prev,
        totalOrderValue: 0,
        totalDeliveryFee: 0,
        grandTotal: 0,
        deliveryCalculation: undefined
      }));
      return;
    }

    setIsCalculating(true);
    setCalculationError(null);

    try {
      // Calculer les sous-totaux par marchand
      const updatedMerchantOrders = cart.merchantOrders.map(order => {
        const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const taxes = subtotal * 0.15; // 15% de taxes
        return {
          ...order,
          subtotal,
          taxes,
          total: subtotal + taxes
        };
      });

      // Calculer le total des commandes
      const totalOrderValue = updatedMerchantOrders.reduce((sum, order) => sum + order.total, 0);

      // Calculer les frais de livraison (simulation)
      const baseDeliveryFee = 3.99;
      const multiMerchantFee = cart.merchantOrders.length > 1 ? 2.00 : 0;
      const totalDeliveryFee = baseDeliveryFee + multiMerchantFee;

      // Calculer le grand total
      const grandTotal = totalOrderValue + totalDeliveryFee;

      // Simulation du calcul de livraison
      const deliveryCalculation = {
        optimizedRoute: cart.merchantOrders.map(order => ({
          merchantId: order.merchantId,
          merchantName: order.merchantName,
          address: order.merchantAddress,
          estimatedTime: '15-20 min'
        })),
        totalDistance: Math.random() * 10 + 5, // Simulation
        estimatedTotalTime: '25-45 min',
        calculation: {
          baseFee: baseDeliveryFee,
          multiMerchantFee,
          totalFee: totalDeliveryFee
        }
      };

      // Mise à jour conditionnelle pour éviter les boucles
      setCart(prev => {
        // Vérifier si les valeurs ont vraiment changé
        const hasChanged = 
          prev.totalOrderValue !== totalOrderValue ||
          prev.totalDeliveryFee !== totalDeliveryFee ||
          prev.grandTotal !== grandTotal ||
          JSON.stringify(prev.merchantOrders) !== JSON.stringify(updatedMerchantOrders);

        if (!hasChanged) {
          return prev; // Pas de changement, éviter le re-render
        }

        return {
          ...prev,
          merchantOrders: updatedMerchantOrders,
          totalOrderValue,
          totalDeliveryFee,
          grandTotal,
          deliveryCalculation
        };
      });

    } catch (error) {
      console.error('Erreur lors du recalcul:', error);
      setCalculationError('Erreur lors du calcul des totaux');
    } finally {
      setIsCalculating(false);
    }
  }, [cart.merchantOrders, cart.deliveryAddress]);

  const addItemToMerchant = (merchantId: string, item: MultiMerchantCartItem) => {
    setCart(prev => {
      const updatedOrders = prev.merchantOrders.map(order => {
        if (order.merchantId === merchantId) {
          const existingItem = order.items.find(i => i.id === item.id);
          if (existingItem) {
            return {
              ...order,
              items: order.items.map(i =>
                i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i
              )
            };
          } else {
            return {
              ...order,
              items: [...order.items, item]
            };
          }
        }
        return order;
      });

      return { ...prev, merchantOrders: updatedOrders };
    });
  };

  const updateItemQuantity = (merchantId: string, itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItemFromMerchant(merchantId, itemId);
      return;
    }

    setCart(prev => ({
      ...prev,
      merchantOrders: prev.merchantOrders.map(order => {
        if (order.merchantId === merchantId) {
          return {
            ...order,
            items: order.items.map(item =>
              item.id === itemId ? { ...item, quantity } : item
            )
          };
        }
        return order;
      })
    }));
  };

  const removeItemFromMerchant = (merchantId: string, itemId: string) => {
    setCart(prev => ({
      ...prev,
      merchantOrders: prev.merchantOrders.map(order => {
        if (order.merchantId === merchantId) {
          const updatedItems = order.items.filter(item => item.id !== itemId);
          return { ...order, items: updatedItems };
        }
        return order;
      })
    }));
  };

  const removeMerchant = (merchantId: string) => {
    setCart(prev => ({
      ...prev,
      merchantOrders: prev.merchantOrders.filter(order => order.merchantId !== merchantId)
    }));
  };

  const setDeliveryAddress = (address: string) => {
    setCart(prev => ({ ...prev, deliveryAddress: address }));
  };

  const getTotalItems = () => {
    return cart.merchantOrders.reduce((sum, order) => 
      sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
    );
  };

  const getMerchantCount = () => {
    return cart.merchantOrders.length;
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* En-tête du panier */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-6 h-6" />
            Panier Multi-Marchands
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-medium">{getTotalItems()} articles</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">{getMerchantCount()} marchands</p>
                <p className="text-xs text-muted-foreground">Différents</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">{formatCurrency(cart.totalOrderValue)}</p>
                <p className="text-xs text-muted-foreground">Sous-total</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium">{formatCurrency(cart.totalDeliveryFee)}</p>
                <p className="text-xs text-muted-foreground">Livraison</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Adresse de livraison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Adresse de livraison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Entrez votre adresse de livraison..."
              value={cart.deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-md"
            />
            <Button variant="outline" size="sm">
              <MapPin className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Contenu du panier */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="merchants">Par marchand</TabsTrigger>
          <TabsTrigger value="delivery">Livraison</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {cart.merchantOrders.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Panier vide</h3>
                <p className="text-muted-foreground">
                  Ajoutez des produits de différents marchands pour commencer
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {cart.merchantOrders.map((order) => (
                <Card key={order.merchantId}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {order.merchantImage && (
                          <img
                            src={order.merchantImage}
                            alt={order.merchantName}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        )}
                        <div>
                          <CardTitle className="text-lg">{order.merchantName}</CardTitle>
                          <p className="text-sm text-muted-foreground">{order.items.length} articles</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">{formatCurrency(order.total)}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMerchant(order.merchantId)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center gap-3">
                            {item.image && (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-8 h-8 rounded object-cover"
                              />
                            )}
                            <div>
                              <p className="font-medium">{item.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatCurrency(item.price)} × {item.quantity}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateItemQuantity(order.merchantId, item.id, item.quantity - 1)}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateItemQuantity(order.merchantId, item.id, item.quantity + 1)}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItemFromMerchant(order.merchantId, item.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="merchants" className="space-y-4">
          {cart.merchantOrders.map((order) => (
            <Card key={order.merchantId}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{order.merchantName}</span>
                  <Badge variant="outline">{order.items.length} articles</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-12 h-12 rounded object-cover"
                          />
                        )}
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">{item.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(item.price * item.quantity)}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(item.price)} × {item.quantity}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div className="border-t pt-3">
                    <div className="flex justify-between text-sm">
                      <span>Sous-total:</span>
                      <span>{formatCurrency(order.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Taxes:</span>
                      <span>{formatCurrency(order.taxes)}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>Total:</span>
                      <span>{formatCurrency(order.total)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="delivery" className="space-y-4">
          {isCalculating ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Calcul des frais de livraison...</p>
              </CardContent>
            </Card>
          ) : calculationError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{calculationError}</AlertDescription>
            </Alert>
          ) : cart.deliveryCalculation ? (
            <div className="space-y-4">
              {/* Itinéraire optimisé */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Route className="w-5 h-5" />
                    Itinéraire optimisé
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {cart.deliveryCalculation.optimizedRoute.map((address, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center">
                          {index + 1}
                        </div>
                        <span className="text-sm">{address}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Distance totale:</span>
                      <p className="font-medium">{cart.deliveryCalculation.totalDistance.toFixed(1)} km</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Temps estimé:</span>
                      <p className="font-medium">{cart.deliveryCalculation.totalDuration} min</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Détail des frais */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Détail des frais
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Frais de base:</span>
                      <span>{formatCurrency(cart.deliveryCalculation.breakdown.baseFee)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Frais de distance:</span>
                      <span>{formatCurrency(cart.deliveryCalculation.breakdown.distanceFee)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Zone éloignée:</span>
                      <span>{formatCurrency(cart.deliveryCalculation.breakdown.remoteFee)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Arrêts multiples:</span>
                      <span>{formatCurrency(cart.deliveryCalculation.breakdown.multiStopFee)}</span>
                    </div>
                    {cart.deliveryCalculation.breakdown.timeMultiplier > 1 && (
                      <div className="flex justify-between">
                        <span>Multiplicateur temporel:</span>
                        <span>{cart.deliveryCalculation.breakdown.timeMultiplier}x</span>
                      </div>
                    )}
                    <div className="border-t pt-2 flex justify-between font-bold">
                      <span>Total livraison:</span>
                      <span>{formatCurrency(cart.deliveryCalculation.totalFee)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Répartition par marchand */}
              <Card>
                <CardHeader>
                  <CardTitle>Répartition des frais</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {cart.deliveryCalculation.individualFees.map((fee) => (
                      <div key={fee.merchantId} className="flex justify-between">
                        <span>{fee.merchantName}:</span>
                        <span>{formatCurrency(fee.fee)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <MapPin className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Adresse requise</h3>
                <p className="text-muted-foreground">
                  Entrez votre adresse de livraison pour calculer les frais
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Résumé et actions */}
      {cart.merchantOrders.length > 0 && (
        <Card className="bg-primary/5 border-primary">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Résumé de la commande</h3>
                <p className="text-sm text-muted-foreground">
                  {getTotalItems()} articles • {getMerchantCount()} marchands
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{formatCurrency(cart.grandTotal)}</p>
                <p className="text-sm text-muted-foreground">
                  Total incluant livraison
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1">
                Continuer les achats
              </Button>
              <Button 
                onClick={() => onCheckout?.(cart)}
                disabled={!cart.deliveryAddress || isCalculating}
                className="flex-1"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Passer la commande
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
