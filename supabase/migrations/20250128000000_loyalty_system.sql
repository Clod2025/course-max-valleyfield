-- Migration pour le système de fidélité CourseMax
-- Date: 28 janvier 2025

-- Ajouter la colonne loyalty_points à la table profiles (si elle n'existe pas déjà)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'loyalty_points') THEN
        ALTER TABLE profiles ADD COLUMN loyalty_points INTEGER DEFAULT 0;
    END IF;
END $$;

-- Créer la table loyalty_settings pour la configuration
CREATE TABLE IF NOT EXISTS loyalty_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    loyalty_enabled BOOLEAN DEFAULT TRUE,
    loyalty_earn_rate DECIMAL(5,2) DEFAULT 1.00, -- Points par dollar dépensé
    loyalty_redeem_rate DECIMAL(5,4) DEFAULT 0.0100, -- Valeur d'1 point en dollars (0.01$)
    min_redemption_points INTEGER DEFAULT 100, -- Minimum de points pour échanger
    max_redemption_percentage INTEGER DEFAULT 50, -- Maximum % de réduction par commande
    points_expiry_days INTEGER DEFAULT 365, -- Expiration des points (en jours)
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Créer la table loyalty_transactions pour l'historique
CREATE TABLE IF NOT EXISTS loyalty_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('earned', 'redeemed', 'expired', 'admin_adjustment')),
    points INTEGER NOT NULL,
    points_balance INTEGER NOT NULL, -- Solde après la transaction
    description TEXT,
    metadata JSONB, -- Données supplémentaires (montant de la commande, etc.)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Créer la table loyalty_redemptions pour les échanges
CREATE TABLE IF NOT EXISTS loyalty_redemptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    points_used INTEGER NOT NULL,
    discount_amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insérer les paramètres par défaut
INSERT INTO loyalty_settings (loyalty_enabled, loyalty_earn_rate, loyalty_redeem_rate, min_redemption_points, max_redemption_percentage, points_expiry_days)
VALUES (TRUE, 1.00, 0.0100, 100, 50, 365)
ON CONFLICT DO NOTHING;

-- Créer les index pour les performances
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_user_id ON loyalty_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_created_at ON loyalty_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_loyalty_redemptions_user_id ON loyalty_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_redemptions_order_id ON loyalty_redemptions(order_id);

-- Fonction pour calculer les points gagnés
CREATE OR REPLACE FUNCTION calculate_loyalty_points(
    amount_spent DECIMAL(10,2),
    earn_rate DECIMAL(5,2) DEFAULT 1.00
)
RETURNS INTEGER AS $$
BEGIN
    RETURN FLOOR(amount_spent * earn_rate);
END;
$$ LANGUAGE plpgsql;

-- Fonction pour calculer la valeur des points
CREATE OR REPLACE FUNCTION calculate_points_value(
    points INTEGER,
    redeem_rate DECIMAL(5,4) DEFAULT 0.0100
)
RETURNS DECIMAL(10,2) AS $$
BEGIN
    RETURN points * redeem_rate;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour ajouter des points de fidélité
