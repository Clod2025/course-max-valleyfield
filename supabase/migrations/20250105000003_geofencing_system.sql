-- Système de géofencing avec PostGIS
-- ==================================

-- Activer l'extension PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- Table des zones de livraison
CREATE TABLE IF NOT EXISTS public.delivery_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  area geometry(POLYGON, 4326) NOT NULL, -- Polygone en WGS84
  is_active boolean DEFAULT true,
  delivery_fee_modifier numeric(4,2) DEFAULT 1.0, -- Multiplicateur du tarif de base
  max_delivery_distance numeric(10,2) DEFAULT 10000, -- Distance max en mètres
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Fonction RPC pour vérifier si une coordonnée est dans une zone de livraison
CREATE OR REPLACE FUNCTION public.is_in_delivery_zone(
  longitude numeric,
  latitude numeric
)
RETURNS jsonb AS $$
DECLARE
  point_geom geometry;
  zone_record record;
  result jsonb := jsonb_build_object(
    'in_zone', false,
    'zone_id', null,
    'zone_name', null,
    'delivery_fee_modifier', 1.0,
    'max_distance', 10000
  );
BEGIN
  -- Créer le point géométrique
  point_geom := ST_SetSRID(ST_MakePoint(longitude, latitude), 4326);
  
  -- Chercher la première zone qui contient ce point
  SELECT id, name, delivery_fee_modifier, max_delivery_distance
  INTO zone_record
  FROM public.delivery_zones
  WHERE is_active = true
  AND ST_Contains(area, point_geom)
  LIMIT 1;
  
  -- Si une zone est trouvée
  IF FOUND THEN
    result := jsonb_build_object(
      'in_zone', true,
      'zone_id', zone_record.id,
      'zone_name', zone_record.name,
      'delivery_fee_modifier', zone_record.delivery_fee_modifier,
      'max_distance', zone_record.max_delivery_distance
    );
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour calculer la distance entre deux points
CREATE OR REPLACE FUNCTION public.calculate_distance_km(
  lon1 numeric,
  lat1 numeric,
  lon2 numeric,
  lat2 numeric
)
RETURNS numeric AS $$
DECLARE
  point1 geometry;
  point2 geometry;
  distance_meters numeric;
BEGIN
  point1 := ST_SetSRID(ST_MakePoint(lon1, lat1), 4326);
  point2 := ST_SetSRID(ST_MakePoint(lon2, lat2), 4326);
  
  -- Calculer la distance en mètres puis convertir en km
  distance_meters := ST_Distance(ST_Transform(point1, 3857), ST_Transform(point2, 3857));
  
  RETURN ROUND((distance_meters / 1000)::numeric, 2);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour valider une adresse de livraison
CREATE OR REPLACE FUNCTION public.validate_delivery_address(
  delivery_longitude numeric,
  delivery_latitude numeric,
  store_id uuid
)
RETURNS jsonb AS $$
DECLARE
  store_record record;
  zone_info jsonb;
  distance_km numeric;
  result jsonb;
BEGIN
  -- Récupérer les infos du magasin
  SELECT longitude, latitude INTO store_record
  FROM public.stores
  WHERE id = store_id AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Magasin non trouvé ou inactif'
    );
  END IF;
  
  -- Vérifier si l'adresse est dans une zone de livraison
  zone_info := public.is_in_delivery_zone(delivery_longitude, delivery_latitude);
  
  IF NOT (zone_info->>'in_zone')::boolean THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Adresse hors zone de livraison',
      'zone_info', zone_info
    );
  END IF;
  
  -- Calculer la distance du magasin à l'adresse
  distance_km := public.calculate_distance_km(
    store_record.longitude,
    store_record.latitude,
    delivery_longitude,
    delivery_latitude
  );
  
  -- Vérifier si la distance est acceptable
  IF distance_km > (zone_info->>'max_distance')::numeric / 1000 THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Adresse trop éloignée du magasin',
      'distance_km', distance_km,
      'max_distance_km', (zone_info->>'max_distance')::numeric / 1000,
      'zone_info', zone_info
    );
  END IF;
  
  -- Tout est OK
  RETURN jsonb_build_object(
    'valid', true,
    'distance_km', distance_km,
    'zone_info', zone_info
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour les timestamps
CREATE TRIGGER update_delivery_zones_updated_at
  BEFORE UPDATE ON public.delivery_zones
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;

-- RLS Policies pour les zones de livraison
CREATE POLICY "Anyone can view active delivery zones" 
ON public.delivery_zones 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage delivery zones" 
ON public.delivery_zones 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Index spatial pour les performances
CREATE INDEX IF NOT EXISTS delivery_zones_area_idx ON public.delivery_zones USING GIST(area);
CREATE INDEX IF NOT EXISTS delivery_zones_active_idx ON public.delivery_zones(is_active) WHERE is_active = true;

-- Insérer une zone de livraison par défaut pour Valleyfield
INSERT INTO public.delivery_zones (name, description, area) VALUES (
  'Valleyfield Centre',
  'Zone de livraison principale de Salaberry-de-Valleyfield',
  ST_GeomFromText(
    'POLYGON((-74.15 45.24, -74.12 45.24, -74.12 45.26, -74.15 45.26, -74.15 45.24))',
    4326
  )
) ON CONFLICT DO NOTHING;
```

