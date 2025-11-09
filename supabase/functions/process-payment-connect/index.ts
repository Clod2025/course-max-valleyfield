import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { requireUser, corsHeaders as defaultCorsHeaders, jsonResponse, errorResponse } from '../_shared/security.ts';

const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') || 'https://ton-frontend.com';
const corsHeaders = { ...defaultCorsHeaders, 'Access-Control-Allow-Origin': ALLOWED_ORIGIN };

interface PaymentRequest {
  order_id: string;
  items: Array<{ product_id: string; store_id: string; quantity: number; price: number }>;
}

// ==================== MAIN ====================

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    // ✅ Auth utilisateur (admin ou merchant)
    const auth = await requireUser(req, { requireAdmin: false });
    if ('errorResponse' in auth) return auth.errorResponse;

    const { user, supabase } = auth;

    // ✅ Body validation
    const body: PaymentRequest = await req.json();
    if (!body.order_id || !body.items?.length) {
      return errorResponse('order_id et items sont requis', 400);
    }

    // ✅ Récupérer la commande et vérifier qu’elle appartient à l’utilisateur/merchant
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', body.order_id)
      .single();

    if (orderError || !order) return errorResponse('Commande introuvable', 404);
    if (order.store_id !== body.items[0].store_id) return errorResponse('Commande non autorisée', 403);

    // ✅ Config Stripe côté serveur
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) return errorResponse('Stripe non configuré', 500);

    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });

    // ✅ Récupérer le compte Stripe du marchand
    const { data: stripeAccount, error: accountError } = await supabase
      .from('stripe_connect_accounts')
      .select('account_id, charges_enabled')
      .eq('store_id', order.store_id)
      .eq('is_active', true)
      .single();

    if (accountError || !stripeAccount?.charges_enabled) {
      return errorResponse('Compte Stripe du magasin non prêt', 400);
    }

    // ✅ Calculer les montants côté serveur pour éviter fraude
    const totalAmount = body.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const deliveryFee = order.delivery_fee || 0;
    const platformCommission = Math.round(totalAmount * 0.05); // Exemple 5%
    const merchantAmount = totalAmount + deliveryFee - platformCommission;

    // ✅ Créer PaymentIntent sécurisé
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round((totalAmount + deliveryFee) * 100),
      currency: 'CAD',
      transfer_data: { destination: stripeAccount.account_id, amount: Math.round(merchantAmount * 100) },
      application_fee_amount: Math.round(platformCommission * 100),
      automatic_payment_methods: { enabled: true },
      metadata: { order_id: body.order_id, store_id: order.store_id, user_id: user.id },
    }, { stripeAccount: stripeAccount.account_id });

    // ✅ Enregistrer transaction côté serveur
    const { data: transaction } = await supabase
      .from('transactions')
      .insert({
        order_id: body.order_id,
        payment_intent_id: paymentIntent.id,
        amount: totalAmount + deliveryFee,
        status: 'requires_payment_method',
        store_id: order.store_id,
        platform_commission: platformCommission,
        merchant_amount: merchantAmount,
      })
      .select()
      .single();

    return jsonResponse({
      success: true,
      payment_intent_id: paymentIntent.id,
      client_secret: paymentIntent.client_secret,
      transaction_id: transaction.id,
    });

  } catch (err) {
    console.error('Erreur Payment:', err);
    return errorResponse('Erreur serveur lors du paiement', 500);
  }
});