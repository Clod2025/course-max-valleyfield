import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
  PaymentRequestButtonElement,
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  Smartphone, 
  CheckCircle, 
  AlertCircle,
  Loader2
} from 'lucide-react';
import { stripePromise } from '@/lib/stripe';
import { usePayments } from '@/hooks/usePayments';
import { PaymentRequest } from '@/types/payment';
import { toast } from '@/hooks/use-toast';

interface PaymentFormProps {
  paymentData: PaymentRequest;
  onSuccess: (transactionId: string) => void;
  onError: (error: string) => void;
}

const PaymentFormContent = ({ paymentData, onSuccess, onError }: PaymentFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const { createPaymentIntent, confirmPayment } = usePayments();
  
  const [paymentIntent, setPaymentIntent] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [paymentRequest, setPaymentRequest] = useState<any>(null);
  const [canMakePayment, setCanMakePayment] = useState(false);

  useEffect(() => {
    initializePayment();
  }, []);

  const initializePayment = async () => {
    try {
      setLoading(true);
      
      // Créer le PaymentIntent
      const intent = await createPaymentIntent(paymentData);
      setPaymentIntent(intent);

      // Configurer Payment Request (Apple Pay / Google Pay)
      if (stripe && elements) {
        const pr = stripe.paymentRequest({
          country: 'CA',
          currency: 'cad',
          total: {
            label: `Commande #${paymentData.order_id}`,
            amount: Math.round(paymentData.amount * 100),
          },
          requestPayerName: true,
          requestPayerEmail: true,
        });

        pr.on('paymentmethod', async (ev) => {
          try {
            const { error: confirmError } = await stripe.confirmCardPayment(
              intent.client_secret,
              { payment_method: ev.paymentMethod.id },
              { handleActions: false }
            );

            if (confirmError) {
              ev.complete('fail');
              onError(confirmError.message || 'Payment failed');
            } else {
              ev.complete('success');
              const transaction = await confirmPayment(intent.id);
              onSuccess(transaction.id);
            }
          } catch (error) {
            ev.complete('fail');
            onError('Payment failed');
          }
        });

        const canMakePaymentResult = await pr.canMakePayment();
        setCanMakePayment(!!canMakePaymentResult);
        setPaymentRequest(pr);
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to initialize payment');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !paymentIntent) {
      return;
    }

    setLoading(true);

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      const { error, paymentIntent: confirmedPaymentIntent } = await stripe.confirmCardPayment(
        paymentIntent.client_secret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: paymentData.customer_name,
              email: paymentData.customer_email,
            },
          },
        }
      );

      if (error) {
        throw new Error(error.message || 'Payment failed');
      }

      if (confirmedPaymentIntent.status === 'succeeded') {
        const transaction = await confirmPayment(confirmedPaymentIntent.id);
        onSuccess(transaction.id);
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !paymentIntent) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Initialisation du paiement...</span>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Paiement
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Résumé de la commande */}
        <div className="bg-muted/50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Résumé de la commande</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Sous-total:</span>
              <span>${(paymentData.amount - paymentData.delivery_fee).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Livraison:</span>
              <span>${paymentData.delivery_fee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold border-t pt-1">
              <span>Total:</span>
              <span>${paymentData.amount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Apple Pay / Google Pay */}
        {canMakePayment && paymentRequest && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4" />
              <span className="text-sm font-medium">Paiement rapide</span>
            </div>
            <PaymentRequestButtonElement
              options={{
                paymentRequest,
                style: {
                  paymentRequestButton: {
                    theme: 'dark',
                    height: '48px',
                  },
                },
              }}
            />
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Ou</span>
              </div>
            </div>
          </div>
        )}

        {/* Formulaire de carte */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Informations de carte
            </label>
            <div className="p-4 border rounded-lg">
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#424770',
                      '::placeholder': {
                        color: '#aab7c4',
                      },
                    },
                  },
                }}
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={!stripe || loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Traitement...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4 mr-2" />
                Payer ${paymentData.amount.toFixed(2)}
              </>
            )}
          </Button>
        </form>

        {/* Sécurité */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CheckCircle className="w-4 h-4" />
          <span>Paiement sécurisé par Stripe</span>
        </div>
      </CardContent>
    </Card>
  );
};

const PaymentForm = (props: PaymentFormProps) => {
  return (
    <Elements stripe={stripePromise}>
      <PaymentFormContent {...props} />
    </Elements>
  );
};

export default PaymentForm;
