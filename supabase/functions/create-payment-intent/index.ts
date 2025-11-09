import Stripe from 'https://esm.sh/stripe@14.21.0';
import {
  errorResponse,
  handleCorsPreflight,
  jsonResponse,
  requireUser,
} from '../_shared/security.ts';

interface CreatePaymentIntentRequest {
  orderId?: string;
  amount: number;
  currency?: string;
  merchantId: string;
  driverId?: string;
  breakdown: {
    merchantAmount: number;
    driverAmount: number;
    adminAmount: number;
  };
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  customerEmail: string;
  customerName?: string;
  deliveryAddress: string;
  metadata?: Record<string, string>;
}

Deno.serve(async (req) => {
  const cors = handleCorsPreflight(req);
  if (cors) {
    return cors;
  }

  try {
    const auth = await requireUser(req);
    if ('errorResponse' in auth) {
      return auth.errorResponse;
    }

    const { supabase, user } = auth;
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');

    if (!stripeSecretKey) {
      throw new Error('Missing STRIPE_SECRET_KEY environment variable');
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    const requestData: CreatePaymentIntentRequest = await req.json();
    const { breakdown } = requestData;

    if (!requestData.amount || Number.isNaN(requestData.amount)) {
      return errorResponse('Invalid amount', 400);
    }

    if (!requestData.merchantId) {
      return errorResponse('merchantId is required', 400);
    }

    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id, name')
      .eq('id', requestData.merchantId)
      .single();

    if (storeError || !store) {
      return errorResponse('Store not found', 404);
    }

    const amountInCents = Math.round(requestData.amount * 100);
    if (amountInCents <= 0) {
      return errorResponse('Amount must be greater than zero', 400);
    }

    if (
      !breakdown ||
      typeof breakdown.merchantAmount !== 'number' ||
      typeof breakdown.driverAmount !== 'number' ||
      typeof breakdown.adminAmount !== 'number'
    ) {
      return errorResponse('Invalid breakdown payload', 400);
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: requestData.currency || 'cad',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        order_id: requestData.orderId || 'pending',
        merchant_id: requestData.merchantId,
        merchant_name: store.name,
        driver_id: requestData.driverId || 'pending',
        customer_email: requestData.customerEmail,
        customer_name: requestData.customerName || '',
        delivery_address: requestData.deliveryAddress,
        merchant_amount: breakdown.merchantAmount.toString(),
        driver_amount: breakdown.driverAmount.toString(),
        admin_amount: breakdown.adminAmount.toString(),
        created_by: user.id,
        ...requestData.metadata,
      },
    });

    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert({
        order_id: requestData.orderId || null,
        payment_intent_id: paymentIntent.id,
        amount: requestData.amount,
        currency: requestData.currency || 'cad',
        status: 'pending',
        customer_email: requestData.customerEmail,
        store_id: requestData.merchantId,
        merchant_amount: breakdown.merchantAmount,
        driver_amount: breakdown.driverAmount,
        admin_amount: breakdown.adminAmount,
        platform_commission: breakdown.adminAmount,
      })
      .select()
      .single();

    if (transactionError) {
      console.error('Error creating transaction:', transactionError);
    }

    return jsonResponse({
      success: true,
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      transactionId: transaction?.id || null,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    const message =
      error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(message, 400);
  }
});

