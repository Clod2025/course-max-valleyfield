-- Migration pour le système de gestion des employés marchands
-- Création des tables pour les commis, commandes et logs

-- Table des commis
CREATE TABLE IF NOT EXISTS commis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  code_unique TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des commandes (simplifiée pour la démo)
CREATE TABLE IF NOT EXISTS commandes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  client_nom TEXT,
  client_phone TEXT,
  client_email TEXT,
  status TEXT DEFAULT 'en_attente' CHECK (status IN ('en_attente', 'acceptee', 'en_preparation', 'prete', 'livree', 'annulee')),
  total_amount DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Logs des actions des commis
CREATE TABLE IF NOT EXISTS order_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES commandes(id) ON DELETE CASCADE,
  commis_id UUID REFERENCES commis(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_commis_merchant_id ON commis(merchant_id);
CREATE INDEX IF NOT EXISTS idx_commis_code_unique ON commis(code_unique);
CREATE INDEX IF NOT EXISTS idx_commandes_merchant_id ON commandes(merchant_id);
CREATE INDEX IF NOT EXISTS idx_commandes_status ON commandes(status);
CREATE INDEX IF NOT EXISTS idx_order_logs_order_id ON order_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_order_logs_commis_id ON order_logs(commis_id);

-- RLS (Row Level Security) pour les commis
ALTER TABLE commis ENABLE ROW LEVEL SECURITY;

-- Politique pour les marchands : peuvent voir et gérer leurs commis
CREATE POLICY "Merchants can manage their commis" ON commis
  FOR ALL USING (auth.uid() = merchant_id);

-- RLS pour les commandes
ALTER TABLE commandes ENABLE ROW LEVEL SECURITY;

-- Politique pour les marchands : peuvent voir et gérer leurs commandes
CREATE POLICY "Merchants can manage their orders" ON commandes
  FOR ALL USING (auth.uid() = merchant_id);

-- RLS pour les logs
ALTER TABLE order_logs ENABLE ROW LEVEL SECURITY;

-- Politique pour les marchands : peuvent voir les logs de leurs commandes
CREATE POLICY "Merchants can view their order logs" ON order_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM commandes 
      WHERE commandes.id = order_logs.order_id 
      AND commandes.merchant_id = auth.uid()
    )
  );

-- Politique pour les commis : peuvent créer des logs pour les commandes de leur marchand
CREATE POLICY "Commis can create logs for their merchant orders" ON order_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM commandes c
      JOIN commis co ON co.merchant_id = c.merchant_id
      WHERE c.id = order_logs.order_id 
      AND co.id = order_logs.commis_id
      AND co.merchant_id = auth.uid()
    )
  );

-- Fonction pour générer un code unique
CREATE OR REPLACE FUNCTION generate_commis_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Générer un code unique COM-XXXXXX
    new_code := 'COM-' || UPPER(substring(md5(random()::text) from 1 for 6));
    
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

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer le trigger aux tables
CREATE TRIGGER update_commis_updated_at 
  BEFORE UPDATE ON commis 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_commandes_updated_at 
  BEFORE UPDATE ON commandes 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insérer quelques commandes de test
INSERT INTO commandes (merchant_id, client_nom, client_phone, status, total_amount, notes) VALUES
  (auth.uid(), 'Marie Dubois', '450-123-4567', 'en_attente', 25.50, 'Livraison urgente'),
  (auth.uid(), 'Jean Martin', '450-987-6543', 'en_attente', 18.75, 'Pas de tomates'),
  (auth.uid(), 'Sophie Tremblay', '450-555-1234', 'acceptee', 32.00, 'Appeler avant livraison');

-- Commentaires pour la documentation
COMMENT ON TABLE commis IS 'Table des employés (commis) des marchands';
COMMENT ON TABLE commandes IS 'Table des commandes des marchands';
COMMENT ON TABLE order_logs IS 'Logs des actions effectuées sur les commandes';

COMMENT ON COLUMN commis.code_unique IS 'Code unique généré automatiquement pour chaque commis (format: COM-XXXXXX)';
COMMENT ON COLUMN commandes.status IS 'Statut de la commande: en_attente, acceptee, en_preparation, prete, livree, annulee';
COMMENT ON COLUMN order_logs.action IS 'Action effectuée (ex: Commande acceptée, Commande préparée, etc.)';
