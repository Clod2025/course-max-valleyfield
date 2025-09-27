-- Migration pour créer la table commis avec gestion complète
-- Date: 2025-01-15

-- Créer la table commis
CREATE TABLE IF NOT EXISTS commis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  mot_de_passe TEXT NOT NULL, -- Hashé côté application
  code_unique TEXT NOT NULL UNIQUE,
  role TEXT DEFAULT 'commis' CHECK (role IN ('commis', 'supervisor', 'manager')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_commis_merchant_id ON commis(merchant_id);
CREATE INDEX IF NOT EXISTS idx_commis_email ON commis(email);
CREATE INDEX IF NOT EXISTS idx_commis_code_unique ON commis(code_unique);
CREATE INDEX IF NOT EXISTS idx_commis_is_active ON commis(is_active);

-- RLS (Row Level Security)
ALTER TABLE commis ENABLE ROW LEVEL SECURITY;

-- Politique pour les marchands : peuvent voir et gérer leurs commis
CREATE POLICY "Merchants can manage their commis" ON commis
  FOR ALL USING (auth.uid() = merchant_id);

-- Politique pour les commis : peuvent voir leurs propres informations
CREATE POLICY "Commis can view their own info" ON commis
  FOR SELECT USING (auth.uid() = id);

-- Politique pour les admins : accès complet
CREATE POLICY "Admins can manage all commis" ON commis
  FOR ALL USING (
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
    email,
    mot_de_passe,
    code_unique,
    role,
    created_by
  ) VALUES (
    v_merchant_id,
    p_nom,
    p_email,
    p_mot_de_passe, -- Le hashage doit être fait côté application
    v_code_unique,
    p_role,
    v_merchant_id
  ) RETURNING id INTO v_commis_id;
  
  -- Retourner les informations du commis créé
  SELECT json_build_object(
    'id', v_commis_id,
    'nom', p_nom,
    'email', p_email,
    'code_unique', v_code_unique,
    'role', p_role,
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
  email TEXT,
  code_unique TEXT,
  role TEXT,
  is_active BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
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
  
  -- Retourner les commis du marchand
  RETURN QUERY
  SELECT 
    c.id,
    c.nom,
    c.email,
    c.code_unique,
    c.role,
    c.is_active,
    c.created_at
  FROM commis c
  WHERE c.merchant_id = auth.uid()
  ORDER BY c.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour désactiver/activer un commis
CREATE OR REPLACE FUNCTION toggle_commis_status(p_commis_id UUID)
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
  
  -- Basculer le statut
  UPDATE commis 
  SET is_active = NOT is_active,
      updated_at = NOW()
  WHERE id = p_commis_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour supprimer un commis
CREATE OR REPLACE FUNCTION delete_commis(p_commis_id UUID)
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
  
  -- Supprimer le commis
  DELETE FROM commis WHERE id = p_commis_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_commis_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_commis_updated_at
  BEFORE UPDATE ON commis
  FOR EACH ROW
  EXECUTE FUNCTION update_commis_updated_at();

-- Commentaires pour la documentation
COMMENT ON TABLE commis IS 'Table des employés (commis) rattachés aux marchands';
COMMENT ON COLUMN commis.merchant_id IS 'ID du marchand propriétaire';
COMMENT ON COLUMN commis.code_unique IS 'Code unique généré automatiquement (format: COM-XXXXXXXX)';
COMMENT ON COLUMN commis.role IS 'Rôle du commis: commis, supervisor, manager';
COMMENT ON COLUMN commis.mot_de_passe IS 'Mot de passe hashé (hashage côté application)';
COMMENT ON COLUMN commis.created_by IS 'ID du marchand qui a créé ce commis';

-- Insérer quelques données de test pour les marchands connectés
INSERT INTO commis (merchant_id, nom, email, mot_de_passe, code_unique, role, created_by) 
SELECT 
  auth.uid(),
  'Jean Dupont',
  'jean.dupont@demo.com',
  '$2a$10$demo.hash.for.testing.purposes.only',
  generate_commis_code(),
  'commis',
  auth.uid()
WHERE auth.uid() IS NOT NULL
ON CONFLICT (email) DO NOTHING;

INSERT INTO commis (merchant_id, nom, email, mot_de_passe, code_unique, role, created_by) 
SELECT 
  auth.uid(),
  'Marie Martin',
  'marie.martin@demo.com',
  '$2a$10$demo.hash.for.testing.purposes.only',
  generate_commis_code(),
  'supervisor',
  auth.uid()
WHERE auth.uid() IS NOT NULL
ON CONFLICT (email) DO NOTHING;

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE 'Table commis créée avec succès!';
    RAISE NOTICE 'Fonctions créées: create_commis, get_merchant_commis, toggle_commis_status, delete_commis';
    RAISE NOTICE 'Politiques RLS configurées pour la sécurité';
    RAISE NOTICE 'Données de test insérées pour les marchands connectés';
END $$;
