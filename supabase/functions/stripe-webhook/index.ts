import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    if (!serviceRoleKey || !stripeSecretKey || !webhookSecret) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    // Récupérer le body et la signature Stripe
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      throw new Error('Missing stripe-signature header');
    }

    // Vérifier la signature du webhook
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return new Response(
        JSON.stringify({ error: `Webhook Error: ${err.message}` }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    console.log(`Received webhook event: ${event.type}`);

    // Traiter les événements selon leur type
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentSuccess(supabase, paymentIntent);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailure(supabase, paymentIntent);
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        await handleRefund(supabase, charge);
        break;
      }

      case 'payment_intent.canceled': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentCanceled(supabase, paymentIntent);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

// Gérer un paiement réussi
async function handlePaymentSuccess(
  supabase: any,
  paymentIntent: Stripe.PaymentIntent
) {
  const orderId = paymentIntent.metadata.order_id;
  const transactionId = paymentIntent.metadata.transaction_id;

  console.log(`Payment succeeded for order: ${orderId}`);

  // Mettre à jour la transaction
  const { error: transactionError } = await supabase
    .from('transactions')
    .update({
      status: 'succeeded',
      payment_intent_id: paymentIntent.id,
      updated_at: new Date().toISOString(),
    })
    .eq('payment_intent_id', paymentIntent.id);

  if (transactionError) {
    console.error('Error updating transaction:', transactionError);
  }

  // Si l'ordre existe, mettre à jour son statut
  if (orderId && orderId !== 'pending') {
    const { error: orderError } = await supabase
      .from('orders')
      .update({
        status: 'paid',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (orderError) {
      console.error('Error updating order:', orderError);
    }
  }

  // TODO: Envoyer une notification au client et au marchand
}

// Gérer un paiement échoué
async function handlePaymentFailure(
  supabase: any,
  paymentIntent: Stripe.PaymentIntent
) {
  const orderId = paymentIntent.metadata.order_id;

  console.log(`Payment failed for order: ${orderId}`);

  // Mettre à jour la transaction
  const { error: transactionError } = await supabase
    .from('transactions')
    .update({
      status: 'failed',
      updated_at: new Date().toISOString(),
    })
    .eq('payment_intent_id', paymentIntent.id);

  if (transactionError) {
    console.error('Error updating transaction:', transactionError);
  }

  // Si l'ordre existe, le marquer comme échoué
  if (orderId && orderId !== 'pending') {
    const { error: orderError } = await supabase
      .from('orders')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (orderError) {
      console.error('Error updating order:', orderError);
    }
  }

  // TODO: Envoyer une notification au client
}

// Gérer un remboursement
async function handleRefund(
  supabase: any,
  charge: Stripe.Charge
) {
  const paymentIntentId = charge.payment_intent as string;

  console.log(`Refund processed for payment: ${paymentIntentId}`);

  // Mettre à jour la transaction
  const { error: transactionError } = await supabase
    .from('transactions')
    .update({
      status: 'refunded',
      updated_at: new Date().toISOString(),
    })
    .eq('payment_intent_id', paymentIntentId);

  if (transactionError) {
    console.error('Error updating transaction:', transactionError);
  }

  // TODO: Mettre à jour le statut de la commande et notifier
}

// Gérer un paiement annulé
async function handlePaymentCanceled(
  supabase: any,
  paymentIntent: Stripe.PaymentIntent
) {
  const orderId = paymentIntent.metadata.order_id;

  console.log(`Payment canceled for order: ${orderId}`);

  // Mettre à jour la transaction
  const { error: transactionError } = await supabase
    .from('transactions')
    .update({
      status: 'canceled',
      updated_at: new Date().toISOString(),
    })
    .eq('payment_intent_id', paymentIntent.id);

  if (transactionError) {
    console.error('Error updating transaction:', transactionError);
  }
}

