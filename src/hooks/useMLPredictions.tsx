import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { MLPrediction, DemandForecast, PeakHoursPrediction } from '@/types/ml';

// Hook pour récupérer les prédictions ML
export const useMLPredictions = (predictionType: string, limit: number = 10) => {
  return useQuery({
    queryKey: ['ml_predictions', predictionType, limit],
    queryFn: async (): Promise<MLPrediction[]> => {
      const { data, error } = await supabase
        .from('ml_predictions')
        .select('*')
        .eq('prediction_type', predictionType)
        .gte('valid_until', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes en cache
  });
};

// Hook spécialisé pour les prédictions de demande
export const useDemandForecast = (hours: number = 24) => {
  const { data: predictions } = useMLPredictions('demand_forecast', 1);
  
  const forecast: DemandForecast[] = React.useMemo(() => {
    if (!predictions?.[0]) return [];
    
    const prediction = predictions[0];
    return prediction.prediction?.forecast || [];
  }, [predictions]);

  return {
    forecast: forecast.slice(0, hours),
    isLoading: !predictions,
    lastUpdated: predictions?.[0]?.created_at,
  };
};

// Hook pour les heures de pointe prédites
export const usePeakHoursPrediction = () => {
  const { data: predictions } = useMLPredictions('peak_hours', 1);
  
  const peakHours: PeakHoursPrediction | null = React.useMemo(() => {
    if (!predictions?.[0]) return null;
    return predictions[0].prediction;
  }, [predictions]);

  return {
    peakHours,
    isLoading: !predictions,
    lastUpdated: predictions?.[0]?.created_at,
  };
};