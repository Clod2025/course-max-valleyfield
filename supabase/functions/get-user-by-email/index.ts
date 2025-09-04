import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
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

    const { email } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ success: false, status: 'error', message: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Looking up user by email: ${email}`);

    // Supabase Admin API doesn't provide getUserByEmail; list and filter
    const { data: list, error: listError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });

    if (listError) {
      console.error('Error listing users:', listError);
      return new Response(
        JSON.stringify({ success: false, status: 'error', message: listError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const found = list.users?.find((u: any) => (u.email || '').toLowerCase() === String(email).toLowerCase());

    const response = found
      ? { success: true, status: 'success', exists: true, user: { id: found.id, email: found.email } }
      : { success: true, status: 'not_found', exists: false, message: 'User not found' };

    console.log('Lookup result:', response);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Function error (get-user-by-email):', error);
    return new Response(
      JSON.stringify({ success: false, status: 'error', message: (error as any).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});