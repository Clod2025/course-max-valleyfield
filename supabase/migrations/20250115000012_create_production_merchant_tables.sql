-- Migration pour créer toutes les tables nécessaires pour l'interface marchand en production
-- Date: 2025-01-15

-- 1. Table merchants (marchands)
CREATE TABLE IF NOT EXISTS public.merchants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    nom TEXT NOT NULL,
    prenom TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    address TEXT,
    city TEXT,
    postal_code TEXT,
    province TEXT,
    store_name TEXT NOT NULL,
    store_type TEXT DEFAULT 'grocery',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Table products (produits) - Version optimisée
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID REFERENCES public.merchants(id) ON DELETE CASCADE,
    nom TEXT NOT NULL,
    categorie TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    prix NUMERIC(10,2) NOT NULL CHECK (prix >= 0),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    unite TEXT DEFAULT 'unité' CHECK (unite IN ('kg', 'unité', 'litre', 'paquet')),
    barcode TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Table commandes (commandes)
CREATE TABLE IF NOT EXISTS public.commandes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID REFERENCES public.merchants(id) ON DELETE CASCADE,
    client_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    numero_commande TEXT NOT NULL UNIQUE,
    statut TEXT NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'acceptee', 'preparation', 'pret', 'livree', 'annulee')),
    total DECIMAL(10,2) NOT NULL CHECK (total >= 0),
    frais_livraison DECIMAL(10,2) DEFAULT 0,
    adresse_livraison JSONB NOT NULL,
    instructions TEXT,
    date_commande TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    date_livraison_prevue TIMESTAMP WITH TIME ZONE,
    date_livraison_reelle TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Table commande_items (articles de commande)
CREATE TABLE IF NOT EXISTS public.commande_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    commande_id UUID REFERENCES public.commandes(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    quantite INTEGER NOT NULL CHECK (quantite > 0),
    prix_unitaire DECIMAL(10,2) NOT NULL CHECK (prix_unitaire >= 0),
    total DECIMAL(10,2) NOT NULL CHECK (total >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Table commis (employés) - Version optimisée
CREATE TABLE IF NOT EXISTS public.commis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID REFERENCES public.merchants(id) ON DELETE CASCADE,
    nom TEXT NOT NULL,
    prenom TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    code_unique TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'commis' CHECK (role IN ('commis', 'supervisor', 'manager')),
    mot_de_passe TEXT NOT NULL,
    must_change_password BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Table transactions (transactions financières)
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID REFERENCES public.merchants(id) ON DELETE CASCADE,
    commande_id UUID REFERENCES public.commandes(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('vente', 'remboursement', 'commission', 'frais')),
    montant DECIMAL(10,2) NOT NULL,
    description TEXT,
    statut TEXT NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'complete', 'echec', 'annulee')),
    methode_paiement TEXT,
    reference_externe TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Table logs_actions (journal des actions)
CREATE TABLE IF NOT EXISTS public.logs_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID REFERENCES public.merchants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    table_name TEXT,
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Table paramètres (paramètres du marchand)
CREATE TABLE IF NOT EXISTS public.parametres (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID REFERENCES public.merchants(id) ON DELETE CASCADE,
    cle TEXT NOT NULL,
    valeur JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(merchant_id, cle)
);

-- Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_merchants_user_id ON public.merchants(user_id);
CREATE INDEX IF NOT EXISTS idx_merchants_email ON public.merchants(email);
CREATE INDEX IF NOT EXISTS idx_merchants_is_active ON public.merchants(is_active);

CREATE INDEX IF NOT EXISTS idx_products_merchant_id ON public.products(merchant_id);
CREATE INDEX IF NOT EXISTS idx_products_categorie ON public.products(categorie);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_nom ON public.products USING gin(to_tsvector('french', nom));

CREATE INDEX IF NOT EXISTS idx_commandes_merchant_id ON public.commandes(merchant_id);
CREATE INDEX IF NOT EXISTS idx_commandes_client_id ON public.commandes(client_id);
CREATE INDEX IF NOT EXISTS idx_commandes_statut ON public.commandes(statut);
CREATE INDEX IF NOT EXISTS idx_commandes_date_commande ON public.commandes(date_commande);

CREATE INDEX IF NOT EXISTS idx_commande_items_commande_id ON public.commande_items(commande_id);
CREATE INDEX IF NOT EXISTS idx_commande_items_product_id ON public.commande_items(product_id);

CREATE INDEX IF NOT EXISTS idx_commis_merchant_id ON public.commis(merchant_id);
CREATE INDEX IF NOT EXISTS idx_commis_email ON public.commis(email);
CREATE INDEX IF NOT EXISTS idx_commis_code_unique ON public.commis(code_unique);
CREATE INDEX IF NOT EXISTS idx_commis_is_active ON public.commis(is_active);

