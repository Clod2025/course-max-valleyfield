import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ConnectAccountRequest {
  store_id: string;
  return_url: string;
  refresh_url: string;
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

    const { store_id, return_url, refresh_url }: ConnectAccountRequest = await req.json();

    // Vérifier que l'utilisateur est propriétaire du magasin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data: store } = await supabase
      .from('stores')
      .select('id, owner_id')
      .eq('id', store_id)
      .eq('owner_id', user.id)
      .single();

    if (!store) {
      throw new Error('Store not found or access denied');
    }

    // Vérifier si un compte Stripe existe déjà
    const { data: existingAccount } = await supabase
      .from('stripe_connect_accounts')
      .select('account_id')
      .eq('store_id', store_id)
      .single();

    let accountId = existingAccount?.account_id;

    if (!accountId) {
      // Créer un nouveau compte Stripe Connect
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'CA',
        email: user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });

      accountId = account.id;

      // Enregistrer le compte dans la base de données
      await supabase
        .from('stripe_connect_accounts')
        .insert({
          account_id: accountId,
          store_id: store_id,
          is_active: false,
          charges_enabled: false,
          payouts_enabled: false,
        });
    }

    // Créer un lien d'onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      return_url: return_url,
      refresh_url: refresh_url,
      type: 'account_onboarding',
    });

    return new Response(
      JSON.stringify({
        success: true,
        account_id: accountId,
        onboarding_url: accountLink.url,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error creating Stripe Connect account:', error);
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