import { create de la migration pour les nouvelles tables

    Créons d'abord la nouvelle migration pour les tables de commissions :
    
    ```sql:supabase/migrations/20250104000000_delivery_commissions_system.sql
    -- Migration pour le système de commissions de livraison
    -- Crée les tables delivery_commissions et platform_settings
    
    -- Table pour stocker les paramètres de la plateforme
    CREATE TABLE IF NOT EXISTS public.platform_settings (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        key TEXT NOT NULL UNIQUE,
        value JSONB NOT NULL,
        description TEXT,
        category TEXT DEFAULT 'general',
        is_public BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    );
    
    -- Table pour stocker les commissions de livraison
    CREATE TABLE IF NOT EXISTS public.delivery_commissions (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
        driver_id uuid REFERENCES public.profiles(user_id) ON DELETE SET NULL,
        delivery_fee DECIMAL(10,2) NOT NULL CHECK (delivery_fee >= 0),
        commission_percent DECIMAL(5,2) NOT NULL CHECK (commission_percent >= 0 AND commission_percent <= 100),
        platform_amount DECIMAL(10,2) NOT NULL CHECK (platform_amount >= 0),
        driver_amount DECIMAL(10,2) NOT NULL CHECK (driver_amount >= 0),
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    );
    
    -- Index pour optimiser les requêtes
    CREATE INDEX IF NOT EXISTS idx_delivery_commissions_order_id ON public.delivery_commissions(order_id);
    CREATE INDEX IF NOT EXISTS idx_delivery_commissions_driver_id ON public.delivery_commissions(driver_id);
    CREATE INDEX IF NOT EXISTS idx_delivery_commissions_created_at ON public.delivery_commissions(created_at);
    CREATE INDEX IF NOT EXISTS idx_platform_settings_key ON public.platform_settings(key);
    
    -- Trigger pour mettre à jour updated_at automatiquement
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = timezone('utc'::text, now());
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    
    CREATE TRIGGER update_platform_settings_updated_at 
        BEFORE UPDATE ON public.platform_settings 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
    CREATE TRIGGER update_delivery_commissions_updated_at 
        BEFORE UPDATE ON public.delivery_commissions 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
    -- Insérer le paramètre par défaut pour le pourcentage de commission (20%)
    INSERT INTO public.platform_settings (key, value, description, category, is_public)
    VALUES (
        'delivery_commission_percent',
        '20.0',
        'Pourcentage de commission prélevé par la plateforme sur les frais de livraison',
        'delivery',
        false
    ) ON CONFLICT (key) DO NOTHING;
    
    -- Insérer d'autres paramètres utiles
    INSERT INTO public.platform_settings (key, value, description, category, is_public)
    VALUES 
        ('min_delivery_fee', '3.99', 'Frais de livraison minimum', 'delivery', true),
        ('max_delivery_distance', '15.0', 'Distance maximale de livraison (km)', 'delivery', true),
        ('platform_name', '"CourseMax Valleyfield"', 'Nom de la plateforme', 'general', true)
    ON CONFLICT (key) DO NOTHING;
    
    -- Fonction pour calculer automatiquement les commissions
    CREATE OR REPLACE FUNCTION calculate_delivery_commission(
        p_order_id uuid,
        p_driver_id uuid DEFAULT NULL
    )
    RETURNS uuid AS $$
    DECLARE
        v_delivery_fee DECIMAL(10,2);
        v_commission_percent DECIMAL(5,2);
        v_platform_amount DECIMAL(10,2);
        v_driver_amount DECIMAL(10,2);
        v_commission_id uuid;
    BEGIN
        -- Récupérer les frais de livraison de la commande
        SELECT delivery_fee INTO v_delivery_fee
        FROM public.orders
        WHERE id = p_order_id;
        
        IF v_delivery_fee IS NULL THEN
            RAISE EXCEPTION 'Commande non trouvée ou frais de livraison non définis';
        END IF;
        
        -- Récupérer le pourcentage de commission
        SELECT CAST(value AS DECIMAL(5,2)) INTO v_commission_percent
        FROM public.platform_settings
        WHERE key = 'delivery_commission_percent';
        
        -- Si pas de paramètre trouvé, utiliser 20% par défaut
        IF v_commission_percent IS NULL THEN
            v_commission_percent := 20.0;
        END IF;
        
        -- Calculer les montants
        v_platform_amount := v_delivery_fee * (v_commission_percent / 100);
        v_driver_amount := v_delivery_fee - v_platform_amount;
        
        -- Insérer ou mettre à jour la commission
        INSERT INTO public.delivery_commissions (
            order_id,
            driver_id,
            delivery_fee,
            commission_percent,
            platform_amount,
            driver_amount
        ) VALUES (
            p_order_id,
            p_driver_id,
            v_delivery_fee,
            v_commission_percent,
            v_platform_amount,
            v_driver_amount
        )
        ON CONFLICT (order_id) DO UPDATE SET
            driver_id = EXCLUDED.driver_id,
            delivery_fee = EXCLUDED.delivery_fee,
            commission_percent = EXCLUDED.commission_percent,
            platform_amount = EXCLUDED.platform_amount,
            driver_amount = EXCLUDED.driver_amount,
            updated_at = timezone('utc'::text, now())
        RETURNING id INTO v_commission_id;
        
        RETURN v_commission_id;
    END;
    $$ LANGUAGE plpgsql;
    
    -- Contrainte unique pour éviter les doublons de commissions par commande
    ALTER TABLE public.delivery_commissions 
    ADD CONSTRAINT unique_commission_per_order UNIQUE (order_id);
    
    -- Politiques RLS (Row Level Security)
    ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.delivery_commissions ENABLE ROW LEVEL SECURITY;
    
    -- Politique pour platform_settings
    CREATE POLICY "Admin can manage platform settings" ON public.platform_settings
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE user_id = auth.uid() AND role = 'admin'
            )
        );
    
    CREATE POLICY "Public can read public settings" ON public.platform_settings
        FOR SELECT USING (is_public = true);
    
    -- Politiques pour delivery_commissions
    CREATE POLICY "Admin can view all commissions" ON public.delivery_commissions
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE user_id = auth.uid() AND role = 'admin'
            )
        );
    
    CREATE POLICY "Drivers can view their own commissions" ON public.delivery_commissions
        FOR SELECT USING (driver_id = auth.uid());
    
    CREATE POLICY "Admin can manage all commissions" ON public.delivery_commissions
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE user_id = auth.uid() AND role = 'admin'
            )
        );
    
    -- Trigger pour calculer automatiquement les commissions lors de la création d'une commande
    CREATE OR REPLACE FUNCTION auto_calculate_commission()
    RETURNS TRIGGER AS $$
    BEGIN
        -- Calculer la commission uniquement si la commande a des frais de livraison
        IF NEW.delivery_fee > 0 THEN
            PERFORM calculate_delivery_commission(NEW.id);
        END IF;
        
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    
    CREATE TRIGGER auto_calculate_commission_trigger
        AFTER INSERT ON public.orders
        FOR EACH ROW EXECUTE FUNCTION auto_calculate_commission();
    
    -- Trigger pour mettre à jour les commissions lorsqu'un livreur est assigné
    CREATE OR REPLACE FUNCTION update_commission_driver()
    RETURNS TRIGGER AS $$
    BEGIN
        -- Mettre à jour la commission avec le driver_id
        UPDATE public.delivery_commissions
        SET driver_id = NEW.driver_id,
            updated_at = timezone('utc'::text, now())
        WHERE order_id = NEW.order_id;
        
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    
    CREATE TRIGGER update_commission_driver_trigger
        AFTER INSERT OR UPDATE ON public.deliveries
        FOR EACH ROW 
        WHEN (NEW.driver_id IS NOT NULL)
        EXECUTE FUNCTION update_commission_driver();
    ```
    
    ## 2. Création de la fonction Supabase pour traiter les commissions
    Créons maintenant la fonction Supabase pour calculer les commissions :
    
    ```typescript:supabase/functions/calculate-commission/index.ts
    import { createClient } from 'https://esClient } from 'https://esbase/upabase-js@2.orsHeaders = {57.0'
    
    const corsHeaders = {gin
      'Access-Control-Allow-Origincess-ers': 'Control-Allow-Headers': 'nfo,authorization, x-client-info,y, content-type',acequestissionRequest: string;
      driver_id?: {
      order_id: string;
      driver_id?:eno.serve(async (req preflight requests
      if () => {
      // Handle CORS preflight requests
      if ()e(null {
        return new Response(null headers: corsHeaders });baseUrl =
        const supabaseUrl =.get('UPABASE_URL')exgjrr 'https://vexgjrrrgiqfjxwk;.supabase.co';viceRoleKey =
        const serviceRoleKey =t('E_ROLESUPABASE_SERVICE_ROLEvice_KEY');
    
        if (!serviceeKey) {
          throwle key not configure new Error('Service role key not configurenst supapabase = createClient(supaseUrl, serviceRoleKey,thshToken: falseRefreshToken: falsealse },
        });, persistSession: false },
        });rder driver_id quest = await req.}: CommissionRequest = await req.   return {
          returnnew Response(stringify({ error: 
            JSON.stringify({ error: required' }),00, headers:
            { status: 400, headers:corsHeaders, 'Content-ype': 'application/json'     );
        }consoleting commission for order:Calculating commission for order: les inform
        // Récupérer les informnst { data: commande
        const { data::= await supabase orderError } = await supabasefrom('orders')  .select('istatusd, delivery_fee, statusr')
          .eq('id', order)
          .single();||
    
        if (orderError ||e !order) {
          consolerder:',.error('Error fetching order:',Response orderError);
          return new Response   JSON.stringify({ errornot found' }),
            { status: 404,ers,  headers: { ...corsHeaders, 'Content-Type': 'application}
          );    }
    
        // Récer le pourmissioncentage de commissions
        const { data: commissionS paramètres
        const { data: commissionSor: settingError } = awaitse
          .from('   .selectplatform_settings')
          .select  .eq('key',yn_percent_commission_percent')
          .single();
    or)
        if (settingError)('Error {
          console.error('Error', settingError fetching commission setting:', settingErrorpas défaut si pasaramre tro const commuvé
        const commmmissionSettingissionPercent = commissionSettingtting.valueFloat(commissionSetting.value// Calculer les
        
        // Calculer leseryFeeants
        const deliveryFeery_fee.Float(order.delivery_fee.atformtoString());
        const platformveryFee * (/ 100);commissionPercent / 100); deliveryFee -driverAmount = deliveryFee -e platformAmount;
    
        consoleionculationivery Fee: ${deliv
          Delivery Fee: ${deliv   Commissionercent}%: ${commissionPercent}% ${platformAmount
          Platform Amount: ${platformAmountAmount: ${t}`
    
        // Vneérifier si uneiste commission existedéjà
        const {mmission } data: existingCommission } await supabase
          .s')from('delivery_commissions')select('id')', order
          .eq('order_id', order .single   letata commissionDatatingCommission
    
        if (existingCommission Metmmission existantetre à jour la commission existanteit supabase error } = await supabasecommissions
            .from('delivery_commissionste({        driverlivery_id,
              delivery      commissioneryFee,
              commission_percent: commissionPercent,  platformount,_amount: platformAmount,: driverAmount,
              driver_amount: driverAmount,   updated_at: new Date)    .eq('
            })
            .eq(' order_id)t()
            .
            .select()
            .ingle();
    
          if (error)rror {
            console.error('Error
            throw updating commission:', error);
            throw     comm = dataog('Commission updated successfully');
          console.log('Commission updated successfully');réer une nouvelle commission await
          const { data, error } = await       .from('      .insert({delivery_commissions')
            .insert({,
              delivery_fee: deliveryFee,
              driver_id,
              delivery_fee: deliveryFee,mmission_percent: commissionPerc platform_amount:er_amount: driverAmount platformAmount,
              driver_amount: driverAmountct() (
            .single();
    
          if (rror) {
            console.error error);('Error creating commission:', error);ommissionData = data;
            throw error;
          }
    
          commissionData = data;}
    
        return
          console.log('Commission created successfully');
        }
    
        returnmission: comm({
            success: true,
            commission: commery_fee: deliveryFee,issionData,
            calculation: {
              delivery_fee: deliveryFee, commission,
              platform_amount_: platformAmount,
              driver_t: driverAmount
            }   }),
          { status:00, headers: { ...corsHeaders, 'Content-Type':'application/json' } }or) {
    
      } catch (error) {unction
        console.error('Function new error:', error);
        return new{ Response(
          JSON.stringify({ status:.message }),
          { status:, headers: { ...corsHeaders, 'Content-Type':'application/json' } }  }
    });ation de la fonction pour les statistiques de commissions
    
    
    ```typescript:supabase/functions/commission-stats/index.ts
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
    
        // Arrondir les val


