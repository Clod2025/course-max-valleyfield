-- Créer la table products
CREATE TABLE IF NOT EXISTS public.products (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    image TEXT,
    store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Créer un index pour la recherche rapide par nom
CREATE INDEX IF NOT EXISTS idx_products_name ON public.products USING gin(to_tsvector('french', name));

-- Créer un index pour la recherche par catégorie
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);

-- Créer un index pour la recherche par store
CREATE INDEX IF NOT EXISTS idx_products_store_id ON public.products(store_id);

-- Créer un index composite pour la recherche par store et nom
CREATE INDEX IF NOT EXISTS idx_products_store_name ON public.products(store_id, name);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour updated_at
CREATE TRIGGER trigger_update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION update_products_updated_at();

-- Fonction pour décrémenter le stock
CREATE OR REPLACE FUNCTION decrement_product_stock(
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
    
    -- Vérifier si le stock est suffisant
    IF current_stock IS NULL THEN
        RAISE EXCEPTION 'Produit non trouvé ou inactif';
    END IF;
    
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
$$ LANGUAGE plpgsql;

-- Fonction pour incrémenter le stock
CREATE OR REPLACE FUNCTION increment_product_stock(
    product_id uuid,
    quantity integer
)
RETURNS boolean AS $$
BEGIN
    UPDATE public.products
    SET stock = stock + quantity,
        updated_at = timezone('utc'::text, now())
    WHERE id = product_id AND is_active = true;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- RLS (Row Level Security)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Politique pour les marchands (peuvent voir/modifier leurs produits)
CREATE POLICY "Merchants can manage their own products" ON public.products
    FOR ALL USING (
        store_id IN (
            SELECT id FROM public.stores 
            WHERE owner_id = auth.uid()
        )
    );

-- Politique pour les clients (peuvent voir les produits actifs)
CREATE POLICY "Customers can view active products" ON public.products
    FOR SELECT USING (is_active = true);

-- Politique pour les admins (accès complet)
CREATE POLICY "Admins can manage all products" ON public.products
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
