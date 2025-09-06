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
}

interface OrderGroup {
  store_id: string;
  orders: Array<{
    id: string;
    order_number: string;
    delivery_address: string;
    delivery_city: string;
    delivery_fee: number;
    total_amount: number;
    created_at: string;
  }>;
  total_orders: number;
  total_value: number;
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

    if (!serviceRoleKey) {
      throw new Error('Service role key not configured');
    }

    if (!fcmServerKey) {
      throw new Error('FCM server key not configured');
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { order_id, store_id, delivery_address, delivery_city, delivery_postal_code }: DriverAssignmentRequest = await req.json();

    if (!order_id || !store_id) {
      return new Response(
        JSON.stringify({ error: 'order_id and store_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Auto-assigning driver for order: ${order_id}`);

    // 1. Regrouper les commandes du même magasin dans les 10 dernières minutes
    const orderGroup = await groupOrdersByStore(store_id, supabase);
    
    if (!orderGroup || orderGroup.orders.length === 0) {
      throw new Error('No orders found for grouping');
    }

    console.log(`Found ${orderGroup.orders.length} orders to group`);

    // 2. Trouver les livreurs disponibles proches
    const availableDrivers = await findAvailableDrivers(delivery_address, delivery_city, supabase);
    
    if (availableDrivers.length === 0) {
      console.log('No available drivers found');
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Aucun livreur disponible trouvé',
          order_group: orderGroup
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${availableDrivers.length} available drivers`);

    // 3. Envoyer les notifications push aux livreurs
    const notificationResults = await sendDriverNotifications(orderGroup, availableDrivers, fcmServerKey);

    // 4. Créer une entrée dans la table driver_assignments pour le suivi
    const assignmentId = await createDriverAssignment(orderGroup, availableDrivers, supabase);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Notifications envoyées aux livreurs',
        order_group: orderGroup,
        available_drivers: availableDrivers.length,
        notifications_sent: notificationResults.successful,
        notifications_failed: notificationResults.failed,
        assignment_id: assignmentId
      }),
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

// Fonction pour regrouper les commandes par magasin
async function groupOrdersByStore(storeId: string, supabase: any): Promise<OrderGroup | null> {
  try {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        delivery_address,
        delivery_city,
        delivery_fee,
        total_amount,
        created_at
      `)
      .eq('store_id', storeId)
      .eq('status', 'confirmed')
      .gte('created_at', tenMinutesAgo)
      .order('created_at', { ascending: true });

    if (error) throw error;

    if (!orders || orders.length === 0) {
      return null;
    }

    const totalValue = orders.reduce((sum, order) => sum + parseFloat(order.total_amount.toString()), 0);

    return {
      store_id: storeId,
      orders,
      total_orders: orders.length,
      total_value: totalValue
    };
  } catch (error) {
    console.error('Error grouping orders:', error);
    throw error;
  }
}

// Fonction pour trouver les livreurs disponibles
async function findAvailableDrivers(deliveryAddress: string, deliveryCity: string, supabase: any): Promise<AvailableDriver[]> {
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
        fcm_token
      `)
      .eq('role', 'livreur')
      .eq('is_active', true)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);

    if (error) throw error;

    if (!drivers || drivers.length === 0) {
      return [];
    }

    // Géocoder l'adresse de livraison pour calculer les distances
    const deliveryCoordinates = await geocodeAddress(`${deliveryAddress}, ${deliveryCity}`);
    
    // Calculer la distance pour chaque livreur et filtrer ceux à moins de 15km
    const availableDrivers: AvailableDriver[] = [];
    
    for (const driver of drivers) {
      const distance = calculateDistance(
        driver.latitude,
        driver.longitude,
        deliveryCoordinates.latitude,
        deliveryCoordinates.longitude
      );
      
      if (distance <= 15) { // 15km de rayon maximum
        availableDrivers.push({
          user_id: driver.user_id,
          first_name: driver.first_name || '',
          last_name: driver.last_name || '',
          phone: driver.phone || '',
          latitude: driver.latitude,
          longitude: driver.longitude,
          distance_km: Math.round(distance * 100) / 100,
          fcm_token: driver.fcm_token
        });
      }
    }

    // Trier par distance (plus proche en premier)
    return availableDrivers.sort((a, b) => a.distance_km - b.distance_km);
  } catch (error) {
    console.error('Error finding available drivers:', error);
    throw error;
  }
}

// Fonction pour envoyer les notifications push
async function sendDriverNotifications(
  orderGroup: OrderGroup, 
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
          title: `�� ${orderGroup.total_orders} commande(s) disponible(s)`,
          body: `${orderGroup.total_value.toFixed(2)}$ • ${orderGroup.orders[0].delivery_city} • ${driver.distance_km}km`,
          icon: '/lovable-uploads/482dd564-f9a1-48f4-bef4-6569e9c64c0b.png',
          sound: 'default'
        },
        data: {
          type: 'delivery_assignment',
          order_group_id: orderGroup.store_id,
          total_orders: orderGroup.total_orders.toString(),
          total_value: orderGroup.total_value.toString(),
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
  orderGroup: OrderGroup, 
  drivers: AvailableDriver[], 
  supabase: any
): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('driver_assignments')
      .insert({
        store_id: orderGroup.store_id,
        order_ids: orderGroup.orders.map(o => o.id),
        available_drivers: drivers.map(d => d.user_id),
        total_orders: orderGroup.total_orders,
        total_value: orderGroup.total_value,
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

// Fonction utilitaire pour géocoder une adresse
async function geocodeAddress(address: string): Promise<{ latitude: number; longitude: number }> {
  // Utiliser l'API de géocodage de votre choix (Google, Mapbox, etc.)
  // Pour cet exemple, on utilise une API simple
  const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${Deno.env.get('MAPBOX_ACCESS_TOKEN')}&limit=1`);
  
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

// Fonction utilitaire pour calculer la distance entre deux points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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
