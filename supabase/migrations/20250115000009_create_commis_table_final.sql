-- Migration pour créer la table commis avec la structure demandée
-- Date: 2025-01-15

-- Créer la table commis
CREATE TABLE IF NOT EXISTS commis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  mot_de_passe TEXT NOT NULL,
  code_unique TEXT NOT NULL UNIQUE,
  role TEXT DEFAULT 'commis',
  must_change_password BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_commis_merchant_id ON commis(merchant_id);
CREATE INDEX IF NOT EXISTS idx_commis_email ON commis(email);
CREATE INDEX IF NOT EXISTS idx_commis_code_unique ON commis(code_unique);
CREATE INDEX IF NOT EXISTS idx_commis_must_change_password ON commis(must_change_password);
CREATE INDEX IF NOT EXISTS idx_commis_is_active ON commis(is_active);

-- RLS (Row Level Security)
ALTER TABLE commis ENABLE ROW LEVEL SECURITY;

-- Politique pour les marchands : peuvent voir et gérer leurs commis
CREATE POLICY "Merchants can manage their commis" ON commis
  FOR ALL USING (auth.uid() = merchant_id)
  WITH CHECK (auth.uid() = merchant_id);

-- Politique pour les admins : accès complet
CREATE POLICY "Admins can manage all commis" ON commis
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Fonction pour générer un code unique de commis
CREATE OR REPLACE FUNCTION generate_commis_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Générer un code unique COM-[UUID court]
    new_code := 'COM-' || UPPER(substring(md5(random()::text) from 1 for 8));
    
    -- Vérifier si le code existe déjà
    SELECT EXISTS(SELECT 1 FROM commis WHERE code_unique = new_code) INTO code_exists;
    
    -- Si le code n'existe pas, on peut l'utiliser
    IF NOT code_exists THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour créer un commis (sécurisée)
CREATE OR REPLACE FUNCTION create_commis(
  p_nom TEXT,
  p_prenom TEXT,
  p_email TEXT,
  p_mot_de_passe TEXT,
  p_role TEXT DEFAULT 'commis'
)
RETURNS JSON AS $$
DECLARE
  v_merchant_id UUID;
  v_commis_id UUID;
  v_code_unique TEXT;
  v_result JSON;
BEGIN
  -- Fixer le search_path pour éviter le schema shadowing
  SET LOCAL search_path = pg_temp, public;
  
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
  
  -- Générer un code unique
  v_code_unique := generate_commis_code();
  
  -- Insérer le commis
  INSERT INTO commis (
    merchant_id,
    nom,
    prenom,
    email,
    mot_de_passe,
    code_unique,
    role
  ) VALUES (
    v_merchant_id,
    p_nom,
    p_prenom,
    p_email,
    p_mot_de_passe,
    v_code_unique,
    p_role
  ) RETURNING id INTO v_commis_id;
  
  -- Retourner les informations du commis créé
  SELECT json_build_object(
    'id', v_commis_id,
    'nom', p_nom,
    'prenom', p_prenom,
    'email', p_email,
    'code_unique', v_code_unique,
    'role', p_role,
    'must_change_password', true,
    'is_active', true,
    'created_at', NOW()
  ) INTO v_result;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour lister les commis d'un marchand
CREATE OR REPLACE FUNCTION get_merchant_commis()
RETURNS TABLE (
  id UUID,
  nom TEXT,
  prenom TEXT,
  email TEXT,
  code_unique TEXT,
  role TEXT,
  must_change_password BOOLEAN,
  is_active BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  -- Fixer le search_path pour éviter le schema shadowing
  SET LOCAL search_path = pg_temp, public;
  
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
  
  -- Retourner les commis du marchand
  RETURN QUERY
  SELECT 
    c.id,
    c.nom,
    c.prenom,
    c.email,
    c.code_unique,
    c.role,
    c.must_change_password,
    c.is_active,
    c.created_at
  FROM commis c
  WHERE c.merchant_id = auth.uid()
  ORDER BY c.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaires pour la documentation
COMMENT ON TABLE commis IS 'Table des employés (commis) rattachés aux marchands';
COMMENT ON COLUMN commis.merchant_id IS 'ID du marchand propriétaire';
COMMENT ON COLUMN commis.code_unique IS 'Code unique généré automatiquement (format: COM-XXXXXXXX)';
COMMENT ON COLUMN commis.role IS 'Rôle du commis: commis, supervisor, manager';
COMMENT ON COLUMN commis.mot_de_passe IS 'Mot de passe hashé (hashage côté application)';
COMMENT ON COLUMN commis.must_change_password IS 'Indique si le commis doit changer son mot de passe à la prochaine connexion';
COMMENT ON COLUMN commis.is_active IS 'Indique si le commis est actif (peut se connecter)';

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE 'Table commis créée avec succès!';
    RAISE NOTICE 'Fonctions créées: create_commis, get_merchant_commis, generate_commis_code';
    RAISE NOTICE 'Politiques RLS configurées pour la sécurité';
END $$;
