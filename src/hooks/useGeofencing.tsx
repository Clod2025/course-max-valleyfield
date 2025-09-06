import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DeliveryZoneInfo {
  in_zone: boolean;
  zone_id?: string;
  zone_name?: string;
  delivery_fee_modifier: number;
  max_distance: number;
}

export interface AddressValidation {
  valid: boolean;
  error?: string;
  distance_km?: number;
  max_distance_km?: number;
  zone_info?: DeliveryZoneInfo;
}

// Hook pour vérifier si une adresse est dans une zone de livraison
export const useCheckDeliveryZone = () => {
  return useMutation({
    mutationFn: async ({ longitude, latitude }: { longitude: number; latitude: number }): Promise<DeliveryZoneInfo> => {
      const { data, error } = await supabase.rpc('is_in_delivery_zone', {
        longitude,
        latitude,
      });

      if (error) throw error;
      return data;
    },
  });
};

// Hook pour valider une adresse de livraison complète
export const useValidateDeliveryAddress = () => {
  return useMutation({
    mutationFn: async ({ 
      longitude, 
      latitude, 
      storeId 
    }: { 
      longitude: number; 
      latitude: number; 
      storeId: string;
    }): Promise<AddressValidation> => {
      const { data, error } = await supabase.rpc('validate_delivery_address', {
        delivery_longitude: longitude,
        delivery_latitude: latitude,
        store_id: storeId,
      });

      if (error) throw error;
      return data;
    },
  });
};

// Hook pour calculer la distance entre deux points
export const useCalculateDistance = () => {
  return useMutation({
    mutationFn: async ({ 
      fromLon, 
      fromLat, 
      toLon, 
      toLat 
    }: { 
      fromLon: number; 
      fromLat: number; 
      toLon: number; 
      toLat: number;
    }): Promise<number> => {
      const { data, error } = await supabase.rpc('calculate_distance_km', {
        lon1: fromLon,
        lat1: fromLat,
        lon2: toLon,
        lat2: toLat,
      });

      if (error) throw error;
      return data;
    },
  });
};

// Fonction utilitaire pour le géocodage avec Mapbox (nécessite une clé API)
export const geocodeAddress = async (address: string, mapboxToken: string) => {
  const encodedAddress = encodeURIComponent(address);
  const response = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${mapboxToken}&country=CA&proximity=-74.1334,45.2482&limit=1`
  );

  if (!response.ok) {
    throw new Error('Erreur de géocodage');
  }

  const data = await response.json();
  
  if (!data.features || data.features.length === 0) {
    throw new Error('Adresse non trouvée');
  }

  const [longitude, latitude] = data.features[0].center;
  return {
    longitude,
    latitude,
    formatted_address: data.features[0].place_name,
  };
};