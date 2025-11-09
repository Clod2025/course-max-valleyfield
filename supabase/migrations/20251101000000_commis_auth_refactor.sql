-- Migration: Commis dedicated auth & RLS refinement
-- Date: 2025-11-01

-- 1. Étendre la table commis pour supporter des comptes dédiés
ALTER TABLE public.commis
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES public.stores(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Index pour user_id (unique) et store_id
CREATE UNIQUE INDEX IF NOT EXISTS commis_user_id_idx ON public.commis(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS commis_store_id_idx ON public.commis(store_id);

-- Renseigner user_id pour les commis existants si email commun avec auth.users
UPDATE public.commis c
SET user_id = u.id
FROM auth.users u
WHERE c.user_id IS NULL
  AND lower(c.email) = lower(u.email);

-- Tenter de renseigner store_id via merchants / stores
UPDATE public.commis c
SET store_id = s.id
FROM public.merchants m
JOIN public.stores s ON s.manager_id = m.user_id
WHERE c.store_id IS NULL
  AND c.merchant_id = m.id;

-- 2. Fonctions d'administration pour les managers
CREATE OR REPLACE FUNCTION public.create_commis_account(
  p_email text,
  p_password text,
  p_first_name text,
  p_last_name text,
  p_store_id uuid,
  p_role text DEFAULT 'commis'
) RETURNS json AS $$
DECLARE
  v_user_id uuid;
  v_commis_id uuid;
  v_code text;
  v_merchant_id uuid;
  v_result json;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Utilisateur non authentifié';
  END IF;

  -- Vérifier que l'appelant possède le magasin
  SELECT m.id INTO v_merchant_id
  FROM public.merchants m
  WHERE m.user_id = auth.uid();

  IF v_merchant_id IS NULL THEN
    RAISE EXCEPTION 'Accès refusé : vous n''êtes pas manager';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.stores s
    WHERE s.id = p_store_id
      AND (s.manager_id = auth.uid())
  ) THEN
    RAISE EXCEPTION 'Accès refusé : magasin inconnu ou non autorisé';
  END IF;

  -- Vérifier email non utilisé
  IF EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = lower(p_email)) THEN
    RAISE EXCEPTION 'Email déjà utilisé';
  END IF;

  -- Créer l'utilisateur Supabase
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
  ) VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    lower(p_email),
    crypt(p_password, gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider": "email", "providers": ["email"]}',
    json_build_object('first_name', p_first_name, 'last_name', p_last_name, 'role', 'commis'),
    false,
    'authenticated'
  ) RETURNING id INTO v_user_id;

  -- Générer un code unique
  LOOP
    v_code := 'COM-' || UPPER(substring(md5(random()::text) from 1 for 8));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.commis WHERE code_unique = v_code);
  END LOOP;

  -- Créer la ligne commis
  INSERT INTO public.commis (
    id,
    merchant_id,
    store_id,
    nom,
    prenom,
    email,
    mot_de_passe,
    code_unique,
    role,
    must_change_password,
    is_active,
    user_id,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    v_merchant_id,
    p_store_id,
    p_last_name,
    p_first_name,
    lower(p_email),
    crypt(p_password, gen_salt('bf')),
    v_code,
    COALESCE(NULLIF(p_role, ''), 'commis'),
    true,
    true,
    v_user_id,
    now(),
    now()
  ) RETURNING id INTO v_commis_id;

  v_result := json_build_object(
    'id', v_commis_id,
    'user_id', v_user_id,
    'email', lower(p_email),
    'code_unique', v_code,
    'first_name', p_first_name,
    'last_name', p_last_name,
    'store_id', p_store_id,
    'merchant_id', v_merchant_id,
    'role', COALESCE(NULLIF(p_role, ''), 'commis')
  );

  RETURN v_result;
EXCEPTION
  WHEN others THEN
    IF v_user_id IS NOT NULL THEN
      DELETE FROM auth.users WHERE id = v_user_id;
    END IF;
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.reset_commis_password(
  p_commis_id uuid,
  p_new_password text
) RETURNS boolean AS $$
DECLARE
  v_user_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Utilisateur non authentifié';
  END IF;

  SELECT c.user_id INTO v_user_id
  FROM public.commis c
  JOIN public.merchants m ON m.id = c.merchant_id
  WHERE c.id = p_commis_id
    AND m.user_id = auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Accès refusé : commis introuvable';
  END IF;

  UPDATE auth.users
    SET encrypted_password = crypt(p_new_password, gen_salt('bf')), updated_at = now()
  WHERE id = v_user_id;

  UPDATE public.commis
    SET mot_de_passe = crypt(p_new_password, gen_salt('bf')), must_change_password = false, updated_at = now()
  WHERE id = p_commis_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Politiques RLS supplémentaires pour les commis
-- Commis : accès à leur propre fiche
CREATE POLICY IF NOT EXISTS "Commis can view self" ON public.commis
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Commis can update password flag" ON public.commis
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Commandes : autoriser les commis du magasin
CREATE POLICY IF NOT EXISTS "Commis can view store orders" ON public.commandes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.commis c
      WHERE c.user_id = auth.uid()
        AND c.merchant_id = public.commandes.merchant_id
    )
  );

CREATE POLICY IF NOT EXISTS "Commis can update store orders" ON public.commandes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.commis c
      WHERE c.user_id = auth.uid()
        AND c.merchant_id = public.commandes.merchant_id
    )
  );

-- Commande_items
CREATE POLICY IF NOT EXISTS "Commis can view store order items" ON public.commande_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.commis c
      JOIN public.commandes co ON co.id = public.commande_items.commande_id
      WHERE c.user_id = auth.uid()
        AND c.merchant_id = co.merchant_id
    )
  );

CREATE POLICY IF NOT EXISTS "Commis can update store order items" ON public.commande_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.commis c
      JOIN public.commandes co ON co.id = public.commande_items.commande_id
      WHERE c.user_id = auth.uid()
        AND c.merchant_id = co.merchant_id
    )
  );

-- Order logs : insertion par les commis de leur magasin
CREATE POLICY IF NOT EXISTS "Commis can insert order logs" ON public.order_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.commis c
      JOIN public.commandes co ON co.id = public.order_logs.order_id
      WHERE c.user_id = auth.uid()
        AND c.merchant_id = co.merchant_id
    )
  );

-- 4. Trigger pour updated_at
CREATE OR REPLACE FUNCTION public.update_commis_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_commis_updated_at ON public.commis;
CREATE TRIGGER trg_commis_updated_at
  BEFORE UPDATE ON public.commis
  FOR EACH ROW
  EXECUTE FUNCTION public.update_commis_updated_at();

-- Messages de confirmation
DO $$
BEGIN
  RAISE NOTICE 'Commis auth refactor applied: user_id/store_id columns, new policies, and account helpers.';
END $$;

