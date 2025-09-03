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

const OrderCheckout = () => {
  const [searchParams] = useSearchParams();
  const storeId = searchParams.get('store_id');
  const storeName = searchParams.get('store_name') || 'Magasin';
  
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cartItems, getCartTotal, clearCart } = useCart(storeId || '');
  const { createOrder } = useOrders();

  const [formData, setFormData] = useState({
    delivery_address: '',
    delivery_city: 'Valleyfield',
    delivery_postal_code: '',
    phone: '',
    notes: '',
    delivery_instructions: ''
  });

  const [loading, setLoading] = useState(false);

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

  const subtotal = getCartTotal();
  const taxAmount = subtotal * 0.15;
  const deliveryFee = 5.99;
  const total = subtotal + taxAmount + deliveryFee;

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.delivery_address || !formData.phone) {
      return;
    }

    setLoading(true);

    try {
      const orderItems = cartItems.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.product?.price || 0,
        total_price: (item.product?.price || 0) * item.quantity
      }));

      const { data, error } = await createOrder({
        store_id: storeId,
        items: orderItems,
        ...formData
      });

      if (error) {
        throw new Error(error);
      }

      // Clear cart after successful order
      await clearCart();

      // Redirect to success page
      navigate(`/order-success/${data.id}`);
    } catch (error) {
      console.error('Order submission failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/stores')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux magasins
          </Button>
          
          <h1 className="text-3xl font-bold">Finaliser la commande</h1>
          <p className="text-muted-foreground">Commande chez {storeName}</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Order Form */}
          <Card>
            <CardHeader>
              <CardTitle>Informations de livraison</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitOrder} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="delivery_address">Adresse de livraison *</Label>
                  <Input
                    id="delivery_address"
                    name="delivery_address"
                    value={formData.delivery_address}
                    onChange={handleInputChange}
                    placeholder="123 Rue Principale"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="delivery_city">Ville</Label>
                    <Input
                      id="delivery_city"
                      name="delivery_city"
                      value={formData.delivery_city}
                      onChange={handleInputChange}
                      readOnly
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="delivery_postal_code">Code postal</Label>
                    <Input
                      id="delivery_postal_code"
                      name="delivery_postal_code"
                      value={formData.delivery_postal_code}
                      onChange={handleInputChange}
                      placeholder="J6T 1A1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone *</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="450-123-4567"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="delivery_instructions">Instructions de livraison</Label>
                  <Textarea
                    id="delivery_instructions"
                    name="delivery_instructions"
                    value={formData.delivery_instructions}
                    onChange={handleInputChange}
                    placeholder="Appartement 2, sonner à la porte..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes pour le marchand</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Préférences pour les produits frais..."
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  size="lg"
                  disabled={loading}
                >
                  {loading ? 'Traitement...' : `Passer la commande - ${total.toFixed(2)}$`}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Résumé de la commande</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Cart Items */}
              {cartItems.map((item) => (
                <div key={item.id} className="flex justify-between items-center border-b pb-2">
                  <div>
                    <p className="font-medium">{item.product?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.quantity} × {item.product?.price?.toFixed(2)}$ / {item.product?.unit}
                    </p>
                  </div>
                  <p className="font-semibold">
                    {((item.product?.price || 0) * item.quantity).toFixed(2)}$
                  </p>
                </div>
              ))}

              {/* Totals */}
              <div className="space-y-2 pt-4 border-t">
                <div className="flex justify-between">
                  <span>Sous-total</span>
                  <span>{subtotal.toFixed(2)}$</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxes (15%)</span>
                  <span>{taxAmount.toFixed(2)}$</span>
                </div>
                <div className="flex justify-between">
                  <span>Frais de livraison</span>
                  <span>{deliveryFee.toFixed(2)}$</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total</span>
                  <span>{total.toFixed(2)}$</span>
                </div>
              </div>

              {/* Delivery Info */}
              <div className="bg-accent/10 p-4 rounded-lg">
                <p className="text-sm font-medium mb-1">Temps de livraison estimé</p>
                <p className="text-sm text-muted-foreground">25-45 minutes après confirmation</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <AppFooter />
    </div>
  );
};

export default OrderCheckout;