import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface StatsRequest {
  period?: 'day' | 'week' | 'month' | 'year';
  start_date?: string;
  end_date?: string;
  driver_id?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://vexgjrrqbjurgiqfjxwk.supabase.co';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!serviceRoleKey) {
      throw new Error('Service role key not configured');
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { period = 'month', start_date, end_date, driver_id }: StatsRequest = 
      req.method === 'POST' ? await req.json() : 
      Object.fromEntries(new URL(req.url).searchParams.entries());

    console.log(`Fetching commission stats for period: ${period}`);

    // Calculer les dates de début et fin selon la période
    let startDate: string;
    let endDate: string;

    if (start_date && end_date) {
      startDate = start_date;
      endDate = end_date;
    } else {
      const now = new Date();
      endDate = now.toISOString();

      switch (period) {
        case 'day':
          startDate = new Date(now.setHours(0, 0, 0, 0)).toISOString();
          break;
        case 'week':
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - now.getDay());
          weekStart.setHours(0, 0, 0, 0);
          startDate = weekStart.toISOString();
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1).toISOString();
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      }
    }

    console.log(`Date range: ${startDate} to ${endDate}`);

    // Construire la requête de base
    let query = supabase
      .from('delivery_commissions')
      .select(`
        *,
        orders!inner(
          id,
          order_number,
          created_at,
          status
        ),
        profiles(
          first_name,
          last_name,
          email
        )
      `)
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    // Filtrer par livreur si spécifié
    if (driver_id) {
      query = query.eq('driver_id', driver_id);
    }

    const { data: commissions, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching commissions:', error);
      throw error;
    }

    // Calculer les statistiques
    const stats = {
      total_commissions: commissions?.length || 0,
      total_delivery_fees: 0,
      total_platform_amount: 0,
      total_driver_amount: 0,
      average_commission_percent: 0,
      by_status: {
        pending: 0,
        paid: 0,
        cancelled: 0
      },
      by_period: {} as Record<string, any>,
      top_drivers: [] as any[]
    };

    if (commissions && commissions.length > 0) {
      // Calculs des totaux
      stats.total_delivery_fees = commissions.reduce((sum, c) => sum + parseFloat(c.delivery_fee.toString()), 0);
      stats.total_platform_amount = commissions.reduce((sum, c) => sum + parseFloat(c.platform_amount.toString()), 0);
      stats.total_driver_amount = commissions.reduce((sum, c) => sum + parseFloat(c.driver_amount.toString()), 0);
      stats.average_commission_percent = commissions.reduce((sum, c) => sum + parseFloat(c.commission_percent.toString()), 0) / commissions.length;

      // Statistiques par statut
      commissions.forEach(c => {
        stats.by_status[c.status as keyof typeof stats.by_status]++;
      });

      // Grouper par période (jour/semaine selon la période demandée)
      const groupBy = period === 'day' ? 'hour' : period === 'week' ? 'day' : 'day';
      
      commissions.forEach(c => {
        const date = new Date(c.created_at);
        let key: string;
        
        if (groupBy === 'hour') {
          key = `${date.getHours()}:00`;
        } else {
          key = date.toISOString().split('T')[0]; // YYYY-MM-DD
        }
        
        if (!stats.by_period[key]) {
          stats.by_period[key] = {
            count: 0,
            total_platform_amount: 0,
            total_driver_amount: 0,
            total_delivery_fees: 0
          };
        }
        
        stats.by_period[key].count++;
        stats.by_period[key].total_platform_amount += parseFloat(c.platform_amount.toString());
        stats.by_period[key].total_driver_amount += parseFloat(c.driver_amount.toString());
        stats.by_period[key].total_delivery_fees += parseFloat(c.delivery_fee.toString());
      });

      // Top drivers (si pas de filtre par driver)
      if (!driver_id) {
        const driverStats = new Map();
        
        commissions.forEach(c => {
          if (c.driver_id && c.profiles) {
            const driverId = c.driver_id;
            if (!driverStats.has(driverId)) {
              driverStats.set(driverId, {
                driver_id: driverId,
                name: `${c.profiles.first_name || ''} ${c.profiles.last_name || ''}`.trim(),
                email: c.profiles.email,
                total_commissions: 0,
                total_amount: 0,
                count: 0
              });
            }
            
            const driver = driverStats.get(driverId);
            driver.total_amount += parseFloat(c.driver_amount.toString());
            driver.count++;
          }
        });
        
        stats.top_drivers = Array.from(driverStats.values())
          .sort((a, b) => b.total_amount - a.total_amount)
          .slice(0, 10);
      }
    }

    // Arrondir les valeurs numériques
    stats.total_delivery_fees = Math.round(stats.total_delivery_fees * 100) / 100;
    stats.total_platform_amount = Math.round(stats.total_platform_amount * 100) / 100;
    stats.total_driver_amount = Math.round(stats.total_driver_amount * 100) / 100;
    stats.average_commission_percent = Math.round(stats.average_commission_percent * 100) / 100;

    console.log('Commission stats calculated successfully');

    return new Response(
      JSON.stringify({
        success: true,
        period,
        date_range: {
          start: startDate,
          end: endDate
        },
        stats,
        raw_data: commissions
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
