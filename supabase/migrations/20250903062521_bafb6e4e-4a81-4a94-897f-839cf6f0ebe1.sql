-- Create stores table
CREATE TABLE public.stores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  postal_code TEXT,
  phone TEXT,
  email TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  delivery_fee DECIMAL(10, 2) DEFAULT 5.99,
  minimum_order DECIMAL(10, 2) DEFAULT 25.00,
  is_active BOOLEAN DEFAULT true,
  operating_hours JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  barcode TEXT,
  unit TEXT DEFAULT 'unité',
  weight DECIMAL(10, 3),
  in_stock BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cart table for user orders
CREATE TABLE public.cart (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Enable Row Level Security
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart ENABLE ROW LEVEL SECURITY;

-- RLS Policies for stores (public read access)
CREATE POLICY "Anyone can view stores" 
ON public.stores 
FOR SELECT 
USING (is_active = true);

-- RLS Policies for products (public read access)
CREATE POLICY "Anyone can view products" 
ON public.products 
FOR SELECT 
USING (in_stock = true);

-- RLS Policies for cart (user specific)
CREATE POLICY "Users can view their own cart" 
ON public.cart 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert into their own cart" 
ON public.cart 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cart" 
ON public.cart 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete from their own cart" 
ON public.cart 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_stores_updated_at
  BEFORE UPDATE ON public.stores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cart_updated_at
  BEFORE UPDATE ON public.cart
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample stores
INSERT INTO public.stores (name, address, city, postal_code, phone, latitude, longitude, delivery_fee, minimum_order, operating_hours) VALUES
('Maxi Valleyfield', '50 Rue Nicholson', 'Salaberry-de-Valleyfield', 'J6T 4M2', '(450) 377-1234', 45.2482, -74.1334, 4.99, 25.00, '{"lundi": "8:00-22:00", "mardi": "8:00-22:00", "mercredi": "8:00-22:00", "jeudi": "8:00-22:00", "vendredi": "8:00-22:00", "samedi": "8:00-22:00", "dimanche": "8:00-21:00"}'),
('Walmart Valleyfield', '405 Boulevard Mgr Langlois', 'Salaberry-de-Valleyfield', 'J6S 0M2', '(450) 377-5678', 45.2515, -74.1456, 6.99, 35.00, '{"lundi": "7:00-23:00", "mardi": "7:00-23:00", "mercredi": "7:00-23:00", "jeudi": "7:00-23:00", "vendredi": "7:00-23:00", "samedi": "7:00-23:00", "dimanche": "8:00-22:00"}'),
('Marché d''Août', '123 Rue Victoria', 'Salaberry-de-Valleyfield', 'J6T 1B8', '(450) 377-9876', 45.2501, -74.1298, 3.99, 20.00, '{"lundi": "9:00-18:00", "mardi": "9:00-18:00", "mercredi": "9:00-18:00", "jeudi": "9:00-18:00", "vendredi": "9:00-18:00", "samedi": "9:00-17:00", "dimanche": "fermé"}');

-- Insert sample products for Maxi
INSERT INTO public.products (store_id, name, description, category, price, image_url, unit, in_stock) VALUES
((SELECT id FROM public.stores WHERE name = 'Maxi Valleyfield'), 'Lait 2% 2L', 'Lait partiellement écrémé', 'Produits Laitiers', 4.99, '/api/placeholder/200/200', '2L', true),
((SELECT id FROM public.stores WHERE name = 'Maxi Valleyfield'), 'Pain tranché blanc', 'Pain blanc classique', 'Boulangerie', 2.49, '/api/placeholder/200/200', 'unité', true),
((SELECT id FROM public.stores WHERE name = 'Maxi Valleyfield'), 'Bananes', 'Bananes fraîches', 'Fruits & Légumes', 1.99, '/api/placeholder/200/200', 'kg', true),
((SELECT id FROM public.stores WHERE name = 'Maxi Valleyfield'), 'Fromage cheddar fort', 'Fromage cheddar vieilli', 'Produits Laitiers', 6.99, '/api/placeholder/200/200', '400g', true),
((SELECT id FROM public.stores WHERE name = 'Maxi Valleyfield'), 'Pommes Gala', 'Pommes fraîches du Québec', 'Fruits & Légumes', 3.49, '/api/placeholder/200/200', 'kg', true),
((SELECT id FROM public.stores WHERE name = 'Maxi Valleyfield'), 'Coca-Cola 2L', 'Boisson gazeuse', 'Boissons', 2.99, '/api/placeholder/200/200', '2L', true),
((SELECT id FROM public.stores WHERE name = 'Maxi Valleyfield'), 'Bœuf haché maigre', 'Bœuf haché 85% maigre', 'Viande', 8.99, '/api/placeholder/200/200', 'kg', true);

-- Insert sample products for Walmart
INSERT INTO public.products (store_id, name, description, category, price, image_url, unit, in_stock) VALUES
((SELECT id FROM public.stores WHERE name = 'Walmart Valleyfield'), 'Lait 1% 4L', 'Lait écrémé grand format', 'Produits Laitiers', 7.99, '/api/placeholder/200/200', '4L', true),
((SELECT id FROM public.stores WHERE name = 'Walmart Valleyfield'), 'Céréales Cheerios', 'Céréales aux avoine', 'Petit-déjeuner', 5.99, '/api/placeholder/200/200', '550g', true),
((SELECT id FROM public.stores WHERE name = 'Walmart Valleyfield'), 'Oranges navels', 'Oranges sucrées', 'Fruits & Légumes', 4.99, '/api/placeholder/200/200', 'sac 3kg', true),
((SELECT id FROM public.stores WHERE name = 'Walmart Valleyfield'), 'Yaourt grec vanille', 'Yaourt protéiné', 'Produits Laitiers', 4.49, '/api/placeholder/200/200', '750g', true),
((SELECT id FROM public.stores WHERE name = 'Walmart Valleyfield'), 'Poulet entier', 'Poulet fermier', 'Viande', 12.99, '/api/placeholder/200/200', 'kg', true);

-- Insert sample products for Marché d'Août (local market - fewer products)
INSERT INTO public.products (store_id, name, description, category, price, image_url, unit, in_stock) VALUES
((SELECT id FROM public.stores WHERE name = 'Marché d''Août'), 'Tomates du jardin', 'Tomates fraîches locales', 'Fruits & Légumes', 5.99, '/api/placeholder/200/200', 'kg', true),
((SELECT id FROM public.stores WHERE name = 'Marché d''Août'), 'Laitue Boston', 'Salade fraîche locale', 'Fruits & Légumes', 2.99, '/api/placeholder/200/200', 'unité', true),
((SELECT id FROM public.stores WHERE name = 'Marché d''Août'), 'Fromage de chèvre', 'Fromage artisanal local', 'Produits Laitiers', 8.99, '/api/placeholder/200/200', '200g', true);