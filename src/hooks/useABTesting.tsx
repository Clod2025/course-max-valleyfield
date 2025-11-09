import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

// Générer un ID de session pour les utilisateurs non connectés
const getSessionId = (): string => {
  const stored = localStorage.getItem('coursemax_session_id');
  if (stored) return stored;
  
  const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  localStorage.setItem('coursemax_session_id', newSessionId);
  return newSessionId;
};

export interface ABExperiment {
  name: string;
  description?: string;
  is_active: boolean;
  variants: string[];
}

// Hook pour obtenir la variante d'un utilisateur
export const useABVariant = (experimentName: string) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['ab_variant', experimentName, user?.id || getSessionId()],
    queryFn: async (): Promise<string> => {
      const sessionId = user ? null : getSessionId();

      const { data, error } = await supabase.rpc('assign_ab_variant', {
        p_experiment_name: experimentName,
        p_session_id: sessionId,
      });

      if (error) throw error;
      return data;
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 heures - les assignations sont stables
    gcTime: 48 * 60 * 60 * 1000, // 48 heures en cache
    enabled: Boolean(experimentName),
  });
};

// Hook pour logger des événements A/B
export const useABEventTracking = () => {
  const { user } = useAuth();
  
  const logABEventMutation = useMutation({
    mutationFn: async ({
      experimentName,
      eventType,
      value = 0,
      metadata = {},
    }: {
      experimentName: string;
      eventType: string;
      value?: number;
      metadata?: any;
    }) => {
      const sessionId = user ? null : getSessionId();

      const { data, error } = await supabase.rpc('log_ab_event', {
        p_experiment_name: experimentName,
        p_event_type: eventType,
        p_value: value,
        p_metadata: metadata,
        p_session_id: sessionId,
      });

      if (error) throw error;
      return data;
    },
  });

  const logABEvent = (
    experimentName: string,
    eventType: string,
    value?: number,
    metadata?: any
  ) => {
    logABEventMutation.mutate({ experimentName, eventType, value, metadata });
  };

  // Fonctions spécialisées
  const logConversion = (experimentName: string, value: number, metadata?: any) => {
    logABEvent(experimentName, 'conversion', value, metadata);
  };

  const logClick = (experimentName: string, elementId?: string) => {
    logABEvent(experimentName, 'click', 1, { element_id: elementId });
  };

  const logView = (experimentName: string, duration?: number) => {
    logABEvent(experimentName, 'view', duration || 1);
  };

  return {
    logABEvent,
    logConversion,
    logClick,
    logView,
    isLoading: logABEventMutation.isPending,
  };
};

// Hook pour les expériences actives
export const useActiveExperiments = () => {
  return useQuery({
    queryKey: ['ab_experiments', 'active'],
    queryFn: async (): Promise<ABExperiment[]> => {
      const { data, error } = await supabase
        .from('ab_experiments')
        .select('name, description, is_active, variants')
        .eq('is_active', true);

      if (error) throw error;
      return data || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes en cache
  });
};
