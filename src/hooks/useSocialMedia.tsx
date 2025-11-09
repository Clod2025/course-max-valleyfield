import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SocialMedia {
  id: string;
  platform: string;
  url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useSocialMedia = () => {
  const [socialMedias, setSocialMedias] = useState<SocialMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSocialMedias();
  }, []);

  const loadSocialMedias = async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading social media data...');
      
      const { data, error } = await supabase
        .from('social_media')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ Erreur chargement réseaux sociaux:', error);
        setSocialMedias([]);
        setError('Impossible de charger les réseaux sociaux');
        return;
      } else {
        setSocialMedias(data || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des réseaux sociaux');
      console.error('❌ Error loading social media:', err);
    } finally {
      setLoading(false);
    }
  };

  return { socialMedias, loading, error, refetch: loadSocialMedias };
};
