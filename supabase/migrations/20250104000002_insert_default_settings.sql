-- Insérer les paramètres par défaut
INSERT INTO public.platform_settings (key, value, description, category, is_public)
VALUES 
    -- Paramètres de commission
    ('delivery_commission_percent', '20.0', 'Pourcentage de commission prélevé par la plateforme sur les frais de livraison', 'delivery', false),
    
    -- Paramètres de livraison
    ('min_delivery_fee', '3.99', 'Frais de livraison minimum', 'delivery', true),
    ('max_delivery_distance', '25.0', 'Distance maximale de livraison (km)', 'delivery', true),
    ('platform_name', '"CourseMax Valleyfield"', 'Nom de la plateforme', 'general', true),
    
    -- Paramètres Mapbox
    ('mapbox_access_token', '""', 'Token d''accès Mapbox pour le calcul des distances', 'delivery', false),
    
    -- Grille tarifaire
    ('delivery_fee_0_3km', '5.00', 'Frais de livraison pour 0-3 km', 'delivery', true),
    ('delivery_fee_3_6km', '7.00', 'Frais de livraison pour 3-6 km', 'delivery', true),
    ('delivery_fee_6_10km', '10.00', 'Frais de livraison pour 6-10 km', 'delivery', true),
    ('delivery_fee_10plus_km', '12.00', 'Frais de livraison pour 10+ km', 'delivery', true),
    ('delivery_fee_long_distance_bonus', '2.00', 'Bonus pour livraisons >15km', 'delivery', true),
    ('delivery_estimated_time_buffer_minutes', '15', 'Buffer de temps estimé (minutes)', 'delivery', true)
ON CONFLICT (key) DO NOTHING;
