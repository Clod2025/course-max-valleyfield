import React, { useState } from 'react';
import { ClientHeader } from '@/components/client/ClientHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { AddressAutocomplete } from '@/components/ui/AddressAutocomplete';
import { 
  CreditCard, 
  MapPin, 
  Package, 
  DollarSign,
  Gift,
  Lock,
  Truck,
  Star,
  AlertCircle
} from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';

const PaymentPage = () => {
  const { items: cartItems, total: cartTotal, clearCart } = useCart();
  const { profile } = useAuth();
  
  // États pour le formulaire de paiement
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [saveCard, setSaveCard] = useState(false);
  
  // États pour l'adresse de livraison
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  
  // États pour les pourboires
  const [tipAmount, setTipAmount] = useState(0);
  const [customTip, setCustomTip] = useState('');
  const [selectedTipPercentage, setSelectedTipPercentage] = useState<number | null>(null);
  
  // Calculs
  const subtotal = cartTotal || 0;
  const deliveryFee = 5.99;
  const taxes = subtotal * 0.15; // 15% de taxes
  const finalTip = selectedTipPercentage ? (subtotal * selectedTipPercentage / 100) : (customTip ? parseFloat(customTip) : tipAmount);
  const totalAmount = subtotal + deliveryFee + taxes + finalTip;

  const tipPercentages = [10, 15, 20, 25];

  const handleTipPercentageSelect = (percentage: number) => {
    setSelectedTipPercentage(percentage);
    setTipAmount(subtotal * percentage / 100);
    setCustomTip('');
  };

  const handleCustomTipChange = (value: string) => {
    setCustomTip(value);
    setSelectedTipPercentage(null);
    setTipAmount(parseFloat(value) || 0);
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardNumber(formatCardNumber(e.target.value));
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length >= 2) {
      value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    setExpiryDate(value);
  };

  const handlePayment = async () => {
    // Logique de paiement
    console.log('Processing payment:', {
      cardNumber: cardNumber.replace(/\s/g, ''),
      expiryDate,
      cvv,
      cardName,
      saveCard,
      deliveryAddress,
      deliveryInstructions,
      tipAmount: finalTip,
      totalAmount,
      items: cartItems
    });

    // Simuler le traitement du paiement
    alert('Paiement traité avec succès ! Votre commande est en préparation.');
    clearCart();
  };

  return (
    <div className="min-h-screen bg-background">
      <ClientHeader />
      
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
            <CreditCard className="w-8 h-8 text-green-600" />
            Finaliser votre commande
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Formulaire de paiement */}
            <div className="lg:col-span-2 space-y-6">
              {/* Adresse de livraison */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Adresse de livraison
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="delivery-address">Adresse complète *</Label>
                    <AddressAutocomplete
                      value={deliveryAddress}
                      onChange={setDeliveryAddress}
                      placeholder="123 Rue Principale, Valleyfield, QC J6T 1A1"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="delivery-instructions">Instructions de livraison (optionnel)</Label>
                    <Input
                      id="delivery-instructions"
                      value={deliveryInstructions}
                      onChange={(e) => setDeliveryInstructions(e.target.value)}
                      placeholder="Ex: Sonner à la porte, laisser devant la porte..."
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Pourboire */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gift className="w-5 h-5" />
                    Pourboire pour votre livreur
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Montrez votre appréciation à votre livreur. Le pourboire sera transféré automatiquement.
                  </p>
                  
                  {/* Pourcentages prédéfinis */}
                  <div className="grid grid-cols-4 gap-3">
                    {tipPercentages.map((percentage) => (
                      <Button
                        key={percentage}
                        variant={selectedTipPercentage === percentage ? 'default' : 'outline'}
                        onClick={() => handleTipPercentageSelect(percentage)}
                        className="h-12"
                      >
                        {percentage}%
                        <br />
                        <span className="text-xs">
                          {(subtotal * percentage / 100).toFixed(2)}$
                        </span>
                      </Button>
                    ))}
                  </div>

                  {/* Pourboire personnalisé */}
                  <div>
                    <Label htmlFor="custom-tip">Montant personnalisé</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="custom-tip"
                        type="number"
                        step="0.25"
                        min="0"
                        value={customTip}
                        onChange={(e) => handleCustomTipChange(e.target.value)}
                        placeholder="0.00"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {finalTip > 0 && (
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2 text-green-800">
                        <Star className="w-4 h-4" />
                        <span className="font-medium">
                          Merci ! Pourboire de {finalTip.toFixed(2)}$ ajouté
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Informations de paiement */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Informations de paiement
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                    <Lock className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-blue-800">
                      Vos informations de paiement sont sécurisées et cryptées
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="card-number">Numéro de carte *</Label>
                      <Input
                        id="card-number"
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="expiry">Date d'expiration *</Label>
                      <Input
                        id="expiry"
                        value={expiryDate}
                        onChange={handleExpiryChange}
                        placeholder="MM/AA"
                        maxLength={5}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="cvv">CVV *</Label>
                      <Input
                        id="cvv"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').substring(0, 4))}
                        placeholder="123"
                        maxLength={4}
                        required
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <Label htmlFor="card-name">Nom sur la carte *</Label>
                      <Input
                        id="card-name"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        placeholder="Jean Dupuis"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="save-card"
                      checked={saveCard}
                      onCheckedChange={(checked) => setSaveCard(checked as boolean)}
                    />
                    <Label htmlFor="save-card" className="text-sm">
                      Sauvegarder cette carte pour mes prochains achats
                    </Label>
                  </div>

                  {!saveCard && (
                    <div className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                      <p className="text-sm text-yellow-800">
                        Vos informations de carte ne seront pas sauvegardées et devront être saisies à nouveau pour votre prochaine commande.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Résumé de la commande */}
            <div className="space-y-6">
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Résumé de la commande
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Articles */}
                  <div className="space-y-3">
                    {cartItems?.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{item.name}</p>
                          <p className="text-xs text-muted-foreground">Qté: {item.quantity}</p>
                        </div>
                        <p className="font-medium">{(item.price * item.quantity).toFixed(2)}$</p>
                      </div>
                    ))}
                  </div>

                  <hr />

                  {/* Calculs */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Sous-total</span>
                      <span>{subtotal.toFixed(2)}$</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="flex items-center gap-1">
                        <Truck className="w-4 h-4" />
                        Livraison
                      </span>
                      <span>{deliveryFee.toFixed(2)}$</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span>Taxes (15%)</span>
                      <span>{taxes.toFixed(2)}$</span>
                    </div>
                    
                    {finalTip > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span className="flex items-center gap-1">
                          <Gift className="w-4 h-4" />
                          Pourboire
                        </span>
                        <span>{finalTip.toFixed(2)}$</span>
                      </div>
                    )}
                  </div>

                  <hr />

                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>{totalAmount.toFixed(2)}$</span>
                  </div>

                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700 text-lg py-3"
                    onClick={handlePayment}
                    disabled={!deliveryAddress || !cardNumber || !expiryDate || !cvv || !cardName}
                  >
                    <CreditCard className="w-5 h-5 mr-2" />
                    Payer {totalAmount.toFixed(2)}$
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    En passant commande, vous acceptez nos conditions d'utilisation
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
