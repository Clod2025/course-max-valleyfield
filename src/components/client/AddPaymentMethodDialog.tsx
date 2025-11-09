import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CreditCard, AlertCircle } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

// Ligne 18 - CORRECTION : Vérifier que la clé existe avant de charger Stripe
const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

interface AddPaymentMethodDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddPaymentMethodForm: React.FC<{
  onClose: () => void;
  onSuccess: () => void;
}> = ({ onClose, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [setupIntentId, setSetupIntentId] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);

  // ✅ CORRECTION : Vérifier que Stripe est disponible
  useEffect(() => {
    if (!stripePromise) {
      toast({
        title: "Configuration manquante",
        description: "La clé Stripe n'est pas configurée. Veuillez contacter le support.",
        variant: "destructive"
      });
      onClose();
    }
  }, [toast, onClose]);

  // Créer le Setup Intent au montage
  useEffect(() => {
    const createSetupIntent = async () => {
      if (!user?.id || !profile?.email || !stripePromise) return;

      try {
        setLoading(true);
        const { data, error } = await supabase.functions.invoke('stripe-create-payment-method', {
          body: {
            user_id: user.id,
            customer_email: profile.email,
            customer_name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
          }
        });

        if (error) throw error;
        if (!data.success) throw new Error(data.error || 'Failed to create setup intent');

        setClientSecret(data.client_secret);
        setSetupIntentId(data.setup_intent_id);
        setCustomerId(data.customer_id);
      } catch (err: any) {
        console.error('Erreur:', err);
        toast({
          title: "Erreur",
          description: err.message || 'Impossible de créer la méthode de paiement',
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    createSetupIntent();
  }, [user, profile, stripePromise]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret || !setupIntentId) {
      return;
    }

    setLoading(true);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      toast({
        title: "Erreur",
        description: "Élément de carte non trouvé",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    try {
      // Confirmer le Setup Intent
      const { error: confirmError, setupIntent } = await stripe.confirmCardSetup(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            email: profile?.email,
            name: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim()
          }
        }
      });

      if (confirmError) {
        throw new Error(confirmError.message || 'Erreur de confirmation');
      }

      if (setupIntent && setupIntent.status === 'succeeded' && setupIntent.payment_method) {
        // Sauvegarder dans la base de données
        const { data, error: saveError } = await supabase.functions.invoke('stripe-confirm-payment-method', {
          body: {
            user_id: user?.id,
            setup_intent_id: setupIntentId,
            payment_method_id: setupIntent.payment_method as string
          }
        });

        if (saveError || !data.success) {
          throw new Error(data?.error || 'Erreur lors de la sauvegarde');
        }

        toast({
          title: "Succès",
          description: "Méthode de paiement ajoutée avec succès",
        });

        onSuccess();
        onClose();
      } else {
        throw new Error('Le setup intent n\'a pas été complété');
      }
    } catch (err: any) {
      console.error('Erreur:', err);
      toast({
        title: "Erreur",
        description: err.message || 'Impossible d\'ajouter la méthode de paiement',
        variant: "destructive"
      });
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="card-element">Informations de la carte</Label>
        <div className="mt-2 p-4 border rounded-md">
          <CardElement id="card-element" options={cardElementOptions} />
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={loading}
          className="flex-1"
        >
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={!stripe || loading || !clientSecret}
          className="flex-1"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Traitement...
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4 mr-2" />
              Ajouter
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

export const AddPaymentMethodDialog: React.FC<AddPaymentMethodDialogProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Ajouter une méthode de paiement</DialogTitle>
          <DialogDescription>
            Ajoutez une nouvelle carte de crédit ou de débit pour vos paiements
          </DialogDescription>
        </DialogHeader>
        
        <Elements stripe={stripePromise}>
          <AddPaymentMethodForm onClose={onClose} onSuccess={onSuccess} />
        </Elements>
      </DialogContent>
    </Dialog>
  );
};
