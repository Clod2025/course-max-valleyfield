import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://ton-front.com', // <- Remplace par ton front
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface StatsRequest {
  period?: 'day' | 'week' | 'month' | 'year';
  start_date?: string;
  end_date?: string;
  driver_id?: string;
}

Deno.serve(async (req) => {
  // Gestion CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Vérifier l'entête Authorization Bearer
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }
    const token = authHeader.replace('Bearer ', '').trim();

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    if (!SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Service role key not configured');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Vérifier JWT et récupérer l'utilisateur
    const { data: user, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user.user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401, headers: corsHeaders });
    }

    // Vérifier rôle admin dans la table profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden: admin only' }), { status: 403, headers: corsHeaders });
    }

    // Récupérer les paramètres
    const { period = 'month', start_date, end_date, driver_id }: StatsRequest = 
      req.method === 'POST' ? await req.json() : 
      Object.fromEntries(new URL(req.url).searchParams.entries());

    const now = new Date();
    const endDate = end_date || now.toISOString();
    let startDate: string;

    if (start_date) startDate = start_date;
    else {
      switch (period) {
        case 'day': startDate = new Date(now.setHours(0,0,0,0)).toISOString(); break;
        case 'week': 
          const weekStart = new Date(now); 
          weekStart.setDate(now.getDate() - now.getDay()); 
          weekStart.setHours(0,0,0,0);
          startDate = weekStart.toISOString(); break;
        case 'month': startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString(); break;
        case 'year': startDate = new Date(now.getFullYear(), 0, 1).toISOString(); break;
        default: startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      }
    }

    // Construire requête sécurisée
    let query = supabase
      .from('delivery_commissions')
      .select(`
        *,
        orders!inner(id, order_number, created_at, status),
        profiles(first_name, last_name, email)
      `)
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (driver_id) query = query.eq('driver_id', driver_id);

    const { data: commissions, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;

    // Calcul des statistiques
    const stats = {
      total_commissions: commissions?.length || 0,
      total_delivery_fees: 0,
      total_platform_amount: 0,
      total_driver_amount: 0,
      average_commission_percent: 0,
      by_status: { pending: 0, paid: 0, cancelled: 0 },
      top_drivers: [] as any[]
    };

    if (commissions?.length) {
      stats.total_delivery_fees = commissions.reduce((sum, c) => sum + parseFloat(c.delivery_fee.toString()), 0);
      stats.total_platform_amount = commissions.reduce((sum, c) => sum + parseFloat(c.platform_amount.toString()), 0);
      stats.total_driver_amount = commissions.reduce((sum, c) => sum + parseFloat(c.driver_amount.toString()), 0);
      stats.average_commission_percent = commissions.reduce((sum, c) => sum + parseFloat(c.commission_percent.toString()), 0) / commissions.length;

      // Stat par statut
      commissions.forEach(c => stats.by_status[c.status as keyof typeof stats.by_status]++);

      // Top drivers
      if (!driver_id) {
        const driverStats = new Map();
        commissions.forEach(c => {
          if (c.driver_id && c.profiles) {
            const id = c.driver_id;
            if (!driverStats.has(id)) driverStats.set(id, { driver_id: id, name: `${c.profiles.first_name} ${c.profiles.last_name}`, total_amount: 0, count: 0 });
            const driver = driverStats.get(id);
            driver.total_amount += parseFloat(c.driver_amount.toString());
            driver.count++;
          }
        });
        stats.top_drivers = Array.from(driverStats.values()).sort((a,b)=>b.total_amount-a.total_amount).slice(0,10);
      }
    }

    return new Response(JSON.stringify({ success: true, period, date_range: { start: startDate, end: endDate }, stats }), 
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    
  } catch (error: any) {
    console.error('Secure commission-stats error:', error);
    return new Response(JSON.stringify({ success: false, message: error.message || 'Internal server error' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});