import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { usePayments } from '@/hooks/usePayments';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

const StripeConnect = () => {
  const { profile } = useAuth();
  const { getStripeConnectUrl, getStripeAccountStatus, loading } = usePayments();
  const [stripeAccount, setStripeAccount] = useState<any>(null);
  const [connecting, setConnecting] = useState(false);

  const storeId = profile?.store_id || '';

  useEffect(() => {
    if (storeId) {
      loadStripeAccountStatus();
    }
  }, [storeId]);

  const loadStripeAccountStatus = async () => {
    try {
      const account = await getStripeAccountStatus(storeId);
      setStripeAccount(account);
    } catch (error) {
      console.error('Error loading Stripe account status:', error);
    }
  };

  const handleConnectStripe = async () => {
    try {
      setConnecting(true);
      const onboardingUrl = await getStripeConnectUrl(storeId);
      window.open(onboardingUrl, '_blank');
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer le lien Stripe Connect",
        variant: "destructive"
      });
    } finally {
      setConnecting(false);
    }
  };

  const getStatusBadge = () => {
    if (!stripeAccount) {
      return <Badge variant="outline">Non connecté</Badge>;
    }

    if (stripeAccount.charges_enabled && stripeAccount.payouts_enabled) {
      return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Actif</Badge>;
    } else if (stripeAccount.charges_enabled) {
      return <Badge className="bg-yellow-500"><AlertCircle className="w-3 h-3 mr-1" />Partiellement actif</Badge>;
    } else {
      return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />En attente</Badge>;
    }
  };

  const getStatusMessage = () => {
    if (!stripeAccount) {
      return "Connectez votre compte Stripe pour recevoir les paiements de vos clients.";
    }

    if (stripeAccount.charges_enabled && stripeAccount.payouts_enabled) {
      return "Votre compte Stripe est entièrement configuré. Vous pouvez recevoir des paiements.";
    } else if (stripeAccount.charges_enabled) {
      return "Votre compte peut recevoir des paiements, mais les virements ne sont pas encore activés.";
    } else {
      return "Votre compte Stripe est en cours de configuration. Veuillez compléter l'onboarding.";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin" />
            <span className="ml-2">Chargement...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Stripe Connect
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Statut du compte</h3>
            <p className="text-sm text-muted-foreground">
              {getStatusMessage()}
            </p>
          </div>
          {getStatusBadge()}
        </div>

        {stripeAccount && (
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span>ID du compte:</span>
              <span className="font-mono">{stripeAccount.account_id}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Paiements activés:</span>
              <span>{stripeAccount.charges_enabled ? 'Oui' : 'Non'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Virements activés:</span>
              <span>{stripeAccount.payouts_enabled ? 'Oui' : 'Non'}</span>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          {!stripeAccount ? (
            <Button onClick={handleConnectStripe} disabled={connecting}>
              {connecting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Connexion...
                </>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Connecter Stripe
                </>
              )}
            </Button>
          ) : (
            <Button 
              variant="outline" 
              onClick={handleConnectStripe}
              disabled={connecting}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Gérer le compte
            </Button>
          )}
          
          <Button 
            variant="outline" 
            onClick={loadStripeAccountStatus}
            disabled={loading}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">
          <p>
            Stripe Connect permet à vos clients de payer directement sur votre compte Stripe. 
            Les commissions de la plateforme sont automatiquement déduites.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default StripeConnect;
