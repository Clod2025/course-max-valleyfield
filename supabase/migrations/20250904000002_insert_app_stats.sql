-- Insérer les statistiques de l'application dans la table settings
INSERT INTO public.settings (key, value, category, description, is_public) VALUES
  ('app_rating', 4.9, 'reviews', 'Note moyenne de l''application', true),
  ('app_review_count', 120, 'reviews', 'Nombre total d''avis', true),
  ('app_review_highlights', '["Service exceptionnel", "Livraison rapide", "Très satisfait"]', 'reviews', 'Points forts des avis', true)
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = now();
