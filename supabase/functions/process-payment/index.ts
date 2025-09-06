import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PaymentRequest {
  order_id: string;
  amount: number;
  currency: string;
  customer_email: string;
  customer_name: string;
  delivery_address: string;
  items: Array<{
    product_id: string;
    product_name: string;
    quantity: number;
    price: number;
    store_id: string;
  }>;
  delivery_fee: number;
  platform_commission: number;
  merchant_amount: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://vexgjrrqbjurgiqfjxwk.supabase.co';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');

    if (!serviceRoleKey || !stripeSecretKey) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    const paymentData: PaymentRequest = await req.json();

    // Récupérer les informations du magasin et du compte Stripe
    const { data: store } = await supabase
      .from('stores')
      .select('id, name, owner_id')
      .eq('id', paymentData.items[0].store_id)
      .single();

    if (!store) {
      throw new Error('Store not found');
    }

    const { data: stripeAccount } = await supabase
      .from('stripe_connect_accounts')
      .select('account_id, charges_enabled')
      .eq('store_id', store.id)
      .eq('is_active', true)
      .single();

    if (!stripeAccount || !stripeAccount.charges_enabled) {
      throw new Error('Store Stripe account not ready for payments');
    }

    // Calculer les montants
    const totalAmount = paymentData.amount;
    const platformCommission = paymentData.platform_commission;
    const merchantAmount = paymentData.merchant_amount;
    const deliveryFee = paymentData.delivery_fee;

    // Créer le PaymentIntent avec transfert vers le marchand
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100), // Stripe utilise les centimes
      currency: paymentData.currency,
      customer_email: paymentData.customer_email,
      metadata: {
        order_id: paymentData.order_id,
        store_id: store.id,
        store_name: store.name,
        customer_name: paymentData.customer_name,
        delivery_address: paymentData.delivery_address,
        platform_commission: platformCommission.toString(),
        merchant_amount: merchantAmount.toString(),
        delivery_fee: deliveryFee.toString(),
      },
      transfer_data: {
        destination: stripeAccount.account_id,
        amount: Math.round(merchantAmount * 100), // Montant transféré au marchand
      },
      application_fee_amount: Math.round(platformCommission * 100), // Commission plateforme
      automatic_payment_methods: {
        enabled: true,
      },
    }, {
      stripeAccount: stripeAccount.account_id, // Utiliser le compte du marchand
    });

    // Enregistrer la transaction dans la base de données
    const { data: transaction } = await supabase
      .from('transactions')
      .insert({
        order_id: paymentData.order_id,
        payment_intent_id: paymentIntent.id,
        amount: totalAmount,
        currency: paymentData.currency,
        status: 'requires_payment_method',
        customer_email: paymentData.customer_email,
        store_id: store.id,
        platform_commission: platformCommission,
        merchant_amount: merchantAmount,
        delivery_fee: deliveryFee,
        stripe_fee: 0, // Sera mis à jour après le paiement
        net_amount: totalAmount,
      })
      .select()
      .single();

    // Enregistrer la commission
    await supabase
      .from('payment_commissions')
      .insert({
        transaction_id: transaction.id,
        order_id: paymentData.order_id,
        store_id: store.id,
        commission_type: 'delivery',
        commission_amount: platformCommission,
        commission_percentage: (platformCommission / totalAmount) * 100,
        platform_amount: platformCommission,
        merchant_amount: merchantAmount,
      });

    return new Response(
      JSON.stringify({
        success: true,
        payment_intent_id: paymentIntent.id,
        client_secret: paymentIntent.client_secret,
        transaction_id: transaction.id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error processing payment:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});