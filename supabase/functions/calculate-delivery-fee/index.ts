import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DeliveryFeeRequest {
  store_id: string;
  client_address: string;
  client_city: string;
  client_postal_code?: string;
  order_id?: string;
}

interface MapboxResponse {
  routes: Array<{
    distance: number; // en mètres
    duration: number; // en secondes
  }>;
}

interface DeliveryFeeCalculation {
  distance_km: number;
  delivery_fee: number;
  estimated_duration_minutes: number;
  pricing_tier: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://vexgjrrqbjurgiqfjxwk.supabase.co';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const mapboxToken = Deno.env.get('MAPBOX_ACCESS_TOKEN');

    if (!serviceRoleKey) {
      throw new Error('Service role key not configured');
    }

    if (!mapboxToken) {
      throw new Error('Mapbox access token not configured');
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { store_id, client_address, client_city, client_postal_code, order_id }: DeliveryFeeRequest = await req.json();

    if (!store_id || !client_address || !client_city) {
      return new Response(
        JSON.stringify({ error: 'store_id, client_address, and client_city are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Calculating delivery fee for store: ${store_id}, address: ${client_address}`);

    // Récupérer les informations du magasin
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id, name, address, city, latitude, longitude')
      .eq('id', store_id)
      .single();

    if (storeError || !store) {
      console.error('Error fetching store:', storeError);
      return new Response(
        JSON.stringify({ error: 'Store not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Construire l'adresse complète du client
    const clientFullAddress = `${client_address}, ${client_city}${client_postal_code ? `, ${client_postal_code}` : ''}`;
    
    // Construire l'adresse complète du magasin
    const storeFullAddress = `${store.address}, ${store.city}`;

    console.log(`Store address: ${storeFullAddress}`);
    console.log(`Client address: ${clientFullAddress}`);

    // Si on a les coordonnées du magasin, les utiliser directement
    let storeCoordinates: string;
    if (store.latitude && store.longitude) {
      storeCoordinates = `${store.longitude},${store.latitude}`;
    } else {
      // Sinon, géocoder l'adresse du magasin
      storeCoordinates = await geocodeAddress(storeFullAddress, mapboxToken);
    }

    // Géocoder l'adresse du client
    const clientCoordinates = await geocodeAddress(clientFullAddress, mapboxToken);

    console.log(`Store coordinates: ${storeCoordinates}`);
    console.log(`Client coordinates: ${clientCoordinates}`);

    // Calculer la distance avec l'API Mapbox Distance Matrix
    const distanceData = await calculateDistance(storeCoordinates, clientCoordinates, mapboxToken);

    if (!distanceData || !distanceData.routes || distanceData.routes.length === 0) {
      throw new Error('Unable to calculate distance');
    }

    const distanceMeters = distanceData.routes[0].distance;
    const durationSeconds = distanceData.routes[0].duration;
    const distanceKm = distanceMeters / 1000;
    const durationMinutes = Math.round(durationSeconds / 60);

    console.log(`Distance: ${distanceKm.toFixed(2)} km, Duration: ${durationMinutes} minutes`);

    // Appliquer la logique tarifaire
    const deliveryFeeCalculation = calculateDeliveryFee(distanceKm, durationMinutes);

    // Si un order_id est fourni, mettre à jour la commande
    if (order_id) {
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          delivery_fee: deliveryFeeCalculation.delivery_fee,
          estimated_delivery: new Date(Date.now() + durationMinutes * 60 * 1000).toISOString()
        })
        .eq('id', order_id);

      if (updateError) {
        console.error('Error updating order:', updateError);
        // Ne pas faire échouer la requête si la mise à jour échoue
      } else {
        console.log('Order updated with delivery fee');
      }
    }

    const response = {
      success: true,
      calculation: deliveryFeeCalculation,
      store_info: {
        id: store.id,
        name: store.name,
        address: storeFullAddress
      },
      client_info: {
        address: clientFullAddress
      },
      distance: {
        km: Math.round(distanceKm * 100) / 100,
        meters: distanceMeters
      },
      estimated_duration: {
        minutes: durationMinutes,
        seconds: durationSeconds
      }
    };

    console.log('Delivery fee calculated successfully:', response);

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Fonction pour géocoder une adresse avec Mapbox
async function geocodeAddress(address: string, mapboxToken: string): Promise<string> {
  try {
    const encodedAddress = encodeURIComponent(address);
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${mapboxToken}&country=CA&limit=1`;
    
    console.log(`Geocoding address: ${address}`);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.features || data.features.length === 0) {
      throw new Error(`No coordinates found for address: ${address}`);
    }
    
    const [longitude, latitude] = data.features[0].center;
    console.log(`Geocoded ${address} to: ${longitude},${latitude}`);
    
    return `${longitude},${latitude}`;
  } catch (error) {
    console.error('Geocoding error:', error);
    throw new Error(`Failed to geocode address: ${address}`);
  }
}

// Fonction pour calculer la distance avec l'API Mapbox Distance Matrix
async function calculateDistance(origin: string, destination: string, mapboxToken: string): Promise<MapboxResponse> {
  try {
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${origin};${destination}?access_token=${mapboxToken}&geometries=geojson&overview=full`;
    
    console.log(`Calculating distance from ${origin} to ${destination}`);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Distance calculation failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.routes || data.routes.length === 0) {
      throw new Error('No route found between origin and destination');
    }
    
    return data;
  } catch (error) {
    console.error('Distance calculation error:', error);
    throw new Error('Failed to calculate distance');
  }
}

// Fonction pour calculer les frais de livraison selon les tranches
function calculateDeliveryFee(distanceKm: number, durationMinutes: number): DeliveryFeeCalculation {
  let deliveryFee: number;
  let pricingTier: string;

  if (distanceKm <= 3) {
    deliveryFee = 5.00;
    pricingTier = '0-3 km';
  } else if (distanceKm <= 6) {
    deliveryFee = 7.00;
    pricingTier = '3-6 km';
  } else if (distanceKm <= 10) {
    deliveryFee = 10.00;
    pricingTier = '6-10 km';
  } else {
    deliveryFee = 12.00;
    pricingTier = '10+ km';
  }

  // Ajouter un petit bonus pour les livraisons très longues (>15km)
  if (distanceKm > 15) {
    deliveryFee += 2.00;
    pricingTier += ' (bonus longue distance)';
  }

  return {
    distance_km: Math.round(distanceKm * 100) / 100,
    delivery_fee: deliveryFee,
    estimated_duration_minutes: durationMinutes,
    pricing_tier: pricingTier
  };
}
