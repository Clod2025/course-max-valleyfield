import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PaymentRequest, PaymentIntent, Transaction } from '@/types/payment';

interface UsePaymentsReturn {
  createPaymentIntent: (paymentData: PaymentRequest) => Promise<PaymentIntent>;
  confirmPayment: (paymentIntentId: string) => Promise<Transaction>;
  getStripeConnectUrl: (storeId: string) => Promise<string>;
  getStripeAccountStatus: (storeId: string) => Promise<any>;
  loading: boolean;
  error: string | null;
}

export const usePayments = (): UsePaymentsReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPaymentIntent = useCallback(async (paymentData: PaymentRequest): Promise<PaymentIntent> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('process-payment', {
        body: paymentData,
      });

      if (functionError) {
        throw functionError;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to create payment intent');
      }

      return {
        id: data.payment_intent_id,
        amount: paymentData.amount,
        currency: paymentData.currency,
        status: 'requires_payment_method',
        client_secret: data.client_secret,
        metadata: {
          order_id: paymentData.order_id,
          transaction_id: data.transaction_id,
        },
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create payment intent';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const confirmPayment = useCallback(async (paymentIntentId: string): Promise<Transaction> => {
    setLoading(true);
    setError(null);

    try {
      // Récupérer la transaction depuis la base de données
      const { data: transaction, error: fetchError } = await supabase
        .from('transactions')
        .select('*')
        .eq('payment_intent_id', paymentIntentId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      return transaction;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to confirm payment';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const getStripeConnectUrl = useCallback(async (storeId: string): Promise<string> => {
    setLoading(true);
    setError(null);

    try {
      const returnUrl = `${window.location.origin}/merchant/dashboard?tab=settings&stripe=success`;
      const refreshUrl = `${window.location.origin}/merchant/dashboard?tab=settings&stripe=refresh`;

      const { data, error: functionError } = await supabase.functions.invoke('stripe-connect', {
        body: {
          store_id: storeId,
          return_url: returnUrl,
          refresh_url: refreshUrl,
        },
      });

      if (functionError) {
        throw functionError;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to create Stripe Connect account');
      }

      return data.onboarding_url;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get Stripe Connect URL';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const getStripeAccountStatus = useCallback(async (storeId: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('stripe_connect_accounts')
        .select('*')
        .eq('store_id', storeId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw fetchError;
      }

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get Stripe account status';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    createPaymentIntent,
    confirmPayment,
    getStripeConnectUrl,
    getStripeAccountStatus,
    loading,
    error,
  };
};
