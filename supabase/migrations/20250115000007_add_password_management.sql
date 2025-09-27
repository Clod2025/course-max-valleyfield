-- Migration pour ajouter la gestion des mots de passe temporaires
-- Date: 2025-01-15

-- Ajouter les colonnes pour la gestion des mots de passe
ALTER TABLE commis 
ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS last_password_change TIMESTAMP WITH TIME ZONE;

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_commis_must_change_password ON commis(must_change_password);
CREATE INDEX IF NOT EXISTS idx_commis_last_password_change ON commis(last_password_change);

-- Fonction pour vérifier les identifiants d'un commis
CREATE OR REPLACE FUNCTION verify_commis_credentials(
  p_email TEXT,
  p_password TEXT,
  p_code_unique TEXT
)
RETURNS JSON AS $$
DECLARE
  v_commis RECORD;
  v_result JSON;
BEGIN
  -- Vérifier que l'utilisateur est connecté et est un marchand
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Utilisateur non authentifié';
  END IF;
  
  -- Vérifier que l'utilisateur est un marchand
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('merchant', 'store_manager', 'marchand')
  ) THEN
    RAISE EXCEPTION 'Accès refusé : utilisateur non autorisé';
  END IF;
  
  -- Rechercher le commis
  SELECT * INTO v_commis
  FROM commis
  WHERE email = p_email 
    AND code_unique = p_code_unique 
    AND is_active = true
    AND merchant_id = auth.uid();
  
  -- Vérifier si le commis existe
  IF v_commis IS NULL THEN
    RAISE EXCEPTION 'Identifiants invalides';
  END IF;
  
  -- Vérifier le mot de passe (simplifié pour la démo - en production, utiliser bcrypt)
  IF v_commis.mot_de_passe != p_password THEN
    RAISE EXCEPTION 'Mot de passe incorrect';
  END IF;
  
  -- Retourner les informations du commis
  SELECT json_build_object(
    'id', v_commis.id,
    'nom', v_commis.nom,
    'email', v_commis.email,
    'code_unique', v_commis.code_unique,
    'role', v_commis.role,
    'must_change_password', v_commis.must_change_password,
    'last_password_change', v_commis.last_password_change,
    'is_active', v_commis.is_active
  ) INTO v_result;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour changer le mot de passe d'un commis
CREATE OR REPLACE FUNCTION change_commis_password(
  p_commis_id UUID,
  p_old_password TEXT,
  p_new_password TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_commis RECORD;
  v_merchant_id UUID;
BEGIN
  -- Vérifier que l'utilisateur est connecté et est un marchand
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Utilisateur non authentifié';
  END IF;
  
  -- Vérifier que l'utilisateur est un marchand
  SELECT id INTO v_merchant_id
  FROM public.profiles 
  WHERE id = auth.uid() AND role IN ('merchant', 'store_manager', 'marchand');
  
  IF v_merchant_id IS NULL THEN
    RAISE EXCEPTION 'Accès refusé : utilisateur non autorisé';
  END IF;
  
  -- Rechercher le commis
  SELECT * INTO v_commis
  FROM commis
  WHERE id = p_commis_id 
    AND merchant_id = v_merchant_id
    AND is_active = true;
  
  -- Vérifier si le commis existe
  IF v_commis IS NULL THEN
    RAISE EXCEPTION 'Commis non trouvé';
  END IF;
  
  -- Vérifier l'ancien mot de passe
  IF v_commis.mot_de_passe != p_old_password THEN
    RAISE EXCEPTION 'Ancien mot de passe incorrect';
  END IF;
  
  -- Vérifier la politique de sécurité du nouveau mot de passe
  IF LENGTH(p_new_password) < 8 THEN
    RAISE EXCEPTION 'Le nouveau mot de passe doit contenir au moins 8 caractères';
  END IF;
  
  IF NOT (p_new_password ~ '[A-Z]') THEN
    RAISE EXCEPTION 'Le nouveau mot de passe doit contenir au moins une majuscule';
  END IF;
  
  IF NOT (p_new_password ~ '[0-9]') THEN
    RAISE EXCEPTION 'Le nouveau mot de passe doit contenir au moins un chiffre';
  END IF;
  
  IF NOT (p_new_password ~ '[!@#$%^&*(),.?":{}|<>]') THEN
    RAISE EXCEPTION 'Le nouveau mot de passe doit contenir au moins un caractère spécial';
  END IF;
  
  -- Mettre à jour le mot de passe
  UPDATE commis 
  SET 
    mot_de_passe = p_new_password,
    must_change_password = false,
    last_password_change = NOW(),
    updated_at = NOW()
  WHERE id = p_commis_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour réinitialiser le flag de changement de mot de passe
CREATE OR REPLACE FUNCTION reset_password_change_flag(p_commis_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_merchant_id UUID;
BEGIN
  -- Vérifier que l'utilisateur est connecté et est un marchand
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Utilisateur non authentifié';
  END IF;
  
  -- Vérifier que l'utilisateur est un marchand
  SELECT id INTO v_merchant_id
  FROM public.profiles 
  WHERE id = auth.uid() AND role IN ('merchant', 'store_manager', 'marchand');
  
  IF v_merchant_id IS NULL THEN
    RAISE EXCEPTION 'Accès refusé : utilisateur non autorisé';
  END IF;
  
  -- Vérifier que le commis appartient au marchand
  IF NOT EXISTS (
    SELECT 1 FROM commis 
    WHERE id = p_commis_id AND merchant_id = v_merchant_id
  ) THEN
    RAISE EXCEPTION 'Commis non trouvé ou accès refusé';
  END IF;
  
  -- Réinitialiser le flag
  UPDATE commis 
  SET 
    must_change_password = true,
    updated_at = NOW()
  WHERE id = p_commis_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mettre à jour les commis existants pour qu'ils aient le flag de changement de mot de passe
UPDATE commis 
SET must_change_password = true 
WHERE must_change_password IS NULL;

-- Commentaires pour la documentation
COMMENT ON COLUMN commis.must_change_password IS 'Indique si le commis doit changer son mot de passe à la prochaine connexion';
COMMENT ON COLUMN commis.last_password_change IS 'Date de la dernière modification du mot de passe';

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE 'Colonnes de gestion des mots de passe ajoutées avec succès!';
    RAISE NOTICE 'Fonctions créées: verify_commis_credentials, change_commis_password, reset_password_change_flag';
    RAISE NOTICE 'Politique de sécurité des mots de passe implémentée';
    RAISE NOTICE 'Tous les commis existants doivent maintenant changer leur mot de passe';
END $$;
