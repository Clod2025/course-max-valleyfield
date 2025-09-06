-- Programme de fidélité CourseMax
-- ===============================

-- Table des comptes de fidélité
CREATE TABLE IF NOT EXISTS public.loyalty_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  points integer DEFAULT 0 NOT NULL CHECK (points >= 0),
  total_earned integer DEFAULT 0 NOT NULL, -- Total de points gagnés à vie
  total_redeemed integer DEFAULT 0 NOT NULL, -- Total de points utilisés
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Table des transactions de fidélité
CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  points_change integer NOT NULL, -- Positif pour gain, négatif pour utilisation
  reason text NOT NULL, -- 'order_completed', 'free_delivery_redeemed', 'manual_adjustment', etc.
  description text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Fonction pour ajouter des points après une commande complétée
CREATE OR REPLACE FUNCTION public.add_loyalty_points_for_order()
RETURNS TRIGGER AS $$
DECLARE
  points_to_add integer;
  loyalty_account_exists boolean;
BEGIN
  -- Vérifier si la commande vient d'être marquée comme 'delivered'
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
    -- Calculer les points : 1 point par 10$ dépensés (arrondi vers le bas)
    points_to_add := FLOOR(NEW.total_amount / 10);
    
    -- Vérifier si le compte de fidélité existe
    SELECT EXISTS(SELECT 1 FROM public.loyalty_accounts WHERE user_id = NEW.user_id) 
    INTO loyalty_account_exists;
    
    -- Créer le compte de fidélité s'il n'existe pas
    IF NOT loyalty_account_exists THEN
      INSERT INTO public.loyalty_accounts (user_id, points, total_earned)
      VALUES (NEW.user_id, points_to_add, points_to_add);
    ELSE
      -- Mettre à jour le compte existant
      UPDATE public.loyalty_accounts 
      SET 
        points = points + points_to_add,
        total_earned = total_earned + points_to_add,
        updated_at = now()
      WHERE user_id = NEW.user_id;
    END IF;
    
    -- Enregistrer la transaction
    INSERT INTO public.loyalty_transactions (user_id, order_id, points_change, reason, description)
    VALUES (
      NEW.user_id, 
      NEW.id, 
      points_to_add, 
      'order_completed',
      'Points gagnés pour la commande #' || NEW.order_number
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour ajouter automatiquement les points
CREATE TRIGGER add_loyalty_points_on_delivery
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.add_loyalty_points_for_order();

-- Fonction pour utiliser les points (livraison gratuite)
CREATE OR REPLACE FUNCTION public.redeem_loyalty_points(
  p_user_id uuid,
  p_points_to_redeem integer,
  p_reason text,
  p_description text DEFAULT NULL
)
RETURNS boolean AS $$
DECLARE
  current_points integer;
BEGIN
  -- Vérifier les points disponibles
  SELECT points INTO current_points 
  FROM public.loyalty_accounts 
  WHERE user_id = p_user_id;
  
  IF current_points IS NULL OR current_points < p_points_to_redeem THEN
    RETURN false; -- Pas assez de points
  END IF;
  
  -- Déduire les points
  UPDATE public.loyalty_accounts 
  SET 
    points = points - p_points_to_redeem,
    total_redeemed = total_redeemed + p_points_to_redeem,
    updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Enregistrer la transaction
  INSERT INTO public.loyalty_transactions (user_id, points_change, reason, description)
  VALUES (p_user_id, -p_points_to_redeem, p_reason, p_description);
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour les timestamps
CREATE TRIGGER update_loyalty_accounts_updated_at
  BEFORE UPDATE ON public.loyalty_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.loyalty_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies pour les comptes de fidélité
CREATE POLICY "Users can view their own loyalty account" 
ON public.loyalty_accounts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own loyalty transactions" 
ON public.loyalty_transactions 
FOR SELECT 
USING (auth.uid() = user_id);

-- Les admins peuvent voir tout
CREATE POLICY "Admins can view all loyalty accounts" 
ON public.loyalty_accounts 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can view all loyalty transactions" 
ON public.loyalty_transactions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS loyalty_accounts_user_id_idx ON public.loyalty_accounts(user_id);
CREATE INDEX IF NOT EXISTS loyalty_transactions_user_id_idx ON public.loyalty_transactions(user_id);
CREATE INDEX IF NOT EXISTS loyalty_transactions_order_id_idx ON public.loyalty_transactions(order_id);
CREATE INDEX IF NOT EXISTS loyalty_transactions_created_at_idx ON public.loyalty_transactions(created_at DESC);
```

