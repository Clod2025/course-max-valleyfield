-- Migration pour créer la table commandes manquante
-- Date: 2025-01-15

-- Créer la table commandes
CREATE TABLE IF NOT EXISTS commandes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID,
  produits JSONB NOT NULL,
  total NUMERIC(10,2) NOT NULL,
  statut TEXT DEFAULT 'en_attente',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_commandes_merchant_id ON commandes(merchant_id);
CREATE INDEX IF NOT EXISTS idx_commandes_client_id ON commandes(client_id);
CREATE INDEX IF NOT EXISTS idx_commandes_statut ON commandes(statut);
CREATE INDEX IF NOT EXISTS idx_commandes_created_at ON commandes(created_at);

-- RLS (Row Level Security)
ALTER TABLE commandes ENABLE ROW LEVEL SECURITY;

-- Politique pour les marchands : peuvent voir et gérer leurs commandes
CREATE POLICY "Merchants can manage their orders" ON commandes
  FOR ALL USING (auth.uid() = merchant_id);

-- Politique pour les admins : accès complet
CREATE POLICY "Admins can manage all orders" ON commandes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Commentaires pour la documentation
COMMENT ON TABLE commandes IS 'Table des commandes des marchands';
COMMENT ON COLUMN commandes.merchant_id IS 'ID du marchand propriétaire';
COMMENT ON COLUMN commandes.client_id IS 'ID du client (optionnel)';
COMMENT ON COLUMN commandes.produits IS 'Liste des produits commandés (JSON)';
COMMENT ON COLUMN commandes.total IS 'Montant total de la commande';
COMMENT ON COLUMN commandes.statut IS 'Statut de la commande (en_attente, acceptee, etc.)';

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE 'Table commandes créée avec succès!';
    RAISE NOTICE 'Politiques RLS configurées pour la sécurité';
    RAISE NOTICE 'Index créés pour optimiser les performances';
END $$;
