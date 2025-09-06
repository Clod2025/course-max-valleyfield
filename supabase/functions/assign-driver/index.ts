import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DriverAssignmentRequest {
  order_id: string;
  store_id: string;
  delivery_address: string;
  delivery_city: string;
  delivery_postal_code?: string;
  max_distance_km?: number;
}

interface AvailableDriver {
  user_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  latitude: number;
  longitude: number;
  distance_km: number;
  fcm_token?: string;
  rating?: number;
  total_deliveries?: number;
}

interface DriverAssignmentResult {
  success: boolean;
  assigned_driver?: AvailableDriver;
  available_drivers: AvailableDriver[];
  notifications_sent: number;
  message: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://vexgjrrqbjurgiqfjxwk.supabase.co';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const fcmServerKey = Deno.env.get('FCM_SERVER_KEY');
    const mapboxToken = Deno.env.get('MAPBOX_ACCESS_TOKEN');

    if (!serviceRoleKey) {
      throw new Error('Service role key not configured');
    }

    if (!fcmServerKey) {
      throw new Error('FCM server key not configured');
    }

    if (!mapboxToken) {
      throw new Error('Mapbox access token not configured');
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { 
      order_id, 
      store_id, 
      delivery_address, 
      delivery_city, 
      delivery_postal_code,
      max_distance_km = 15 
    }: DriverAssignmentRequest = await req.json();

    if (!order_id || !store_id || !delivery_address || !delivery_city) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'order_id, store_id, delivery_address, and delivery_city are required' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Assigning driver for order: ${order_id}`);

    // 1. Vérifier que la commande existe et est en attente
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, order_number, status, store_id, total_amount, delivery_fee')
      .eq('id', order_id)
      .eq('status', 'confirmed')
      .single();

    if (orderError || !order) {
      throw new Error('Order not found or not in confirmed status');
    }

    // 2. Récupérer les informations du magasin
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id, name, address, city, latitude, longitude')
      .eq('id', store_id)
      .single();

    if (storeError || !store) {
      throw new Error('Store not found');
    }

    // 3. Trouver les livreurs disponibles proches
    const availableDrivers = await findAvailableDrivers(
      store.latitude || 0, 
      store.longitude || 0, 
      delivery_address, 
      delivery_city, 
      max_distance_km, 
      supabase, 
      mapboxToken
    );

    if (availableDrivers.length === 0) {
      console.log('No available drivers found');
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Aucun livreur disponible trouvé dans la zone',
          available_drivers: [],
          notifications_sent: 0
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${availableDrivers.length} available drivers`);

    // 4. Envoyer les notifications push aux livreurs les plus proches (max 5)
    const topDrivers = availableDrivers.slice(0, 5);
    const notificationResults = await sendDriverNotifications(
      order, 
      store, 
      topDrivers, 
      fcmServerKey
    );

