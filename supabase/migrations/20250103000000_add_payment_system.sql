-- Migration pour ajouter le système de paiement unique avec répartition
-- Ajoute les champs nécessaires pour le paiement, le breakdown et le pourboire

-- Ajouter le statut "PAID" à order_status si nécessaire
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status' AND 
                   EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'paid' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'order_status'))) THEN
        ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'paid';
    END IF;
END $$;

-- Ajouter les colonnes payment à la table orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS breakdown JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS tip NUMERIC(10,2) DEFAULT 0 CHECK (tip >= 0),
ADD COLUMN IF NOT EXISTS driver_id UUID REFERENCES public.profiles(user_id);

-- Mettre à jour la structure de payment pour inclure les informations Stripe
-- payment: { stripePaymentIntentId, status, paidAt }
-- breakdown: { merchantAmount, driverAmount, adminAmount }

-- Créer la table transactions si elle n'existe pas déjà
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  payment_intent_id TEXT UNIQUE NOT NULL,
  amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  currency TEXT DEFAULT 'cad',
  status TEXT NOT NULL DEFAULT 'pending',
  customer_email TEXT NOT NULL,
  store_id UUID REFERENCES public.stores(id) NOT NULL,
  merchant_amount NUMERIC(10,2) NOT NULL CHECK (merchant_amount >= 0),
  driver_amount NUMERIC(10,2) NOT NULL CHECK (driver_amount >= 0),
  admin_amount NUMERIC(10,2) DEFAULT 0 CHECK (admin_amount >= 0),
  platform_commission NUMERIC(10,2) DEFAULT 0 CHECK (platform_commission >= 0),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Créer un index pour les recherches rapides
CREATE INDEX IF NOT EXISTS idx_transactions_order_id ON public.transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_transactions_payment_intent_id ON public.transactions(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_transactions_store_id ON public.transactions(store_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_intent ON public.orders((payment->>'stripePaymentIntentId'));

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour mettre à jour updated_at sur transactions
DROP TRIGGER IF EXISTS update_transactions_updated_at ON public.transactions;
CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Commentaires pour documentation
COMMENT ON COLUMN public.orders.payment IS 'Informations de paiement Stripe: { stripePaymentIntentId, status, paidAt }';
COMMENT ON COLUMN public.orders.breakdown IS 'Répartition des montants: { merchantAmount, driverAmount, adminAmount }';
COMMENT ON COLUMN public.orders.tip IS 'Pourboire donné au livreur';
COMMENT ON COLUMN public.orders.driver_id IS 'ID du livreur assigné à la commande';

COMMENT ON TABLE public.transactions IS 'Transactions de paiement avec répartition des montants';

