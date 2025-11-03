-- Migration pour corriger le profil de engligoclervil9@gmail.com
-- Date: 2025-01-15

-- Mettre à jour le profil de engligoclervil9@gmail.com
UPDATE public.profiles 
SET 
  type_compte = 'Marchand',
  type_marchand = 'Supermarché',
  role = 'store_manager'
WHERE email = 'engligoclervil9@gmail.com';

-- Vérifier la mise à jour
SELECT 
  id,
  email,
  role,
  type_compte,
  type_marchand,
  first_name,
  last_name
FROM public.profiles 
WHERE email = 'engligoclervil9@gmail.com';

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE 'Profil de engligoclervil9@gmail.com mis à jour avec succès!';
    RAISE NOTICE 'Role: store_manager';
    RAISE NOTICE 'Type compte: Marchand';
    RAISE NOTICE 'Type marchand: Supermarché';
END $$;
