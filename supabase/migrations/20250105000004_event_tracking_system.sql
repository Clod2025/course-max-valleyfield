-- Système de tracking d'événements utilisateur
-- =============================================

-- Type ENUM pour les événements
CREATE TYPE event_type AS ENUM (
  'page_view',
  'product_view', 
  'add_to_cart',
  'remove_from_cart',
  'begin_checkout',
  'order_complete',
  'search_product',
  'filter_products',
  'click_store',
  'loyalty_points_earned',
  'loyalty_points_redeemed',
  'review_submitted',
  'chat_message_sent'
);

-- Table des événements
CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text, -- Pour tracker les utilisateurs non connectés
  event_type event_type NOT NULL,
  payload jsonb DEFAULT '{}', -- Données flexibles de l'événement
  page_url text,
  user_agent text,
  ip_address inet,
  referrer text,
  device_info jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Table des sessions pour tracker les utilisateurs non connectés
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL UNIQUE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  first_seen timestamptz DEFAULT now() NOT NULL,
  last_seen timestamptz DEFAULT now() NOT NULL,
  page_views integer DEFAULT 0,
  device_info jsonb DEFAULT '{}',
  location_info jsonb DEFAULT '{}'
);

-- Fonction pour créer ou mettre à jour une session
CREATE OR REPLACE FUNCTION public.upsert_user_session(
  p_session_id text,
  p_user_id uuid DEFAULT NULL,
  p_device_info jsonb DEFAULT '{}',
  p_location_info jsonb DEFAULT '{}'
)
RETURNS uuid AS $$
DECLARE
  session_record_id uuid;
BEGIN
  INSERT INTO public.user_sessions (session_id, user_id, device_info, location_info)
  VALUES (p_session_id, p_user_id, p_device_info, p_location_info)
  ON CONFLICT (session_id) 
  DO UPDATE SET 
    user_id = COALESCE(EXCLUDED.user_id, user_sessions.user_id),
    last_seen = now(),
    page_views = user_sessions.page_views + 1,
    device_info = EXCLUDED.device_info,
    location_info = EXCLUDED.location_info
  RETURNING id INTO session_record_id;
  
  RETURN session_record_id;
END;
$$ LANGUAGE plpgsql;

-- Fonction RPC pour loguer un événement
CREATE OR REPLACE FUNCTION public.log_event(
  p_session_id text,
  p_event_type text,
  p_payload jsonb DEFAULT '{}',
  p_page_url text DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_referrer text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  event_id uuid;
  current_user_id uuid;
BEGIN
  -- Récupérer l'utilisateur connecté s'il existe
  current_user_id := auth.uid();
  
  -- Mettre à jour la session
  PERFORM public.upsert_user_session(p_session_id, current_user_id);
  
  -- Insérer l'événement
  INSERT INTO public.events (
    user_id, 
    session_id, 
    event_type, 
    payload, 
    page_url, 
    user_agent, 
    referrer
  )
  VALUES (
    current_user_id,
    p_session_id,
    p_event_type::event_type,
    p_payload,
    p_page_url,
    p_user_agent,
    p_referrer
  )
  RETURNING id INTO event_id;
  
  RETURN event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour mettre à jour automatiquement les métriques des produits
CREATE OR REPLACE FUNCTION public.update_product_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Si c'est un événement de vue de produit
  IF NEW.event_type = 'product_view' AND NEW.payload ? 'product_id' THEN
    -- On pourrait incrémenter un compteur de vues, etc.
    -- Pour l'instant, on ne fait rien mais la structure est prête
    NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_product_metrics_trigger
  AFTER INSERT ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_product_metrics();

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies pour les événements
CREATE POLICY "Users can view their own events" 
ON public.events 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can log events" 
ON public.events 
FOR INSERT 
WITH CHECK (true); -- Les événements peuvent être loggés par n'importe qui

-- Les admins peuvent voir tous les événements
CREATE POLICY "Admins can view all events" 
ON public.events 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- RLS pour les sessions
CREATE POLICY "Users can view their own sessions" 
ON public.user_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can create sessions" 
ON public.user_sessions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update their own sessions" 
ON public.user_sessions 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS events_user_id_idx ON public.events(user_id);
CREATE INDEX IF NOT EXISTS events_session_id_idx ON public.events(session_id);
CREATE INDEX IF NOT EXISTS events_event_type_idx ON public.events(event_type);
CREATE INDEX IF NOT EXISTS events_created_at_idx ON public.events(created_at DESC);
CREATE INDEX IF NOT EXISTS events_payload_gin_idx ON public.events USING GIN(payload);
CREATE INDEX IF NOT EXISTS user_sessions_session_id_idx ON public.user_sessions(session_id);
```

