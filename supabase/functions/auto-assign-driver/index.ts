import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';
import { corsHeaders, handleCorsPreflight, jsonResponse, errorResponse, requireUser } from '../_shared/security.ts';

// ==================== CONFIG ====================
const CONFIG = {
  MAX_DISTANCE_KM: 15,
  ORDER_GROUPING_WINDOW_MINUTES: 10,
  ASSIGNMENT_EXPIRY_MINUTES: 5,
  MAX_ACTIVE_DELIVERIES_PER_DRIVER: 3,
  NOTIFICATION_RETRY_ATTEMPTS: 2,
  MAX_DRIVERS_TO_NOTIFY: 10,
  GEOCODING_TIMEOUT_MS: 5000,
};

// ==================== MAIN HANDLER ====================
Deno.serve(async (req) => {
  const preflight = handleCorsPreflight(req);
  if (preflight) return preflight;

  const startTime = Date.now();
  let supabase: any = null;

  try {
    // ✅ Admin auth
    const authResult = await requireUser(req, { requireAdmin: true });
    if ('errorResponse' in authResult) return authResult.errorResponse;
    supabase = authResult.supabase;

    const body = await req.json();
    const validationError = validateRequest(body);
    if (validationError) return errorResponse(validationError, 400);

    const { order_id, store_id, delivery_address, delivery_city, delivery_postal_code } = body;

    const orderGroup = await groupOrdersByStore(store_id, supabase);
    if (!orderGroup || orderGroup.orders.length === 0) {
      return jsonResponse({ success: false, message: 'Aucune commande trouvée pour regroupement', order_id });
    }

    let deliveryCoordinates: GeocodingResult | null = null;
    const mapboxToken = Deno.env.get('MAPBOX_ACCESS_TOKEN');
    if (mapboxToken) {
      try {
        const fullAddress = [delivery_address, delivery_city, delivery_postal_code].filter(Boolean).join(', ');
        deliveryCoordinates = await geocodeAddress(fullAddress, mapboxToken);
      } catch { /* ignore geocoding failure */ }
    }

    const availableDrivers = await findAvailableDrivers(delivery_address, delivery_city, deliveryCoordinates, supabase);
    if (availableDrivers.length === 0) {
      await logAssignmentAttempt(orderGroup, [], 'no_drivers_available', supabase);
      return jsonResponse({ success: false, message: 'Aucun livreur disponible', order_group: orderGroup, delivery_city });
    }

    let notificationResults: NotificationResult = { successful: 0, failed: 0, errors: [] };
    const fcmServerKey = Deno.env.get('FCM_SERVER_KEY');
    if (fcmServerKey) {
      notificationResults = await sendDriverNotifications(orderGroup, availableDrivers.slice(0, CONFIG.MAX_DRIVERS_TO_NOTIFY), fcmServerKey);
    }

    const assignmentId = await createDriverAssignment(orderGroup, availableDrivers, notificationResults, supabase);
    await updateOrderStatuses(orderGroup.orders.map(o => o.id), 'awaiting_driver', supabase);

    return jsonResponse({
      success: true,
      message: 'Assignation automatique effectuée avec succès',
      assignment_id: assignmentId,
      order_group: {
        total_orders: orderGroup.total_orders,
        total_value: orderGroup.total_value,
        total_delivery_fees: orderGroup.total_delivery_fees
      },
      drivers: {
        available: availableDrivers.length,
        notified: Math.min(availableDrivers.length, CONFIG.MAX_DRIVERS_TO_NOTIFY),
        notifications_sent: notificationResults.successful,
        notifications_failed: notificationResults.failed
      },
      execution_time_ms: Date.now() - startTime
    });

  } catch (error) {
    console.error('Auto-assign-driver error:', error);
    return errorResponse('Erreur lors de l\'assignation automatique', 500);
  }
});

