-- Migration: Commis code-based login helper
-- Date: 2025-11-01

CREATE OR REPLACE FUNCTION public.commis_resolve_email(
  p_code text,
  p_password text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
BEGIN
  IF p_code IS NULL OR trim(p_code) = '' THEN
    RAISE EXCEPTION 'Code requis';
  END IF;

  SELECT email
  INTO v_email
  FROM public.commis
  WHERE upper(code_unique) = upper(p_code)
    AND is_active = true
    AND crypt(p_password, mot_de_passe) = mot_de_passe;

  IF v_email IS NULL THEN
    RAISE EXCEPTION 'Identifiants invalides';
  END IF;

  RETURN v_email;
END;
$$;

GRANT EXECUTE ON FUNCTION public.commis_resolve_email(text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.commis_resolve_email(text, text) TO authenticated;

DO $$
BEGIN
  RAISE NOTICE 'Fonction commis_resolve_email créée pour login par code.';
END $$;