    // 5. Créer une entrée dans la table driver_assignments pour le suivi
    const assignmentId = await createDriverAssignment(
      order, 
      store, 
      topDrivers, 
      supabase
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Notifications envoyées aux livreurs disponibles',
        order_id: order.id,
        order_number: order.order_number,
        store_name: store.name,
        available_drivers: availableDrivers.length,
        notifications_sent: notificationResults.successful,
        notifications_failed: notificationResults.failed,
        assignment_id: assignmentId,
        drivers_notified: topDrivers.map(d => ({
          user_id: d.user_id,
          name: `${d.first_name} ${d.last_name}`,
          distance_km: d.distance_km,
          rating: d.rating
        }))
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Fonction pour trouver les livreurs disponibles avec calcul de distance via Mapbox
async function findAvailableDrivers(
  storeLat: number, 
  storeLon: number, 
  deliveryAddress: string, 
  deliveryCity: string, 
  maxDistance: number, 
  supabase: any, 
  mapboxToken: string
): Promise<AvailableDriver[]> {
  try {
    // Récupérer les livreurs actifs avec leur localisation
    const { data: drivers, error } = await supabase
      .from('profiles')
      .select(`
        user_id,
        first_name,
        last_name,
        phone,
        latitude,
        longitude,
        fcm_token,
        rating,
        total_deliveries
      `)
      .eq('role', 'livreur')
      .eq('is_active', true)
      .eq('is_available', true)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);

    if (error) throw error;

    if (!drivers || drivers.length === 0) {
      return [];
    }

    // Géocoder l'adresse de livraison
    const deliveryCoordinates = await geocodeAddress(`${deliveryAddress}, ${deliveryCity}`, mapboxToken);
    
    // Calculer la distance pour chaque livreur via Mapbox Distance Matrix API
    const availableDrivers: AvailableDriver[] = [];
    
    for (const driver of drivers) {
      try {
        const distance = await calculateDistanceViaMapbox(
          driver.latitude,
          driver.longitude,
          deliveryCoordinates.latitude,
          deliveryCoordinates.longitude,
          mapboxToken
        );
        
        if (distance <= maxDistance) {
          availableDrivers.push({
            user_id: driver.user_id,
            first_name: driver.first_name || '',
            last_name: driver.last_name || '',
            phone: driver.phone || '',
            latitude: driver.latitude,
            longitude: driver.longitude,
            distance_km: Math.round(distance * 100) / 100,
            fcm_token: driver.fcm_token,
            rating: driver.rating || 0,
            total_deliveries: driver.total_deliveries || 0
          });
        }
      } catch (error) {
        console.error(`Error calculating distance for driver ${driver.user_id}:`, error);
        // En cas d'erreur, utiliser la distance à vol d'oiseau
        const directDistance = calculateDirectDistance(
          driver.latitude,
          driver.longitude,
          deliveryCoordinates.latitude,
          deliveryCoordinates.longitude
        );
        
        if (directDistance <= maxDistance) {
          availableDrivers.push({
            user_id: driver.user_id,
            first_name: driver.first_name || '',
            last_name: driver.last_name || '',
            phone: driver.phone || '',
            latitude: driver.latitude,
            longitude: driver.longitude,
            distance_km: Math.round(directDistance * 100) / 100,
            fcm_token: driver.fcm_token,
            rating: driver.rating || 0,
            total_deliveries: driver.total_deliveries || 0
          });
        }
      }
    }

    // Trier par distance et rating (plus proche et mieux noté en premier)
    return availableDrivers.sort((a, b) => {
      const distanceDiff = a.distance_km - b.distance_km;
      if (Math.abs(distanceDiff) < 1) { // Si la distance est similaire, trier par rating
        return (b.rating || 0) - (a.rating || 0);
      }
      return distanceDiff;
    });
  } catch (error) {
    console.error('Error finding available drivers:', error);
    throw error;
  }
}

// Fonction pour envoyer les notifications push
async function sendDriverNotifications(
  order: any,
  store: any,
  drivers: AvailableDriver[],
  fcmServerKey: string
): Promise<{ successful: number; failed: number }> {
  const results = { successful: 0, failed: 0 };

  for (const driver of drivers) {
    if (!driver.fcm_token) {
      results.failed++;
      continue;
    }

    try {
      const notification = {
        to: driver.fcm_token,
        notification: {
          title: `�� Nouvelle livraison disponible`,
          body: `Commande #${order.order_number} • ${store.name} • ${driver.distance_km}km • ${order.total_amount}$`,
          icon: '/lovable-uploads/482dd564-f9a1-48f4-bef4-6569e9c64c0b.png',
          sound: 'default'
        },
        data: {
          type: 'delivery_assignment',
          order_id: order.id,
          order_number: order.order_number,
          store_id: store.id,
          store_name: store.name,
          total_amount: order.total_amount.toString(),
          delivery_fee: order.delivery_fee.toString(),
          distance_km: driver.distance_km.toString(),
          action: 'accept_delivery'
        },
        priority: 'high',
        time_to_live: 300 // 5 minutes
      };

      const response = await fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'POST',
        headers: {
          'Authorization': `key=${fcmServerKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(notification)
      });

      if (response.ok) {
        results.successful++;
        console.log(`Notification sent to driver ${driver.user_id}`);
      } else {
        results.failed++;
        console.error(`Failed to send notification to driver ${driver.user_id}:`, response.statusText);
      }
    } catch (error) {
      results.failed++;
      console.error(`Error sending notification to driver ${driver.user_id}:`, error);
    }
  }

  return results;
}

// Fonction pour créer une assignation de livreur
async function createDriverAssignment(
  order: any,
  store: any,
  drivers: AvailableDriver[],
  supabase: any
): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('driver_assignments')
      .insert({
        order_id: order.id,
        store_id: store.id,
        available_drivers: drivers.map(d => d.user_id),
        total_amount: order.total_amount,
        delivery_fee: order.delivery_fee,
        status: 'pending',
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes
      })
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  } catch (error) {
    console.error('Error creating driver assignment:', error);
    throw error;
  }
}

// Fonction utilitaire pour géocoder une adresse via Mapbox
async function geocodeAddress(address: string, mapboxToken: string): Promise<{ latitude: number; longitude: number }> {
  const response = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${mapboxToken}&limit=1&country=CA`
  );
  
  if (!response.ok) {
    throw new Error('Geocoding failed');
  }
  
  const data = await response.json();
  
  if (!data.features || data.features.length === 0) {
    throw new Error('No coordinates found for address');
  }
  
  const [longitude, latitude] = data.features[0].center;
  return { latitude, longitude };
}

// Fonction pour calculer la distance via Mapbox Distance Matrix API
async function calculateDistanceViaMapbox(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number, 
  mapboxToken: string
): Promise<number> {
  const response = await fetch(
    `https://api.mapbox.com/directions-matrix/v1/mapbox/driving/${lon1},${lat1};${lon2},${lat2}?access_token=${mapboxToken}&sources=0&destinations=1`
  );
  
  if (!response.ok) {
    throw new Error('Distance calculation failed');
  }
  
  const data = await response.json();
  
  if (!data.distances || !data.distances[0] || !data.distances[0][1]) {
    throw new Error('No distance data available');
  }
  
  // Convertir de mètres en kilomètres
  return data.distances[0][1] / 1000;
}

// Fonction utilitaire pour calculer la distance directe (à vol d'oiseau)
function calculateDirectDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
