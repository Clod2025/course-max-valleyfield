-- Migration pour corriger la structure de la table profiles et les données existantes
-- Date: 2025-01-15

-- 1. Vérifier la structure actuelle de la table profiles
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Vérifier les données existantes
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
  created_at
FROM public.profiles 
WHERE email = 'clovensyohan2020@gmail.com';

-- 3. Corriger la structure si nécessaire
-- S'assurer que la table a les bonnes colonnes
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS email TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'client',
ADD COLUMN IF NOT EXISTS type_compte TEXT DEFAULT 'Client',
ADD COLUMN IF NOT EXISTS type_marchand TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS postal_code TEXT,
ADD COLUMN IF NOT EXISTS territory TEXT,
ADD COLUMN IF NOT EXISTS region TEXT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- 4. Mettre à jour le profil de clovensyohan2020@gmail.com
UPDATE public.profiles 
SET 
  role = 'store_manager',
  type_compte = 'Marchand',
  type_marchand = 'Pharmacie',
  is_active = true,
  updated_at = now()
WHERE email = 'clovensyohan2020@gmail.com';

-- 5. Si le profil n'existe pas, le créer
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
) 
SELECT 
  gen_random_uuid(),
  au.id,
  'clovensyohan2020@gmail.com',
  'Cloven',
  'Syohan',
  'store_manager',
  'Marchand',
  'Pharmacie',
  true
FROM auth.users au
WHERE au.email = 'clovensyohan2020@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.email = 'clovensyohan2020@gmail.com'
  );

-- 6. Vérifier le résultat
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
WHERE email = 'clovensyohan2020@gmail.com';

-- 7. Activer RLS si ce n'est pas déjà fait
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 8. Créer les politiques RLS
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id OR auth.uid() = user_id);

-- 9. Message de confirmation
DO $$
BEGIN
    RAISE NOTICE 'Structure de la table profiles corrigée!';
    RAISE NOTICE 'Profil de clovensyohan2020@gmail.com configuré pour Pharmacie';
    RAISE NOTICE 'RLS activé et politiques créées';
END $$;
