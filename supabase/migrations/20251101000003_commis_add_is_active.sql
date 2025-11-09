-- Migration: Ensure commis.is_active column exists
-- Date: 2025-11-01

ALTER TABLE public.commis
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

UPDATE public.commis
SET is_active = true
WHERE is_active IS NULL;

DO $$
BEGIN
  RAISE NOTICE 'Column is_active ensured on commis table.';
END $$;

