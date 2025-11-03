-- Migration finale pour corriger la structure de la table profiles
-- Date: 2025-01-15

-- 1. Vérifier la structure actuelle
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Supprimer les contraintes existantes qui pourraient causer des problèmes
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_pkey;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_email_key;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_key;

-- 3. Recréer la table avec la structure correcte
DROP TABLE IF EXISTS public.profiles CASCADE;

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  role TEXT DEFAULT 'client' CHECK (role IN ('client', 'store_manager', 'admin', 'livreur')),
  type_compte TEXT DEFAULT 'Client' CHECK (type_compte IN ('Client', 'Marchand', 'Livreur', 'Admin')),
  type_marchand TEXT CHECK (type_marchand IN ('Supermarché', 'Pharmacie', 'Restaurant', 'Épicerie')),
  is_active BOOLEAN DEFAULT true,
  avatar_url TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  territory TEXT,
  region TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Créer un index unique sur user_id
CREATE UNIQUE INDEX IF NOT EXISTS profiles_user_id_idx ON public.profiles (user_id);

-- 5. Insérer les données des utilisateurs marchands
INSERT INTO public.profiles (
  id,
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
    'c36b0149-73ef-47c4-b0ca-1f6f51ae6e53',
    'ac1130d8-081e-40e0-8398-1e02d32d93ea',
    'engligoclervil9@gmail.com',
    'Engligo',
    'Clervil',
    'store_manager',
    'Marchand',
    'Supermarché',
    true
  ),
  (
    gen_random_uuid(),
    gen_random_uuid(),
    'clovensyohan2020@gmail.com',
    'Cloven',
    'Syohan',
    'store_manager',
    'Marchand',
    'Pharmacie',
    true
  ),
  (
    gen_random_uuid(),
    gen_random_uuid(),
    'biduellodieujuste2@gmail.com',
    'Biduelle',
    'Dieujuste',
    'store_manager',
    'Marchand',
    'Restaurant',
    true
  ),
  (
    gen_random_uuid(),
    gen_random_uuid(),
    'epicerie.marchand@gmail.com',
    'Épicerie',
    'Marchand',
    'store_manager',
    'Marchand',
    'Épicerie',
    true
  )
ON CONFLICT (email) 
DO UPDATE SET
  role = EXCLUDED.role,
  type_compte = EXCLUDED.type_compte,
  type_marchand = EXCLUDED.type_marchand,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- 6. Activer RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 7. Créer les politiques RLS
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id OR auth.uid() = user_id);

-- 8. Créer un trigger pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 9. Vérifier les données
SELECT 
  id,
  user_id,
  email,
  role,
  type_compte,
  type_marchand,
  first_name,
  last_name,
  is_active,
  created_at,
  updated_at
FROM public.profiles 
ORDER BY type_marchand, email;

-- 10. Message de confirmation
DO $$
BEGIN
    RAISE NOTICE 'Table profiles recréée avec succès!';
    RAISE NOTICE 'Structure corrigée et données insérées';
    RAISE NOTICE 'RLS activé et politiques créées';
    RAISE NOTICE 'Trigger updated_at créé';
END $$;