// ==================== VALIDATION ====================
function validateRequest(body: any): string | null {
  if (!body) return 'Request body is required';
  if (!body.order_id || typeof body.order_id !== 'string') return 'order_id required';
  if (!body.store_id || typeof body.store_id !== 'string') return 'store_id required';
  if (!body.delivery_address || typeof body.delivery_address !== 'string') return 'delivery_address required';
  if (!body.delivery_city || typeof body.delivery_city !== 'string') return 'delivery_city required';
  return null;
}

// ==================== TYPES ====================
interface DriverAssignmentRequest { order_id: string; store_id: string; delivery_address: string; delivery_city: string; delivery_postal_code?: string; }
interface AvailableDriver { user_id: string; first_name: string; last_name: string; phone: string; latitude: number; longitude: number; distance_km: number; fcm_token?: string; is_online?: boolean; active_deliveries?: number; }
interface OrderGroup { store_id: string; orders: Array<{ id: string; order_number: string; delivery_address: string; delivery_city: string; delivery_fee: number; total_amount: number; created_at: string; }>; total_orders: number; total_value: number; total_delivery_fees: number; }
interface NotificationResult { successful: number; failed: number; errors: Array<{ driver_id: string; error: string }>; }
interface GeocodingResult { latitude: number; longitude: number; formatted_address?: string; }

// ==================== UTILITIES ====================
async function groupOrdersByStore(storeId: string, supabase: any): Promise<OrderGroup | null> {
  const windowStart = new Date(Date.now() - CONFIG.ORDER_GROUPING_WINDOW_MINUTES * 60 * 1000).toISOString();
  const { data: orders } = await supabase.from('orders')
    .select('id,order_number,delivery_address,delivery_city,delivery_fee,total_amount,created_at')
    .eq('store_id', storeId)
    .in('status', ['confirmed','preparing'])
    .gte('created_at', windowStart)
    .is('assigned_driver_id', null)
    .order('created_at', { ascending: true });
  if (!orders || orders.length === 0) return null;
  return {
    store_id: storeId,
    orders,
    total_orders: orders.length,
    total_value: orders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0),
    total_delivery_fees: orders.reduce((sum, o) => sum + parseFloat(o.delivery_fee || 0), 0)
  };
}

async function findAvailableDrivers(deliveryAddress: string, deliveryCity: string, coords: GeocodingResult | null, supabase: any): Promise<AvailableDriver[]> {
  let query = supabase.from('profiles').select('user_id,first_name,last_name,phone,latitude,longitude,fcm_token,is_online')
    .eq('role','livreur').eq('is_active',true).eq('is_online',true);
  if (coords) query = query.not('latitude','is',null).not('longitude','is',null);
  const { data: drivers } = await query;
  if (!drivers) return [];
  const driverIds = drivers.map(d => d.user_id);
  const { data: activeCounts } = await supabase.from('orders')
    .select('assigned_driver_id').in('assigned_driver_id', driverIds)
    .in('status',['assigned','picked_up','in_transit']);
  const activeMap = new Map<string,number>();
  activeCounts?.forEach(r => activeMap.set(r.assigned_driver_id,(activeMap.get(r.assigned_driver_id)||0)+1));
  const available: AvailableDriver[] = [];
  for (const d of drivers) {
    const active = activeMap.get(d.user_id)||0;
    if (active >= CONFIG.MAX_ACTIVE_DELIVERIES_PER_DRIVER) continue;
    let distance = 0;
    if (coords && d.latitude && d.longitude) distance = calculateDistance(d.latitude,d.longitude,coords.latitude,coords.longitude);
    if (distance > CONFIG.MAX_DISTANCE_KM) continue;
    available.push({ ...d, distance_km: Math.round(distance*100)/100, active_deliveries: active });
  }
  return available.sort((a,b)=> (a.active_deliveries||0)-(b.active_deliveries||0) || a.distance_km-b.distance_km);
}

