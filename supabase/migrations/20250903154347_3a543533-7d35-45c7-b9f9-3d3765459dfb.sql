-- CourseMax Complete Database Schema
-- =======================================

-- Create custom types for user roles and statuses
CREATE TYPE user_role AS ENUM ('client', 'merchant', 'driver', 'admin');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'preparing', 'ready_for_pickup', 'in_delivery', 'delivered', 'cancelled');
CREATE TYPE delivery_status AS ENUM ('assigned', 'pickup_ready', 'picked_up', 'in_transit', 'delivered', 'failed');

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  email text NOT NULL,
  first_name text,
  last_name text,
  phone text,
  address text,
  city text DEFAULT 'Valleyfield',
  postal_code text,
  avatar_url text,
  role user_role DEFAULT 'client' NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Stores table (merchants)
CREATE TABLE IF NOT EXISTS public.stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL,
  city text DEFAULT 'Valleyfield' NOT NULL,
  postal_code text,
  phone text,
  email text,
  latitude numeric,
  longitude numeric,
  minimum_order numeric DEFAULT 25.00,
  delivery_fee numeric DEFAULT 5.99,
  operating_hours jsonb,
  is_active boolean DEFAULT true,
  store_type text DEFAULT 'grocery', -- grocery, pharmacy, warehouse
  manager_id uuid REFERENCES public.profiles(user_id),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Products table
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  category text NOT NULL,
  price numeric NOT NULL CHECK (price > 0),
  unit text DEFAULT 'unité',
  barcode text,
  image_url text,
  weight numeric,
  in_stock boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Cart table
CREATE TABLE IF NOT EXISTS public.cart (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  quantity integer DEFAULT 1 CHECK (quantity > 0),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, product_id, store_id)
);

-- Orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL DEFAULT ('CM' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD((EXTRACT(EPOCH FROM NOW())::BIGINT % 100000)::TEXT, 5, '0')),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  store_id uuid REFERENCES public.stores(id) NOT NULL,
  status order_status DEFAULT 'pending' NOT NULL,
  items jsonb NOT NULL, -- Store the cart items as JSON for historical purposes
  subtotal numeric NOT NULL CHECK (subtotal >= 0),
  tax_amount numeric DEFAULT 0 CHECK (tax_amount >= 0),
  delivery_fee numeric DEFAULT 5.99 CHECK (delivery_fee >= 0),
  total_amount numeric NOT NULL CHECK (total_amount >= 0),
  delivery_address text NOT NULL,
  delivery_city text DEFAULT 'Valleyfield' NOT NULL,
  delivery_postal_code text,
  phone text NOT NULL,
  notes text,
  delivery_instructions text,
  estimated_delivery timestamptz,
  delivered_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Order items table (detailed breakdown)
CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES public.products(id) NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric NOT NULL CHECK (unit_price >= 0),
  total_price numeric NOT NULL CHECK (total_price >= 0),
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Deliveries table
CREATE TABLE IF NOT EXISTS public.deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE UNIQUE NOT NULL,
  driver_id uuid REFERENCES public.profiles(user_id),
  status delivery_status DEFAULT 'assigned' NOT NULL,
  tracking_code text UNIQUE,
  estimated_delivery timestamptz,
  pickup_time timestamptz,
  actual_delivery timestamptz,
  driver_notes text,
  delivery_notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Favorites table
CREATE TABLE IF NOT EXISTS public.favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, product_id)
);

-- Recent orders/products for quick reorder
CREATE TABLE IF NOT EXISTS public.recent_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  accessed_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, order_id)
);

-- Settings table for admin-configurable content
CREATE TABLE IF NOT EXISTS public.settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb,
  description text,
  category text DEFAULT 'general',
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recent_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Create security definer function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid uuid)
RETURNS user_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE user_id = user_uuid;
$$;

-- Profiles RLS policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- Stores RLS policies
CREATE POLICY "Anyone can view active stores" ON public.stores
  FOR SELECT USING (is_active = true);

CREATE POLICY "Store managers can manage their stores" ON public.stores
  FOR ALL USING (manager_id = auth.uid() OR public.get_user_role(auth.uid()) = 'admin');

-- Products RLS policies
CREATE POLICY "Anyone can view products in stock" ON public.products
  FOR SELECT USING (in_stock = true);

