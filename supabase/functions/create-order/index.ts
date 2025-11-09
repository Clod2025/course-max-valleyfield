// supabase/functions/create-order-secure/index.ts
import { serve } from 'std/server';
import Stripe from 'stripe';
import { handleCorsPreflight, requireUser, errorResponse, jsonResponse } from '../_shared/security.ts';

// ------------------- CONFIG -------------------
const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

if (!STRIPE_SECRET_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing required env vars');
}

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });

// ------------------- TYPES -------------------
interface CreateOrderRequest {
  paymentIntentId: string;
  metadata?: Record<string, any>;
}

// ------------------- UTIL -------------------
serve(async (req: Request) => {
  const preflight = handleCorsPreflight(req);
  if (preflight) return preflight;

  try {
    // Méthode autorisée uniquement
    if (req.method !== 'POST') {
      return errorResponse('Method not allowed', 405);
    }

    const auth = await requireUser(req, { requireAdmin: true });
    if ('errorResponse' in auth) return auth.errorResponse;

    const supabase = auth.supabase;

    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return errorResponse('Unsupported Media Type', 415);
    }

    const body: CreateOrderRequest = await req.json().catch(() => null);
    if (!body || typeof body.paymentIntentId !== 'string') {
      return errorResponse('Bad Request: missing paymentIntentId', 400);
    }

    const paymentIntentId = body.paymentIntentId.trim();

    // ------------------- Stripe -------------------
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (!intent || intent.status !== 'succeeded') {
      return errorResponse('Payment not succeeded', 402);
    }

    // ------------------- Idempotency -------------------
    const { data: existingOrder, error: existingError } = await supabase
      .from('orders')
      .select('id, status, order_number')
      .eq('payment_intent_id', paymentIntentId)
      .limit(1)
      .maybeSingle();

    if (existingError) {
      console.error('Supabase read error (idempotency):', existingError);
      return errorResponse('Server error', 500);
    }
    if (existingOrder) {
      return jsonResponse({
        message: 'Order already created',
        order: existingOrder,
      });
    }

    // ------------------- Metadata / Validation -------------------
    const metadata = {
      ...intent.metadata,
      ...(body.metadata || {})
    };

    // ------------------- RPC secure -------------------
    const { data: rpcData, error: rpcError } = await supabase.rpc('create_order_transaction', {
      p_user_id: metadata.user_id || null,
      p_payment_intent_id: paymentIntentId,
      p_amount: intent.amount,
      p_metadata: metadata
    });

    if (rpcError) {
      console.error('RPC create_order_transaction error:', rpcError);
      return errorResponse('Failed to create order', 500);
    }

    // ------------------- Success -------------------
    return jsonResponse({ data: rpcData });

  } catch (err: any) {
    console.error('Unhandled error in create-order-secure:', err);
    return errorResponse('Internal server error', 500);
  }
});