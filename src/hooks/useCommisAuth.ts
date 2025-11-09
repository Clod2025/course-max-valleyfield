import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CommisAccount {
  id: string;
  user_id: string | null;
  nom: string;
  prenom: string;
  email: string;
  code_unique: string;
  role: string;
  store_id: string | null;
  must_change_password: boolean;
  is_active: boolean;
  merchant_id: string;
}

interface UseCommisAuthReturn {
  commis: CommisAccount | null;
  loading: boolean;
  error: string | null;
  mustChangePassword: boolean;
  login: (identifier: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const useCommisAuth = (): UseCommisAuthReturn => {
  const [commis, setCommis] = useState<CommisAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCurrentCommis = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setCommis(null);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('commis')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (fetchError) {
        const message = fetchError?.message?.toLowerCase() ?? '';
        const isMissingColumn = fetchError.code === '42703' || message.includes('column');
        const isMissingUserId = isMissingColumn && message.includes('user_id');
        const isMissingIsActive = isMissingColumn && message.includes('is_active');

        if (isMissingIsActive) {
          const { data: noActiveFilterData, error: noActiveFilterError } = await supabase
            .from('commis')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

          if (!noActiveFilterError && noActiveFilterData) {
            if (typeof noActiveFilterData.is_active === 'undefined' || noActiveFilterData.is_active === null) {
              try {
                await supabase
                  .from('commis')
                  .update({ is_active: true })
                  .eq('id', noActiveFilterData.id);
                noActiveFilterData.is_active = true;
              } catch (updateErr) {
                console.warn('Impossible de mettre à jour is_active pour le commis', updateErr);
              }
            }

            setCommis(noActiveFilterData as CommisAccount);
            return;
          }
        }

        if (isMissingUserId && user.email) {
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('commis')
            .select('*')
            .eq('email', user.email.toLowerCase())
            .maybeSingle();

          if (!fallbackError && fallbackData) {
            if (!fallbackData.user_id) {
              try {
                await supabase
                  .from('commis')
                  .update({ user_id: user.id })
                  .eq('id', fallbackData.id);
                fallbackData.user_id = user.id;
              } catch (updateErr) {
                console.warn('Impossible de mettre à jour user_id pour le commis', updateErr);
              }
            }

            if (typeof fallbackData.is_active === 'undefined' || fallbackData.is_active === null) {
              fallbackData.is_active = true;
            }

            setCommis(fallbackData as CommisAccount);
            return;
          }
        }

        throw fetchError;
      }

      setCommis(data ?? null);
    } catch (err: any) {
      console.error('Failed to fetch commis session', err);
      setCommis(null);
      setError(err?.message || 'Impossible de récupérer la session commis');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentCommis();
  }, [fetchCurrentCommis]);

  const login = useCallback(async (identifier: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      let email = identifier.trim();
      if (!email.includes('@')) {
        const { data: resolvedEmail, error: resolveError } = await supabase.rpc('commis_resolve_email', {
          p_code: identifier,
          p_password: password,
        });

        if (resolveError) {
          throw resolveError;
        }

        email = String(resolvedEmail);
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password,
      });

      if (signInError) {
        throw signInError;
      }

      await fetchCurrentCommis();
      return true;
    } catch (err: any) {
      console.error('Commis login failed', err);
      setError(err?.message || 'Connexion commis impossible');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchCurrentCommis]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setCommis(null);
  }, []);

  const refresh = useCallback(async () => {
    await fetchCurrentCommis();
  }, [fetchCurrentCommis]);

  return useMemo(() => ({
    commis,
    loading,
    error,
    mustChangePassword: Boolean(commis?.must_change_password),
    login,
    logout,
    refresh,
  }), [commis, loading, error, login, logout, refresh]);
};

