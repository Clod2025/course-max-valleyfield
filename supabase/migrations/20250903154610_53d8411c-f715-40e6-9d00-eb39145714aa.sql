-- CourseMax Database Schema - Safe Migration
-- =======================================

-- Create custom types only if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('client', 'merchant', 'driver', 'admin');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
        CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'preparing', 'ready_for_pickup', 'in_delivery', 'delivered', 'cancelled');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'delivery_status') THEN
        CREATE TYPE delivery_status AS ENUM ('assigned', 'pickup_ready', 'picked_up', 'in_transit', 'delivered', 'failed');
    END IF;
END
$$;

-- Add missing columns to existing profiles table
DO $$
BEGIN
    -- Add phone column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'phone') THEN
        ALTER TABLE public.profiles ADD COLUMN phone text;
    END IF;
    
    -- Add address column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'address') THEN
        ALTER TABLE public.profiles ADD COLUMN address text;
    END IF;
    
    -- Add postal_code column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'postal_code') THEN
        ALTER TABLE public.profiles ADD COLUMN postal_code text;
    END IF;
    
    -- Add city column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'city') THEN
        ALTER TABLE public.profiles ADD COLUMN city text DEFAULT 'Valleyfield';
    END IF;
    
    -- Add avatar_url column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'avatar_url') THEN
        ALTER TABLE public.profiles ADD COLUMN avatar_url text;
    END IF;
END
$$;

-- Favorites table
CREATE TABLE IF NOT EXISTS public.favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, product_id)
);

-- Recent orders table for quick reorder
CREATE TABLE IF NOT EXISTS public.recent_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  accessed_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, order_id)
);

-- Enable RLS on new tables
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recent_orders ENABLE ROW LEVEL SECURITY;

-- Favorites RLS policies
DROP POLICY IF EXISTS "Users can manage their own favorites" ON public.favorites;
CREATE POLICY "Users can manage their own favorites" ON public.favorites
  FOR ALL USING (auth.uid() = user_id);

-- Recent orders RLS policies
DROP POLICY IF EXISTS "Users can manage their own recent orders" ON public.recent_orders;
CREATE POLICY "Users can manage their own recent orders" ON public.recent_orders
  FOR ALL USING (auth.uid() = user_id);

-- Update RLS policies for orders to allow merchants and drivers to update status
DROP POLICY IF EXISTS "Store managers can update order status" ON public.orders;
CREATE POLICY "Store managers can update order status" ON public.orders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.stores 
      WHERE id = orders.store_id 
      AND manager_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can manage orders" ON public.orders;
CREATE POLICY "Admins can manage orders" ON public.orders
  FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- Allow order_items inserts for new orders
DROP POLICY IF EXISTS "Allow order items creation" ON public.order_items;
CREATE POLICY "Allow order items creation" ON public.order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id 
      AND o.user_id = auth.uid()
    )
  );

-- Deliveries policies updates
DROP POLICY IF EXISTS "Admins can create deliveries" ON public.deliveries;
CREATE POLICY "Admins can create deliveries" ON public.deliveries
  FOR INSERT WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

-- Insert default settings if they don't exist
INSERT INTO public.settings (key, value, description, is_public) 
SELECT * FROM (VALUES
  ('footer_cta_driver', '{"text": "Devenir livreur", "url": "/register?role=driver"}', 'CTA pour devenir livreur', true),
  ('footer_cta_client', '{"text": "Créer un compte client", "url": "/register?role=client"}', 'CTA pour créer un compte client', true),
  ('footer_cta_merchant', '{"text": "Vous êtes marchand ?", "url": "/register?role=merchant"}', 'CTA pour les marchands', true),
  ('company_info', '{"name": "CourseMax", "address": "Valleyfield, QC", "phone": "450-123-4567", "email": "info@coursemax.ca"}', 'Informations de la compagnie', true),
  ('delivery_settings', '{"base_fee": 5.99, "per_km": 1.50, "free_delivery_minimum": 50.00}', 'Paramètres de livraison', false)
) AS v(key, value, description, is_public)
WHERE NOT EXISTS (SELECT 1 FROM public.settings s WHERE s.key = v.key);

-- Create indexes for new tables
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_recent_orders_user_id ON public.recent_orders(user_id);

-- Enable realtime for key tables (if not already enabled)
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
    EXCEPTION WHEN duplicate_object THEN
        -- Table already in publication, ignore
    END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.deliveries;
    EXCEPTION WHEN duplicate_object THEN
        -- Table already in publication, ignore
    END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.cart;
    EXCEPTION WHEN duplicate_object THEN
        -- Table already in publication, ignore
    END;
END
$$;