async function sendDriverNotifications(orderGroup: OrderGroup, drivers: AvailableDriver[], fcmKey: string): Promise<NotificationResult> {
  const results: NotificationResult = { successful: 0, failed: 0, errors: [] };
  await Promise.all(drivers.map(async d => {
    if (!d.fcm_token) { results.failed++; results.errors.push({ driver_id:d.user_id,error:'No FCM token'}); return; }
    for (let attempt=0; attempt<CONFIG.NOTIFICATION_RETRY_ATTEMPTS; attempt++){
      try {
        const notification = { to:d.fcm_token, notification:{title:`🚗 ${orderGroup.total_orders} commande(s)`, body:`💰 ${orderGroup.total_value.toFixed(2)}$ • 📍 ${orderGroup.orders[0].delivery_city}`}, data:{store_id:orderGroup.store_id,order_ids:JSON.stringify(orderGroup.orders.map(o=>o.id))}, priority:'high', time_to_live:CONFIG.ASSIGNMENT_EXPIRY_MINUTES*60 };
        const controller = new AbortController();
        const timeoutId = setTimeout(()=>controller.abort(),10000);
        const res = await fetch('https://fcm.googleapis.com/fcm/send',{method:'POST',headers:{'Authorization':`key=${fcmKey}`,'Content-Type':'application/json'},body:JSON.stringify(notification),signal:controller.signal});
        clearTimeout(timeoutId);
        if (res.ok){results.successful++; break;} else throw new Error(await res.text());
      } catch(e){if(attempt===CONFIG.NOTIFICATION_RETRY_ATTEMPTS-1){results.failed++; results.errors.push({driver_id:d.user_id,error:e.message});} else await new Promise(r=>setTimeout(r,1000*(attempt+1)));}}
  }));
  return results;
}

async function createDriverAssignment(orderGroup: OrderGroup, drivers: AvailableDriver[], notif: NotificationResult, supabase: any) {
  const expiresAt = new Date(Date.now()+CONFIG.ASSIGNMENT_EXPIRY_MINUTES*60*1000).toISOString();
  const { data } = await supabase.from('driver_assignments').insert({store_id:orderGroup.store_id,order_ids:orderGroup.orders.map(o=>o.id),available_drivers:drivers.map(d=>({user_id:d.user_id,distance_km:d.distance_km,active_deliveries:d.active_deliveries})),total_orders:orderGroup.total_orders,total_value:orderGroup.total_value,total_delivery_fees:orderGroup.total_delivery_fees,notifications_sent:notif.successful,notifications_failed:notif.failed,status:'pending',expires_at:expiresAt,created_at:new Date().toISOString()}).select('id').single();
  return data.id;
}

async function updateOrderStatuses(orderIds:string[], status:string, supabase:any){
  await supabase.from('orders').update({status,updated_at:new Date().toISOString()}).in('id',orderIds);
}

async function logAssignmentAttempt(orderGroup:OrderGroup, drivers:AvailableDriver[], reason:string,supabase:any){
  await supabase.from('assignment_logs').insert({store_id:orderGroup.store_id,order_count:orderGroup.total_orders,driver_count:drivers.length,failure_reason:reason,created_at:new Date().toISOString()});
}

async function geocodeAddress(address:string,mapboxToken:string):Promise<GeocodingResult>{
  const controller = new AbortController();
  const timeoutId = setTimeout(()=>controller.abort(),CONFIG.GEOCODING_TIMEOUT_MS);
  const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${mapboxToken}&limit=1&country=CA`,{signal:controller.signal});
  clearTimeout(timeoutId);
  if(!res.ok) throw new Error(`Geocoding API returned ${res.status}`);
  const data = await res.json();
  if(!data.features?.length) throw new Error('No coordinates found');
  const [lng,lat]=data.features[0].center;
  return {latitude:lat,longitude:lng,formatted_address:data.features[0].place_name};
}

function calculateDistance(lat1:number,lon1:number,lat2:number,lon2:number):number{
  const R=6371,dLat=toRadians(lat2-lat1),dLon=toRadians(lon2-lon1);
  const a=Math.sin(dLat/2)**2+Math.cos(toRadians(lat1))*Math.cos(toRadians(lat2))*Math.sin(dLon/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}
function toRadians(deg:number){return deg*(Math.PI/180);}