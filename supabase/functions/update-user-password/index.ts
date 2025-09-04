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

    const { userId, email, newPassword } = await req.json();

    if (!newPassword) {
      return new Response(
        JSON.stringify({ success: false, status: 'error', message: 'newPassword is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let targetUserId = userId as string | undefined;

    if (!targetUserId && email) {
      // Resolve userId by email
      const { data: list, error: listError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (listError) {
        console.error('Error listing users:', listError);
        return new Response(
          JSON.stringify({ success: false, status: 'error', message: listError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const found = list.users?.find((u: any) => (u.email || '').toLowerCase() === String(email).toLowerCase());
      targetUserId = found?.id;
    }

    if (!targetUserId) {
      return new Response(
        JSON.stringify({ success: false, status: 'not_found', message: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Updating password for user: ${targetUserId}${email ? ` (${email})` : ''}`);

    const { data, error } = await supabase.auth.admin.updateUserById(targetUserId, { password: newPassword });

    if (error) {
      console.error('Error updating password:', error);
      return new Response(
        JSON.stringify({ success: false, status: 'error', message: error.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const response = {
      success: true,
      status: 'success',
      message: 'Password updated successfully',
      user: { id: data.user?.id, email: data.user?.email }
    };

    console.log('Update password result:', response);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Function error (update-user-password):', error);
    return new Response(
      JSON.stringify({ success: false, status: 'error', message: (error as any).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});