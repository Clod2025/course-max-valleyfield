-- Migration: Ensure commis.user_id column exists
-- Date: 2025-11-01

ALTER TABLE public.commis
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS commis_user_id_unique_idx
  ON public.commis(user_id)
  WHERE user_id IS NOT NULL;

-- Backfill user_id by matching existing emails
UPDATE public.commis c
SET user_id = u.id
FROM auth.users u
WHERE c.user_id IS NULL
  AND lower(c.email) = lower(u.email);

DO $$
BEGIN
  RAISE NOTICE 'Column user_id ensured on commis table.';
END $$;

