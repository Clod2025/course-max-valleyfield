-- Il semble qu'il y ait encore une table sans RLS
-- Vérifiions toutes les tables publiques et activons RLS sur celles qui ne l'ont pas

-- Récupérer les tables sans RLS et les corriger
DO $$
DECLARE
    table_record RECORD;
BEGIN
    -- Parcourir toutes les tables publiques sans RLS
    FOR table_record IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND rowsecurity = false
    LOOP
        -- Activer RLS sur chaque table
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_record.tablename);
        RAISE NOTICE 'RLS activé pour la table: %', table_record.tablename;
    END LOOP;
END $$;