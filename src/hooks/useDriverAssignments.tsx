import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

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
  
  // ✅ NOUVEAU: Protection contre les appels simultanés
  const isFetchingRef = useRef(false);
  // ✅ NOUVEAU: Protection contre les erreurs répétées
  const lastErrorRef = useRef<string | null>(null);
  const errorCountRef = useRef(0);

  // ✅ CORRECTION: Mémoriser fetchAssignments avec useCallback
  const fetchAssignments = useCallback(async (status?: string) => {
    // ✅ PROTECTION: Éviter les appels simultanés
    if (isFetchingRef.current) {
      console.log('⏸️ fetchAssignments déjà en cours, ignoré');
      return;
    }

    // ✅ PROTECTION: Si même erreur répétée, arrêter temporairement
    // ✅ CORRECTION: Utiliser lastErrorRef directement pour éviter les problèmes de closure
    if (lastErrorRef.current && errorCountRef.current > 3) {
      console.log('⏸️ Trop d\'erreurs répétées, arrêt temporaire');
      return;
    }

    isFetchingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      // ✅ CORRECTION : Ne joindre que stores qui a une relation FK valide
      let query = supabase
        .from('driver_assignments')
        .select(`
          *,
          stores(name, address, city)
        `)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      // Si c'est un livreur, ne montrer que ses assignations
      if (profile?.role === 'livreur' || profile?.role === 'driver') {
        query = query.or(`assigned_driver_id.eq.${profile.user_id},available_drivers.cs.{${profile.user_id}}`);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // ✅ CORRECTION MAJEURE: Ne PAS charger les orders directement
      // Car cela déclenche la récursion infinie dans les politiques RLS
      // Utiliser seulement les données déjà dans driver_assignments
      if (data && data.length > 0) {
        const enrichedData = data.map((assignment: any) => {
          // ✅ Utiliser les données déjà disponibles sans requête supplémentaire
          // Les order_ids sont déjà dans assignment.order_ids
          // On peut créer un objet orders minimaliste depuis les IDs
          if (assignment.order_ids && assignment.order_ids.length > 0) {
            assignment.orders = assignment.order_ids.map((orderId: string) => ({
              id: orderId,
              // Les autres infos seront chargées via une Edge Function si nécessaire
            }));
          }
          return assignment;
        });

        setAssignments(enrichedData);
        // ✅ Réinitialiser le compteur d'erreurs en cas de succès
        errorCountRef.current = 0;
        lastErrorRef.current = null;
      } else {
        setAssignments([]);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors du chargement des assignations';
      
      // ✅ Gestion améliorée des erreurs de récursion
      if (err.code === '42P17' || errorMessage.includes('infinite recursion')) {
        const recursionError = 'Erreur de configuration serveur: récursion infinie détectée. Contactez l\'administrateur.';
        setError(recursionError);
        console.error('❌ Erreur de récursion RLS détectée:', err);
        
        // ✅ Ne pas spammer l'utilisateur avec des toasts répétés
        if (errorCountRef.current === 0) {
          toast({
            title: "Erreur de configuration",
            description: "Problème de sécurité détecté. Veuillez contacter le support.",
            variant: "destructive"
          });
        }
        
        errorCountRef.current++;
        lastErrorRef.current = recursionError;
        
        // ✅ Arrêter les appels répétés après plusieurs erreurs
        if (errorCountRef.current > 3) {
          console.error('🛑 Arrêt des tentatives après erreurs répétées');
        }
      } else {
        setError(errorMessage);
        console.error('Erreur useDriverAssignments:', err);
        toast({
          title: "Erreur",
          description: errorMessage,
          variant: "destructive"
        });
        errorCountRef.current = 0;
      }
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [profile?.role, profile?.user_id, toast]); // ✅ Dépendances optimisées

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
