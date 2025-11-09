import {
  errorResponse,
  handleCorsPreflight,
  jsonResponse,
  requireUser,
} from '../_shared/security.ts';

interface DeliveryFeeRequest {
  store_id: string;
  client_address: string;
  client_city: string;
  client_postal_code?: string;
  order_id?: string;
}

interface MapboxResponse {
  routes: Array<{
    distance: number;
    duration: number;
  }>;
}

interface DeliveryFeeCalculation {
  distance_km: number;
  delivery_fee: number;
  estimated_duration_minutes: number;
  pricing_tier: string;
}

Deno.serve(async (req) => {
  const cors = handleCorsPreflight(req);
  if (cors) {
    return cors;
  }

  try {
    const auth = await requireUser(req);
    if ('errorResponse' in auth) {
      return auth.errorResponse;
    }

    const { supabase } = auth;
    const mapboxToken = Deno.env.get('MAPBOX_ACCESS_TOKEN');

    if (!mapboxToken) {
      throw new Error('Mapbox access token not configured');
    }

    const {
      store_id,
      client_address,
      client_city,
      client_postal_code,
      order_id,
    }: DeliveryFeeRequest = await req.json();

    if (!store_id || !client_address || !client_city) {
      return errorResponse(
        'store_id, client_address, and client_city are required',
        400,
      );
    }

    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id, name, address, city, latitude, longitude')
      .eq('id', store_id)
      .single();

    if (storeError || !store) {
      return errorResponse('Store not found', 404);
    }

    const clientFullAddress = `${client_address}, ${client_city}${
      client_postal_code ? `, ${client_postal_code}` : ''
    }`;
    const storeFullAddress = `${store.address}, ${store.city}`;

    const storeCoordinates =
      store.latitude && store.longitude
        ? `${store.longitude},${store.latitude}`
        : await geocodeAddress(storeFullAddress, mapboxToken);

    const clientCoordinates = await geocodeAddress(
      clientFullAddress,
      mapboxToken,
    );

    const distanceData = await calculateDistance(
      storeCoordinates,
      clientCoordinates,
      mapboxToken,
    );

    if (!distanceData?.routes?.length) {
      throw new Error('Unable to calculate distance');
    }

    const distanceMeters = distanceData.routes[0].distance;
    const durationSeconds = distanceData.routes[0].duration;
    const distanceKm = distanceMeters / 1000;
    const durationMinutes = Math.round(durationSeconds / 60);

    const deliveryFeeCalculation = calculateDeliveryFee(
      distanceKm,
      durationMinutes,
    );

    if (order_id) {
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          delivery_fee: deliveryFeeCalculation.delivery_fee,
          estimated_delivery: new Date(
            Date.now() + durationMinutes * 60 * 1000,
          ).toISOString(),
        })
        .eq('id', order_id);

      if (updateError) {
        console.error('Error updating order:', updateError);
      }
    }

    return jsonResponse({
      success: true,
      calculation: deliveryFeeCalculation,
      store_info: {
        id: store.id,
        name: store.name,
        address: storeFullAddress,
      },
      client_info: {
        address: clientFullAddress,
      },
      distance: {
        km: Math.round(distanceKm * 100) / 100,
        meters: distanceMeters,
      },
      estimated_duration: {
        minutes: durationMinutes,
        seconds: durationSeconds,
      },
    });
  } catch (error) {
    console.error('Erreur calculate-delivery-fee:', error);
    const message =
      error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(message, 500);
  }
});

async function geocodeAddress(
  address: string,
  mapboxToken: string,
): Promise<string> {
  const encodedAddress = encodeURIComponent(address);
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${mapboxToken}&country=CA&limit=1`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Geocoding failed: ${response.statusText}`);
  }

  const data = await response.json();

  if (!data.features || data.features.length === 0) {
    throw new Error(`No coordinates found for address: ${address}`);
  }

  const [longitude, latitude] = data.features[0].center;
  return `${longitude},${latitude}`;
}

async function calculateDistance(
  origin: string,
  destination: string,
  mapboxToken: string,
): Promise<MapboxResponse> {
  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${origin};${destination}?access_token=${mapboxToken}&geometries=geojson&overview=full`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Distance calculation failed: ${response.statusText}`);
  }

  const data = await response.json();

  if (!data.routes || data.routes.length === 0) {
    throw new Error('No route found between origin and destination');
  }

  return data;
}

function calculateDeliveryFee(
  distanceKm: number,
  durationMinutes: number,
): DeliveryFeeCalculation {
  let deliveryFee: number;
  let pricingTier: string;

  if (distanceKm <= 3) {
    deliveryFee = 5.0;
    pricingTier = '0-3 km';
  } else if (distanceKm <= 6) {
    deliveryFee = 7.0;
    pricingTier = '3-6 km';
  } else if (distanceKm <= 10) {
    deliveryFee = 10.0;
    pricingTier = '6-10 km';
  } else {
    deliveryFee = 12.0;
    pricingTier = '10+ km';
  }

  if (distanceKm > 15) {
    deliveryFee += 2.0;
    pricingTier += ' (bonus longue distance)';
  }

  return {
    distance_km: Math.round(distanceKm * 100) / 100,
    delivery_fee: deliveryFee,
    estimated_duration_minutes: durationMinutes,
    pricing_tier: pricingTier,
  };
}
