-- Fonction pour calculer automatiquement les commissions
CREATE OR REPLACE FUNCTION calculate_delivery_commission(
    p_order_id uuid,
    p_driver_id uuid DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
    v_delivery_fee DECIMAL(10,2);
    v_commission_percent DECIMAL(5,2);
    v_platform_amount DECIMAL(10,2);
    v_driver_amount DECIMAL(10,2);
    v_commission_id uuid;
BEGIN
    -- Récupérer les frais de livraison de la commande
    SELECT delivery_fee INTO v_delivery_fee
    FROM public.orders
    WHERE id = p_order_id;
    
    IF v_delivery_fee IS NULL THEN
        RAISE EXCEPTION 'Commande non trouvée ou frais de livraison non définis';
    END IF;
    
    -- Récupérer le pourcentage de commission
    SELECT CAST(value AS DECIMAL(5,2)) INTO v_commission_percent
    FROM public.platform_settings
    WHERE key = 'delivery_commission_percent';
    
    -- Si pas de paramètre trouvé, utiliser 20% par défaut
    IF v_commission_percent IS NULL THEN
        v_commission_percent := 20.0;
    END IF;
    
    -- Calculer les montants
    v_platform_amount := v_delivery_fee * (v_commission_percent / 100);
    v_driver_amount := v_delivery_fee - v_platform_amount;
    
    -- Insérer ou mettre à jour la commission
    INSERT INTO public.delivery_commissions (
        order_id,
        driver_id,
        delivery_fee,
        commission_percent,
        platform_amount,
        driver_amount
    ) VALUES (
        p_order_id,
        p_driver_id,
        v_delivery_fee,
        v_commission_percent,
        v_platform_amount,
        v_driver_amount
    )
    ON CONFLICT (order_id) DO UPDATE SET
        driver_id = EXCLUDED.driver_id,
        delivery_fee = EXCLUDED.delivery_fee,
        commission_percent = EXCLUDED.commission_percent,
        platform_amount = EXCLUDED.platform_amount,
        driver_amount = EXCLUDED.driver_amount,
        updated_at = timezone('utc'::text, now())
    RETURNING id INTO v_commission_id;
    
    RETURN v_commission_id;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour récupérer les paramètres de tarification
CREATE OR REPLACE FUNCTION get_delivery_pricing_settings()
RETURNS TABLE (
    fee_0_3km DECIMAL(10,2),
    fee_3_6km DECIMAL(10,2),
    fee_6_10km DECIMAL(10,2),
    fee_10plus_km DECIMAL(10,2),
    long_distance_bonus DECIMAL(10,2),
    max_distance_km DECIMAL(10,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE((SELECT CAST(value AS DECIMAL(10,2)) FROM platform_settings WHERE key = 'delivery_fee_0_3km'), 5.00),
        COALESCE((SELECT CAST(value AS DECIMAL(10,2)) FROM platform_settings WHERE key = 'delivery_fee_3_6km'), 7.00),
        COALESCE((SELECT CAST(value AS DECIMAL(10,2)) FROM platform_settings WHERE key = 'delivery_fee_6_10km'), 10.00),
        COALESCE((SELECT CAST(value AS DECIMAL(10,2)) FROM platform_settings WHERE key = 'delivery_fee_10plus_km'), 12.00),
        COALESCE((SELECT CAST(value AS DECIMAL(10,2)) FROM platform_settings WHERE key = 'delivery_fee_long_distance_bonus'), 2.00),
        COALESCE((SELECT CAST(value AS DECIMAL(10,2)) FROM platform_settings WHERE key = 'max_delivery_distance'), 25.0);
END;
$$ LANGUAGE plpgsql;

-- Fonction pour calculer les frais de livraison côté base de données
CREATE OR REPLACE FUNCTION calculate_delivery_fee_from_distance(distance_km DECIMAL)
RETURNS TABLE (
    delivery_fee DECIMAL(10,2),
    pricing_tier TEXT
) AS $$
DECLARE
    pricing RECORD;
    fee DECIMAL(10,2);
    tier TEXT;
BEGIN
    -- Récupérer les paramètres de tarification
    SELECT * INTO pricing FROM get_delivery_pricing_settings();
    
    -- Calculer les frais selon la distance
    IF distance_km <= 3 THEN
        fee := pricing.fee_0_3km;
        tier := '0-3 km';
    ELSIF distance_km <= 6 THEN
        fee := pricing.fee_3_6km;
        tier := '3-6 km';
    ELSIF distance_km <= 10 THEN
        fee := pricing.fee_6_10km;
        tier := '6-10 km';
    ELSE
        fee := pricing.fee_10plus_km;
        tier := '10+ km';
    END IF;
    
    -- Ajouter le bonus pour les longues distances
    IF distance_km > 15 THEN
        fee := fee + pricing.long_distance_bonus;
        tier := tier || ' (bonus longue distance)';
    END IF;
    
    RETURN QUERY SELECT fee, tier;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour calculer automatiquement les commissions lors de la création d'une commande
CREATE OR REPLACE FUNCTION auto_calculate_commission()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculer la commission uniquement si la commande a des frais de livraison
    IF NEW.delivery_fee > 0 THEN
        PERFORM calculate_delivery_commission(NEW.id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_calculate_commission_trigger ON public.orders;
CREATE TRIGGER auto_calculate_commission_trigger
    AFTER INSERT ON public.orders
    FOR EACH ROW EXECUTE FUNCTION auto_calculate_commission();

-- Trigger pour mettre à jour les commissions lorsqu'un livreur est assigné
CREATE OR REPLACE FUNCTION update_commission_driver()
RETURNS TRIGGER AS $$
BEGIN
    -- Mettre à jour la commission avec le driver_id
    UPDATE public.delivery_commissions
    SET driver_id = NEW.driver_id,
        updated_at = timezone('utc'::text, now())
    WHERE order_id = NEW.order_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_commission_driver_trigger ON public.deliveries;
CREATE TRIGGER update_commission_driver_trigger
    AFTER INSERT OR UPDATE ON public.deliveries
    FOR EACH ROW 
    WHEN (NEW.driver_id IS NOT NULL)
    EXECUTE FUNCTION update_commission_driver();
