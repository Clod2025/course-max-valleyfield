import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Setting {
  id: string;
  key: string;
  value: any;
  category: string;
  description?: string;
  is_public: boolean;
}

export const useSettings = (category?: string) => {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('settings')
        .select('*')
        .eq('is_public', true);

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) throw error;

      setSettings(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des paramètres');
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    fetchSettings();
  }, [category, fetchSettings]);

  const getSettingByKey = (key: string) => {
    return settings.find(setting => setting.key === key);
  };

  const getSettingValue = (key: string, defaultValue: any = null) => {
    const setting = getSettingByKey(key);
    return setting ? setting.value : defaultValue;
  };

  return {
    settings,
    loading,
    error,
    getSettingByKey,
    getSettingValue,
    refetch: fetchSettings
  };
};
