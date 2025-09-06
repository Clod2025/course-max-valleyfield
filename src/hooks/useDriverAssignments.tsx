import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface DriverAssignment {
  id: string;
  store_id: string;
  order_ids: string[];
  available_drivers: string[];
  assigned_driver_id?: string;
  total_orders: number;
  total_value: number;
  status: 'pending' | 'accepted' | 'completed' | 'expired' | 'cancelled';
  expires_at: string;
  accepted_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  stores?: {
    name: string;
    address: string;
    city: string;
  };
  orders?: Array<{
    id: string;
    order_number: string;
    delivery_address: string;
    delivery_city: string;
    total_amount: number;
  }>;
}

export const useDriverAssignments = () => {
  const [assignments, setAssignments] = useState<DriverAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { profile } = useAuth();

  const fetchAssignments = async (status?: string) => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('driver_assignments')
        .select(`
          *,
          stores!inner(name, address, city),
          orders!inner(id, order_number, delivery_address, delivery_city, total_amount)
        `)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      // Si c'est un livreur, ne montrer que ses assignations
      if (profile?.role === 'livreur') {
        query = query.or(`assigned_driver_id.eq.${profile.user_id},available_drivers.cs.{${profile.user_id}}`);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setAssignments(data || []);
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors du chargement des assignations';
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

  const acceptAssignment = async (assignmentId: string) => {
    if (!profile || profile.role !== 'livreur') {
      toast({
        title: "Erreur",
        description: "Seuls les livreurs peuvent accepter des assignations",
        variant: "destructive"
      });
      return false;
    }

    try {
      const { data, error } = await supabase.functions.invoke('accept-assignment', {
        body: {
          assignment_id: assignmentId,
          driver_id: profile.user_id
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Succès",
          description: "Assignation acceptée avec succès",
        });
        
        // Rafraîchir la liste
        fetchAssignments();
        return true;
      } else {
        toast({
          title: "Erreur",
          description: data.message || "Impossible d'accepter l'assignation",
          variant: "destructive"
        });
        return false;
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de l\'acceptation de l\'assignation';
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive"
      });
      return false;
    }
  };

  const triggerAutoAssignment = async (orderId: string, storeId: string, deliveryAddress: string, deliveryCity: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('auto-assign-driver', {
        body: {
          order_id: orderId,
          store_id: storeId,
          delivery_address: deliveryAddress,
          delivery_city: deliveryCity
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Succès",
          description: `Notifications envoyées à ${data.available_drivers} livreur(s)`,
        });
        return data;
      } else {
        toast({
          title: "Information",
          description: data.message || "Aucun livreur disponible trouvé",
        });
        return data;
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de l\'assignation automatique';
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive"
      });
      return null;
    }
  };

  // Nettoyer les assignations expirées
  const cleanupExpiredAssignments = async () => {
    try {
      const { error } = await supabase.rpc('cleanup_expired_assignments');
      if (error) throw error;
      
      // Rafraîchir la liste
      fetchAssignments();
    } catch (err: any) {
      console.error('Error cleaning up expired assignments:', err);
    }
  };

  // Nettoyer automatiquement toutes les 5 minutes
  useEffect(() => {
    const interval = setInterval(cleanupExpiredAssignments, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return {
    assignments,
    loading,
    error,
    fetchAssignments,
    acceptAssignment,
    triggerAutoAssignment,
    cleanupExpiredAssignments
  };
};

export default useDriverAssignments;
