-- Migration corrigée pour la table products
-- Ajouter les colonnes manquantes: is_active et stock
-- Date: 2025-01-15 (version corrigée)

-- Ajouter la colonne is_active si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'is_active'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.products 
        ADD COLUMN is_active BOOLEAN DEFAULT true;
        
        -- Mettre à jour tous les produits existants pour qu'ils soient actifs
        UPDATE public.products SET is_active = true WHERE is_active IS NULL;
        
        -- Créer un index pour optimiser les requêtes sur is_active
        CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
        
        RAISE NOTICE 'Colonne is_active ajoutée à la table products';
    ELSE
        RAISE NOTICE 'Colonne is_active existe déjà dans la table products';
    END IF;
END $$;

-- Ajouter la colonne stock si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'stock'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.products 
        ADD COLUMN stock INTEGER DEFAULT 0 CHECK (stock >= 0);
        
        -- Mettre à jour tous les produits existants avec un stock par défaut
        UPDATE public.products SET stock = 10 WHERE stock IS NULL;
        
        -- Créer un index pour optimiser les requêtes sur stock
        CREATE INDEX IF NOT EXISTS idx_products_stock ON public.products(stock);
        
        RAISE NOTICE 'Colonne stock ajoutée à la table products';
    ELSE
        RAISE NOTICE 'Colonne stock existe déjà dans la table products';
    END IF;
END $$;

-- Ajouter la colonne owner_id si elle n'existe pas (pour la relation avec les marchands)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'owner_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.products 
        ADD COLUMN owner_id UUID REFERENCES public.profiles(user_id);
        
        -- Créer un index pour optimiser les requêtes sur owner_id
        CREATE INDEX IF NOT EXISTS idx_products_owner_id ON public.products(owner_id);
        
        RAISE NOTICE 'Colonne owner_id ajoutée à la table products';
    ELSE
        RAISE NOTICE 'Colonne owner_id existe déjà dans la table products';
    END IF;
END $$;

-- Mettre à jour les politiques RLS pour inclure is_active
-- Supprimer l'ancienne politique si elle existe
DROP POLICY IF EXISTS "Customers can view active products" ON public.products;

-- Créer la nouvelle politique avec is_active
CREATE POLICY "Customers can view active products" ON public.products
    FOR SELECT USING (is_active = true);

-- Mettre à jour la politique pour les marchands
DROP POLICY IF EXISTS "Merchants can manage their own products" ON public.products;

CREATE POLICY "Merchants can manage their own products" ON public.products
    FOR ALL USING (
        store_id IN (
            SELECT id FROM public.stores 
            WHERE owner_id = auth.uid()
        )
    );

-- Ajouter une politique pour les propriétaires de produits
CREATE POLICY "Product owners can manage their products" ON public.products
    FOR ALL USING (owner_id = auth.uid());

-- Fonction pour mettre à jour le stock d'un produit
CREATE OR REPLACE FUNCTION public.update_product_stock(
    product_id uuid,
    new_stock integer
)
RETURNS boolean AS $$
BEGIN
    -- Vérifier que le stock n'est pas négatif
    IF new_stock < 0 THEN
        RAISE EXCEPTION 'Le stock ne peut pas être négatif';
    END IF;
    
    -- Mettre à jour le stock
    UPDATE public.products
    SET stock = new_stock,
        updated_at = timezone('utc'::text, now())
    WHERE id = product_id AND is_active = true;
    
    -- Vérifier si la mise à jour a réussi
    IF FOUND THEN
        RETURN true;
    ELSE
        RAISE EXCEPTION 'Produit non trouvé ou inactif';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour décrémenter le stock (version améliorée)
CREATE OR REPLACE FUNCTION public.decrement_product_stock(
    product_id uuid,
    quantity integer
)
RETURNS boolean AS $$
DECLARE
    current_stock integer;
BEGIN
    -- Vérifier le stock actuel
    SELECT stock INTO current_stock
    FROM public.products
    WHERE id = product_id AND is_active = true;
    
    -- Vérifier si le produit existe
    IF current_stock IS NULL THEN
        RAISE EXCEPTION 'Produit non trouvé ou inactif';
    END IF;
    
    -- Vérifier si le stock est suffisant
    IF current_stock < quantity THEN
        RAISE EXCEPTION 'Stock insuffisant. Stock disponible: %', current_stock;
    END IF;
    
    -- Décrémenter le stock
    UPDATE public.products
    SET stock = stock - quantity,
        updated_at = timezone('utc'::text, now())
    WHERE id = product_id;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour incrémenter le stock (version améliorée)
CREATE OR REPLACE FUNCTION public.increment_product_stock(
    product_id uuid,
    quantity integer
)
RETURNS boolean AS $$
BEGIN
    -- Vérifier que la quantité est positive
    IF quantity <= 0 THEN
        RAISE EXCEPTION 'La quantité doit être positive';
    END IF;
    
    -- Incrémenter le stock
    UPDATE public.products
    SET stock = stock + quantity,
        updated_at = timezone('utc'::text, now())
    WHERE id = product_id AND is_active = true;
    
    -- Vérifier si la mise à jour a réussi
    IF FOUND THEN
        RETURN true;
    ELSE
        RAISE EXCEPTION 'Produit non trouvé ou inactif';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaires pour documenter les colonnes ajoutées
COMMENT ON COLUMN public.products.is_active IS 'Indique si le produit est actif et disponible à la vente';
COMMENT ON COLUMN public.products.stock IS 'Quantité en stock du produit (doit être >= 0)';
COMMENT ON COLUMN public.products.owner_id IS 'ID du propriétaire/marchand du produit';

-- Créer une vue pour les produits actifs avec informations du magasin (SANS politique RLS)
CREATE OR REPLACE VIEW public.active_products_with_store AS
SELECT 
    p.id,
    p.name,
    p.description,
    p.category,
    p.price,
    p.unit,
    p.barcode,
    p.image_url,
    p.weight,
    p.stock,
    p.is_active,
    p.store_id,
    p.owner_id,
    p.created_at,
    p.updated_at,
    s.name as store_name,
    s.address as store_address,
    s.city as store_city,
    s.phone as store_phone,
    s.email as store_email,
    s.latitude as store_latitude,
    s.longitude as store_longitude,
    s.is_active as store_is_active
FROM public.products p
JOIN public.stores s ON p.store_id = s.id
WHERE p.is_active = true AND s.is_active = true;

-- Insérer des données de test si la table est vide
INSERT INTO public.products (
    name, 
    description, 
    category, 
    price, 
    unit, 
    stock, 
    is_active, 
    store_id
)
SELECT 
    'Produit Test ' || generate_series,
    'Description du produit test ' || generate_series,
    'test',
    9.99 + (generate_series * 0.50),
    'unité',
    10 + generate_series,
    true,
    (SELECT id FROM public.stores LIMIT 1)
FROM generate_series(1, 5)
WHERE NOT EXISTS (SELECT 1 FROM public.products LIMIT 1);

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE 'Migration corrigée terminée avec succès!';
    RAISE NOTICE 'Colonnes ajoutées: is_active, stock, owner_id';
    RAISE NOTICE 'Fonctions créées: update_product_stock, decrement_product_stock, increment_product_stock';
    RAISE NOTICE 'Vue créée: active_products_with_store (sans politique RLS)';
    RAISE NOTICE 'Politiques RLS mises à jour sur la table products';
END $$;
