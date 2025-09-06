-- Infrastructure pour Machine Learning
-- ====================================

-- Table pour stocker les prédictions ML
CREATE TABLE IF NOT EXISTS public.ml_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_name text NOT NULL,
  model_version text NOT NULL,
  prediction_type text NOT NULL, -- 'demand_forecast', 'peak_hours', 'popular_products'
  input_data jsonb NOT NULL,
  prediction jsonb NOT NULL,
  confidence_score numeric(5,4),
  valid_from timestamptz DEFAULT now(),
  valid_until timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Table pour les métriques de modèles
CREATE TABLE IF NOT EXISTS public.ml_model_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_name text NOT NULL,
  model_version text NOT NULL,
  metric_name text NOT NULL, -- 'mae', 'rmse', 'accuracy', 'precision', 'recall'
  metric_value numeric NOT NULL,
  evaluation_date timestamptz DEFAULT now(),
  dataset_info jsonb DEFAULT '{}'
);

-- Table pour les features engineering
CREATE TABLE IF NOT EXISTS public.ml_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_set_name text NOT NULL,
  feature_data jsonb NOT NULL,
  computed_at timestamptz DEFAULT now(),
  valid_until timestamptz
);

-- Vue agrégée pour les données de commandes (feature engineering)
CREATE OR REPLACE VIEW public.ml_order_features AS
WITH hourly_orders AS (
  SELECT 
    DATE_TRUNC('hour', created_at) as hour_bucket,
    COUNT(*) as order_count,
    AVG(total_amount) as avg_order_value,
    SUM(total_amount) as total_revenue,
    COUNT(DISTINCT user_id) as unique_customers,
    EXTRACT(HOUR FROM created_at) as hour_of_day,
    EXTRACT(DOW FROM created_at) as day_of_week,
    EXTRACT(MONTH FROM created_at) as month
  FROM public.orders
  WHERE status = 'delivered'
  GROUP BY DATE_TRUNC('hour', created_at), 
           EXTRACT(HOUR FROM created_at),
           EXTRACT(DOW FROM created_at),
           EXTRACT(MONTH FROM created_at)
),
weather_features AS (
  -- Placeholder pour les données météo qui pourraient être ajoutées
  SELECT 
    hour_bucket,
    0 as temperature, -- À remplacer par vraies données météo
    0 as precipitation,
    'clear' as weather_condition
  FROM hourly_orders
)
SELECT 
  h.*,
  w.temperature,
  w.precipitation,
  w.weather_condition,
  LAG(h.order_count, 1) OVER (ORDER BY h.hour_bucket) as prev_hour_orders,
  LAG(h.order_count, 24) OVER (ORDER BY h.hour_bucket) as same_hour_yesterday,
  LAG(h.order_count, 168) OVER (ORDER BY h.hour_bucket) as same_hour_last_week
FROM hourly_orders h
LEFT JOIN weather_features w ON h.hour_bucket = w.hour_bucket
ORDER BY h.hour_bucket;

-- Vue pour les produits populaires par période
CREATE OR REPLACE VIEW public.ml_product_popularity AS
SELECT 
  p.id as product_id,
  p.name,
  p.category,
  DATE_TRUNC('day', o.created_at) as date_bucket,
  COUNT(*) as order_frequency,
  SUM(CAST(item->>'quantity' AS INTEGER)) as total_quantity,
  AVG(CAST(item->>'price' AS NUMERIC)) as avg_price,
  EXTRACT(DOW FROM o.created_at) as day_of_week,
  EXTRACT(HOUR FROM o.created_at) as hour_of_day
FROM public.products p
JOIN public.orders o ON true
CROSS JOIN LATERAL jsonb_array_elements(o.items) as item
WHERE item->>'product_id' = p.id::text
  AND o.status = 'delivered'
GROUP BY p.id, p.name, p.category, 
         DATE_TRUNC('day', o.created_at),
         EXTRACT(DOW FROM o.created_at),
         EXTRACT(HOUR FROM o.created_at);

-- Fonction pour obtenir les données d'entraînement pour prédiction de demande
CREATE OR REPLACE FUNCTION public.get_ml_training_data(
  p_days_back integer DEFAULT 90,
  p_store_id uuid DEFAULT NULL
)
RETURNS TABLE (
  timestamp timestamptz,
  order_count bigint,
  revenue numeric,
  avg_order_value numeric,
  unique_customers bigint,
  hour_of_day numeric,
  day_of_week numeric,
  month numeric,
  is_weekend boolean,
  is_holiday boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mof.hour_bucket as timestamp,
    mof.order_count,
    mof.total_revenue as revenue,
    mof.avg_order_value,
    mof.unique_customers,
    mof.hour_of_day,
    mof.day_of_week,
    mof.month,
    (mof.day_of_week IN (0, 6)) as is_weekend,
    false as is_holiday -- Placeholder pour les jours fériés
  FROM public.ml_order_features mof
  WHERE mof.hour_bucket >= (now() - interval '1 day' * p_days_back);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour sauvegarder une prédiction
CREATE OR REPLACE FUNCTION public.save_ml_prediction(
  p_model_name text,
  p_model_version text,
  p_prediction_type text,
  p_input_data jsonb,
  p_prediction jsonb,
  p_confidence_score numeric DEFAULT NULL,
  p_valid_until timestamptz DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  prediction_id uuid;
BEGIN
  INSERT INTO public.ml_predictions (
    model_name,
    model_version,
    prediction_type,
    input_data,
    prediction,
    confidence_score,
    valid_until
  )
  VALUES (
    p_model_name,
    p_model_version,
    p_prediction_type,
    p_input_data,
    p_prediction,
    p_confidence_score,
    COALESCE(p_valid_until, now() + interval '24 hours')
  )
  RETURNING id INTO prediction_id;
  
  RETURN prediction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS
ALTER TABLE public.ml_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_model_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_features ENABLE ROW LEVEL SECURITY;

-- RLS Policies (seuls les admins peuvent voir les données ML)
CREATE POLICY "Admins can manage ML predictions" 
ON public.ml_predictions 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can manage ML metrics" 
ON public.ml_model_metrics 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can manage ML features" 
ON public.ml_features 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS ml_predictions_model_type_idx ON public.ml_predictions(model_name, prediction_type);
CREATE INDEX IF NOT EXISTS ml_predictions_valid_range_idx ON public.ml_predictions(valid_from, valid_until);
CREATE INDEX IF NOT EXISTS ml_model_metrics_model_idx ON public.ml_model_metrics(model_name, model_version);
CREATE INDEX IF NOT EXISTS ml_features_set_name_idx ON public.ml_features(feature_set_name);
```

