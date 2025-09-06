-- Créer la table pour les comptes Stripe Connect
CREATE TABLE IF NOT EXISTS public.stripe_connect_accounts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    account_id TEXT NOT NULL UNIQUE,
    store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    charges_enabled BOOLEAN DEFAULT false,
    payouts_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Créer la table pour les transactions
CREATE TABLE IF NOT EXISTS public.transactions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    payment_intent_id TEXT NOT NULL UNIQUE,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'cad',
    status TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    platform_commission DECIMAL(10,2) NOT NULL DEFAULT 0,
    merchant_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    delivery_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
    stripe_fee DECIMAL(10,2) DEFAULT 0,
    net_amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Créer la table pour les commissions
CREATE TABLE IF NOT EXISTS public.payment_commissions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    transaction_id uuid NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    commission_type TEXT NOT NULL DEFAULT 'delivery', -- 'delivery', 'platform', 'service'
    commission_amount DECIMAL(10,2) NOT NULL,
    commission_percentage DECIMAL(5,2) NOT NULL,
    platform_amount DECIMAL(10,2) NOT NULL,
    merchant_amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_stripe_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
CREATE TRIGGER trigger_update_stripe_connect_accounts_updated_at
    BEFORE UPDATE ON public.stripe_connect_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_stripe_updated_at();

CREATE TRIGGER trigger_update_transactions_updated_at
    BEFORE UPDATE ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_stripe_updated_at();

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_stripe_connect_accounts_store_id ON public.stripe_connect_accounts(store_id);
CREATE INDEX IF NOT EXISTS idx_transactions_order_id ON public.transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_transactions_store_id ON public.transactions(store_id);
CREATE INDEX IF NOT EXISTS idx_transactions_payment_intent_id ON public.transactions(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payment_commissions_transaction_id ON public.payment_commissions(transaction_id);

-- RLS (Row Level Security)
ALTER TABLE public.stripe_connect_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_commissions ENABLE ROW LEVEL SECURITY;

-- Politiques pour stripe_connect_accounts
CREATE POLICY "Merchants can manage their own Stripe accounts" ON public.stripe_connect_accounts
    FOR ALL USING (
        store_id IN (
            SELECT id FROM public.stores 
            WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all Stripe accounts" ON public.stripe_connect_accounts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Politiques pour transactions
CREATE POLICY "Merchants can view their transactions" ON public.transactions
    FOR SELECT USING (
        store_id IN (
            SELECT id FROM public.stores 
            WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all transactions" ON public.transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Politiques pour payment_commissions
CREATE POLICY "Merchants can view their commissions" ON public.payment_commissions
    FOR SELECT USING (
        store_id IN (
            SELECT id FROM public.stores 
            WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all commissions" ON public.payment_commissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