CREATE INDEX IF NOT EXISTS idx_transactions_merchant_id ON public.transactions(merchant_id);
CREATE INDEX IF NOT EXISTS idx_transactions_commande_id ON public.transactions(commande_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_statut ON public.transactions(statut);

CREATE INDEX IF NOT EXISTS idx_logs_actions_merchant_id ON public.logs_actions(merchant_id);
CREATE INDEX IF NOT EXISTS idx_logs_actions_user_id ON public.logs_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_actions_created_at ON public.logs_actions(created_at);

CREATE INDEX IF NOT EXISTS idx_parametres_merchant_id ON public.parametres(merchant_id);
CREATE INDEX IF NOT EXISTS idx_parametres_cle ON public.parametres(cle);

-- Fonctions pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
CREATE TRIGGER trigger_merchants_updated_at
    BEFORE UPDATE ON public.merchants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_commandes_updated_at
    BEFORE UPDATE ON public.commandes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_commis_updated_at
    BEFORE UPDATE ON public.commis
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_transactions_updated_at
    BEFORE UPDATE ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_parametres_updated_at
    BEFORE UPDATE ON public.parametres
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security)
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commandes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commande_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parametres ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour merchants
CREATE POLICY "Users can view their own merchant profile" ON public.merchants
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own merchant profile" ON public.merchants
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own merchant profile" ON public.merchants
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Politiques RLS pour products
CREATE POLICY "Merchants can manage their products" ON public.products
    FOR ALL USING (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));

CREATE POLICY "Customers can view active products" ON public.products
    FOR SELECT USING (is_active = true);

-- Politiques RLS pour commandes
CREATE POLICY "Merchants can manage their orders" ON public.commandes
    FOR ALL USING (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));

CREATE POLICY "Customers can view their orders" ON public.commandes
    FOR SELECT USING (client_id = auth.uid());

-- Politiques RLS pour commande_items
CREATE POLICY "Merchants can manage order items" ON public.commande_items
    FOR ALL USING (commande_id IN (
        SELECT id FROM public.commandes 
        WHERE merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid())
    ));

CREATE POLICY "Customers can view their order items" ON public.commande_items
    FOR SELECT USING (commande_id IN (
        SELECT id FROM public.commandes WHERE client_id = auth.uid()
    ));

-- Politiques RLS pour commis
CREATE POLICY "Merchants can manage their employees" ON public.commis
    FOR ALL USING (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));

-- Politiques RLS pour transactions
CREATE POLICY "Merchants can manage their transactions" ON public.transactions
    FOR ALL USING (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));

-- Politiques RLS pour logs_actions
CREATE POLICY "Merchants can view their action logs" ON public.logs_actions
    FOR SELECT USING (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));

-- Politiques RLS pour paramètres
CREATE POLICY "Merchants can manage their settings" ON public.parametres
    FOR ALL USING (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));

-- Fonction pour créer un marchand
CREATE OR REPLACE FUNCTION public.create_merchant(
    p_nom TEXT,
    p_prenom TEXT,
    p_email TEXT,
    p_phone TEXT DEFAULT NULL,
    p_address TEXT DEFAULT NULL,
    p_city TEXT DEFAULT NULL,
    p_postal_code TEXT DEFAULT NULL,
    p_province TEXT DEFAULT NULL,
    p_store_name TEXT,
    p_store_type TEXT DEFAULT 'grocery'
)
RETURNS JSON AS $$
DECLARE
    v_merchant_id UUID;
    v_result JSON;
BEGIN
    -- Fixer le search_path pour éviter le schema shadowing
    SET LOCAL search_path = pg_temp, public;
    
    -- Vérifier que l'utilisateur est connecté
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Utilisateur non authentifié';
    END IF;
    
    -- Insérer le marchand
    INSERT INTO public.merchants (
        user_id,
        nom,
        prenom,
        email,
        phone,
        address,
        city,
        postal_code,
        province,
        store_name,
        store_type
    ) VALUES (
        auth.uid(),
        p_nom,
        p_prenom,
        p_email,
        p_phone,
        p_address,
        p_city,
        p_postal_code,
        p_province,
        p_store_name,
        p_store_type
    ) RETURNING id INTO v_merchant_id;
    
    -- Retourner les informations du marchand créé
    SELECT json_build_object(
        'id', v_merchant_id,
        'nom', p_nom,
        'prenom', p_prenom,
        'email', p_email,
        'store_name', p_store_name,
        'created_at', NOW()
    ) INTO v_result;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Donner les permissions d'exécution
GRANT EXECUTE ON FUNCTION public.create_merchant TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_product_with_image TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_merchant_products TO authenticated;

-- Commentaires
COMMENT ON TABLE public.merchants IS 'Table des marchands de la plateforme';
COMMENT ON TABLE public.products IS 'Table des produits des marchands';
COMMENT ON TABLE public.commandes IS 'Table des commandes clients';
COMMENT ON TABLE public.commande_items IS 'Table des articles de commande';
COMMENT ON TABLE public.commis IS 'Table des employés des marchands';
COMMENT ON TABLE public.transactions IS 'Table des transactions financières';
COMMENT ON TABLE public.logs_actions IS 'Journal des actions des utilisateurs';
COMMENT ON TABLE public.parametres IS 'Paramètres de configuration des marchands';

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE 'Migration production terminée avec succès!';
    RAISE NOTICE 'Tables créées: merchants, products, commandes, commande_items, commis, transactions, logs_actions, parametres';
    RAISE NOTICE 'Index créés pour optimiser les performances';
    RAISE NOTICE 'RLS activé avec politiques de sécurité';
    RAISE NOTICE 'Fonctions créées: create_merchant, create_product_with_image, get_merchant_products';
    RAISE NOTICE 'Permissions accordées au rôle authenticated';
END $$;
