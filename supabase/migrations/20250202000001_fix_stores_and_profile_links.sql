-- Migration pour corriger les liens entre profiles et stores
-- Date: 2025-02-02
-- Ajoute owner_id à stores et store_id à profiles si nécessaire

-- 1. Ajouter owner_id à stores si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stores' AND column_name = 'owner_id' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.stores 
    ADD COLUMN owner_id uuid;
    
    RAISE NOTICE 'Colonne owner_id ajoutée à la table stores';
  ELSE
    RAISE NOTICE 'Colonne owner_id existe déjà dans la table stores';
  END IF;
END $$;

-- 2. Ajouter store_id à profiles si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'store_id' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN store_id uuid;
    
    RAISE NOTICE 'Colonne store_id ajoutée à la table profiles';
  ELSE
    RAISE NOTICE 'Colonne store_id existe déjà dans la table profiles';
  END IF;
END $$;

-- Index pour optimiser les recherches
CREATE INDEX IF NOT EXISTS idx_stores_owner_id ON public.stores(owner_id);
CREATE INDEX IF NOT EXISTS idx_profiles_store_id ON public.profiles(store_id);

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '✅ Migration de liaison profiles-stores terminée!';
  RAISE NOTICE '🔗 Colonne owner_id créée/vérifiée dans stores';
  RAISE NOTICE '🔗 Colonne store_id créée/vérifiée dans profiles';
  RAISE NOTICE '📊 Index créés';
END $$;
