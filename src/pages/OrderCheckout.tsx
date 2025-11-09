import { useState, useEffect } from 'react';
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
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, ShoppingCart, Lock } from 'lucide-react';
import DeliveryFeeCalculator from '@/components/DeliveryFeeCalculator';
import { useDeliveryFee, DeliveryFeeResponse } from '@/hooks/useDeliveryFee';
import LoyaltyCheckout from '@/components/checkout/LoyaltyCheckout';
import { useLoyalty } from '@/hooks/useLoyalty';
import { calculateReceipt, ReceiptBreakdown } from '@/utils/receiptCalculator';
import { ReceiptSummary } from '@/components/checkout/ReceiptSummary';
import { TipSelector } from '@/components/checkout/TipSelector';
import { StripeCheckout } from '@/components/payment/StripeCheckout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  const [tip, setTip] = useState<number>(0);
  const [receipt, setReceipt] = useState<ReceiptBreakdown | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'form' | 'payment'>('form');
  const { toast } = useToast();

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

  const handleTipChange = (newTip: number) => {
    setTip(newTip);
  };

  // Calculer le reçu quand les données changent
  useEffect(() => {
    if (cartItems.length > 0 && deliveryFeeCalculated) {
      const items = cartItems.map(item => ({
        name: item.product?.name || item.name || 'Produit',
        quantity: item.quantity,
        price: item.product?.price || item.price || 0
      }));

      // ✅ Calculer directement au lieu d'utiliser getCartTotal()
      const subtotal = items.reduce((total, item) => 
        total + (item.price * item.quantity), 0
      );
      const loyaltyDiscountAmount = loyaltyDiscount?.discount || 0;
      const adjustedSubtotal = subtotal - loyaltyDiscountAmount;

      const calculatedReceipt = calculateReceipt({
        items,
        deliveryFee,
        tip,
        location: formData.delivery_city
      });

      // Ajuster le reçu pour tenir compte de la réduction de fidélité
      if (loyaltyDiscountAmount > 0) {
        calculatedReceipt.subtotal = adjustedSubtotal;
        calculatedReceipt.taxes = adjustedSubtotal * 0.15;
        calculatedReceipt.totalProducts = adjustedSubtotal + calculatedReceipt.taxes;
        calculatedReceipt.grandTotal = calculatedReceipt.totalProducts + calculatedReceipt.totalFees;
        calculatedReceipt.merchantAmount = calculatedReceipt.totalProducts;
      }

      setReceipt(calculatedReceipt);
    }
  }, [cartItems, deliveryFee, tip, loyaltyDiscount, deliveryFeeCalculated, formData.delivery_city]);

  // Récupérer les informations du profil pour le paiement
  const [profile, setProfile] = useState<any>(null);
  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
        if (data) setProfile(data);
      }
    };
    fetchProfile();
  }, [user]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!deliveryFeeCalculated) {
      toast({
        title: "Frais de livraison requis",
        description: "Veuillez calculer les frais de livraison avant de continuer",
        variant: "destructive",
      });
      return;
    }

    if (!receipt) {
      toast({
        title: "Erreur",
        description: "Impossible de calculer le reçu",
        variant: "destructive",
      });
      return;
    }

    // Passer à l'étape de paiement
    setPaymentStep('payment');
  };

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    if (!receipt || !storeId) return;

    setLoading(true);
    
    try {
      const subtotal = getCartTotal();
      const loyaltyDiscountAmount = loyaltyDiscount?.discount || 0;
      const adjustedSubtotal = subtotal - loyaltyDiscountAmount;

      // Créer la commande avec le statut PAYÉE
      const orderItems = cartItems.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.product?.price || item.price || 0,
        total_price: (item.product?.price || item.price || 0) * item.quantity
      }));

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user!.id,
          store_id: storeId,
          items: JSON.stringify(cartItems),
          subtotal: adjustedSubtotal,
          tax_amount: receipt.taxes,
          delivery_fee: receipt.deliveryFee,
          tip: receipt.tip,
          total_amount: receipt.grandTotal,
          delivery_address: formData.delivery_address,
          delivery_city: formData.delivery_city,
          delivery_postal_code: formData.delivery_postal_code,
          phone: formData.phone,
          notes: formData.notes,
          delivery_instructions: formData.delivery_instructions,
          status: 'paid' as const,
          payment: {
            stripePaymentIntentId: paymentIntentId,
            status: 'succeeded',
            paidAt: new Date().toISOString()
          },
          breakdown: {
            merchantAmount: receipt.merchantAmount,
            driverAmount: receipt.driverAmount,
            adminAmount: receipt.adminCommission
          }
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Créer les order_items
      const orderItemsData = orderItems.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItemsData);

      if (itemsError) throw itemsError;

      // Mettre à jour la transaction avec l'order_id
      const { error: transactionError } = await supabase
        .from('transactions')
        .update({ 
          order_id: order.id,
          status: 'completed'
        })
        .eq('payment_intent_id', paymentIntentId);

      if (transactionError) {
        console.error('Error updating transaction:', transactionError);
      }

      // Ajouter les points de fidélité
      if (adjustedSubtotal > 0) {
        await addPoints(order.id, adjustedSubtotal, `Points gagnés pour commande ${order.order_number}`);
      }
      
      clearCart();
      toast({
        title: "Paiement réussi!",
        description: `Votre commande ${order.order_number} a été créée avec succès`,
      });
      navigate(`/order-success/${order.id}`);
    } catch (error: any) {
      console.error('Error creating order:', error);
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la création de la commande",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentError = (error: string) => {
    toast({
      title: "Erreur de paiement",
      description: error,
      variant: "destructive",
    });
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

            {paymentStep === 'form' ? (
              <form onSubmit={handleFormSubmit} className="space-y-6">
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
                        name="delivery_address"
                        placeholder="123 Rue Principale"
                        value={formData.delivery_address}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="delivery_city">Ville *</Label>
                        <Input
                          id="delivery_city"
                          name="delivery_city"
                          value={formData.delivery_city}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="delivery_postal_code">Code postal</Label>
                        <Input
                          id="delivery_postal_code"
                          name="delivery_postal_code"
                          placeholder="J6S 1A1"
                          value={formData.delivery_postal_code}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="phone">Téléphone *</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="(450) 123-4567"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="delivery_instructions">Instructions de livraison</Label>
                      <Textarea
                        id="delivery_instructions"
                        name="delivery_instructions"
                        placeholder="Ex: Sonner à la porte arrière, laisser au bureau..."
                        value={formData.delivery_instructions}
                        onChange={handleInputChange}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Calculateur de frais de livraison */}
                {formData.delivery_address && (
                  <DeliveryFeeCalculator
                    storeId={storeId!}
                    storeName={storeName}
                    storeAddress="Adresse du magasin"
                    onFeeCalculated={handleDeliveryFeeCalculated}
                  />
                )}

                {/* Sélecteur de pourboire */}
                {deliveryFeeCalculated && receipt && (
                  <TipSelector
                    subtotal={receipt.subtotal}
                    onTipChange={handleTipChange}
                    currentTip={tip}
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
                      name="notes"
                      placeholder="Instructions spéciales pour votre commande..."
                      value={formData.notes}
                      onChange={handleInputChange}
                    />
                  </CardContent>
                </Card>

                <Button 
                  type="submit" 
                  disabled={loading || !deliveryFeeCalculated || !receipt}
                  className="w-full"
                  size="lg"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  {loading ? 'Traitement...' : 'Continuer vers le paiement'}
                </Button>
              </form>
            ) : (
              <div className="space-y-6">
                <Button 
                  variant="outline"
                  onClick={() => setPaymentStep('form')}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Retour aux informations
                </Button>

                {receipt && storeId && profile && (
                  <StripeCheckout
                    amount={receipt.grandTotal}
                    receipt={{
                      items: receipt.items,
                      merchantAmount: receipt.merchantAmount,
                      driverAmount: receipt.driverAmount,
                      adminAmount: receipt.adminCommission
                    }}
                    merchantId={storeId}
                    customerEmail={profile.email || user?.email || ''}
                    customerName={`${profile.first_name || ''} ${profile.last_name || ''}`.trim() || undefined}
                    deliveryAddress={formData.delivery_address}
                    onPaymentSuccess={handlePaymentSuccess}
                    onPaymentError={handlePaymentError}
                  />
                )}
              </div>
            )}
          </div>

          {/* Résumé de la commande */}
          <div className="space-y-6">
            {receipt ? (
              <ReceiptSummary receipt={receipt} />
            ) : (
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
                            {item.quantity} × {(item.product?.price || item.price || 0).toFixed(2)}$
                          </div>
                        </div>
                        <div className="font-medium">
                          {(item.quantity * (item.product?.price || item.price || 0)).toFixed(2)}$
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
                      <span>Total estimé</span>
                      <span>
                        {(getCartTotal() + deliveryFee - (loyaltyDiscount?.discount || 0)).toFixed(2)}$
                      </span>
                    </div>
                  </div>

                  {!deliveryFeeCalculated && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        ⚠️ Veuillez calculer les frais de livraison avant de continuer.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      <AppFooter />
    </div>
  );
};

export default OrderCheckout;