CREATE POLICY "Store managers can manage their products" ON public.products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.stores 
      WHERE id = products.store_id 
      AND (manager_id = auth.uid() OR public.get_user_role(auth.uid()) = 'admin')
    )
  );

-- Cart RLS policies
CREATE POLICY "Users can view their own cart" ON public.cart
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert into their own cart" ON public.cart
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cart" ON public.cart
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete from their own cart" ON public.cart
  FOR DELETE USING (auth.uid() = user_id);

-- Orders RLS policies
CREATE POLICY "Users can view their own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Store managers can view their store orders" ON public.orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.stores 
      WHERE id = orders.store_id 
      AND manager_id = auth.uid()
    )
  );

CREATE POLICY "Drivers can view assigned deliveries orders" ON public.orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.deliveries d
      JOIN public.profiles p ON p.user_id = auth.uid()
      WHERE d.order_id = orders.id 
      AND d.driver_id = auth.uid() 
      AND p.role = 'driver'
    )
  );

CREATE POLICY "Admins can view all orders" ON public.orders
  FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- Order items RLS policies
CREATE POLICY "Users can view their order items" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id 
      AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "Store managers can view their order items" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      JOIN public.stores s ON s.id = o.store_id
      WHERE o.id = order_items.order_id 
      AND s.manager_id = auth.uid()
    )
  );

-- Deliveries RLS policies
CREATE POLICY "Users can view their order deliveries" ON public.deliveries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = deliveries.order_id 
      AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "Drivers can view their own deliveries" ON public.deliveries
  FOR SELECT USING (auth.uid() = driver_id);

CREATE POLICY "Drivers can update their own deliveries" ON public.deliveries
  FOR UPDATE USING (auth.uid() = driver_id);

CREATE POLICY "Admins can manage all deliveries" ON public.deliveries
  FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- Favorites RLS policies
CREATE POLICY "Users can manage their own favorites" ON public.favorites
  FOR ALL USING (auth.uid() = user_id);

-- Recent orders RLS policies
CREATE POLICY "Users can manage their own recent orders" ON public.recent_orders
  FOR ALL USING (auth.uid() = user_id);

-- Settings RLS policies
CREATE POLICY "Everyone can view public settings" ON public.settings
  FOR SELECT USING (is_public = true);

CREATE POLICY "Admins can manage all settings" ON public.settings
  FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- Functions and triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON public.stores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cart_updated_at BEFORE UPDATE ON public.cart FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_deliveries_updated_at BEFORE UPDATE ON public.deliveries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON public.settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, first_name, last_name)
  VALUES (
    NEW.id, 
    NEW.email,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create profile on user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to generate order numbers
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 'CM' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD((EXTRACT(EPOCH FROM NOW())::BIGINT % 100000)::TEXT, 5, '0');
$$;

-- Insert default settings
INSERT INTO public.settings (key, value, description, is_public) VALUES
  ('footer_cta_driver', '{"text": "Devenir livreur", "url": "/register?role=driver"}', 'CTA pour devenir livreur', true),
  ('footer_cta_client', '{"text": "Créer un compte client", "url": "/register?role=client"}', 'CTA pour créer un compte client', true),
  ('footer_cta_merchant', '{"text": "Vous êtes marchand ?", "url": "/register?role=merchant"}', 'CTA pour les marchands', true),
  ('company_info', '{"name": "CourseMax", "address": "Valleyfield, QC", "phone": "450-123-4567", "email": "info@coursemax.ca"}', 'Informations de l\'entreprise', true),
  ('delivery_settings', '{"base_fee": 5.99, "per_km": 1.50, "free_delivery_minimum": 50.00}', 'Paramètres de livraison', false)
ON CONFLICT (key) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_stores_active ON public.stores(is_active);
CREATE INDEX IF NOT EXISTS idx_stores_type ON public.stores(store_type);
CREATE INDEX IF NOT EXISTS idx_products_store_id ON public.products(store_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_stock ON public.products(in_stock);
CREATE INDEX IF NOT EXISTS idx_cart_user_store ON public.cart(user_id, store_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_store_id ON public.orders(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_driver_id ON public.deliveries(driver_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON public.deliveries(status);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_recent_orders_user_id ON public.recent_orders(user_id);

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.deliveries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cart;