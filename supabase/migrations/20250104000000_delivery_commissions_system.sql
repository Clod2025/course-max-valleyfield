-- Migration pour le système de commissions de livraison
-- Crée les tables delivery_commissions et platform_settings

-- Table pour stocker les paramètres de la plateforme
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

-- Table pour stocker les commissions de livraison
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

-- Insérer le paramètre par défaut pour le pourcentage de commission (20%)
INSERT INTO public.platform_settings (key, value, description, category, is_public)
VALUES (
    'delivery_commission_percent',
    '20.0',
    'Pourcentage de commission prélevé par la plateforme sur les frais de livraison',
    'delivery',
    false
) ON CONFLICT (key) DO NOTHING;

-- Insérer d'autres paramètres utiles
INSERT INTO public.platform_settings (key, value, description, category, is_public)
VALUES 
    ('min_delivery_fee', '3.99', 'Frais de livraison minimum', 'delivery', true),
    ('max_delivery_distance', '15.0', 'Distance maximale de livraison (km)', 'delivery', true),
    ('platform_name', '"CourseMax Valleyfield"', 'Nom de la plateforme', 'general', true)
ON CONFLICT (key) DO NOTHING;

-- Fonction pour calculer automatiquement les commissions
CREATE OR REPLACE FUNCTION calculate_delivery_commission(
    p_order_id uuid,
    p_driver_id uuid DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
    v_delivery_fee DECIMAL(10,2);
    v_commission_percent DECIMAL(5,2);
    v_platform_amount DECIMAL(10,2);
    v_driver_amount DECIMAL(10,2);
    v_commission_id uuid;
BEGIN
    -- Récupérer les frais de livraison de la commande
    SELECT delivery_fee INTO v_delivery_fee
    FROM public.orders
    WHERE id = p_order_id;
    
    IF v_delivery_fee IS NULL THEN
        RAISE EXCEPTION 'Commande non trouvée ou frais de livraison non définis';
    END IF;
    
    -- Récupérer le pourcentage de commission
    SELECT CAST(value AS DECIMAL(5,2)) INTO v_commission_percent
    FROM public.platform_settings
    WHERE key = 'delivery_commission_percent';
    
    -- Si pas de paramètre trouvé, utiliser 20% par défaut
    IF v_commission_percent IS NULL THEN
        v_commission_percent := 20.0;
    END IF;
    
    -- Calculer les montants
    v_platform_amount := v_delivery_fee * (v_commission_percent / 100);
    v_driver_amount := v_delivery_fee - v_platform_amount;
    
    -- Insérer ou mettre à jour la commission
    INSERT INTO public.delivery_commissions (
        order_id,
        driver_id,
        delivery_fee,
        commission_percent,
        platform_amount,
        driver_amount
    ) VALUES (
        p_order_id,
        p_driver_id,
        v_delivery_fee,
        v_commission_percent,
        v_platform_amount,
        v_driver_amount
    )
    ON CONFLICT (order_id) DO UPDATE SET
        driver_id = EXCLUDED.driver_id,
        delivery_fee = EXCLUDED.delivery_fee,
        commission_percent = EXCLUDED.commission_percent,
        platform_amount = EXCLUDED.platform_amount,
        driver_amount = EXCLUDED.driver_amount,
        updated_at = timezone('utc'::text, now())
    RETURNING id INTO v_commission_id;
    
    RETURN v_commission_id;
END;
$$ LANGUAGE plpgsql;

-- Contrainte unique pour éviter les doublons de commissions par commande
ALTER TABLE public.delivery_commissions 
ADD CONSTRAINT unique_commission_per_order UNIQUE (order_id);

-- Politiques RLS (Row Level Security)
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_commissions ENABLE ROW LEVEL SECURITY;

-- Politique pour platform_settings
CREATE POLICY "Admin can manage platform settings" ON public.platform_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Public can read public settings" ON public.platform_settings
    FOR SELECT USING (is_public = true);

-- Politiques pour delivery_commissions
CREATE POLICY "Admin can view all commissions" ON public.delivery_commissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Drivers can view their own commissions" ON public.delivery_commissions
    FOR SELECT USING (driver_id = auth.uid());

CREATE POLICY "Admin can manage all commissions" ON public.delivery_commissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Trigger pour calculer automatiquement les commissions lors de la création d'une commande
CREATE OR REPLACE FUNCTION auto_calculate_commission()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculer la commission uniquement si la commande a des frais de livraison
    IF NEW.delivery_fee > 0 THEN
        PERFORM calculate_delivery_commission(NEW.id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_calculate_commission_trigger
    AFTER INSERT ON public.orders
    FOR EACH ROW EXECUTE FUNCTION auto_calculate_commission();

-- Trigger pour mettre à jour les commissions lorsqu'un livreur est assigné
CREATE OR REPLACE FUNCTION update_commission_driver()
RETURNS TRIGGER AS $$
BEGIN
    -- Mettre à jour la commission avec le driver_id
    UPDATE public.delivery_commissions
    SET driver_id = NEW.driver_id,
        updated_at = timezone('utc'::text, now())
    WHERE order_id = NEW.order_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_commission_driver_trigger
    AFTER INSERT OR UPDATE ON public.deliveries
    FOR EACH ROW 
    WHEN (NEW.driver_id IS NOT NULL)
    EXECUTE FUNCTION update_commission_driver();