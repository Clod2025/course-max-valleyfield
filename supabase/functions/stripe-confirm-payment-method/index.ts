import Stripe from 'https://esm.sh/stripe@14.21.0'
import { handleCorsPreflight, requireUser, errorResponse, jsonResponse } from '../_shared/security.ts'

interface ConfirmPaymentMethodRequest {
  user_id?: string
  setup_intent_id: string
  payment_method_id: string
}

Deno.serve(async (req) => {
  const preflight = handleCorsPreflight(req)
  if (preflight) return preflight

  try {
    const auth = await requireUser(req)
    if ('errorResponse' in auth) return auth.errorResponse

    const { supabase, user } = auth

    const requestData: ConfirmPaymentMethodRequest = await req.json()
    const targetUserId = requestData.user_id ?? user.id

    if (!requestData.setup_intent_id || !requestData.payment_method_id) {
      return errorResponse('setup_intent_id et payment_method_id sont requis', 400)
    }

    if (targetUserId !== user.id) {
      return errorResponse('Accès refusé', 403)
    }

    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeSecretKey) return errorResponse('Stripe non configuré', 500)

    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' })

    const setupIntent = await stripe.setupIntents.retrieve(requestData.setup_intent_id)
    if (setupIntent.status !== 'succeeded') {
      return errorResponse('Setup Intent non abouti', 400)
    }

    const paymentMethod = await stripe.paymentMethods.retrieve(requestData.payment_method_id)
    if (!paymentMethod || paymentMethod.type !== 'card' || !paymentMethod.card) {
      return errorResponse('Méthode de paiement invalide', 400)
    }

    const { data: existingMethods, error: existingError } = await supabase
      .from('customer_payment_methods')
      .select('id')
      .eq('user_id', targetUserId)
      .eq('is_active', true)

    if (existingError) {
      console.error('Erreur lecture customer_payment_methods:', existingError)
      return errorResponse('Erreur serveur', 500)
    }

    const isFirstMethod = !existingMethods || existingMethods.length === 0

    const { data: savedMethod, error: insertError } = await supabase
      .from('customer_payment_methods')
      .insert([{
        user_id: targetUserId,
        stripe_payment_method_id: paymentMethod.id,
        stripe_customer_id: setupIntent.customer as string,
        type: 'card',
        brand: paymentMethod.card.brand,
        last4: paymentMethod.card.last4,
        expiry_month: paymentMethod.card.exp_month,
        expiry_year: paymentMethod.card.exp_year,
        is_default: isFirstMethod,
        is_active: true,
        billing_details: paymentMethod.billing_details,
        metadata: { setup_intent_id: setupIntent.id },
      }])
      .select()
      .single()

    if (insertError) {
      console.error('Erreur insert customer_payment_methods:', insertError)
      return errorResponse('Impossible d’enregistrer la méthode de paiement', 500)
    }

    return jsonResponse({ success: true, payment_method: savedMethod })
  } catch (error: any) {
    console.error('Erreur stripe-confirm-payment-method:', error)
    return errorResponse(error?.message ?? 'Échec de la confirmation de la méthode de paiement', 500)
  }
})
