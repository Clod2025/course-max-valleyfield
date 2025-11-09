-- Migration: Corriger handle_new_user pour inclure le rôle
-- Cette migration corrige le problème où le profil n'est pas créé avec le rôle approprié après l'inscription

-- ✅ CORRECTION: Mettre à jour la fonction handle_new_user pour gérer tous les cas d'enum
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
  v_user_role text;
  v_enum_type text;
BEGIN
  -- Récupérer le rôle depuis les métadonnées
  v_role := COALESCE(NEW.raw_user_meta_data ->> 'role', 'client');
  
  -- ✅ DÉTECTION DYNAMIQUE: Vérifier quel enum existe réellement dans la base
  SELECT typname INTO v_enum_type
  FROM pg_type 
  WHERE typname = 'user_role';
  
  -- ✅ MAPPING ROBUSTE selon l'enum détecté
  -- Si l'enum contient 'store_manager' ou 'livreur', utiliser ces valeurs
  IF EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel IN ('store_manager', 'livreur') 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
  ) THEN
    -- Enum avec store_manager et livreur
    CASE 
      WHEN v_role IN ('admin', 'Admin', 'ADMIN') THEN
        v_user_role := 'admin';
      WHEN v_role IN ('store_manager', 'merchant', 'Merchant', 'Marchand', 'marchand') THEN
        v_user_role := 'store_manager';
      WHEN v_role IN ('driver', 'Driver', 'livreur', 'Livreur', 'LIVREUR') THEN
        v_user_role := 'livreur';
      ELSE
        v_user_role := 'client';
    END CASE;
  ELSE
    -- Enum avec merchant et driver
    CASE 
      WHEN v_role IN ('admin', 'Admin', 'ADMIN') THEN
        v_user_role := 'admin';
      WHEN v_role IN ('store_manager', 'merchant', 'Merchant', 'Marchand', 'marchand') THEN
        v_user_role := 'merchant';
      WHEN v_role IN ('driver', 'Driver', 'livreur', 'Livreur', 'LIVREUR') THEN
        v_user_role := 'driver';
      ELSE
        v_user_role := 'client';
    END CASE;
  END IF;
  
  -- Insérer le profil avec toutes les informations incluant le rôle
  INSERT INTO public.profiles (
    user_id, 
    email, 
    first_name, 
    last_name,
    role
  )
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
    v_user_role::user_role
  );
  
  RETURN NEW;
EXCEPTION
  WHEN invalid_text_representation THEN
    -- Si le casting échoue, utiliser 'client' par défaut
    INSERT INTO public.profiles (
      user_id, 
      email, 
      first_name, 
      last_name,
      role
    )
    VALUES (
      NEW.id, 
      NEW.email,
      COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
      COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
      'client'::user_role
    );
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log l'erreur mais continue quand même avec 'client'
    RAISE WARNING 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
    INSERT INTO public.profiles (
      user_id, 
      email, 
      first_name, 
      last_name,
      role
    )
    VALUES (
      NEW.id, 
      NEW.email,
      COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
      COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
      'client'::user_role
    );
    RETURN NEW;
END;
$$;

-- ✅ S'assurer que le trigger existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
