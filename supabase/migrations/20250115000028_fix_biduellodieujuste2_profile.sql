-- Migration pour configurer biduellodieujuste2@gmail.com pour l'interface Restaurant
-- Date: 2025-01-15

-- Vérifier si le profil existe
SELECT 
  id,
  email,
  role,
  type_compte,
  type_marchand,
  first_name,
  last_name,
  is_active
FROM public.profiles 
WHERE email = 'biduellodieujuste2@gmail.com';

-- Mettre à jour ou créer le profil pour biduellodieujuste2@gmail.com
INSERT INTO public.profiles (
  user_id,
  email,
  first_name,
  last_name,
  role,
  type_compte,
  type_marchand,
  is_active
) VALUES (
  gen_random_uuid(), -- user_id temporaire, sera mis à jour lors de la connexion
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

-- Vérifier la mise à jour
SELECT 
  id,
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
WHERE email = 'biduellodieujuste2@gmail.com';

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE 'Profil de biduellodieujuste2@gmail.com configuré pour l''interface Restaurant!';
    RAISE NOTICE 'Role: store_manager';
    RAISE NOTICE 'Type compte: Marchand';
    RAISE NOTICE 'Type marchand: Restaurant';
    RAISE NOTICE 'Redirection vers: /interface-restaurant';
END $$;
