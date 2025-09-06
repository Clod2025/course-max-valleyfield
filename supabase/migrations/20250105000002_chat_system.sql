-- Système de chat temps réel
-- ==========================

-- Table des chats (conversations)
CREATE TABLE IF NOT EXISTS public.chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('order_support', 'delivery_update', 'general')),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  subject text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'closed', 'archived')),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Table des participants aux chats
CREATE TABLE IF NOT EXISTS public.chat_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('client', 'merchant', 'driver', 'admin')),
  joined_at timestamptz DEFAULT now() NOT NULL,
  last_read_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  UNIQUE(chat_id, user_id)
);

-- Table des messages
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'system', 'order_update')),
  metadata jsonb DEFAULT '{}', -- Pour stocker des infos supplémentaires (URLs d'images, etc.)
  is_edited boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Fonction pour créer automatiquement un chat lors d'une nouvelle commande
CREATE OR REPLACE FUNCTION public.create_order_chat()
RETURNS TRIGGER AS $$
DECLARE
  chat_id uuid;
  store_manager_id uuid;
BEGIN
  -- Créer le chat pour la commande
  INSERT INTO public.chats (type, order_id, subject)
  VALUES ('order_support', NEW.id, 'Support commande #' || NEW.order_number)
  RETURNING id INTO chat_id;
  
  -- Ajouter le client comme participant
  INSERT INTO public.chat_participants (chat_id, user_id, role)
  VALUES (chat_id, NEW.user_id, 'client');
  
  -- Trouver et ajouter le gérant du magasin
  SELECT manager_id INTO store_manager_id 
  FROM public.stores 
  WHERE id = NEW.store_id;
  
  IF store_manager_id IS NOT NULL THEN
    INSERT INTO public.chat_participants (chat_id, user_id, role)
    VALUES (chat_id, store_manager_id, 'merchant');
  END IF;
  
  -- Message système de bienvenue
  INSERT INTO public.chat_messages (chat_id, user_id, content, message_type)
  VALUES (
    chat_id, 
    NEW.user_id, 
    'Chat créé pour la commande #' || NEW.order_number,
    'system'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour créer automatiquement un chat pour chaque commande
CREATE TRIGGER create_order_chat_on_insert
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.create_order_chat();

-- Fonction pour ajouter un livreur au chat quand assigné
CREATE OR REPLACE FUNCTION public.add_driver_to_chat()
RETURNS TRIGGER AS $$
DECLARE
  chat_id uuid;
BEGIN
  -- Trouver le chat lié à cette commande
  SELECT id INTO chat_id 
  FROM public.chats 
  WHERE order_id = NEW.order_id;
  
  IF chat_id IS NOT NULL THEN
    -- Ajouter le livreur comme participant
    INSERT INTO public.chat_participants (chat_id, user_id, role)
    VALUES (chat_id, NEW.driver_id, 'driver')
    ON CONFLICT (chat_id, user_id) DO NOTHING;
    
    -- Message système d'assignation
    INSERT INTO public.chat_messages (chat_id, user_id, content, message_type)
    VALUES (
      chat_id, 
      NEW.driver_id, 
      'Livreur assigné à cette commande',
      'system'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour ajouter le livreur au chat (si table deliveries existe)
-- CREATE TRIGGER add_driver_to_chat_on_assignment
--   AFTER INSERT ON public.deliveries
--   FOR EACH ROW
--   EXECUTE FUNCTION public.add_driver_to_chat();

-- Trigger pour les timestamps
CREATE TRIGGER update_chats_updated_at
  BEFORE UPDATE ON public.chats
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chat_messages_updated_at
  BEFORE UPDATE ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies pour les chats
CREATE POLICY "Participants can view their chats" 
ON public.chats 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.chat_participants 
    WHERE chat_id = chats.id AND user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "Participants can view their chat participants" 
ON public.chat_participants 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.chat_participants cp 
    WHERE cp.chat_id = chat_participants.chat_id 
    AND cp.user_id = auth.uid() 
    AND cp.is_active = true
  )
);

CREATE POLICY "Participants can view messages in their chats" 
ON public.chat_messages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.chat_participants 
    WHERE chat_id = chat_messages.chat_id AND user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "Participants can send messages in their chats" 
ON public.chat_messages 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.chat_participants 
    WHERE chat_id = chat_messages.chat_id AND user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "Users can update their own messages" 
ON public.chat_messages 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Index pour les performances et Realtime
CREATE INDEX IF NOT EXISTS chats_order_id_idx ON public.chats(order_id);
CREATE INDEX IF NOT EXISTS chat_participants_chat_id_idx ON public.chat_participants(chat_id);
CREATE INDEX IF NOT EXISTS chat_participants_user_id_idx ON public.chat_participants(user_id);
CREATE INDEX IF NOT EXISTS chat_messages_chat_id_idx ON public.chat_messages(chat_id);
CREATE INDEX IF NOT EXISTS chat_messages_created_at_idx ON public.chat_messages(created_at DESC);

-- Activer Realtime pour les messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
```

