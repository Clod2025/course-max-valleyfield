import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Commission {
  id: string;
  order_id: string;
  driver_id: string | null;
  delivery_fee: number;
  commission_percent: number;
  platform_amount: number;
  driver_amount: number;
  status: 'pending' | 'paid' | 'cancelled';
  created_at: string;
  updated_at: string;
  orders?: {
    id: string;
    order_number: string;
    created_at: string;
    status: string;
  };
  profiles?: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
}

export interface CommissionStats {
  total_commissions: number;
  total_delivery_fees: number;
  total_platform_amount: number;
  total_driver_amount: number;
  average_commission_percent: number;
  by_status: {
    pending: number;
    paid: number;
    cancelled: number;
  };
  by_period: Record<string, any>;
  top_drivers: Array<{
    driver_id: string;
    name: string;
    email: string;
    total_amount: number;
    count: number;
  }>;
}

export const useCommissions = () => {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchCommissions = async (filters?: {
    driver_id?: string;
    start_date?: string;
    end_date?: string;
    status?: string;
  }) => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('delivery_commissions')
        .select(`
          *,
          orders!inner(
            id,
            order_number,
            created_at,
            status
          ),
          profiles(
            first_name,
            last_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (filters?.driver_id) {
        query = query.eq('driver_id', filters.driver_id);
      }

      if (filters?.start_date) {
        query = query.gte('created_at', filters.start_date);
      }

      if (filters?.end_date) {
        query = query.lte('created_at', filters.end_date);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setCommissions(data || []);
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors du chargement des commissions';
      setError(errorMessage);
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateCommission = async (orderId: string, driverId?: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('calculate-commission', {
        body: {
          order_id: orderId,
          driver_id: driverId
        }
      });

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Commission calculée avec succès",
      });

      return data;
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors du calcul de la commission';
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive"
      });
      throw err;
    }
  };

  const getCommissionStats = async (period: 'day' | 'week' | 'month' | 'year' = 'month', driverId?: string): Promise<CommissionStats | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('commission-stats', {
        body: {
          period,
          driver_id: driverId
        }
      });

      if (error) throw error;

      return data.stats;
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors du chargement des statistiques';
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive"
      });
      return null;
    }
  };

  const updateCommissionStatus = async (commissionId: string, status: 'pending' | 'paid' | 'cancelled') => {
    try {
      const { error } = await supabase
        .from('delivery_commissions')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', commissionId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Statut de la commission mis à jour",
      });

      // Rafraîchir les données
      fetchCommissions();
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de la mise à jour du statut';
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  return {
    commissions,
    loading,
    error,
    fetchCommissions,
    calculateCommission,
    getCommissionStats,
    updateCommissionStatus
  };
};

export default useCommissions;
