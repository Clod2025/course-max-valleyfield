import Stripe from 'https://esm.sh/stripe@14.21.0'
import { handleCorsPreflight, requireUser, jsonResponse, errorResponse } from '../_shared/security.ts'

interface ConnectAccountRequest {
  store_id: string
  return_url: string
  refresh_url: string
}

Deno.serve(async (req) => {
  const preflight = handleCorsPreflight(req)
  if (preflight) return preflight

  try {
    const auth = await requireUser(req)
    if ('errorResponse' in auth) return auth.errorResponse

    const { supabase, user } = auth

    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeSecretKey) return errorResponse('Stripe non configuré', 500)

    const { store_id, return_url, refresh_url }: ConnectAccountRequest = await req.json()
    if (!store_id || !return_url || !refresh_url) {
      return errorResponse('store_id, return_url et refresh_url sont requis', 400)
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' })

    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id, owner_id')
      .eq('id', store_id)
      .eq('owner_id', user.id)
      .single()

    if (storeError || !store) {
      return errorResponse('Magasin introuvable ou accès refusé', 403)
    }

    const { data: existingAccount } = await supabase
      .from('stripe_connect_accounts')
      .select('account_id')
      .eq('store_id', store_id)
      .maybeSingle()

    let accountId = existingAccount?.account_id ?? null

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'CA',
        email: user.email ?? undefined,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      })

      accountId = account.id

      await supabase
        .from('stripe_connect_accounts')
        .insert({
          account_id: accountId,
          store_id,
          is_active: false,
          charges_enabled: false,
          payouts_enabled: false,
        })
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId!,
      return_url,
      refresh_url,
      type: 'account_onboarding',
    })

    return jsonResponse({
      success: true,
      account_id: accountId,
      onboarding_url: accountLink.url,
    })
  } catch (error: any) {
    console.error('Error creating Stripe Connect account:', error)
    return errorResponse(error?.message ?? 'Erreur lors de la création du compte Stripe', 500)
  }
})