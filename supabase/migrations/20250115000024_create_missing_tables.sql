-- Migration pour créer toutes les tables manquantes identifiées dans le code
-- Date: 2025-01-15

-- 1. Table loyalty_settings (paramètres de fidélité)
CREATE TABLE IF NOT EXISTS public.loyalty_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID REFERENCES public.merchants(id) ON DELETE CASCADE,
    points_per_dollar DECIMAL(5,2) DEFAULT 1.00,
    points_per_referral INTEGER DEFAULT 100,
    minimum_points_redemption INTEGER DEFAULT 100,
    points_expiry_days INTEGER DEFAULT 365,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Table user_preferences (préférences utilisateur)
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    language TEXT DEFAULT 'fr',
    currency TEXT DEFAULT 'CAD',
    notifications JSONB DEFAULT '{}',
    theme TEXT DEFAULT 'light',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 3. Table merchant_payment_methods (méthodes de paiement marchands)
CREATE TABLE IF NOT EXISTS public.merchant_payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID REFERENCES public.merchants(id) ON DELETE CASCADE,
    payment_type TEXT NOT NULL CHECK (payment_type IN ('interac', 'stripe', 'paypal', 'cash')),
    is_active BOOLEAN DEFAULT true,
    configuration JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Table merchant_transactions (transactions marchands)
