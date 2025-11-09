import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface DeliveryFeeRequest {
  store_id: string;
  client_address: string;
  client_city: string;
  client_postal_code?: string;
  order_id?: string;
}

export interface DeliveryFeeResponse {
  success: boolean;
  calculation: {
    distance_km: number;
    delivery_fee: number;
    estimated_duration_minutes: number;
    pricing_tier: string;
  };
  store_info: {
    id: string;
    name: string;
    address: string;
  };
  client_info: {
    address: string;
  };
  distance: {
    km: number;
    meters: number;
  };
  estimated_duration: {
    minutes: number;
    seconds: number;
  };
}

export const useDeliveryFee = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const calculateDeliveryFee = async (request: DeliveryFeeRequest): Promise<DeliveryFeeResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      console.log('Calculating delivery fee:', request);

      const { data, error: functionError } = await supabase.functions.invoke('calculate-delivery-fee', {
        body: request
      });

      if (functionError) {
        console.error('Function error:', functionError);
        throw new Error(functionError.message || 'Erreur lors du calcul des frais de livraison');
      }

      if (!data.success) {
        throw new Error(data.error || 'Erreur lors du calcul des frais de livraison');
      }

      console.log('Delivery fee calculated successfully:', data);

      toast({
        title: "Frais de livraison calculés",
        description: `${data.calculation.delivery_fee}$ pour ${data.calculation.distance_km} km (${data.calculation.pricing_tier})`,
      });

      return data;
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors du calcul des frais de livraison';
      setError(errorMessage);
      
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive"
      });

      return null;
    } finally {
      setLoading(false);
    }
  };

  const calculateMultipleDeliveryFees = async (requests: DeliveryFeeRequest[]): Promise<DeliveryFeeResponse[]> => {
    setLoading(true);
    setError(null);

    try {
      const results: DeliveryFeeResponse[] = [];
      
      // Calculer les frais en parallèle pour optimiser les performances
      const promises = requests.map(request => calculateDeliveryFee(request));
      const responses = await Promise.allSettled(promises);

      responses.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          results.push(result.value);
        } else {
          console.error(`Failed to calculate delivery fee for request ${index}:`, result);
        }
      });

      return results;
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors du calcul des frais de livraison multiples';
      setError(errorMessage);
      
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive"
      });

      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    calculateDeliveryFee,
    calculateMultipleDeliveryFees
  };
};

export default useDeliveryFee;
