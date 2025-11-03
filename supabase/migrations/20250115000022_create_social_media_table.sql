-- Migration pour créer la table social_media
-- Date: 2025-01-15

-- Créer la table social_media
CREATE TABLE IF NOT EXISTS public.social_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram', 'twitter', 'linkedin', 'youtube', 'tiktok')),
    url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    icon_class TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Créer des index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_social_media_is_active ON public.social_media(is_active);
CREATE INDEX IF NOT EXISTS idx_social_media_platform ON public.social_media(platform);

-- Activer RLS (Row Level Security)
ALTER TABLE public.social_media ENABLE ROW LEVEL SECURITY;

-- Créer les politiques RLS
CREATE POLICY "Everyone can view active social media" ON public.social_media
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage social media" ON public.social_media
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Insérer des données par défaut
INSERT INTO public.social_media (platform, url, is_active, display_order, icon_class) VALUES
('facebook', 'https://facebook.com/coursemax', true, 1, 'fab fa-facebook'),
('instagram', 'https://instagram.com/coursemax', true, 2, 'fab fa-instagram'),
('twitter', 'https://twitter.com/coursemax', true, 3, 'fab fa-twitter'),
('linkedin', 'https://linkedin.com/company/coursemax', true, 4, 'fab fa-linkedin');

-- Commentaires
COMMENT ON TABLE public.social_media IS 'Table des réseaux sociaux de la plateforme';
COMMENT ON COLUMN public.social_media.platform IS 'Plateforme de réseau social';
COMMENT ON COLUMN public.social_media.url IS 'URL du profil sur la plateforme';
COMMENT ON COLUMN public.social_media.is_active IS 'Indique si le lien est actif';
COMMENT ON COLUMN public.social_media.display_order IS 'Ordre d''affichage dans l''interface';

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE 'Table social_media créée avec succès!';
    RAISE NOTICE 'Index créés pour optimiser les performances';
    RAISE NOTICE 'RLS activé avec politiques de sécurité';
    RAISE NOTICE 'Données par défaut insérées';
END $$;
