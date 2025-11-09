import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { corsHeaders as defaultCorsHeaders, handleCorsPreflight, requireUser, jsonResponse, errorResponse } from '../_shared/security.ts';

interface CreatePaymentMethodRequest {
  user_id: string;
  customer_email: string;
  customer_name?: string;
}

// CORS limité à ton frontend
const corsHeaders = {
  ...defaultCorsHeaders,
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || 'https://ton-frontend.com',
};

Deno.serve(async (req) => {
  // Gestion preflight
  const preflight = handleCorsPreflight(req);
  if (preflight) return preflight;

  try {
    // 1️⃣ Vérifier l'authentification et le rôle admin
    const authResult = await requireUser(req, { requireAdmin: true });
    if ('errorResponse' in authResult) return authResult.errorResponse;

    const { user: authUser, supabase } = authResult;

    // 2️⃣ Lire le body
    const requestData: CreatePaymentMethodRequest = await req.json();
    if (!requestData.user_id || !requestData.customer_email) {
      return errorResponse('user_id et customer_email sont requis', 400);
    }

    // 3️⃣ Vérifier que l'utilisateur cible existe
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, user_id, email')
      .eq('user_id', requestData.user_id)
      .single();

    if (profileError || !profile) {
      return errorResponse('Utilisateur non trouvé', 404);
    }

    // 4️⃣ Initialiser Stripe
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) return errorResponse('Stripe non configuré', 500);

    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });

    // 5️⃣ Vérifier s'il existe déjà un customer Stripe
    let customerId: string | null = null;
    try {
      const { data: existingMethods } = await supabase
        .from('customer_payment_methods')
        .select('stripe_customer_id')
        .eq('user_id', requestData.user_id)
        .not('stripe_customer_id', 'is', null)
        .limit(1)
        .maybeSingle();

      if (existingMethods?.stripe_customer_id) customerId = existingMethods.stripe_customer_id;
    } catch (err) {
      console.warn('Table customer_payment_methods non trouvée ou erreur:', err);
      customerId = null;
    }

    // 6️⃣ Créer un nouveau customer si nécessaire
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: requestData.customer_email,
        name: requestData.customer_name,
        metadata: {
          user_id: requestData.user_id,
          profile_id: profile.id,
        },
      });
      customerId = customer.id;
    }

    // 7️⃣ Créer SetupIntent pour la carte
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
      metadata: { user_id: requestData.user_id },
    });

    return jsonResponse({
      success: true,
      client_secret: setupIntent.client_secret,
      customer_id: customerId,
      setup_intent_id: setupIntent.id,
    });
  } catch (err: any) {
    console.error('Error creating payment method setup:', err);
    return errorResponse(err.message || 'Erreur lors de la création du SetupIntent', 500);
  }
});