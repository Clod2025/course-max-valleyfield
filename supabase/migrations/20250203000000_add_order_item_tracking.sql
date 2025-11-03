-- Migration: Ajouter tracking de statut aux items de commande
-- Date: 2025-02-03
-- Permet de marquer chaque produit comme "à trouver", "trouvé" ou "non disponible"

-- Ajouter colonne item_status aux order_items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'order_items' AND column_name = 'item_status'
  ) THEN
    ALTER TABLE public.order_items 
    ADD COLUMN item_status TEXT DEFAULT 'to_find' 
    CHECK (item_status IN ('to_find', 'found', 'not_available'));
    
    RAISE NOTICE 'Colonne item_status ajoutée à order_items';
  ELSE
    RAISE NOTICE 'Colonne item_status existe déjà dans order_items';
  END IF;
END $$;

-- Index pour optimiser les requêtes de recherche des items
CREATE INDEX IF NOT EXISTS idx_order_items_status ON public.order_items(item_status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id_status ON public.order_items(order_id, item_status);

-- Fonction pour obtenir la progression d'une commande
CREATE OR REPLACE FUNCTION get_order_progress(p_order_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_total integer;
  v_found integer;
  v_result jsonb;
BEGIN
  SELECT 
    COUNT(*)::integer,
    COUNT(*) FILTER (WHERE item_status = 'found')::integer
  INTO v_total, v_found
  FROM public.order_items
  WHERE order_id = p_order_id;
  
  v_result := jsonb_build_object(
    'total', v_total,
    'found', v_found,
    'completed', v_found = v_total AND v_total > 0
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour le statut de la commande quand tous les items sont trouvés
CREATE OR REPLACE FUNCTION check_order_completion()
RETURNS trigger AS $$
DECLARE
  v_progress jsonb;
BEGIN
  -- Récupérer la progression
  v_progress := get_order_progress(NEW.order_id);
  
  -- Si tous les items sont trouvés et commande en préparation
  IF (v_progress->>'completed')::boolean AND 
     EXISTS (
       SELECT 1 FROM public.orders 
       WHERE id = NEW.order_id 
       AND status IN ('preparing', 'pending', 'confirmed')
     ) THEN
    -- Auto-promouvoir le statut n'est pas fait ici
    -- L'employé doit cliquer sur "Terminer la course"
    NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_order_completion
  AFTER UPDATE OF item_status ON public.order_items
  FOR EACH ROW
  WHEN (OLD.item_status IS DISTINCT FROM NEW.item_status)
  EXECUTE FUNCTION check_order_completion();

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '✅ Migration de tracking des items terminée!';
  RAISE NOTICE '📊 Colonne item_status ajoutée avec valeurs: to_find, found, not_available';
  RAISE NOTICE '🔧 Fonction get_order_progress créée';
  RAISE NOTICE '⚡ Trigger de vérification de complétion créé';
END $$;