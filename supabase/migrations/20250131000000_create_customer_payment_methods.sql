-- Table pour les méthodes de paiement des clients
CREATE TABLE IF NOT EXISTS public.customer_payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stripe_payment_method_id text UNIQUE, -- ID Stripe du payment method
  stripe_customer_id text, -- ID Stripe du customer
  type text NOT NULL DEFAULT 'card', -- card, interac, etc.
  brand text, -- visa, mastercard, amex, etc.
  last4 text, -- 4 derniers chiffres
  expiry_month integer,
  expiry_year integer,
  is_default boolean DEFAULT false,
  is_active boolean DEFAULT true,
  billing_details jsonb, -- Adresse de facturation
  metadata jsonb, -- Métadonnées supplémentaires
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_customer_payment_methods_user_id ON public.customer_payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_payment_methods_stripe_customer_id ON public.customer_payment_methods(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_payment_methods_stripe_payment_method_id ON public.customer_payment_methods(stripe_payment_method_id);
CREATE INDEX IF NOT EXISTS idx_customer_payment_methods_is_default ON public.customer_payment_methods(user_id, is_default) WHERE is_default = true;

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_customer_payment_methods_updated_at
  BEFORE UPDATE ON public.customer_payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies
ALTER TABLE public.customer_payment_methods ENABLE ROW LEVEL SECURITY;

-- Les clients peuvent voir leurs propres méthodes de paiement
CREATE POLICY "Clients can view their payment methods"
  ON public.customer_payment_methods
  FOR SELECT
  USING (auth.uid() = user_id);

-- Les clients peuvent insérer leurs propres méthodes de paiement
CREATE POLICY "Clients can insert their payment methods"
  ON public.customer_payment_methods
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Les clients peuvent mettre à jour leurs propres méthodes de paiement
CREATE POLICY "Clients can update their payment methods"
  ON public.customer_payment_methods
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Les clients peuvent supprimer leurs propres méthodes de paiement
CREATE POLICY "Clients can delete their payment methods"
  ON public.customer_payment_methods
  FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON TABLE public.customer_payment_methods IS 'Méthodes de paiement sauvegardées par les clients';
