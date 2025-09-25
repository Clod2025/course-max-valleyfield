import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CreditCard, 
  Lock, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CardPaymentData {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardName: string;
  saveCard: boolean;
}

export interface CardPaymentProps {
  amount: number;
  merchantInfo: {
    id: string;
    name: string;
  };
  onPaymentSuccess: (paymentData: any) => void;
  onPaymentError: (error: string) => void;
  onBack: () => void;
  className?: string;
}

export const CardPayment: React.FC<CardPaymentProps> = ({
  amount,
  merchantInfo,
  onPaymentSuccess,
  onPaymentError,
  onBack,
  className
}) => {
  const [formData, setFormData] = useState<CardPaymentData>({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardName: '',
    saveCard: false
  });
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCvv, setShowCvv] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isValid, setIsValid] = useState(false);
  
  const cardNumberRef = useRef<HTMLInputElement>(null);
  const expiryRef = useRef<HTMLInputElement>(null);
  const cvvRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  // Validation en temps réel
  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'cardNumber':
        const cleanNumber = value.replace(/\s/g, '');
        if (!/^\d{13,19}$/.test(cleanNumber)) {
          return 'Numéro de carte invalide (13-19 chiffres)';
        }
        return '';
      
      case 'expiryDate':
        if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(value)) {
          return 'Format MM/AA requis';
        }
        const [month, year] = value.split('/');
        const currentYear = new Date().getFullYear() % 100;
        const currentMonth = new Date().getMonth() + 1;
        
        if (parseInt(year) < currentYear || 
            (parseInt(year) === currentYear && parseInt(month) < currentMonth)) {
          return 'Carte expirée';
        }
        return '';
      
      case 'cvv':
        if (!/^\d{3,4}$/.test(value)) {
          return 'CVV invalide (3-4 chiffres)';
        }
        return '';
      
      case 'cardName':
        if (value.trim().length < 2) {
          return 'Nom requis (minimum 2 caractères)';
        }
        return '';
      
      default:
        return '';
    }
  };

  const handleInputChange = (name: keyof CardPaymentData, value: string) => {
    let processedValue = value;
    
    // Formatage automatique
    if (name === 'cardNumber') {
      processedValue = value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ');
    } else if (name === 'expiryDate') {
      processedValue = value.replace(/\D/g, '').replace(/(\d{2})(?=\d)/g, '$1/');
    } else if (name === 'cvv') {
      processedValue = value.replace(/\D/g, '');
    }
    
    setFormData(prev => ({ ...prev, [name]: processedValue }));
    
    // Validation en temps réel
    const error = validateField(name, processedValue);
    setErrors(prev => ({ ...prev, [name]: error }));
    
    // Vérifier si le formulaire est valide
    const allFieldsValid = Object.entries({ ...formData, [name]: processedValue })
      .every(([key, val]) => {
        if (key === 'saveCard') return true;
        return validateField(key, val as string) === '';
      });
    
    setIsValid(allFieldsValid);
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
    }
    return v;
  };

  const getCardType = (cardNumber: string) => {
    const number = cardNumber.replace(/\s/g, '');
    if (/^4/.test(number)) return 'Visa';
    if (/^5[1-5]/.test(number)) return 'Mastercard';
    if (/^3[47]/.test(number)) return 'American Express';
    if (/^6/.test(number)) return 'Discover';
    return 'Carte';
  };

  const handlePayment = async () => {
    if (!isValid) {
      onPaymentError('Veuillez corriger les erreurs avant de continuer');
      return;
    }

    setIsProcessing(true);
    
    try {
      // Simulation du traitement de paiement
      // Dans un vrai projet, ceci appellerait l'API de paiement
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simuler un succès ou échec aléatoire pour les tests
      const success = Math.random() > 0.1; // 90% de succès
      
      if (success) {
        const paymentData = {
          method: 'card',
          amount,
          transactionId: `txn_${Date.now()}`,
          cardLast4: formData.cardNumber.slice(-4),
          cardType: getCardType(formData.cardNumber),
          processedAt: new Date().toISOString()
        };
        
        onPaymentSuccess(paymentData);
      } else {
        throw new Error('Transaction refusée par la banque');
      }
    } catch (error) {
      onPaymentError(error instanceof Error ? error.message : 'Erreur de paiement');
    } finally {
      setIsProcessing(false);
    }
  };

  const hasErrors = Object.values(errors).some(error => error !== '');

  return (
    <div className={cn("space-y-6", className)}>
      {/* En-tête */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Paiement par carte
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Paiement sécurisé pour {merchantInfo.name}
              </p>
              <p className="text-2xl font-bold text-primary">
                {amount.toFixed(2)}$
              </p>
            </div>
            <div className="flex items-center gap-2 text-green-600">
              <Shield className="w-4 h-4" />
              <span className="text-sm font-medium">Sécurisé</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulaire de paiement */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informations de carte</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Numéro de carte */}
          <div>
            <Label htmlFor="cardNumber">Numéro de carte *</Label>
            <div className="relative">
              <Input
                ref={cardNumberRef}
                id="cardNumber"
                type="text"
                placeholder="1234 5678 9012 3456"
                value={formData.cardNumber}
                onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                maxLength={19}
                className={cn(
                  "pr-10",
                  errors.cardNumber && "border-red-500"
                )}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {formData.cardNumber && (
                  <span className="text-xs text-muted-foreground">
                    {getCardType(formData.cardNumber)}
                  </span>
                )}
              </div>
            </div>
            {errors.cardNumber && (
              <p className="text-sm text-red-500 mt-1">{errors.cardNumber}</p>
            )}
          </div>

          {/* Nom sur la carte */}
          <div>
            <Label htmlFor="cardName">Nom sur la carte *</Label>
            <Input
              ref={nameRef}
              id="cardName"
              type="text"
              placeholder="Jean Dupuis"
              value={formData.cardName}
              onChange={(e) => handleInputChange('cardName', e.target.value)}
              className={cn(
                errors.cardName && "border-red-500"
              )}
            />
            {errors.cardName && (
              <p className="text-sm text-red-500 mt-1">{errors.cardName}</p>
            )}
          </div>

          {/* Date d'expiration et CVV */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="expiryDate">Date d'expiration *</Label>
              <Input
                ref={expiryRef}
                id="expiryDate"
                type="text"
                placeholder="MM/AA"
                value={formData.expiryDate}
                onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                maxLength={5}
                className={cn(
                  errors.expiryDate && "border-red-500"
                )}
              />
              {errors.expiryDate && (
                <p className="text-sm text-red-500 mt-1">{errors.expiryDate}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="cvv">CVV *</Label>
              <div className="relative">
                <Input
                  ref={cvvRef}
                  id="cvv"
                  type={showCvv ? "text" : "password"}
                  placeholder="123"
                  value={formData.cvv}
                  onChange={(e) => handleInputChange('cvv', e.target.value)}
                  maxLength={4}
                  className={cn(
                    "pr-10",
                    errors.cvv && "border-red-500"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowCvv(!showCvv)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  {showCvv ? (
                    <EyeOff className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <Eye className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
              </div>
              {errors.cvv && (
                <p className="text-sm text-red-500 mt-1">{errors.cvv}</p>
              )}
            </div>
          </div>

          {/* Sauvegarder la carte */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="saveCard"
              checked={formData.saveCard}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, saveCard: checked as boolean }))
              }
            />
            <Label htmlFor="saveCard" className="text-sm">
              Sauvegarder cette carte pour mes prochains achats
            </Label>
          </div>

          {/* Informations de sécurité */}
          <Alert className="border-blue-200 bg-blue-50">
            <Lock className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Sécurité garantie :</strong> Vos informations de carte sont chiffrées 
              et ne sont jamais stockées sur nos serveurs. Nous utilisons les plus hauts 
              standards de sécurité bancaire.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isProcessing}
          className="flex-1"
        >
          Retour
        </Button>
        <Button
          onClick={handlePayment}
          disabled={!isValid || isProcessing || hasErrors}
          className="flex-1 bg-primary hover:bg-primary/90"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Traitement...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Payer {amount.toFixed(2)}$
            </>
          )}
        </Button>
      </div>

      {/* Indicateur de validation */}
      {isValid && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Formulaire valide - Prêt pour le paiement
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
