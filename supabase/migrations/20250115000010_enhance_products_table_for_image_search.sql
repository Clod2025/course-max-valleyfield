-- Migration pour améliorer la table products avec support des images
-- Date: 2025-01-15

-- Vérifier et ajouter la colonne image_url si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'image_url'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.products 
        ADD COLUMN image_url TEXT;
        
        -- Créer un index pour optimiser les requêtes sur image_url
        CREATE INDEX IF NOT EXISTS idx_products_image_url ON public.products(image_url);
        
        RAISE NOTICE 'Colonne image_url ajoutée à la table products';
    ELSE
        RAISE NOTICE 'Colonne image_url existe déjà dans la table products';
    END IF;
END $$;

-- Vérifier et ajouter la colonne unit si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'unit'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.products 
        ADD COLUMN unit TEXT DEFAULT 'unité' CHECK (unit IN ('kg', 'unité'));
        
        -- Créer un index pour optimiser les requêtes sur unit
        CREATE INDEX IF NOT EXISTS idx_products_unit ON public.products(unit);
        
        RAISE NOTICE 'Colonne unit ajoutée à la table products';
    ELSE
        RAISE NOTICE 'Colonne unit existe déjà dans la table products';
    END IF;
END $$;

-- Vérifier et ajouter la colonne merchant_id si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'merchant_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.products 
        ADD COLUMN merchant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        
        -- Créer un index pour optimiser les requêtes sur merchant_id
        CREATE INDEX IF NOT EXISTS idx_products_merchant_id ON public.products(merchant_id);
        
        RAISE NOTICE 'Colonne merchant_id ajoutée à la table products';
    ELSE
        RAISE NOTICE 'Colonne merchant_id existe déjà dans la table products';
    END IF;
END $$;

-- Fonction pour créer un produit avec image
CREATE OR REPLACE FUNCTION create_product_with_image(
    p_nom TEXT,
    p_categorie TEXT,
    p_prix DECIMAL(10,2),
    p_stock INTEGER DEFAULT 0,
    p_unite TEXT DEFAULT 'unité',
    p_description TEXT DEFAULT NULL,
    p_image_url TEXT DEFAULT NULL,
    p_merchant_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_product_id UUID;
    v_merchant_id UUID;
    v_result JSON;
BEGIN
    -- Fixer le search_path pour éviter le schema shadowing
    SET LOCAL search_path = pg_temp, public;
    
    -- Vérifier que l'utilisateur est connecté
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Utilisateur non authentifié';
    END IF;
    
    -- Utiliser le merchant_id fourni ou celui de l'utilisateur connecté
    v_merchant_id := COALESCE(p_merchant_id, auth.uid());
    
    -- Vérifier que l'utilisateur est un marchand
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role IN ('merchant', 'store_manager', 'marchand')
    ) THEN
        RAISE EXCEPTION 'Accès refusé : utilisateur non autorisé';
    END IF;
    
    -- Insérer le produit
    INSERT INTO public.products (
        name,
        category,
        price,
        stock,
        unit,
        description,
        image_url,
        merchant_id,
        is_active,
        created_at,
        updated_at
    ) VALUES (
        p_nom,
        p_categorie,
        p_prix,
        p_stock,
        p_unite,
        p_description,
        p_image_url,
        v_merchant_id,
        true,
        NOW(),
        NOW()
    ) RETURNING id INTO v_product_id;
    
    -- Retourner les informations du produit créé
    SELECT json_build_object(
        'id', v_product_id,
        'name', p_nom,
        'category', p_categorie,
        'price', p_prix,
        'stock', p_stock,
        'unit', p_unite,
        'description', p_description,
        'image_url', p_image_url,
        'merchant_id', v_merchant_id,
        'is_active', true,
        'created_at', NOW()
    ) INTO v_result;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour récupérer les produits d'un marchand
CREATE OR REPLACE FUNCTION get_merchant_products()
RETURNS TABLE (
    id UUID,
    name TEXT,
    category TEXT,
    price DECIMAL(10,2),
    stock INTEGER,
    unit TEXT,
    description TEXT,
    image_url TEXT,
    is_active BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    -- Fixer le search_path pour éviter le schema shadowing
    SET LOCAL search_path = pg_temp, public;
    
    -- Vérifier que l'utilisateur est connecté
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Utilisateur non authentifié';
    END IF;
    
    -- Vérifier que l'utilisateur est un marchand
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role IN ('merchant', 'store_manager', 'marchand')
    ) THEN
        RAISE EXCEPTION 'Accès refusé : utilisateur non autorisé';
    END IF;
    
    -- Retourner les produits du marchand
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.category,
        p.price,
        p.stock,
        p.unit,
        p.description,
        p.image_url,
        p.is_active,
        p.created_at,
        p.updated_at
    FROM public.products p
    WHERE p.merchant_id = auth.uid()
    ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mettre à jour les politiques RLS pour inclure merchant_id
DROP POLICY IF EXISTS "Merchants can manage their own products" ON public.products;

CREATE POLICY "Merchants can manage their own products" ON public.products
    FOR ALL USING (
        merchant_id = auth.uid() OR
        store_id IN (
            SELECT id FROM public.stores 
            WHERE owner_id = auth.uid()
        )
    );

-- Ajouter une politique spécifique pour les produits par merchant_id
CREATE POLICY "Merchants can manage products by merchant_id" ON public.products
    FOR ALL USING (merchant_id = auth.uid());

-- Commentaires pour documenter les nouvelles colonnes
COMMENT ON COLUMN public.products.image_url IS 'URL de l\'image du produit (peut être générée automatiquement)';
COMMENT ON COLUMN public.products.unit IS 'Unité de mesure du produit (kg ou unité)';
COMMENT ON COLUMN public.products.merchant_id IS 'ID du marchand propriétaire du produit';

-- Commentaires pour les nouvelles fonctions
COMMENT ON FUNCTION create_product_with_image IS 'Crée un nouveau produit avec image pour un marchand';
COMMENT ON FUNCTION get_merchant_products IS 'Récupère tous les produits d\'un marchand';

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE 'Migration products améliorée terminée avec succès!';
    RAISE NOTICE 'Colonnes ajoutées/vérifiées: image_url, unit, merchant_id';
    RAISE NOTICE 'Fonctions créées: create_product_with_image, get_merchant_products';
    RAISE NOTICE 'Politiques RLS mises à jour pour supporter merchant_id';
END $$;
