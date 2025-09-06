-- Créer la table platform_settings si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.platform_settings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    value JSONB NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'general',
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Créer la table delivery_commissions si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.delivery_commissions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    driver_id uuid REFERENCES public.profiles(user_id) ON DELETE SET NULL,
    delivery_fee DECIMAL(10,2) NOT NULL CHECK (delivery_fee >= 0),
    commission_percent DECIMAL(5,2) NOT NULL CHECK (commission_percent >= 0 AND commission_percent <= 100),
    platform_amount DECIMAL(10,2) NOT NULL CHECK (platform_amount >= 0),
    driver_amount DECIMAL(10,2) NOT NULL CHECK (driver_amount >= 0),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_delivery_commissions_order_id ON public.delivery_commissions(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_commissions_driver_id ON public.delivery_commissions(driver_id);
CREATE INDEX IF NOT EXISTS idx_delivery_commissions_created_at ON public.delivery_commissions(created_at);
CREATE INDEX IF NOT EXISTS idx_platform_settings_key ON public.platform_settings(key);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_platform_settings_updated_at 
    BEFORE UPDATE ON public.platform_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_delivery_commissions_updated_at 
    BEFORE UPDATE ON public.delivery_commissions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Contrainte unique pour éviter les doublons de commissions par commande
ALTER TABLE public.delivery_commissions 
ADD CONSTRAINT IF NOT EXISTS unique_commission_per_order UNIQUE (order_id);

-- Politiques RLS (Row Level Security)
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_commissions ENABLE ROW LEVEL SECURITY;

-- Politique pour platform_settings
DROP POLICY IF EXISTS "Admin can manage platform settings" ON public.platform_settings;
CREATE POLICY "Admin can manage platform settings" ON public.platform_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Public can read public settings" ON public.platform_settings;
CREATE POLICY "Public can read public settings" ON public.platform_settings
    FOR SELECT USING (is_public = true);

-- Politiques pour delivery_commissions
DROP POLICY IF EXISTS "Admin can view all commissions" ON public.delivery_commissions;
CREATE POLICY "Admin can view all commissions" ON public.delivery_commissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Drivers can view their own commissions" ON public.delivery_commissions;
CREATE POLICY "Drivers can view their own commissions" ON public.delivery_commissions
    FOR SELECT USING (driver_id = auth.uid());

DROP POLICY IF EXISTS "Admin can manage all commissions" ON public.delivery_commissions;
CREATE POLICY "Admin can manage all commissions" ON public.delivery_commissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );
