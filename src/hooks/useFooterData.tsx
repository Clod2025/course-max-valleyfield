import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface FooterData {
  phone: string;
  email: string;
  address: string;
  description: string;
  socialMedia: {
    facebook: string;
    instagram: string;
    twitter: string;
  };
  navigationLinks: Array<{
    label: string;
    url: string;
  }>;
  copyright: string;
}

const defaultFooterData: FooterData = {
  phone: '(450) 123-4567',
  email: 'support@coursemax.ca',
  address: 'Valleyfield, QC',
  description: 'La plateforme de livraison rapide qui connecte clients, livreurs et magasins à Valleyfield.',
  socialMedia: {
    facebook: '',
    instagram: '',
    twitter: ''
  },
  navigationLinks: [
    { label: 'Confidentialité', url: '/privacy' },
    { label: 'Conditions', url: '/terms' },
    { label: 'Aide', url: '/help' }
  ],
  copyright: '© 2024 CourseMax. Tous droits réservés.'
};

export const useFooterData = () => {
  const [footerData, setFooterData] = useState<FooterData>(defaultFooterData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFooterData();
  }, []);

  const loadFooterData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('category', 'footer')
        .eq('is_public', true);

      if (error) throw error;

      if (data && data.length > 0) {
        const footerSettings = data.reduce((acc, setting) => {
          acc[setting.key] = setting.value;
          return acc;
        }, {} as any);

        setFooterData(prev => ({
          ...prev,
          ...footerSettings
        }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des données du footer');
      console.error('Erreur lors du chargement des données du footer:', err);
    } finally {
      setLoading(false);
    }
  };

  return { footerData, loading, error, refetch: loadFooterData };
};
