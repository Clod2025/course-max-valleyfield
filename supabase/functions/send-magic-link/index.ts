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

    const { email, redirectUrl } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ success: false, status: 'error', message: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Generating magic link for: ${email}`);

    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: redirectUrl ? { redirectTo: redirectUrl } : undefined,
    } as any);

    if (error) {
      console.error('Error generating magic link:', error);
      return new Response(
        JSON.stringify({ success: false, status: 'error', message: error.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const response = {
      success: true,
      status: 'success',
      message: 'Magic link generated',
      user: { id: data?.user?.id, email: data?.user?.email },
      action_link: (data as any)?.action_link,
      email_otp: (data as any)?.email_otp,
    };

    console.log('Magic link result:', response);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Function error (send-magic-link):', error);
    return new Response(
      JSON.stringify({ success: false, status: 'error', message: (error as any).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});