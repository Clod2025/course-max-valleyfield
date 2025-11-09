import React, { useState, useEffect } from 'react';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CreditCard, AlertCircle } from 'lucide-react';
import { stripePromise } from '@/lib/stripe';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface StripeCheckoutProps {
  amount: number;
  receipt: {
    items: Array<{ name: string; quantity: number; price: number }>;
    merchantAmount: number;
    driverAmount: number;
    adminAmount: number;
  };
  merchantId: string;
  customerEmail: string;
  customerName?: string;
  deliveryAddress: string;
  onPaymentSuccess: (paymentIntentId: string, transactionId?: string) => void;
  onPaymentError: (error: string) => void;
  className?: string;
}

const StripeCheckoutForm: React.FC<{
  amount: number;
  receipt: StripeCheckoutProps['receipt'];
  merchantId: string;
  customerEmail: string;
  customerName?: string;
  deliveryAddress: string;
  onPaymentSuccess: (paymentIntentId: string, transactionId?: string) => void;
  onPaymentError: (error: string) => void;
}> = ({
  amount,
  receipt,
  merchantId,
  customerEmail,
  customerName,
  deliveryAddress,
  onPaymentSuccess,
  onPaymentError
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Créer le payment intent au montage
  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: functionError } = await supabase.functions.invoke('create-payment-intent', {
          body: {
            amount,
            merchantId,
            breakdown: {
              merchantAmount: receipt.merchantAmount,
              driverAmount: receipt.driverAmount,
              adminAmount: receipt.adminAmount
            },
            items: receipt.items,
            customerEmail,
            customerName,
            deliveryAddress
          }
        });

        if (functionError) {
          throw new Error(functionError.message || 'Erreur lors de la création du paiement');
        }

        if (!data.success) {
          throw new Error(data.error || 'Erreur lors de la création du paiement');
        }

        setClientSecret(data.clientSecret);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
        setError(errorMessage);
        onPaymentError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    createPaymentIntent();
  }, [amount, merchantId, receipt, customerEmail, customerName, deliveryAddress, onPaymentError]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setLoading(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError('Élément de carte non trouvé');
      setLoading(false);
      return;
    }

    try {
      // Confirmer le paiement
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            email: customerEmail,
            name: customerName
          }
        }
      });

      if (confirmError) {
        setError(confirmError.message || 'Erreur de paiement');
        onPaymentError(confirmError.message || 'Erreur de paiement');
        return;
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        toast({
          title: "Paiement réussi",
          description: "Votre paiement a été traité avec succès",
        });
        onPaymentSuccess(paymentIntent.id);
      } else {
        setError('Le paiement n\'a pas été complété');
        onPaymentError('Le paiement n\'a pas été complété');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      onPaymentError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };

  if (loading && !clientSecret) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span>Initialisation du paiement...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Informations de carte
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 border rounded-lg bg-background">
            <CardElement options={cardElementOptions} />
          </div>

          <div className="text-sm text-muted-foreground">
            <p>Votre paiement est sécurisé et crypté.</p>
            <p className="mt-1">Montant total: <strong>{amount.toFixed(2)}$</strong></p>
          </div>
        </CardContent>
      </Card>

      <Button
        type="submit"
        disabled={!stripe || !clientSecret || loading}
        className="w-full"
        size="lg"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Traitement...
          </>
        ) : (
          <>
            Payer {amount.toFixed(2)}$
          </>
        )}
      </Button>
    </form>
  );
};

export const StripeCheckout: React.FC<StripeCheckoutProps> = (props) => {
  const options: StripeElementsOptions = {
    appearance: {
      theme: 'stripe',
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <StripeCheckoutForm {...props} />
    </Elements>
  );
};

