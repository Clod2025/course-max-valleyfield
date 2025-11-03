-- Migration pour ajouter les types de marchands à la table profiles
-- Date: 2025-01-15

-- Ajouter les colonnes type_compte et type_marchand si elles n'existent pas
DO $$ 
BEGIN
    -- Ajouter type_compte si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'type_compte'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN type_compte TEXT DEFAULT 'Client';
    END IF;

    -- Ajouter type_marchand si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'type_marchand'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN type_marchand TEXT;
    END IF;
END $$;

-- Ajouter des contraintes pour valider les valeurs
DO $$
BEGIN
    -- Contrainte pour type_compte
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'profiles' 
        AND constraint_name = 'check_type_compte'
    ) THEN
        ALTER TABLE public.profiles 
        ADD CONSTRAINT check_type_compte 
        CHECK (type_compte IN ('Client', 'Marchand', 'Livreur', 'Admin'));
    END IF;

    -- Contrainte pour type_marchand
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'profiles' 
        AND constraint_name = 'check_type_marchand'
    ) THEN
        ALTER TABLE public.profiles 
        ADD CONSTRAINT check_type_marchand 
        CHECK (type_marchand IS NULL OR type_marchand IN ('Supermarché', 'Pharmacie', 'Restaurant', 'Épicerie'));
    END IF;
END $$;

-- Mettre à jour les profils existants selon leur rôle
UPDATE public.profiles 
SET type_compte = CASE 
    WHEN role IN ('merchant', 'store_manager') THEN 'Marchand'
    WHEN role = 'livreur' THEN 'Livreur'
    WHEN role = 'admin' THEN 'Admin'
    ELSE 'Client'
END
WHERE type_compte IS NULL OR type_compte = 'Client';

-- Définir le type de marchand par défaut pour les marchands existants
UPDATE public.profiles 
SET type_marchand = 'Supermarché'
WHERE (role IN ('merchant', 'store_manager') OR type_compte = 'Marchand') 
AND type_marchand IS NULL;

-- Créer des index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_profiles_type_compte ON public.profiles(type_compte);
CREATE INDEX IF NOT EXISTS idx_profiles_type_marchand ON public.profiles(type_marchand);

-- Mettre à jour la fonction handle_new_user pour inclure les nouveaux champs
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (
        user_id, 
        email, 
        first_name, 
        last_name, 
        role,
        type_compte,
        type_marchand
    )
    VALUES (
        NEW.id, 
        NEW.email,
        NEW.raw_user_meta_data ->> 'first_name',
        NEW.raw_user_meta_data ->> 'last_name',
        COALESCE(NEW.raw_user_meta_data ->> 'role', 'client'),
        COALESCE(NEW.raw_user_meta_data ->> 'type_compte', 'Client'),
        NEW.raw_user_meta_data ->> 'type_marchand'
    );
    RETURN NEW;
END;
$$;

-- Créer une vue pour faciliter les requêtes sur les marchands par type
CREATE OR REPLACE VIEW public.merchants_by_type AS
SELECT 
    p.id,
    p.user_id,
    p.email,
    p.first_name,
    p.last_name,
    p.phone,
    p.address,
    p.city,
    p.postal_code,
    p.type_marchand,
    p.is_active,
    p.created_at,
    p.updated_at
FROM public.profiles p
WHERE p.type_compte = 'Marchand' 
AND p.is_active = true;

-- Activer RLS sur la vue
ALTER VIEW public.merchants_by_type SET (security_invoker = on);

-- Créer des politiques RLS pour la vue
CREATE POLICY "Merchants can view their own data" ON public.merchants_by_type
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all merchants" ON public.merchants_by_type
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() AND type_compte = 'Admin'
        )
    );

-- Insérer des données de test pour chaque type de marchand (optionnel)
-- Décommentez si vous voulez des données de test
/*
INSERT INTO public.profiles (
    user_id, 
    email, 
    first_name, 
    last_name, 
    role, 
    type_compte, 
    type_marchand,
    is_active
) VALUES 
(
    gen_random_uuid(),
    'test.supermarche@example.com',
    'Test',
    'Supermarché',
    'merchant',
    'Marchand',
    'Supermarché',
    true
),
(
    gen_random_uuid(),
    'test.pharmacie@example.com',
    'Test',
    'Pharmacie',
    'merchant',
    'Marchand',
    'Pharmacie',
    true
),
(
    gen_random_uuid(),
    'test.restaurant@example.com',
    'Test',
    'Restaurant',
    'merchant',
    'Marchand',
    'Restaurant',
    true
),
(
    gen_random_uuid(),
    'test.epicerie@example.com',
    'Test',
    'Épicerie',
    'merchant',
    'Marchand',
    'Épicerie',
    true
);
*/

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE 'Migration des types de marchands terminée avec succès!';
    RAISE NOTICE 'Colonnes ajoutées: type_compte, type_marchand';
    RAISE NOTICE 'Contraintes créées pour valider les valeurs';
    RAISE NOTICE 'Index créés pour optimiser les performances';
    RAISE NOTICE 'Fonction handle_new_user mise à jour';
    RAISE NOTICE 'Vue merchants_by_type créée avec RLS';
    RAISE NOTICE 'Profils existants mis à jour selon leur rôle';
END $$;