CREATE TABLE IF NOT EXISTS public.merchant_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID REFERENCES public.merchants(id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('payment', 'refund', 'commission', 'fee')),
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'CAD',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    reference_id TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Table order_logs (logs des commandes)
CREATE TABLE IF NOT EXISTS public.order_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.commandes(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    old_status TEXT,
    new_status TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Table help_messages (messages d'aide)
CREATE TABLE IF NOT EXISTS public.help_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Table platform_settings (paramètres de plateforme)
CREATE TABLE IF NOT EXISTS public.platform_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    value JSONB NOT NULL,
    category TEXT NOT NULL DEFAULT 'general',
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Table delivery_fee_distribution_config (configuration distribution frais livraison)
CREATE TABLE IF NOT EXISTS public.delivery_fee_distribution_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_name TEXT NOT NULL,
    base_fee DECIMAL(5,2) NOT NULL,
    distance_multiplier DECIMAL(3,2) DEFAULT 1.00,
    merchant_share DECIMAL(3,2) DEFAULT 0.70,
    driver_share DECIMAL(3,2) DEFAULT 0.30,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Table delivery_pricing_config (configuration tarification livraison)
CREATE TABLE IF NOT EXISTS public.delivery_pricing_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_name TEXT NOT NULL,
    base_price DECIMAL(5,2) NOT NULL,
    price_per_km DECIMAL(3,2) DEFAULT 0.50,
    minimum_order DECIMAL(5,2) DEFAULT 25.00,
    free_delivery_threshold DECIMAL(5,2) DEFAULT 50.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Table delivery_time_slots (créneaux horaires de livraison)
CREATE TABLE IF NOT EXISTS public.delivery_time_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    max_orders INTEGER DEFAULT 10,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Table delivery_zones (zones de livraison)
CREATE TABLE IF NOT EXISTS public.delivery_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    polygon_coordinates JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. Table driver_assignments (assignations livreurs)
CREATE TABLE IF NOT EXISTS public.driver_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.commandes(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'accepted', 'picked_up', 'delivered', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. Table deliveries (livraisons)
CREATE TABLE IF NOT EXISTS public.deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.commandes(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'failed')),
    pickup_time TIMESTAMP WITH TIME ZONE,
    delivery_time TIMESTAMP WITH TIME ZONE,
    tracking_code TEXT UNIQUE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 14. Table cart (panier)
CREATE TABLE IF NOT EXISTS public.cart (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- 15. Table orders (commandes - alias pour commandes)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    merchant_id UUID REFERENCES public.merchants(id) ON DELETE CASCADE,
    order_number TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled')),
    total_amount DECIMAL(10,2) NOT NULL,
    delivery_fee DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    delivery_address JSONB NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 16. Table order_items (articles de commande)
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 17. Table support_messages (messages de support)
CREATE TABLE IF NOT EXISTS public.support_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 18. Table drivers (livreurs)
CREATE TABLE IF NOT EXISTS public.drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    license_number TEXT NOT NULL UNIQUE,
    vehicle_type TEXT NOT NULL CHECK (vehicle_type IN ('car', 'motorcycle', 'bicycle', 'walking')),
    vehicle_info JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    rating DECIMAL(3,2) DEFAULT 5.00,
    total_deliveries INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 19. Table stores (magasins)
CREATE TABLE IF NOT EXISTS public.stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID REFERENCES public.merchants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 20. Table chats (conversations)
CREATE TABLE IF NOT EXISTS public.chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    merchant_id UUID REFERENCES public.merchants(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 21. Table chat_messages (messages de chat)
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID REFERENCES public.chats(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file')),
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 22. Table reviews (avis)
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    merchant_id UUID REFERENCES public.merchants(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 23. Table stripe_connect_accounts (comptes Stripe Connect)
CREATE TABLE IF NOT EXISTS public.stripe_connect_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID REFERENCES public.merchants(id) ON DELETE CASCADE,
    stripe_account_id TEXT NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 24. Table ab_experiments (expériences A/B)
CREATE TABLE IF NOT EXISTS public.ab_experiments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 25. Table ml_predictions (prédictions ML)
CREATE TABLE IF NOT EXISTS public.ml_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    prediction_type TEXT NOT NULL,
    input_data JSONB NOT NULL,
    prediction_result JSONB NOT NULL,
    confidence_score DECIMAL(3,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_loyalty_settings_merchant_id ON public.loyalty_settings(merchant_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_merchant_payment_methods_merchant_id ON public.merchant_payment_methods(merchant_id);
CREATE INDEX IF NOT EXISTS idx_merchant_transactions_merchant_id ON public.merchant_transactions(merchant_id);
CREATE INDEX IF NOT EXISTS idx_order_logs_order_id ON public.order_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_help_messages_category ON public.help_messages(category);
CREATE INDEX IF NOT EXISTS idx_platform_settings_key ON public.platform_settings(key);
CREATE INDEX IF NOT EXISTS idx_delivery_fee_distribution_config_zone ON public.delivery_fee_distribution_config(zone_name);
CREATE INDEX IF NOT EXISTS idx_delivery_pricing_config_zone ON public.delivery_pricing_config(zone_name);
CREATE INDEX IF NOT EXISTS idx_delivery_time_slots_day ON public.delivery_time_slots(day_of_week);
CREATE INDEX IF NOT EXISTS idx_delivery_zones_name ON public.delivery_zones(name);
CREATE INDEX IF NOT EXISTS idx_driver_assignments_driver_id ON public.driver_assignments(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_assignments_order_id ON public.driver_assignments(order_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_order_id ON public.deliveries(order_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_driver_id ON public.deliveries(driver_id);
CREATE INDEX IF NOT EXISTS idx_cart_user_id ON public.cart(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_merchant_id ON public.orders(merchant_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_user_id ON public.support_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_drivers_user_id ON public.drivers(user_id);
CREATE INDEX IF NOT EXISTS idx_stores_merchant_id ON public.stores(merchant_id);
CREATE INDEX IF NOT EXISTS idx_chats_user_id ON public.chats(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_id ON public.chat_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_reviews_merchant_id ON public.reviews(merchant_id);
CREATE INDEX IF NOT EXISTS idx_stripe_connect_accounts_merchant_id ON public.stripe_connect_accounts(merchant_id);
CREATE INDEX IF NOT EXISTS idx_ab_experiments_name ON public.ab_experiments(name);
CREATE INDEX IF NOT EXISTS idx_ml_predictions_user_id ON public.ml_predictions(user_id);

-- RLS (Row Level Security)
ALTER TABLE public.loyalty_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.help_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_fee_distribution_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_pricing_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_connect_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ab_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_predictions ENABLE ROW LEVEL SECURITY;

-- Politiques RLS de base
CREATE POLICY "Users can manage their preferences" ON public.user_preferences
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Merchants can manage their payment methods" ON public.merchant_payment_methods
    FOR ALL USING (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));

CREATE POLICY "Merchants can manage their transactions" ON public.merchant_transactions
    FOR ALL USING (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));

CREATE POLICY "Users can view their cart" ON public.cart
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can manage their orders" ON public.orders
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can view their order items" ON public.order_items
    FOR SELECT USING (order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their support messages" ON public.support_messages
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can manage their reviews" ON public.reviews
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can manage their chats" ON public.chats
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can view their chat messages" ON public.chat_messages
    FOR SELECT USING (chat_id IN (SELECT id FROM public.chats WHERE user_id = auth.uid()));

-- Données par défaut
INSERT INTO public.help_messages (title, content, category, is_active, display_order) VALUES
('Comment passer une commande?', 'Pour passer une commande, sélectionnez vos produits et cliquez sur "Ajouter au panier".', 'general', true, 1),
('Comment modifier ma commande?', 'Vous pouvez modifier votre commande avant la confirmation en accédant à votre panier.', 'general', true, 2),
('Quels sont les frais de livraison?', 'Les frais de livraison varient selon la zone et le montant de votre commande.', 'delivery', true, 3);

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE 'Migration des tables manquantes terminée avec succès!';
    RAISE NOTICE 'Tables créées: loyalty_settings, user_preferences, merchant_payment_methods, merchant_transactions, order_logs, help_messages, platform_settings, delivery_fee_distribution_config, delivery_pricing_config, delivery_time_slots, delivery_zones, driver_assignments, deliveries, cart, orders, order_items, support_messages, drivers, stores, chats, chat_messages, reviews, stripe_connect_accounts, ab_experiments, ml_predictions';
    RAISE NOTICE 'Index créés pour optimiser les performances';
    RAISE NOTICE 'RLS activé avec politiques de sécurité';
    RAISE NOTICE 'Données par défaut insérées';
END $$;