CREATE OR REPLACE FUNCTION add_loyalty_points(
    p_user_id UUID,
    p_points INTEGER,
    p_order_id UUID DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    current_balance INTEGER;
    new_balance INTEGER;
BEGIN
    -- Vérifier que l'utilisateur existe
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_user_id) THEN
        RAISE EXCEPTION 'Utilisateur non trouvé';
    END IF;
    
    -- Obtenir le solde actuel
    SELECT COALESCE(loyalty_points, 0) INTO current_balance
    FROM profiles WHERE id = p_user_id;
    
    -- Calculer le nouveau solde
    new_balance := current_balance + p_points;
    
    -- Mettre à jour le solde
    UPDATE profiles 
    SET loyalty_points = new_balance,
        updated_at = timezone('utc'::text, now())
    WHERE id = p_user_id;
    
    -- Enregistrer la transaction
    INSERT INTO loyalty_transactions (
        user_id, order_id, transaction_type, points, points_balance, description, metadata
    ) VALUES (
        p_user_id, p_order_id, 'earned', p_points, new_balance, p_description, p_metadata
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour utiliser des points de fidélité
CREATE OR REPLACE FUNCTION redeem_loyalty_points(
    p_user_id UUID,
    p_order_id UUID,
    p_points_to_redeem INTEGER,
    p_redeem_rate DECIMAL(5,4) DEFAULT 0.0100
)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    current_balance INTEGER;
    new_balance INTEGER;
    discount_amount DECIMAL(10,2);
BEGIN
    -- Vérifier que l'utilisateur existe
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_user_id) THEN
        RAISE EXCEPTION 'Utilisateur non trouvé';
    END IF;
    
    -- Obtenir le solde actuel
    SELECT COALESCE(loyalty_points, 0) INTO current_balance
    FROM profiles WHERE id = p_user_id;
    
    -- Vérifier que l'utilisateur a assez de points
    IF current_balance < p_points_to_redeem THEN
        RAISE EXCEPTION 'Points insuffisants. Solde actuel: %', current_balance;
    END IF;
    
    -- Calculer le montant de réduction
    discount_amount := calculate_points_value(p_points_to_redeem, p_redeem_rate);
    
    -- Calculer le nouveau solde
    new_balance := current_balance - p_points_to_redeem;
    
    -- Mettre à jour le solde
    UPDATE profiles 
    SET loyalty_points = new_balance,
        updated_at = timezone('utc'::text, now())
    WHERE id = p_user_id;
    
    -- Enregistrer la transaction
    INSERT INTO loyalty_transactions (
        user_id, order_id, transaction_type, points, points_balance, description
    ) VALUES (
        p_user_id, p_order_id, 'redeemed', -p_points_to_redeem, new_balance, 
        'Échange de ' || p_points_to_redeem || ' points pour ' || discount_amount || '$'
    );
    
    -- Enregistrer l'échange
    INSERT INTO loyalty_redemptions (
        user_id, order_id, points_used, discount_amount
    ) VALUES (
        p_user_id, p_order_id, p_points_to_redeem, discount_amount
    );
    
    RETURN discount_amount;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir l'historique des points
CREATE OR REPLACE FUNCTION get_loyalty_history(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    transaction_type VARCHAR(20),
    points INTEGER,
    points_balance INTEGER,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        lt.id,
        lt.transaction_type,
        lt.points,
        lt.points_balance,
        lt.description,
        lt.created_at
    FROM loyalty_transactions lt
    WHERE lt.user_id = p_user_id
    ORDER BY lt.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- RLS (Row Level Security)
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_settings ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour loyalty_transactions
CREATE POLICY "Users can view their own loyalty transactions" ON loyalty_transactions
    FOR SELECT USING (user_id = auth.uid());

-- Politiques RLS pour loyalty_redemptions
CREATE POLICY "Users can view their own loyalty redemptions" ON loyalty_redemptions
    FOR SELECT USING (user_id = auth.uid());

-- Politiques RLS pour loyalty_settings (lecture pour tous, modification pour admins)
CREATE POLICY "Everyone can view loyalty settings" ON loyalty_settings
    FOR SELECT USING (true);

CREATE POLICY "Admins can modify loyalty settings" ON loyalty_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_loyalty_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_loyalty_settings_updated_at
    BEFORE UPDATE ON loyalty_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_loyalty_settings_updated_at();

-- Commentaires pour la documentation
COMMENT ON TABLE loyalty_settings IS 'Configuration du système de fidélité';
COMMENT ON TABLE loyalty_transactions IS 'Historique des transactions de points de fidélité';
COMMENT ON TABLE loyalty_redemptions IS 'Historique des échanges de points contre des réductions';

COMMENT ON COLUMN loyalty_settings.loyalty_earn_rate IS 'Points gagnés par dollar dépensé';
COMMENT ON COLUMN loyalty_settings.loyalty_redeem_rate IS 'Valeur en dollars d''un point de fidélité';
COMMENT ON COLUMN loyalty_settings.min_redemption_points IS 'Nombre minimum de points requis pour un échange';
COMMENT ON COLUMN loyalty_settings.max_redemption_percentage IS 'Pourcentage maximum de réduction par commande';
COMMENT ON COLUMN loyalty_settings.points_expiry_days IS 'Nombre de jours avant expiration des points';
