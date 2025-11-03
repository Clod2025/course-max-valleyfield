-- Migration pour corriger la structure de la table profiles
-- Date: 2025-01-15

-- Vérifier et corriger la structure de la table profiles
DO $$ 
BEGIN
    -- Vérifier si la colonne 'id' existe et est la clé primaire
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'id' 
        AND is_nullable = 'NO'
    ) THEN
        -- Si 'id' n'existe pas, l'ajouter comme clé primaire
        ALTER TABLE public.profiles ADD COLUMN id UUID PRIMARY KEY DEFAULT gen_random_uuid();
    END IF;

    -- Vérifier si la colonne 'user_id' existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'user_id'
    ) THEN
        -- Si 'user_id' n'existe pas, l'ajouter
        ALTER TABLE public.profiles ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    -- S'assurer que 'user_id' référence auth.users.id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'profiles' 
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name LIKE '%user_id%'
    ) THEN
        -- Ajouter la contrainte de clé étrangère
        ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Ajouter les colonnes manquantes si elles n'existent pas
DO $$ 
BEGIN
    -- Ajouter email si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'email'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN email TEXT;
    END IF;

    -- Ajouter first_name si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'first_name'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN first_name TEXT;
    END IF;

    -- Ajouter last_name si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'last_name'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN last_name TEXT;
    END IF;

    -- Ajouter phone si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'phone'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN phone TEXT;
    END IF;

    -- Ajouter address si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'address'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN address TEXT;
    END IF;

    -- Ajouter city si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'city'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN city TEXT;
    END IF;

    -- Ajouter postal_code si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'postal_code'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN postal_code TEXT;
    END IF;

    -- Ajouter role si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'role'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'client';
    END IF;

    -- Ajouter is_active si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'is_active'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;

    -- Ajouter avatar_url si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'avatar_url'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;
    END IF;

    -- Ajouter created_at si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;

    -- Ajouter updated_at si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Créer des index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);

-- Activer RLS si ce n'est pas déjà fait
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques RLS
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Créer les nouvelles politiques RLS
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Créer ou remplacer la fonction handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (user_id, email, first_name, last_name)
    VALUES (
        NEW.id, 
        NEW.email,
        NEW.raw_user_meta_data ->> 'first_name',
        NEW.raw_user_meta_data ->> 'last_name'
    );
    RETURN NEW;
END;
$$;

-- Créer le trigger si il n'existe pas
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Créer la fonction update_updated_at_column si elle n'existe pas
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger pour updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE 'Structure de la table profiles corrigée avec succès!';
    RAISE NOTICE 'Colonnes vérifiées: id, user_id, email, first_name, last_name, phone, address, city, postal_code, role, is_active, avatar_url, created_at, updated_at';
    RAISE NOTICE 'Index créés pour optimiser les requêtes';
    RAISE NOTICE 'RLS activé avec nouvelles politiques';
    RAISE NOTICE 'Fonction handle_new_user mise à jour';
    RAISE NOTICE 'Trigger on_auth_user_created créé';
END $$;
