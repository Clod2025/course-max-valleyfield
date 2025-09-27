-- Migration pour créer la table commandes si elle n'existe pas
-- Cette migration est séparée pour éviter les conflits

-- Vérifier si la table commandes existe déjà
DO $$
BEGIN
    -- Créer la table commandes seulement si elle n'existe pas
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'commandes') THEN
        CREATE TABLE commandes (
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

        -- Index pour optimiser les requêtes
        CREATE INDEX IF NOT EXISTS idx_commandes_merchant_id ON commandes(merchant_id);
        CREATE INDEX IF NOT EXISTS idx_commandes_status ON commandes(status);

        -- RLS pour les commandes
        ALTER TABLE commandes ENABLE ROW LEVEL SECURITY;

        -- Politique pour les marchands : peuvent voir et gérer leurs commandes
        CREATE POLICY "Merchants can manage their orders" ON commandes
            FOR ALL USING (auth.uid() = merchant_id);

        -- Trigger pour mettre à jour updated_at
        CREATE TRIGGER update_commandes_updated_at 
            BEFORE UPDATE ON commandes 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

        -- Insérer quelques commandes de test pour le marchand connecté
        INSERT INTO commandes (merchant_id, client_nom, client_phone, status, total_amount, notes) VALUES
            (auth.uid(), 'Marie Dubois', '450-123-4567', 'en_attente', 25.50, 'Livraison urgente'),
            (auth.uid(), 'Jean Martin', '450-987-6543', 'en_attente', 18.75, 'Pas de tomates'),
            (auth.uid(), 'Sophie Tremblay', '450-555-1234', 'acceptee', 32.00, 'Appeler avant livraison');

        RAISE NOTICE 'Table commandes créée avec succès';
    ELSE
        RAISE NOTICE 'Table commandes existe déjà';
    END IF;
END $$;

-- Commentaires pour la documentation
COMMENT ON TABLE commandes IS 'Table des commandes des marchands';
COMMENT ON COLUMN commandes.status IS 'Statut de la commande: en_attente, acceptee, en_preparation, prete, livree, annulee';
