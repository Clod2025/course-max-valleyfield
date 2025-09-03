-- Corriger les rôles des utilisateurs de test
UPDATE public.profiles 
SET role = 'admin'
WHERE email = 'clodenerc@yahoo.fr';

UPDATE public.profiles 
SET role = 'store_manager'
WHERE email = 'claircl18@gmail.com';

UPDATE public.profiles 
SET role = 'livreur'
WHERE email = 'engligoclervil9@gmail.com';

UPDATE public.profiles 
SET role = 'client'
WHERE email = 'desirdelia@gmail.com';