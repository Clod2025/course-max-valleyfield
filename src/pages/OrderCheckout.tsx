import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Header } from '@/components/header';
import { AppFooter } from '@/components/AppFooter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCart } from '@/hooks/useCart';
import { useOrders } from '@/hooks/useOrders';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, ShoppingCart } from 'lucide-react';
import DeliveryFeeCalculator from '@/components/DeliveryFeeCalculator';
import { useDeliveryFee, DeliveryFeeResponse } from '@/hooks/useDeliveryFee';
import LoyaltyCheckout from '@/components/checkout/LoyaltyCheckout';
import { useLoyalty } from '@/hooks/useLoyalty';

const OrderCheckout = () => {
  const [searchParams] = useSearchParams();
  const storeId = searchParams.get('store_id');
  const storeName = searchParams.get('store_name') || 'Magasin';
  
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cartItems, getCartTotal, clearCart } = useCart(storeId || '');
  const { createOrder } = useOrders();
  const { calculateDeliveryFee } = useDeliveryFee();
  const { addPoints } = useLoyalty();

  const [formData, setFormData] = useState({
    delivery_address: '',
    delivery_city: 'Valleyfield',
    delivery_postal_code: '',
    phone: '',
    notes: '',
    delivery_instructions: ''
  });

  const [loading, setLoading] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [deliveryCalculation, setDeliveryCalculation] = useState<DeliveryFeeResponse | null>(null);
  const [deliveryFeeCalculated, setDeliveryFeeCalculated] = useState(false);
  const [loyaltyDiscount, setLoyaltyDiscount] = useState<{
    points: number;
    discount: number;
  } | null>(null);

  if (!user) {
    navigate('/login');
    return null;
  }

  if (!storeId || cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-bold mb-2">Panier vide</h2>
              <p className="text-muted-foreground mb-4">
                Vous devez ajouter des produits à votre panier avant de passer commande.
              </p>
              <Button onClick={() => navigate('/stores')}>
                Retour aux magasins
              </Button>
            </CardContent>
          </Card>
        </div>
        <AppFooter />
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDeliveryFeeCalculated = (fee: number, calculation: DeliveryFeeResponse) => {
    setDeliveryFee(fee);
    setDeliveryCalculation(calculation);
    setDeliveryFeeCalculated(true);
  };

  const handleLoyaltyDiscount = (points: number, discount: number) => {
    setLoyaltyDiscount({ points, discount });
  };

  const handleRemoveLoyaltyDiscount = () => {
    setLoyaltyDiscount(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!deliveryFeeCalculated) {
      alert('Veuillez calculer les frais de livraison avant de continuer');
      return;
    }

    setLoading(true);
    
    try {
      const subtotal = getCartTotal();
      const loyaltyDiscountAmount = loyaltyDiscount?.discount || 0;
      const finalTotal = subtotal + deliveryFee - loyaltyDiscountAmount;

      const orderData = {
        store_id: storeId!,
        delivery_address: formData.delivery_address,
        delivery_city: formData.delivery_city,
        delivery_postal_code: formData.delivery_postal_code,
        phone: formData.phone,
        notes: formData.notes,
        delivery_instructions: formData.delivery_instructions,
        items: cartItems,
        subtotal: subtotal,
        delivery_fee: deliveryFee,
        loyalty_discount: loyaltyDiscountAmount,
        loyalty_points_used: loyaltyDiscount?.points || 0,
        total_amount: finalTotal
      };

      const order = await createOrder(orderData);
      
      if (order) {
        // Ajouter les points de fidélité après la commande
        if (subtotal > 0) {
          await addPoints(order.id, subtotal, `Points gagnés pour commande ${order.id}`);
        }
        
        clearCart();
        navigate(`/order-success/${order.id}`);
      }
    } catch (error) {
      console.error('Error creating order:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Formulaire de commande */}
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                onClick={() => navigate(-1)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour
              </Button>
              <h1 className="text-2xl font-bold">Finaliser la commande</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Informations de livraison */}
              <Card>
                <CardHeader>
                  <CardTitle>Adresse de livraison</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="delivery_address">Adresse *</Label>
                    <Input
                      id="delivery_address"
                      placeholder="123 Rue Principale"
                      value={formData.delivery_address}
                      onChange={(e) => setFormData({...formData, delivery_address: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="delivery_city">Ville *</Label>
                      <Input
                        id="delivery_city"
                        value={formData.delivery_city}
                        onChange={(e) => setFormData({...formData, delivery_city: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="delivery_postal_code">Code postal</Label>
                      <Input
                        id="delivery_postal_code"
                        placeholder="J6S 1A1"
                        value={formData.delivery_postal_code}
                        onChange={(e) => setFormData({...formData, delivery_postal_code: e.target.value})}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="phone">Téléphone *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="(450) 123-4567"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="delivery_instructions">Instructions de livraison</Label>
                    <Textarea
                      id="delivery_instructions"
                      placeholder="Ex: Sonner à la porte arrière, laisser au bureau..."
                      value={formData.delivery_instructions}
                      onChange={(e) => setFormData({...formData, delivery_instructions: e.target.value})}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Calculateur de frais de livraison */}
              {formData.delivery_address && (
                <DeliveryFeeCalculator
                  storeId={storeId!}
                  storeName={storeName}
                  storeAddress="Adresse du magasin" // Vous pouvez récupérer cette info depuis la base
                  onFeeCalculated={handleDeliveryFeeCalculated}
                />
              )}

              {/* Système de fidélité */}
              <LoyaltyCheckout
                orderTotal={getCartTotal()}
                onLoyaltyDiscount={handleLoyaltyDiscount}
                onRemoveLoyaltyDiscount={handleRemoveLoyaltyDiscount}
              />

              {/* Notes de commande */}
              <Card>
                <CardHeader>
                  <CardTitle>Notes de commande</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Instructions spéciales pour votre commande..."
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  />
                </CardContent>
              </Card>

              <Button 
                type="submit" 
                disabled={loading || !deliveryFeeCalculated}
                className="w-full"
                size="lg"
              >
                {loading ? 'Création de la commande...' : 'Confirmer la commande'}
              </Button>
            </form>
          </div>

          {/* Résumé de la commande */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Résumé de la commande</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Articles du panier */}
                <div className="space-y-2">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.quantity} × {item.price.toFixed(2)}$
                        </div>
                      </div>
                      <div className="font-medium">
                        {(item.quantity * item.price).toFixed(2)}$
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Sous-total</span>
                    <span>{getCartTotal().toFixed(2)}$</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Frais de livraison</span>
                    <span>
                      {deliveryFeeCalculated ? `${deliveryFee.toFixed(2)}$` : 'À calculer'}
                    </span>
                  </div>
                  
                  {deliveryCalculation && (
                    <div className="text-xs text-muted-foreground">
                      {deliveryCalculation.calculation.distance_km} km - {deliveryCalculation.calculation.pricing_tier}
                    </div>
                  )}

                  {/* Réduction de fidélité */}
                  {loyaltyDiscount && (
                    <div className="flex justify-between text-green-600">
                      <span>Réduction fidélité ({loyaltyDiscount.points} points)</span>
                      <span>-{loyaltyDiscount.discount.toFixed(2)}$</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total</span>
                    <span>
                      {(getCartTotal() + deliveryFee - (loyaltyDiscount?.discount || 0)).toFixed(2)}$
                    </span>
                  </div>
                </div>

                {!deliveryFeeCalculated && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      ⚠️ Veuillez calculer les frais de livraison avant de confirmer la commande.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <AppFooter />
    </div>
  );
};

export default OrderCheckout;