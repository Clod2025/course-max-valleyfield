-- Système d'A/B Testing
-- ======================

-- Table des expériences A/B
CREATE TABLE IF NOT EXISTS public.ab_experiments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  is_active boolean DEFAULT true,
  start_date timestamptz DEFAULT now(),
  end_date timestamptz,
  variants jsonb NOT NULL DEFAULT '["A", "B"]', -- Liste des variantes
  traffic_split jsonb NOT NULL DEFAULT '{"A": 50, "B": 50}', -- Répartition du trafic
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Table des assignations d'utilisateurs
CREATE TABLE IF NOT EXISTS public.ab_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text, -- Pour les utilisateurs non connectés
  experiment_name text NOT NULL REFERENCES public.ab_experiments(name) ON DELETE CASCADE,
  variant text NOT NULL,
  assigned_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, experiment_name),
  UNIQUE(session_id, experiment_name)
);

-- Table des événements A/B pour mesurer les conversions
CREATE TABLE IF NOT EXISTS public.ab_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text,
  experiment_name text NOT NULL REFERENCES public.ab_experiments(name) ON DELETE CASCADE,
  variant text NOT NULL,
  event_type text NOT NULL, -- 'conversion', 'click', 'view', etc.
  value numeric DEFAULT 0, -- Valeur monétaire ou métrique
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Fonction pour assigner une variante à un utilisateur
CREATE OR REPLACE FUNCTION public.assign_ab_variant(
  p_experiment_name text,
  p_session_id text DEFAULT NULL
)
RETURNS text AS $$
DECLARE
  experiment_record record;
  user_identifier text;
  hash_value bigint;
  variant_index integer;
  assigned_variant text;
  current_user_id uuid;
BEGIN
  -- Récupérer l'utilisateur connecté s'il existe
  current_user_id := auth.uid();
  
  -- Vérifier que l'expérience existe et est active
  SELECT * INTO experiment_record 
  FROM public.ab_experiments 
  WHERE name = p_experiment_name AND is_active = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Expérience non trouvée ou inactive: %', p_experiment_name;
  END IF;
  
  -- Vérifier si l'utilisateur a déjà une assignation
  IF current_user_id IS NOT NULL THEN
    SELECT variant INTO assigned_variant
    FROM public.ab_assignments
    WHERE user_id = current_user_id AND experiment_name = p_experiment_name;
  ELSE
    SELECT variant INTO assigned_variant
    FROM public.ab_assignments
    WHERE session_id = p_session_id AND experiment_name = p_experiment_name;
  END IF;
  
  -- Si déjà assigné, retourner la variante existante
  IF assigned_variant IS NOT NULL THEN
    RETURN assigned_variant;
  END IF;
  
  -- Créer un identifiant pour le hash
  user_identifier := COALESCE(current_user_id::text, p_session_id);
  
  -- Générer un hash déterministe
  hash_value := abs(hashtext(user_identifier || p_experiment_name));
  
  -- Calculer l'index de la variante (simple répartition 50/50 pour A/B)
  variant_index := (hash_value % 100);
  
  -- Assigner la variante (pour l'instant, simple 50/50)
  IF variant_index < 50 THEN
    assigned_variant := 'A';
  ELSE
    assigned_variant := 'B';
  END IF;
  
  -- Sauvegarder l'assignation
  INSERT INTO public.ab_assignments (user_id, session_id, experiment_name, variant)
  VALUES (current_user_id, p_session_id, p_experiment_name, assigned_variant);
  
  RETURN assigned_variant;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour logger un événement A/B
CREATE OR REPLACE FUNCTION public.log_ab_event(
  p_experiment_name text,
  p_event_type text,
  p_value numeric DEFAULT 0,
  p_metadata jsonb DEFAULT '{}',
  p_session_id text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  current_user_id uuid;
  user_variant text;
  event_id uuid;
BEGIN
  current_user_id := auth.uid();
  
  -- Récupérer la variante de l'utilisateur
  IF current_user_id IS NOT NULL THEN
    SELECT variant INTO user_variant
    FROM public.ab_assignments
    WHERE user_id = current_user_id AND experiment_name = p_experiment_name;
  ELSE
    SELECT variant INTO user_variant
    FROM public.ab_assignments
    WHERE session_id = p_session_id AND experiment_name = p_experiment_name;
  END IF;
  
  -- Si pas d'assignation, on ne peut pas logger
  IF user_variant IS NULL THEN
    RAISE EXCEPTION 'Utilisateur non assigné à l''expérience: %', p_experiment_name;
  END IF;
  
  -- Logger l'événement
  INSERT INTO public.ab_events (
    user_id, 
    session_id, 
    experiment_name, 
    variant, 
    event_type, 
    value, 
    metadata
  )
  VALUES (
    current_user_id,
    p_session_id,
    p_experiment_name,
    user_variant,
    p_event_type,
    p_value,
    p_metadata
  )
  RETURNING id INTO event_id;
  
  RETURN event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour les timestamps
CREATE TRIGGER update_ab_experiments_updated_at
  BEFORE UPDATE ON public.ab_experiments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.ab_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ab_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ab_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view active experiments" 
ON public.ab_experiments 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Users can view their own assignments" 
ON public.ab_assignments 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own AB events" 
ON public.ab_events 
FOR SELECT 
USING (auth.uid() = user_id);

-- Les admins peuvent tout voir
CREATE POLICY "Admins can manage experiments" 
ON public.ab_experiments 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can view all assignments" 
ON public.ab_assignments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can view all AB events" 
ON public.ab_events 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS ab_assignments_user_id_idx ON public.ab_assignments(user_id);
CREATE INDEX IF NOT EXISTS ab_assignments_session_id_idx ON public.ab_assignments(session_id);
CREATE INDEX IF NOT EXISTS ab_assignments_experiment_idx ON public.ab_assignments(experiment_name);
CREATE INDEX IF NOT EXISTS ab_events_experiment_variant_idx ON public.ab_events(experiment_name, variant);
CREATE INDEX IF NOT EXISTS ab_events_created_at_idx ON public.ab_events(created_at DESC);

-- Insérer une expérience exemple
INSERT INTO public.ab_experiments (name, description, variants, traffic_split) VALUES
('product_page_layout', 'Test de deux layouts de page produit', '["classic", "modern"]', '{"classic": 50, "modern": 50}')
ON CONFLICT (name) DO NOTHING;
```

