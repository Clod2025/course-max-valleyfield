import Stripe from 'https://esm.sh/stripe@14.21.0'
import { handleCorsPreflight, requireUser, errorResponse, jsonResponse } from '../_shared/security.ts'

interface DetachPaymentMethodRequest {
  payment_method_id: string
}

Deno.serve(async (req) => {
  const preflight = handleCorsPreflight(req)
  if (preflight) return preflight

  try {
    const authResult = await requireUser(req)
    if ('errorResponse' in authResult) return authResult.errorResponse

    const { supabase, user } = authResult

    const { payment_method_id }: DetachPaymentMethodRequest = await req.json()
    if (!payment_method_id) {
      return errorResponse('payment_method_id requis', 400)
    }

    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeSecretKey) return errorResponse('Stripe non configuré', 500)

    const { data: method, error: methodError } = await supabase
      .from('customer_payment_methods')
      .select('id, user_id, stripe_payment_method_id, is_active')
      .eq('stripe_payment_method_id', payment_method_id)
      .maybeSingle()

    if (methodError) {
      console.error('Erreur lecture customer_payment_methods:', methodError)
      return errorResponse('Erreur serveur', 500)
    }

    if (!method) {
      return errorResponse('Méthode de paiement introuvable', 404)
    }

    if (method.user_id !== user.id) {
      return errorResponse('Accès refusé', 403)
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' })
    await stripe.paymentMethods.detach(payment_method_id)

    await supabase
      .from('customer_payment_methods')
      .update({ is_active: false, is_default: false })
      .eq('id', method.id)

    return jsonResponse({ success: true })
  } catch (error: any) {
    console.error('Erreur stripe-detach-payment-method:', error)
    return errorResponse(error?.message ?? 'Impossible de détacher la méthode de paiement', 500)
  }
})
