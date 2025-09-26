-- Création de la table pour stocker les messages d'aide des marchands
CREATE TABLE IF NOT EXISTS help_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  merchant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  merchant_name TEXT NOT NULL,
  merchant_email TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')),
  attachment_name TEXT,
  attachment_size BIGINT,
  attachment_type TEXT,
  admin_response TEXT,
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_help_messages_merchant_id ON help_messages(merchant_id);
CREATE INDEX IF NOT EXISTS idx_help_messages_status ON help_messages(status);
CREATE INDEX IF NOT EXISTS idx_help_messages_created_at ON help_messages(created_at);

-- RLS (Row Level Security)
ALTER TABLE help_messages ENABLE ROW LEVEL SECURITY;

-- Politique pour les marchands : peuvent voir leurs propres messages
CREATE POLICY "Merchants can view their own help messages" ON help_messages
  FOR SELECT USING (auth.uid() = merchant_id);

-- Politique pour les marchands : peuvent créer leurs propres messages
CREATE POLICY "Merchants can create their own help messages" ON help_messages
  FOR INSERT WITH CHECK (auth.uid() = merchant_id);

-- Politique pour les admins : peuvent voir tous les messages
CREATE POLICY "Admins can view all help messages" ON help_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Politique pour les admins : peuvent mettre à jour tous les messages
CREATE POLICY "Admins can update all help messages" ON help_messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_help_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour updated_at
CREATE TRIGGER update_help_messages_updated_at
  BEFORE UPDATE ON help_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_help_messages_updated_at();

-- Commentaires pour la documentation
COMMENT ON TABLE help_messages IS 'Messages d''aide envoyés par les marchands aux administrateurs';
COMMENT ON COLUMN help_messages.subject IS 'Sujet du message d''aide';
COMMENT ON COLUMN help_messages.message IS 'Contenu du message d''aide';
COMMENT ON COLUMN help_messages.merchant_id IS 'ID du marchand qui a envoyé le message';
COMMENT ON COLUMN help_messages.merchant_name IS 'Nom du marchand';
COMMENT ON COLUMN help_messages.merchant_email IS 'Email du marchand';
COMMENT ON COLUMN help_messages.status IS 'Statut du message (pending, in_progress, resolved, closed)';
COMMENT ON COLUMN help_messages.attachment_name IS 'Nom du fichier joint';
COMMENT ON COLUMN help_messages.attachment_size IS 'Taille du fichier joint en octets';
COMMENT ON COLUMN help_messages.attachment_type IS 'Type MIME du fichier joint';
COMMENT ON COLUMN help_messages.admin_response IS 'Réponse de l''administrateur';
COMMENT ON COLUMN help_messages.admin_id IS 'ID de l''administrateur qui a répondu';
COMMENT ON COLUMN help_messages.resolved_at IS 'Date de résolution du message';
