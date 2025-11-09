import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

export type MerchantStore = Tables<'stores'>;

export interface MerchantStoreFormValues {
  id?: string;
  name: string;
  description?: string | null;
  address: string;
  city: string;
  postal_code?: string | null;
  phone?: string | null;
  email?: string | null;
  opening_hours?: Record<string, any> | null;
  delivery_radius?: number | null;
  delivery_fee?: number | null;
  minimum_order?: number | null;
  accepts_orders?: boolean | null;
  is_active?: boolean | null;
  logo_url?: string | null;
  banner_url?: string | null;
}

interface UseMerchantStoreOptions {
  ownerId?: string | null;
  autoFetch?: boolean;
}

export const useMerchantStore = ({ ownerId, autoFetch = true }: UseMerchantStoreOptions) => {
  const [store, setStore] = useState<MerchantStore | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const effectiveOwnerId = useMemo(() => ownerId ?? undefined, [ownerId]);

  const fetchStore = useCallback(async () => {
    if (!effectiveOwnerId) {
      setStore(null);
      return null;
    }

    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('manager_id', effectiveOwnerId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      setError(error.message);
      setStore(null);
    } else {
      setStore(data ?? null);
    }

    setLoading(false);
    return data ?? null;
  }, [effectiveOwnerId]);

  useEffect(() => {
    if (autoFetch) {
      fetchStore();
    }
  }, [autoFetch, fetchStore]);

  const upsertStore = useCallback(
    async (values: MerchantStoreFormValues) => {
      if (!effectiveOwnerId) {
        const errorMessage = 'Identifiant du marchand manquant';
        setError(errorMessage);
        return { error: errorMessage };
      }

      setSaving(true);
      setError(null);

      const openingHoursValue = (() => {
        if (values.opening_hours === undefined) {
          return store?.opening_hours ?? null;
        }

        if (values.opening_hours === null) {
          return null;
        }

        try {
          return JSON.stringify(values.opening_hours);
        } catch (err) {
          console.error('Failed to stringify opening hours', err);
          return JSON.stringify(values.opening_hours);
        }
      })();

      const payload: Partial<TablesInsert<'stores'>> = {
        id: values.id || store?.id,
        manager_id: effectiveOwnerId,
        name: values.name,
        description: values.description ?? store?.description ?? null,
        address: values.address,
        city: values.city,
        postal_code: values.postal_code ?? store?.postal_code ?? '',
        phone: values.phone ?? store?.phone ?? '',
        email: values.email ?? store?.email ?? '',
        opening_hours: openingHoursValue,
        minimum_order: values.minimum_order ?? store?.minimum_order ?? 25,
        delivery_fee: values.delivery_fee ?? store?.delivery_fee ?? 5.99,
        store_type: store?.store_type ?? 'grocery',
        logo_url: values.logo_url ?? store?.logo_url ?? null,
        banner_url: values.banner_url ?? store?.banner_url ?? null,
      };

      const cleanedPayload = Object.fromEntries(
        Object.entries(payload).filter(([, value]) => value !== undefined)
      );

      const { data, error } = await supabase
        .from('stores')
        .upsert(cleanedPayload, { onConflict: 'id' })
        .select()
        .maybeSingle();

      if (error) {
        console.error('Error saving store', error);
        setError(error.message);
        setSaving(false);
        return { error: error.message };
      }

      setStore(data ?? null);
      setSaving(false);
      return { data: data ?? null, error: null };
    },
    [effectiveOwnerId, store]
  );

  return {
    store,
    loading,
    saving,
    error,
    fetchStore,
    upsertStore,
  };
};

