-- Migration pour corriger et créer les tables manquantes de l'espace marchand
-- Date: 2025-01-15

-- 1. Créer la table commis si elle n'existe pas
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

-- 2. Créer la table merchant_payment_methods si elle n'existe pas
CREATE TABLE IF NOT EXISTS merchant_payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('debit', 'credit', 'interac')),
  account_number TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  cardholder_name TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Créer la table merchant_transactions si elle n'existe pas
CREATE TABLE IF NOT EXISTS merchant_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('sale', 'payout', 'refund')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  order_id UUID,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Créer la table commandes si elle n'existe pas
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

-- 5. Créer la table order_logs si elle n'existe pas
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
CREATE INDEX IF NOT EXISTS idx_merchant_payment_methods_merchant_id ON merchant_payment_methods(merchant_id);
CREATE INDEX IF NOT EXISTS idx_merchant_transactions_merchant_id ON merchant_transactions(merchant_id);
CREATE INDEX IF NOT EXISTS idx_commandes_merchant_id ON commandes(merchant_id);
CREATE INDEX IF NOT EXISTS idx_commandes_status ON commandes(status);
CREATE INDEX IF NOT EXISTS idx_order_logs_order_id ON order_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_order_logs_commis_id ON order_logs(commis_id);

-- RLS (Row Level Security) pour toutes les tables
ALTER TABLE commis ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE commandes ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_logs ENABLE ROW LEVEL SECURITY;

-- Politiques pour la table commis
CREATE POLICY "Merchants can manage their commis" ON commis
  FOR ALL USING (auth.uid() = merchant_id);

-- Politiques pour la table merchant_payment_methods
CREATE POLICY "Merchants can manage their payment methods" ON merchant_payment_methods
  FOR ALL USING (auth.uid() = merchant_id);

-- Politiques pour la table merchant_transactions
CREATE POLICY "Merchants can view their transactions" ON merchant_transactions
  FOR ALL USING (auth.uid() = merchant_id);

-- Politiques pour la table commandes
CREATE POLICY "Merchants can manage their orders" ON commandes
  FOR ALL USING (auth.uid() = merchant_id);

-- Politiques pour la table order_logs
CREATE POLICY "Merchants can view their order logs" ON order_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM commandes 
      WHERE commandes.id = order_logs.order_id 
      AND commandes.merchant_id = auth.uid()
    )
  );

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

-- Fonction pour générer un code unique de commis
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

CREATE TRIGGER update_merchant_payment_methods_updated_at 
  BEFORE UPDATE ON merchant_payment_methods 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_merchant_transactions_updated_at 
  BEFORE UPDATE ON merchant_transactions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_commandes_updated_at 
  BEFORE UPDATE ON commandes 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insérer quelques données de test pour les marchands connectés
INSERT INTO commandes (merchant_id, client_nom, client_phone, status, total_amount, notes) 
SELECT 
  auth.uid(),
  'Client Test ' || generate_series,
  '450-000-' || LPAD(generate_series::text, 4, '0'),
  CASE 
    WHEN generate_series % 3 = 0 THEN 'en_attente'
    WHEN generate_series % 3 = 1 THEN 'acceptee'
    ELSE 'prete'
  END,
  15.00 + (generate_series * 5.50),
  'Commande de test ' || generate_series
FROM generate_series(1, 3)
WHERE auth.uid() IS NOT NULL
ON CONFLICT DO NOTHING;

-- Commentaires pour la documentation
COMMENT ON TABLE commis IS 'Table des employés (commis) des marchands';
COMMENT ON TABLE merchant_payment_methods IS 'Méthodes de paiement des marchands';
COMMENT ON TABLE merchant_transactions IS 'Transactions financières des marchands';
COMMENT ON TABLE commandes IS 'Commandes des marchands';
COMMENT ON TABLE order_logs IS 'Logs des actions effectuées sur les commandes';

COMMENT ON COLUMN commis.code_unique IS 'Code unique généré automatiquement pour chaque commis (format: COM-XXXXXX)';
COMMENT ON COLUMN merchant_payment_methods.type IS 'Type de paiement: debit, credit, interac';
COMMENT ON COLUMN merchant_transactions.type IS 'Type de transaction: sale, payout, refund';
COMMENT ON COLUMN commandes.status IS 'Statut de la commande: en_attente, acceptee, en_preparation, prete, livree, annulee';
COMMENT ON COLUMN order_logs.action IS 'Action effectuée (ex: Commande acceptée, Commande préparée, etc.)';

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE 'Migration des tables marchand terminée avec succès!';
    RAISE NOTICE 'Tables créées: commis, merchant_payment_methods, merchant_transactions, commandes, order_logs';
    RAISE NOTICE 'Fonction créée: generate_commis_code';
    RAISE NOTICE 'Politiques RLS configurées pour toutes les tables';
    RAISE NOTICE 'Données de test insérées dans la table commandes';
END $$;
