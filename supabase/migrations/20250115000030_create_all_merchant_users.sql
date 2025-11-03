-- Migration pour créer tous les utilisateurs marchands pour chaque interface
-- Date: 2025-01-15

-- 1. Vérifier les utilisateurs existants
SELECT 
  email,
  role,
  type_compte,
  type_marchand,
  first_name,
  last_name,
  is_active
FROM public.profiles 
WHERE type_compte = 'Marchand' OR role = 'store_manager'
ORDER BY type_marchand, email;

-- 2. Créer les utilisateurs pour chaque interface marchand

-- SUPERMARCHÉ - engligoclervil9@gmail.com (déjà configuré)
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
) VALUES (
  gen_random_uuid(),
  gen_random_uuid(),
  'engligoclervil9@gmail.com',
  'Engligo',
  'Clervil',
  'store_manager',
  'Marchand',
  'Supermarché',
  true
)
ON CONFLICT (email) 
DO UPDATE SET
  role = 'store_manager',
  type_compte = 'Marchand',
  type_marchand = 'Supermarché',
  is_active = true,
  updated_at = now();

-- PHARMACIE - clovensyohan2020@gmail.com (déjà configuré)
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
) VALUES (
  gen_random_uuid(),
  gen_random_uuid(),
  'clovensyohan2020@gmail.com',
  'Cloven',
  'Syohan',
  'store_manager',
  'Marchand',
  'Pharmacie',
  true
)
ON CONFLICT (email) 
DO UPDATE SET
  role = 'store_manager',
  type_compte = 'Marchand',
  type_marchand = 'Pharmacie',
  is_active = true,
  updated_at = now();

-- RESTAURANT - biduellodieujuste2@gmail.com (déjà configuré)
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
) VALUES (
  gen_random_uuid(),
  gen_random_uuid(),
  'biduellodieujuste2@gmail.com',
  'Biduelle',
  'Dieujuste',
  'store_manager',
  'Marchand',
  'Restaurant',
  true
)
ON CONFLICT (email) 
DO UPDATE SET
  role = 'store_manager',
  type_compte = 'Marchand',
  type_marchand = 'Restaurant',
  is_active = true,
  updated_at = now();

-- ÉPICERIE - Ajouter un utilisateur pour l'interface Épicerie
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
) VALUES (
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
  role = 'store_manager',
  type_compte = 'Marchand',
  type_marchand = 'Épicerie',
  is_active = true,
  updated_at = now();

-- 3. Vérifier tous les utilisateurs marchands créés
SELECT 
  email,
  role,
  type_compte,
  type_marchand,
  first_name,
  last_name,
  is_active,
  created_at
FROM public.profiles 
WHERE type_compte = 'Marchand'
ORDER BY type_marchand, email;

-- 4. Résumé des interfaces configurées
DO $$
DECLARE
    supermarche_count INTEGER;
    pharmacie_count INTEGER;
    restaurant_count INTEGER;
    epicerie_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO supermarche_count 
    FROM public.profiles 
    WHERE type_marchand = 'Supermarché' AND type_compte = 'Marchand';
    
    SELECT COUNT(*) INTO pharmacie_count 
    FROM public.profiles 
    WHERE type_marchand = 'Pharmacie' AND type_compte = 'Marchand';
    
    SELECT COUNT(*) INTO restaurant_count 
    FROM public.profiles 
    WHERE type_marchand = 'Restaurant' AND type_compte = 'Marchand';
    
    SELECT COUNT(*) INTO epicerie_count 
    FROM public.profiles 
    WHERE type_marchand = 'Épicerie' AND type_compte = 'Marchand';
    
    RAISE NOTICE '=== RÉSUMÉ DES INTERFACES MARCHAND ===';
    RAISE NOTICE 'Supermarché: % utilisateur(s)', supermarche_count;
    RAISE NOTICE 'Pharmacie: % utilisateur(s)', pharmacie_count;
    RAISE NOTICE 'Restaurant: % utilisateur(s)', restaurant_count;
    RAISE NOTICE 'Épicerie: % utilisateur(s)', epicerie_count;
    RAISE NOTICE '=====================================';
END $$;
