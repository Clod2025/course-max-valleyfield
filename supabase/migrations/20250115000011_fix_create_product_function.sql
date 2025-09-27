-- Migration pour corriger la fonction create_product_with_image
-- Date: 2025-01-15

-- Vérifier et corriger la structure de la table products
DO $$ 
BEGIN
    -- Ajouter la colonne nom si elle n'existe pas (au lieu de name)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'nom'
        AND table_schema = 'public'
    ) THEN
        -- Renommer name en nom si name existe
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'products' 
            AND column_name = 'name'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE public.products RENAME COLUMN name TO nom;
        ELSE
            ALTER TABLE public.products ADD COLUMN nom TEXT NOT NULL DEFAULT '';
        END IF;
        
        RAISE NOTICE 'Colonne nom ajoutée/renommée dans la table products';
    END IF;
    
    -- Ajouter la colonne categorie si elle n'existe pas (au lieu de category)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'categorie'
        AND table_schema = 'public'
    ) THEN
        -- Renommer category en categorie si category existe
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'products' 
            AND column_name = 'category'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE public.products RENAME COLUMN category TO categorie;
        ELSE
            ALTER TABLE public.products ADD COLUMN categorie TEXT NOT NULL DEFAULT '';
        END IF;
        
        RAISE NOTICE 'Colonne categorie ajoutée/renommée dans la table products';
    END IF;
    
    -- Ajouter la colonne prix si elle n'existe pas (au lieu de price)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'prix'
        AND table_schema = 'public'
    ) THEN
        -- Renommer price en prix si price existe
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'products' 
            AND column_name = 'price'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE public.products RENAME COLUMN price TO prix;
        ELSE
            ALTER TABLE public.products ADD COLUMN prix DECIMAL(10,2) NOT NULL DEFAULT 0;
        END IF;
        
        RAISE NOTICE 'Colonne prix ajoutée/renommée dans la table products';
    END IF;
    
    -- Ajouter la colonne unite si elle n'existe pas (au lieu de unit)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'unite'
        AND table_schema = 'public'
    ) THEN
        -- Renommer unit en unite si unit existe
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'products' 
            AND column_name = 'unit'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE public.products RENAME COLUMN unit TO unite;
        ELSE
            ALTER TABLE public.products ADD COLUMN unite TEXT DEFAULT 'unité' CHECK (unite IN ('kg', 'unité'));
        END IF;
        
        RAISE NOTICE 'Colonne unite ajoutée/renommée dans la table products';
    END IF;
    
    -- Ajouter la colonne image_url si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'image_url'
        AND table_schema = 'public'
    ) THEN
        -- Renommer image en image_url si image existe
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'products' 
            AND column_name = 'image'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE public.products RENAME COLUMN image TO image_url;
        ELSE
            ALTER TABLE public.products ADD COLUMN image_url TEXT;
        END IF;
        
        RAISE NOTICE 'Colonne image_url ajoutée/renommée dans la table products';
    END IF;
    
    -- Ajouter la colonne merchant_id si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'merchant_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.products ADD COLUMN merchant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        RAISE NOTICE 'Colonne merchant_id ajoutée dans la table products';
    END IF;
    
    -- Ajouter la colonne created_at si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'created_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.products ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Colonne created_at ajoutée dans la table products';
    END IF;
END $$;

-- Créer ou remplacer la fonction create_product_with_image
CREATE OR REPLACE FUNCTION public.create_product_with_image(
    p_nom TEXT,
    p_categorie TEXT,
    p_prix NUMERIC,
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
    
    -- Vérifier que l'utilisateur est un marchand (optionnel pour la démo)
    -- IF NOT EXISTS (
    --     SELECT 1 FROM public.profiles 
    --     WHERE id = auth.uid() AND role IN ('merchant', 'store_manager', 'marchand')
    -- ) THEN
    --     RAISE EXCEPTION 'Accès refusé : utilisateur non autorisé';
    -- END IF;
    
    -- Insérer le produit
    INSERT INTO public.products (
        nom,
        categorie,
        prix,
        stock,
        unite,
        description,
        image_url,
        merchant_id,
        is_active,
        created_at
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
        NOW()
    ) RETURNING id INTO v_product_id;
    
    -- Retourner les informations du produit créé
    SELECT json_build_object(
        'id', v_product_id,
        'nom', p_nom,
        'categorie', p_categorie,
        'prix', p_prix,
        'stock', p_stock,
        'unite', p_unite,
        'description', p_description,
        'image_url', p_image_url,
        'merchant_id', v_merchant_id,
        'is_active', true,
        'created_at', NOW()
    ) INTO v_result;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Donner les permissions d'exécution à authenticated
GRANT EXECUTE ON FUNCTION public.create_product_with_image TO authenticated;

-- Créer une fonction pour récupérer les produits d'un marchand
CREATE OR REPLACE FUNCTION public.get_merchant_products()
RETURNS TABLE (
    id UUID,
    nom TEXT,
    categorie TEXT,
    prix NUMERIC,
    stock INTEGER,
    unite TEXT,
    description TEXT,
    image_url TEXT,
    is_active BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    -- Fixer le search_path pour éviter le schema shadowing
    SET LOCAL search_path = pg_temp, public;
    
    -- Vérifier que l'utilisateur est connecté
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Utilisateur non authentifié';
    END IF;
    
    -- Retourner les produits du marchand
    RETURN QUERY
    SELECT 
        p.id,
        p.nom,
        p.categorie,
        p.prix,
        p.stock,
        p.unite,
        p.description,
        p.image_url,
        p.is_active,
        p.created_at
    FROM public.products p
    WHERE p.merchant_id = auth.uid()
    ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Donner les permissions d'exécution à authenticated
GRANT EXECUTE ON FUNCTION public.get_merchant_products TO authenticated;

-- Mettre à jour les politiques RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Merchants can manage their own products" ON public.products;
DROP POLICY IF EXISTS "Customers can view active products" ON public.products;
DROP POLICY IF EXISTS "Admins can manage all products" ON public.products;
DROP POLICY IF EXISTS "Merchants can manage products by merchant_id" ON public.products;

-- Créer les nouvelles politiques
CREATE POLICY "Users can manage their own products" ON public.products
    FOR ALL USING (merchant_id = auth.uid());

CREATE POLICY "Users can view active products" ON public.products
    FOR SELECT USING (is_active = true);

-- Commentaires
COMMENT ON FUNCTION public.create_product_with_image IS 'Crée un nouveau produit avec image pour un marchand';
COMMENT ON FUNCTION public.get_merchant_products IS 'Récupère tous les produits d\'un marchand';

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE 'Migration de correction terminée avec succès!';
    RAISE NOTICE 'Structure de la table products corrigée';
    RAISE NOTICE 'Fonction create_product_with_image créée/corrigée';
    RAISE NOTICE 'Permissions accordées au rôle authenticated';
    RAISE NOTICE 'Politiques RLS mises à jour';
END $$;
