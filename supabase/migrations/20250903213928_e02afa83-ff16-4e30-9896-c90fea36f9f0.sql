-- Créer les utilisateurs de test avec les rôles appropriés
-- Note: Nous devons d'abord insérer dans auth.users puis dans profiles

-- Insert test users in auth.users first (skip if email already exists)
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
)
SELECT
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  email,
  crypt('Test@1234', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  raw_meta,
  false,
  'authenticated'
FROM (
  VALUES
    ('clodenerc@yahoo.fr', '{"first_name": "Claude", "last_name": "Neri", "role": "admin"}'),
    ('claircl18@gmail.com', '{"first_name": "Claire", "last_name": "Clairc", "role": "store_manager"}'),
    ('engligoclervil9@gmail.com', '{"first_name": "Engligo", "last_name": "Clervil", "role": "livreur"}'),
    ('desirdelia@gmail.com', '{"first_name": "Desire", "last_name": "Delia", "role": "client"}')
) AS payload(email, raw_meta)
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users existing
  WHERE existing.email = payload.email
);

-- Insert corresponding profiles
INSERT INTO public.profiles (user_id, email, first_name, last_name, role)
SELECT 
  u.id,
  u.email,
  u.raw_user_meta_data->>'first_name',
  u.raw_user_meta_data->>'last_name',
  CASE 
    WHEN u.raw_user_meta_data->>'role' = 'admin' THEN 'admin'::user_role
    WHEN u.raw_user_meta_data->>'role' = 'store_manager' THEN 'store_manager'::user_role
    WHEN u.raw_user_meta_data->>'role' = 'livreur' THEN 'livreur'::user_role
    ELSE 'client'::user_role
  END
FROM auth.users u
WHERE u.email IN ('clodenerc@yahoo.fr', 'claircl18@gmail.com', 'engligoclervil9@gmail.com', 'desirdelia@gmail.com')
ON CONFLICT DO NOTHING;

-- Create a test store and assign it to the merchant
INSERT INTO public.stores (id, name, address, city, manager_id)
SELECT 
  gen_random_uuid(),
  'Magasin Test Claire',
  '123 Rue Test',
  'Valleyfield',
  p.user_id
FROM public.profiles p
WHERE p.email = 'claircl18@gmail.com'
ON CONFLICT DO NOTHING;

-- Add some test products to the store
INSERT INTO public.products (name, description, price, category, store_id, in_stock)
SELECT 
  'Produit Test 1',
  'Description du produit test 1',
  9.99,
  'Épicerie',
  s.id,
  true
FROM public.stores s
WHERE s.name = 'Magasin Test Claire'
UNION ALL
SELECT 
  'Produit Test 2',
  'Description du produit test 2',
  15.50,
  'Boulangerie',
  s.id,
  true
FROM public.stores s
WHERE s.name = 'Magasin Test Claire';