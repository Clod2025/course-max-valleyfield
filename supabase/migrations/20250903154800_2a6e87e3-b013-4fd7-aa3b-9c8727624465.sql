-- Patch: add manager_id to stores and align policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'stores' AND column_name = 'manager_id'
  ) THEN
    ALTER TABLE public.stores ADD COLUMN manager_id uuid REFERENCES public.profiles(user_id);
  END IF;
END
$$;

-- Ensure policy for merchant updating orders exists and uses manager_id
DROP POLICY IF EXISTS "Store managers can update order status" ON public.orders;
CREATE POLICY "Store managers can update order status" ON public.orders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = orders.store_id AND s.manager_id = auth.uid()
    )
  );