export interface PaymentIntent {
    id: string;
    amount: number;
    currency: string;
    status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'succeeded' | 'canceled';
    client_secret: string;
    metadata?: Record<string, string>;
  }
  
  export interface PaymentRequest {
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
  
  export interface StripeConnectAccount {
    id: string;
    account_id: string;
    store_id: string;
    is_active: boolean;
    charges_enabled: boolean;
    payouts_enabled: boolean;
    created_at: string;
    updated_at: string;
  }
  
  export interface Transaction {
    id: string;
    order_id: string;
    payment_intent_id: string;
    amount: number;
    currency: string;
    status: string;
    customer_email: string;
    store_id: string;
    platform_commission: number;
    merchant_amount: number;
    delivery_fee: number;
    created_at: string;
    updated_at: string;
  }
